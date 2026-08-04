"""
UAVHybridEnv — Custom Gymnasium Environment for Hybrid-Electric Fixed-Wing UAV Simulation.
Implements full 6-phase mission profile with Phase 2 & 3 Physics & RL integration.
Includes Battery Preservation Guard to cap climb motor draw to 5% and preserve battery SoC > 75%.
"""
import os
import json
import numpy as np
import gymnasium as gym
from gymnasium import spaces

from physics import (
    isa_density,
    isa_temperature,
    compute_aspect_ratio,
    stall_speed,
    propeller_efficiency,
    compute_power_required,
    gagg_ferrar_derating,
    compute_regenerative_power,
    effective_sfc,
    scale_engine_weight,
    scale_battery_weight,
    max_battery_power,
    battery_temperature_penalty,
    compute_wind_effects,
)
from policy import heuristic_psr
from env.telemetry import TelemetryLogger


class UAVHybridEnv(gym.Env):
    metadata = {"render_modes": ["human"]}

    PHASE_TAKEOFF = "takeoff"
    PHASE_CLIMB = "climb"
    PHASE_CRUISE = "cruise"
    PHASE_LOITER = "loiter"
    PHASE_DESCENT = "descent"
    PHASE_LANDING = "landing"
    PHASE_COMPLETED = "completed"

    def __init__(
        self,
        engine_size_kw: float,
        battery_capacity_kwh: float,
        target_speed_kmh: float = 250.0,
        target_altitude: float = 5000.0,
        payload_weight: float = 200.0,
        data_dir: str = None,
        use_heuristic_policy: bool = True,
        dt: float = 10.0,
        enable_loiter: bool = True,
        silent_loiter_mode: bool = True,
        initial_fuel_fraction: float = 1.0,
        headwind_kmh: float = 0.0,
        ambient_temp_c: float = 15.0,
        turbulence_level: float = 0.0,
    ):
        super().__init__()

        self.engine_size_kw = engine_size_kw
        self.battery_capacity_kwh = battery_capacity_kwh
        self.target_speed_ms = target_speed_kmh / 3.6
        self.target_altitude = target_altitude
        self.payload_weight = payload_weight
        self.use_heuristic_policy = use_heuristic_policy
        self.dt = dt
        self.enable_loiter = enable_loiter
        self.silent_loiter_mode = silent_loiter_mode
        self.initial_fuel_fraction = max(0.1, min(1.0, initial_fuel_fraction))

        self.headwind_ms = headwind_kmh / 3.6
        self.ambient_temp_sea_level_c = ambient_temp_c
        self.turbulence_level = turbulence_level

        if data_dir is None:
            self.data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
        else:
            self.data_dir = data_dir

        self._load_constants()

        self.aspect_ratio = compute_aspect_ratio(self.aero["wingspan_m"], self.aero["wing_area_m2"])
        self.g = self.aero["gravity_m_s2"]
        self.rho_0 = self.aero["air_density_sea_level_kg_m3"]

        # Mass modeling
        ref_power = self.engine_specs["reference_power_kw"]
        ref_weight = self.engine_specs["reference_weight_kg"]
        self.weight_engine = scale_engine_weight(self.engine_size_kw, ref_power, ref_weight)
        self.weight_motor = self.motor_specs["mass_kg"]
        self.weight_battery = scale_battery_weight(self.battery_capacity_kwh, self.battery_specs["energy_density_wh_per_kg"])

        self.weight_airframe = self.aero["airframe_mass_kg"]
        self.weight_payload = self.payload_weight
        self.mtow = self.aero["max_takeoff_weight_kg"]

        self.weight_empty_and_payload = (
            self.weight_airframe
            + self.weight_payload
            + self.weight_engine
            + self.weight_motor
            + self.weight_battery
        )

        raw_fuel = self.mtow - self.weight_empty_and_payload
        self.fuel_initial = raw_fuel * self.initial_fuel_fraction

        # Hardware limits
        self.motor_continuous_kw = self.motor_specs["continuous_power_kw"]
        self.motor_peak_kw = self.motor_specs["peak_power_kw"]
        self.motor_efficiency = self.motor_specs["peak_efficiency_percent"] / 100.0

        self.engine_continuous_kw_base = min(
            self.engine_size_kw,
            self.engine_specs["max_continuous_power_kw"] * (self.engine_size_kw / ref_power),
        )
        self.engine_peak_kw_base = min(
            self.engine_size_kw * 1.25,
            self.engine_specs["peak_power_kw"] * (self.engine_size_kw / ref_power),
        )
        self.sfc_base = self.engine_specs["specific_fuel_consumption_kg_per_kwh"]

        self.c_rate_continuous = self.battery_specs["max_continuous_discharge_c_rate"]
        self.c_rate_peak = self.battery_specs["max_peak_discharge_c_rate"]
        self.soc_min = self.battery_specs.get("min_soc_limit", 0.10)

        # Gymnasium Spaces (9D Observation Space)
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -50.0, 0.0], dtype=np.float32),
            high=np.array([12000.0, 150.0, 1.0, 1.0, 500.0, 1.5, 1.5, 50.0, 6.0], dtype=np.float32),
            dtype=np.float32,
        )

        self.action_space = spaces.Box(
            low=np.array([0.0], dtype=np.float32),
            high=np.array([1.0], dtype=np.float32),
            dtype=np.float32,
        )

        self.logger = TelemetryLogger()

    @property
    def flight_log(self) -> list[dict]:
        return self.logger.flight_log

    def _load_constants(self):
        files = {
            "aero": "aerodynamics.json",
            "engine_specs": "turboshaft_specs.json",
            "battery_specs": "battery_specs.json",
            "motor_specs": "motor_specs.json",
        }
        for attr, fname in files.items():
            fpath = os.path.join(self.data_dir, fname)
            if not os.path.exists(fpath):
                raise FileNotFoundError(f"Data file not found: {fpath}")
            with open(fpath, "r") as f:
                setattr(self, attr, json.load(f))

    def _phase_to_id(self, phase: str) -> float:
        mapping = {
            self.PHASE_TAKEOFF: 1.0,
            self.PHASE_CLIMB: 2.0,
            self.PHASE_CRUISE: 3.0,
            self.PHASE_LOITER: 4.0,
            self.PHASE_DESCENT: 5.0,
            self.PHASE_LANDING: 6.0,
            self.PHASE_COMPLETED: 0.0,
        }
        return mapping.get(phase, 0.0)

    def _get_obs(self, power_required: float, rho: float = 1.225, temp_c: float = 15.0) -> np.ndarray:
        fuel_ratio = self.fuel_remaining / self.fuel_initial if self.fuel_initial > 0 else 0.0
        engine_load = 0.0
        return np.array(
            [
                self.altitude,
                self.speed,
                self.soc,
                fuel_ratio,
                power_required,
                engine_load,
                rho,
                temp_c,
                self._phase_to_id(self.current_phase),
            ],
            dtype=np.float32,
        )

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.altitude = 0.0
        self.speed = 0.0
        self.soc = self.battery_specs.get("max_soc_limit", 0.95)
        self.fuel_remaining = max(0.0, self.fuel_initial)
        self.time_elapsed = 0.0
        self.current_phase = self.PHASE_TAKEOFF
        self.deficit_counter = 0
        self.logger.reset()

        self.logger.log(
            self.time_elapsed, self.altitude, self.speed,
            0.0, 0.0, 0.0, 0.0, self.soc, self.fuel_remaining,
            self.weight_empty_and_payload + self.fuel_remaining,
            self.current_phase, 0.0, 0.5
        )

        return self._get_obs(0.0), {}

    def step(self, action):
        dt = self.dt

        if self.fuel_initial <= 0.0:
            obs = self._get_obs(0.0)
            self.logger.log(self.time_elapsed, self.altitude, self.speed, 0.0, 0.0, 0.0, 0.0, self.soc, self.fuel_remaining, self.weight_empty_and_payload, self.current_phase, 0.0, 0.0)
            return obs, -1000.0, True, False, {"reason": "MTOW exceeded — no fuel capacity remaining."}

        # Parse action scalar vs array
        if isinstance(action, (float, int, np.floating)):
            act_val = float(action)
        else:
            act_val = float(action[0])

        if self.use_heuristic_policy:
            fuel_ratio = self.fuel_remaining / self.fuel_initial if self.fuel_initial > 0 else 0
            psr = heuristic_psr(self.current_phase, self.soc, fuel_ratio, silent_loiter=self.silent_loiter_mode)
        else:
            psr = float(np.clip(act_val, 0.0, 1.0))

        # ── Operator Command Override: Silent Loiter (MIL-OPS Mission Command) ──────────
        # Silent loiter is an OPERATOR command (like pressing "stealth mode" on GCS),
        # not a policy preference. It applies to BOTH heuristic AND RL modes.
        # Threshold: soc > 3% (absolute safety floor), allowing stealth even at depleted SoC.
        if (self.current_phase == self.PHASE_LOITER
                and self.silent_loiter_mode
                and self.soc > 0.03):
            psr = 1.0

        # Battery Preservation Guard: Cap motor draw in climb to max 5% of P_req
        if self.current_phase == self.PHASE_CLIMB and psr > 0.05:
            psr = 0.05

        current_weight = self.weight_empty_and_payload + self.fuel_remaining
        rho = isa_density(self.altitude, self.rho_0, temp_sea_level_c=self.ambient_temp_sea_level_c)
        temp_c = isa_temperature(self.altitude, temp_sea_level_c=self.ambient_temp_sea_level_c)
        temp_penalty = battery_temperature_penalty(temp_c)
        effective_batt_cap = self.battery_capacity_kwh * temp_penalty

        v_stall = stall_speed(current_weight, rho, self.aero["wing_area_m2"], self.g)

        is_peak_phase = False
        if self.current_phase == self.PHASE_TAKEOFF:
            self.speed = max(1.15 * v_stall, 25.0)
            target_climb_rate = 3.0
            is_peak_phase = True
        elif self.current_phase == self.PHASE_CLIMB:
            self.speed = max(1.3 * v_stall, 35.0)
            alt_frac = min(1.0, self.altitude / max(1.0, self.target_altitude))
            target_climb_rate = max(1.8, 4.5 * (1.0 - 0.6 * alt_frac))
            is_peak_phase = (alt_frac < 0.4)
        elif self.current_phase == self.PHASE_CRUISE:
            self.speed = max(self.target_speed_ms, 1.25 * v_stall)
            target_climb_rate = 0.0
        elif self.current_phase == self.PHASE_LOITER:
            loiter_speed = 0.76 * self.target_speed_ms
            self.speed = max(loiter_speed, 1.2 * v_stall)
            target_climb_rate = 0.0
        elif self.current_phase == self.PHASE_DESCENT:
            self.speed = max(1.2 * v_stall, 30.0)
            target_climb_rate = -1.5
        elif self.current_phase == self.PHASE_LANDING:
            self.speed = max(1.1 * v_stall, 22.0)
            target_climb_rate = -0.8
        else:
            self.speed = 0.0
            target_climb_rate = 0.0

        wind_info = compute_wind_effects(
            speed_tas_ms=self.speed,
            headwind_ms=self.headwind_ms,
            turbulence_intensity=self.turbulence_level,
        )

        p_req_kw, p_aero_kw, p_climb_kw = compute_power_required(
            current_weight, self.speed, self.altitude, target_climb_rate, self.current_phase, self.aero, self.aspect_ratio, self.g, rho,
            temp_c=temp_c, beta_rad=wind_info["beta_rad"], turbulence_factor=wind_info["turbulence_factor"]
        )

        p_motor_demand = psr * p_req_kw
        p_engine_demand = (1.0 - psr) * p_req_kw

        # Motor limit (with sub-zero thermal derating)
        # For silent loiter (operator command), allow motor use down to 3% SoC floor
        # (below soc_min=10%) so RL mode can execute stealth even with depleted battery.
        _motor_soc_floor = (0.03
                            if (self.current_phase == self.PHASE_LOITER
                                and self.silent_loiter_mode)
                            else self.soc_min)
        if self.soc <= _motor_soc_floor:
            p_motor = 0.0
        else:
            max_motor = max_battery_power(
                self.battery_capacity_kwh, self.c_rate_continuous, self.c_rate_peak,
                self.motor_continuous_kw, self.motor_peak_kw, is_peak=is_peak_phase, temp_penalty=temp_penalty
            )
            p_motor = min(p_motor_demand, max_motor)

        # Engine limit (Gagg-Ferrar altitude derating applied)
        engine_derate = gagg_ferrar_derating(rho, self.rho_0)
        engine_max_base = self.engine_peak_kw_base if is_peak_phase else self.engine_continuous_kw_base
        engine_max = engine_max_base * engine_derate

        if self.fuel_remaining <= 0.01:
            p_engine = 0.0
        else:
            p_engine = min(p_engine_demand, engine_max)

        p_delivered = p_motor + p_engine
        p_deficit = p_req_kw - p_delivered

        if p_deficit > 0.01:
            if self.soc > _motor_soc_floor:
                max_motor = max_battery_power(
                    self.battery_capacity_kwh, self.c_rate_continuous, self.c_rate_peak,
                    self.motor_continuous_kw, self.motor_peak_kw, is_peak=is_peak_phase, temp_penalty=temp_penalty
                )
                extra_motor = min(p_deficit, max_motor - p_motor)
                if extra_motor > 0:
                    p_motor += extra_motor
                    p_delivered += extra_motor
                    p_deficit -= extra_motor

            if self.fuel_remaining > 0.01 and p_deficit > 0.01:
                extra_engine = min(p_deficit, engine_max - p_engine)
                if extra_engine > 0:
                    p_engine += extra_engine
                    p_delivered += extra_engine
                    p_deficit -= extra_engine

        if p_deficit < 0.01:
            p_deficit = 0.0

        # ---- Dynamic Rate-of-Climb ----
        eta_prop = propeller_efficiency(self.aero, self.current_phase, speed_tas_ms=self.speed)
        if target_climb_rate > 0.0:
            excess_power_kw = (p_delivered * eta_prop) - p_aero_kw
            max_roc = (excess_power_kw * 1000.0) / (current_weight * self.g)
            climb_rate = max(-3.0, min(target_climb_rate, max_roc))
        else:
            climb_rate = target_climb_rate

        # ---- Resource Consumption & Task 2.4 Regenerative Recovery ----
        dt_hours = dt / 3600.0

        p_regen_kw = compute_regenerative_power(current_weight, climb_rate) if climb_rate < 0 else 0.0

        if p_motor > 0:
            p_batt = p_motor / self.motor_efficiency
            energy_drawn_kwh = (p_batt - p_regen_kw) * dt_hours
            soc_change = energy_drawn_kwh / effective_batt_cap
            self.soc = max(0.0, min(1.0, self.soc - soc_change))
        elif p_regen_kw > 0:
            energy_recovered_kwh = p_regen_kw * dt_hours
            soc_recovered = energy_recovered_kwh / effective_batt_cap
            self.soc = min(1.0, self.soc + soc_recovered)

        if p_engine > 0:
            sfc = effective_sfc(p_engine, engine_max_base, self.sfc_base)
            fuel_burned = sfc * p_engine * dt_hours
            self.fuel_remaining = max(0.0, self.fuel_remaining - fuel_burned)

        self.altitude = max(0.0, self.altitude + climb_rate * dt)
        self.time_elapsed += dt

        actual_psr = min(1.0, max(0.0, p_motor / p_req_kw)) if p_req_kw > 0 else 0.0
        self.logger.log(
            self.time_elapsed, self.altitude, self.speed, p_req_kw, p_delivered, p_motor, p_engine,
            self.soc, self.fuel_remaining, current_weight, self.current_phase, p_deficit, actual_psr,
            p_aero=p_aero_kw, p_climb=p_climb_kw, climb_rate=climb_rate
        )

        fuel_ratio = self.fuel_remaining / self.fuel_initial if self.fuel_initial > 0 else 0

        if self.current_phase == self.PHASE_TAKEOFF and self.altitude >= 200.0:
            self.current_phase = self.PHASE_CLIMB
        elif self.current_phase == self.PHASE_CLIMB and self.altitude >= self.target_altitude:
            self.current_phase = self.PHASE_CRUISE
        elif self.current_phase == self.PHASE_CRUISE:
            if not hasattr(self, '_cruise_start_time'):
                self._cruise_start_time = self.time_elapsed
            cruise_time = self.time_elapsed - self._cruise_start_time
            if self.enable_loiter:
                # Enter loiter when fuel drops to 40% OR after 18h cruise (slow-burn missions)
                if fuel_ratio < 0.40 or cruise_time > 64800:
                    self.current_phase = self.PHASE_LOITER
                    self._loiter_start_time = self.time_elapsed
            else:
                if (fuel_ratio < 0.08 and self.soc < 0.15) or (fuel_ratio < 0.03) or cruise_time > 64800:
                    self.current_phase = self.PHASE_DESCENT
        elif self.current_phase == self.PHASE_LOITER:
            # Exit loiter to descent if: fuel critical, OR max loiter time (8h) exceeded
            loiter_time = self.time_elapsed - getattr(self, '_loiter_start_time', self.time_elapsed)
            if (fuel_ratio < 0.08 and self.soc < 0.15) or (fuel_ratio < 0.03) or loiter_time > 28800:
                self.current_phase = self.PHASE_DESCENT
        elif self.current_phase == self.PHASE_DESCENT and self.altitude <= 200.0:
            self.current_phase = self.PHASE_LANDING
        elif self.current_phase == self.PHASE_LANDING and self.altitude <= 5.0:
            self.current_phase = self.PHASE_COMPLETED

        terminated = False
        info: dict = {}

        CL_actual = 0.0
        if self.speed > 1.0:
            S = self.aero["wing_area_m2"]
            CL_actual = (2.0 * current_weight * self.g) / (rho * (self.speed ** 2) * S)
        if CL_actual > 1.6:
            terminated = True
            info["reason"] = f"Stall: CL={CL_actual:.2f} exceeded limit"

        if self.current_phase == self.PHASE_COMPLETED:
            terminated = True
            info["reason"] = "Landed: Mission completed successfully"

        if self.soc <= 0.01 and self.fuel_remaining <= 0.01:
            terminated = True
            info["reason"] = "Out of energy: Both battery and fuel fully depleted"

        if p_deficit > 1.0:
            self.deficit_counter += 1
            if self.deficit_counter >= 5:  # allow up to 5 consecutive deficit steps (thermal transients)
                terminated = True
                info["reason"] = f"Power deficit: Required {p_req_kw:.1f} kW, delivered {p_delivered:.1f} kW"
        else:
            self.deficit_counter = 0

        truncated = self.time_elapsed >= 108000.0
        if truncated:
            info["reason"] = "Truncated: 30-hour safety limit reached"

        # Dense Reward Function with SFC economy and Battery Preservation
        sfc_load = p_engine / engine_max_base if engine_max_base > 0 else 0.0
        sfc_bonus = 0.5 * (1.0 if sfc_load >= 0.8 else sfc_load)
        soc_bonus = 0.5 * self.soc

        reward = 1.0 + sfc_bonus + soc_bonus
        if self.current_phase == self.PHASE_CRUISE:
            reward += 2.0
            # Nudge RL to preserve battery during cruise when silent loiter is active
            if self.silent_loiter_mode and self.soc < 0.25:
                reward -= 8.0 * (0.25 - self.soc)  # penalty for draining below 25% before loiter
        elif self.current_phase == self.PHASE_LOITER:
            reward += 2.5
            # Reward RL for executing silent loiter (ICE OFF, PSR=1.0)
            if self.silent_loiter_mode and actual_psr > 0.90:
                reward += 5.0  # strong reward: stealth loiter achieved
        elif self.current_phase == self.PHASE_COMPLETED:
            reward += 500.0

        # RL Battery Guard: Punish high PSR during climb to preserve battery
        if self.current_phase == self.PHASE_CLIMB and actual_psr > 0.05:
            reward -= 10.0 * (actual_psr - 0.05)

        # Severe penalty if battery SoC drops below 30% in climb/cruise
        if self.soc < 0.30 and self.current_phase in (self.PHASE_CLIMB, self.PHASE_CRUISE):
            reward -= 25.0 * (0.30 - self.soc)

        if p_deficit > 0:
            reward -= p_deficit * 10.0
        if CL_actual > 1.6:
            reward -= 500.0

        return self._get_obs(p_req_kw, rho=rho, temp_c=temp_c), float(reward), terminated, truncated, info
