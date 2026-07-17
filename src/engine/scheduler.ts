// FSRS-lite scheduler. Language-agnostic.
// Grade: 0=Again 1=Hard 2=Good 3=Easy
import type { LearnerChunkState } from "./types";

export interface ScheduleInput {
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
}

export interface ScheduleOutput extends ScheduleInput {
  interval_days: number;
  due_at: string;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Apply a grade to a chunk's memory state and produce the next review time.
 * Simplified FSRS: stability grows on success, resets on lapse; difficulty drifts.
 */
export function schedule(prev: ScheduleInput, grade: 0 | 1 | 2 | 3): ScheduleOutput {
  let { stability, difficulty, reps, lapses } = prev;
  reps += 1;

  if (grade === 0) {
    // Lapse: reset stability, difficulty edges up.
    lapses += 1;
    stability = Math.max(0.5, stability * 0.3);
    difficulty = Math.min(10, difficulty + 1.2);
  } else {
    // Success: stability grows by a factor tied to grade and current difficulty.
    const bonus = grade === 1 ? 1.2 : grade === 2 ? 2.0 : 3.2;
    const easeFactor = 1 + (10 - difficulty) / 20; // 1.0 – 1.5
    stability = Math.max(0.5, stability * bonus * easeFactor);
    // Difficulty drifts toward mid-range, easier if user found it easy.
    const drift = grade === 3 ? -0.6 : grade === 2 ? -0.15 : 0.3;
    difficulty = Math.min(10, Math.max(1, difficulty + drift));
  }

  const intervalDays = Math.max(0.007, stability); // min ~10 minutes for Again
  const due = new Date(Date.now() + intervalDays * DAY).toISOString();

  return {
    stability,
    difficulty,
    reps,
    lapses,
    interval_days: intervalDays,
    due_at: due,
  };
}

export function isDue(state: Pick<LearnerChunkState, "due_at">, now = new Date()): boolean {
  return new Date(state.due_at).getTime() <= now.getTime();
}
