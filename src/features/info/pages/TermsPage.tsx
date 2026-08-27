import { Box, Paper, Stack, Typography } from "@mui/material";
import AppPageHeader from "../../../components/AppPageHeader";
import { useTranslation } from "react-i18next";

export default function TermsPage() {
  const { t } = useTranslation("info");
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow={t("termsAndConditions.eyebrow")}
          title={t("termsAndConditions.title")}
          subtitle={t("termsAndConditions.subtitle")}
          compact
        />
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{t("termsAndConditions.use.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("termsAndConditions.use.description")}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{t("termsAndConditions.dataResponsibility.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("termsAndConditions.dataResponsibility.description")}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{t("termsAndConditions.changes.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("termsAndConditions.changes.description")}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
