"""
main.py — FastAPI Backend for Hybrid-Electric UAV Propulsion Optimization Simulator.

Endpoints:
  POST /api/optimize  — Accepts mission parameters, runs DEAP GA, returns optimal
                         propulsion sizing + full mission flight telemetry.
  GET  /api/health     — Health check.

Data Flow:
  1. Frontend sends {target_speed_kmh, target_altitude, payload_weight}
  2. DEAP GA sizes engine_kw and battery_kwh (Outer Loop)
  3. Best individual is re-simulated in UAVHybridEnv with heuristic power management
  4. Time-series telemetry and optimal specs returned as JSON
"""

import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from optimizer import optimize_propulsion
from environment import UAVHybridEnv

app = FastAPI(
    title="AeroOptima — Hybrid-Electric UAV Propulsion Optimization API",
    description="IIT Indore × HAL Hackathon: 1000 kg Fixed-Wing UAV System Design",
    version="2.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Resolve /data directory path ---- #
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

# Load motor specs once for response metadata
with open(os.path.join(DATA_DIR, "motor_specs.json"), "r") as f:
    MOTOR_SPECS = json.load(f)


# ---- Pydantic Models ---- #
class OptimizationRequest(BaseModel):
    target_speed_kmh: float = Field(
        250.0,
        description="Target cruise speed in km/h",
        ge=100.0,
        le=400.0,
    )
    target_altitude: float = Field(
        5000.0,
        description="Target cruise altitude in meters",
        ge=500.0,
        le=10000.0,
    )
    payload_weight: float = Field(
        200.0,
        description="Payload weight in kg",
        ge=50.0,
        le=350.0,
    )


class OptimalSpecs(BaseModel):
    engine_kw: float
    battery_kwh: float
    motor_kw: float
    endurance_hours: float
    empty_weight_kg: float
    fuel_weight_kg: float
    total_weight_kg: float
    motor_model: str
    engine_weight_kg: float
    motor_weight_kg: float
    battery_weight_kg: float


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


# ---- Endpoints ---- #
@app.post("/api/optimize", response_model=OptimizationResponse)
async def optimize_uav(req: OptimizationRequest):
    try:
        # 1. Run DEAP Genetic Algorithm (Outer Loop)
        ga_result = optimize_propulsion(
            target_speed_kmh=req.target_speed_kmh,
            target_altitude=req.target_altitude,
            payload_weight=req.payload_weight,
            data_dir=DATA_DIR,
        )

        opt_engine = ga_result["engine_size_kw"]
        opt_battery = ga_result["battery_capacity_kwh"]

        # 2. Re-simulate best individual with fine time steps for clean telemetry
        env = UAVHybridEnv(
            engine_size_kw=opt_engine,
            battery_capacity_kwh=opt_battery,
            target_speed_kmh=req.target_speed_kmh,
            target_altitude=req.target_altitude,
            payload_weight=req.payload_weight,
            data_dir=DATA_DIR,
            use_heuristic_policy=True,
            dt=60.0,  # 1-minute resolution for telemetry
        )

        obs, info = env.reset()
        terminated, truncated = False, False
        while not (terminated or truncated):
            obs, reward, terminated, truncated, info = env.step([0.5])

        # 3. Build response
        specs = OptimalSpecs(
            engine_kw=round(opt_engine, 2),
            battery_kwh=round(opt_battery, 2),
            motor_kw=MOTOR_SPECS["peak_power_kw"],
            endurance_hours=round(env.time_elapsed / 3600.0, 3),
            empty_weight_kg=round(env.weight_empty_and_payload - req.payload_weight, 2),
            fuel_weight_kg=round(env.fuel_initial, 2),
            total_weight_kg=round(env.mtow, 2),
            motor_model=f"{MOTOR_SPECS['manufacturer']} {MOTOR_SPECS['model']}",
            engine_weight_kg=round(env.weight_engine, 2),
            motor_weight_kg=round(env.weight_motor, 2),
            battery_weight_kg=round(env.weight_battery, 2),
        )

        telemetry = [TelemetryPoint(**pt) for pt in env.flight_log]

        return OptimizationResponse(optimal_specs=specs, telemetry=telemetry)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "motor": MOTOR_SPECS["model"]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
