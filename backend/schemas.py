"""
Pydantic Request & Response Schemas with Dynamic Environmental Controls & Flight Envelope Validation.
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
    headwind_kmh: float = Field(
        0.0,
        description="Headwind speed in km/h (0–60 km/h)",
        ge=0.0,
        le=60.0,
    )
    ambient_temp_c: float = Field(
        15.0,
        description="Sea-level ambient temperature in °C (-30°C to +40°C)",
        ge=-30.0,
        le=40.0,
    )
    turbulence_level: float = Field(
        0.0,
        description="Atmospheric turbulence intensity factor (0.0 to 1.0)",
        ge=0.0,
        le=1.0,
    )
    policy_mode: str = Field(
        "heuristic",
        description="Power split strategy: 'heuristic' (Zhang et al.) or 'rl' (SAC/PPO Neural Agent)",
    )

    @model_validator(mode="after")
    def validate_flight_envelope(self):
        if self.target_altitude > 8000.0 and self.payload_weight > 200.0:
            raise ValueError(
                f"Altitude {self.target_altitude}m exceeds flight service ceiling for payload {self.payload_weight}kg. "
                f"At altitudes > 8000m, maximum allowable payload is 200.0 kg due to air density lapse."
            )

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
    airframe_weight_kg: float = 350.0
    sfc_base: float = 0.38
    aspect_ratio: float = 16.07
    motor_efficiency_pct: float = 96.0


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
    env_metadata: dict = {}
