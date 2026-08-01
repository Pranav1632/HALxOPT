# 📘 Domain Knowledge Glossary & Concept Masterclass

> **Project:** AeroOptima — Hybrid-Electric Tactical UAV Optimization Platform (HAL × IIT Indore)  
> **Directory:** `docs/doc2_glossary/domain_glossary.md`  
> **Purpose:** Comprehensive reference for domain-specific terminology, full forms, mathematical foundations, and detailed concepts across Aerospace Physics, Evolutionary Optimization, Reinforcement Learning, and Defense Certification.

---

## 🚁 1. Aerospace Engineering & Flight Dynamics Domain

### 1.1 MTOW — Maximum Takeoff Weight
* **Full Form:** Maximum Takeoff Weight
* **Definition:** The absolute maximum mass threshold at which an aircraft is certified to attempt a takeoff safely.
* **Detailed Explanation:** In AeroOptima, MTOW is fixed at **1,000 kg** ($9,810\text{ N}$). It forms a strict boundary constraint in the outer-loop Genetic Algorithm. Every kilogram of propulsion hardware (engine, motor, battery) directly reduces the allowable mass budget for fuel ($W_{\text{fuel}}$) and payload ($W_{\text{payload}}$).

### 1.2 ISA — International Standard Atmosphere
* **Full Form:** International Standard Atmosphere
* **Definition:** A standardized static model of atmospheric temperature ($T$), pressure ($P$), and density ($\rho$) as a function of altitude ($h$).
* **Detailed Explanation:** Standard Sea-Level (SSL) air density is $\rho_0 = 1.225\text{ kg/m}^3$. In the Troposphere ($h < 11,000\text{ m}$), density decreases non-linearly:
  $$\rho(h) = \rho_0 \left(1.0 - 2.25577 \times 10^{-5} h\right)^{4.25588}$$
  As altitude rises, lower air density reduces wing lift generation and engine intake oxygen mass flow rate, while increasing True Airspeed required to maintain level flight.

### 1.3 TAS / IAS / EAS — Airspeed Definitions
* **Full Forms:**
  - **TAS:** True Airspeed
  - **IAS:** Indicated Airspeed
  - **EAS:** Equivalent Airspeed
* **Definition:**
  - **IAS:** Speed uncorrected for atmospheric density, directly read from pitot-static instruments.
  - **TAS:** Actual physical velocity of the aircraft relative to the surrounding air mass.
* **Detailed Explanation:** True Airspeed scales inversely with the square root of the atmospheric density ratio $\sigma = \rho / \rho_0$:
  $$V_{\text{TAS}} = \frac{V_{\text{IAS}}}{\sqrt{\sigma}}$$
  At high-altitude corridors (e.g., 5,000 m ASL where $\sigma \approx 0.60$), a UAV maintaining an IAS of $53.5\text{ m/s}$ actually travels at a True Airspeed of $69.4\text{ m/s}$ ($250\text{ km/h}$).

### 1.4 Oswald Drag Polar & Aspect Ratio
* **Full Form:** $AR$ = Aspect Ratio; $e$ = Oswald Span Efficiency Factor
* **Definition:** Mathematical formulation modeling total drag coefficient ($C_D$) as the sum of zero-lift parasite drag ($C_{D0}$) and lift-induced drag ($C_{Di}$).
* **Detailed Explanation:**
  $$C_D = C_{D0} + \frac{C_L^2}{\pi \cdot AR \cdot e}$$
  Where $AR = b^2 / S = 15^2 / 14 = 16.07$ (wingspan $b=15\text{ m}$, area $S=14\text{ m}^2$) and $e=0.85$. High aspect ratio wings minimize induced drag during long-endurance loiter phases where Lift Coefficient ($C_L$) is high.

### 1.5 SFC — Specific Fuel Consumption
* **Full Form:** Specific Fuel Consumption
* **Definition:** Rate of fuel mass burned per unit of mechanical shaft power generated over time ($\text{kg/kWh}$ or $\text{g/kW}\cdot\text{h}$).
* **Detailed Explanation:** Base turboshaft SFC is $\text{SFC}_{\text{base}} = 0.38\text{ kg/kWh}$. Small gas turbines degrade severely when operating below 50% of continuous rated power (partial-load penalty), increasing fuel burn by up to **+40%**.

---

## 🧬 2. Evolutionary Computation & Sizing Domain

### 2.1 GA — Genetic Algorithm
* **Full Form:** Genetic Algorithm
* **Definition:** An evolutionary optimization heuristic inspired by natural selection, used to solve non-convex continuous search problems.
* **Detailed Explanation:** Implemented in `optimizer.py` using the DEAP framework. The chromosome represents two continuous design variables: `[engine_size_kw, battery_capacity_kwh]`. The GA breeds candidate solutions across generations using blend crossover (`cxBlend`) and Gaussian mutation (`mutGaussian`).

### 2.2 Pareto Frontier & NSGA-II
* **Full Form:** Non-Dominated Sorting Genetic Algorithm II
* **Definition:** Multi-objective evolutionary optimization technique that discovers the trade-off boundary (Pareto Front) where no single objective can be improved without degrading another.
* **Detailed Explanation:** Evaluates trade-offs between 3 competing UAV objectives: (1) Maximize Flight Endurance, (2) Minimize Infrared Thermal Signature, and (3) Minimize Total Propulsion Mass.

### 2.3 BO / GP — Bayesian Optimization & Gaussian Process
* **Full Form:** Bayesian Optimization / Gaussian Process
* **Definition:** A surrogate-guided optimization technique that fits a probabilistic surrogate model over expensive simulation evaluations.
* **Detailed Explanation:** Uses Expected Improvement (EI) acquisition functions to sample only high-potential candidate sizing parameters, accelerating convergence by **10–15×** (reducing evaluation rollouts from 600 to ~40).

---

## 🤖 3. Reinforcement Learning & Control Domain

### 3.1 MDP — Markov Decision Process
* **Full Form:** Markov Decision Process
* **Definition:** Mathematical framework for modeling discrete-time decision making where outcomes are partly random and partly under the control of a decision agent.
* **Detailed Explanation:** Defined by 5-tuple $(\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma)$:
  - **State ($\mathcal{S}$):** 5D observation vector `[Altitude, Airspeed, Battery SoC, Fuel Mass, Power Required]`.
  - **Action ($\mathcal{A}$):** Continuous Power Split Ratio $\text{PSR} \in [0.0, 1.0]$.
  - **Reward ($\mathcal{R}$):** Dense continuous reward shaping fuel economy and airworthiness survival.

### 3.2 SAC / PPO — Soft Actor-Critic & Proximal Policy Optimization
* **Full Forms:**
  - **SAC:** Soft Actor-Critic
  - **PPO:** Proximal Policy Optimization
* **Definitions:**
  - **SAC:** Off-policy, actor-critic deep RL algorithm based on maximum entropy RL.
  - **PPO:** On-policy policy gradient algorithm using clipped surrogate objective functions.
* **Detailed Explanation:** SAC is ideal for continuous propulsion control ($\text{PSR} \in [0, 1]$) because its entropy maximization term encourages exploration of optimal motor-engine load sharing while preventing premature policy convergence.

### 3.3 XAI & SHAP — Explainable Artificial Intelligence
* **Full Forms:**
  - **XAI:** Explainable Artificial Intelligence
  - **SHAP:** SHapley Additive exPlanations
* **Definition:** Methods used to interpret black-box machine learning models by quantifying feature contribution scores.
* **Detailed Explanation:** Used to extract human-auditable decision trees and feature importance plots from trained deep RL policies to satisfy defense airworthiness certification standards (**MIL-HDBK-516C**).

---

## 🛡️ 4. Military Defense & Airworthiness Standards Domain

### 4.1 NATO STANAG 4671
* **Full Form:** NATO Standardization Agreement 4671
* **Definition:** Unified airworthiness requirements for military Unmanned Aerial Systems (UAS).
* **Detailed Explanation:** Mandates single-fault redundancy. In AeroOptima, if the battery fails completely, the turboshaft engine provides sufficient single-source power ($60\text{ kW}$ vs. $55.8\text{ kW}$ required) for indefinite cruise flight.

### 4.2 MIL-HDBK-516C
* **Full Form:** Military Handbook 516C — Airworthiness Certification Criteria
* **Definition:** US Department of Defense standard establishing airworthiness certification criteria for airborne systems.
* **Detailed Explanation:** Governs safety-critical software and control system verification, requiring deterministic fault handling and interpretable control logic for all autonomous flight modes.
