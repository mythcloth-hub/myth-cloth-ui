import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  Stack,
  SvgIcon,
  type SvgIconProps,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import FacebookIcon from "@mui/icons-material/Facebook";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";

import { useAuth } from "./AuthContext";
import {
  LocalAuthError,
  SignUpValidationError,
  validateLoginRequest,
  validateSignUpRequest,
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type SignUpField,
  type SignUpFieldErrors,
} from "./localAccountApi";
import { getApiErrorDetails } from "../utils/apiErrorMessage";

export type AuthDialogStep = "options" | "signup" | "login";

type AuthDialogProps = {
  open: boolean;
  initialStep?: AuthDialogStep;
  onClose: () => void;
};

const ERROR_KEY_BY_CODE = {
  EMAIL_ALREADY_REGISTERED: "auth:dialog.errors.emailAlreadyRegistered",
  INVALID_CREDENTIALS: "auth:dialog.errors.invalidCredentials",
  INVALID_EMAIL: "auth:dialog.errors.invalidEmail",
  INVALID_FULL_NAME_LENGTH: "auth:dialog.errors.invalidFullNameLength",
  WEAK_PASSWORD: "auth:dialog.errors.weakPassword",
  PASSWORD_COMPLEXITY: "auth:dialog.errors.passwordComplexity",
  MISSING_FIELDS: "auth:dialog.errors.missingFields",
  ACCOUNT_NOT_FOUND: "auth:dialog.errors.accountNotFound",
} as const;

type AuthDialogErrorKey =
  | (typeof ERROR_KEY_BY_CODE)[keyof typeof ERROR_KEY_BY_CODE]
  | "auth:dialog.errors.unexpected";

const SIGNUP_FORM_ID = "auth-signup-form";
const LOGIN_FORM_ID = "auth-login-form";

const FACEBOOK_BLUE = "#1877F2";

// MUI's GoogleIcon is monochrome; the brand mark requires its four official colors.
function GoogleBrandIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </SvgIcon>
  );
}

export default function AuthDialog({ open, initialStep = "options", onClose }: AuthDialogProps) {
  const { t } = useTranslation(["auth", "common"]);
  const { isAuthenticated, loginWithFacebook, loginWithGoogle, signUpWithEmail, loginWithEmail, facebookEnabled, googleEnabled } = useAuth();

  const [step, setStep] = useState<AuthDialogStep>(initialStep);
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<AuthDialogErrorKey | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errorSeverity, setErrorSeverity] = useState<"error" | "warning">("error");
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [justSignedUpEmail, setJustSignedUpEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setStep(initialStep);
    setFullName("");
    setSignUpEmail("");
    setSignUpPassword("");
    setLoginIdentifier("");
    setLoginPassword("");
    setErrorKey(null);
    setApiError(null);
    setErrorSeverity("error");
    setFieldErrors({});
    setIsSubmitting(false);
    setJustSignedUpEmail(null);
  }, [open, initialStep]);

  // Facebook/Google resolve outside this component, so close on the resulting session change.
  useEffect(() => {
    if (open && isAuthenticated) {
      onClose();
    }
  }, [open, isAuthenticated, onClose]);

  const goToStep = useCallback((next: AuthDialogStep) => {
    setErrorKey(null);
    setApiError(null);
    setErrorSeverity("error");
    setFieldErrors({});
    if (next !== "login") {
      setJustSignedUpEmail(null);
    }
    setStep(next);
  }, []);

  const clearFieldError = useCallback((field: SignUpField) => {
    setFieldErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  }, []);

  const handleFailure = useCallback((error: unknown, action: "create" | "load") => {
    if (error instanceof SignUpValidationError) {
      setFieldErrors(error.fieldErrors);
      return;
    }

    if (error instanceof LocalAuthError) {
      setErrorKey(ERROR_KEY_BY_CODE[error.code]);
      setErrorSeverity(error.severity);
      return;
    }

    const details = getApiErrorDetails(error, { action, resource: "account" });
    setApiError(details.message);
    setErrorSeverity(details.severity);
  }, []);

  const canSubmitSignUp = useMemo(
    () => validateSignUpRequest({ fullName, email: signUpEmail, password: signUpPassword }) === null,
    [fullName, signUpEmail, signUpPassword],
  );

  const canSubmitLogin = useMemo(
    () => validateLoginRequest({ email: loginIdentifier, password: loginPassword }) === null,
    [loginIdentifier, loginPassword],
  );

  const handleSignUp = async () => {
    if (!canSubmitSignUp || isSubmitting) return;

    setIsSubmitting(true);
    setErrorKey(null);
    setApiError(null);
    setErrorSeverity("error");
    setFieldErrors({});
    try {
      await signUpWithEmail({ fullName, email: signUpEmail, password: signUpPassword });
      const registeredEmail = signUpEmail.trim();
      goToStep("login");
      setLoginIdentifier(registeredEmail);
      setLoginPassword("");
      setJustSignedUpEmail(registeredEmail);
    } catch (error) {
      handleFailure(error, "create");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!canSubmitLogin || isSubmitting) return;

    setIsSubmitting(true);
    setErrorKey(null);
    setApiError(null);
    setErrorSeverity("error");
    setFieldErrors({});
    setJustSignedUpEmail(null);
    try {
      await loginWithEmail({ email: loginIdentifier, password: loginPassword });
      onClose();
    } catch (error) {
      handleFailure(error, "create");
    } finally {
      setIsSubmitting(false);
    }
  };

  const providerButtons = (
    <Stack spacing={1.5}>
      {facebookEnabled && (
        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={loginWithFacebook}
          startIcon={<FacebookIcon sx={{ color: FACEBOOK_BLUE }} />}
        >
          {t("auth:dialog.continueWithFacebook")}
        </Button>
      )}
      {googleEnabled && (
        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={loginWithGoogle}
          startIcon={<GoogleBrandIcon />}
        >
          {t("auth:dialog.continueWithGoogle")}
        </Button>
      )}
    </Stack>
  );

  const errorMessage = errorKey
    ? t(errorKey, {
      min: PASSWORD_MIN_LENGTH,
      max: PASSWORD_MAX_LENGTH,
      nameMin: FULL_NAME_MIN_LENGTH,
      nameMax: FULL_NAME_MAX_LENGTH,
    })
    : apiError;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      <DialogTitle sx={{ pb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
        {step !== "options" && (
          <IconButton
            onClick={() => goToStep("options")}
            aria-label={t("auth:dialog.back")}
            size="small"
            sx={{ color: "text.secondary", ml: -0.5 }}
          >
            <ArrowBackOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        {step === "login" ? t("auth:dialog.logInTitle") : t("auth:dialog.signUpTitle")}
      </DialogTitle>

      {step === "options" && (
        <>
          <DialogContent sx={{ pt: 2.5, pb: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Stack spacing={1} alignItems="center">
              <Box
                component="img"
                src="/logo-mark.svg"
                alt={t("common:brand.logoAlt")}
                sx={{ width: 48, height: 48, borderRadius: "50%" }}
              />
              <Typography sx={{ fontWeight: 700 }}>{t("auth:dialog.tagline")}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                {t("auth:dialog.termsNotice")}
              </Typography>
            </Stack>

            {providerButtons}

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => goToStep("signup")}
              startIcon={<MailOutlineOutlinedIcon />}
            >
              {t("auth:dialog.useEmail")}
            </Button>

            <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
              {t("auth:dialog.alreadyMember")}{" "}
              <Link component="button" type="button" underline="hover" onClick={() => goToStep("login")} sx={{ fontWeight: 700 }}>
                {t("auth:dialog.logIn")}
              </Link>
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} startIcon={<CancelOutlinedIcon />}>
              {t("auth:dialog.close")}
            </Button>
          </DialogActions>
        </>
      )}

      {step === "signup" && (
        <>
          <DialogContent sx={{ pt: 2.5, pb: 1 }}>
            <Box
              component="form"
              id={SIGNUP_FORM_ID}
              onSubmit={(event) => {
                event.preventDefault();
                void handleSignUp();
              }}
              sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >
              <TextField
                autoFocus
                fullWidth
                size="medium"
                label={t("auth:dialog.fullName")}
                autoComplete="name"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  clearFieldError("fullName");
                }}
                error={Boolean(fieldErrors.fullName)}
                helperText={fieldErrors.fullName}
                slotProps={{ htmlInput: { maxLength: FULL_NAME_MAX_LENGTH } }}
                sx={{ mt: 0.5 }}
              />
              <TextField
                fullWidth
                size="medium"
                type="email"
                label={t("auth:dialog.emailAddress")}
                autoComplete="email"
                value={signUpEmail}
                onChange={(event) => {
                  setSignUpEmail(event.target.value);
                  clearFieldError("email");
                }}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
              />
              <TextField
                fullWidth
                size="medium"
                type="password"
                label={t("auth:dialog.password")}
                autoComplete="new-password"
                value={signUpPassword}
                onChange={(event) => {
                  setSignUpPassword(event.target.value);
                  clearFieldError("password");
                }}
                error={Boolean(fieldErrors.password)}
                helperText={
                  fieldErrors.password
                  ?? t("auth:dialog.passwordHint", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
                }
                slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_LENGTH } }}
              />

              {errorMessage && <Alert severity={errorSeverity}>{errorMessage}</Alert>}

              <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
                {t("auth:dialog.alreadyMember")}{" "}
                <Link component="button" type="button" underline="hover" onClick={() => goToStep("login")} sx={{ fontWeight: 700 }}>
                  {t("auth:dialog.logIn")}
                </Link>
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} disabled={isSubmitting} startIcon={<CancelOutlinedIcon />}>
              {t("auth:dialog.close")}
            </Button>
            <Button
              type="submit"
              form={SIGNUP_FORM_ID}
              variant="contained"
              disabled={!canSubmitSignUp || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PersonAddAltOutlinedIcon />}
            >
              {t("auth:dialog.signUp")}
            </Button>
          </DialogActions>
        </>
      )}

      {step === "login" && (
        <>
          <DialogContent sx={{ pt: 2.5, pb: 1 }}>
            <Box
              component="form"
              id={LOGIN_FORM_ID}
              onSubmit={(event) => {
                event.preventDefault();
                void handleLogin();
              }}
              sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >
              {justSignedUpEmail && (
                <Alert severity="success">
                  {t("auth:dialog.signUpSuccess", { email: justSignedUpEmail })}
                </Alert>
              )}

              {providerButtons}

              {(facebookEnabled || googleEnabled) && (
                <Divider sx={{ "&::before, &::after": { borderColor: "rgba(255,255,255,0.08)" } }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("auth:dialog.or")}
                  </Typography>
                </Divider>
              )}

              <TextField
                autoFocus
                fullWidth
                size="medium"
                type="email"
                label={t("auth:dialog.emailAddress")}
                autoComplete="email"
                value={loginIdentifier}
                onChange={(event) => {
                  setLoginIdentifier(event.target.value);
                  clearFieldError("email");
                }}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
                sx={{ mt: 0.5 }}
              />
              <TextField
                fullWidth
                size="medium"
                type="password"
                label={t("auth:dialog.password")}
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => {
                  setLoginPassword(event.target.value);
                  clearFieldError("password");
                }}
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password}
                slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_LENGTH } }}
              />

              {errorMessage && <Alert severity={errorSeverity}>{errorMessage}</Alert>}

              <Stack spacing={0.5}>
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", color: "text.disabled", fontWeight: 700 }}
                  title={t("auth:dialog.forgotPasswordUnavailable")}
                >
                  {t("auth:dialog.forgotPassword")}
                </Typography>

                <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
                  {t("auth:dialog.newHere")}{" "}
                  <Link component="button" type="button" underline="hover" onClick={() => goToStep("signup")} sx={{ fontWeight: 700 }}>
                    {t("auth:dialog.signUp")}
                  </Link>
                </Typography>
              </Stack>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} disabled={isSubmitting} startIcon={<CancelOutlinedIcon />}>
              {t("auth:dialog.close")}
            </Button>
            <Button
              type="submit"
              form={LOGIN_FORM_ID}
              variant="contained"
              disabled={!canSubmitLogin || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginOutlinedIcon />}
            >
              {t("auth:dialog.logInTitle")}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
