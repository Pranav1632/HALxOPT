'use client';

import React from 'react';

export default function SystemConstantsWidget() {
  return (
    <div className="bg-[#0D1117] border border-slate-800/60 rounded-lg m-2 p-3 panel-enter" style={{ animationDelay: '200ms' }}>
      <h2 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
        <span>🔬</span> System Constants
      </h2>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-slate-500">Drag Polar</span><span className="font-mono text-slate-300">Oswald AR=16.07</span></div>
        <div className="flex justify-between"><span className="text-slate-500">SFC</span><span className="font-mono text-slate-300">0.38 kg/kWh</span></div>
        <div className="flex justify-between"><span className="text-slate-500">C-Rate Limit</span><span className="font-mono text-yellow-400">3C/5C</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Motor η</span><span className="font-mono text-slate-300">96%</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Strategy</span><span className="font-mono text-emerald-400">Zhang et al.</span></div>
      </div>
    </div>
  );
}
