import { Box, Link, Paper, Stack, Typography } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import AppPageHeader from "../../../components/AppPageHeader";

export default function ContactPage() {
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow="Settings • Information"
          title="Contact"
          subtitle="Need help with access, data, or behavior? Reach out through the channels below."
          compact
        />
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <EmailOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>General Support</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
            For account, permissions, and onboarding questions, contact:
          </Typography>
          <Link href="mailto:support@saintcollections.com" underline="hover">support@saintcollections.com</Link>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <BugReportOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Bug Reports</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
            Include route, browser/device, and reproduction steps when reporting UI or data issues:
          </Typography>
          <Link href="mailto:bugs@saintcollections.com" underline="hover">bugs@saintcollections.com</Link>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <HelpOutlineOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Response Expectations</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Standard support requests are typically answered within 1-2 business days.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
