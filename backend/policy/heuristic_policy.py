"""
Power Split Policy Module.
Implements baseline physics heuristic strategy for hybrid propulsion power management.
Optimized for tactical MALE UAV operations with battery preservation for high-altitude loiter.
"""


def heuristic_psr(phase: str, soc: float, fuel_ratio: float) -> float:
    """
    Rule-based physics heuristic power management strategy:
      - Takeoff: Moderate motor torque boost (PSR = 0.35-0.45).
      - Climb: Engine is primary driver (PSR = 0.10-0.15), preserving battery charge.
      - Cruise: Pure engine or light assist (PSR = 0.05-0.10) for optimal SFC.
      - Loiter: Silent loiter mode if command/fuel reserve, else pure engine.
      - Descent/Landing: Zero PSR (glide idle & regenerative recovery).
    """
    if phase == "takeoff":
        if soc < 0.3:
            return 0.20
        return 0.45

    elif phase == "climb":
        # Engine is primary climb powerplant (85% engine, 15% motor assist)
        if soc < 0.4:
            return 0.0
        elif soc < 0.6:
            return 0.10
        return 0.15

    elif phase == "cruise":
        if soc > 0.85:
            return 0.10
        elif soc < 0.3:
            return 0.0
        return 0.05

    elif phase == "loiter":
        if fuel_ratio < 0.15 and soc > 0.3:
            return 0.60  # Battery assist during low-fuel loiter
        return 0.0

    else:  # Descent and Landing
        return 0.0
