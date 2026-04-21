'use client';

import React from 'react';
import type { SolveResult } from '../lib/types';

interface StatsPanelProps {
  result: SolveResult | null;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  delay: number;
}

function StatCard({ label, value, icon, color, delay }: StatCardProps) {
  return (
    <div
      className="glass-panel p-4 flex flex-col items-center gap-2 animate-fadeInUp"
      style={{
        animationDelay: `${delay}s`,
        borderColor: `${color}20`,
      }}
    >
      <div className="text-xl">{icon}</div>
      <div
        className="font-mono text-2xl font-bold animate-countUp"
        style={{
          color,
          animationDelay: `${delay + 0.2}s`,
        }}
      >
        {value}
      </div>
      <div
        className="text-xs font-medium text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
    </div>
  );
}

export default function StatsPanel({ result }: StatsPanelProps) {
  if (!result) return null;

  const stats: StatCardProps[] = [
    {
      label: 'Solution Moves',
      value: result.solutionDepth,
      icon: '🎯',
      color: 'var(--accent-green)',
      delay: 0,
    },
    {
      label: 'States Explored',
      value: result.totalStepsExplored,
      icon: '🔍',
      color: 'var(--accent-blue)',
      delay: 0.1,
    },
    {
      label: 'Search Tree Size',
      value: result.searchTreeSize,
      icon: '🌳',
      color: 'var(--accent-purple)',
      delay: 0.2,
    },
    {
      label: 'Time Taken',
      value: `${result.timeTakenMs}ms`,
      icon: '⚡',
      color: '#FFD700',
      delay: 0.3,
    },
  ];

  return (
    <div className="glass-panel p-5" id="stats-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent-green), #00CC44)' }}
          >
            📊
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Solution Statistics
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Search performance metrics
            </p>
          </div>
        </div>

        {result.status === 'found' ? (
          <div className="badge badge-success">
            ✓ Solution Found
          </div>
        ) : (
          <div className="badge badge-error">
            ✗ No Solution
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Algorithm info */}
      <div
        className="mt-4 p-3 rounded-lg text-xs"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Algorithm:
        </span>{' '}
        Breadth-First Search (BFS) via LangGraph StateGraph — guarantees optimal (shortest) solution path.
        Each state was validated against both size and color constraints before expansion.
      </div>
    </div>
  );
}
