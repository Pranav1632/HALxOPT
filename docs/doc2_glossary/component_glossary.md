# ⚙️ Hardware Powertrain & Systems Engineering Masterclass

> **Project:** AeroOptima — Tactical Hybrid-Electric UAV Sizing & Control Optimization Platform (HAL × IIT Indore)  
> **Directory:** `docs/doc2_glossary/component_glossary.md`  
> **Target Audience:** Hardware Engineers, Software Developers, Systems Designers, and Evaluation Judges.  
> **Goal:** Comprehensive engineering breakdown of all propulsion, power electronics, energy storage, aerodynamic airframe, and sensor hardware components.

---

## 🔌 Section 1: Powertrain Architecture Topologies

Before diving into individual components, team members must understand the **three hybrid propulsion layouts**:

```
 1. PARALLEL HYBRID TOPOLOGY (Our Selected Baseline)
 ┌──────────────┐    Mechanical Shaft Coupling
 │ ICE Engine   ├──────────────────────────────┐
 └──────────────┘                              │
                                               ▼
 ┌──────────────┐    Mechanical Shaft Coupling ┌──────────────┐     Thrust (N)
 │ Electric Motor├────────────────────────────►│ Propeller /  ├─────────────────►
 └──────▲───────┘                              │ Gearbox      │
        │ Electrical Power (DC)                └──────────────┘
 ┌──────┴───────┐
 │ Battery Pack │
 └──────────────┘

 2. SERIES HYBRID TOPOLOGY (Range Extender Layout)
 ┌──────────────┐      Mechanical       ┌──────────────┐      Electrical (DC)      ┌──────────────┐
 │ ICE Engine   ├──────────────────────►│ Generator    ├──────────────────────────►│ Battery Bus  │
 └──────────────┘                       └──────────────┘                           └──────┬───────┘
                                                                                          │ Electrical
                                                                                          ▼
                                                                                   ┌──────────────┐
                                                                                   │ Electric Motor│
                                                                                   └──────┬───────┘
                                                                                          │ Mechanical
                                                                                          ▼
                                                                                   ┌──────────────┐
                                                                                   │ Propeller    │
                                                                                   └──────────────┘
```

- **Parallel Hybrid (Used in AeroOptima):** Both the thermal engine and electric motor physically connect to the same drive shaft. This allows the engine to be sized small (for cruise) while the electric motor supplies instant torque for takeoff and climb!
- **Series Hybrid:** Engine only drives a generator to charge the battery. Motor does 100% of propeller driving. (Slightly heavier due to double electrical conversion losses).

---

## ⚡ Section 2: Electric Propulsion & Inverter Drive

---

### 2.1 EMRAX 228 MV — Axial-Flux Permanent Magnet Synchronous Motor (PMSM)

#### 💡 Theoretical Physics & Mechanical Role
Standard electric motors use **Radial-Flux** designs (magnetic flux flows radially out from the center shaft). The **EMRAX 228** uses an **Axial-Flux** topology (magnetic flux flows parallel to the rotation axis across thin disk rotors). This provides **3× higher torque density per kilogram** than standard industrial motors!

#### 📐 Detailed Technical Specifications
- **Manufacturer & Model:** EMRAX 228 Medium Voltage (MV) Variant
- **Motor Mass ($m_{\text{motor}}$):** $12.3\text{ kg}$ (Fixed off-the-shelf component)
- **Continuous Mechanical Power:** $55.0\text{ kW}$
- **Peak Transient Power (30s Burst):** $109.0\text{ kW}$
- **Peak Electrical Efficiency ($\eta_{\text{motor}}$):** $96.0\%$ ($0.96$)
- **Power Density:** $8.86\text{ kW/kg}$ (Peak) / $4.47\text{ kW/kg}$ (Continuous)
- **Continuous Torque:** $230\text{ Nm}$ / **Peak Torque:** $450\text{ Nm}$

#### 🔄 Dual Operational Modes in Code & Flight
1. **Motor Drive Mode (Takeoff/Climb):** Converts battery DC power into 3-phase AC torque to boost shaft power ($P_{\text{delivered}} = P_{\text{engine}} + P_{\text{motor}}$).
2. **Starter-Generator Mode (In-Flight Restart):** When exiting Silent Stealth Loiter, the BMS pulses high torque into the EMRAX motor, turning it into a starter motor that cranks the turboshaft engine to $1,500\text{ RPM}$ in **$<1.5\text{ seconds}$**!

---

### 2.2 Silicon Carbide (SiC) Dual Inverter Assembly

#### 💡 Theoretical Physics & Mechanical Role
The battery outputs Direct Current (DC), but the EMRAX motor requires 3-Phase Alternating Current (AC). Standard Inverters use Silicon IGBTs which lose 4–6% of power as heat. We use a **Silicon Carbide (SiC) MOSFET Inverter** (Cascadia Motion PM100DX) which switches at high frequencies ($20\text{ kHz}$) with **$>98\%$ power conversion efficiency**.

#### 📐 Key Specifications & Equations
- **Mass:** $5.2\text{ kg}$
- **Operating Voltage Window:** $300\text{ V to } 800\text{ V DC}$
- **Peak Phase Current:** $350\text{ A}_{\text{rms}}$
- **Power Losses:**
  $$P_{\text{loss, inverter}} = P_{\text{in}} \cdot (1.0 - \eta_{\text{inverter}}) \approx 55\text{ kW} \cdot (1.0 - 0.982) = 0.99\text{ kW} \quad (\text{Minimal cooling required})$$

---

## 🛢️ Section 3: Thermal Powerplant (Internal Combustion Engine / Turboshaft)

---

### 3.1 Scalable Heavy-Fuel Turboshaft / Turbocharged ICE

#### 💡 Theoretical Physics & Mechanical Role
Batteries excel at short bursts of high power ($250\text{ Wh/kg}$ energy density), while liquid fuel (Jet A-1) contains immense energy density (**$12,000\text{ Wh/kg}$** — 48× higher than batteries!). The thermal engine acts as the primary endurance engine during high-altitude cruise flight.

#### 📐 Scaling Mass Equations & Specifications
- **Reference Power ($P_{\text{ref}}$):** $67.5\text{ kW}$
- **Reference Dry Weight ($m_{\text{ref}}$):** $35.0\text{ kg}$
- **Base Specific Fuel Consumption ($\text{SFC}_{\text{base}}$):** $0.38\text{ kg/kWh}$ ($380\text{ g/kWh}$)
- **Fuel Type:** Jet A-1 / JP-8 Heavy Aviation Kerosene

#### Linear Mass Scaling Function in `environment.py` (L85):
$$m_{\text{engine}}(P_{\text{size}}) = \left(\frac{P_{\text{engine, continuous}}}{P_{\text{ref}}}\right) \cdot m_{\text{ref}} = \left(\frac{P_{\text{size}}}{67.5}\right) \cdot 35.0\text{ kg}$$

#### Gagg-Ferrar High-Altitude Power Derating Model:
$$\frac{P_{\text{engine, alt}}}{P_{\text{engine, SL}}} = \sigma(h) - \frac{1 - \sigma(h)}{7.55}$$
At $6,000\text{ m}$ ASL ($\sigma = 0.601$), a $64\text{ kW}$ sea-level engine delivers a maximum of **$38.4\text{ kW}$** continuous shaft power!

---

## 🔋 Section 4: High-Voltage Energy Storage & BMS

---

### 4.1 20 kWh High-Density Li-NMC 811 Battery Pack

#### 💡 Theoretical Physics & Battery Chemistry
We utilize **21700 Cylindrical Lithium Nickel Manganese Cobalt Oxide (Li-NMC 811)** cells. NMC 811 chemistry provides an optimal balance between high gravimetric energy density ($250\text{ Wh/kg}$ at pack level) and high discharge C-rate capability.

#### 📐 Detailed Technical Specifications & Limits
- **Pack Gravimetric Density:** $250.0\text{ Wh/kg}$ ($0.250\text{ kWh/kg}$)
- **Mass Sizing Formula:**
  $$m_{\text{battery}} = \frac{E_{\text{battery, kWh}}}{0.250\text{ kWh/kg}} \implies \text{A } 20.0\text{ kWh pack weighs exactly } \mathbf{80.0\text{ kg}}$$
- **C-Rate Discharge Limits:**
  - **Continuous C-Rate:** $3.0\text{C} \implies P_{\text{max, cont}} = 20\text{ kWh} \cdot 3.0 = \mathbf{60.0\text{ kW}}$
  - **Peak C-Rate (30s Surge):** $5.0\text{C} \implies P_{\text{max, peak}} = 20\text{ kWh} \cdot 5.0 = \mathbf{100.0\text{ kW}}$
- **State-of-Charge (SoC) Safety Limits:** $10\%\text{ (0.10) SoC Minimum}$ up to $95\%\text{ (0.95) SoC Maximum}$.

---

### 4.2 800V DC Bus Architecture vs. Standard 400V DC

#### 💡 Why 800V DC is a Game Changer for Aerospace
Doubling system voltage from 400V to 800V cuts electrical current ($I$) in half for identical power delivery ($P = V \cdot I$). According to **Joule's First Law** ($P_{\text{loss}} = I^2 R$), halving current reduces resistive wire heat losses by **75%**!

$$\frac{P_{\text{loss, 800V}}}{P_{\text{loss, 400V}}} = \frac{(I/2)^2 R}{I^2 R} = \frac{1}{4} = 25\% \quad \implies \mathbf{75\%\text{ Thermal Reduction!}}$$

This allows using thinner copper wiring harnesses, saving **~12 kg of dead airframe weight**!

---

## 🛩️ Section 5: Aerodynamics & Carbon Composite Airframe

---

### 5.1 Carbon-Fiber Reinforced Polymer (CFRP) Composite Structure

#### 📐 Airframe Structural Specifications
- **Airframe Structural Mass ($m_{\text{airframe}}$):** $350.0\text{ kg}$ (Fixed 35% fraction of 1,000 kg MTOW)
- **Wingspan ($b$):** $15.0\text{ m}$
- **Wing Surface Area ($S$):** $14.0\text{ m}^2$
- **Aspect Ratio ($AR$):** $16.07$ ($AR = b^2 / S = 15^2 / 14$)
- **Maximum Lift Coefficient ($C_{L,\max}$):** $1.50$ (Without high-lift slats)
- **Zero-Lift Parasite Drag ($C_{D0}$):** $0.025$

```
                   HIGH-ASPECT RATIO WING GEOMETRY
  
 ◄────────────────────────────── Wingspan b = 15.0 m ──────────────────────────────►
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────┘
                                   Chord c = 0.93 m
 Aspect Ratio AR = b² / S = 15.0² / 14.0 = 16.07 (Glider-like high efficiency wing)
```

---

## 📦 Section 6: Tactical Sensor Payload & Mass Allocation

---

### 6.1 L3Harris MX-15D EO/IR + IMSAR NSP-5 SAR Radar Pod

#### 📐 Payload Allocation
- **Payload Mass Budget ($m_{\text{payload}}$):** Fixed at **$200.0\text{ kg}$** (20% of MTOW)
- **Primary Sensors:**
  1. **L3Harris MX-15D EO/IR Turret ($45\text{ kg}$):** High-definition thermal infrared camera with laser designator for target identification.
  2. **IMSAR NSP-5 SAR Radar Pod ($12\text{ kg}$):** All-weather Synthetic Aperture Radar capable of imaging ground targets through dense clouds, fog, and snowstorms.
  3. **Avionics & Mounts ($143\text{ kg}$):** Mission computers, optical windows, gimbal stabilization mounts.

---

> [!TIP]
> **Summary for Team Members:** Refer to this hardware manual when discussing component specifications, electrical calculations, or mass allocations in project documentation and competition presentations!
