"""
Power Split Policy Module.
Implements baseline physics heuristic strategy for hybrid propulsion power management.
Optimized for tactical MALE UAV operations with silent loiter stealth capability.

Silent Loiter Mode (MIL-OPS):
  MODE A — Silent Loiter (ICE OFF, 100% Electric):  PSR = 1.0
    Acoustic signature < 45 dB at 1,000m. Used for tactical penetration & close target overwatch.
    Battery drain ≈ 25.3 kW → ~2.1% SoC/minute (20 kWh pack).
  MODE B — Endurance Loiter (ICE ON, 100% Engine):  PSR = 0.0
    Long-duration border/maritime patrol. Used when battery SoC is low.
"""


def heuristic_psr(phase: str, soc: float, fuel_ratio: float, silent_loiter: bool = True) -> float:
    """
    Rule-based physics heuristic power management strategy.
    Now supports dual-mode loiter: Silent (acoustic stealth) vs Endurance (fuel economy).

    Args:
        phase: Current flight phase string.
        soc: Battery State of Charge [0.0, 1.0].
        fuel_ratio: Remaining fuel / initial fuel [0.0, 1.0].
        silent_loiter: If True, use Mode A (100% electric, ICE OFF) during loiter when SoC permits.
    """
    if phase == "takeoff":
        if soc < 0.3:
            return 0.20
        return 0.45

    elif phase == "climb":
        # Engine is primary climb powerplant (85–90% engine, 10–15% motor assist)
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
        if silent_loiter and soc > 0.15:
            # MODE A: Silent Loiter — 100% Electric, ICE OFF
            # Acoustic signature drops from ~95 dB to < 45 dB at 1,000m AGL
            # Battery drain: ~25.3 kW → ~2.1% SoC/min (20 kWh pack)
            # Threshold at SoC > 15% (just above 10% soc_min floor) so it fires when loiter begins
            return 1.0
        elif fuel_ratio < 0.15 and soc > 0.12:
            # Low fuel: moderate battery assist to conserve remaining jet-A1
            return 0.60
        else:
            # MODE B: Endurance Loiter — 100% Engine, ICE ON
            return 0.0

    else:  # Descent and Landing
        return 0.0
