'use client';

import React, { useState, useCallback } from 'react';
import type { HanoiState, PegName, SolveResult } from './lib/types';
import ConfigPanel from './components/ConfigPanel';
import PegVisualization from './components/PegVisualization';
import ThoughtProcess from './components/ThoughtProcess';
import MoveReplay from './components/MoveReplay';
import StatsPanel from './components/StatsPanel';

export default function Home() {
  // Solver state
  const [isSolving, setIsSolving] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Visualization state
  const [initialState, setInitialState] = useState<HanoiState>({
    pegs: {
      A: [
        { size: 3, color: 'red' },
        { size: 2, color: 'blue' },
        { size: 1, color: 'green' },
      ],
      B: [],
      C: [],
    },
  });
  const [displayState, setDisplayState] = useState<HanoiState>(initialState);
  const [highlightMove, setHighlightMove] = useState<{ from: PegName; to: PegName } | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // Handle solve request
  const handleSolve = useCallback(async (initial: HanoiState, goal: HanoiState) => {
    setIsSolving(true);
    setResult(null);
    setError(null);
    setInitialState(initial);
    setDisplayState(initial);
    setHighlightMove(null);
    setCurrentMoveIndex(-1);

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialState: initial, goalState: goal }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data: SolveResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsSolving(false);
    }
  }, []);

  // Handle move replay state changes
  const handleReplayStateChange = useCallback(
    (state: HanoiState, moveIndex: number, highlight: { from: PegName; to: PegName } | null) => {
      setDisplayState(state);
      setCurrentMoveIndex(moveIndex);
      setHighlightMove(highlight);
    },
    []
  );

  return (
    <main className="relative z-10 flex flex-col min-h-screen" id="main-content">
      {/* ── Header ── */}
      <header className="px-6 py-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
            boxShadow: '0 4px 16px var(--glow-purple)',
          }}
        >
          🧠
        </div>
        <div>
          <h1 className="text-xl font-bold gradient-text">AI Tower of Hanoi Solver</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Color-constrained state-space search powered by LangGraph
          </p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2">
          <span className="badge" style={{
            background: 'rgba(136,68,255,0.1)',
            color: 'var(--accent-purple)',
            border: '1px solid rgba(136,68,255,0.2)',
          }}>
            BFS Algorithm
          </span>
          <span className="badge" style={{
            background: 'rgba(68,136,255,0.1)',
            color: 'var(--accent-blue)',
            border: '1px solid rgba(68,136,255,0.2)',
          }}>
            LangGraph v1.2
          </span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 p-5">
        {/* Left Column: Config */}
        <aside className="w-full lg:w-[340px] shrink-0">
          <ConfigPanel onSolve={handleSolve} isSolving={isSolving} />
        </aside>

        {/* Right Column: Visualization + Controls */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Peg Visualization */}
          <section className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg, var(--accent-green), #00CC44)' }}
              >
                🗼
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Tower Visualization
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {currentMoveIndex >= 0
                    ? `Showing move ${currentMoveIndex + 1} of ${result?.moves.length ?? 0}`
                    : 'Current state'}
                </p>
              </div>
            </div>
            <PegVisualization
              state={displayState}
              highlightMove={highlightMove}
            />
          </section>

          {/* Move Replay */}
          {result && result.status === 'found' && result.moves.length > 0 && (
            <MoveReplay
              moves={result.moves}
              initialState={initialState}
              onStateChange={handleReplayStateChange}
            />
          )}

          {/* Error display */}
          {error && (
            <div
              className="glass-panel p-4 animate-fadeInUp"
              style={{
                borderColor: 'rgba(255,68,68,0.3)',
                background: 'rgba(255,68,68,0.06)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">❌</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--accent-red)' }}>
                    Error
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {result && <StatsPanel result={result} />}
        </div>
      </div>

      {/* ── Thought Process (Full Width Bottom) ── */}
      <div className="px-5 pb-5">
        <ThoughtProcess
          logs={result?.thoughtProcess ?? []}
          isSearching={isSolving}
        />
      </div>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-4 text-center text-xs"
        style={{
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        Built with{' '}
        <span style={{ color: 'var(--text-secondary)' }}>Next.js</span> +{' '}
        <span style={{ color: 'var(--text-secondary)' }}>LangGraph</span> •{' '}
        State-space search with BFS • Color-constrained Tower of Hanoi
      </footer>
    </main>
  );
}
