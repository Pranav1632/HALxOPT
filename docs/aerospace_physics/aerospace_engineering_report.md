# AEROTHON 2026 — HAL x IITI: Technical Masterclass & Winning Strategy Report
## State-of-the-Art Aerospace Engineering Factors for a 1,000 kg Hybrid-Electric MALE UAV

---

### Executive Summary: The Winning Proposition

To win **AEROTHON 2026 (HAL x IITI)**, the design submission cannot simply be a basic simulator or a generic sizing script. It must demonstrate **aerospace rigor, operational realism in extreme theaters (e.g., Leh-Ladakh / High Altitude Operational Envelope)**, and a **cutting-edge AI/Engineering balance**.

This technical masterplan outlines the state-of-the-art (SOTA) engineering factors, physics formulas, multi-disciplinary optimization frameworks, and feature sets that elevate our 1,000 kg MTOW Hybrid-Electric UAV design into a competition-winning project.

---

## 1. High-Altitude Operational Reality & Environmental Physics

A primary judging criterion for HAL (Hindustan Aeronautics Limited) is operational feasibility in Indian tactical theaters (e.g., High-Altitude Warfare in Eastern Ladakh at 15,000+ ft ASL).

### 1.1 Density Altitude & Power Derating Physics
Standard Sea-Level (SSL) performance metrics decay rapidly at high elevation due to reduced atmospheric density ($\rho$).

```
Density Ratio:  σ = ρ / ρ₀
ISA Model:      T = T₀ - L · h
                P = P₀ · (1 - L·h / T₀)^(g / (R·L))
```

#### A. Internal Combustion Engine (ICE) Altitude Lapse (Gagg-Ferrar Model)
Naturally aspirated or turbocharged engines lose power as intake air density drops:

$$\frac{P_{\text{engine, alt}}}{P_{\text{engine, SL}}} = \sigma - \frac{1 - \sigma}{7.55}$$

*For a turbocharged aviation ICE (e.g., Rotax 915 iS), critical altitude boost limits apply, after which power drops at ~8-11% per 1,000 m.*

#### B. Aerodynamic Lift & Drag Altitude Scaling
True Airspeed (TAS, $V_T$) scales inversely with the square root of density ratio for a given Indicated Airspeed (IAS, $V_I$):

$$V_T = \frac{V_I}{\sqrt{\sigma}}$$

$$P_{\text{req}} = T \cdot V_T = \left( D_{\text{parasite}} + D_{\text{induced}} \right) \cdot V_T = \left( \frac{1}{2} \rho V_T^2 S C_{D0} + \frac{2 W^2}{\rho V_T S \pi AR e} \right) \cdot V_T$$

> **Winning Insight:** High altitude demands higher True Airspeed to maintain lift, drastically shifting the minimum power required velocity ($V_{mp}$) and best endurance velocity ($V_{be}$) upward!

---

## 2. Advanced Hybrid-Electric Propulsion Topologies

```
┌─────────────────┐      Mechanical Coupling      ┌───────────────┐
│ ICE (Heavy Fuel)├──────────────────────────────►│               │
└────────┬────────┘                               │ Propeller /   │
         │ (Gen)                                  │ Gearbox       │
         ▼                                        │               │
┌─────────────────┐      Electrical Power Bus     │               │
│ Battery Pack    ├──────────────────────────────►│ Electric Motor│
│ (Li-NMC / SSB)  │                               └───────────────┘
└─────────────────┘
```

### 2.1 Parallel vs. Series-Parallel Hybrid Architecture
* **Parallel Hybrid:** Engine and Motor drive the same shaft. Allows downsized ICE (sized for cruise) with Motor boost for Takeoff/Climb.
* **Series-Parallel (Recommended SOTA):** Engine acts as a range extender while a high-torque electric motor handles primary drive and instant transient responses.

### 2.2 Cold Weather Battery Physics (Low-Temp Derating)
At high altitudes ($T < -20^\circ\text{C}$), internal battery resistance ($R_{int}$) increases exponentially:

$$R_{int}(T) = R_0 \cdot \exp\left( \frac{E_a}{R_u \cdot T} \right)$$

* **Capacity Derating:** Effective capacity drops to 60-70% of nominal rating without active thermal management (TMS).
* **C-Rate Penalty:** Discharge voltage sags ($V_{cell} = V_{oc} - I \cdot R_{int}$), risking thermal runaway or premature low-voltage cut-off.

---

## 3. Aerodynamic Efficiency & Trade-Off Dynamics

```
                  ┌──────────────────────────────┐
                  │ 1,000 kg MTOW Class UAV      │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│ High Wing Loading (W/S > 80)  │               │ Low Wing Loading (W/S < 60)   │
├───────────────────────────────┤               ├───────────────────────────────┤
│ • High Cruise Speed (Gust Pen)│               │ • High Loiter Endurance       │
│ • Longer Runway Roll Needed   │               │ • Short Takeoff / Landing     │
│ • Higher Stall Speed          │               │ • Sensitive to Turbulence     │
└───────────────────────────────┘               └───────────────────────────────┘
```

### 3.1 Oswald Efficiency Factor ($e$) & Aspect Ratio ($AR$)
Induced Drag Coefficient:

$$C_{Di} = \frac{C_L^2}{\pi \cdot AR \cdot e}$$

To maximize Loiter Endurance ($E \propto \frac{C_L^{3/2}}{C_D}$):
* **High Aspect Ratio ($AR \approx 18 - 22$):** Reduces induced drag during long-endurance ISR loiter.
* **Airfoil Selection:** High-lift, low Reynolds number laminar flow profiles (e.g., FX 63-137, Selig S1223, or Wortmann FX series).

---

## 4. Multi-Objective Genetic Algorithm (NSGA-II / DEAP) Benchmark

To achieve a hackathon-winning design, our optimization pipeline uses a **Multi-Objective Evolutionary Algorithm** evaluating the Pareto Front between Endurance, Payload Capacity, and MTOW.

```
       Endurance (Hours)
           ▲
           │         Pareto Frontier (Optimal Designs)
        30 ┼              *   *   *
           │          *
        20 ┼      *
           │  *
        10 ┼*
           └─┼────────────┼────────────┼──────────►
             100          200          300   Payload (kg)
```

### 4.1 Fitness Function Formulation

$$\text{Maximize } \mathcal{F} = w_1 \cdot \text{Endurance(hrs)} + w_2 \cdot \text{Payload(kg)} - w_3 \cdot \text{PowerDeficitPenalty} - w_4 \cdot \text{WeightExcessPenalty}$$

Where:
$$\text{WeightExcessPenalty} = \max\left(0, \frac{W_{\text{actual}} - W_{\text{MTOW}}}{W_{\text{MTOW}}}\right)^2 \times 10^5$$

---

## 5. Feature Matrix: Standard vs. Winning UAV Project

| Feature / Factor | Standard Hackathon Entry | **Our Winning AEROTHON 2026 Submission** |
| :--- | :--- | :--- |
| **Atmospheric Model** | Fixed Sea Level Density ($\rho = 1.225 \text{ kg/m}^3$) | **Full ISA Atmospheric Lapse + Leh-Ladakh Cold Profile** |
| **ICE Engine Power** | Constant Rated Power | **Gagg-Ferrar Density Derating & Partial SFC Penalties** |
| **Battery Model** | Constant Energy ($Wh/kg$) | **Low-Temperature Resistance & C-rate Voltage Sag Model** |
| **Flight Dynamics** | Kinematic fixed-climb assumption | **Dynamic Power-Deficit Flight-Path Degradation** |
| **Propulsion Split** | Static Hardcoded Heuristic | **AI / GA Multi-Objective Pareto Optimization** |
| **Stealth Capability** | None | **Thermal & Acoustic Multi-Mode (Electric Silent Loiter)** |
| **Weight Budgeting** | Rough Guess | **Standard Aerospace Mass Fractions ($W_e/MTOW = 0.45$)** |

---

## 6. Comprehensive Governing Equations Registry

### A. Breguet Endurance (Electric Hybrid Extension)

$$E_{\text{hybrid}} = E_{\text{electric}} + E_{\text{fuel}}$$

$$E_{\text{electric}} = \frac{\eta_{\text{batt}} \cdot \eta_{\text{motor}} \cdot \eta_{\text{prop}}}{P_{\text{req}}} \cdot E_{\text{battery, total}}$$

$$E_{\text{fuel}} = \frac{\eta_{\text{prop}}}{g \cdot \text{SFC} \cdot (L/D)} \cdot \ln\left( \frac{W_{\text{start}}}{W_{\text{end}}} \right)$$

### B. Rate of Climb ($RoC$) Constraint

$$RoC = \frac{P_{\text{available}} - P_{\text{required}}}{W_{\text{current}}}$$

$$\text{If } P_{\text{available}} < P_{\text{required}} \implies RoC < 0 \quad (\text{Forced Altitude Loss or Deceleration})$$

### C. Specific Fuel Consumption (SFC) Partial-Load Penalty

$$\text{SFC}(P) = \text{SFC}_{\text{base}} \cdot \left[ 1.0 + \kappa \cdot \left(1.0 - \frac{P}{P_{\text{max}}}\right)^2 \right]$$

---

## 7. Strategic Recommendations for Codebase Upgrade

To implement these winning factors into `environment.py` and `optimizer.py`:

1. **Integrate Density Altitude in `_compute_power_required`:** Apply $\sigma(h)$ to drag and engine power limits.
2. **Implement Dynamic Climb Speed:** Calculate maximum available excess power instead of enforcing fixed 5 m/s climb when power sags.
3. **Add Thermal / Battery Derating:** Multiply `battery_capacity_kwh` by temperature-dependent efficiency factors when altitude exceeds 3,000m.
4. **Export High-Resolution Pareto Charts:** Visualize Engine Size vs. Battery Mass vs. Endurance for judges in the frontend dashboard.

---
*Report compiled for AEROTHON 2026 Submission — Team HAL x IITI Project.*
