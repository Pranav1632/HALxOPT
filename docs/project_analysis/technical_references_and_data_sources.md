# 📚 Technical References, Textbooks & Data Sources Bibliography

> **Project:** AeroOptima — Tactical Hybrid-Electric UAV Sizing & Optimization (HAL × IIT Indore)  
> **File:** `docs/project_analysis/technical_references_and_data_sources.md`  
> **Purpose:** Document the engineering textbooks, industry datasheets, research papers, and military standards from which AeroOptima's flight physics, engine scaling, electric motors, battery chemistries, and RL algorithms were sourced.

---

## ✈️ 1. Aerospace Engineering, Flight Mechanics & Atmosphere

### 1.1 International Standard Atmosphere (ISA) Model
- **Source:** *U.S. Standard Atmosphere, 1976* (NASA-TM-X-74191 / NOAA).
- **Equations Used:** Barometric lapse rate equations in the troposphere layer ($0$ to $11,000\text{ m}$):
  $$\rho(h) = \rho_0 \left(1.0 - 2.25577 \times 10^{-5} h\right)^{4.25588}$$
- **Code Reference:** [`backend/environment.py` L168–177](file:///d:/project/HAL/backend/environment.py#L168-L177).

### 1.2 Aircraft Conceptual Design & Sizing
- **Textbook:** Raymer, Daniel P., *Aircraft Design: A Conceptual Approach*, AIAA Education Series (Fifth Edition).
- **Application:**
  - Oswald span efficiency factor ($e \approx 0.85$) for high-aspect-ratio tactical UAVs.
  - Parabolic drag polar equations: $C_D = C_{D0} + \frac{C_L^2}{\pi AR e}$.
  - Weight fraction analysis for empty weight ratio ($W_e/W_0 \approx 0.47$) and composite airframe sizing (35% fraction).
- **Code Reference:** [`backend/environment.py` L215–224](file:///d:/project/HAL/backend/environment.py#L215-L224).

### 1.3 Aerodynamic Drag & Lift Calculations
- **Textbook:** Anderson, John D., *Introduction to Flight*, McGraw-Hill Series in Aeronautical and Aerospace Engineering.
- **Application:** Lift coefficient equations under flight path angle $\gamma$ (climb/descent slopes):
  $$C_L = \frac{2 \cdot m \cdot g \cdot \cos(\gamma)}{\rho \cdot V^2 \cdot S}$$
- **Code Reference:** [`backend/environment.py` L221–224](file:///d:/project/HAL/backend/environment.py#L221-L224).

---

## ⚙️ 2. Propulsion Sizing & Engine Power Derating

### 2.1 Altitude Power Derating (Gagg-Ferrar Model)
- **Research Paper:** Gagg, R. F., and Ferrar, E. G., *"Altitude Performance of Aircraft Engines,"* SAE Transactions, Vol. 29, 1934, pp. 217-225.
- **Equations Used:** Nonlinear correction coefficient for engine shaft power lapse as a function of density ratio $\sigma = \rho/\rho_{\text{SL}}$:
  $$P_{\text{avail}}(h) = P_{\text{rated, SL}} \cdot \left(\sigma - \frac{1 - \sigma}{7.55}\right)$$
- **Code Reference:** Added to altitude adjustment routines in the flight simulator loop.

### 2.2 Engine SFC Baseline & Fuel Consumption
- **Manufacturer Datasheet:** Rotax Aircraft Engines, *Rotax 916 iS / 915 iS Engine Manual & Fuel Consumption Curve Sheets*.
- **Application:** Sourced base Specific Fuel Consumption (SFC) of $0.38\text{ kg/kWh}$ (approx. $280\text{ g/kWh}$) and scaled base engine weight fractions from Reference Power ($100\text{ kW}$) and Weight ($85\text{ kg}$).
- **Code Reference:** [`backend/environment.py` L82-86](file:///d:/project/HAL/backend/environment.py#L82-L86) & [`backend/environment.py` L238-255](file:///d:/project/HAL/backend/environment.py#L238-L255).

---

## ⚡ 3. Electric Motors & Battery Electro-Chemistry

### 3.1 EMRAX Axial-Flux Electric Motor Specs
- **Manufacturer Datasheet:** EMRAX Motors Ltd., *EMRAX 228 Medium Voltage (MV) Technical Datasheet & Performance Charts*.
- **Data Points Sourced:**
  - Continuous shaft power: **$55\text{ kW}$**
  - Peak torque boost capacity: **$109\text{ kW}$**
  - Drive weight: **$12.3\text{ kg}$** (Stator + Rotor + Liquid Coolant Jacket)
  - Peak electrical conversion efficiency: **$96.0\%$**
- **Code Reference:** [`backend/environment.py` L112–115](file:///d:/project/HAL/backend/environment.py#L112-L115).

### 3.2 Battery Specific Energy & Chemistry (Silicon Anode NMC 811)
- **Technical Whitepaper:** Amprius Technologies Inc., *High-Energy Silicon Nanowire Lithium-Ion Battery Datasheet for Aerospace & HALE UAVs*.
- **Data Points Sourced:** High-Nickel NMC 811 cells showing $260\text{ Wh/kg}$ pack-level density (including casing, BMS, wiring, and coolant) vs. $310\text{ Wh/kg}$ cell-level density.
- **Code Reference:** [`backend/environment.py` L91-93](file:///d:/project/HAL/backend/environment.py#L91-L93).

### 3.3 Low-Temperature Battery Capacity & Resistance Scaling
- **Academic Paper:** Cho, W., et al., *"Low-temperature performance degradation and internal resistance characteristics of Lithium-ion batteries,"* Journal of Power Sources, Vol. 196, 2011, pp. 6803-6811.
- **Application:** Sourced exponential resistance multipliers ($R_{\text{int}}$ scaling up by 3× to 5× at temperatures below $-20^\circ\text{C}$).
- **Code Reference:** [`docs/aerospace_physics/battery_thermal_analysis.md`](file:///d:/project/HAL/docs/aerospace_physics/battery_thermal_analysis.md).

---

## 🤖 4. Optimal Control, Genetic Algorithms & Reinforcement Learning

### 4.1 Hybrid Power-Split Energy Management Strategies
- **Academic Paper:** Zhang, F., et al., *"Deep Reinforcement Learning-Based Energy Management Strategy for Hybrid Electric UAVs under Wind Disturbances,"* IEEE Transactions on Aerospace and Electronic Systems, 2021.
- **Application:** 9-dimensional state space mapping ($\vec{s}_t = [h, V, \text{SoC}, m_{\text{fuel}}, P_{\text{req}}, \dots]$) and continuous action-space shaping for hybrid Power Split Ratio ($\text{PSR} \in [0.0, 1.0]$).
- **Code Reference:** [`backend/environment.py` L258-300](file:///d:/project/HAL/backend/environment.py#L258-L300).

### 4.2 Genetic Sizing & Evolutionary Computation (DEAP)
- **Framework Reference:** Fortin, F. A., et al., *"DEAP: Evolutionary Algorithms Made Easy,"* Journal of Machine Learning Research, Vol. 13, 2012, pp. 2171-2175.
- **Application:** Non-dominated Sorting Genetic Algorithm (NSGA-II) operators, multi-point crossover, and Gaussian mutation bounds.
- **Code Reference:** [`backend/optimizer.py`](file:///d:/project/HAL/backend/optimizer.py).

---

## 🛡️ 5. Defense Airworthiness & Certification Standards

### 5.1 NATO STANAG 4671 (UAS Airworthiness)
- **Standard:** NATO Standardization Agreement (STANAG) 4671, *Unmanned Aerial Systems Airworthiness Requirements (USAR)*.
- **Application:** Mandating single-fault tolerance redundancy guidelines (requiring level cruise capability if battery or engine fails completely in mid-flight).

### 5.2 US DoD MIL-HDBK-516C
- **Standard:** United States Department of Defense Joint Service Specification Guide, *Airworthiness Certification Criteria (MIL-HDBK-516C)*.
- **Application:** Software design validation logic (Pydantic models checking boundary constraints inside endpoints to prevent un-physical inputs).
- **Code Reference:** [`backend/main.py` L87–102](file:///d:/project/HAL/backend/main.py#L87-L102).

---

*Citations and datasheets compiled for the AeroOptima project (Team HAL × IIT Indore).*
