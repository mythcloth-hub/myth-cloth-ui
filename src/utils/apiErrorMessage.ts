import axios from "axios";

type ApiAction = "load" | "create" | "update" | "delete";

type GetApiErrorMessageOptions = {
  action: ApiAction;
  resource: string;
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
  const resource = normalizeResource(options.resource);
  const action = actionFallbackByType[options.action];
  const apiProvidedMessage = extractApiProvidedMessage(error);

  if (apiProvidedMessage) {
    return apiProvidedMessage;
  }

  const status = getStatusFromUnknownError(error);

  if (!status) {
    return "Unable to connect to the server. Please check your connection and try again.";
  }

  if (status === 400) {
    return `Invalid request while trying to ${action} ${resource}. Please verify the data and try again.`;
  }

  if (status === 401) {
    return "Your session has expired or you are not authenticated. Please sign in and try again.";
  }

  if (status === 403) {
    return `You do not have permission to ${action} ${resource}.`;
  }

  if (status === 404) {
    return `The requested ${resource} could not be found.`;
  }

  if (status === 409) {
    return `A conflict occurred while trying to ${action} ${resource}. Please refresh and try again.`;
  }

  if (status === 422) {
    return `Could not ${action} ${resource}. Please verify the submitted data.`;
  }

  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (status === 503) {
    return "The service is temporarily unavailable. Please try again later.";
  }

  if (status >= 500) {
    return "The server encountered an error. Please try again in a moment.";
  }

  return `Failed to ${action} ${resource} (status ${status}). Please try again.`;
}
