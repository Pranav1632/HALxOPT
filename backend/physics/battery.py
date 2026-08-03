"""
Battery Thermal & Electrical Discharge Physics Module.
Implements C-rate limits, cold-soak thermal derating, and SoC integration.
"""
import math


def max_battery_power(
    battery_capacity_kwh: float,
    c_rate_continuous: float,
    c_rate_peak: float,
    motor_continuous_kw: float,
    motor_peak_kw: float,
    is_peak: bool = False,
    temp_penalty: float = 1.0,
) -> float:
    """Max allowable power draw from battery, bounded by C-rate, thermal derating, and motor electrical specs."""
    c_rate = (c_rate_peak if is_peak else c_rate_continuous) * temp_penalty
    p_crate_limit = battery_capacity_kwh * temp_penalty * c_rate
    motor_limit = motor_peak_kw if is_peak else motor_continuous_kw
    return min(p_crate_limit, motor_limit)


def battery_temperature_penalty(ambient_temp_c: float) -> float:
    """
    Compute battery capacity/power derating penalty based on ambient temperature.
    Sub-zero temperatures increase internal cell resistance (R_int), causing voltage sag.
    1% capacity loss per degree below +10°C, capped at max 35% loss (0.65 min factor).
    """
    if ambient_temp_c >= 10.0:
        return 1.0
    penalty = 1.0 - (10.0 - ambient_temp_c) * 0.01
    return max(0.65, min(1.0, penalty))


def compute_soc_drain(
    p_motor_kw: float,
    motor_efficiency: float,
    dt_seconds: float,
    effective_battery_capacity_kwh: float,
) -> float:
    """Compute battery State-of-Charge (SoC) drain fraction over time step dt."""
    if p_motor_kw <= 0 or motor_efficiency <= 0 or effective_battery_capacity_kwh <= 0:
        return 0.0
    dt_hours = dt_seconds / 3600.0
    p_batt = p_motor_kw / motor_efficiency
    energy_drawn_kwh = p_batt * dt_hours
    return energy_drawn_kwh / effective_battery_capacity_kwh
