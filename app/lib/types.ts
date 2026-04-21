// ============================================================
// Color-Constrained Tower of Hanoi — Shared Types
// ============================================================

export type DiskColor = 'red' | 'blue' | 'green';
export type PegName = 'A' | 'B' | 'C';

export interface Disk {
  size: number;       // 1 = smallest, N = largest
  color: DiskColor;
}

export interface HanoiState {
  pegs: Record<PegName, Disk[]>;  // Each array is bottom-to-top order
}

export interface Move {
  from: PegName;
  to: PegName;
  disk: Disk;
  stepNumber: number;
}

export interface ThoughtLog {
  step: number;
  action: 'initialize' | 'expand' | 'goal_check' | 'move_generated' | 'backtrack' | 'solution_found' | 'no_solution';
  detail: string;
  statesInFrontier: number;
  statesExplored: number;
  currentDepth: number;
}

export interface SolveRequest {
  initialState: HanoiState;
  goalState: HanoiState;
}

export interface SolveResult {
  moves: Move[];
  totalStepsExplored: number;
  thoughtProcess: ThoughtLog[];
  searchTreeSize: number;
  solutionDepth: number;
  status: 'found' | 'no_solution';
  timeTakenMs: number;
}

// Preset configurations for quick demos
export interface Preset {
  name: string;
  description: string;
  initialState: HanoiState;
  goalState: HanoiState;
}

export const DISK_COLORS: DiskColor[] = ['red', 'blue', 'green'];

export const PEG_NAMES: PegName[] = ['A', 'B', 'C'];

export const PEG_LABELS: Record<PegName, string> = {
  A: 'Source',
  B: 'Auxiliary',
  C: 'Destination',
};

export const COLOR_MAP: Record<DiskColor, { primary: string; gradient: string; glow: string; text: string }> = {
  red:   { primary: '#FF4444', gradient: 'linear-gradient(135deg, #FF6B6B, #CC0000)', glow: '0 0 20px rgba(255,68,68,0.4)', text: '#FF6B6B' },
  blue:  { primary: '#4488FF', gradient: 'linear-gradient(135deg, #66AAFF, #0044CC)', glow: '0 0 20px rgba(68,136,255,0.4)', text: '#66AAFF' },
  green: { primary: '#44FF88', gradient: 'linear-gradient(135deg, #66FFAA, #00CC44)', glow: '0 0 20px rgba(68,255,136,0.4)', text: '#66FFAA' },
};

// Preset puzzles
export const PRESETS: Preset[] = [
  {
    name: 'Simple (3 disks)',
    description: 'Move 3 colored disks from A to C with specific color order',
    initialState: {
      pegs: {
        A: [
          { size: 3, color: 'red' },
          { size: 2, color: 'blue' },
          { size: 1, color: 'green' },
        ],
        B: [],
        C: [],
      },
    },
    goalState: {
      pegs: {
        A: [],
        B: [],
        C: [
          { size: 3, color: 'red' },
          { size: 2, color: 'blue' },
          { size: 1, color: 'green' },
        ],
      },
    },
  },
  {
    name: 'Color Swap (3 disks)',
    description: 'Achieve a reversed color order on destination peg',
    initialState: {
      pegs: {
        A: [
          { size: 3, color: 'green' },
          { size: 2, color: 'red' },
          { size: 1, color: 'blue' },
        ],
        B: [],
        C: [],
      },
    },
    goalState: {
      pegs: {
        A: [],
        B: [],
        C: [
          { size: 3, color: 'blue' },
          { size: 2, color: 'green' },
          { size: 1, color: 'red' },
        ],
      },
    },
  },
  {
    name: 'Distributed Start (4 disks)',
    description: 'Disks start on multiple pegs — reassemble on C',
    initialState: {
      pegs: {
        A: [
          { size: 4, color: 'red' },
          { size: 2, color: 'green' },
        ],
        B: [
          { size: 3, color: 'blue' },
          { size: 1, color: 'red' },
        ],
        C: [],
      },
    },
    goalState: {
      pegs: {
        A: [],
        B: [],
        C: [
          { size: 4, color: 'red' },
          { size: 3, color: 'blue' },
          { size: 2, color: 'green' },
          { size: 1, color: 'red' },
        ],
      },
    },
  },
];
