'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-plotly.js to avoid SSR errors
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] w-full flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
      <p className="font-medium animate-pulse">Initializing Visualization Engine...</p>
    </div>
  )
});

interface TelemetryPoint {
  time: number;
  altitude: number;
  speed: number;
  power_required: number;
  power_delivered: number;
  power_motor: number;
  power_engine: number;
  soc: number;
  fuel: number;
  weight: number;
  phase: string;
  deficit: number;
  u: number;
}

interface TelemetryChartProps {
  telemetry: TelemetryPoint[];
}

export default function TelemetryChart({ telemetry }: TelemetryChartProps) {
  const [activeTab, setActiveTab] = useState<'power' | 'resources' | 'trajectory'>('power');

  if (!telemetry || telemetry.length === 0) {
    return (
      <div className="h-[450px] w-full flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-slate-500">
        No simulation data available. Trigger optimization to display charts.
      </div>
    );
  }

  // Convert time in seconds to minutes or hours for easier reading
  const timeMinutes = telemetry.map((pt) => pt.time / 60);

  // Power split data
  const pEngine = telemetry.map((pt) => pt.power_engine);
  const pMotor = telemetry.map((pt) => pt.power_motor);
  const pRequired = telemetry.map((pt) => pt.power_required);

  // Stacked Motor Power (Engine + Motor) for area stacking in Plotly
  const pStackedMotor = pEngine.map((engVal, idx) => engVal + pMotor[idx]);

  // Resource depletion data
  const socPercent = telemetry.map((pt) => pt.soc * 100);
  const fuelKg = telemetry.map((pt) => pt.fuel);

  // Trajectory data
  const altitudeM = telemetry.map((pt) => pt.altitude);
  const speedMs = telemetry.map((pt) => pt.speed);

  // Common Layout Configuration for Dark Mode
  const commonLayout = {
    paper_bgcolor: '#030712', // slate-950
    plot_bgcolor: '#030712',
    font: {
      family: 'system-ui, sans-serif',
      color: '#94a3b8' // slate-400
    },
    hovermode: 'x unified' as const,
    hoverlabel: {
      bgcolor: '#1e293b', // slate-800
      bordercolor: '#334155',
      font: { color: '#f8fafc' }
    },
    margin: { t: 40, r: 40, b: 60, l: 60 },
    xaxis: {
      title: { text: 'Time (Minutes)', font: { size: 12 } },
      gridcolor: '#1e293b',
      zerolinecolor: '#1e293b',
      tickfont: { size: 10 }
    },
    yaxis: {
      gridcolor: '#1e293b',
      zerolinecolor: '#1e293b',
      tickfont: { size: 10 }
    },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      yanchor: 'bottom' as const,
      y: 1.02,
      xanchor: 'right' as const,
      x: 1,
      font: { size: 11 }
    },
    autosize: true
  };

  const renderChart = () => {
    switch (activeTab) {
      case 'power':
        return (
          <Plot
            data={[
              // Area 1: Turboshaft Output
              {
                x: timeMinutes,
                y: pEngine,
                name: 'Turboshaft Power (kW)',
                type: 'scatter',
                mode: 'lines',
                fill: 'tozeroy',
                fillcolor: 'rgba(59, 130, 246, 0.25)', // transparent blue
                line: { color: '#3b82f6', width: 2 },
                hovertemplate: '%{y:.3f} kW<extra></extra>'
              },
              // Area 2: Electric Motor (Stacked)
              {
                x: timeMinutes,
                y: pStackedMotor,
                text: pMotor.map(v => v.toFixed(3)),
                name: 'Electric Motor Power (kW)',
                type: 'scatter',
                mode: 'lines',
                fill: 'tonexty', // Fill between engine and engine+motor
                fillcolor: 'rgba(16, 185, 129, 0.25)', // transparent emerald
                line: { color: '#10b981', width: 2 },
                hovertemplate: '%{text} kW<extra></extra>'
              },
              // Line: Power Required Reference
              {
                x: timeMinutes,
                y: pRequired,
                name: 'Total Power Required (kW)',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#f43f5e', width: 2, dash: 'dash' },
                hovertemplate: '%{y:.3f} kW<extra></extra>'
              }
            ]}
            layout={{
              ...commonLayout,
              yaxis: {
                ...commonLayout.yaxis,
                title: { text: 'Power (kW)', font: { size: 12 } }
              }
            }}
            style={{ width: '100%', height: '420px' }}
            useResizeHandler={true}
            config={{ responsive: true, displayModeBar: false }}
          />
        );

      case 'resources':
        return (
          <Plot
            data={[
              {
                x: timeMinutes,
                y: socPercent,
                name: 'Battery State of Charge (%)',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#eab308', width: 2.5 }
              },
              {
                x: timeMinutes,
                y: fuelKg,
                name: 'Fuel Remaining (kg)',
                type: 'scatter',
                mode: 'lines',
                yaxis: 'y2',
                line: { color: '#f97316', width: 2.5 }
              }
            ]}
            layout={{
              ...commonLayout,
              yaxis: {
                ...commonLayout.yaxis,
                title: { text: 'Battery SoC (%)', font: { size: 12, color: '#eab308' } },
                tickfont: { color: '#eab308' }
              },
              yaxis2: {
                title: { text: 'Fuel Remaining (kg)', font: { size: 12, color: '#f97316' } },
                tickfont: { color: '#f97316' },
                overlaying: 'y',
                side: 'right',
                gridcolor: 'transparent'
              }
            }}
            style={{ width: '100%', height: '420px' }}
            useResizeHandler={true}
            config={{ responsive: true, displayModeBar: false }}
          />
        );

      case 'trajectory':
        return (
          <Plot
            data={[
              {
                x: timeMinutes,
                y: altitudeM,
                name: 'Altitude (m)',
                type: 'scatter',
                mode: 'lines',
                fill: 'tozeroy',
                fillcolor: 'rgba(99, 102, 241, 0.1)', // transparent indigo
                line: { color: '#6366f1', width: 2.5 }
              },
              {
                x: timeMinutes,
                y: speedMs,
                name: 'Speed (m/s)',
                type: 'scatter',
                mode: 'lines',
                yaxis: 'y2',
                line: { color: '#a855f7', width: 2, dash: 'dot' }
              }
            ]}
            layout={{
              ...commonLayout,
              yaxis: {
                ...commonLayout.yaxis,
                title: { text: 'Altitude (m)', font: { size: 12, color: '#6366f1' } },
                tickfont: { color: '#6366f1' }
              },
              yaxis2: {
                title: { text: 'Speed (m/s)', font: { size: 12, color: '#a855f7' } },
                tickfont: { color: '#a855f7' },
                overlaying: 'y',
                side: 'right',
                gridcolor: 'transparent'
              }
            }}
            style={{ width: '100%', height: '420px' }}
            useResizeHandler={true}
            config={{ responsive: true, displayModeBar: false }}
          />
        );
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Mission Telemetry Visualizer</h2>
          <p className="text-xs text-slate-400">Interactive telemetry timeline generated by physics engine</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('power')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'power'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Power Split
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'resources'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resource Status
          </button>
          <button
            onClick={() => setActiveTab('trajectory')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'trajectory'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Flight Profile
          </button>
        </div>
      </div>

      <div className="w-full">{renderChart()}</div>
    </div>
  );
}
