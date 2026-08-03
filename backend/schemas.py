"""
Pydantic Request & Response Schemas with Flight Envelope Validation.
"""
from pydantic import BaseModel, Field, model_validator


class OptimizationRequest(BaseModel):
    target_speed_kmh: float = Field(
        250.0,
        description="Target cruise speed in km/h",
        ge=100.0,
        le=400.0,
    )
    target_altitude: float = Field(
        5000.0,
        description="Target cruise altitude in meters",
        ge=500.0,
        le=10000.0,
    )
    payload_weight: float = Field(
        200.0,
        description="Payload weight in kg",
        ge=50.0,
        le=350.0,
    )
    enable_loiter: bool = Field(
        True,
        description="Toggle loiter holding phase vs straight flight"
    )
    initial_fuel_fraction: float = Field(
        1.0,
        description="Fraction of max fuel capacity to start with (0.1–1.0)",
        ge=0.1,
        le=1.0,
    )

    @model_validator(mode="after")
    def validate_flight_envelope(self):
        # Rule 1: High Altitude Payload Ceiling (at >8000m, max payload capped at 200kg)
        if self.target_altitude > 8000.0 and self.payload_weight > 200.0:
            raise ValueError(
                f"Altitude {self.target_altitude}m exceeds flight service ceiling for payload {self.payload_weight}kg. "
                f"At altitudes > 8000m, maximum allowable payload is 200.0 kg due to air density lapse."
            )

        # Rule 2: Minimum Cruise Speed at High Altitude (Stall Safety Margin)
        if self.target_altitude >= 8000.0 and self.target_speed_kmh < 200.0:
            raise ValueError(
                f"Target speed {self.target_speed_kmh} km/h is below stall safety limit at altitude {self.target_altitude}m. "
                f"At altitudes ≥ 8000m, minimum cruise speed must be ≥ 200 km/h."
            )

        return self


class OptimalSpecs(BaseModel):
    engine_kw: float
    battery_kwh: float
    motor_kw: float
    endurance_hours: float
    empty_weight_kg: float
    fuel_weight_kg: float
    total_weight_kg: float
    motor_model: str
    engine_weight_kg: float
    motor_weight_kg: float
    battery_weight_kg: float


class TelemetryPoint(BaseModel):
    time: float
    altitude: float
    speed: float
    power_required: float
    power_delivered: float
    power_motor: float
    power_engine: float
    soc: float
    fuel: float
    weight: float
    phase: str
    deficit: float
    u: float
    p_aero: float = 0.0
    p_climb: float = 0.0
    climb_rate: float = 0.0


class OptimizationResponse(BaseModel):
    optimal_specs: OptimalSpecs
    telemetry: list[TelemetryPoint]
