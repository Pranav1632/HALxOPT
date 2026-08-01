# 📐 Coupled Flight Envelope & Dynamic Parameter Constraints Guide

> **Project:** AeroOptima — Hybrid-Electric Tactical UAV Optimization Platform (HAL × IIT Indore)  
> **Directory:** `docs/doc2_glossary/flight_envelope_constraints.md`  
> **Purpose:** Detailed engineering documentation of coupled multi-parameter constraints, physical envelope limits, and implementation rules across Backend (Pydantic), Simulation (Gymnasium), and Frontend (Next.js).

---

## ❓ 1. Are Coupled Parameter Constraints Real in Aerospace Engineering?

**YES, 100% REAL.** In aerospace engineering, parameters are never independent. Aircraft operate within a bounded **Operational Flight Envelope** (Flight Service Ceiling vs. Mass Budget vs. Stall Speed Boundary).

When air density ($\rho$) drops at high altitude:
1. **Wing Lift Drops:** $L = \frac{1}{2} \rho V^2 S C_L$. Carrying heavy payload requires higher True Airspeed to avoid stall ($V_{\text{stall}} \propto 1/\sqrt{\rho}$).
2. **Engine Power Drops:** Intake air mass flow rate decreases, derating turboshaft power by up to $60\%$ at $10,000\text{ m}$.
3. **Mass Budget Lock:** Total Maximum Takeoff Weight ($\text{MTOW} \le 1,000\text{ kg}$) means heavy payload directly reduces max fuel capacity.

---

## 🔍 2. Master List of 5 Real-World Coupled Parameter Scenarios

### Scenario 1: Target Altitude vs. Maximum Allowable Payload
* **Physical Cause:** Air density at $10,000\text{ m}$ is $\rho \approx 0.413\text{ kg/m}^3$ (only $33.7\%$ of sea-level density). Engine power drops by $>58\%$. Carrying $350\text{ kg}$ payload at $10,000\text{ m}$ exceeds available wing lift and engine climb thrust.
* **Coupled Rule:**
  $$\text{If } h_{\text{target}} > 8,000\text{ m} \implies m_{\text{payload}} \le 200.0\text{ kg}$$
  $$\text{If } h_{\text{target}} > 5,000\text{ m} \implies m_{\text{payload}} \le 275.0\text{ kg}$$

---

### Scenario 2: Target Altitude vs. Minimum Safe Cruise Speed (Stall Boundary)
* **Physical Cause:** Stall speed increases at high altitude:
  $$V_{\text{stall}}(h) = \sqrt{\frac{2 \cdot W \cdot g}{\rho(h) \cdot S \cdot C_{L,\max}}}$$
  At sea level, $V_{\text{stall}} \approx 20\text{ m/s}$ ($72\text{ km/h}$). At $10,000\text{ m}$, $V_{\text{stall}} \approx 34.5\text{ m/s}$ ($124\text{ km/h}$). Minimum cruise speed must maintain a $25\%$ safety margin ($1.25 \cdot V_{\text{stall}}$).
* **Coupled Rule:**
  $$\text{If } h_{\text{target}} \ge 8,000\text{ m} \implies V_{\text{cruise}} \ge 220.0\text{ km/h}$$

---

### Scenario 3: Payload Weight vs. Maximum Initial Fuel Fraction (MTOW Lock)
* **Physical Cause:** $\text{MTOW} = m_{\text{empty+propulsion}} + m_{\text{payload}} + m_{\text{fuel}} \le 1,000\text{ kg}$. Empty aircraft + propulsion is $\sim 450\text{ kg}$. If payload is set to maximum $350\text{ kg}$, only $200\text{ kg}$ budget remains for fuel. If user requests $350\text{ kg}$ payload + $100\%$ fuel fraction ($322.7\text{ kg}$ capacity), $\text{MTOW}$ is exceeded ($1,072.7\text{ kg}$).
* **Coupled Rule:**
  $$\text{Max Fuel Mass (kg)} = \min\left(350.0, 1000.0 - m_{\text{empty+propulsion}} - m_{\text{payload}}\right)$$

---

### Scenario 4: High Altitude / Cold Temperature vs. Battery Peak C-Rate
* **Physical Cause:** Ambient temperature at $h > 6,000\text{ m}$ reaches $-25^\circ\text{C}$ to $-40^\circ\text{C}$. Internal resistance $R_{\text{int}}(T)$ spikes, inducing severe voltage sags under high current draw.
* **Coupled Rule:**
  $$\text{If } h_{\text{target}} \ge 6,000\text{ m} \implies C_{\text{peak}} \le 3.5\text{C} \quad (\text{Reduced from } 5.0\text{C})$$

---

### Scenario 5: High Cruise Speed vs. Loiter Duration Trade-Off
* **Physical Cause:** Aerodynamic drag power scales with velocity cubed ($P_{\text{aero}} = \frac{1}{2} \rho V^3 S C_D$). Flying at $350\text{ km/h}$ consumes fuel $3.4\times$ faster than flying at $220\text{ km/h}$.
* **Coupled Rule:**
  $$\text{If } V_{\text{cruise}} \ge 320.0\text{ km/h} \implies \text{Enable Loiter automatically forced } \text{False}$$

---

## 💻 3. Implementation Code Patterns

### A. FastAPI Pydantic Model Validation (`backend/main.py`)

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
                f"At altitudes > 8000m, maximum allowable payload is 200 kg due to thin air density."
            )
        
        # Rule 2: Minimum Cruise Speed at High Altitude (Stall Prevention)
        if self.target_altitude >= 8000.0 and self.target_speed_kmh < 200.0:
            raise ValueError(
                f"Target speed {self.target_speed_kmh} km/h is below stall safety margin at altitude {self.target_altitude}m. "
                f"At altitudes ≥ 8000m, minimum cruise speed must be ≥ 200 km/h."
            )

        # Rule 3: High Speed Loiter Conflict
        if self.target_speed_kmh >= 320.0 and self.enable_loiter:
            # Auto-adjust or warn
            self.enable_loiter = False

        return self
```
