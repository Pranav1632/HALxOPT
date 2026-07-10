import os
import json
import numpy as np
import gymnasium as gym
from gymnasium import spaces

class UAVHybridEnv(gym.Env):
    """
    Custom Gymnasium environment for a Hybrid-Electric Fixed-Wing UAV flight simulation.
    Manages the flight state, aerodynamic physics, and hybrid power splitting.
    """
    metadata = {"render_modes": ["human"]}

    def __init__(
        self,
        engine_size_kw: float,
        battery_capacity_kwh: float,
        motor_size_kw: float,
        target_speed: float,
        target_altitude: float,
        payload_weight: float = 200.0,
        data_dir: str = None,
        use_dummy_policy: bool = True,
        dt: float = 10.0
    ):
        super(UAVHybridEnv, self).__init__()

        # Sizing parameters
        self.engine_size_kw = engine_size_kw
        self.battery_capacity_kwh = battery_capacity_kwh
        self.motor_size_kw = motor_size_kw
        self.target_speed = target_speed
        self.target_altitude = target_altitude
        self.payload_weight = payload_weight
        self.use_dummy_policy = use_dummy_policy
        self.dt = dt

        # Load physics constants dynamically
        if data_dir is None:
            self.data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        else:
            self.data_dir = data_dir
        
        self._load_constants()

        # Define Observation & Action Spaces
        # Observation: [Current Altitude (m), Speed (m/s), Battery SoC (0-1), Fuel Remaining (kg), Power Required (kW)]
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32),
            high=np.array([10000.0, 150.0, 1.0, 1000.0, 1000.0], dtype=np.float32),
            dtype=np.float32
        )

        # Action: [Degree of Hybridization] (0.0 = 100% Turboshaft, 1.0 = 100% Battery/Motor)
        self.action_space = spaces.Box(
            low=np.array([0.0], dtype=np.float32),
            high=np.array([1.0], dtype=np.float32),
            dtype=np.float32
        )

        # Compute weights based on sizes
        self.weight_airframe = self.aero_consts["airframe_mass_baseline"]
        self.weight_payload = self.payload_weight
        self.weight_engine = self.engine_size_kw * self.engine_consts["specific_weight"]
        self.weight_motor = self.motor_size_kw * self.battery_consts["motor_specific_weight"]
        self.weight_battery = (self.battery_capacity_kwh * 1000.0) / self.battery_consts["energy_density_wh_kg"]
        
        self.weight_empty_and_payload = (
            self.weight_airframe + self.weight_payload + self.weight_engine + self.weight_motor + self.weight_battery
        )
        self.mtow = 1000.0  # kg
        self.fuel_initial = self.mtow - self.weight_empty_and_payload

        # Keep track of flight logs for API telemetry
        self.flight_log = []

    def _load_constants(self):
        aero_path = os.path.join(self.data_dir, "aerodynamics.json")
        engine_path = os.path.join(self.data_dir, "turboshaft_specs.json")
        battery_path = os.path.join(self.data_dir, "battery_specs.json")

        if not os.path.exists(aero_path):
            raise FileNotFoundError(f"Aerodynamics constants not found at {aero_path}")
        if not os.path.exists(engine_path):
            raise FileNotFoundError(f"Turboshaft specs not found at {engine_path}")
        if not os.path.exists(battery_path):
            raise FileNotFoundError(f"Battery specs not found at {battery_path}")

        with open(aero_path, "r") as f:
            self.aero_consts = json.load(f)
        with open(engine_path, "r") as f:
            self.engine_consts = json.load(f)
        with open(battery_path, "r") as f:
            self.battery_consts = json.load(f)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        # Initialize simulation variables
        self.altitude = 0.0
        self.speed = 0.0
        self.soc = 1.0  # Full battery at start
        self.fuel_remaining = max(0.0, self.fuel_initial)
        
        self.time_elapsed = 0.0  # seconds
        self.phase_time_elapsed = 0.0
        self.current_phase = "takeoff"  # takeoff -> climb -> cruise -> descent -> completed
        
        self.deficit_counter = 0
        self.flight_log = []

        # Return initial state
        obs = self._get_obs(power_required=0.0)
        
        # Initial log
        self._log_telemetry(0.5, 0.0, 0.0, 0.0, 0.0, 0.0)
        
        return obs, {}

    def _get_obs(self, power_required: float):
        return np.array(
            [
                self.altitude,
                self.speed,
                self.soc,
                self.fuel_remaining,
                power_required
            ],
            dtype=np.float32
        )

    def _log_telemetry(self, u_applied, p_req, p_motor, p_engine, p_delivered, p_deficit):
        self.flight_log.append({
            "time": self.time_elapsed,
            "altitude": self.altitude,
            "speed": self.speed,
            "power_required": p_req,
            "power_delivered": p_delivered,
            "power_motor": p_motor,
            "power_engine": p_engine,
            "soc": self.soc,
            "fuel": self.fuel_remaining,
            "weight": self.weight_empty_and_payload + self.fuel_remaining,
            "phase": self.current_phase,
            "deficit": p_deficit,
            "u": u_applied
        })

    def step(self, action):
        dt = self.dt
        
        # Immediate termination if the propulsion sizing is too heavy to carry any fuel
        if self.fuel_initial <= 0.0:
            obs = self._get_obs(0.0)
            self._log_telemetry(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
            return obs, -1000.0, True, False, {"reason": "MTOW limit exceeded. Weight is too high to carry fuel."}

        # Apply action
        u = float(action[0]) if action is not None else 0.5
        if self.use_dummy_policy:
            # Force static 50/50 split as dummy policy
            u = 0.5

        # 1. Calculate stall speed dynamically
        # V_stall = sqrt( (2 * weight * g) / (rho * S * CL_max) )
        g = 9.81
        wing_area = self.aero_consts["wing_area"]
        cl_max = 1.5

        # Air density at current altitude
        rho_0 = self.aero_consts["air_density_sea_level"]
        rho = rho_0 * ((1.0 - 2.25577e-5 * self.altitude) ** 4.25588) if self.altitude < 11000 else 0.36
        rho = max(0.1, rho)

        current_weight = self.weight_empty_and_payload + self.fuel_remaining
        v_stall = np.sqrt((2.0 * current_weight * g) / (rho * wing_area * cl_max))

        climb_rate = 0.0
        if self.current_phase == "takeoff":
            self.speed = 1.15 * v_stall  # Takeoff speed safely above stall
            climb_rate = 2.0             # m/s climb rate
        elif self.current_phase == "climb":
            self.speed = 1.25 * v_stall  # Normal climb speed
            climb_rate = 2.5             # m/s climb rate
        elif self.current_phase == "cruise":
            self.speed = max(self.target_speed, 1.25 * v_stall)
            climb_rate = 0.0
        elif self.current_phase == "descent":
            self.speed = 1.2 * v_stall   # Safe gliding descent speed
            climb_rate = -2.5            # m/s descent rate
        else:
            self.speed = 0.0
            climb_rate = 0.0

        # 2. Physics Model: Power Required
        gamma = np.arcsin(climb_rate / self.speed) if self.speed > 0 else 0.0
        lift = current_weight * g * np.cos(gamma)

        # Lift coefficient
        cl = 0.0
        if self.speed > 0:
            cl = (2.0 * lift) / (rho * (self.speed ** 2) * wing_area)

        # Check Stall
        stalled = cl > 1.5

        # Drag Coefficient
        cd = self.aero_consts["drag_coefficient_zero"] + self.aero_consts["induced_drag_factor"] * (cl ** 2)
        drag = 0.5 * rho * (self.speed ** 2) * wing_area * cd

        # Propulsive power
        p_thrust_kw = (drag * self.speed) / 1000.0
        p_climb_kw = (current_weight * g * climb_rate) / 1000.0
        p_prop_kw = p_thrust_kw + p_climb_kw
        p_req_kw = max(0.0, p_prop_kw / self.aero_consts["propeller_efficiency"])

        # 3. Hybrid Power Split Sizing Limits
        # Initial splits
        p_motor_demand = u * p_req_kw
        p_engine_demand = (1.0 - u) * p_req_kw

        # Apply physical limits
        # Motor limit (by battery SoC and motor rating)
        if self.soc <= 0.01:
            p_motor = 0.0
        else:
            p_motor = min(p_motor_demand, self.motor_size_kw)

        # Engine limit (by fuel availability and engine rating)
        if self.fuel_remaining <= 0.01:
            p_engine = 0.0
        else:
            p_engine = min(p_engine_demand, self.engine_size_kw)

        # Active load sharing to cover power deficits
        p_delivered = p_motor + p_engine
        p_deficit = p_req_kw - p_delivered

        if p_deficit > 0.0:
            # Try to draw extra from motor if possible
            if self.soc > 0.01 and p_motor < self.motor_size_kw:
                extra_motor = min(p_deficit, self.motor_size_kw - p_motor)
                p_motor += extra_motor
                p_delivered += extra_motor
                p_deficit -= extra_motor

            # Try to draw extra from engine if possible
            if self.fuel_remaining > 0.01 and p_engine < self.engine_size_kw:
                extra_engine = min(p_deficit, self.engine_size_kw - p_engine)
                p_engine += extra_engine
                p_delivered += extra_engine
                p_deficit -= extra_engine

        # Clean tiny floating point deficits
        if p_deficit < 1e-3:
            p_deficit = 0.0

        # 4. Consume resources
        # Battery drain
        if p_motor > 0.0:
            p_elec_in = p_motor / self.battery_consts["electrical_efficiency"]
            energy_drawn_kwh = (p_elec_in * dt) / 3600.0
            self.soc = max(0.0, self.soc - (energy_drawn_kwh / self.battery_capacity_kwh))
        else:
            energy_drawn_kwh = 0.0

        # Fuel burn
        if p_engine > 0.0:
            fuel_burned_kg = p_engine * self.engine_consts["specific_fuel_consumption"] * (dt / 3600.0)
            self.fuel_remaining = max(0.0, self.fuel_remaining - fuel_burned_kg)
        else:
            fuel_burned_kg = 0.0

        # 5. Integrate state
        self.altitude = max(0.0, self.altitude + climb_rate * dt)
        self.time_elapsed += dt
        self.phase_time_elapsed += dt

        # Log details
        u_applied = p_motor / p_req_kw if p_req_kw > 0.0 else 0.5
        self._log_telemetry(u_applied, p_req_kw, p_motor, p_engine, p_delivered, p_deficit)

        # 6. Check Phase Transitions
        if self.current_phase == "takeoff" and self.altitude >= 100.0:
            self.current_phase = "climb"
            self.phase_time_elapsed = 0.0
        elif self.current_phase == "climb" and self.altitude >= self.target_altitude:
            self.current_phase = "cruise"
            self.phase_time_elapsed = 0.0
        elif self.current_phase == "cruise":
            # Initiate descent if both fuel and battery energy run very low
            fuel_ratio = (self.fuel_remaining / self.fuel_initial) if self.fuel_initial > 0 else 0.0
            if (self.soc < 0.05 and fuel_ratio < 0.05) and self.altitude > 100.0:
                self.current_phase = "descent"
                self.phase_time_elapsed = 0.0
        elif self.current_phase == "descent" and self.altitude <= 100.0:
            self.current_phase = "completed"

        # 7. Check Terminations
        terminated = False
        info = {}

        if stalled:
            terminated = True
            info["reason"] = "Stalled: Lift coefficient exceeded stall limit (1.5)"
        elif self.altitude < 0.0:
            terminated = True
            info["reason"] = "Crashed: Altitude dropped below 0"
        elif self.current_phase == "completed":
            terminated = True
            info["reason"] = "Landed: Successfully completed flight descent and landed"
        elif self.soc <= 0.01 and self.fuel_remaining <= 0.01:
            terminated = True
            info["reason"] = "Out of energy: Both battery and fuel fully depleted"
        
        # Deficit check: if power required cannot be met
        if p_deficit > 1.0: # more than 1 kW deficit
            self.deficit_counter += 1
            if self.deficit_counter >= 3:
                terminated = True
                info["reason"] = f"Power deficit failure: Unable to meet required power ({p_req_kw:.2f} kW required, only {p_delivered:.2f} kW delivered)"
        else:
            self.deficit_counter = 0

        # Safety truncation limit (24 hours)
        truncated = self.time_elapsed >= 86400.0
        if truncated:
            info["reason"] = "Truncated: Safety time limit reached (24 hours)"

        # 8. Calculate step reward
        reward = 1.0  # baseline survival reward
        if self.current_phase == "cruise":
            reward += 2.0  # bonus for cruise progress
        elif self.current_phase == "completed":
            reward += 1000.0  # large landing bonus
            
        if p_deficit > 0.0:
            reward -= (p_deficit * 10.0) # penalty for power deficit

        if stalled:
            reward -= 500.0

        obs = self._get_obs(p_req_kw)
        return obs, float(reward), terminated, truncated, info
