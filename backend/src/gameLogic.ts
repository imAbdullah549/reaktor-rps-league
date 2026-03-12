/**
 * RPS game logic: winner from two moves, and normalize BAD API game to NormalizedMatch.
 * Four outcomes: A, B, draw, invalid (invalid = at least one move not ROCK/PAPER/SCISSORS).
 */

import type { BadApiGameResult, InvalidMove, NormalizedMatch, Winner } from './types';

const VALID_MOVES = ['ROCK', 'PAPER', 'SCISSORS'] as const;

function normalizeMove(m: string): string {
  return String(m).trim().toUpperCase();
}

export function isValidMove(m: string): boolean {
  return VALID_MOVES.includes(normalizeMove(m) as (typeof VALID_MOVES)[number]);
}

/**
 * Returns who had the invalid move (only when at least one move is invalid).
 */
export function getInvalidMove(moveA: string, moveB: string): InvalidMove | undefined {
  const aValid = isValidMove(moveA);
  const bValid = isValidMove(moveB);
  if (aValid && bValid) return undefined;
  if (!aValid && !bValid) return 'both';
  return aValid ? 'B' : 'A';
}

/**
 * Returns winner: A, B, draw, or invalid.
 * Invalid when at least one move is not ROCK/PAPER/SCISSORS.
 */
export function getWinner(moveA: string, moveB: string): Winner {
  if (!isValidMove(moveA) || !isValidMove(moveB)) return 'invalid';
  const a = normalizeMove(moveA);
  const b = normalizeMove(moveB);
  if (a === b) return 'draw';
  if (a === 'ROCK' && b === 'SCISSORS') return 'A';
  if (a === 'ROCK' && b === 'PAPER') return 'B';
  if (a === 'PAPER' && b === 'ROCK') return 'A';
  if (a === 'PAPER' && b === 'SCISSORS') return 'B';
  if (a === 'SCISSORS' && b === 'PAPER') return 'A';
  if (a === 'SCISSORS' && b === 'ROCK') return 'B';
  return 'invalid';
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

/**
 * Converts one BAD API game result into a normalized match with winner and date.
 */
export function normalizeGameResult(raw: BadApiGameResult): NormalizedMatch {
  const moveA = raw.playerA.played;
  const moveB = raw.playerB.played;
  const winner = getWinner(moveA, moveB);
  const invalidMove = winner === 'invalid' ? getInvalidMove(moveA, moveB) : undefined;

  return {
    gameId: raw.gameId,
    time: raw.time,
    playerA: raw.playerA.name,
    playerB: raw.playerB.name,
    moveA,
    moveB,
    winner,
    ...(invalidMove !== undefined && { invalidMove }),
    date: formatDate(raw.time),
  };
}
