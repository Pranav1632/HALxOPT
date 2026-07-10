import os
import json
import random
import numpy as np
from deap import base, creator, tools, algorithms
from environment import UAVHybridEnv

# Create fitness and individual types if not already registered
if not hasattr(creator, "FitnessMax"):
    creator.create("FitnessMax", base.Fitness, weights=(1.0,))
if not hasattr(creator, "Individual"):
    creator.create("Individual", list, fitness=creator.FitnessMax)

def evaluate_individual(individual, target_speed, target_altitude, payload_weight, data_dir, bounds):
    # Unpack individual
    engine_size_kw, battery_capacity_kwh, motor_size_kw = individual
    
    # Clip parameters to bounds to ensure physical correctness
    engine_size_kw = max(bounds["engine"][0], min(engine_size_kw, bounds["engine"][1]))
    battery_capacity_kwh = max(bounds["battery"][0], min(battery_capacity_kwh, bounds["battery"][1]))
    motor_size_kw = max(bounds["motor"][0], min(motor_size_kw, bounds["motor"][1]))
    
    # Instantiate the Gymnasium environment
    try:
        env = UAVHybridEnv(
            engine_size_kw=engine_size_kw,
            battery_capacity_kwh=battery_capacity_kwh,
            motor_size_kw=motor_size_kw,
            target_speed=target_speed,
            target_altitude=target_altitude,
            payload_weight=payload_weight,
            data_dir=data_dir,
            use_dummy_policy=True,
            dt=60.0
        )
    except Exception:
        return (0.0,)
        
    # Check weight constraints
    if env.weight_empty_and_payload > 1000.0 or env.fuel_initial <= 0.0:
        return (0.0,)  # Massive penalty: exceeding MTOW limits
        
    # Run simulation
    obs, info = env.reset()
    terminated = False
    truncated = False
    
    while not (terminated or truncated):
        obs, reward, terminated, truncated, info = env.step([0.5])
        
    # Sizing endurance in hours
    endurance_hours = env.time_elapsed / 3600.0
    
    # Penalize if it crashed, stalled or ran out of fuel before descending
    if "Landed" not in info.get("reason", ""):
        return (endurance_hours * 0.4,)  # 60% penalty for failure to complete mission safely
        
    return (endurance_hours,)

def optimize_propulsion(target_speed, target_altitude, payload_weight, data_dir=None):
    if data_dir is None:
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        
    # Load specs to define bounds dynamically
    with open(os.path.join(data_dir, "turboshaft_specs.json"), "r") as f:
        engine_specs = json.load(f)
    with open(os.path.join(data_dir, "battery_specs.json"), "r") as f:
        battery_specs = json.load(f)

    bounds = {
        "engine": (engine_specs["min_size_kw"], engine_specs["max_size_kw"]),
        "battery": (battery_specs["min_capacity_kwh"], battery_specs["max_capacity_kwh"]),
        "motor": (battery_specs["min_motor_kw"], battery_specs["max_motor_kw"])
    }

    # Setup Toolbox
    toolbox = base.Toolbox()
    
    # Attributes generator
    toolbox.register("attr_engine", random.uniform, bounds["engine"][0], bounds["engine"][1])
    toolbox.register("attr_battery", random.uniform, bounds["battery"][0], bounds["battery"][1])
    toolbox.register("attr_motor", random.uniform, bounds["motor"][0], bounds["motor"][1])
    
    # Structure initializers
    toolbox.register("individual", tools.initCycle, creator.Individual, 
                     (toolbox.attr_engine, toolbox.attr_battery, toolbox.attr_motor), n=1)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    
    # Operators
    toolbox.register("evaluate", evaluate_individual, 
                     target_speed=target_speed, 
                     target_altitude=target_altitude, 
                     payload_weight=payload_weight, 
                     data_dir=data_dir, 
                     bounds=bounds)
    
    # Real-valued crossover (blend)
    toolbox.register("mate", tools.cxBlend, alpha=0.5)
    
    # Gaussian mutation
    toolbox.register("mutate", tools.mutGaussian, mu=0.0, sigma=[10.0, 3.0, 8.0], indpb=0.3)
    toolbox.register("select", tools.selTournament, tournsize=3)

    # Initialize population
    pop = toolbox.population(n=40)
    hof = tools.HallOfFame(1)

    # Statistics
    stats = tools.Statistics(lambda ind: ind.fitness.values[0])
    stats.register("max", np.max)
    stats.register("avg", np.mean)

    # Clip helper to keep individuals within physical bounds
    def clip_individual(individual):
        individual[0] = max(bounds["engine"][0], min(individual[0], bounds["engine"][1]))
        individual[1] = max(bounds["battery"][0], min(individual[1], bounds["battery"][1]))
        individual[2] = max(bounds["motor"][0], min(individual[2], bounds["motor"][1]))

    # Custom GA Loop to enforce boundaries post crossover/mutation
    CXPB, MUTPB, NGEN = 0.6, 0.3, 15

    # Evaluate the entire population
    fitnesses = list(map(toolbox.evaluate, pop))
    for ind, fit in zip(pop, fitnesses):
        ind.fitness.values = fit

    hof.update(pop)

    for gen in range(1, NGEN + 1):
        # Select the next generation individuals
        offspring = toolbox.select(pop, len(pop))
        offspring = list(map(toolbox.clone, offspring))

        # Apply crossover and mutation
        for child1, child2 in zip(offspring[::2], offspring[1::2]):
            if random.random() < CXPB:
                toolbox.mate(child1, child2)
                clip_individual(child1)
                clip_individual(child2)
                del child1.fitness.values
                del child2.fitness.values

        for mutant in offspring:
            if random.random() < MUTPB:
                toolbox.mutate(mutant)
                clip_individual(mutant)
                del mutant.fitness.values

        # Evaluate the individuals with invalid fitness
        invalid_ind = [ind for ind in offspring if not ind.fitness.valid]
        fitnesses = map(toolbox.evaluate, invalid_ind)
        for ind, fit in zip(invalid_ind, fitnesses):
            ind.fitness.values = fit

        # Replace population
        pop[:] = offspring
        hof.update(pop)

    best_ind = hof[0]
    best_fitness = best_ind.fitness.values[0]

    return {
        "engine_size_kw": float(best_ind[0]),
        "battery_capacity_kwh": float(best_ind[1]),
        "motor_size_kw": float(best_ind[2]),
        "fitness": float(best_fitness)
    }

if __name__ == "__main__":
    print("Testing GA optimizer...")
    result = optimize_propulsion(target_speed=45.0, target_altitude=2000.0, payload_weight=200.0)
    print("Optimization complete!")
    print(result)
