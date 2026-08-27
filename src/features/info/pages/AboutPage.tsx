import { Box, Paper, Stack, Typography } from "@mui/material";
import AppPageHeader from "../../../components/AppPageHeader";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation("info");

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow={t("about.eyebrow")}
          title={t("about.title")}
          subtitle={t("about.subtitle")}
          compact
        />
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{t("about.ourMission.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("about.ourMission.description")}
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{t("about.whatYouCanDo.title")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8 }}>
            {t("about.whatYouCanDo.step1")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8 }}>
            {t("about.whatYouCanDo.step2")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("about.whatYouCanDo.step3")}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
