const DEFAULT_STAGE_DEADLINE_MS = 210_000;
const MIN_CALL_WINDOW_MS = 5_000;

function boundedDeadline(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_STAGE_DEADLINE_MS;
  return Math.min(Math.max(Math.round(parsed), 30_000), DEFAULT_STAGE_DEADLINE_MS);
}

function diagnosticMessage(error) {
  if (error instanceof Error) return error.message.slice(0, 240);
  if (typeof error === "string") return error.slice(0, 240);
  return "Unknown AI service error.";
}

export function createStageTiming(stage, runId, options = {}) {
  const startedAtMs = Date.now();
  const requestedDeadline = Number(options.deadlineMs);
  const deadlineMs = options.deadlineMs === undefined
    ? boundedDeadline(process.env.AI_STAGE_DEADLINE_MS)
    : Math.min(Math.max(Number.isFinite(requestedDeadline) ? Math.round(requestedDeadline) : 0, 0), DEFAULT_STAGE_DEADLINE_MS);
  const calls = [];

  function elapsedMs() {
    return Date.now() - startedAtMs;
  }

  function snapshot(outcome = "running") {
    return {
      outcome,
      startedAt: new Date(startedAtMs).toISOString(),
      completedAt: outcome === "running" ? null : new Date().toISOString(),
      durationMs: elapsedMs(),
      controlledDeadlineMs: deadlineMs,
      model: process.env.GEMINI_MODEL,
      calls: calls.map((call) => ({ ...call })),
    };
  }

  async function measure(operation, attempt, invoke) {
    const remainingMs = deadlineMs - elapsedMs();
    if (remainingMs < MIN_CALL_WINDOW_MS) {
      const deadlineError = new Error(`The ${stage} AI stage reached its controlled ${Math.round(deadlineMs / 1000)}-second deadline before another model call could safely begin.`);
      deadlineError.code = "AI_STAGE_DEADLINE";
      throw deadlineError;
    }

    const call = {
      operation,
      attempt,
      startedAt: new Date().toISOString(),
      timeoutMs: remainingMs,
      durationMs: 0,
      outcome: "running",
    };
    calls.push(call);
    const callStartedAt = Date.now();
    console.info(JSON.stringify({ event: "agent_ai_call_started", stage, runId, operation, attempt, timeoutMs: remainingMs }));

    try {
      const result = await invoke(remainingMs);
      call.durationMs = Date.now() - callStartedAt;
      call.outcome = "complete";
      console.info(JSON.stringify({ event: "agent_ai_call_completed", stage, runId, operation, attempt, durationMs: call.durationMs }));
      return result;
    } catch (error) {
      call.durationMs = Date.now() - callStartedAt;
      call.outcome = "error";
      call.error = diagnosticMessage(error);
      console.warn(JSON.stringify({ event: "agent_ai_call_failed", stage, runId, operation, attempt, durationMs: call.durationMs, error: call.error }));
      if (/timed?\s*out|timeout|abort/i.test(call.error) && call.durationMs >= Math.max(1_000, call.timeoutMs - 2_000)) {
        const deadlineError = new Error(`The ${stage} AI stage reached its controlled ${Math.round(deadlineMs / 1000)}-second processing deadline.`);
        deadlineError.code = "AI_STAGE_DEADLINE";
        throw deadlineError;
      }
      throw error;
    }
  }

  function finish(outcome) {
    const diagnostics = snapshot(outcome);
    console.info(JSON.stringify({ event: "agent_stage_finished", stage, runId, ...diagnostics }));
    return diagnostics;
  }

  return { deadlineMs, elapsedMs, measure, finish };
}
