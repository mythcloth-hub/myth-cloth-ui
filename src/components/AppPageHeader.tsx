import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type AppPageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  compact?: boolean;
};

export default function AppPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  compact = false,
}: AppPageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={compact ? 1 : 1.5}
      alignItems={{ xs: "flex-start", md: "center" }}
      justifyContent="space-between"
      sx={{ gap: compact ? 1 : 2 }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="overline"
          sx={{
            display: "block",
            color: "rgba(212,175,55,0.9)",
            letterSpacing: 2,
            lineHeight: 1.1,
            mb: 0.4,
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.55rem", md: compact ? "1.9rem" : "2.2rem" },
            fontWeight: 800,
            lineHeight: 1.08,
            color: "text.primary",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.75,
              maxWidth: 760,
              color: "text.secondary",
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {actions && (
        <Box sx={{ flexShrink: 0, width: { xs: "100%", md: "auto" } }}>
          {actions}
        </Box>
      )}
    </Stack>
  );
}