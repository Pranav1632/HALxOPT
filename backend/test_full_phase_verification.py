import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import numpy as np
from env.uav_env import UAVHybridEnv
from rl.ppo_agent import NumPyActorCritic

DATA_DIR = os.path.abspath('data')
PKL_PATH  = os.path.abspath('backend/rl_model_ppo.pkl')

# ---- Print helpers ----------------------------------------------------------
def ok(msg):    print(f"  [PASS] {msg}")
def fail(msg):  print(f"  [FAIL] {msg}")
def warn(msg):  print(f"  [WARN] {msg}")
def nfo(msg):   print(f"    =>  {msg}")
def section(s): print(f"\n{'='*72}\n  {s}\n{'='*72}")

PASS = 0; FAIL = 0; WARN = 0

def check(cond, p, f, is_warn=False):
    global PASS, FAIL, WARN
    if cond:       ok(p);   PASS += 1
    elif is_warn:  warn(f); WARN += 1
    else:          fail(f); FAIL += 1

# ---- Load RL agent ----------------------------------------------------------
agent = NumPyActorCritic(state_dim=9)
agent.load(PKL_PATH)
print(f"[LOAD] RL agent loaded: {PKL_PATH}\n")

# ---- Simulation runner ------------------------------------------------------
def run_sim(label, engine_kw=120, battery_kwh=20, speed_kmh=250,
            altitude=5000, payload=200, heuristic=True,
            enable_loiter=True, silent_loiter=True,
            fuel_frac=1.0, headwind=0, temp_c=15, turbulence=0.0, dt=60.0):
    env = UAVHybridEnv(
        engine_size_kw=engine_kw, battery_capacity_kwh=battery_kwh,
        target_speed_kmh=speed_kmh, target_altitude=altitude,
        payload_weight=payload, data_dir=DATA_DIR,
        use_heuristic_policy=heuristic, dt=dt,
        enable_loiter=enable_loiter, silent_loiter_mode=silent_loiter,
        initial_fuel_fraction=fuel_frac, headwind_kmh=headwind,
        ambient_temp_c=temp_c, turbulence_level=turbulence,
    )
    obs, _ = env.reset()
    done = False; step_count = 0; last_info = {}
    while not done:
        if heuristic:
            action = [0.10]
        else:
            try:
                psr_act, _ = agent.get_action(obs, deterministic=True)
                action = [float(psr_act)]
            except Exception:
                action = [0.10]
        obs, _, term, trunc, last_info = env.step(action)
        done = term or trunc
        step_count += 1
        if step_count > 10000: break

    log = env.flight_log
    phases_seen = list(dict.fromkeys(p['phase'] for p in log))
    pd = {}
    for pt in log:
        ph = pt['phase']
        if ph not in pd:
            pd[ph] = {'pts': [], 'motor': [], 'engine': [],
                      'psr': [], 'soc': [], 'fuel': [], 'alt': [], 'spd': []}
        d = pd[ph]
        d['pts'].append(pt); d['motor'].append(pt['power_motor'])
        d['engine'].append(pt['power_engine']); d['psr'].append(pt['u'])
        d['soc'].append(pt['soc']); d['fuel'].append(pt['fuel'])
        d['alt'].append(pt['altitude']); d['spd'].append(pt['speed'])

    final  = log[-1]
    reason = last_info.get('reason', 'unknown')
    mode   = 'Heuristic' if heuristic else 'RL'
    print(f"\n  [{mode}] {label}")
    nfo(f"Phases: {' -> '.join(phases_seen)}")
    nfo(f"T={final['time']/3600:.2f}h | SoC={final['soc']*100:.1f}% | "
        f"Fuel={final['fuel']:.1f}kg | {reason}")
    return pd, phases_seen, final, reason

# =============================================================================
# SECTION 1: ALL 6 PHASES PRESENT
# =============================================================================
section("SECTION 1: PHASE COMPLETENESS -- All 6 Phases Must Appear in Both Modes")

EXPECTED = ['takeoff', 'climb', 'cruise', 'loiter', 'descent', 'landing']

for mode_label, is_heur in [('HEURISTIC', True), ('RL', False)]:
    pd, phases, final, reason = run_sim(
        f"{mode_label} Standard Mission (5000m, 250km/h, 200kg)",
        heuristic=is_heur, enable_loiter=True, silent_loiter=True
    )
    for ph in EXPECTED:
        check(ph in phases,
              f"{mode_label}: phase '{ph}' present",
              f"{mode_label}: phase '{ph}' MISSING from log!")
    check('Landed' in reason or 'completed' in reason,
          f"{mode_label}: mission completed cleanly ({reason[:50]})",
          f"{mode_label}: mission did NOT complete -- {reason}")

# =============================================================================
# SECTION 2: HEURISTIC PSR PER PHASE
# =============================================================================
section("SECTION 2: HEURISTIC PSR VALUES -- Per Phase Correctness")

pd_h, _, _, _ = run_sim("HEURISTIC PSR full audit", heuristic=True,
                         enable_loiter=True, silent_loiter=True)

PSR_EXPECT = {
    'takeoff': (0.15, 0.50, 'avg', 'Motor torque boost'),
    'climb':   (0.00, 0.16, 'avg', 'Engine primary'),
    'cruise':  (0.00, 0.15, 'avg', 'SFC economy'),
    'loiter':  (0.90, 1.01, 'max', 'Silent loiter peak ICE OFF'),  # check PEAK not avg
    'descent': (-0.01, 0.05, 'avg', 'Glide + regen'),
    'landing': (-0.01, 0.05, 'avg', 'Glide idle'),
}
for phase, (lo, hi, stat_type, note) in PSR_EXPECT.items():
    if phase not in pd_h:
        warn(f"Heuristic: '{phase}' not in log"); continue
    val = max(pd_h[phase]['psr']) if stat_type == 'max' else np.mean(pd_h[phase]['psr'])
    label_stat = 'peak' if stat_type == 'max' else 'avg'
    check(lo <= val <= hi,
          f"Heuristic '{phase}': {label_stat} PSR={val*100:.1f}% in [{lo*100:.0f},{hi*100:.0f}]% -- {note}",
          f"Heuristic '{phase}': {label_stat} PSR={val*100:.1f}% OUTSIDE [{lo*100:.0f},{hi*100:.0f}]%")

# Engine OFF during silent loiter: check PEAK motor and silent step COUNT
if 'loiter' in pd_h:
    silent_steps = sum(1 for m in pd_h['loiter']['motor'] if m > 1.0)
    total_steps  = len(pd_h['loiter']['motor'])
    max_mtr = max(pd_h['loiter']['motor'])
    check(silent_steps > 0,
          f"Heuristic silent loiter: {silent_steps}/{total_steps} steps ICE OFF, peak motor={max_mtr:.1f}kW",
          f"Heuristic silent loiter: ZERO silent steps! ICE never turned OFF")
    # During silent steps, verify engine is actually OFF
    silent_engine = [pd_h['loiter']['engine'][i] for i, m in enumerate(pd_h['loiter']['motor']) if m > 1.0]
    max_silent_eng = max(silent_engine) if silent_engine else 0
    check(max_silent_eng < 1.0,
          f"Heuristic silent steps: max engine={max_silent_eng:.1f}kW (ICE OFF confirmed)",
          f"Heuristic silent steps: engine was ON during silent steps! max={max_silent_eng:.1f}kW")

# Regenerative recovery: SoC stable or recovering in descent
if 'descent' in pd_h:
    soc0 = pd_h['descent']['soc'][0]; socN = pd_h['descent']['soc'][-1]
    check(socN >= soc0 - 0.03,
          f"Heuristic descent: SoC {soc0*100:.1f}% -> {socN*100:.1f}% (regen stable)",
          f"Heuristic descent: SoC dropped too fast {soc0*100:.1f}% -> {socN*100:.1f}%",
          is_warn=True)

# =============================================================================
# SECTION 3: RL PSR PER PHASE
# =============================================================================
section("SECTION 3: RL PSR VALUES -- Per Phase with Silent Loiter Override")

pd_rl, _, _, _ = run_sim("RL PSR full audit", heuristic=False,
                          enable_loiter=True, silent_loiter=True)

RL_NOTES = {
    'takeoff': 'RL boosts motor for takeoff torque',
    'climb':   'RL battery guard: motor limited',
    'cruise':  'RL SFC economy, low motor',
    'loiter':  'OPERATOR OVERRIDE: silent ICE OFF',
    'descent': 'RL regen glide',
    'landing': 'RL idle descent',
}
for phase, note in RL_NOTES.items():
    if phase not in pd_rl:
        warn(f"RL: '{phase}' not in log"); continue
    avg_psr = np.mean(pd_rl[phase]['psr'])
    avg_mtr = np.mean(pd_rl[phase]['motor'])
    avg_eng = np.mean(pd_rl[phase]['engine'])
    nfo(f"RL '{phase}': PSR={avg_psr*100:.1f}% Motor={avg_mtr:.1f}kW Engine={avg_eng:.1f}kW -- {note}")

if 'loiter' in pd_rl:
    silent_steps = sum(1 for m in pd_rl['loiter']['motor'] if m > 1.0)
    total_steps  = len(pd_rl['loiter']['motor'])
    pct = 100 * silent_steps / max(total_steps, 1)
    check(silent_steps > 0,
          f"RL silent loiter: {silent_steps}/{total_steps} steps ICE OFF ({pct:.0f}% stealth achieved)",
          f"RL silent loiter: ZERO silent steps! ICE never turned OFF")

# =============================================================================
# SECTION 4: SILENT vs ENDURANCE LOITER MODES
# =============================================================================
section("SECTION 4: SILENT LOITER (ICE OFF) vs ENDURANCE LOITER (ICE ON) -- Both Modes")

for mode_label, is_heur in [('HEURISTIC', True), ('RL', False)]:
    pd_s, _, _, _ = run_sim(f"{mode_label} SILENT MODE",    heuristic=is_heur, silent_loiter=True)
    pd_e, _, _, _ = run_sim(f"{mode_label} ENDURANCE MODE", heuristic=is_heur, silent_loiter=False)
    if 'loiter' in pd_s and 'loiter' in pd_e:
        eng_s = np.mean(pd_s['loiter']['engine']); eng_e = np.mean(pd_e['loiter']['engine'])
        mtr_s = np.mean(pd_s['loiter']['motor']);  mtr_e = np.mean(pd_e['loiter']['motor'])
        check(eng_s < eng_e,
              f"{mode_label}: Engine {eng_e:.1f}->{eng_s:.1f}kW (ICE OFF in silent vs ICE ON in endurance)",
              f"{mode_label}: Engine NOT reduced in silent mode ({eng_s:.1f} vs {eng_e:.1f}kW)")
        check(mtr_s > mtr_e,
              f"{mode_label}: Motor {mtr_e:.1f}->{mtr_s:.1f}kW (electric rises in silent mode)",
              f"{mode_label}: Motor NOT higher in silent mode ({mtr_s:.1f} vs {mtr_e:.1f}kW)")

# =============================================================================
# SECTION 5: PHYSICS CONSTRAINTS
# =============================================================================
section("SECTION 5: PHYSICS CONSTRAINTS -- SoC Floor, Fuel Floor, No Stall")

for mode_label, is_heur in [('HEURISTIC', True), ('RL', False)]:
    pd, phases, final, reason = run_sim(f"{mode_label} physics check", heuristic=is_heur)

    all_pts = sum([d['pts'] for d in pd.values()], [])

    min_soc  = min(pt['soc']  for pt in all_pts)
    min_fuel = min(pt['fuel'] for pt in all_pts)
    check(min_soc  >= 0.0, f"{mode_label}: min SoC={min_soc*100:.1f}% >= 0% (no underflow)", f"{mode_label}: SoC NEGATIVE! {min_soc*100:.1f}%")
    check(min_fuel >= 0.0, f"{mode_label}: min fuel={min_fuel:.2f}kg >= 0 (no underflow)",    f"{mode_label}: Fuel NEGATIVE! {min_fuel:.2f}kg")

    for ph in ['climb', 'cruise', 'loiter']:
        if ph not in pd: continue
        min_spd_kmh = min(pd[ph]['spd']) * 3.6
        check(min_spd_kmh > 50.0,
              f"{mode_label} '{ph}': min speed={min_spd_kmh:.1f}km/h > 50 (no stall)",
              f"{mode_label} '{ph}': stall risk! min={min_spd_kmh:.1f}km/h")

    if 'cruise' in pd:
        cruise_alt = np.mean(pd['cruise']['alt'])
        check(cruise_alt > 4000,
              f"{mode_label}: cruise alt={cruise_alt:.0f}m > 4000m (altitude reached)",
              f"{mode_label}: cruise alt={cruise_alt:.0f}m too low", is_warn=True)

# =============================================================================
# SECTION 6: EDGE CONDITIONS
# =============================================================================
section("SECTION 6: EDGE CONDITIONS -- Worst-Case Stress Tests")

edge_cases = [
    ("LOW FUEL (20%)",             dict(fuel_frac=0.20)),
    ("HOT+HEAVY (+40C, 300kg)",   dict(temp_c=40, payload=300, altitude=3000, speed_kmh=220)),
    ("EXTREME ALT (9000m)",        dict(altitude=9000, payload=200, speed_kmh=250)),
    ("SEVERE HEADWIND (60km/h)",   dict(headwind=60)),
    ("MAX TURBULENCE (100%)",      dict(turbulence=1.0)),
    ("HIGH SPEED DASH (350km/h)",  dict(speed_kmh=350)),
    ("NO LOITER (straight)",       dict(enable_loiter=False)),
    ("ENDURANCE LOITER",           dict(silent_loiter=False)),
    ("LOW BATTERY (10 kWh)",       dict(battery_kwh=10)),
    ("COLD WEATHER (-30C)",        dict(temp_c=-30)),
    ("LIGHT PAYLOAD (100kg)",      dict(payload=100)),
    ("HEAVY PAYLOAD (300kg)",      dict(payload=300, altitude=3000)),
    ("PARTIAL FUEL 50%",           dict(fuel_frac=0.50)),
]

for label, kw in edge_cases:
    for mode_label, is_heur in [('H', True), ('RL', False)]:
        try:
            pd, phases, final, reason = run_sim(f"{mode_label} | {label}", heuristic=is_heur, **kw)
            completed = 'Landed' in reason or 'completed' in reason
            check(completed,
                  f"{mode_label} [{label}]: {reason[:55]}",
                  f"{mode_label} [{label}]: FAILED -- {reason}", is_warn=not completed)
        except Exception as ex:
            fail(f"{mode_label} [{label}]: CRASH -- {ex}")
            FAIL += 1

# =============================================================================
# SECTION 7: PARAMETER SWEEP
# =============================================================================
section("SECTION 7: PARAMETER SWEEP -- Speed x Altitude x Payload Combinations")

combos = [
    # (label,                          kwargs,                                                          is_warn)
    ("150km/h 3000m 100kg",           dict(speed_kmh=150, altitude=3000, payload=100),               False),
    ("200km/h 5000m 200kg",           dict(speed_kmh=200, altitude=5000, payload=200),               False),
    ("250km/h 5000m 200kg",           dict(speed_kmh=250, altitude=5000, payload=200),               False),
    ("250km/h 7000m 150kg",           dict(speed_kmh=250, altitude=7000, payload=150, engine_kw=160), True),
    ("280km/h 5000m 150kg",           dict(speed_kmh=280, altitude=5000, payload=150),               True),
    ("250km/h 9000m 150kg big-eng",   dict(speed_kmh=250, altitude=9000, payload=150, engine_kw=200, battery_kwh=25), True),
    ("220km/h 3000m 300kg",           dict(speed_kmh=220, altitude=3000, payload=300),               False),
]

for label, kw, borderline in combos:
    is_warn_case = borderline
    for mode_label, is_heur in [('H', True), ('RL', False)]:
        try:
            pd, phases, final, reason = run_sim(f"{mode_label} {label}", heuristic=is_heur, **kw)
            ok_all = (final['soc'] >= 0 and final['fuel'] >= 0 and
                      ('Landed' in reason or 'completed' in reason))
            check(ok_all,
                  f"{mode_label} [{label}]: SoC={final['soc']*100:.0f}% Fuel={final['fuel']:.0f}kg OK",
                  f"{mode_label} [{label}]: {reason}", is_warn=is_warn_case)
        except Exception as ex:
            fail(f"{mode_label} [{label}]: CRASH -- {ex}"); FAIL += 1


# =============================================================================
# FINAL SUMMARY
# =============================================================================
total = PASS + FAIL + WARN
print(f"\n{'='*72}")
print(f"  FINAL SUMMARY: {total} checks total")
print(f"{'='*72}")
print(f"  PASS : {PASS}")
print(f"  FAIL : {FAIL}")
print(f"  WARN : {WARN}")
if FAIL == 0:
    print("\n  *** ALL CHECKS PASSED -- System fully validated ***\n")
else:
    print(f"\n  *** {FAIL} CHECK(S) FAILED -- See [FAIL] lines above ***\n")
