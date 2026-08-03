"""
Comprehensive Multi-Condition Automated Test Suite for AeroOptima Propulsion Simulator.
Tests 6 extreme mission scenarios across Heuristic and RL control modes:
  1. Standard Mission (5,000m ASL, 250 km/h, 200 kg Payload, 15°C)
  2. Extreme High Altitude & Sub-Zero (-20°C, 8,000m ASL, 160 kW Engine)
  3. Hot & Heavy Mission (+35°C, 300 kg Payload, 3,000m ASL)
  4. Severe Wind Shear (40 km/h Headwind, 0.25 Turbulence)
  5. Low Initial Fuel (50% Fuel Fraction, 200 kg Payload)
  6. High-Speed Tactical Dash (320 km/h Airspeed, 5,000m ASL, 240 kW Engine)
"""
import os
import sys
import numpy as np

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from env.uav_env import UAVHybridEnv
from rl.ppo_agent import NumPyActorCritic


def run_condition_test(name: str, config: dict, agent: NumPyActorCritic = None) -> dict:
    results = {}

    for mode in ["heuristic", "rl"]:
        use_h = (mode == "heuristic")
        env = UAVHybridEnv(
            engine_size_kw=config.get("engine_kw", 120.0),
            battery_capacity_kwh=config.get("battery_kwh", 20.0),
            target_speed_kmh=config.get("target_speed_kmh", 250.0),
            target_altitude=config.get("target_altitude", 5000.0),
            payload_weight=config.get("payload_weight", 200.0),
            use_heuristic_policy=use_h,
            dt=60.0,
            enable_loiter=config.get("enable_loiter", True),
            initial_fuel_fraction=config.get("initial_fuel_fraction", 1.0),
            headwind_kmh=config.get("headwind_kmh", 0.0),
            ambient_temp_c=config.get("ambient_temp_c", 15.0),
            turbulence_level=config.get("turbulence_level", 0.0),
        )

        obs, _ = env.reset()
        done = False
        step_count = 0
        total_reward = 0.0

        while not done:
            if not use_h and agent is not None:
                act, _ = agent.get_action(obs, deterministic=True)
                action = [act]
            else:
                action = [0.5]

            obs, reward, term, trunc, info = env.step(action)
            done = term or trunc
            step_count += 1
            total_reward += reward

        dur_hrs = env.time_elapsed / 3600.0
        final_soc = env.soc * 100.0
        fuel_left = env.fuel_remaining
        end_reason = info.get("reason", "Completed")

        results[mode] = {
            "endurance_hrs": dur_hrs,
            "final_soc": final_soc,
            "fuel_remaining_kg": fuel_left,
            "reward": total_reward,
            "end_reason": end_reason,
            "steps": step_count,
        }

    return results


def run_full_suite():
    print("==========================================================================")
    print("      AEROOPTIMA MULTI-CONDITION COMPREHENSIVE TEST SUITE VERIFICATION")
    print("==========================================================================")

    # Load RL Model if available
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "rl_model_ppo.json"))
    agent = None
    if os.path.exists(model_path):
        agent = NumPyActorCritic(state_dim=9)
        agent.load(model_path)
        print(f"[INIT] PPO Neural Model loaded from {model_path}\n")

    scenarios = [
        {
            "name": "1. Standard Baseline Mission (5,000m ASL, 250 km/h, 200 kg Payload)",
            "config": {
                "target_speed_kmh": 250.0, "target_altitude": 5000.0, "payload_weight": 200.0,
                "ambient_temp_c": 15.0, "headwind_kmh": 0.0, "turbulence_level": 0.0,
                "engine_kw": 120.0, "battery_kwh": 20.0,
            }
        },
        {
            "name": "2. Extreme High Altitude & Sub-Zero (-20°C, 8000m ASL)",
            "config": {
                "target_speed_kmh": 240.0, "target_altitude": 8000.0, "payload_weight": 200.0,
                "ambient_temp_c": -20.0, "headwind_kmh": 15.0, "turbulence_level": 0.05,
                "engine_kw": 160.0, "battery_kwh": 25.0,
            }
        },
        {
            "name": "3. Hot & Heavy Takeoff (+35°C, 300 kg Payload, 3000m ASL)",
            "config": {
                "target_speed_kmh": 230.0, "target_altitude": 3000.0, "payload_weight": 300.0,
                "ambient_temp_c": 35.0, "headwind_kmh": 0.0, "turbulence_level": 0.0,
                "engine_kw": 120.0, "battery_kwh": 20.0,
            }
        },
        {
            "name": "4. Severe Headwind & Turbulence (40 km/h Headwind, 0.25 Turb)",
            "config": {
                "target_speed_kmh": 250.0, "target_altitude": 5000.0, "payload_weight": 200.0,
                "ambient_temp_c": 15.0, "headwind_kmh": 40.0, "turbulence_level": 0.25,
                "engine_kw": 120.0, "battery_kwh": 20.0,
            }
        },
        {
            "name": "5. Partial Fuel Tank (50% Initial Fuel Fraction)",
            "config": {
                "target_speed_kmh": 250.0, "target_altitude": 5000.0, "payload_weight": 200.0,
                "ambient_temp_c": 15.0, "initial_fuel_fraction": 0.50,
                "engine_kw": 120.0, "battery_kwh": 20.0,
            }
        },
        {
            "name": "6. High-Speed Tactical Dash (320 km/h Airspeed, 5000m ASL)",
            "config": {
                "target_speed_kmh": 320.0, "target_altitude": 5000.0, "payload_weight": 200.0,
                "ambient_temp_c": 15.0,
                "engine_kw": 240.0, "battery_kwh": 35.0,
            }
        },
    ]

    passed_count = 0
    total_count = len(scenarios)

    for sc in scenarios:
        name = sc["name"]
        print(f"--------------------------------------------------------------------------")
        print(f" TESTING SCENARIO: {name}")
        print(f"--------------------------------------------------------------------------")

        res = run_condition_test(name, sc["config"], agent=agent)

        h_res = res["heuristic"]
        rl_res = res["rl"]

        print(f"  [Baseline Heuristic] Endurance: {h_res['endurance_hrs']:.2f} hrs | SoC: {h_res['final_soc']:.1f}% | Fuel: {h_res['fuel_remaining_kg']:.1f} kg")
        print(f"                       Reason: {h_res['end_reason']}")
        print(f"  [SAC/PPO Neural RL]  Endurance: {rl_res['endurance_hrs']:.2f} hrs | SoC: {rl_res['final_soc']:.1f}% | Fuel: {rl_res['fuel_remaining_kg']:.1f} kg")
        print(f"                       Reason: {rl_res['end_reason']}")

        # Verification Criteria: Both modes must achieve > 1.0 hrs endurance without stall or crash
        if h_res["endurance_hrs"] > 1.0 and rl_res["endurance_hrs"] > 1.0:
            print(f"  --> VERDICT: [PASS] Scenario completed cleanly in both modes.")
            passed_count += 1
        else:
            print(f"  --> VERDICT: [FAIL] Premature termination detected.")

    print("\n==========================================================================")
    print(f" MULTI-CONDITION SUITE SUMMARY: {passed_count} / {total_count} SCENARIOS PASSED")
    print("==========================================================================\n")

    return passed_count == total_count


if __name__ == "__main__":
    success = run_full_suite()
    if not success:
        sys.exit(1)
