import axios from "axios";

type ApiAction = "load" | "create" | "update" | "delete";

type GetApiErrorMessageOptions = {
  action: ApiAction;
  resource: string;
};

export type ApiErrorSeverity = "error" | "warning";

type ApiErrorCodeConfig = {
  message: string;
  /** Defaults to "error" when omitted. */
  severity?: ApiErrorSeverity;
};

const DEFAULT_API_ERROR_SEVERITY: ApiErrorSeverity = "error";

// Configure how each backend errorCode should be displayed: message text and severity (error = red, warning = amber).
const API_ERROR_CODE_CONFIG: Record<string, ApiErrorCodeConfig> = {
  FIGURINE_IMPORT_ERROR: {
    message: "There was an error while importing the figurines. Please check the data and try again.",
  },
  COLLECTOR_NOT_FOUND: {
    message: "We couldn't find this collector. It may have been removed or is no longer available.",
  },
  COLLECTOR_EMAIL_NOT_FOUND: {
    message: "We couldn't find an account with that email address.",
  },
  COLLECTOR_EMAIL_ALREADY_EXISTS: {
    message: "That email address is already registered.",
    severity: "warning",
  },
  COLLECTOR_INVALID_EMAIL_OR_PASSWORD: {
    message: "Invalid email or password. Please try again.",
  },
  FIGURINE_NOT_FOUND: {
    message: "We couldn't find this figurine. It may have been removed or is no longer available.",
  },
  CATALOG_NOT_FOUND: {
    message: "We couldn't find this catalog item. It may have been removed or is no longer available.",
  },
  COLLECTOR_COLLECTION_LIMIT_REACHED: {
    message: "You have reached the maximum number of collections allowed.",
    severity: "warning",
  },
  UNEXPECTED_ERROR: {
    message: "An unexpected error occurred. Please try again later.",
  },
};

const actionFallbackByType: Record<ApiAction, string> = {
  load: "load",
  create: "create",
  update: "update",
  delete: "delete",
};

const normalizeResource = (resource: string) => resource.trim().toLowerCase();

function extractApiProvidedMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  const errorPayload = data as {
    detail?: unknown;
    title?: unknown;
    message?: unknown;
    error?: unknown;
  };

  const candidates = [errorPayload.detail, errorPayload.title, errorPayload.message, errorPayload.error];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return undefined;
}

function extractApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  const data = error.response?.data;

  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  const maybeCode = (data as { errorCode?: unknown; code?: unknown }).errorCode
    ?? (data as { errorCode?: unknown; code?: unknown }).code;
  if (typeof maybeCode !== "string") {
    return undefined;
  }

  const normalizedCode = maybeCode.trim().toUpperCase();
  return normalizedCode.length > 0 ? normalizedCode : undefined;
}

function getStatusFromUnknownError(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const maybeError = error as {
    status?: unknown;
    response?: { status?: unknown };
  };

  if (typeof maybeError.response?.status === "number") {
    return maybeError.response.status;
  }

  if (typeof maybeError.status === "number") {
    return maybeError.status;
  }

  return undefined;
}

export function getApiErrorMessage(error: unknown, options: GetApiErrorMessageOptions): string {
  return getApiErrorDetails(error, options).message;
}

/** Severity to pair with getApiErrorMessage's text (e.g. Alert's severity prop). Unmapped/status-based messages default to "error". */
export function getApiErrorSeverity(error: unknown): ApiErrorSeverity {
  const apiErrorCode = extractApiErrorCode(error);
  if (apiErrorCode && API_ERROR_CODE_CONFIG[apiErrorCode]) {
    return API_ERROR_CODE_CONFIG[apiErrorCode].severity ?? DEFAULT_API_ERROR_SEVERITY;
  }

  return DEFAULT_API_ERROR_SEVERITY;
}

export function getApiErrorDetails(
  error: unknown,
  options: GetApiErrorMessageOptions,
): { message: string; severity: ApiErrorSeverity } {
  const resource = normalizeResource(options.resource);
  const action = actionFallbackByType[options.action];
  const apiErrorCode = extractApiErrorCode(error);

  if (apiErrorCode && API_ERROR_CODE_CONFIG[apiErrorCode]) {
    const config = API_ERROR_CODE_CONFIG[apiErrorCode];
    return { message: config.message, severity: config.severity ?? DEFAULT_API_ERROR_SEVERITY };
  }

  const apiProvidedMessage = extractApiProvidedMessage(error);

  if (apiProvidedMessage) {
    return { message: apiProvidedMessage, severity: DEFAULT_API_ERROR_SEVERITY };
  }

  const status = getStatusFromUnknownError(error);

  if (!status) {
    return {
      message: "Unable to connect to the server. Please check your connection and try again.",
      severity: DEFAULT_API_ERROR_SEVERITY,
    };
  }

  if (status === 400) {
    return {
      message: `Invalid request while trying to ${action} ${resource}. Please verify the data and try again.`,
      severity: DEFAULT_API_ERROR_SEVERITY,
    };
  }

  if (status === 401) {
    return {
      message: "Your session has expired or you are not authenticated. Please sign in and try again.",
      severity: DEFAULT_API_ERROR_SEVERITY,
    };
  }

  if (status === 403) {
    return { message: `You do not have permission to ${action} ${resource}.`, severity: DEFAULT_API_ERROR_SEVERITY };
  }

  if (status === 404) {
    return { message: `The requested ${resource} could not be found.`, severity: DEFAULT_API_ERROR_SEVERITY };
  }

  if (status === 409) {
    return {
      message: `A conflict occurred while trying to ${action} ${resource}. Please refresh and try again.`,
      severity: DEFAULT_API_ERROR_SEVERITY,
    };
  }

  if (status === 422) {
    return {
      message: `Could not ${action} ${resource}. Please verify the submitted data.`,
      severity: DEFAULT_API_ERROR_SEVERITY,
    };
  }

  if (status === 429) {
    return { message: "Too many requests. Please wait a moment and try again.", severity: DEFAULT_API_ERROR_SEVERITY };
  }

  if (status === 503) {
    return {
      message: "The service is temporarily unavailable. Please try again later.",
      severity: DEFAULT_API_ERROR_SEVERITY,
    };
  }

  if (status >= 500) {
    return {
      message: "The server encountered an error. Please try again in a moment.",
      severity: DEFAULT_API_ERROR_SEVERITY,
    };
  }

  return {
    message: `Failed to ${action} ${resource} (status ${status}). Please try again.`,
    severity: DEFAULT_API_ERROR_SEVERITY,
  };
}
