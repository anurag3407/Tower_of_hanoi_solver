'use client';

import React from 'react';
import type { HanoiState, PegName, Disk } from '../lib/types';
import { PEG_NAMES, PEG_LABELS, COLOR_MAP } from '../lib/types';

interface PegVisualizationProps {
  state: HanoiState;
  highlightMove?: { from: PegName; to: PegName } | null;
  label?: string;
}

const MAX_DISK_WIDTH = 140;
const MIN_DISK_WIDTH = 50;
const DISK_HEIGHT = 28;
const PEG_HEIGHT = 200;
const BASE_WIDTH = 160;

function getDiskWidth(size: number, maxSize: number): number {
  if (maxSize <= 1) return MAX_DISK_WIDTH;
  const ratio = (size - 1) / (maxSize - 1);
  return MIN_DISK_WIDTH + ratio * (MAX_DISK_WIDTH - MIN_DISK_WIDTH);
}

function DiskElement({ disk, maxSize, animating }: { disk: Disk; maxSize: number; animating: boolean }) {
  const width = getDiskWidth(disk.size, maxSize);
  const colorInfo = COLOR_MAP[disk.color];

  return (
    <div
      className={animating ? 'animate-diskPlace' : ''}
      style={{
        width: `${width}px`,
        height: `${DISK_HEIGHT}px`,
        background: colorInfo.gradient,
        borderRadius: '8px',
        boxShadow: `${colorInfo.glow}, inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Disk label */}
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'var(--font-mono)',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          letterSpacing: '0.05em',
        }}
      >
        {disk.color[0].toUpperCase()}{disk.size}
      </span>
      {/* Shine effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
          borderRadius: '8px 8px 0 0',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function PegColumn({
  pegName,
  disks,
  maxSize,
  isHighlightFrom,
  isHighlightTo,
}: {
  pegName: PegName;
  disks: Disk[];
  maxSize: number;
  isHighlightFrom: boolean;
  isHighlightTo: boolean;
}) {
  const highlightColor = isHighlightFrom
    ? 'var(--accent-red)'
    : isHighlightTo
    ? 'var(--accent-green)'
    : 'var(--peg-rod)';

  return (
    <div className="flex flex-col items-center" style={{ width: `${BASE_WIDTH + 20}px` }}>
      {/* Peg rod + disks container */}
      <div
        style={{
          height: `${PEG_HEIGHT}px`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Rod */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '6px',
            height: `${PEG_HEIGHT - 10}px`,
            background: `linear-gradient(180deg, ${highlightColor}, ${highlightColor}88)`,
            borderRadius: '3px 3px 0 0',
            transition: 'background 0.3s ease',
            boxShadow: isHighlightFrom || isHighlightTo
              ? `0 0 12px ${highlightColor}44`
              : 'none',
          }}
        />

        {/* Disks stacked from bottom */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: '2px',
            position: 'relative',
            zIndex: 1,
            paddingBottom: '2px',
          }}
        >
          {disks.map((disk, i) => (
            <DiskElement
              key={`${pegName}-${disk.size}-${disk.color}-${i}`}
              disk={disk}
              maxSize={maxSize}
              animating={isHighlightTo && i === disks.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Base */}
      <div
        style={{
          width: `${BASE_WIDTH}px`,
          height: '6px',
          background: `linear-gradient(90deg, transparent, var(--peg-base), var(--peg-base), transparent)`,
          borderRadius: '0 0 4px 4px',
        }}
      />

      {/* Label */}
      <div className="mt-3 text-center">
        <div
          className="font-mono text-sm font-bold"
          style={{
            color: isHighlightFrom
              ? 'var(--accent-red)'
              : isHighlightTo
              ? 'var(--accent-green)'
              : 'var(--text-primary)',
            transition: 'color 0.3s ease',
          }}
        >
          Peg {pegName}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {PEG_LABELS[pegName]}
        </div>
        <div
          className="text-xs font-mono mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {disks.length} disk{disks.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export default function PegVisualization({ state, highlightMove, label }: PegVisualizationProps) {
  // Find the maximum disk size across all pegs
  const allDisks = [...state.pegs.A, ...state.pegs.B, ...state.pegs.C];
  const maxSize = allDisks.length > 0 ? Math.max(...allDisks.map((d) => d.size)) : 1;

  return (
    <div>
      {label && (
        <div
          className="text-xs font-medium mb-3 text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </div>
      )}
      <div className="flex justify-center items-end gap-4 md:gap-8">
        {PEG_NAMES.map((peg) => (
          <PegColumn
            key={peg}
            pegName={peg}
            disks={state.pegs[peg]}
            maxSize={maxSize}
            isHighlightFrom={highlightMove?.from === peg}
            isHighlightTo={highlightMove?.to === peg}
          />
        ))}
      </div>
    </div>
  );
}
