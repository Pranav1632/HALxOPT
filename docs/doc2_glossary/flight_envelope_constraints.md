# 📐 Flight Envelope & Coupled Physics Constraints Masterclass

> **Project:** AeroOptima — Tactical Hybrid-Electric UAV Sizing & Control Optimization Platform (HAL × IIT Indore)  
> **Directory:** `docs/doc2_glossary/flight_envelope_constraints.md`  
> **Target Audience:** Systems Engineers, Aerospace Analysts, Software Developers, and Evaluators.  
> **Goal:** Masterclass explanation of aircraft flight envelopes, coupled multi-parameter physics, and software validation rules across FastAPI, Gymnasium, and Next.js.

---

## ❓ What Is a Flight Envelope?

### 💡 The Layman's Intuition
Think of an aircraft's **Flight Envelope** like a safety boundary box on a graph. Inside the box, the aircraft flies smoothly and safely. If you step outside the box:
- Fly **too slow** $\rightarrow$ Wing loses lift and the plane **stalls** (falls out of the sky).
- Fly **too fast** $\rightarrow$ Aerodynamic forces rip the wings off structurally (g-limit / $V_{NE}$ exceeded).
- Fly **too high with heavy cargo** $\rightarrow$ Thin air cannot generate enough lift, and the engine starves of oxygen, causing continuous altitude drop.

```
                    TYPICAL V-n FLIGHT ENVELOPE BOUNDARY
    
    Load Factor g (n = L/W)
       ▲
  +3.8 ┼─────────────────┬──────────────────────┐
       │                ╱                       │ ◄── Structural Limit
       │               ╱                        │
  +1.0 ┼──────────────╱─────────────────────────┼────── Level Flight (g = 1.0)
       │             ╱                          │
       │   STALL    ╱     SAFE OPERATING        │ ◄── Structural Overspeed
     0 ┼───────────╱────── FLIGHT ENVELOPE ─────┼────── Threshold (V_NE)
       └──────────┴─────────────────────────────┴──────────► Airspeed V (km/h)
             Stall Speed (V_stall)
```

---

## 🔍 Master List: 5 Real-World Coupled Parameter Scenarios

In aerospace engineering, **parameters are never independent**. Changing target altitude automatically impacts allowable payload, stall velocity, engine output, and battery discharge rates.

---

### Scenario 1: Target Altitude vs. Maximum Allowable Payload

#### 💡 The Physical Reason
Air density at $10,000\text{ m}$ altitude is $\rho = 0.4135\text{ kg/m}^3$ — only **33.7% of sea-level density**! Furthermore, naturally aspirated and APU turboshaft engines lose $>58\%$ of their shaft power. Carrying a heavy $350\text{ kg}$ payload at $10,000\text{ m}$ exceeds both available wing lift and engine climb thrust.

#### 📐 Governing Equation & Rule
$$\text{If } h_{\text{target}} > 8,000\text{ m} \implies m_{\text{payload}} \le 200.0\text{ kg} \quad (\text{Reduced from } 350.0\text{ kg max})$$
$$\text{If } h_{\text{target}} > 5,000\text{ m} \implies m_{\text{payload}} \le 275.0\text{ kg}$$

---

### Scenario 2: Target Altitude vs. Minimum Safe Speed (Stall Boundary)

#### 💡 The Physical Reason
Stall speed ($V_{\text{stall}}$) is the absolute slowest an aircraft can fly without dropping out of the air. Because stall speed scales inversely with the square root of air density ($\sqrt{\rho}$), stall speed **increases by +44% at high altitudes**!

#### 📐 Governing Equation
$$V_{\text{stall}}(h) = \sqrt{\frac{2 \cdot W \cdot g}{\rho(h) \cdot S \cdot C_{L,\max}}}$$

- **At Sea Level ($0\text{ m}$, $\rho=1.225$):** $V_{\text{stall}} = 27.6\text{ m/s}$ ($99.4\text{ km/h}$).
- **At $8,000\text{ m}$ Altitude ($\rho=0.5258$):** $V_{\text{stall}} = 42.1\text{ m/s}$ (**$151.6\text{ km/h}$**).

To maintain a certified 25% safety margin above stall ($V_{\text{cruise}} \ge 1.25 \cdot V_{\text{stall}}$):
$$\text{If } h_{\text{target}} \ge 8,000\text{ m} \implies V_{\text{cruise}} \ge 200.0\text{ km/h}$$

---

### Scenario 3: Payload Mass vs. Fuel Capacity (MTOW Mass Lock)

#### 💡 The Physical Reason
Total Maximum Takeoff Weight is fixed at **$\text{MTOW} \le 1,000\text{ kg}$**. The structural airframe plus minimum propulsion components weighs $\sim 450\text{ kg}$. If a user selects maximum $350\text{ kg}$ payload, only $200\text{ kg}$ remains for Jet A-1 fuel! Requesting $350\text{ kg}$ payload alongside $100\%$ initial fuel load ($322.7\text{ kg}$) causes an immediate weight overflow ($1,072.7\text{ kg}$).

#### 📐 Governing Equation
$$m_{\text{fuel, max}} = \min\left(350.0\text{ kg}, \text{MTOW} - m_{\text{empty+propulsion}} - m_{\text{payload}}\right)$$

---

### Scenario 4: High Altitude / Cold Temp vs. Battery Peak Discharge (C-Rate Limit)

#### 💡 The Physical Reason
High-altitude flight ceilings ($h > 6,000\text{ m}$) experience ambient temperatures from $-25^\circ\text{C}$ to $-45^\circ\text{C}$. Sub-zero temperatures increase internal cell resistance ($R_{\text{int}}$) exponentially, causing severe voltage sags under high current draw.

#### 📐 Governing Rule
$$\text{If } h_{\text{target}} \ge 6,000\text{ m} \implies C_{\text{peak}} \le 3.5\text{C} \quad (\text{Reduced from } 5.0\text{C peak surge limit})$$

---

### Scenario 5: High Cruise Speed vs. Loiter Duration Trade-Off

#### 💡 The Physical Reason
Aerodynamic drag power increases with the **cube of velocity** ($P_{\text{aero}} \propto V^3$). Flying at $350\text{ km/h}$ consumes fuel **$3.4\times$ faster** than flying at $220\text{ km/h}$.

#### 📐 Governing Rule
$$\text{If } V_{\text{cruise}} \ge 320.0\text{ km/h} \implies \text{Enable Loiter automatically forced to } \mathbf{False}$$

---

## 💻 Full Code Implementation Patterns

### 1. FastAPI Backend Validation (`backend/main.py`)

Implemented using Pydantic `model_validator`:

```python
from pydantic import BaseModel, Field, model_validator

class OptimizationRequest(BaseModel):
    target_speed_kmh: float = Field(250.0, ge=100.0, le=400.0)
    target_altitude: float = Field(5000.0, ge=500.0, le=10000.0)
    payload_weight: float = Field(200.0, ge=50.0, le=350.0)
    enable_loiter: bool = Field(True)
    initial_fuel_fraction: float = Field(1.0, ge=0.1, le=1.0)

    @model_validator(mode="after")
    def validate_flight_envelope(self):
        # Rule 1: High Altitude Payload Ceiling
        if self.target_altitude > 8000.0 and self.payload_weight > 200.0:
            raise ValueError(
                f"Altitude {self.target_altitude}m exceeds flight ceiling for payload {self.payload_weight}kg. "
                f"At altitudes > 8000m, maximum allowable payload is 200.0 kg due to thin air density."
            )

        # Rule 2: Minimum Cruise Speed at High Altitude (Stall Margin)
        if self.target_altitude >= 8000.0 and self.target_speed_kmh < 200.0:
            raise ValueError(
                f"Target speed {self.target_speed_kmh} km/h is below stall safety limit at altitude {self.target_altitude}m. "
                f"At altitudes ≥ 8000m, minimum cruise speed must be ≥ 200.0 km/h."
            )

        return self
```

---

> [!TIP]
> **Summary for Developers & Evaluators:** This document bridges theoretical flight dynamics with software validation logic across the AeroOptima codebase.
