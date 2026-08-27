import { Avatar, Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import AppPageHeader from "../../../components/AppPageHeader";
import { useAuth } from "../../../auth/AuthContext";

export default function AccountPage() {
  const navigate = useNavigate();
  const { isAuthenticated, session, logout } = useAuth();
  const { t } = useTranslation("personal");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow={t("yourAccount.eyebrow")}
          title={t("yourAccount.title")}
          subtitle={t("yourAccount.subtitle")}
          compact
        />
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          {isAuthenticated && session ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
                {session.profilePictureUrl ? (
                  <Avatar src={session.profilePictureUrl} alt={session.displayName} sx={{ width: 56, height: 56 }} />
                ) : (
                  <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main", color: "primary.contrastText" }}>
                    {session.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </Avatar>
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{session.displayName}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {session.email}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                <Chip icon={<VerifiedUserOutlinedIcon />} label={`${t("yourAccount.profile.collectorId")}: ${session.collectorId}`} />
                <Chip label={`${t("yourAccount.profile.role")}: ${session.role ?? t("yourAccount.profile.noRoleAssigned")}`} color="primary" variant="outlined" />
                <Chip label={`${session.permissions.length} ${t("yourAccount.profile.permissions")}`} variant="outlined" />
              </Stack>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutOutlinedIcon />}
                  onClick={handleLogout}
                >
                  {t("yourAccount.profile.logOut")}
                </Button>
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              {t("yourAccount.profile.guest")}
            </Typography>
          )}
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Stack spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{t("yourAccount.preferences.title")}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <PaletteOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {t("yourAccount.preferences.descriptionTheme")}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <PublicOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {t("yourAccount.preferences.descriptionCurrency")}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
