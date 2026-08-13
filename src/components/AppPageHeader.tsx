import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
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
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        borderRadius: compact ? 2.25 : 2.75,
        px: { xs: 0.85, md: 1 },
        py: { xs: 0.7, md: 0.9 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.76)} 0%, ${alpha(theme.palette.background.paper, 0.48)} 100%)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: `0 18px 44px ${alpha(theme.palette.common.black, 0.16)}`,
        animation: "appPageHeaderReveal 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
        "@keyframes appPageHeaderReveal": {
          "0%": { opacity: 0, transform: "translateY(-10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "&::before": {
          content: '""',
          position: "absolute",
          width: { xs: 220, md: 320 },
          height: { xs: 220, md: 320 },
          top: { xs: -150, md: -210 },
          right: { xs: -120, md: -150 },
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: -1,
          background:
            "conic-gradient(from 18deg, rgba(212,175,55,0) 0deg, rgba(212,175,55,0.14) 22deg, rgba(212,175,55,0) 44deg, rgba(212,175,55,0.1) 96deg, rgba(212,175,55,0) 138deg, rgba(212,175,55,0.14) 186deg, rgba(212,175,55,0) 228deg, rgba(212,175,55,0.09) 286deg, rgba(212,175,55,0) 330deg, rgba(212,175,55,0.12) 360deg)",
          maskImage: "radial-gradient(circle, transparent 56%, black 57%, black 62%, transparent 63%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 56%, black 57%, black 62%, transparent 63%)",
          opacity: compact ? 0.42 : 0.55,
          transform: compact ? "rotate(-6deg)" : "rotate(0deg)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: { xs: 220, md: 320 },
          height: { xs: 220, md: 320 },
          top: { xs: -150, md: -210 },
          right: { xs: -120, md: -150 },
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: -1,
          background: "radial-gradient(circle, rgba(212,175,55,0.09) 0%, rgba(212,175,55,0.03) 36%, rgba(212,175,55,0) 66%)",
          filter: "blur(0.5px)",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={compact ? 1 : 1.5}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        sx={{
          gap: compact ? 1 : 2,
        }}
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
              fontSize: {
                xs: "1.4rem",
                md: compact ? "1.9rem" : "2.2rem",
              },
              fontWeight: 800,
              lineHeight: 1.08,
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
    </Box>
  );
}