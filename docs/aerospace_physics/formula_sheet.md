# Governing Physics and Mathematics Equations Reference Sheet

This document compiles, explains, and details the physical and mathematical equations used in the **Hybrid-Electric Propulsion Optimization Simulator** (implemented in [environment.py](file:///d:/project/HAL/backend/environment.py)).

---

## 1. Atmosphere Model (International Standard Atmosphere)

Determines air density ($\rho$) dynamically at any given altitude, which directly scales aerodynamic lift and parasite drag.

### Troposphere Model ($h < 11,000 \text{ m}$)
$$\rho(h) = \rho_0 \cdot \left(1.0 - 2.25577 \times 10^{-5} \cdot h\right)^{4.25588}$$

### Stratosphere Model ($11,000 \le h < 20,000 \text{ m}$)
$$\rho(h) = 0.3639 \cdot e^{-\frac{h - 11000}{6341.6}}$$

*   **Variables:**
    *   $h$: Flight altitude above sea level ($\text{m}$)
    *   $\rho_0$: Sea-level air density ($1.225 \text{ kg/m}^3$)
*   **Uses:** Used in `_atmosphere(self, altitude_m)` to calculate ambient air density for lift and drag models.

---

## 2. Aerodynamic Lift Coefficient ($C_L$)

Calculates the lift coefficient required to maintain vertical equilibrium at a given speed and climb angle.

$$C_L = \frac{2 \cdot W \cdot g \cdot \cos(\gamma)}{\rho \cdot V^2 \cdot S}$$

*   **Variables:**
    *   $W$: Current aircraft weight ($\text{kg}$)
    *   $g$: Acceleration due to gravity ($9.80665 \text{ m/s}^2$)
    *   $\gamma$: Climb angle in radians, where $\gamma = \arcsin\left(\frac{v_y}{V}\right)$
    *   $v_y$: Vertical climb rate ($\text{m/s}$)
    *   $V$: True Airspeed (TAS) ($\text{m/s}$)
    *   $S$: Wing surface area ($14 \text{ m}^2$)
*   **Uses:** Evaluates lift required to balance gravity. Checked against $C_{L,\text{max}}$ to ensure the aircraft is not in a stall condition.

---

## 3. Wing Stall Speed ($V_{\text{stall}}$)

Computes the absolute minimum airspeed safety limit for the aircraft.

$$V_{\text{stall}} = \sqrt{\frac{2 \cdot W \cdot g}{\rho \cdot S \cdot C_{L,\text{max}}}}$$

*   **Variables:**
    *   $C_{L,\text{max}}$: Maximum lift coefficient limit of the wing ($1.5$)
*   **Uses:** Used in `_stall_speed(self, weight, rho)` to establish flight safety limits. If the UAV airspeed drops below $V_{\text{stall}}$, a stall is triggered and the simulation terminates as a failure.

---

## 4. Drag Coefficient ($C_D$) (Oswald Drag Polar Model)

Computes the total drag coefficient, modeling the relationship between lift and induced drag.

$$C_D = C_{D0} + \frac{C_L^2}{\pi \cdot AR \cdot e}$$

*   **Variables:**
    *   $C_{D0}$: Zero-lift parasite drag coefficient ($0.025$)
    *   $AR$: Aspect Ratio of the wing, calculated as:
        $$AR = \frac{b^2}{S} = \frac{15^2}{14} = 16.07$$
    *   $b$: Wingspan ($15 \text{ m}$)
    *   $e$: Oswald span efficiency factor ($0.85$)
*   **Uses:** Calculates the total aerodynamic resistance forces opposing thrust.

---

## 5. Aerodynamic Power Required ($P_{\text{aero}}$)

Calculates the mechanical power required to overcome drag at cruise airspeed.

$$P_{\text{aero}} = \frac{1}{2} \rho V^3 S C_D$$

*   **Uses:** Models parasite and induced drag power requirements. It shows why high-speed flight consumes fuel exponentially ($V^3$).

---

## 6. Climb Power ($P_{\text{climb}}$)

Calculates the mechanical power required to climb against gravity.

$$P_{\text{climb}} = W \cdot g \cdot v_y$$

*   **Uses:** Used to compute power spikes during takeoff and climb phases.

---

## 7. Propeller Shaft Power ($P_{\text{shaft}}$)

Determines the total mechanical shaft power required from the propulsion system.

$$P_{\text{shaft}} = \frac{P_{\text{aero}} + P_{\text{climb}}}{\eta_{\text{prop}}}$$

*   **Variables:**
    *   $\eta_{\text{prop}}$: Propeller efficiency, dependent on the flight phase:
        *   Takeoff: $0.65$
        *   Climb: $0.75$
        *   Cruise / Loiter: $0.85$
        *   Descent / Landing: $0.70$
*   **Uses:** The primary target parameter for the engine/motor power splitting model.

---

## 8. Specific Fuel Consumption (SFC) with Partial Load Penalty

Models the efficiency degradation of a gas turbine engine operating at partial throttle.

$$L_f = \frac{P_{\text{engine}}}{P_{\text{continuous}}}$$

$$\text{SFC} = \text{SFC}_{\text{base}} \quad \left(\text{for } L_f \ge 0.8\right)$$

$$\text{SFC} = \text{SFC}_{\text{base}} \cdot \left[1.0 + 0.15 \cdot \frac{0.8 - L_f}{0.3}\right] \quad \left(\text{for } 0.5 \le L_f < 0.8\right)$$

$$\text{SFC} = \text{SFC}_{\text{base}} \cdot \left[1.15 + 0.25 \cdot \frac{0.5 - L_f}{0.5}\right] \quad \left(\text{for } L_f < 0.5\right)$$

*   **Variables:**
    *   $L_f$: Engine load fraction
    *   $P_{\text{engine}}$: Actual power demand on the engine ($\text{kW}$)
    *   $P_{\text{continuous}}$: Continuous power rating of the sized engine ($\text{kW}$)
    *   $\text{SFC}_{\text{base}}$: Base engine fuel consumption rate ($0.38 \text{ kg/kWh}$)
*   **Uses:** Calculates fuel burn dynamically, penalizing oversized engines operating at low throttle.

---

## 9. Fuel Consumption Integration

$$W_{\text{fuel}, t+\Delta t} = W_{\text{fuel}, t} - \text{SFC} \cdot P_{\text{engine}} \cdot \Delta t$$

*   **Variables:**
    *   $\Delta t$: Simulation time step in hours ($\Delta t = \frac{\text{dt}}{3600}$)
*   **Uses:** Integrates fuel burn over the flight timeline, reducing total aircraft weight.

---

## 10. Battery State of Charge (SoC) Integration

$$SoC_{t+\Delta t} = SoC_t - \frac{P_{\text{batt}} \cdot \Delta t}{E_{\text{battery}}}$$

*   **Variables:**
    *   $P_{\text{batt}}$: Electrical battery discharge power ($\text{kW}$), where:
        $$P_{\text{batt}} = \frac{P_{\text{motor}}}{\eta_{\text{motor}}}$$
    *   $\eta_{\text{motor}}$: Peak electric motor efficiency ($0.96$)
    *   $E_{\text{battery}}$: Sized battery capacity ($\text{kWh}$)
*   **Uses:** Models battery depletion rate over the flight.

---

## 11. Battery Discharge Power Limits ($P_{\text{batt, max}}$)

Enforces chemical safety constraints of the battery pack based on maximum C-rates.

$$P_{\text{batt, max}} = E_{\text{battery}} \times C_{\text{rate}}$$

*   **Variables:**
    *   $C_{\text{rate}}$: Discharge C-rate limit ($3\text{C}$ continuous, $5\text{C}$ transient peak)
*   **Uses:** Prevents excessive battery current draw, capping motor power output based on SoC.

---

## 12. Component Mass Sizing Model

Determines the empty weight of the UAV based on the engine power and battery capacity sized by the Genetic Algorithm.

### Sized Engine Weight ($W_{\text{engine}}$)
$$W_{\text{engine}} = \frac{P_{\text{engine, continuous}}}{P_{\text{ref}}} \cdot W_{\text{ref}}$$

*   **Variables:**
    *   $P_{\text{ref}}$: Reference engine power ($60 \text{ kW}$)
    *   $W_{\text{ref}}$: Reference engine weight ($35 \text{ kg}$)

### Sized Battery Weight ($W_{\text{battery}}$)
$$W_{\text{battery}} = \frac{E_{\text{battery}} \cdot 1000}{e_{\text{density}}}$$

*   **Variables:**
    *   $e_{\text{density}}$: Battery specific energy density ($250 \text{ Wh/kg}$)

### Sized Starting Fuel Capacity ($W_{\text{fuel}}$)
$$W_{\text{fuel}} = \left(W_{\text{MTOW}} - W_{\text{airframe}} - W_{\text{payload}} - W_{\text{engine}} - W_{\text{motor}} - W_{\text{battery}}\right) \cdot \text{fraction}_{\text{fuel}}$$

*   **Variables:**
    *   $W_{\text{MTOW}}$: Maximum Takeoff Weight limit ($1000 \text{ kg}$)
    *   $W_{\text{airframe}}$: Structural airframe mass ($350 \text{ kg}$)
    *   $W_{\text{payload}}$: Sized payload mass ($50 \text{ to } 350 \text{ kg}$)
    *   $W_{\text{motor}}$: Axial flux motor mass ($12.3 \text{ kg}$)
    *   $\text{fraction}_{\text{fuel}}$: User-configured initial fuel load fraction ($0.1 \text{ to } 1.0$)
*   **Uses:** Calculates the remaining weight budget available for fuel, ensuring the aircraft never exceeds the $1,000\text{ kg}$ MTOW constraint.
