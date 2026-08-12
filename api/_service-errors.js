const transientCodes = new Set([429, 500, 502, 503, 504]);

export function errorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try { return JSON.stringify(error); } catch { return "Unknown service error."; }
}

export function serviceStatus(error) {
  const directCode = Number(error?.status ?? error?.code ?? error?.error?.code);
  if (Number.isInteger(directCode) && directCode >= 400) return directCode;
  const message = errorMessage(error);
  const codeMatch = message.match(/(?:"code"\s*:\s*|\b)(429|500|502|503|504)\b/);
  if (codeMatch) return Number(codeMatch[1]);
  if (/RESOURCE_EXHAUSTED|UNAVAILABLE|high demand|temporar(?:y|ily unavailable)|rate limit|timed?\s*out/i.test(message)) return /RESOURCE_EXHAUSTED|rate limit/i.test(message) ? 429 : 503;
  return 500;
}

export function isTransientServiceError(error) {
  const message = errorMessage(error);
  if (/validation|schema|invalid json|unexpected token|must preserve|must provide|must create|must identify|must assess|must select|must rank|prohibited|invented|did not preserve|did not return/i.test(message)) return false;
  const directCode = Number(error?.status ?? error?.code ?? error?.error?.code);
  if (Number.isInteger(directCode)) return transientCodes.has(directCode);
  if (/(?:(?:"code"\s*:\s*)|\b)(429|500|502|503|504)\b/.test(message)) return true;
  return /RESOURCE_EXHAUSTED|UNAVAILABLE|high demand|temporar(?:y|ily unavailable)|rate limit|FUNCTION_INVOCATION_TIMEOUT|timed?\s*out|ECONNRESET|ETIMEDOUT/i.test(message);
}

export function sendStageError(response, stage, runId, error) {
  const transient = isTransientServiceError(error);
  const role = `${stage.slice(0, 1).toUpperCase()}${stage.slice(1)}`;
  if (transient) {
    response.setHeader("Retry-After", "4");
    return response.status(serviceStatus(error) === 429 ? 429 : 503).json({
      runId,
      stage,
      retryable: true,
      error: `${role} could not reach the AI service because it is temporarily busy. Solution Studio will retry this stage automatically.`,
      diagnosticCode: serviceStatus(error),
      aiDisclosure: "No completed AI artefact was produced for this attempt.",
    });
  }
  return response.status(500).json({
    runId,
    stage,
    retryable: false,
    error: errorMessage(error) || `The ${role} stage failed.`,
    aiDisclosure: "No completed AI recommendation was produced.",
  });
}
