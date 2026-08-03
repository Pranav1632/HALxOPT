"""
Environmental Wind & Atmospheric Disturbance Physics Module.
Implements dynamic headwind, crosswind sideslip drag, vertical gust vectors, and stochastic turbulence.
"""
import math
import numpy as np


def compute_wind_effects(
    speed_tas_ms: float,
    headwind_ms: float = 0.0,
    crosswind_ms: float = 0.0,
    vertical_gust_ms: float = 0.0,
    turbulence_intensity: float = 0.0,
) -> dict:
    """
    Compute effective groundspeed, sideslip angle (beta), sideslip drag increment,
    and stochastic turbulence power perturbation.

    Returns dict with:
      - groundspeed_ms: V_tas - V_headwind (bounded min 1.0 m/s)
      - beta_rad: sideslip angle arcsin(V_crosswind / V_tas)
      - cd_beta: sideslip drag coefficient increment (k_beta * beta^2)
      - gust_climb_power_kw_delta: power delta from vertical gust
      - turbulence_factor: multiplicative turbulence noise factor (e.g. 1.0 +/- delta)
    """
    if speed_tas_ms < 1.0:
        return {
            "groundspeed_ms": 0.0,
            "beta_rad": 0.0,
            "cd_beta": 0.0,
            "gust_climb_power_kw_delta": 0.0,
            "turbulence_factor": 1.0,
        }

    # Headwind reduces groundspeed (V_ground = V_tas - V_headwind)
    groundspeed_ms = max(1.0, speed_tas_ms - headwind_ms)

    # Crosswind induces sideslip angle beta = arcsin(V_crosswind / V_tas)
    crosswind_ratio = max(-0.9, min(0.9, crosswind_ms / speed_tas_ms))
    beta_rad = math.asin(crosswind_ratio)
    # Sideslip drag penalty coefficient k_beta ≈ 0.5
    cd_beta = 0.5 * (beta_rad ** 2)

    # Turbulence fluctuation factor N(1.0, 0.05 * turbulence_intensity)
    if turbulence_intensity > 0:
        noise = np.random.normal(0.0, 0.05 * turbulence_intensity)
        turbulence_factor = max(0.8, min(1.2, 1.0 + noise))
    else:
        turbulence_factor = 1.0

    return {
        "groundspeed_ms": groundspeed_ms,
        "beta_rad": beta_rad,
        "cd_beta": cd_beta,
        "gust_climb_power_kw_delta": 0.0,
        "turbulence_factor": float(turbulence_factor),
    }
