from environment import UAVHybridEnv

def test():
    env = UAVHybridEnv(
        engine_size_kw=80.0,
        battery_capacity_kwh=30.0,
        motor_size_kw=50.0,
        target_speed=45.0,
        target_altitude=2000.0,
        payload_weight=200.0
    )
    
    obs, info = env.reset()
    print("Initial Observation [Altitude, Speed, SoC, Fuel, PowerReq]:", obs)
    print("Initial Fuel Capacity:", env.fuel_initial, "kg")
    print("Empty + Payload Weight:", env.weight_empty_and_payload, "kg")
    
    terminated, truncated = False, False
    steps = 0
    while not (terminated or truncated):
        obs, reward, terminated, truncated, info = env.step([0.5])
        steps += 1
    
    print(f"Simulation ended after {steps} steps. Reason: {info.get('reason', 'None')}")
    print(f"Total time elapsed: {env.time_elapsed} seconds ({env.time_elapsed / 3600.0:.2f} hours)")
    print(f"Final battery SoC: {env.soc:.4f}, fuel remaining: {env.fuel_remaining:.4f} kg")

if __name__ == "__main__":
    test()
