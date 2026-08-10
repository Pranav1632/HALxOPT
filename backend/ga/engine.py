"""
GA Evolution Engine Loop.
"""
import os
import random
import numpy as np
from deap import tools
from ga.bounds import load_bounds
from ga.evaluator import evaluate_individual
from ga.operators import create_toolbox, clip_individual


def optimize_propulsion(
    target_speed_kmh: float = 250.0,
    target_altitude: float = 5000.0,
    payload_weight: float = 200.0,
    data_dir: str = None,
    pop_size: int = 40,
    n_gen: int = 15,
    enable_loiter: bool = True,
    initial_fuel_fraction: float = 1.0,
) -> dict:
    """
    Run the DEAP Genetic Algorithm to find optimal propulsion sizing.
    Returns dict with optimal engine_size_kw, battery_capacity_kwh, and expected endurance.
    """
    if data_dir is None:
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))

    bounds = load_bounds(data_dir)

    def _eval(ind):
        return evaluate_individual(
            ind,
            target_speed_kmh=target_speed_kmh,
            target_altitude=target_altitude,
            payload_weight=payload_weight,
            data_dir=data_dir,
            bounds=bounds,
            enable_loiter=enable_loiter,
            initial_fuel_fraction=initial_fuel_fraction,
        )

    toolbox = create_toolbox(bounds, _eval)

    print(f"\n========================================================")
    print(f"[START] INITIATING PROPULSION OPTIMIZATION LOOP")
    print(f"========================================================")
    print(f"  Target Cruise Speed   : {target_speed_kmh} km/h")
    print(f"  Target Cruise Altitude: {target_altitude} m")
    print(f"  Payload Weight        : {payload_weight} kg")
    print(f"  Loiter Phase Enabled  : {enable_loiter}")
    print(f"  Initial Fuel Fraction : {initial_fuel_fraction * 100:.1f}%")
    print(f"  GA Configuration      : Pop Size = {pop_size}, Max Gen = {n_gen}")
    print(f"  Engine Sizing Search  : {bounds['engine'][0]} kW to {bounds['engine'][1]} kW")
    print(f"  Battery Sizing Search : {bounds['battery'][0]} kWh to {bounds['battery'][1]} kWh")
    print(f"--------------------------------------------------------")

    pop = toolbox.population(n=pop_size)
    hof = tools.HallOfFame(1)

    CXPB, MUTPB = 0.6, 0.35

    print("[WAIT] Evaluating initial population...")
    fitnesses = list(map(toolbox.evaluate, pop))
    for ind, fit in zip(pop, fitnesses):
        ind.fitness.values = fit
    hof.update(pop)

    print("[SUCCESS] Initial population evaluation complete. Starting evolution.\n")

    for gen in range(1, n_gen + 1):
        offspring = toolbox.select(pop, len(pop))
        offspring = list(map(toolbox.clone, offspring))

        for c1, c2 in zip(offspring[::2], offspring[1::2]):
            if random.random() < CXPB:
                toolbox.mate(c1, c2)
                clip_individual(c1, bounds)
                clip_individual(c2, bounds)
                del c1.fitness.values
                del c2.fitness.values

        for mutant in offspring:
            if random.random() < MUTPB:
                toolbox.mutate(mutant)
                clip_individual(mutant, bounds)
                del mutant.fitness.values

        invalid = [ind for ind in offspring if not ind.fitness.valid]
        fitnesses = list(map(toolbox.evaluate, invalid))
        for ind, fit in zip(invalid, fitnesses):
            ind.fitness.values = fit

        pop[:] = offspring
        hof.update(pop)

        fits = [ind.fitness.values[0] for ind in pop]
        best_ind = hof[0]
        print(f"[GEN] Generation {gen:02d}/{n_gen:02d}:")
        print(f"   * Max Fitness (Endurance): {max(fits):.3f} hours")
        print(f"   * Min Fitness (Endurance): {min(fits):.3f} hours")
        print(f"   * Avg Fitness (Endurance): {np.mean(fits):.3f} hours")
        print(f"   * Current Best Candidate: Engine = {best_ind[0]:.2f} kW, Battery = {best_ind[1]:.2f} kWh")
        print(f"--------------------------------------------------------")

    best = hof[0]
    print(f"\n[SUCCESS] PROPULSION OPTIMIZATION CONVERGED!")
    print(f"[BEST] Sized Architecture:")
    print(f"   * Turboshaft Engine Size: {best[0]:.2f} kW")
    print(f"   * Battery Capacity      : {best[1]:.2f} kWh")
    print(f"   * Expected Endurance    : {best.fitness.values[0]:.3f} hours")
    print(f"========================================================\n")
    return {
        "engine_size_kw": float(best[0]),
        "battery_capacity_kwh": float(best[1]),
        "fitness": float(best.fitness.values[0]),
    }
