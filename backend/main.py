"""
main.py — FastAPI Backend for Hybrid-Electric UAV Propulsion Optimization Simulator.
Uses modular physics, schemas, ga, and env packages.
"""
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import OptimizationRequest, OptimizationResponse, OptimalSpecs, TelemetryPoint
from ga import optimize_propulsion
from env import UAVHybridEnv

app = FastAPI(
    title="AeroOptima — Hybrid-Electric UAV Propulsion Optimization API",
    description="IIT Indore × HAL Hackathon: 1000 kg Fixed-Wing UAV System Design",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

with open(os.path.join(DATA_DIR, "motor_specs.json"), "r") as f:
    MOTOR_SPECS = json.load(f)


@app.post("/api/optimize", response_model=OptimizationResponse)
async def optimize_uav(req: OptimizationRequest):
    print(f"\n[API] RECEIVED API CALL: POST /api/optimize")
    print(f"   * speed   : {req.target_speed_kmh} km/h")
    print(f"   * altitude: {req.target_altitude} m")
    print(f"   * payload : {req.payload_weight} kg")
    print(f"   * loiter  : {req.enable_loiter}")
    print(f"   * fuel frac: {req.initial_fuel_fraction * 100:.1f}%")

    try:
        ga_result = optimize_propulsion(
            target_speed_kmh=req.target_speed_kmh,
            target_altitude=req.target_altitude,
            payload_weight=req.payload_weight,
            data_dir=DATA_DIR,
            enable_loiter=req.enable_loiter,
            initial_fuel_fraction=req.initial_fuel_fraction,
        )

        opt_engine = ga_result["engine_size_kw"]
        opt_battery = ga_result["battery_capacity_kwh"]

        print(f"[SIM] SIZING COMPLETE. Re-running dynamic simulation to gather 1-min interval telemetry...")
        print(f"   Using Engine = {opt_engine:.2f} kW, Battery = {opt_battery:.2f} kWh")

        env = UAVHybridEnv(
            engine_size_kw=opt_engine,
            battery_capacity_kwh=opt_battery,
            target_speed_kmh=req.target_speed_kmh,
            target_altitude=req.target_altitude,
            payload_weight=req.payload_weight,
            data_dir=DATA_DIR,
            use_heuristic_policy=True,
            dt=60.0,
            enable_loiter=req.enable_loiter,
            initial_fuel_fraction=req.initial_fuel_fraction,
        )

        obs, info = env.reset()
        terminated, truncated = False, False
        step_count = 0
        while not (terminated or truncated):
            obs, reward, terminated, truncated, info = env.step([0.5])
            step_count += 1

        print(f"[SIM] Flight simulation complete:")
        print(f"   * Total steps simulated: {step_count} (dt=60s)")
        print(f"   * Total flight duration: {env.time_elapsed / 3600.0:.2f} hours")
        print(f"   * Final State of Charge: {env.soc * 100.0:.1f}%")
        print(f"   * Remaining Fuel weight: {env.fuel_remaining:.2f} kg")
        print(f"   * Landing safety status: {info.get('reason', 'Terminated normally')}")

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
        print(f"[API] Response built successfully. Returning {len(telemetry)} telemetry points to frontend UI.\n")

        return OptimizationResponse(optimal_specs=specs, telemetry=telemetry)

    except Exception as e:
        print(f"[ERROR] DURING API CALL HANDLING: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "motor": MOTOR_SPECS["model"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
