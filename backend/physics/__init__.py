"""
Physics sub-package re-exporting key physics functions.
"""
from physics.atmosphere import isa_density
from physics.aerodynamics import compute_aspect_ratio, stall_speed, propeller_efficiency
from physics.propulsion import compute_power_required, effective_sfc, scale_engine_weight, scale_battery_weight
from physics.battery import max_battery_power, compute_soc_drain

__all__ = [
    "isa_density",
    "compute_aspect_ratio",
    "stall_speed",
    "propeller_efficiency",
    "compute_power_required",
    "effective_sfc",
    "scale_engine_weight",
    "scale_battery_weight",
    "max_battery_power",
    "compute_soc_drain",
]
