# Concepts and Formulae Explanation: What, Why, and How

This document contains a comprehensive mathematical and theoretical catalog of all formulas, physics models, energy dynamics, optimization routines, and Reinforcement Learning mechanisms implemented in the AeroOptima UAV platform.

Each section explains **WHAT** the concept/formula is, **WHY** it is derived/used, and **HOW** it is evaluated mathematically and computationally.

---

## 🌐 Section 1: International Standard Atmosphere (ISA 1976) & Weather Physics

### 1. Temperature vs Altitude Formula
#### WHAT is it?
Calculates ambient air temperature $T(h)$ as a function of geometric altitude $h$ up to the troposphere boundary ($11,000\text{ m}$).
#### WHY is it used?
Air density, speed of sound, battery thermal limits, and aerodynamic drag all depend directly on atmospheric temperature.
#### HOW is it calculated?
$$T(h) = T_{\text{sea\_level}} - L \cdot h$$
Where:
- $T_{\text{sea\_level}} = 288.15\text{ K}$ ($15^\circ\text{C}$ standard sea-level temperature)
- $L = 0.0065\text{ K/m}$ (Standard tropospheric lapse rate)
- Code location: [`atmosphere.py`](file:///d:/project/HAL/backend/physics/atmosphere.py#L12)

---

### 2. Barometric Air Density Formula
#### WHAT is it?
Determines atmospheric density $\rho(h)$ at altitude $h$.
#### WHY is it used?
Lift force $L = \frac{1}{2}\rho V^2 S C_L$, drag force, stall speed, and turboshaft oxygen derating require precise density evaluation.
#### HOW is it calculated?
$$\rho(h) = \rho_0 \left(1 - \frac{L \cdot h}{T_0}\right)^{\left(\frac{g_0 \cdot M}{R \cdot L} - 1\right)}$$
Where:
- $\rho_0 = 1.225\text{ kg/m}^3$ (Sea-level air density)
- $g_0 = 9.80665\text{ m/s}^2$, $M = 0.0289644\text{ kg/mol}$, $R = 8.31447\text{ J/(mol}\cdot\text{K)}$
- Simplifies exponent to $\approx 4.25588$.
- Code location: [`atmosphere.py`](file:///d:/project/HAL/backend/physics/atmosphere.py#L22)

---

## 🛩️ Section 2: Aerodynamics & Flight Physics

### 3. Wing Aspect Ratio ($AR$)
#### WHAT is it?
Geometric ratio of squared wingspan to wing planform area.
#### WHY is it used?
High aspect ratio wings reduce induced drag coefficient $C_{Di}$, enabling long loiter endurance for tactical UAVs.
#### HOW is it calculated?
$$AR = \frac{b^2}{S}$$
Where $b = 18.5\text{ m}$ (wingspan) and $S = 22.0\text{ m}^2$ (wing area). $AR \approx 15.56$.
- Code location: [`aerodynamics.py`](file:///d:/project/HAL/backend/physics/aerodynamics.py#L10)

---

### 4. Aerodynamic Stall Speed ($V_{\text{stall}}$)
#### WHAT is it?
Minimum steady airspeed required to generate lift equal to total aircraft weight before stall boundary $C_{L,\max} = 1.5$.
#### WHY is it used?
Prevents loss of control. Ensures takeoff, climb, cruise, and landing operational speeds remain strictly above stall thresholds.
#### HOW is it calculated?
$$V_{\text{stall}} = \sqrt{\frac{2 \cdot m \cdot g}{\rho \cdot S \cdot C_{L,\max}}}$$
- Code location: [`aerodynamics.py`](file:///d:/project/HAL/backend/physics/aerodynamics.py#L17)

---

### 5. Aerodynamic Drag Coefficient Breakdown ($C_D$)
#### WHAT is it?
Total drag coefficient combining zero-lift parasite drag ($C_{D0}$), induced drag ($C_{Di}$), sideslip drag ($C_{D\beta}$), and compressibility drag ($C_{D,\text{mach}}$).
#### WHY is it used?
Accurately quantifies resistance forces resisting forward flight under varying flight angles and speeds.
#### HOW is it calculated?
$$C_D = C_{D0} + C_{Di} + C_{D\beta} + C_{D,\text{mach}}$$
$$C_{Di} = \frac{C_L^2}{\pi \cdot AR \cdot e}$$
$$C_{D\beta} = 0.5 \cdot \beta^2$$
$$C_{D,\text{mach}} = C_{D0} \cdot \left(\frac{1}{\sqrt{1 - M^2}} - 1\right) \quad (\text{for } 0.4 < M < 0.95)$$
Where:
- $C_{D0} = 0.022$ (Parasite drag coefficient)
- $e = 0.85$ (Oswald efficiency factor)
- $\beta = \text{sideslip angle in radians}$
- Code location: [`aerodynamics.py`](file:///d:/project/HAL/backend/physics/aerodynamics.py#L90-L105)

---

### 6. Power Required Formula ($P_{\text{req}}$)
#### WHAT is it?
Total mechanical power required at the propeller shaft to sustain flight speed $V$ and rate of climb $\dot{h}$.
#### WHY is it used?
Establishes the fundamental energy demand that must be satisfied by the hybrid power source ($P_{\text{motor}} + P_{\text{engine}}$).
#### HOW is it calculated?
$$P_{\text{aero}} = \frac{D \cdot V}{1000 \cdot \eta_{\text{prop}}} \quad (\text{kW})$$
$$P_{\text{climb}} = \frac{m \cdot g \cdot \dot{h}}{1000 \cdot \eta_{\text{prop}}} \quad (\text{kW})$$
$$P_{\text{req}} = P_{\text{aero}} + P_{\text{climb}}$$
Where $\eta_{\text{prop}}$ is the advance ratio propeller efficiency ($0.65 - 0.86$).
- Code location: [`propulsion.py`](file:///d:/project/HAL/backend/physics/propulsion.py#L40)

---

## ⚡ Section 3: Hybrid Propulsion & Battery Thermal Models

### 7. Power-Split Ratio ($\alpha$) & Energy Conservation
#### WHAT is it?
The continuous control parameter governing the fraction of required power supplied by the electric motor versus the turboshaft engine.
#### WHY is it used?
Enables hybrid energy management. High $\alpha$ optimizes instantaneous torque and zero emissions; low $\alpha$ utilizes high energy density of liquid aviation fuel.
#### HOW is it calculated?
$$P_{\text{motor demand}} = \alpha \cdot P_{\text{req}}$$
$$P_{\text{engine demand}} = (1 - \alpha) \cdot P_{\text{req}}$$
$$P_{\text{delivered}} = P_{\text{motor}} + P_{\text{engine}}$$
- Code location: [`uav_env.py`](file:///d:/project/HAL/backend/env/uav_env.py#L292-L293)

---

### 8. Gagg-Ferrar Turboshaft Altitude Power Derating
#### WHAT is it?
Empirical altitude derating formula scaling internal combustion engine max power output based on ambient air density.
#### WHY is it used?
Turboshafts suffer power drop at high altitudes due to reduced oxygen intake.
#### HOW is it calculated?
$$\text{Derate}(h) = \frac{\rho(h)}{\rho_0} - \frac{1 - \frac{\rho(h)}{\rho_0}}{7.55}$$
$$P_{\text{engine max}}(h) = P_{\text{engine base}} \cdot \text{Derate}(h)$$
- Code location: [`propulsion.py`](file:///d:/project/HAL/backend/physics/propulsion.py#L12)

---

### 9. Turboshaft Specific Fuel Consumption (SFC) Curve
#### WHAT is it?
Part-load efficiency model calculating fuel consumption rate (kg/kWh) based on engine throttle load factor.
#### WHY is it used?
Turboshaft engines become highly inefficient when throttled below 50% load. SFC modeling forces the optimizer to run the engine near peak efficiency (75-85% load).
#### HOW is it calculated?
$$\text{Load} = \frac{P_{\text{engine}}}{P_{\text{engine max}}}$$
$$\text{SFC}(\text{Load}) = \text{SFC}_{\text{base}} \cdot \left(1.0 + 0.6 \cdot (1.0 - \text{Load})^2\right)$$
$$\dot{m}_{\text{fuel}} = \text{SFC}(\text{Load}) \cdot P_{\text{engine}} \quad (\text{kg/h})$$
- Code location: [`propulsion.py`](file:///d:/project/HAL/backend/physics/propulsion.py#L25)

---

### 10. Battery Thermal Capacity Derating & C-Rate Limits
#### WHAT is it?
Battery capacity reduction factor $f_{\text{temp}}(T)$ and maximum discharge power limit.
#### WHY is it used?
Sub-zero temperatures drastically degrade Li-Ion battery electrolyte conductivity and usable capacity.
#### HOW is it calculated?
$$f_{\text{temp}}(T) = 1.0 - 0.005 \cdot \max(0, 15.0 - T_{\text{ambient}})$$
$$E_{\text{batt eff}} = E_{\text{batt nominal}} \cdot f_{\text{temp}}(T)$$
$$P_{\text{batt max}} = \min(P_{\text{motor rating}}, E_{\text{batt eff}} \cdot C_{\text{rate max}})$$
- Code location: [`battery.py`](file:///d:/project/HAL/backend/physics/battery.py#L15)

---

### 11. Regenerative Descent Energy Recovery ($P_{\text{regen}}$)
#### WHAT is it?
Electric motor regeneration equation capturing electrical power fed back into the battery during glideslope descent.
#### WHY is it used?
Extends total endurance by capturing potential energy during negative rate of climb ($\dot{h} < 0$).
#### HOW is it calculated?
$$P_{\text{regen}} = \eta_{\text{regen}} \cdot \frac{m \cdot g \cdot |\dot{h}|}{1000} \quad (\text{kW})$$
$$\Delta \text{SoC} = +\frac{P_{\text{regen}} \cdot \Delta t}{3600 \cdot E_{\text{batt eff}}}$$
Where $\eta_{\text{regen}} = 0.35$ (35% net regeneration efficiency).
- Code location: [`propulsion.py`](file:///d:/project/HAL/backend/physics/propulsion.py#L55)

---

## 🧬 Section 4: Genetic Algorithm Sizing Optimization (DEAP)

### 12. GA Chromosome & Fitness Function Formulation
#### WHAT is it?
Outer optimization loop chromosome $\mathbf{x} = [P_{\text{engine}}, E_{\text{battery}}]^T$ search space formulation.
#### WHY is it used?
Finds the global optimal component sizing combination for maximum mission endurance subject to STANAG 4671 MTOW constraints.
#### HOW is it calculated?
- **Chromosome bounds**: $30\text{ kW} \le P_{\text{engine}} \le 120\text{ kW}$, $5\text{ kWh} \le E_{\text{battery}} \le 50\text{ kWh}$.
- **Fitness Evaluation**:
  $$\text{Fitness}(\mathbf{x}) = t_{\text{endurance}} - \text{Penalty}_{\text{MTOW}} - \text{Penalty}_{\text{Airworthiness}}$$
  $$\text{Penalty}_{\text{MTOW}} = 1000 \cdot \max(0, m_{\text{gross}} - m_{\text{MTOW}})$$
- Code location: [`backend/ga/engine.py`](file:///d:/project/HAL/backend/ga/engine.py)

---

## 🤖 Section 5: Proximal Policy Optimization (PPO) Reinforcement Learning

### 13. State Vector Mapping ($\mathcal{S} \in \mathbb{R}^9$)
#### WHAT is it?
Continuous 9D state observation vector passed into the PPO neural network policy.
#### WHY is it used?
Provides the agent complete real-time flight state awareness to decide power split $\alpha$.
#### HOW is it structured?
$$\mathbf{s}_t = \begin{bmatrix} h & V & \text{SoC} & f_{\text{fuel}} & P_{\text{req}} & \text{Load}_{\text{eng}} & \rho & T & \text{Phase}_{\text{ID}} \end{bmatrix}^T$$
State normalization:
$$\bar{s}_0 = \frac{h}{10000}, \quad \bar{s}_1 = \frac{V}{100}, \quad \bar{s}_4 = \frac{P_{\text{req}}}{100}$$
- Code location: [`ppo_agent.py`](file:///d:/project/HAL/backend/rl/ppo_agent.py#L50-L55)

---

### 14. Dual-Head Actor-Critic Neural Network Equations
#### WHAT is it?
2-layer NumPy MLP with shared hidden representation (64 hidden neurons with SiLU activation) branching into Actor ($\alpha$) and Critic ($V(s)$) heads.
#### WHY is it used?
Lightweight, zero-dependency policy inference engine running under $0.5\text{ ms}$ per step.
#### HOW is it calculated?
$$\mathbf{h} = \text{SiLU}\left(\mathbf{W}_1 \bar{\mathbf{s}} + \mathbf{b}_1\right)$$
$$\alpha = \sigma\left(\mathbf{W}_{\text{actor}} \mathbf{h} + b_{\text{actor}}\right) = \frac{1}{1 + e^{-z}}$$
$$V(\mathbf{s}) = \mathbf{W}_{\text{critic}} \mathbf{h} + b_{\text{critic}}$$
- Code location: [`ppo_agent.py`](file:///d:/project/HAL/backend/rl/ppo_agent.py#L41-L59)

---

### 15. Dense Reward Function ($\mathcal{R}_t$)
#### WHAT is it?
Step reward function balancing endurance, SFC economy, stealth loiter, and battery preservation.
#### WHY is it used?
Guides RL agent toward optimal policy convergence without violating safety floors.
#### HOW is it calculated?
$$R_t = 1.0 + R_{\text{SFC}} + R_{\text{SoC}} + R_{\text{Phase}} - P_{\text{Deficit}} - P_{\text{Stall}}$$
Where:
- $R_{\text{SFC}} = 0.5 \times \text{Load}_{\text{eng}}$ (rewards running engine near full throttle)
- $R_{\text{SoC}} = 0.5 \times \text{SoC}$
- $R_{\text{Loiter}} = +5.0$ if stealth loiter achieved ($\alpha > 0.90$)
- $P_{\text{Climb Motor Penalty}} = -10.0 \times (\alpha - 0.05)$ if $\alpha > 0.05$ during climb.
- Code location: [`uav_env.py`](file:///d:/project/HAL/backend/env/uav_env.py#L461-L491)
