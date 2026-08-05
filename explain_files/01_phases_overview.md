# Phase Explanations Overview: What, Why, and How

This document provides a comprehensive overview of the **6 Flight Phases** engineered into the AeroOptima simulation platform for a 1000 kg tactical hybrid-electric fixed-wing UAV.

Each phase is analyzed through three core analytical lenses:
1. **WHAT**: Definition, operational objectives, and flight state boundaries.
2. **WHY**: Engineering rationale, physical necessity, aerodynamic optimization, and airworthiness safety standards (STANAG 4671).
3. **HOW**: Implementation details in simulation software, state updates, power-split strategies, and phase transition logic.

---

## 🛫 Phase 1: Takeoff Phase (`takeoff`)

### 1. WHAT is the Takeoff Phase?
The Takeoff Phase encompasses ground acceleration and initial low-altitude climb from $h = 0\text{ m}$ up to $h = 200\text{ m}$. During this phase, the aircraft must rapidly accelerate beyond its stall speed $V_{\text{stall}}$ to establish a safe initial climb rate of $3.0\text{ m/s}$.

### 2. WHY is the Takeoff Phase configured this way?
- **High Thrust Requirement**: Acceleration from zero velocity combined with ground friction and steep initial climb demands maximum instant torque and peak power output.
- **Electric Motor Boost**: Internal combustion engines (turboshafts) suffer from slow spool-up latency (lag). The electric motor provides instantaneous zero-rpm torque to ensure short takeoff distance ($< 350\text{ m}$).
- **Safety Margin**: Target airspeed is set to $1.15 \times V_{\text{stall}}$ (approx $25\text{ m/s}$ to $35\text{ m/s}$) to prevent low-altitude aerodynamic stall under wind gusts.

### 3. HOW does Takeoff work in the codebase?
- **Speed & Climb Target**: [`uav_env.py`](file:///d:/project/HAL/backend/env/uav_env.py#L255-L258) sets airspeed $V = \max(1.15 V_{\text{stall}}, 25.0\text{ m/s})$ and target climb rate $\dot{h} = 3.0\text{ m/s}$.
- **Power Split Allocation**: Heuristic policy sets $\alpha = 0.50$ (50% electric motor, 50% turboshaft). Under RL control, the policy draws on peak battery C-rate ($C_{\text{peak}} = 5.0\text{ C}$) to satisfy peak power demand ($P_{\text{req}} = P_{\text{aero}} + P_{\text{climb}}$).
- **Phase Transition Trigger**: When altitude $h \ge 200.0\text{ m}$, the state machine automatically transitions to `climb`:
  $$\text{If } h \ge 200.0\text{ m} \implies \text{Phase} \to \text{PHASE\_CLIMB}$$

---

## 🧗 Phase 2: Climb Phase (`climb`)

### 1. WHAT is the Climb Phase?
The Climb Phase covers altitude gain from $h = 200\text{ m}$ up to the target mission altitude (e.g., $h_{\text{target}} = 5000\text{ m}$ or $3000\text{ m}$).

### 2. WHY is the Climb Phase configured this way?
- **Altitude-Dependent Climb Rate**: As air density $\rho(h)$ decreases with altitude (ISA standard atmosphere), available engine thrust decreases due to oxygen rarefaction. Climb rate must scale smoothly from $4.5\text{ m/s}$ down to $1.8\text{ m/s}$.
- **Battery Preservation Guard**: Draining the high-density Li-Ion battery pack during a long climb would deplete reserve energy before cruise and loiter phases.
- **STANAG 4671 Compliance**: Battery State of Charge (SoC) must be preserved above 75% entering cruise to guarantee silent emergency return-to-base (RTB).

### 3. HOW does Climb work in the codebase?
- **Dynamic Climb Rate Model**: Calculated as a function of altitude fraction:
  $$\dot{h} = \max\left(1.8, 4.5 \times \left(1.0 - 0.6 \times \frac{h}{h_{\text{target}}}\right)\right)$$
- **Battery Preservation Guard**: [`uav_env.py`](file:///d:/project/HAL/backend/env/uav_env.py#L242-L244) enforces a strict cap on motor power split ($\alpha \le 0.05$). The turboshaft engine delivers $\ge 95\%$ of climb thrust, saving battery charge.
- **Phase Transition Trigger**: When altitude reaches target altitude:
  $$\text{If } h \ge h_{\text{target}} \implies \text{Phase} \to \text{PHASE\_CRUISE}$$

---

## ✈️ Phase 3: Cruise Phase (`cruise`)

### 1. WHAT is the Cruise Phase?
The Cruise Phase represents steady-level transit flight at constant altitude ($h = 5000\text{ m}$ or $3000\text{ m}$) and high target speed ($V_{\text{cruise}} = 250\text{ km/h} \approx 69.4\text{ m/s}$).

### 2. WHY is the Cruise Phase configured this way?
- **Maximum Mission Range**: Cruise consumes the largest portion of mission time and fuel. Optimizing fuel economy here directly maximizes total endurance.
- **Optimal BSFC Regime**: Turboshaft engines operate at minimum Brake Specific Fuel Consumption (BSFC $\approx 0.38 - 0.42\text{ kg/kWh}$) when loaded at $75\% - 85\%$ of rated continuous capacity.
- **Aerodynamic Drag Efficiency**: Flight at high altitude reduces air density $\rho$, lowering parasite drag $D_0 = \frac{1}{2}\rho V^2 S C_{D0}$.

### 3. HOW does Cruise work in the codebase?
- **Level Flight Dynamics**: Climb rate $\dot{h} = 0.0\text{ m/s}$. Speed $V = \max(V_{\text{target}}, 1.25 V_{\text{stall}})$.
- **Power Split Management**: Pure turboshaft propulsion ($\alpha = 0.0$) operates the engine in its sweet spot. Motor is disengaged to prevent parasitic battery drain.
- **Phase Transition Triggers**:
  - If loiter mode is enabled and fuel remaining fraction drops below 45% ($f_{\text{fuel}} < 0.45$), or if battery is depleted in cruise:
    $$\text{Phase} \to \text{PHASE\_LOITER}$$
  - If loiter mode is disabled and energy is depleted ($f_{\text{fuel}} < 0.08$ and $\text{SoC} < 0.15$):
    $$\text{Phase} \to \text{PHASE\_DESCENT}$$

---

## 🕵️ Phase 4: Loiter / Silent Loiter Phase (`loiter`)

### 1. WHAT is the Loiter Phase?
The Loiter Phase is a stationary intelligence, surveillance, and reconnaissance (ISR) station-keeping phase at $h = 3000 - 5000\text{ m}$. In **Silent Loiter Mode**, the internal combustion engine is completely shut off ($ICE = \text{OFF}$), and the UAV flies purely on battery-electric power.

### 2. WHY is the Loiter Phase configured this way?
- **Acoustic & Thermal Stealth**: Turning off the turboshaft engine removes exhaust gas heat signature (infrared) and acoustic propeller/engine noise, making the UAV invisible to acoustic sensors and thermal missiles during overwatch.
- **Minimum Power Speed**: Speed is reduced to $V_{\text{loiter}} = 0.76 \times V_{\text{target}}$ (the velocity for minimum power required $V_{\text{mp}}$), maximizing endurance per kWh of energy consumed.
- **Emergency Airworthiness**: Silent loiter allows safe flight operating on battery energy down to an absolute safety floor of $\text{SoC} = 3\%$.

### 3. HOW does Loiter work in the codebase?
- **Stealth Command Override**: In [`uav_env.py`](file:///d:/project/HAL/backend/env/uav_env.py#L237-L240), when `silent_loiter_mode=True` and $\text{SoC} > 0.03$, the power-split ratio is set to $\alpha = 1.0$ (100% electric motor, 0% fuel burn).
- **Reward Structure**: PPO RL policy receives a strong bonus ($+5.0$) for maintaining stealth ($\alpha > 0.90$) without triggering power deficits.
- **Phase Transition Trigger**: Exit loiter when fuel fraction $f_{\text{fuel}} < 0.08$ & $\text{SoC} < 0.15$, or when maximum loiter endurance time ($8\text{ hours}$) is exceeded:
  $$\text{Phase} \to \text{PHASE\_DESCENT}$$

---

## 🛬 Phase 5: Descent Phase (`descent`)

### 1. WHAT is the Descent Phase?
The Descent Phase governs controlled altitude loss from cruise/loiter altitude down to $h = 200\text{ m}$ at a steady rate of descent ($\dot{h} = -1.5\text{ m/s}$).

### 2. WHY is the Descent Phase configured this way?
- **Zero Fuel Consumption**: Gravitational potential energy $E_p = m g h$ is converted into kinetic energy to maintain flight speed, allowing the turboshaft to idle or shut down.
- **Regenerative Battery Recovery**: The electric motor acts as a generator when driven by windmilling propellers during descent, recovering electrical energy back into the battery pack ($P_{\text{regen}}$).
- **Structural Load Protection**: Descent rate is bounded to $-1.5\text{ m/s}$ to prevent dynamic pressure exceedance and wing structural overstress.

### 3. HOW does Descent work in the codebase?
- **Glideslope Equations**: Airspeed $V = \max(1.2 V_{\text{stall}}, 30.0\text{ m/s})$, climb rate $\dot{h} = -1.5\text{ m/s}$.
- **Regenerative Power Math**: [`propulsion.py`](file:///d:/project/HAL/backend/physics/propulsion.py) computes $P_{\text{regen}} = \eta_{\text{regen}} \times m g |\dot{h}| / 1000$. Battery SoC increases:
  $$\Delta \text{SoC} = \frac{P_{\text{regen}} \times \Delta t}{E_{\text{batt\_eff}}}$$
- **Phase Transition Trigger**: When altitude drops to $h \le 200.0\text{ m}$:
  $$\text{If } h \le 200.0\text{ m} \implies \text{Phase} \to \text{PHASE\_LANDING}$$

---

## 🛬 Phase 6: Landing Phase (`landing`) & Completion

### 1. WHAT is the Landing Phase?
The Landing Phase controls final approach, flare, and touchdown from $h = 200\text{ m}$ down to ground contact ($h \le 5.0\text{ m}$).

### 2. WHY is the Landing Phase configured this way?
- **Stall Protection**: Airspeed is maintained at $1.10 \times V_{\text{stall}}$ to provide pitch control authority during flare while minimizing landing ground roll.
- **Touchdown Deceleration**: Gentle sink rate ($\dot{h} = -0.8\text{ m/s}$) prevents gear shock overload upon touchdown.
- **Airworthiness Reserve Verification**: Verifies STANAG 4671 30-minute reserve fuel/battery energy compliance upon landing.

### 3. HOW does Landing work in the codebase?
- **Approach Speed & Sink Rate**: Airspeed $V = \max(1.1 V_{\text{stall}}, 22.0\text{ m/s})$, sink rate $\dot{h} = -0.8\text{ m/s}$.
- **Phase Completion Trigger**: When altitude drops below $5.0\text{ m}$:
  $$\text{If } h \le 5.0\text{ m} \implies \text{Phase} \to \text{PHASE\_COMPLETED}, \text{Terminated} = \text{True}$$
- **Terminal Reward**: Environment awards a massive $+500.0$ reward for successful completion without stall or power deficit.
