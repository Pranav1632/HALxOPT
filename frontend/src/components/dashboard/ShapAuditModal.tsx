'use client';

import React, { useEffect, useState } from 'react';
import { fetchShapAudit, ShapAuditData } from '../../services/api';

interface ShapAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShapAuditModal({ isOpen, onClose }: ShapAuditModalProps) {
  const [data, setData] = useState<ShapAuditData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetchShapAudit()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not load SHAP explainability audit data.');
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0D1117] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 bg-[#161B22] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Explainable AI (XAI) & SHAP Feature Importance Audit
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs">
              <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
              Computing SHAP neural attributions...
            </div>
          ) : error ? (
            <div className="p-3 bg-red-950/30 border border-red-800/40 rounded text-red-300 text-xs font-mono">
              {error}
            </div>
          ) : data ? (
            <>
              <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-cyan-200 uppercase tracking-wide">
                  Airworthiness Compliance Standard
                </p>
                <p className="text-xs font-mono text-emerald-400 mt-1">
                  ✓ {data.certification_compliance}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  SHAP feature attribution provides deterministic transparency for PPO neural network power split actions.
                </p>
              </div>

              {/* Feature Importance Bars */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Neural Policy Action Drivers (SHAP φ_i)
                </h3>
                {data.features.map((feat, idx) => {
                  const pct = Math.round(feat.importance * 100);
                  return (
                    <div key={idx} className="bg-slate-900/40 border border-slate-800/60 rounded p-2.5 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-200">{feat.name}</span>
                        <span className="font-mono font-bold text-cyan-400">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {feat.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="h-10 px-4 bg-[#161B22] border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>IIT Indore × HAL Hybrid UAV System Design</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[10px] font-bold uppercase transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
