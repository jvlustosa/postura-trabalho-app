export interface ScheduleAutoStartInput {
  /** Whether the current time falls inside the configured schedule window. */
  isWithinWindow: boolean;
  /** Whether the schedule window was open on the previous evaluation. `null` on the first tick. */
  wasWithinWindow: boolean | null;
  /** Whether the posture check is currently running. */
  isCheckActive: boolean;
}

export type ScheduleAutoStartDecision = 'start' | null;

/**
 * Decides whether the schedule should auto-start the posture check.
 *
 * The schedule is "turn-on only": it auto-starts when the window opens, but it
 * MUST NOT stop a run that's already in progress. Stopping is reserved for the user.
 */
export const decideScheduleAutoStart = (
  input: ScheduleAutoStartInput,
): ScheduleAutoStartDecision => {
  if (input.isCheckActive) return null;
  if (!input.isWithinWindow) return null;
  // First evaluation after the effect mounts: start only if we open inside the window.
  if (input.wasWithinWindow === null) return 'start';
  // Otherwise only act on a transition from outside → inside.
  if (input.wasWithinWindow === false) return 'start';
  return null;
};
