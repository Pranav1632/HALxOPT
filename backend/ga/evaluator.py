"""
GA Individual Evaluator.
"""
from env import UAVHybridEnv


def evaluate_individual(
    individual,
    target_speed_kmh: float,
    target_altitude: float,
    payload_weight: float,
    data_dir: str,
    bounds: dict,
    enable_loiter: bool = True,
    initial_fuel_fraction: float = 1.0,
):
    """
    Evaluate a single GA individual by running a full flight simulation.
    Returns (endurance_hours,) as a single-objective fitness tuple.
    """
    engine_kw, battery_kwh = individual

    # Clip to physical bounds
    engine_kw = max(bounds["engine"][0], min(engine_kw, bounds["engine"][1]))
    battery_kwh = max(bounds["battery"][0], min(battery_kwh, bounds["battery"][1]))

    try:
        env = UAVHybridEnv(
            engine_size_kw=engine_kw,
            battery_capacity_kwh=battery_kwh,
            target_speed_kmh=target_speed_kmh,
            target_altitude=target_altitude,
            payload_weight=payload_weight,
            data_dir=data_dir,
            use_heuristic_policy=True,
            dt=60.0,
            enable_loiter=enable_loiter,
            initial_fuel_fraction=initial_fuel_fraction,
        )
    except Exception:
        return (0.0,)

    if env.fuel_initial <= 0.0:
        return (0.0,)

    obs, info = env.reset()
    terminated, truncated = False, False
    while not (terminated or truncated):
        obs, reward, terminated, truncated, info = env.step([0.5])

    endurance_hours = env.time_elapsed / 3600.0

    reason = info.get("reason", "")
    if "Landed" not in reason and "Mission completed" not in reason:
        endurance_hours *= 0.4

    return (endurance_hours,)
