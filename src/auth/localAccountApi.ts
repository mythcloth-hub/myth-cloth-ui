import axios from "axios";
import httpClient from "../api/httpClient";
import type { AuthApiResponse } from "./authSession";

const MOCK_LATENCY_MS = 650;

export const SELF_USER_LOGIN_PATH = "/collectors/auth/self_user";

export const FULL_NAME_MIN_LENGTH = 2;
export const FULL_NAME_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export type EmailSignUpRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type SignUpResponse = {
  collectorId: number;
  fullName: string;
  email: string;
};

export type EmailLoginRequest = {
  email: string;
  password: string;
};

export type LocalAuthErrorCode =
  | "EMAIL_ALREADY_REGISTERED"
  | "INVALID_CREDENTIALS"
  | "INVALID_EMAIL"
  | "INVALID_FULL_NAME_LENGTH"
  | "WEAK_PASSWORD"
  | "PASSWORD_COMPLEXITY"
  | "MISSING_FIELDS"
  | "ACCOUNT_NOT_FOUND";

export class LocalAuthError extends Error {
  readonly code: LocalAuthErrorCode;

  constructor(code: LocalAuthErrorCode) {
    super(code);
    this.name = "LocalAuthError";
    this.code = code;
  }
}

export const SIGN_UP_FIELDS = ["fullName", "email", "password"] as const;

export type SignUpField = (typeof SIGN_UP_FIELDS)[number];

export type SignUpFieldErrors = Partial<Record<SignUpField, string>>;

/** Carries the backend's per-field messages from a 400 "Validation Failed" response. */
export class SignUpValidationError extends Error {
  readonly fieldErrors: SignUpFieldErrors;

  constructor(fieldErrors: SignUpFieldErrors) {
    super("SIGN_UP_VALIDATION_FAILED");
    this.name = "SignUpValidationError";
    this.fieldErrors = fieldErrors;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Mirrors CollectorSignupReq's @Pattern: lower, upper, digit and special character.
const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/;

export function validateSignUpRequest(request: EmailSignUpRequest): LocalAuthErrorCode | null {
  const fullName = request.fullName.trim();
  const email = request.email.trim();

  if (!fullName || !email || !request.password) {
    return "MISSING_FIELDS";
  }

  if (fullName.length < FULL_NAME_MIN_LENGTH || fullName.length > FULL_NAME_MAX_LENGTH) {
    return "INVALID_FULL_NAME_LENGTH";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "INVALID_EMAIL";
  }

  if (request.password.length < PASSWORD_MIN_LENGTH || request.password.length > PASSWORD_MAX_LENGTH) {
    return "WEAK_PASSWORD";
  }

  if (!PASSWORD_COMPLEXITY_PATTERN.test(request.password)) {
    return "PASSWORD_COMPLEXITY";
  }

  return null;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateLoginRequest(request: EmailLoginRequest): LocalAuthErrorCode | null {
  const email = request.email.trim();

  if (!email || !request.password) {
    return "MISSING_FIELDS";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "INVALID_EMAIL";
  }

  if (request.password.length < PASSWORD_MIN_LENGTH || request.password.length > PASSWORD_MAX_LENGTH) {
    return "WEAK_PASSWORD";
  }

  if (!PASSWORD_COMPLEXITY_PATTERN.test(request.password)) {
    return "PASSWORD_COMPLEXITY";
  }

  return null;
}

export async function signUpWithEmailAccount(request: EmailSignUpRequest): Promise<SignUpResponse> {
  const validationError = validateSignUpRequest(request);
  if (validationError) {
    throw new LocalAuthError(validationError);
  }

  try {
    const res = await httpClient.post<SignUpResponse>("/collectors/signup", {
      fullName: request.fullName.trim(),
      email: normalizeEmail(request.email),
      password: request.password,
    });
    return res.data;
  } catch (error) {
    if (isEmailAlreadyRegistered(error)) {
      throw new LocalAuthError("EMAIL_ALREADY_REGISTERED");
    }

    const fieldErrors = extractFieldErrors(error);
    if (fieldErrors) {
      throw new SignUpValidationError(fieldErrors);
    }

    throw error;
  }
}

export async function loginWithEmailAccount(request: EmailLoginRequest): Promise<AuthApiResponse> {
  const validationError = validateLoginRequest(request);
  if (validationError) {
    throw new LocalAuthError(validationError);
  }

  try {
    const res = await httpClient.post<AuthApiResponse>(SELF_USER_LOGIN_PATH, {
      email: normalizeEmail(request.email),
      password: request.password,
    });
    return res.data;
  } catch (error) {
    const code = extractErrorCode(error);

    if (code === "COLLECTOR_EMAIL_NOT_FOUND") {
      throw new LocalAuthError("ACCOUNT_NOT_FOUND");
    }

    if (code === "COLLECTOR_INVALID_EMAIL_OR_PASSWORD") {
      throw new LocalAuthError("INVALID_CREDENTIALS");
    }

    const fieldErrors = extractFieldErrors(error);
    if (fieldErrors) {
      throw new SignUpValidationError(fieldErrors);
    }

    throw error;
  }
}

function extractErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;

  const code = (error.response?.data as { errorCode?: unknown } | undefined)?.errorCode;
  return typeof code === "string" ? code : undefined;
}

function isEmailAlreadyRegistered(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  return extractErrorCode(error) === "COLLECTOR_EMAIL_ALREADY_EXISTS" || error.response?.status === 409;
}

function extractFieldErrors(error: unknown): SignUpFieldErrors | null {
  if (!axios.isAxiosError(error)) return null;

  const errors = (error.response?.data as { errors?: unknown } | undefined)?.errors;
  if (typeof errors !== "object" || errors === null) return null;

  const source = errors as Record<string, unknown>;
  const fieldErrors: SignUpFieldErrors = {};

  for (const field of SIGN_UP_FIELDS) {
    const message = source[field];
    if (typeof message === "string" && message.trim().length > 0) {
      fieldErrors[field] = message.trim();
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await delay(MOCK_LATENCY_MS);

  const normalized = normalizeEmail(email);
  if (!normalized || !EMAIL_PATTERN.test(normalized)) {
    throw new LocalAuthError("INVALID_EMAIL");
  }

  // Mock backend always answers 202 so account existence is not disclosed.
}
