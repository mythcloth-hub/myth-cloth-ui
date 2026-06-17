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
