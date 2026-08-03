"""
Comprehensive Aerodynamic Forces & Propeller Physics Module.
Implements Lift, Parasite Drag, Induced Drag, Sideslip Drag, Prandtl-Glauert Compressibility Drag,
Advance Ratio (J) Propeller Efficiency, and Stall Speed.
"""
import math
from physics.atmosphere import mach_number


def compute_aspect_ratio(wingspan_m: float, wing_area_m2: float) -> float:
    """Aspect ratio: AR = b² / S"""
    if wing_area_m2 <= 0:
        return 1.0
    return (wingspan_m ** 2) / wing_area_m2


def stall_speed(weight_kg: float, rho: float, wing_area_m2: float, g: float = 9.81, cl_max: float = 1.5) -> float:
    """Compute stall speed: V_stall = sqrt(2·W·g / (ρ·S·CL_max))."""
    if rho <= 0 or wing_area_m2 <= 0 or cl_max <= 0:
        return 0.0
    return math.sqrt((2.0 * weight_kg * g) / (rho * wing_area_m2 * cl_max))


def advance_ratio_propeller_efficiency(
    speed_tas_ms: float,
    prop_diameter_m: float = 1.8,
    rpm: float = 2200.0,
    eta_max: float = 0.86,
    j_opt: float = 0.85,
) -> float:
    """
    Compute propeller efficiency using Advance Ratio J = V / (n · D).
    Replaces fixed phase hardcodes with dynamic aerodynamic propeller mechanics.
    """
    if speed_tas_ms < 1.0 or prop_diameter_m <= 0 or rpm <= 0:
        return 0.65  # Static / takeoff baseline

    n_rev_per_sec = rpm / 60.0
    J = speed_tas_ms / (n_rev_per_sec * prop_diameter_m)

    # Parabolic propeller efficiency curve
    eta = 4.0 * eta_max * (J / j_opt) * (1.0 - (J / (2.0 * j_opt)))
    return max(0.50, min(eta_max, eta))


def propeller_efficiency(aero_specs: dict, phase: str, speed_tas_ms: float = 0.0) -> float:
    """Return dynamic propeller efficiency via Advance Ratio if speed provided, else lookup."""
    if speed_tas_ms > 1.0:
        prop_d = aero_specs.get("propeller_diameter_m", 1.8)
        return advance_ratio_propeller_efficiency(speed_tas_ms, prop_diameter_m=prop_d)

    key_map = {
        "takeoff": "propeller_efficiency_takeoff",
        "climb": "propeller_efficiency_climb",
        "cruise": "propeller_efficiency_cruise",
        "loiter": "propeller_efficiency_cruise",
        "descent": "propeller_efficiency_descent",
        "landing": "propeller_efficiency_descent",
    }
    key = key_map.get(phase, "propeller_efficiency_cruise")
    return aero_specs.get(key, 0.85)


def compute_drag_breakdown(
    weight_kg: float,
    speed_tas_ms: float,
    altitude_m: float,
    climb_rate_ms: float,
    aero_specs: dict,
    aspect_ratio: float,
    g: float,
    rho: float,
    temp_c: float = 15.0,
    beta_rad: float = 0.0,
) -> dict:
    """
    Compute complete aerodynamic force breakdown: Lift, CD0, CDi, CD_beta, CD_mach, total CD, Drag force.
    """
    if speed_tas_ms < 1.0:
        return {
            "CL": 0.0, "CD0": 0.0, "CDi": 0.0, "CD_beta": 0.0, "CD_mach": 0.0,
            "CD_total": 0.0, "lift_force_n": 0.0, "drag_force_n": 0.0, "mach": 0.0,
        }

    S = aero_specs["wing_area_m2"]
    CD0 = aero_specs["drag_coefficient_cd0"]
    e = aero_specs["oswald_efficiency_factor_e"]
    AR = aspect_ratio

    gamma = math.asin(max(-1.0, min(1.0, climb_rate_ms / speed_tas_ms)))
    CL = (2.0 * weight_kg * g * math.cos(gamma) * math.cos(beta_rad)) / (rho * (speed_tas_ms ** 2) * S)
    CDi = (CL ** 2) / (math.pi * AR * e)

    # Sideslip drag
    CD_beta = 0.5 * (beta_rad ** 2)

    # Compressibility drag (Prandtl-Glauert)
    M = mach_number(speed_tas_ms, temp_c)
    if M > 0.4 and M < 0.95:
        CD_mach = CD0 * ((1.0 / math.sqrt(1.0 - M ** 2)) - 1.0)
    else:
        CD_mach = 0.0

    CD_total = CD0 + CDi + CD_beta + CD_mach

    q = 0.5 * rho * (speed_tas_ms ** 2)
    lift_force_n = q * S * CL
    drag_force_n = q * S * CD_total

    return {
        "CL": CL,
        "CD0": CD0,
        "CDi": CDi,
        "CD_beta": CD_beta,
        "CD_mach": CD_mach,
        "CD_total": CD_total,
        "lift_force_n": lift_force_n,
        "drag_force_n": drag_force_n,
        "mach": M,
    }
