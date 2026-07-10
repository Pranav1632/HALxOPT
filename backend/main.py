import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from optimizer import optimize_propulsion
from environment import UAVHybridEnv

app = FastAPI(
    title="Hybrid-Electric UAV Propulsion Optimization Simulator API",
    description="Backend optimization engine for a 1000 kg Fixed-Wing UAV",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptimizationRequest(BaseModel):
    target_speed: float = Field(..., description="Target cruise speed of the UAV in m/s", ge=10.0, le=100.0)
    target_altitude: float = Field(..., description="Target cruise altitude of the UAV in meters", ge=100.0, le=8000.0)
    payload_weight: float = Field(200.0, description="Payload weight in kg", ge=50.0, le=400.0)

class OptimalSpecs(BaseModel):
    engine_kw: float
    battery_kwh: float
    motor_kw: float
    endurance_hours: float
    empty_weight_kg: float
    fuel_weight_kg: float
    total_weight_kg: float

class TelemetryPoint(BaseModel):
    time: float
    altitude: float
    speed: float
    power_required: float
    power_delivered: float
    power_motor: float
    power_engine: float
    soc: float
    fuel: float
    weight: float
    phase: str
    deficit: float
    u: float

class OptimizationResponse(BaseModel):
    optimal_specs: OptimalSpecs
    telemetry: list[TelemetryPoint]

@app.post("/api/optimize", response_model=OptimizationResponse)
async def optimize_uav(req: OptimizationRequest):
    try:
        # 1. Run DEAP Genetic Algorithm Sizing Optimizer
        result = optimize_propulsion(
            target_speed=req.target_speed,
            target_altitude=req.target_altitude,
            payload_weight=req.payload_weight
        )
        
        # Extract best sizes
        opt_engine = result["engine_size_kw"]
        opt_battery = result["battery_capacity_kwh"]
        opt_motor = result["motor_size_kw"]
        
        # 2. Run high-fidelity final simulation (using dt=60.0 to generate clean telemetry)
        env = UAVHybridEnv(
            engine_size_kw=opt_engine,
            battery_capacity_kwh=opt_battery,
            motor_size_kw=opt_motor,
            target_speed=req.target_speed,
            target_altitude=req.target_altitude,
            payload_weight=req.payload_weight,
            use_dummy_policy=True,
            dt=60.0
        )
        
        obs, info = env.reset()
        terminated = False
        truncated = False
        
        while not (terminated or truncated):
            obs, reward, terminated, truncated, info = env.step([0.5])
            
        # 3. Build response specs
        specs = OptimalSpecs(
            engine_kw=opt_engine,
            battery_kwh=opt_battery,
            motor_kw=opt_motor,
            endurance_hours=env.time_elapsed / 3600.0,
            empty_weight_kg=env.weight_empty_and_payload - req.payload_weight,
            fuel_weight_kg=env.fuel_initial,
            total_weight_kg=env.mtow
        )
        
        # Map telemetry logs
        telemetry = []
        for point in env.flight_log:
            telemetry.append(
                TelemetryPoint(
                    time=point["time"],
                    altitude=point["altitude"],
                    speed=point["speed"],
                    power_required=point["power_required"],
                    power_delivered=point["power_delivered"],
                    power_motor=point["power_motor"],
                    power_engine=point["power_engine"],
                    soc=point["soc"],
                    fuel=point["fuel"],
                    weight=point["weight"],
                    phase=point["phase"],
                    deficit=point["deficit"],
                    u=point["u"]
                )
            )
            
        return OptimizationResponse(
            optimal_specs=specs,
            telemetry=telemetry
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
