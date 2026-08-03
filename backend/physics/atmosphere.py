"""
ISA Standard Atmosphere Model for UAV Simulation.
"""
import math


def isa_density(altitude_m: float, rho_0: float = 1.225) -> float:
    """
    Return air density (kg/m³) at given altitude using standard ISA model.

    Equations:
      - Troposphere (< 11,000m): ρ = ρ₀ · (1 − 2.25577×10⁻⁵·h)^4.25588
      - Stratosphere (≥ 11,000m): ρ = 0.3639 · exp(-(h − 11000) / 6341.6)
    """
    if altitude_m < 11000.0:
        rho = rho_0 * ((1.0 - 2.25577e-5 * altitude_m) ** 4.25588)
    else:
        rho = 0.3639 * math.exp(-(altitude_m - 11000.0) / 6341.6)
    return max(0.05, rho)
