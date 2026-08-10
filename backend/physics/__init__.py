"""
Physics sub-package re-exporting key physics functions.
"""
from physics.atmosphere import isa_density, isa_temperature, speed_of_sound, mach_number
from physics.aerodynamics import (
    compute_aspect_ratio,
    stall_speed,
    propeller_efficiency,
    advance_ratio_propeller_efficiency,
    compute_drag_breakdown,
)
from physics.propulsion import (
    compute_power_required,
    gagg_ferrar_derating,
    compute_regenerative_power,
    effective_sfc,
    scale_engine_weight,
    scale_battery_weight,
)
from physics.battery import max_battery_power, battery_temperature_penalty, compute_soc_drain
from physics.wind import compute_wind_effects

__all__ = [
    "isa_density",
    "isa_temperature",
    "speed_of_sound",
    "mach_number",
    "compute_aspect_ratio",
    "stall_speed",
    "propeller_efficiency",
    "advance_ratio_propeller_efficiency",
    "compute_drag_breakdown",
    "compute_power_required",
    "gagg_ferrar_derating",
    "compute_regenerative_power",
    "effective_sfc",
    "scale_engine_weight",
    "scale_battery_weight",
    "max_battery_power",
    "battery_temperature_penalty",
    "compute_soc_drain",
    "compute_wind_effects",
]
