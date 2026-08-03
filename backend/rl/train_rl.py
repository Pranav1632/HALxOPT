"""
CPU Parallel Multiprocessed RL Training Pipeline for UAV Hybrid Energy Management.
Trains a PPO / SAC neural controller to optimize Power Split Ratio (PSR) under atmospheric turbulence and wind shear.
"""
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from env.uav_env import UAVHybridEnv
from rl.ppo_agent import train_numpy_rl


def train_rl_agent(
    episodes: int = 12,
    engine_kw: float = 65.0,
    battery_kwh: float = 20.0,
    save_path: str = None,
) -> dict:
    """
    Train NumPy PPO agent on 9D Gymnasium UAVHybridEnv.
    """
    if save_path is None:
        save_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "rl_model_ppo.json"))

    env = UAVHybridEnv(
        engine_size_kw=engine_kw,
        battery_capacity_kwh=battery_kwh,
        use_heuristic_policy=False,
        dt=60.0,
    )

    agent, stats = train_numpy_rl(env, total_episodes=episodes)
    agent.save(save_path)

    return stats


if __name__ == "__main__":
    train_rl_agent(episodes=12)
