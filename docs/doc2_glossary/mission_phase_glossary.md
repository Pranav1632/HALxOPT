# ✈️ Mission Phase Operations & Flight Manual Masterclass

> **Project:** AeroOptima — Tactical Hybrid-Electric UAV Sizing & Control Optimization Platform (HAL × IIT Indore)  
> **Directory:** `docs/doc2_glossary/mission_phase_glossary.md`  
> **Target Audience:** Flight Control Engineers, Operators, Software Developers, and Evaluation Judges.  
> **Goal:** Provide a comprehensive operational manual detailing the flight mechanics, power distribution, phase transition conditions, and acoustic/thermal stealth modes across all 6 mission phases.

---

## 🗺️ Master Mission Trajectory & Profile Timeline

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

### 💡 Operational Intuition
Takeoff is the most torque-intensive phase of flight. The 1,000 kg airframe is stationary on the runway and must accelerate rapidly to reach safe flying speed before running out of tarmac. Instead of installing a massive, heavy engine just to supply 30 seconds of high takeoff torque, we use **Electric Motor Torque Assist**!

### 📐 Physics Equations & Parameters
- **Altitude Bounds:** $0.0\text{ m}$ to $200.0\text{ m}$ ASL
- **Target Airspeed:** $V_{\text{takeoff}} = \max\left(1.15 \cdot V_{\text{stall}}, 25.0\text{ m/s}\right) = 27.6\text{ m/s}$ ($99.4\text{ km/h}$)
- **Climb Rate ($v_y$):** $+3.0\text{ m/s}$ ($+590\text{ fpm}$)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.65$ (Low efficiency at low airspeed due to high blade angle of attack)

### 🔌 Power Split Policy (PSR = 0.65)
$$\text{PSR} = 0.65 \implies \begin{cases} P_{\text{motor}} = 0.65 \cdot P_{\text{req}} & (\text{Heavy Electric Torque Boost}) \\ P_{\text{engine}} = 0.35 \cdot P_{\text{req}} & (\text{Partial Engine Throttle}) \end{cases}$$

- **Battery State:** Peak discharge rate active ($C_{\text{rate}} = 5.0\text{C}$). The battery supplies high current surge for rapid acceleration.
- **Phase Exit Trigger:** Altitude reaches $\ge 200.0\text{ m}$.

---

## ↗️ Phase 2: Sustained Climb (`PHASE_CLIMB`)

### 💡 Operational Intuition
Once clear of the runway, the UAV climbs continuously from $200\text{ m}$ up to its cruise altitude ($5,000\text{ m}$). Climbing against gravity requires doing work against potential energy ($P_{\text{climb}} = m \cdot g \cdot v_y$). The electric motor continues assisting the engine equally until cruise altitude is reached.

### 📐 Physics Equations & Parameters
- **Altitude Bounds:** $200.0\text{ m}$ to $5,000.0\text{ m}$ ASL
- **Target Airspeed:** $V_{\text{climb}} = \max\left(1.30 \cdot V_{\text{stall}}, 35.0\text{ m/s}\right) = 35.6\text{ m/s}$ ($128.2\text{ km/h}$)
- **Climb Rate ($v_y$):** $+5.0\text{ m/s}$ ($+984\text{ fpm}$)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.75$

### 🔌 Power Split Policy (PSR = 0.50)
$$\text{PSR} = 0.50 \implies 50\%\text{ Electric Motor} + 50\%\text{ Turboshaft Engine}$$

- **Rate-of-Climb Physics:** Total shaft power required:
  $$P_{\text{req}} = \frac{P_{\text{aero}} + P_{\text{climb}}}{\eta_{\text{prop}}} = \frac{\frac{1}{2}\rho V^3 S C_D + m g v_y}{\eta_{\text{prop}}} \quad [\text{kW}]$$
- **Phase Exit Trigger:** Altitude reaches $\ge \text{Target Altitude } (5,000.0\text{ m})$.

---

## ✈️ Phase 3: High-Altitude Cruise (`PHASE_CRUISE`)

### 💡 Operational Intuition
At $5,000\text{ m}$ altitude, the aircraft levels off and cruises at $250\text{ km/h}$ over long distances toward the target operational theater. Altitude climb power drops to zero ($P_{\text{climb}} = 0$). Now, fuel efficiency is king! The electric motor throttles down, allowing the turboshaft engine to carry 88% of the load in its optimal fuel consumption band ($\ge 80\%$ throttle).

### 📐 Physics Equations & Parameters
- **Altitude Bounds:** Cruise Level ($5,000.0\text{ m}$ ASL)
- **Target Airspeed:** $V_{\text{cruise}} = 69.4\text{ m/s}$ ($250.0\text{ km/h}$ True Airspeed)
- **Climb Rate ($v_y$):** $0.0\text{ m/s}$ (Level flight equilibrium)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.85$ (Peak cruise efficiency)

### 🔌 Power Split Policy (PSR = 0.12)
$$\text{PSR} = 0.12 \implies 88\%\text{ Turboshaft Engine} + 12\%\text{ Electric Motor Assist}$$

- **Fuel Burn Rate:** The engine operates at $\text{SFC}_{\text{base}} = 0.38\text{ kg/kWh}$. Fuel is consumed at $\sim 15.2\text{ kg/hour}$.
- **Phase Exit Trigger:** Remaining fuel ratio drops below $40\%$ ($W_{\text{fuel}} / W_{\text{fuel,init}} < 0.40$), triggering transition to Loiter holding phase.

---

## 🔄 Phase 4: Loiter & Silent Stealth Overwatch (`PHASE_LOITER`)

### 💡 Operational Intuition
The UAV arrives over the target reconnaissance area. It reduces speed to its **Best Endurance Velocity** ($V_{\text{be}} \approx 190\text{ km/h}$) to fly efficient racetrack holding orbits while carrying out optical/radar surveillance.

```
          DUAL-MODE LOITER STRATEGY COMPARISON
          
  MODE A: ENDURANCE LOITER (ICE ON)         MODE B: SILENT STEALTH LOITER (ICE OFF)
  ┌─────────────────────────────────┐       ┌─────────────────────────────────┐
  │ • 100% Turboshaft Engine        │       │ • 0% Engine (ICE SHUT DOWN!)    │
  │ • Noise Level ~85–95 dB         │       │ • 100% Electric Motor Drive     │
  │ • High Thermal Exhaust IR       │       │ • Noise Level <45 dB (Silent)   │
  │ • Duration: Up to 20 Hours      │       │ • Zero Exhaust Thermal Signature│
  │ • Strategic Patrol Mission      │       │ • Duration: ~34–42 Minutes      │
  └─────────────────────────────────┘       └─────────────────────────────────┘
```

### 📐 Physics & Battery Drain Equations for Mode B (Silent Loiter)
- **Power Required in Loiter:** Mechanical power required at $190\text{ km/h}$ is $19.1\text{ kW}$.
- **Electrical Battery Draw:**
  $$P_{\text{battery}} = \frac{P_{\text{aero}}}{\eta_{\text{motor}} \cdot \eta_{\text{inverter}} \cdot \eta_{\text{prop}}} = \frac{19.1\text{ kW}}{0.96 \cdot 0.98 \cdot 0.85} = \mathbf{25.3\text{ kW}}$$
- **State-of-Charge Drain Rate (20 kWh Pack):**
  $$\text{SoC Drain Rate} = \frac{25.3\text{ kW}}{20.0\text{ kWh}} \times \frac{100\%}{60\text{ mins}} = \mathbf{2.11\%\text{ SoC / minute}}$$

> [!IMPORTANT]
> **In-Flight Engine Restart:** When exiting Silent Loiter mode, the EMRAX motor acts as a high-torque starter-generator, pulsing $15\text{ kW}$ into the drive shaft to crank the turboshaft engine to $1,500\text{ RPM}$ in **$<1.5\text{ seconds}$**!

---

## ↘️ Phase 5: Glide-Idle Descent (`PHASE_DESCENT`)

### 💡 Operational Intuition
With mission objectives completed and fuel/battery reserves low, the UAV turns back toward airbase and begins a gradual glide descent from $5,000\text{ m}$ down to $200\text{ m}$. Potential energy is converted into forward airspeed, meaning engine throttle is pulled back to idle.

### 📐 Physics Equations & Parameters
- **Altitude Bounds:** $5,000.0\text{ m}$ down to $200.0\text{ m}$
- **Target Airspeed:** $V_{\text{descent}} = \max\left(1.20 \cdot V_{\text{stall}}, 30.0\text{ m/s}\right) = 30.0\text{ m/s}$ ($108.0\text{ km/h}$)
- **Climb Rate ($v_y$):** $-1.5\text{ m/s}$ ($-295\text{ fpm}$ glideslope)
- **Propeller Efficiency ($\eta_{\text{prop}}$):** $0.70$

### 🔌 Power Split Policy (PSR = 0.0)
- Engine operates at idle ($0\text{ kW}$ net thrust needed).
- **Regenerative Descent Opportunity:** Propeller windmilling can drive the electric motor as a generator, recovering up to **$8.25\text{ kWh}$** back into the battery pack during the 55-minute descent!

---

## 🛬 Phase 6: Final Approach & Landing (`PHASE_LANDING` & `COMPLETED`)

### 💡 Operational Intuition
The UAV executes final approach flare at low speed ($22\text{ m/s}$), descending gently at $-0.8\text{ m/s}$ until touchdown on the runway.

### 📐 Physics Equations & Parameters
- **Altitude Bounds:** $200.0\text{ m}$ down to $5.0\text{ m}$
- **Target Airspeed:** $V_{\text{landing}} = \max\left(1.10 \cdot V_{\text{stall}}, 22.0\text{ m/s}\right) = 22.0\text{ m/s}$ ($79.2\text{ km/h}$)
- **Climb Rate ($v_y$):** $-0.8\text{ m/s}$ ($-158\text{ fpm}$)
- **Completion Trigger:** Altitude $\le 5.0\text{ m} \implies$ Phase becomes `PHASE_COMPLETED`, awarding terminal reward **$+500.0$**!

---

> [!TIP]
> **Summary for Flight Operators:** This flight manual outlines the exact state parameters and power splits used in `backend/environment.py`.
