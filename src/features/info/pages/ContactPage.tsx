import { Box, Link, Paper, Stack, Typography } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import AppPageHeader from "../../../components/AppPageHeader";
import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation("info");

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow={t("contact.eyebrow")}
          title={t("contact.title")}
          subtitle={t("contact.subtitle")}
          compact
        />
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <EmailOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{t("contact.generalSupport.title")}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
            {t("contact.generalSupport.description")}
          </Typography>
          <Link href="mailto:support@saintcollections.com" underline="hover">support@saintcollections.com</Link>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <BugReportOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{t("contact.bugReport.title")}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
            {t("contact.bugReport.description")}
          </Typography>
          <Link href="mailto:bugs@saintcollections.com" underline="hover">bugs@saintcollections.com</Link>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <HelpOutlineOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{t("contact.expectations.title")}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t("contact.expectations.description")}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
