"""
environment.py — Backward-Compatible Facade for UAVHybridEnv.
Re-exports UAVHybridEnv from the modular env package.
"""
from env.uav_env import UAVHybridEnv

__all__ = ["UAVHybridEnv"]


if __name__ == "__main__":
    import numpy as np

    print("Testing UAVHybridEnv facade...")
    env = UAVHybridEnv(
        engine_size_kw=60.0,
        battery_capacity_kwh=20.0,
        target_speed_kmh=250.0,
        target_altitude=5000.0,
        payload_weight=200.0,
    )
    obs, info = env.reset()
    print("Reset OK. Obs shape:", obs.shape)
    obs, reward, terminated, truncated, info = env.step(np.array([0.5]))
    print("Step OK. Reward:", reward, "Terminated:", terminated)
