# ⚙️ Hardware Component & Powertrain Glossary

> **Project:** AeroOptima — Hybrid-Electric Tactical UAV Optimization Platform (HAL × IIT Indore)  
> **Directory:** `docs/doc2_glossary/component_glossary.md`  
> **Purpose:** Detailed technical specifications, mathematical parameters, full forms, and operational mechanics of all propulsion, energy, aerodynamic, and structural hardware components.

---

## ⚡ 1. Primary Electric Propulsion Motor

### 1.1 EMRAX 228 MV — Axial-Flux Permanent Magnet Synchronous Motor (PMSM)
* **Full Form:** Permanent Magnet Synchronous Motor (PMSM) / Medium Voltage (MV) Variant
* **Key Specifications:**
  - **Mass ($m_{\text{motor}}$):** $12.3\text{ kg}$
  - **Continuous Power Rating:** $55.0\text{ kW}$
  - **Peak Power Rating:** $109.0\text{ kW}$
  - **Peak Electrical Efficiency ($\eta_{\text{motor}}$):** $96.0\%$ ($0.96$)
  - **Power Density:** $8.86\text{ kW/kg}$ (Peak)
* **Detailed Mechanical Role:**
  The EMRAX 228 MV is a ultra-high torque density axial-flux electric motor directly coupled to the propeller drive shaft. It serves two primary operational roles:
  1. **Motor Drive Mode:** Delivers instantaneous peak torque boost (<10 ms response) during Takeoff and Climb phases, reducing turboshaft engine sizing requirements.
  2. **Starter-Generator Mode:** Cranks the turboshaft crankshaft to ignition speed ($1,500\text{ RPM}$) in $<1.5\text{ s}$ when exiting Silent Loiter mode.

---

## 🛢️ 2. Primary Thermal Powerplant (Internal Combustion Engine)

### 2.1 Scalable Turboshaft Gas Turbine Engine
* **Full Form:** Internal Combustion Engine (ICE) / Turboshaft Gas Turbine
* **Key Specifications:**
  - **Reference Power ($P_{\text{ref}}$):** $67.5\text{ kW}$
  - **Reference Mass ($m_{\text{ref}}$):** $35.0\text{ kg}$
  - **Base Specific Fuel Consumption ($\text{SFC}_{\text{base}}$):** $0.38\text{ kg/kWh}$ ($380\text{ g/kWh}$)
  - **Fuel Type:** Heavy Aviation Fuel (Jet A-1 / JP-8, energy density ~12,000 Wh/kg)
* **Mass Scaling Model:**
  $$m_{\text{engine}} = \left(\frac{P_{\text{engine, continuous}}}{P_{\text{ref}}}\right) \times m_{\text{ref}}$$
* **Detailed Mechanical Role:**
  Provides primary sustained mechanical shaft power during Cruise and Loiter phases. Sized dynamically by the outer-loop Genetic Algorithm between $30\text{ kW}$ and $120\text{ kW}$.

---

## 🔋 3. Energy Storage System (Battery Pack)

### 3.1 High-Energy Density Battery Pack (Li-NMC 811 / NCA Chemistry)
* **Full Forms:**
  - **Li-NMC:** Lithium Nickel Manganese Cobalt Oxide (8:1:1 ratio)
  - **NCA:** Lithium Nickel Cobalt Aluminum Oxide
* **Key Specifications:**
  - **Base Energy Density ($e_{\text{density}}$):** $250.0\text{ Wh/kg}$ (Pack Level)
  - **Operating SoC Window:** $10\%$ ($0.10$) Minimum to $95\%$ ($0.95$) Maximum
  - **Continuous Discharge C-Rate:** $3.0\text{C}$
  - **Peak Transient Discharge C-Rate:** $5.0\text{C}$
* **Mass Sizing Model:**
  $$m_{\text{battery}} = \frac{E_{\text{battery, kWh}} \times 1000}{e_{\text{density}}}$$
* **C-Rate Bounded Power Limit:**
  $$P_{\text{batt, max}} = E_{\text{battery, kWh}} \times C_{\text{rate}}$$
* **Detailed Role:** Supplies electrical energy for high-torque takeoff boost and powers the aircraft during Silent Stealth Loiter (ICE shut down). A recommended 20 kWh pack weighs $80\text{ kg}$ (8% of MTOW).

---

## 🔌 4. Electrical Bus & Power Distribution Architecture

### 4.1 800V DC High-Voltage Power Bus
* **Full Form:** Direct Current (DC) High-Voltage Bus Architecture
* **Key Specifications:**
  - **Nominal System Voltage:** $800\text{ V DC}$ (vs. standard 400V DC)
  - **Wiring Thermal Loss Reduction:** $75\%$ reduction ($P_{\text{loss}} = I^2 R$)
  - **Harness Mass Reduction:** $\sim 12.0\text{ kg}$ saved in airframe copper wiring
* **Detailed Role:**
  Doubling the bus voltage from 400V to 800V halves the electrical current ($I = P / V$) required to deliver identical motor power. Lower current allows thinner copper wiring, drastically cutting resistive heat generation ($I^2 R$) and saving airframe mass.

---

## 🛩️ 5. Aerodynamic Airframe & Wing Structure

### 5.1 High-Aspect Ratio Tactical Composite Airframe
* **Key Specifications:**
  - **Structural Airframe Mass ($m_{\text{airframe}}$):** $350.0\text{ kg}$
  - **Wingspan ($b$):** $15.0\text{ m}$
  - **Wing Surface Area ($S$):** $14.0\text{ m}^2$
  - **Aspect Ratio ($AR$):** $16.07$ ($AR = b^2 / S = 15^2 / 14$)
  - **Zero-Lift Parasite Drag ($C_{D0}$):** $0.025$
  - **Oswald Span Efficiency ($e$):** $0.85$
  - **Maximum Lift Coefficient ($C_{L,\max}$):** $1.50$
* **Detailed Role:** High aspect ratio composite wing reduces induced drag coefficient ($C_{Di} = C_L^2 / (\pi \cdot AR \cdot e)$) during long-endurance loiter phases.

---

## 📦 6. Mass Budget & Payload Components

### 6.1 Mission Payload & Fuel Capacity
* **Key Specifications:**
  - **Payload Mass ($m_{\text{payload}}$):** $200.0\text{ kg}$ (Synthetic Aperture Radar / EO/IR Turret)
  - **Fuel Mass Budget ($m_{\text{fuel}}$):** $322.7\text{ kg}$ (GA Sized Baseline)
  - **Empty Mass + Payload ($m_{\text{empty+payload}}$):** $677.3\text{ kg}$
* **MTOW Weight Balance Formula:**
  $$\text{MTOW} = m_{\text{airframe}} + m_{\text{payload}} + m_{\text{engine}} + m_{\text{motor}} + m_{\text{battery}} + m_{\text{fuel}} \le 1,000\text{ kg}$$
