/**
 * Pipeline logging utility for structured console output.
 * Tracks timing, token usage, and provides scoped logging for parallel runs.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type StepStatus = 'start' | 'success' | 'error';

export interface TokenUsage {
  input: number;
  output: number;
}

export interface StepLog {
  phase: string;
  step: string;
  status: StepStatus;
  durationMs?: number;
  input?: string;
  output?: string;
  error?: string;
  tokens?: TokenUsage;
}

interface StepTiming {
  startTime: number;
  phase: string;
  step: string;
}

const DEFAULT_TRUNCATE_LENGTH = 100;

function truncate(text: string, maxLength: number = DEFAULT_TRUNCATE_LENGTH): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function getTimestamp(): string {
  return new Date().toISOString().slice(11, 23);
}

/**
 * Global timing storage for standalone logStep usage
 */
const globalTimings = new Map<string, number>();

/**
 * Logs a pipeline step with timing and structured output.
 * For parallel execution tracking, use createPipelineRun() instead.
 */
export function logStep(log: StepLog): void {
  const key = `${log.phase}:${log.step}`;
  const timestamp = getTimestamp();

  if (log.status === 'start') {
    globalTimings.set(key, Date.now());
    console.log(`[${timestamp}] [${log.phase}] ${log.step} starting...`);
    if (log.input) {
      console.log(`  Input: ${truncate(log.input)}`);
    }
    return;
  }

  const startTime = globalTimings.get(key);
  const duration = startTime ? Date.now() - startTime : log.durationMs ?? 0;
  const statusIndicator = log.status === 'success' ? 'OK' : 'FAIL';

  console.log(`[${timestamp}] [${log.phase}] ${log.step} ${statusIndicator} (${formatDuration(duration)})`);

  if (log.tokens) {
    console.log(`  Tokens: ${log.tokens.input} in / ${log.tokens.output} out`);
  }

  if (log.output) {
    console.log(`  Output: ${truncate(log.output)}`);
  }

  if (log.error) {
    console.error(`  Error: ${log.error}`);
  }

  globalTimings.delete(key);
}

/**
 * A pipeline run logger scoped to a specific run ID.
 * Useful for tracking parallel executions without timing conflicts.
 */
export interface PipelineRunLogger {
  runId: string;
  startedAt: Date;
  
  /** Log a step start/success/error */
  logStep: (log: Omit<StepLog, 'durationMs'>) => void;
  
  /** Get total elapsed time since run started */
  getElapsedMs: () => number;
  
  /** Log a summary of the entire run */
  logSummary: (status: 'success' | 'error', message?: string) => void;
}

/**
 * Creates a logger scoped to a specific pipeline run.
 * Each run has isolated timing tracking for parallel execution safety.
 */
export function createPipelineRun(runId?: string): PipelineRunLogger {
  const id = runId ?? generateRunId();
  const startedAt = new Date();
  const timings = new Map<string, StepTiming>();
  let stepCount = 0;
  let errorCount = 0;

  function getKey(phase: string, step: string): string {
    return `${phase}:${step}`;
  }

  return {
    runId: id,
    startedAt,

    logStep(log: Omit<StepLog, 'durationMs'>): void {
      const key = getKey(log.phase, log.step);
      const timestamp = getTimestamp();

      if (log.status === 'start') {
        timings.set(key, {
          startTime: Date.now(),
          phase: log.phase,
          step: log.step,
        });
        stepCount++;
        console.log(`[${timestamp}] [${id}] [${log.phase}] ${log.step} starting...`);
        if (log.input) {
          console.log(`  Input: ${truncate(log.input)}`);
        }
        return;
      }

      const timing = timings.get(key);
      const duration = timing ? Date.now() - timing.startTime : 0;
      const statusIndicator = log.status === 'success' ? 'OK' : 'FAIL';

      if (log.status === 'error') {
        errorCount++;
      }

      console.log(`[${timestamp}] [${id}] [${log.phase}] ${log.step} ${statusIndicator} (${formatDuration(duration)})`);

      if (log.tokens) {
        console.log(`  Tokens: ${log.tokens.input} in / ${log.tokens.output} out`);
      }

      if (log.output) {
        console.log(`  Output: ${truncate(log.output)}`);
      }

      if (log.error) {
        console.error(`  Error: ${log.error}`);
      }

      timings.delete(key);
    },

    getElapsedMs(): number {
      return Date.now() - startedAt.getTime();
    },

    logSummary(status: 'success' | 'error', message?: string): void {
      const elapsed = Date.now() - startedAt.getTime();
      const timestamp = getTimestamp();
      const statusIndicator = status === 'success' ? 'COMPLETE' : 'FAILED';
      
      console.log('');
      console.log(`[${timestamp}] [${id}] Pipeline ${statusIndicator}`);
      console.log(`  Total time: ${formatDuration(elapsed)}`);
      console.log(`  Steps: ${stepCount} (${errorCount} errors)`);
      if (message) {
        console.log(`  ${message}`);
      }
    },
  };
}

/**
 * Generates a short unique run ID for tracking parallel executions.
 * Format: run_<timestamp>_<random>
 */
function generateRunId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `run_${timestamp}_${random}`;
}

/**
 * Utility to create a step logger helper for a specific phase.
 * Reduces boilerplate when logging multiple steps in the same phase.
 */
export function createPhaseLogger(
  logger: PipelineRunLogger,
  phase: string
): {
  start: (step: string, input?: string) => void;
  success: (step: string, tokens?: TokenUsage, output?: string) => void;
  error: (step: string, error: string) => void;
} {
  return {
    start(step: string, input?: string): void {
      logger.logStep({ phase, step, status: 'start', input });
    },
    success(step: string, tokens?: TokenUsage, output?: string): void {
      logger.logStep({ phase, step, status: 'success', tokens, output });
    },
    error(step: string, error: string): void {
      logger.logStep({ phase, step, status: 'error', error });
    },
  };
}
