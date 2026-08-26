import { Box, Paper, Stack, Typography } from "@mui/material";
import AppPageHeader from "../../../components/AppPageHeader";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation("about");

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow={t("eyebrow")}
          title="About Saint Collections"
          subtitle="A professional collector workspace designed to organize figurines, monitor trends, and support informed collecting decisions."
          compact
        />
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Our Mission</Typography>
          <Typography variant="body2" color="text.secondary">
            Saint Collections helps collectors centralize inventory, discover release activity, and maintain accurate records across marketplaces.
            The platform combines catalog exploration, ownership tracking, analytics, and matching workflows in a single workspace.
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>What You Can Do</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8 }}>
            1. Browse and filter figurines by lineup, status, anniversary, and market attributes.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8 }}>
            2. Track real-time prices from stores and compare market changes across listings.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            3. Organize personal collections and use charts and matching tools to evaluate trends and align listings with your catalog.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
