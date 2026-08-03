"""
main.py — FastAPI Backend for Hybrid-Electric UAV Propulsion Optimization Simulator.
Uses modular physics, schemas, ga, env, and rl packages with dynamic environmental controls.
"""
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import OptimizationRequest, OptimizationResponse, OptimalSpecs, TelemetryPoint
from ga import optimize_propulsion
from env import UAVHybridEnv
from rl import generate_shap_audit_summary
from rl.ppo_agent import NumPyActorCritic

app = FastAPI(
    title="AeroOptima — Hybrid-Electric UAV Propulsion Optimization API",
    description="IIT Indore × HAL Hackathon: 1000 kg Fixed-Wing UAV System Design",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
RL_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "rl_model_ppo.json"))

with open(os.path.join(DATA_DIR, "motor_specs.json"), "r") as f:
    MOTOR_SPECS = json.load(f)
with open(os.path.join(DATA_DIR, "aerodynamics.json"), "r") as f:
    AERO_SPECS = json.load(f)
with open(os.path.join(DATA_DIR, "turboshaft_specs.json"), "r") as f:
    TURBOSHAFT_SPECS = json.load(f)

# Load RL agent weights if available
rl_agent = None
if os.path.exists(RL_MODEL_PATH):
    try:
        rl_agent = NumPyActorCritic(state_dim=9)
        rl_agent.load(RL_MODEL_PATH)
        print(f"[INIT] Loaded PPO RL neural network weights from {RL_MODEL_PATH}")
    except Exception as err:
        print(f"[WARN] Could not load RL model: {err}")


@app.post("/api/optimize", response_model=OptimizationResponse)
async def optimize_uav(req: OptimizationRequest):
    print(f"\n[API] RECEIVED API CALL: POST /api/optimize")
    print(f"   * speed       : {req.target_speed_kmh} km/h")
    print(f"   * altitude    : {req.target_altitude} m")
    print(f"   * payload     : {req.payload_weight} kg")
    print(f"   * loiter      : {req.enable_loiter}")
    print(f"   * fuel frac   : {req.initial_fuel_fraction * 100:.1f}%")
    print(f"   * headwind    : {req.headwind_kmh} km/h")
    print(f"   * ambient temp: {req.ambient_temp_c} °C")
    print(f"   * policy mode : {req.policy_mode}")

    try:
        use_heuristic = (req.policy_mode != "rl")

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

        print(f"[SIM] SIZING COMPLETE. Re-running dynamic simulation with environmental factors...")
        print(f"   Using Engine = {opt_engine:.2f} kW, Battery = {opt_battery:.2f} kWh")

        env = UAVHybridEnv(
            engine_size_kw=opt_engine,
            battery_capacity_kwh=opt_battery,
            target_speed_kmh=req.target_speed_kmh,
            target_altitude=req.target_altitude,
            payload_weight=req.payload_weight,
            data_dir=DATA_DIR,
            use_heuristic_policy=use_heuristic,
            dt=60.0,
            enable_loiter=req.enable_loiter,
            initial_fuel_fraction=req.initial_fuel_fraction,
            headwind_kmh=req.headwind_kmh,
            ambient_temp_c=req.ambient_temp_c,
            turbulence_level=req.turbulence_level,
        )

        obs, info = env.reset()
        terminated, truncated = False, False
        step_count = 0

        while not (terminated or truncated):
            if not use_heuristic and rl_agent is not None:
                psr_act, _ = rl_agent.get_action(obs, deterministic=True)
                action = [psr_act]
            else:
                action = [0.5]

            obs, reward, terminated, truncated, info = env.step(action)
            step_count += 1

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
            airframe_weight_kg=AERO_SPECS["airframe_mass_kg"],
            sfc_base=TURBOSHAFT_SPECS["specific_fuel_consumption_kg_per_kwh"],
            aspect_ratio=round((AERO_SPECS["wingspan_m"] ** 2) / AERO_SPECS["wing_area_m2"], 2),
            motor_efficiency_pct=MOTOR_SPECS["peak_efficiency_percent"],
        )

        telemetry = [TelemetryPoint(**pt) for pt in env.flight_log]

        env_metadata = {
            "headwind_kmh": req.headwind_kmh,
            "ambient_temp_c": req.ambient_temp_c,
            "turbulence_level": req.turbulence_level,
            "policy_mode": req.policy_mode,
            "wingspan_m": AERO_SPECS["wingspan_m"],
            "wing_area_m2": AERO_SPECS["wing_area_m2"],
        }

        return OptimizationResponse(optimal_specs=specs, telemetry=telemetry, env_metadata=env_metadata)

    except Exception as e:
        print(f"[ERROR] DURING API CALL HANDLING: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.get("/api/shap")
async def get_shap_audit():
    return generate_shap_audit_summary()


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "motor": MOTOR_SPECS["model"], "version": "3.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
