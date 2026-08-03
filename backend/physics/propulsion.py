"""
Propulsion Physics Module.
Implements shaft power requirements, Gagg-Ferrar engine altitude derating,
SFC load degradation models, regenerative descent energy recovery, and component mass scaling.
"""
import math
from physics.aerodynamics import propeller_efficiency, compute_drag_breakdown


def gagg_ferrar_derating(rho: float, rho_0: float = 1.225) -> float:
    """
    Gagg-Ferrar altitude engine shaft power derating model for naturally aspirated / un-supercharged engines.
    P_alt / P_SL = sigma - (1 - sigma) / 7.55
    """
    if rho_0 <= 0:
        return 1.0
    sigma = rho / rho_0
    factor = sigma - (1.0 - sigma) / 7.55
    return max(0.15, min(1.0, factor))


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
    temp_c: float = 15.0,
    beta_rad: float = 0.0,
    turbulence_factor: float = 1.0,
) -> tuple[float, float, float]:
    """
    Compute total shaft power required using governing physics equations and dynamic drag breakdown.
    Returns: (p_shaft_kw, p_aero_kw, p_climb_kw)
    """
    if speed_ms < 1.0:
        return (0.0, 0.0, 0.0)

    drag_info = compute_drag_breakdown(
        weight_kg=weight_kg,
        speed_tas_ms=speed_ms,
        altitude_m=altitude_m,
        climb_rate_ms=climb_rate_ms,
        aero_specs=aero_specs,
        aspect_ratio=aspect_ratio,
        g=g,
        rho=rho,
        temp_c=temp_c,
        beta_rad=beta_rad,
    )

    P_aero_W = drag_info["drag_force_n"] * speed_ms * turbulence_factor
    P_climb_W = weight_kg * g * climb_rate_ms
    P_prop_W = P_aero_W + P_climb_W

    eta_prop = propeller_efficiency(aero_specs, phase, speed_tas_ms=speed_ms)
    P_shaft_W = max(0.0, P_prop_W / eta_prop)

    return (P_shaft_W / 1000.0, P_aero_W / 1000.0, P_climb_W / 1000.0)


def compute_regenerative_power(
    weight_kg: float,
    climb_rate_ms: float,
    gen_efficiency: float = 0.85,
) -> float:
    """
    Compute electrical energy recovery (kW) generated during glide descent.
    P_regen = gen_efficiency · m · g · |v_descent|
    """
    if climb_rate_ms >= 0:
        return 0.0
    descent_speed_ms = abs(climb_rate_ms)
    p_pot_w = weight_kg * 9.81 * descent_speed_ms
    p_regen_w = p_pot_w * gen_efficiency
    return p_regen_w / 1000.0


def effective_sfc(engine_power_kw: float, engine_continuous_kw: float, sfc_base: float) -> float:
    """
    Apply partial-load penalty to SFC.
    If engine runs below optimal load factor, SFC degrades.
    """
    if engine_continuous_kw <= 0:
        return sfc_base
    load_fraction = engine_power_kw / engine_continuous_kw
    if load_fraction >= 0.8:
        return sfc_base
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
