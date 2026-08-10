"""
ISA Standard Atmosphere & Environmental Climate Physics Module.
Implements air density, temperature lapse, speed of sound, and Mach number.
"""
import math


def isa_density(altitude_m: float, rho_0: float = 1.225, temp_sea_level_c: float = 15.0) -> float:
    """
    Return air density (kg/m³) at given altitude using standard atmosphere model adjusted for sea-level temp T0.

    Equations:
      - T(h) = T0 - 0.0065 · h  [°C]
      - ρ(h) = ρ₀ · ((273.15 + T(h)) / (273.15 + T0))^4.25588
    """
    t_sl_k = 273.15 + temp_sea_level_c
    if altitude_m < 11000.0:
        t_alt_k = max(150.0, t_sl_k - 0.0065 * altitude_m)
        rho = rho_0 * ((t_alt_k / t_sl_k) ** 4.25588)
    else:
        t_alt_k = max(150.0, t_sl_k - 0.0065 * 11000.0)
        rho_11k = rho_0 * ((t_alt_k / t_sl_k) ** 4.25588)
        rho = rho_11k * math.exp(-(altitude_m - 11000.0) / 6341.6)

    return max(0.05, rho)


def isa_temperature(altitude_m: float, temp_sea_level_c: float = 15.0) -> float:
    """
    Return ambient temperature in °C at given altitude using temperature lapse rate.
    Troposphere: T = T0 - 0.0065 · altitude_m
    """
    if altitude_m < 11000.0:
        return temp_sea_level_c - 0.0065 * altitude_m
    else:
        return temp_sea_level_c - 0.0065 * 11000.0


def speed_of_sound(temp_c: float) -> float:
    """
    Compute local speed of sound in air (m/s) as function of temperature.
    a = sqrt(gamma · R · T_kelvin) = sqrt(1.4 · 287.05 · (273.15 + temp_c))
    """
    t_kelvin = max(100.0, 273.15 + temp_c)
    return math.sqrt(1.4 * 287.05 * t_kelvin)


def mach_number(speed_tas_ms: float, temp_c: float) -> float:
    """Compute flight Mach number M = V_tas / a(T)."""
    a = speed_of_sound(temp_c)
    if a <= 0:
        return 0.0
    return speed_tas_ms / a
