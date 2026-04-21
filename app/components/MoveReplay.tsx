'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Move, HanoiState, PegName } from '../lib/types';
import { COLOR_MAP } from '../lib/types';

interface MoveReplayProps {
  moves: Move[];
  initialState: HanoiState;
  onStateChange: (state: HanoiState, moveIndex: number, highlightMove: { from: PegName; to: PegName } | null) => void;
}

function cloneState(state: HanoiState): HanoiState {
  return {
    pegs: {
      A: state.pegs.A.map((d) => ({ ...d })),
      B: state.pegs.B.map((d) => ({ ...d })),
      C: state.pegs.C.map((d) => ({ ...d })),
    },
  };
}

function applyMove(state: HanoiState, move: Move): HanoiState {
  const newState = cloneState(state);
  const disk = newState.pegs[move.from].pop();
  if (disk) {
    newState.pegs[move.to].push(disk);
  }
  return newState;
}

export default function MoveReplay({ moves, initialState, onStateChange }: MoveReplayProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = initial state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800); // ms per step
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build state at a given step index
  const getStateAtStep = useCallback(
    (step: number): HanoiState => {
      let state = cloneState(initialState);
      for (let i = 0; i <= step && i < moves.length; i++) {
        state = applyMove(state, moves[i]);
      }
      return state;
    },
    [initialState, moves]
  );

  // Update visualization whenever step changes
  useEffect(() => {
    const state = getStateAtStep(currentStep);
    const highlight =
      currentStep >= 0 && currentStep < moves.length
        ? { from: moves[currentStep].from, to: moves[currentStep].to }
        : null;
    onStateChange(state, currentStep, highlight);
  }, [currentStep, getStateAtStep, moves, onStateChange]);

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, moves.length]);

  // Reset when moves change
  useEffect(() => {
    setCurrentStep(-1);
    setIsPlaying(false);
  }, [moves]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleStepForward = () => {
    if (currentStep < moves.length - 1) setCurrentStep((p) => p + 1);
  };
  const handleStepBack = () => {
    if (currentStep >= 0) setCurrentStep((p) => p - 1);
  };
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(-1);
  };

  const currentMove = currentStep >= 0 && currentStep < moves.length ? moves[currentStep] : null;
  const progress = moves.length > 0 ? ((currentStep + 1) / moves.length) * 100 : 0;

  return (
    <div className="glass-panel p-5" id="move-replay">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
        >
          ▶️
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Move Replay
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Step through the solution
          </p>
        </div>
        {moves.length > 0 && (
          <div
            className="font-mono text-sm font-bold"
            style={{ color: 'var(--accent-purple)' }}
          >
            {Math.max(currentStep + 1, 0)} / {moves.length}
          </div>
        )}
      </div>

      {moves.length === 0 ? (
        <div
          className="text-center py-6"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="text-2xl mb-2 opacity-30">🎬</div>
          <p className="text-sm">Solve the puzzle to see the move replay</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div
            className="w-full h-1.5 rounded-full mb-4 overflow-hidden"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(progress, 1)}%`,
                background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))',
                boxShadow: '0 0 8px var(--glow-purple)',
              }}
            />
          </div>

          {/* Current move description */}
          <div
            className="py-3 px-4 rounded-lg mb-4 text-center"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentMove ? (
              <div className="animate-fadeInUp">
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  Move {currentStep + 1}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Move{' '}
                  <span style={{ color: COLOR_MAP[currentMove.disk.color].text, fontWeight: 700 }}>
                    {currentMove.disk.color.charAt(0).toUpperCase() + currentMove.disk.color.slice(1)}
                  </span>{' '}
                  disk (size {currentMove.disk.size}) from{' '}
                  <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>Peg {currentMove.from}</span>
                  {' → '}
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Peg {currentMove.to}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ⬆️ Initial state — click Play or Step Forward to begin
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <button className="btn-secondary" onClick={handleReset} title="Reset">
              ⏮
            </button>
            <button
              className="btn-secondary"
              onClick={handleStepBack}
              disabled={currentStep < 0}
              title="Step Back"
            >
              ◀
            </button>

            {isPlaying ? (
              <button
                className="btn-primary py-2 px-5"
                onClick={handlePause}
                title="Pause"
              >
                ⏸ Pause
              </button>
            ) : (
              <button
                className="btn-primary py-2 px-5"
                onClick={handlePlay}
                disabled={currentStep >= moves.length - 1}
                title="Play"
              >
                ▶ Play
              </button>
            )}

            <button
              className="btn-secondary"
              onClick={handleStepForward}
              disabled={currentStep >= moves.length - 1}
              title="Step Forward"
            >
              ▶
            </button>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🐢</span>
            <input
              type="range"
              min={200}
              max={2000}
              step={100}
              value={2200 - speed}
              onChange={(e) => setSpeed(2200 - Number(e.target.value))}
              className="flex-1"
              style={{
                accentColor: 'var(--accent-purple)',
                height: '4px',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🐇</span>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', width: '55px' }}>
              {speed}ms
            </span>
          </div>
        </>
      )}
    </div>
  );
}
