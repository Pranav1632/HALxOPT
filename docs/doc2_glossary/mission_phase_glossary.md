# ✈️ Mission Phase-Wise Operations & Control Glossary

> **Project:** AeroOptima — Hybrid-Electric Tactical UAV Optimization Platform (HAL × IIT Indore)  
> **Directory:** `docs/doc2_glossary/mission_phase_glossary.md`  
> **Purpose:** Detailed operational breakdown, physical equations, power management policies, and failure dynamics across all 6 sequential flight phases.

---

## 📋 Mission Profile Overview

```
                          FULL 6-PHASE MISSION PROFILE TIMELINE
                          
    Altitude (m)
      ▲
5,000 ┼                             ┌───────────────────┐               
      │                            ╱│ Phase 3: Cruise   │╲              
      │                           ╱ │ (5,000m @ 250km/h)│ ╲             
      │   ┌───────────────┐      ╱  └─────────┬─────────┘  ╲  ┌────────────────┐
      │  ╱│Phase 2: Climb │─────╱             │             ╲ │Phase 5: Descent│
  200 ┼ ╱ └───────────────┘                   ▼              ╲└───────┬────────┘
      │╱Phase 1: Takeoff             ┌─────────────────┐      ╲       │Phase 6: Landing
    0 ┼──────────────────────────────┤Phase 4: Loiter  ├───────┴──────┴──────────────► Time
                                     └─────────────────┘
```

---

## 🛫 Phase 1: Takeoff (`PHASE_TAKEOFF`)

### 1. Operational Parameters & Thresholds
- **Altitude Envelope:** $0.0\text{ m}$ to $200.0\text{ m}$ ASL
- **Target Airspeed:** $V_{\text{takeoff}} = \max\left(1.15 \cdot V_{\text{stall}}, 25.0\text{ m/s}\right)$
- **Climb Rate ($v_y$):** $+3.0\text{ m/s}$ ($+590\text{ fpm}$)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.65$
- **Peak Discharge State:** $C_{\text{rate}} = 5.0\text{C}$ (Peak battery discharge limit active)

### 2. Power Management Strategy (PSR Policy)
- **Power Split Ratio (PSR):** **$0.65$** ($65\%$ Electric Motor, $35\%$ Turboshaft Engine)
- **Physics Rationale:** Takeoff requires maximum mechanical torque to accelerate the 1,000 kg airframe. Using high motor assist prevents oversizing the turboshaft engine for brief takeoff torque peaks.

---

## ↗️ Phase 2: Climb (`PHASE_CLIMB`)

### 1. Operational Parameters & Thresholds
- **Altitude Envelope:** $200.0\text{ m}$ to Target Altitude ($5,000.0\text{ m}$)
- **Target Airspeed:** $V_{\text{climb}} = \max\left(1.30 \cdot V_{\text{stall}}, 35.0\text{ m/s}\right)$
- **Climb Rate ($v_y$):** $+5.0\text{ m/s}$ ($+984\text{ fpm}$)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.75$

### 2. Power Management Strategy (PSR Policy)
- **Power Split Ratio (PSR):** **$0.50$** ($50\%$ Electric Motor, $50\%$ Turboshaft Engine)
- **Physics Rationale:** Sustained climb against gravity requires high shaft power ($P_{\text{climb}} = W \cdot g \cdot v_y$). The motor assists the engine equally until reaching target cruise altitude.

---

## ✈️ Phase 3: Cruise (`PHASE_CRUISE`)

### 1. Operational Parameters & Thresholds
- **Altitude Envelope:** Target Altitude ($5,000.0\text{ m}$)
- **Target Airspeed:** $V_{\text{cruise}} = \max\left(V_{\text{target}}, 1.25 \cdot V_{\text{stall}}\right) = 69.4\text{ m/s}$ ($250.0\text{ km/h}$)
- **Climb Rate ($v_y$):** $0.0\text{ m/s}$ (Level flight equilibrium)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.85$

### 2. Power Management Strategy (PSR Policy)
- **Power Split Ratio (PSR):** **$0.12$** ($12\%$ Electric Motor assist, $88\%$ Turboshaft Engine)
- **Physics Rationale:** Engine operates near continuous rated power where Specific Fuel Consumption (SFC) is optimal ($L_f \ge 0.8 \implies 0.38\text{ kg/kWh}$). Motor provides minor load-smoothing assist.

---

## 🔄 Phase 4: Loiter & Silent Stealth Loiter (`PHASE_LOITER`)

### 1. Operational Parameters & Thresholds
- **Trigger Condition:** Remaining fuel ratio drops below $40\%$ ($W_{\text{fuel}} / W_{\text{fuel, initial}} < 0.40$)
- **Target Airspeed:** Best endurance speed $V_{\text{loiter}} = \max\left(0.76 \cdot V_{\text{cruise}}, 1.20 \cdot V_{\text{stall}}\right) \approx 52.8\text{ m/s}$ ($190.0\text{ km/h}$)
- **Climb Rate ($v_y$):** $0.0\text{ m/s}$ (Racetrack holding pattern)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.85$

### 2. Dual Operational Modes
* **Mode A: Endurance Loiter ($\text{PSR} = 0.0$):**
  - **Power Split:** $100\%$ Turboshaft Engine ($0\%$ Motor).
  - **Purpose:** Maximizes total mission endurance (up to ~20 hours).
* **Mode B: Silent Stealth Loiter ($\text{PSR} = 1.0$):**
  - **Power Split:** $0\%$ Engine (ICE SHUT DOWN), $100\%$ Electric Motor.
  - **Power Draw:** $P_{\text{battery}} \approx 25.3\text{ kW}$
  - **SoC Drain Rate:** $2.11\%\text{ SoC / minute}$ (~42 minutes max duration on 20 kWh pack).
  - **Tactical Stealth:** $<45\text{ dB}$ acoustic ground signature, zero exhaust thermal IR.

---

## ↘️ Phase 5: Descent (`PHASE_DESCENT`)

### 1. Operational Parameters & Thresholds
- **Trigger Condition:** Critical resource threshold ($W_{\text{fuel}} < 8\%$ and $\text{SoC} < 15\%$)
- **Altitude Envelope:** $5,000.0\text{ m}$ down to $200.0\text{ m}$
- **Target Airspeed:** $V_{\text{descent}} = \max\left(1.20 \cdot V_{\text{stall}}, 30.0\text{ m/s}\right)$
- **Climb Rate ($v_y$):** $-1.5\text{ m/s}$ ($-295\text{ fpm}$ glide-idle descent)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.70$

### 2. Power Management Strategy (PSR Policy)
- **Power Split Ratio (PSR):** **$0.0$** (Engine idle gliding approach)
- **Physics Rationale:** Minimal thrust required. Potential energy loss assists aircraft forward motion.

---

## 🛬 Phase 6: Landing (`PHASE_LANDING`) & Completed

### 1. Operational Parameters & Thresholds
- **Altitude Envelope:** $200.0\text{ m}$ down to $5.0\text{ m}$
- **Target Airspeed:** $V_{\text{landing}} = \max\left(1.10 \cdot V_{\text{stall}}, 22.0\text{ m/s}\right)$
- **Climb Rate ($v_y$):** $-0.8\text{ m/s}$ ($-158\text{ fpm}$ glideslope)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.70$

### 2. Phase 7: Mission Completed (`PHASE_COMPLETED`)
- **Trigger Condition:** Altitude $\le 5.0\text{ m}$
- **Simulation Status:** Mission completed successfully; terminal reward $+500.0$ awarded.
