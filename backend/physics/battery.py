"""
Battery Thermal & Electrical Discharge Physics Module.
"""


def max_battery_power(
    battery_capacity_kwh: float,
    c_rate_continuous: float,
    c_rate_peak: float,
    motor_continuous_kw: float,
    motor_peak_kw: float,
    is_peak: bool = False,
) -> float:
    """Max allowable power draw from battery, bounded by C-rate and motor electrical specs."""
    c_rate = c_rate_peak if is_peak else c_rate_continuous
    p_crate_limit = battery_capacity_kwh * c_rate
    motor_limit = motor_peak_kw if is_peak else motor_continuous_kw
    return min(p_crate_limit, motor_limit)


def compute_soc_drain(p_motor_kw: float, motor_efficiency: float, dt_seconds: float, battery_capacity_kwh: float) -> float:
    """Compute battery State-of-Charge (SoC) drain fraction over time step dt."""
    if p_motor_kw <= 0 or motor_efficiency <= 0 or battery_capacity_kwh <= 0:
        return 0.0
    dt_hours = dt_seconds / 3600.0
    p_batt = p_motor_kw / motor_efficiency
    energy_drawn_kwh = p_batt * dt_hours
    return energy_drawn_kwh / battery_capacity_kwh
