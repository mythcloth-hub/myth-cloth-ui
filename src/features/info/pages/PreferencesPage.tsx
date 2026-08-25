import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Tooltip, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { alpha, useTheme } from "@mui/material/styles";
import AppPageHeader from "../../../components/AppPageHeader";
import { useDisplayCurrency } from "../../../currency/CurrencyContext";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "../../../currency/currency";
import { countryCodeToFlag } from "../../../utils/countryFlag";
import { useAppTheme } from "../../../theme/ThemeContext";
import { THEME_META, type ThemeId } from "../../../theme/themes";

const CURRENCY_META: Record<SupportedCurrency, { countryCode: string; symbol: string }> = {
  JPY: { countryCode: "JP", symbol: "JPY" },
  MXN: { countryCode: "MX", symbol: "MXN" },
  EUR: { countryCode: "EU", symbol: "EUR" },
  USD: { countryCode: "US", symbol: "USD" },
  CNY: { countryCode: "CN", symbol: "CNY" },
  CAD: { countryCode: "CA", symbol: "CAD" },
};

export default function PreferencesPage() {
  const theme = useTheme();
  const { selectedCurrency, setSelectedCurrency } = useDisplayCurrency();
  const { themeId, setThemeId } = useAppTheme();

  const handleCurrencyChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedCurrency(value ? (value as SupportedCurrency) : null);
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <AppPageHeader
          eyebrow="Settings • Personal"
          title="Preferences"
          subtitle="Configure global visual and display options for the entire application."
          compact
        />
      </Box>

      <Stack spacing={2}>
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
            Display Currency
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Choose how monetary values are shown across pages and reports.
          </Typography>

          <FormControl
            size="small"
            fullWidth
            sx={{
              maxWidth: 360,
              "& .MuiInputBase-root": {
                minHeight: 38,
                fontSize: "0.9rem",
              },
            }}
          >
            <InputLabel id="settings-display-currency-label">Currency</InputLabel>
            <Select
              labelId="settings-display-currency-label"
              label="Currency"
              value={selectedCurrency ?? ""}
              onChange={handleCurrencyChange}
              renderValue={(value) => {
                if (!value) {
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Typography component="span" sx={{ fontSize: "1rem", lineHeight: 1 }}>
                        🌐
                      </Typography>
                      <Typography component="span" sx={{ fontSize: "0.9rem" }}>
                        Auto
                      </Typography>
                    </Box>
                  );
                }

                const code = value as SupportedCurrency;
                const meta = CURRENCY_META[code];

                return (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Typography component="span" sx={{ fontSize: "1rem", lineHeight: 1 }}>
                      {countryCodeToFlag(meta.countryCode)}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: "0.9rem", fontWeight: 700 }}>
                      {code}
                    </Typography>
                  </Box>
                );
              }}
            >
              <MenuItem value="">
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Typography component="span" sx={{ fontSize: "1rem", lineHeight: 1 }}>
                      🌐
                    </Typography>
                    <Typography component="span" sx={{ fontSize: "0.9rem" }}>
                      Auto
                    </Typography>
                  </Box>
                  <Typography component="span" sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                    Store
                  </Typography>
                </Box>
              </MenuItem>
              {SUPPORTED_CURRENCIES.map((currency) => {
                const meta = CURRENCY_META[currency];
                return (
                  <MenuItem key={currency} value={currency}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Typography component="span" sx={{ fontSize: "1rem", lineHeight: 1 }}>
                          {countryCodeToFlag(meta.countryCode)}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: "0.9rem", fontWeight: 700 }}>
                          {currency}
                        </Typography>
                      </Box>
                      <Typography component="span" sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                        {meta.symbol}
                      </Typography>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
            Theme
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Pick the visual style that best matches your collecting workspace.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {(Object.keys(THEME_META) as ThemeId[]).map((id) => {
              const meta = THEME_META[id];
              const active = themeId === id;

              return (
                <Tooltip key={id} title={`${meta.label}: ${meta.description}`} arrow>
                  <Box
                    onClick={() => setThemeId(id)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      cursor: "pointer",
                      backgroundColor: meta.preview,
                      border: "2px solid",
                      borderColor: active ? "primary.main" : "rgba(255,255,255,0.22)",
                      boxShadow: active ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.24)}` : "none",
                      transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                      "&:hover": {
                        transform: "scale(1.06)",
                        borderColor: active ? "primary.main" : "rgba(255,255,255,0.55)",
                      },
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
