'use client';

import React, { useState, useCallback } from 'react';
import type { HanoiState, Disk, DiskColor, PegName, Preset } from '../lib/types';
import { DISK_COLORS, PEG_NAMES, COLOR_MAP, PRESETS } from '../lib/types';

interface ConfigPanelProps {
  onSolve: (initial: HanoiState, goal: HanoiState) => void;
  isSolving: boolean;
}

export default function ConfigPanel({ onSolve, isSolving }: ConfigPanelProps) {
  const [numDisks, setNumDisks] = useState(3);
  const [initialDisks, setInitialDisks] = useState<{ size: number; color: DiskColor; peg: PegName }[]>([
    { size: 3, color: 'red', peg: 'A' },
    { size: 2, color: 'blue', peg: 'A' },
    { size: 1, color: 'green', peg: 'A' },
  ]);
  const [goalDisks, setGoalDisks] = useState<{ size: number; color: DiskColor; peg: PegName }[]>([
    { size: 3, color: 'red', peg: 'C' },
    { size: 2, color: 'blue', peg: 'C' },
    { size: 1, color: 'green', peg: 'C' },
  ]);
  const [activeTab, setActiveTab] = useState<'initial' | 'goal'>('initial');
  const [selectedPreset, setSelectedPreset] = useState<number>(0);

  const updateDiskCount = useCallback((count: number) => {
    setNumDisks(count);
    const colors: DiskColor[] = ['red', 'blue', 'green'];
    const newInitial = Array.from({ length: count }, (_, i) => ({
      size: count - i,
      color: colors[i % 3],
      peg: 'A' as PegName,
    }));
    const newGoal = Array.from({ length: count }, (_, i) => ({
      size: count - i,
      color: colors[i % 3],
      peg: 'C' as PegName,
    }));
    setInitialDisks(newInitial);
    setGoalDisks(newGoal);
  }, []);

  const updateDiskColor = useCallback(
    (index: number, color: DiskColor, isGoal: boolean) => {
      const setter = isGoal ? setGoalDisks : setInitialDisks;
      setter((prev) => prev.map((d, i) => (i === index ? { ...d, color } : d)));
    },
    []
  );

  const updateDiskPeg = useCallback(
    (index: number, peg: PegName, isGoal: boolean) => {
      const setter = isGoal ? setGoalDisks : setInitialDisks;
      setter((prev) => prev.map((d, i) => (i === index ? { ...d, peg } : d)));
    },
    []
  );

  const loadPreset = useCallback((index: number) => {
    const preset: Preset = PRESETS[index];
    setSelectedPreset(index);

    // Flatten pegs into disk arrays
    const flattenPegs = (state: HanoiState) => {
      const disks: { size: number; color: DiskColor; peg: PegName }[] = [];
      for (const peg of PEG_NAMES) {
        for (const disk of state.pegs[peg]) {
          disks.push({ ...disk, peg });
        }
      }
      // Sort by size descending (largest first)
      disks.sort((a, b) => b.size - a.size);
      return disks;
    };

    const initDisks = flattenPegs(preset.initialState);
    const goalDsks = flattenPegs(preset.goalState);
    setNumDisks(initDisks.length);
    setInitialDisks(initDisks);
    setGoalDisks(goalDsks);
  }, []);

  const buildState = useCallback((disks: { size: number; color: DiskColor; peg: PegName }[]): HanoiState => {
    const pegs: Record<PegName, Disk[]> = { A: [], B: [], C: [] };
    // Sort by size descending so larger disks go first (bottom of peg)
    const sorted = [...disks].sort((a, b) => b.size - a.size);
    for (const d of sorted) {
      pegs[d.peg].push({ size: d.size, color: d.color });
    }
    return { pegs };
  }, []);

  const handleSolve = () => {
    const initial = buildState(initialDisks);
    const goal = buildState(goalDisks);
    onSolve(initial, goal);
  };

  const currentDisks = activeTab === 'initial' ? initialDisks : goalDisks;
  const isGoal = activeTab === 'goal';

  return (
    <div className="glass-panel p-6 flex flex-col gap-5" id="config-panel">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
             style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))' }}>
          ⚙️
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Configuration</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Set up the initial and goal states</p>
        </div>
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
          Quick Presets
        </label>
        <div className="flex flex-col gap-1.5">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              className="btn-secondary text-left text-xs py-2 px-3"
              style={{
                borderColor: selectedPreset === i ? 'var(--accent-purple)' : undefined,
                background: selectedPreset === i ? 'rgba(136,68,255,0.1)' : undefined,
              }}
              onClick={() => loadPreset(i)}
            >
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{preset.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Disk Count */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
          Number of Disks
        </label>
        <div className="flex gap-2">
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              className="btn-secondary flex-1 text-center font-mono font-bold"
              style={{
                borderColor: numDisks === n ? 'var(--accent-purple)' : undefined,
                background: numDisks === n ? 'rgba(136,68,255,0.15)' : undefined,
                color: numDisks === n ? 'var(--accent-purple)' : undefined,
              }}
              onClick={() => updateDiskCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs: Initial / Goal */}
      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-medium)' }}>
        {(['initial', 'goal'] as const).map((tab) => (
          <button
            key={tab}
            className="flex-1 py-2 text-xs font-semibold transition-colors"
            style={{
              background: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              borderRight: tab === 'initial' ? '1px solid var(--border-medium)' : undefined,
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'initial' ? '📥 Initial State' : '🎯 Goal State'}
          </button>
        ))}
      </div>

      {/* Disk Configuration */}
      <div className="flex flex-col gap-2">
        {currentDisks.map((disk, i) => (
          <div
            key={`${activeTab}-${i}`}
            className="flex items-center gap-2 p-2.5 rounded-lg animate-fadeInUp"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              animationDelay: `${i * 0.05}s`,
            }}
          >
            {/* Size indicator */}
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0"
              style={{
                background: COLOR_MAP[disk.color].gradient,
                boxShadow: COLOR_MAP[disk.color].glow,
              }}
            >
              {disk.size}
            </div>

            {/* Color selector */}
            <select
              className="flex-1 text-xs py-1.5 px-2 rounded-md cursor-pointer"
              style={{
                background: 'var(--bg-tertiary)',
                color: COLOR_MAP[disk.color].text,
                border: '1px solid var(--border-medium)',
                outline: 'none',
              }}
              value={disk.color}
              onChange={(e) => updateDiskColor(i, e.target.value as DiskColor, isGoal)}
            >
              {DISK_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>

            {/* Peg selector */}
            <select
              className="text-xs py-1.5 px-2 rounded-md cursor-pointer"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-medium)',
                outline: 'none',
                width: '60px',
              }}
              value={disk.peg}
              onChange={(e) => updateDiskPeg(i, e.target.value as PegName, isGoal)}
            >
              {PEG_NAMES.map((p) => (
                <option key={p} value={p}>
                  Peg {p}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Solve Button */}
      <button
        className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        onClick={handleSolve}
        disabled={isSolving}
        id="solve-button"
      >
        {isSolving ? (
          <>
            <span className="spinner" />
            Solving...
          </>
        ) : (
          <>
            🚀 Solve Puzzle
          </>
        )}
      </button>
    </div>
  );
}
