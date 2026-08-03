"""
Telemetry logging utility for UAV flight simulation.
"""


class TelemetryLogger:
    """Manages structured telemetry recording during flight simulation steps."""

    def __init__(self):
        self.flight_log: list[dict] = []

    def reset(self):
        self.flight_log = []

    def log(
        self,
        time_elapsed: float,
        altitude: float,
        speed: float,
        p_req: float,
        p_delivered: float,
        p_motor: float,
        p_engine: float,
        soc: float,
        fuel_remaining: float,
        current_weight: float,
        phase: str,
        p_deficit: float,
        psr: float,
        p_aero: float = 0.0,
        p_climb: float = 0.0,
        climb_rate: float = 0.0,
    ):
        self.flight_log.append({
            "time": round(time_elapsed, 2),
            "altitude": round(altitude, 1),
            "speed": round(speed, 2),
            "power_required": round(p_req, 3),
            "power_delivered": round(p_delivered, 3),
            "power_motor": round(p_motor, 3),
            "power_engine": round(p_engine, 3),
            "soc": round(soc, 5),
            "fuel": round(fuel_remaining, 4),
            "weight": round(current_weight, 2),
            "phase": phase,
            "deficit": round(p_deficit, 3),
            "u": round(psr, 4),
            "p_aero": round(p_aero, 3),
            "p_climb": round(p_climb, 3),
            "climb_rate": round(climb_rate, 3),
        })
