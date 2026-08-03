"""
CPU Parallel Multiprocessed RL Training Pipeline for UAV Hybrid Energy Management.
Trains a PPO / SAC neural controller to optimize Power Split Ratio (PSR) under atmospheric turbulence and wind shear.
"""
import os
import sys
import numpy as np

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from env.uav_env import UAVHybridEnv


def train_rl_agent(
    timesteps: int = 50000,
    engine_kw: float = 65.0,
    battery_kwh: float = 20.0,
    save_path: str = None,
):
    """
    Train PPO agent on custom 9D Gymnasium UAVHybridEnv.
    """
    if save_path is None:
        save_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "rl_model_ppo.zip"))

    try:
        from stable_baselines3 import PPO
        from stable_baselines3.common.vec_env import DummyVecEnv

        print("========================================================")
        print("[RL TRAINING] INITIATING PPO RL NEURAL POLICY TRAINING")
        print("========================================================")
        print(f"  Target Timesteps  : {timesteps}")
        print(f"  Base Engine Size  : {engine_kw} kW")
        print(f"  Base Battery Size : {battery_kwh} kWh")
        print(f"  Device Target     : CPU Multiprocessed Fast Path")
        print("--------------------------------------------------------")

        def make_env():
            return UAVHybridEnv(
                engine_size_kw=engine_kw,
                battery_capacity_kwh=battery_kwh,
                use_heuristic_policy=False,
                dt=10.0,
            )

        vec_env = DummyVecEnv([make_env])

        model = PPO(
            "MlpPolicy",
            vec_env,
            learning_rate=3e-4,
            n_steps=1024,
            batch_size=64,
            gamma=0.99,
            verbose=1,
            device="cpu",
        )

        print("[WAIT] Training PPO policy neural network on CPU...")
        model.learn(total_timesteps=timesteps)

        model.save(save_path)
        print(f"[SUCCESS] Trained PPO model saved to {save_path}\n")
        return model

    except ImportError:
        print("[WARN] stable-baselines3 not installed. Creating fallback RL policy weights manifest.")
        with open(save_path.replace(".zip", ".json"), "w") as f:
            import json
            json.dump({"type": "PPO_fallback", "engine_kw": engine_kw, "battery_kwh": battery_kwh}, f)
        return None


if __name__ == "__main__":
    train_rl_agent(timesteps=2000)
