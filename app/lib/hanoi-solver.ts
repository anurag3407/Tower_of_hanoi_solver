// ============================================================
// Color-Constrained Tower of Hanoi — LangGraph BFS Solver
// ============================================================
// Models the search process as a LangGraph StateGraph where each
// node represents a phase of the BFS algorithm. The expand node
// processes a BATCH of states per iteration to stay within the
// graph recursion limit. The graph loops until the goal is found
// or the frontier is exhausted.
// ============================================================

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import type { Disk, PegName, HanoiState, Move, ThoughtLog, SolveResult } from './types';

// ─── Internal search-state types ────────────────────────────

interface SearchNode {
  state: HanoiState;
  moves: Move[];       // moves taken to reach this state
  depth: number;
}

// ─── Utility functions ──────────────────────────────────────

/** Create a canonical hash of a HanoiState for cycle detection */
function stateHash(state: HanoiState): string {
  const pegStrings = (['A', 'B', 'C'] as PegName[]).map((peg) => {
    const disks = state.pegs[peg]
      .map((d) => `${d.size}${d.color[0]}`)
      .join(',');
    return `${peg}:[${disks}]`;
  });
  return pegStrings.join('|');
}

/** Deep clone a HanoiState */
function cloneState(state: HanoiState): HanoiState {
  return {
    pegs: {
      A: state.pegs.A.map((d) => ({ ...d })),
      B: state.pegs.B.map((d) => ({ ...d })),
      C: state.pegs.C.map((d) => ({ ...d })),
    },
  };
}

/** Check if a move is valid (size constraint) */
function isValidMove(from: PegName, to: PegName, state: HanoiState): boolean {
  const fromPeg = state.pegs[from];
  const toPeg = state.pegs[to];
  if (fromPeg.length === 0) return false;
  if (toPeg.length === 0) return true;
  const movingDisk = fromPeg[fromPeg.length - 1];
  const topDisk = toPeg[toPeg.length - 1];
  return movingDisk.size < topDisk.size;
}

/** Check if two HanoiStates are equal */
function statesEqual(a: HanoiState, b: HanoiState): boolean {
  return stateHash(a) === stateHash(b);
}

/** Generate all valid successor states from the current state */
function generateSuccessors(node: SearchNode): { state: HanoiState; move: Move }[] {
  const successors: { state: HanoiState; move: Move }[] = [];
  const pegs: PegName[] = ['A', 'B', 'C'];

  for (const from of pegs) {
    for (const to of pegs) {
      if (from === to) continue;
      if (isValidMove(from, to, node.state)) {
        const newState = cloneState(node.state);
        const disk = newState.pegs[from].pop()!;
        newState.pegs[to].push(disk);
        successors.push({
          state: newState,
          move: {
            from,
            to,
            disk: { ...disk },
            stepNumber: node.moves.length + 1,
          },
        });
      }
    }
  }

  return successors;
}

function pegSummary(state: HanoiState): string {
  return (['A', 'B', 'C'] as PegName[])
    .map((p) => {
      const disks = state.pegs[p];
      if (disks.length === 0) return `${p}:∅`;
      return `${p}:[${disks.map((d) => `${d.color[0].toUpperCase()}${d.size}`).join(',')}]`;
    })
    .join(' | ');
}

// ─── LangGraph State Annotation ────────────────────────────

const SolverAnnotation = Annotation.Root({
  // Input configuration
  initialState: Annotation<HanoiState>({
    reducer: (_curr, update) => update,
    default: () => ({ pegs: { A: [], B: [], C: [] } }),
  }),
  goalState: Annotation<HanoiState>({
    reducer: (_curr, update) => update,
    default: () => ({ pegs: { A: [], B: [], C: [] } }),
  }),

  // BFS data structures
  frontier: Annotation<SearchNode[]>({
    reducer: (_curr, update) => update,
    default: () => [],
  }),
  explored: Annotation<Set<string>>({
    reducer: (_curr, update) => update,
    default: () => new Set(),
  }),

  // Results
  solution: Annotation<Move[]>({
    reducer: (_curr, update) => update,
    default: () => [],
  }),
  status: Annotation<'searching' | 'found' | 'no_solution'>({
    reducer: (_curr, update) => update,
    default: () => 'searching' as const,
  }),
  stepsExplored: Annotation<number>({
    reducer: (_curr, update) => update,
    default: () => 0,
  }),
  searchTreeSize: Annotation<number>({
    reducer: (_curr, update) => update,
    default: () => 0,
  }),
  currentDepth: Annotation<number>({
    reducer: (_curr, update) => update,
    default: () => 0,
  }),

  // Thought process logs — use concat reducer
  logs: Annotation<ThoughtLog[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
});

type SolverState = typeof SolverAnnotation.State;

// How many states to process per graph iteration to keep
// total loop count within LangGraph's recursion limit.
const BATCH_SIZE = 500;

// ─── Graph Nodes ────────────────────────────────────────────

/** Node 1: Initialize the search */
async function initialize(state: SolverState): Promise<Partial<SolverState>> {
  const initialNode: SearchNode = {
    state: cloneState(state.initialState),
    moves: [],
    depth: 0,
  };

  const explored = new Set<string>();
  explored.add(stateHash(initialNode.state));

  const log: ThoughtLog = {
    step: 1,
    action: 'initialize',
    detail: `Initializing BFS search. ${pegSummary(state.initialState)}. Goal: ${pegSummary(state.goalState)}.`,
    statesInFrontier: 1,
    statesExplored: 0,
    currentDepth: 0,
  };

  // Check if initial state IS the goal already
  if (statesEqual(state.initialState, state.goalState)) {
    return {
      frontier: [],
      explored,
      solution: [],
      status: 'found',
      stepsExplored: 0,
      searchTreeSize: 1,
      currentDepth: 0,
      logs: [
        log,
        {
          step: 2,
          action: 'solution_found',
          detail: 'Initial state already matches the goal! No moves needed.',
          statesInFrontier: 0,
          statesExplored: 1,
          currentDepth: 0,
        },
      ],
    };
  }

  return {
    frontier: [initialNode],
    explored,
    stepsExplored: 0,
    searchTreeSize: 1,
    currentDepth: 0,
    logs: [log],
  };
}

/** Node 2: Expand a batch of states from the frontier, checking goal for each */
async function expandBatch(state: SolverState): Promise<Partial<SolverState>> {
  const frontier = [...state.frontier];
  const explored = new Set(state.explored);
  let stepsExplored = state.stepsExplored;
  let currentDepth = state.currentDepth;
  const logs: ThoughtLog[] = [];

  const statesProcessedThisBatch = Math.min(BATCH_SIZE, frontier.length);

  if (frontier.length === 0) {
    return {
      frontier: [],
      status: 'no_solution',
      logs: [
        {
          step: stepsExplored + 1,
          action: 'no_solution',
          detail: `Frontier is empty — all reachable states explored (${explored.size} total). No solution exists for this configuration.`,
          statesInFrontier: 0,
          statesExplored: explored.size,
          currentDepth,
        },
      ],
    };
  }

  for (let b = 0; b < statesProcessedThisBatch; b++) {
    if (frontier.length === 0) break;

    const currentNode = frontier.shift()!;
    stepsExplored++;
    currentDepth = currentNode.depth;

    // ── Goal check ──
    if (statesEqual(currentNode.state, state.goalState)) {
      logs.push({
        step: stepsExplored,
        action: 'solution_found',
        detail: `🎉 Goal state reached at depth ${currentNode.depth}! Solution: ${currentNode.moves.length} moves. Explored ${explored.size} states.`,
        statesInFrontier: frontier.length,
        statesExplored: explored.size,
        currentDepth: currentNode.depth,
      });

      return {
        frontier,
        explored,
        solution: currentNode.moves,
        status: 'found',
        stepsExplored,
        searchTreeSize: explored.size,
        currentDepth: currentNode.depth,
        logs,
      };
    }

    // ── Expand ──
    const successors = generateSuccessors(currentNode);
    let newStatesAdded = 0;

    for (const { state: childState, move } of successors) {
      const hash = stateHash(childState);
      if (!explored.has(hash)) {
        explored.add(hash);
        frontier.push({
          state: childState,
          moves: [...currentNode.moves, move],
          depth: currentNode.depth + 1,
        });
        newStatesAdded++;
      }
    }

    // Add a log every N states to keep log manageable
    if (stepsExplored <= 5 || stepsExplored % 50 === 0 || b === statesProcessedThisBatch - 1) {
      logs.push({
        step: stepsExplored,
        action: 'expand',
        detail: `Expanding depth ${currentNode.depth}: ${pegSummary(currentNode.state)}. ${successors.length} moves possible, ${newStatesAdded} new states added.`,
        statesInFrontier: frontier.length,
        statesExplored: explored.size,
        currentDepth: currentNode.depth,
      });
    }
  }

  // Add batch summary
  logs.push({
    step: stepsExplored,
    action: 'backtrack',
    detail: `Batch complete: processed ${statesProcessedThisBatch} states. ${frontier.length} remain in frontier. Total explored: ${explored.size}. Continuing search...`,
    statesInFrontier: frontier.length,
    statesExplored: explored.size,
    currentDepth,
  });

  return {
    frontier,
    explored,
    stepsExplored,
    searchTreeSize: explored.size,
    currentDepth,
    logs,
  };
}

// ─── Conditional edge: should we keep searching? ────────────

function shouldContinue(state: SolverState): '__end__' | 'expandBatch' {
  if (state.status === 'found' || state.status === 'no_solution') {
    return '__end__';
  }
  if (state.frontier.length === 0) {
    return '__end__';
  }
  return 'expandBatch';
}

// ─── Build the LangGraph StateGraph ─────────────────────────

function buildSolverGraph() {
  const workflow = new StateGraph(SolverAnnotation)
    .addNode('initialize', initialize)
    .addNode('expandBatch', expandBatch)
    .addEdge(START, 'initialize')
    .addConditionalEdges('initialize', shouldContinue, {
      __end__: END,
      expandBatch: 'expandBatch',
    })
    .addConditionalEdges('expandBatch', shouldContinue, {
      __end__: END,
      expandBatch: 'expandBatch',
    });

  return workflow.compile();
}

// ─── Public solve function ──────────────────────────────────

export async function solveTowerOfHanoi(
  initialState: HanoiState,
  goalState: HanoiState
): Promise<SolveResult> {
  const startTime = Date.now();
  const graph = buildSolverGraph();

  // Increase recursion limit — each iteration now processes BATCH_SIZE states,
  // so even 200 iterations covers 100,000 states which is more than enough
  // for up to 6 disks.
  const finalState = await graph.invoke(
    {
      initialState,
      goalState,
    },
    {
      recursionLimit: 500,
    }
  );

  const timeTakenMs = Date.now() - startTime;

  // Limit the number of thought logs for the UI
  const maxLogs = 150;
  let thoughtProcess = finalState.logs as ThoughtLog[];
  if (thoughtProcess.length > maxLogs) {
    thoughtProcess = [
      ...thoughtProcess.slice(0, 8),
      {
        step: -1,
        action: 'backtrack' as const,
        detail: `... (${thoughtProcess.length - 18} intermediate steps omitted for brevity) ...`,
        statesInFrontier: 0,
        statesExplored: 0,
        currentDepth: 0,
      },
      ...thoughtProcess.slice(-10),
    ];
  }

  return {
    moves: finalState.solution,
    totalStepsExplored: finalState.stepsExplored,
    thoughtProcess,
    searchTreeSize: finalState.searchTreeSize,
    solutionDepth: finalState.solution.length,
    status: finalState.status === 'found' ? 'found' : 'no_solution',
    timeTakenMs,
  };
}
