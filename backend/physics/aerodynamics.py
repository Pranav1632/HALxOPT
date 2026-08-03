"""
Aerodynamics Physics Module.
Implements Oswald drag polar, lift coefficient, stall speed, and propeller efficiency lookup.
"""
import math


def compute_aspect_ratio(wingspan_m: float, wing_area_m2: float) -> float:
    """Aspect ratio: AR = b² / S"""
    return (wingspan_m ** 2) / wing_area_m2


def stall_speed(weight_kg: float, rho: float, wing_area_m2: float, g: float = 9.81, cl_max: float = 1.5) -> float:
    """Compute stall speed: V_stall = sqrt(2·W·g / (ρ·S·CL_max))."""
    if rho <= 0 or wing_area_m2 <= 0 or cl_max <= 0:
        return 0.0
    return math.sqrt((2.0 * weight_kg * g) / (rho * wing_area_m2 * cl_max))


def propeller_efficiency(aero_specs: dict, phase: str) -> float:
    """Return phase-dependent propeller efficiency from specs dict."""
    key_map = {
        "takeoff": "propeller_efficiency_takeoff",
        "climb": "propeller_efficiency_climb",
        "cruise": "propeller_efficiency_cruise",
        "loiter": "propeller_efficiency_cruise",
        "descent": "propeller_efficiency_descent",
        "landing": "propeller_efficiency_descent",
    }
    key = key_map.get(phase, "propeller_efficiency_cruise")
    return aero_specs.get(key, 0.80)
