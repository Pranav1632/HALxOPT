"""
Propulsion Physics Module.
Implements shaft power requirements, SFC load degradation models, and component mass scaling.
"""
import math
from physics.aerodynamics import propeller_efficiency


def compute_power_required(
    weight_kg: float,
    speed_ms: float,
    altitude_m: float,
    climb_rate_ms: float,
    phase: str,
    aero_specs: dict,
    aspect_ratio: float,
    g: float,
    rho: float,
) -> tuple[float, float, float]:
    """
    Compute total shaft power required using governing physics equations.
    Returns: (p_shaft_kw, p_aero_kw, p_climb_kw)
    """
    if speed_ms < 1.0:
        return (0.0, 0.0, 0.0)

    S = aero_specs["wing_area_m2"]
    CD0 = aero_specs["drag_coefficient_cd0"]
    e = aero_specs["oswald_efficiency_factor_e"]
    AR = aspect_ratio

    gamma = math.asin(max(-1.0, min(1.0, climb_rate_ms / speed_ms)))
    CL = (2.0 * weight_kg * g * math.cos(gamma)) / (rho * (speed_ms ** 2) * S)
    CL_induced_term = (CL ** 2) / (math.pi * AR * e)
    CD = CD0 + CL_induced_term

    P_aero_W = 0.5 * rho * (speed_ms ** 3) * S * CD
    P_climb_W = weight_kg * g * climb_rate_ms
    P_prop_W = P_aero_W + P_climb_W

    eta_prop = propeller_efficiency(aero_specs, phase)
    P_shaft_W = max(0.0, P_prop_W / eta_prop)

    return (P_shaft_W / 1000.0, P_aero_W / 1000.0, P_climb_W / 1000.0)


def effective_sfc(engine_power_kw: float, engine_continuous_kw: float, sfc_base: float) -> float:
    """
    Apply partial-load penalty to SFC.
    If engine runs below optimal load factor, SFC degrades.
    """
    if engine_continuous_kw <= 0:
        return sfc_base
    load_fraction = engine_power_kw / engine_continuous_kw
    if load_fraction >= 0.8:
        return sfc_base  # Optimal SFC
    elif load_fraction >= 0.5:
        penalty = 1.0 + 0.15 * (0.8 - load_fraction) / 0.3
        return sfc_base * penalty
    else:
        penalty = 1.15 + 0.25 * (0.5 - load_fraction) / 0.5
        return sfc_base * penalty


def scale_engine_weight(engine_size_kw: float, ref_power_kw: float, ref_weight_kg: float) -> float:
    """Linear scaling of turboshaft mass based on reference rating."""
    if ref_power_kw <= 0:
        return ref_weight_kg
    return (engine_size_kw / ref_power_kw) * ref_weight_kg


def scale_battery_weight(battery_capacity_kwh: float, energy_density_wh_per_kg: float) -> float:
    """Scale battery pack weight from capacity and energy density."""
    if energy_density_wh_per_kg <= 0:
        return 0.0
    return (battery_capacity_kwh * 1000.0) / energy_density_wh_per_kg
