// ============================================================
// POST /api/solve — Tower of Hanoi solver endpoint
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { solveTowerOfHanoi } from '@/app/lib/hanoi-solver';
import type { SolveRequest } from '@/app/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: SolveRequest = await request.json();

    // Basic validation
    if (!body.initialState?.pegs || !body.goalState?.pegs) {
      return NextResponse.json(
        { error: 'Invalid request: missing initialState or goalState with pegs' },
        { status: 400 }
      );
    }

    const { initialState, goalState } = body;

    // Validate pegs exist
    for (const peg of ['A', 'B', 'C'] as const) {
      if (!Array.isArray(initialState.pegs[peg]) || !Array.isArray(goalState.pegs[peg])) {
        return NextResponse.json(
          { error: `Invalid request: peg ${peg} must be an array` },
          { status: 400 }
        );
      }
    }

    // Validate total disk count matches
    const initialDiskCount =
      initialState.pegs.A.length + initialState.pegs.B.length + initialState.pegs.C.length;
    const goalDiskCount =
      goalState.pegs.A.length + goalState.pegs.B.length + goalState.pegs.C.length;

    if (initialDiskCount !== goalDiskCount) {
      return NextResponse.json(
        { error: `Disk count mismatch: initial has ${initialDiskCount}, goal has ${goalDiskCount}` },
        { status: 400 }
      );
    }

    if (initialDiskCount === 0) {
      return NextResponse.json(
        { error: 'No disks configured' },
        { status: 400 }
      );
    }

    if (initialDiskCount > 6) {
      return NextResponse.json(
        { error: 'Maximum 6 disks supported (state space grows exponentially)' },
        { status: 400 }
      );
    }

    const result = await solveTowerOfHanoi(initialState, goalState);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Solve error:', error);
    return NextResponse.json(
      { error: 'Internal server error during solve' },
      { status: 500 }
    );
  }
}
