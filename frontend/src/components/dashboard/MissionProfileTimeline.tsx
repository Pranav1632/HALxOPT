'use client';

import React from 'react';

interface MissionProfileTimelineProps {
  phaseDurations: Record<string, { start: number; end: number }>;
  totalMissionTime: number;
}

export default function MissionProfileTimeline({ phaseDurations, totalMissionTime }: MissionProfileTimelineProps) {
  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '100ms' }}>
      <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
        <span>🗺️</span> Mission Profile
      </h2>
      <div className="relative pl-4">
        <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-gradient-to-b from-emerald-500/60 via-slate-700/40 to-transparent" />
        {Object.entries(phaseDurations)
          .filter(([p]) => p !== 'completed')
          .map(([phase, t], idx) => {
            const durSec = t.end - t.start;
            const durMin = durSec / 60;
            const fraction = Math.min(durSec / totalMissionTime, 1);
            return (
              <div key={phase} className="mb-2.5 last:mb-0">
                <div className="flex items-center justify-between mb-1" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="flex items-center gap-2">
                    <span className="absolute left-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                      style={{ marginTop: 0 }} />
                    <span className="capitalize font-medium text-[10px] text-slate-300">{phase}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{durMin.toFixed(1)}m</span>
                </div>
                <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all"
                    style={{ width: `${fraction * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
