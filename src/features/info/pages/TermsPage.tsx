import { Box, Paper, Stack, Typography } from "@mui/material";
import AppPageHeader from "../../../components/AppPageHeader";

export default function TermsPage() {
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow="Settings • Information"
          title="Terms & Conditions"
          subtitle="Please read these terms before using Saint Collections. They explain what you can expect from the app and what we expect from you."
          compact
        />
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Acceptable Use</Typography>
          <Typography variant="body2" color="text.secondary">
            Please use the application responsibly and only for lawful purposes. Do not attempt to misuse features,
            bypass permissions, or interfere with how the app works for others.
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Data Responsibility</Typography>
          <Typography variant="body2" color="text.secondary">
            You are responsible for checking your import sources, keeping backups when needed, and verifying that your
            collection data is correct before making buying or business decisions.
          </Typography>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Service Changes</Typography>
          <Typography variant="body2" color="text.secondary">
            Features and screens may change over time as we improve the platform. By continuing to use the app after
            updates, you agree to the latest version of these terms.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
