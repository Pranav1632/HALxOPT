"""
Power Split Policy Module.
Implements the Zhang et al. heuristic strategy for hybrid propulsion power management.
"""


def heuristic_psr(phase: str, soc: float, fuel_ratio: float) -> float:
    """
    Intelligent heuristic power management strategy inspired by Zhang et al.:
      - Takeoff/Climb: High Power Split Ratio (PSR) → Motor handles torque peaks.
      - Cruise: Low PSR → Engine at optimal SFC.
      - Loiter: Near-zero PSR → Pure engine at high load fraction.
      - Descent/Landing: Zero PSR → Gliding idle.
    Adjusts dynamically based on battery SoC and remaining fuel ratio.
    """
    if phase == "takeoff":
        base_psr = 0.65
        if soc < 0.3:
            base_psr = 0.3
        return base_psr

    elif phase == "climb":
        base_psr = 0.50
        if soc < 0.3:
            base_psr = 0.2
        elif soc < 0.5:
            base_psr = 0.35
        return base_psr

    elif phase == "cruise":
        base_psr = 0.12
        if soc > 0.8:
            base_psr = 0.20
        elif soc < 0.3:
            base_psr = 0.0
        return base_psr

    elif phase == "loiter":
        base_psr = 0.0
        if fuel_ratio < 0.1 and soc > 0.3:
            base_psr = 0.5
        return base_psr

    else:  # Descent and Landing
        return 0.0
