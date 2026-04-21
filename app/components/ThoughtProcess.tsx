'use client';

import React, { useRef, useEffect } from 'react';
import type { ThoughtLog } from '../lib/types';

interface ThoughtProcessProps {
  logs: ThoughtLog[];
  isSearching: boolean;
}

const ACTION_STYLES: Record<string, { icon: string; color: string; bgColor: string }> = {
  initialize: {
    icon: '🟢',
    color: 'var(--accent-green)',
    bgColor: 'rgba(68, 255, 136, 0.06)',
  },
  expand: {
    icon: '🔄',
    color: 'var(--accent-blue)',
    bgColor: 'rgba(68, 136, 255, 0.06)',
  },
  goal_check: {
    icon: '🎯',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.06)',
  },
  move_generated: {
    icon: '➡️',
    color: 'var(--accent-green)',
    bgColor: 'rgba(68, 255, 136, 0.06)',
  },
  backtrack: {
    icon: '↩️',
    color: '#FF8C00',
    bgColor: 'rgba(255, 140, 0, 0.06)',
  },
  solution_found: {
    icon: '🎉',
    color: 'var(--accent-green)',
    bgColor: 'rgba(68, 255, 136, 0.1)',
  },
  no_solution: {
    icon: '❌',
    color: 'var(--accent-red)',
    bgColor: 'rgba(255, 68, 68, 0.08)',
  },
};

function LogEntry({ log, index }: { log: ThoughtLog; index: number }) {
  const style = ACTION_STYLES[log.action] || ACTION_STYLES.expand;

  return (
    <div
      className="log-entry flex gap-3 py-2.5 px-3 rounded-lg"
      style={{
        background: style.bgColor,
        border: `1px solid ${style.color}15`,
        animationDelay: `${index * 0.03}s`,
      }}
    >
      {/* Icon */}
      <div className="text-base shrink-0 mt-0.5">{style.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="font-mono text-xs font-bold"
            style={{ color: style.color }}
          >
            Step {log.step}
          </span>
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: `${style.color}88` }}
          >
            {log.action.replace('_', ' ')}
          </span>
        </div>
        <p
          className="text-xs leading-relaxed break-words"
          style={{ color: 'var(--text-secondary)' }}
        >
          {log.detail}
        </p>

        {/* Stats bar */}
        {log.statesExplored > 0 && (
          <div
            className="flex gap-4 mt-1.5 text-xs font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>explored: {log.statesExplored}</span>
            <span>frontier: {log.statesInFrontier}</span>
            <span>depth: {log.currentDepth}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ThoughtProcess({ logs, isSearching }: ThoughtProcessProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel p-5 flex flex-col" style={{ height: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}
          >
            🤔
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              AI Thought Process
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              BFS search decision log
            </p>
          </div>
        </div>

        {isSearching && (
          <div className="badge badge-searching">
            <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />
            Searching
          </div>
        )}
      </div>

      {/* Log entries */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1"
        style={{
          minHeight: '200px',
          maxHeight: '400px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {logs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3 py-10"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="text-3xl opacity-30">🧠</div>
            <p className="text-sm text-center">
              Configure the puzzle and click <strong>Solve</strong> to see the AI&apos;s thought process
            </p>
          </div>
        ) : (
          logs.map((log, i) => <LogEntry key={`${log.step}-${log.action}-${i}`} log={log} index={i} />)
        )}
      </div>
    </div>
  );
}
