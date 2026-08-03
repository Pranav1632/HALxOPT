"""
optimizer.py — Backward-Compatible Facade for DEAP Genetic Algorithm.
Re-exports optimize_propulsion from the modular ga package.
"""
from ga import optimize_propulsion

__all__ = ["optimize_propulsion"]


if __name__ == "__main__":
    print("Running GA optimizer facade...")
    result = optimize_propulsion(
        target_speed_kmh=250.0,
        target_altitude=5000.0,
        payload_weight=200.0,
        pop_size=10,
        n_gen=2,
    )
    print("Optimization complete!")
    print(f"  Engine:    {result['engine_size_kw']:.2f} kW")
    print(f"  Battery:   {result['battery_capacity_kwh']:.2f} kWh")
    print(f"  Endurance: {result['fitness']:.2f} hours")
