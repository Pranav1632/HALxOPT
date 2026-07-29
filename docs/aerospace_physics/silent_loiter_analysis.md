# Operational Analysis: Silent Loiter Feasibility & Battery Drain Calculations
## AEROTHON 2026 — HAL x IITI Project

---

## Part 1: Real-World Feasibility of Cutting ICE during Loiter

### 1. Is Cutting the ICE during Loiter Realistic & Feasible?

**YES. In modern military hybrid-electric UAVs, this is a real-world operational tactic known as "Silent Loiter" or "Acoustic & Infrared Stealth Mode".**

```
                         IN-FLIGHT HYBRID TRANSITION LOGIC
                         
 ┌─────────────────────────┐      Command: Stealth Overlook     ┌─────────────────────────┐
 │ Cruise Phase (ICE ON)   ├───────────────────────────────────►│ Silent Loiter (ICE OFF) │
 │ • Engine drives prop    │                                    │ • Engine SHUT DOWN      │
 │ • Noise ~95 dB          │      Engine Fuel Cut & Clutch Off  │ • Motor drives prop     │
 │ • High IR exhaust temp  │                                    │ • Noise <45 dB (Silent) │
 └─────────────────────────┘                                    └────────────┬────────────┘
              ▲                                                              │
              │             Command: Exit Stealth / Dash                     │
              └──────────────────────────────────────────────────────────────┘
                             Instant Electric Engine Restart (< 1.5s)
```

---

### 2. How Real Hybrid UAVs Solve the "Mid-Air Engine Restart" Challenge

In conventional single-engine aircraft, shutting down the engine mid-flight is dangerous because restarting requires either:
1. Diving to "windmill" the propeller back to ignition speed.
2. A heavy dedicated 12V/24V starter motor and lead-acid battery.

**In a Parallel/Series-Parallel Hybrid UAV (Our Design), mid-air restart is trivial and fast:**
* The primary electric motor (e.g., EMRAX 228/268) is directly coupled to the crankshaft via an electromagnetic clutch or belt drive.
* To restart the ICE mid-air, the BMS (Battery Management System) injects a high-torque pulse into the electric motor.
* The motor acts as a **High-Power Starter-Generator**, cranking the ICE shaft to 1,500 RPM in **under 1.5 seconds**. 
* Fuel injection and spark fire instantly, achieving smooth in-flight re-ignition without altitude loss.

---

### 3. Operational Comparison: Dual-Mode Loiter Options

| Parameter | Mode A: Silent Loiter (ICE OFF, 100% Electric) | Mode B: Endurance Loiter (ICE ON, 100% Engine) |
| :--- | :--- | :--- |
| **Acoustic Signature** | **Extremely Low (< 45 dB at 1,000m)** — Virtually undetected from the ground. | High (85 – 95 dB) — Easily picked up by acoustic sensors. |
| **IR Signature** | **Minimal** — Engine exhaust cools to ambient temperature. | High — Hot exhaust manifold visible to Thermal/MANPADS sensors. |
| **Energy Source** | High-density Battery Pack ($Wh/kg$). | High-density Jet-A / Heavy Fuel ($12,000 Wh/kg$). |
| **Loiter Duration** | **15 to 45 Minutes** (Constrained by battery capacity). | **15 to 25+ Hours** (Constrained by fuel budget). |
| **Strategic Purpose** | **Tactical Penetration & Close Target Overwatch.** | **Long-Range Maritime / Border Patrol.** |

---

## Part 2: Exact Battery % Drain Calculations

### 1. Physics Derivation of Power Required in Loiter

For a 1,000 kg MTOW fixed-wing UAV:

$$\text{Weight } W = 1,000 \text{ kg} \times 9.81 \text{ m/s}^2 = 9,810 \text{ N}$$

At minimum power loiter speed ($V_{\text{loiter}} \approx 35 \text{ m/s}$ or 126 km/h) with a high-aspect ratio composite wing ($(L/D)_{\text{max}} \approx 18$):

$$\text{Aerodynamic Drag } D = \frac{W}{L/D} = \frac{9,810}{18} = 545 \text{ N}$$

$$\text{Mechanical Power Required } P_{\text{aero}} = D \times V_{\text{loiter}} = 545 \text{ N} \times 35 \text{ m/s} = 19,075 \text{ W} \approx 19.1 \text{ kW}$$

Accounting for electrical and powertrain losses ($\eta_{\text{motor}} \approx 0.95$, $\eta_{\text{inverter}} \approx 0.97$, $\eta_{\text{prop}} \approx 0.82 \implies \eta_{\text{sys}} \approx 0.755$):

$$P_{\text{battery draw}} = \frac{P_{\text{aero}}}{\eta_{\text{sys}}} = \frac{19.1 \text{ kW}}{0.755} \approx \mathbf{25.3 \text{ kW}}$$

---

### 2. Battery SoC % Drain Rates by Pack Size

The table below shows the exact percentage of battery state-of-charge (SoC) drained during **Silent Loiter (ICE OFF)** for different battery pack capacities:

$$\text{SoC Drain Rate (\% per min)} = \frac{25.3 \text{ kW}}{\text{Battery Capacity (kWh)}} \times \frac{100\%}{60 \text{ mins}}$$

| Battery Pack Capacity (kWh) | Pack Weight (@ 260 Wh/kg) | SoC Drain per Minute | **15 Min Silent Loiter Drain** | **30 Min Silent Loiter Drain** | **Max Pure Electric Loiter Time** (to 10% min SoC) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **10 kWh** | 38.5 kg | **4.22% / min** | **63.3%** | *Depleted* (Exceeds capacity) | **21.3 Minutes** |
| **15 kWh** | 57.7 kg | **2.81% / min** | **42.2%** | **84.3%** | **32.0 Minutes** |
| **20 kWh** (Recommended) | 76.9 kg | **2.11% / min** | **31.6%** | **63.3%** | **42.7 Minutes** |
| **25 kWh** | 96.1 kg | **1.69% / min** | **25.3%** | **50.6%** | **53.3 Minutes** |

---

## Key Takeaways for AEROTHON 2026 Presentation

1. **Cutting ICE during loiter is a real, high-value tactical capability** called *Silent Loiter*.
2. **It drains the battery at ~2.1% SoC per minute** for a standard 20 kWh pack (drawing ~25.3 kW of electrical power).
3. **A 30-minute silent overwatch mission consumes ~63.3% of a 20 kWh battery.**
4. **Quick In-Flight Restart:** Because our motor acts as a high-torque starter generator, the ICE can be restarted in **1.5 seconds** as soon as the UAV finishes silent overwatch and needs to climb or return to base!
