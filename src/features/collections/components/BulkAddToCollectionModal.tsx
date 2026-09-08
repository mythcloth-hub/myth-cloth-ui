import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, DialogActions, TextField, FormControlLabel } from "@mui/material";

import axios from "axios";
import {
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

interface BulkAddToCollectionModalProps {
  open: boolean;
  onClose: () => void;
  figurineIds: number[];
  selectedCount: number;
  onSuccess?: () => void;
}

export default function BulkAddToCollectionModal({
  open,
  figurineIds,
  
}: BulkAddToCollectionModalProps) {
  const { t } = useTranslation("figurines");
  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          background: "linear-gradient(135deg, rgba(6,8,24,0.95) 0%, rgba(20,15,40,0.95) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(212,175,55,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#d4af37",
          textAlign: "center",
          pb: 1,
          borderBottom: "1px solid rgba(212,175,55,0.1)",
        }}
        >
        💫 {t("collection.bulkAddToCollectionModal.title", { count: 2 })}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Divider sx={{ "&::before, &::after": { borderColor: "rgba(255,255,255,0.08)" } }}>
          <Typography variant="body2" color="text.secondary">
            {t("collection.bulkAddToCollectionModal.or")}
          </Typography>
        </Divider>
        {/* Create new collection section */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: "#d4af37", fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <AddIcon sx={{ fontSize: "1.1rem" }} />
            {t("collection.bulkAddToCollectionModal.new.title")}
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                
              />
            }
            label={<Typography variant="body2">Create collection only from selected figurines</Typography>}
          />

          <TextField
                fullWidth
                label={t("collection.bulkAddToCollectionModal.new.name.label")}
                size="small"
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": {
                    color: "text.primary",
                    "& fieldset": {
                      borderColor: "rgba(212,175,55,0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(212,175,55,0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#d4af37",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "rgba(255,255,255,0.3)",
                    opacity: 1,
                  },
                }}
                />
        </Box>

      </DialogContent>

      <DialogActions
        sx={{
          borderTop: "1px solid rgba(212,175,55,0.1)",
          p: 2,
          gap: 1,
        }}
      >
        <Button
          startIcon={<CancelOutlinedIcon />}
          
          sx={{
            color: "text.secondary",
            "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
          }}
        >
          {t("collection.bulkAddToCollectionModal.actions.cancel")}
        </Button>

        {figurineIds.length > 0 && (
          <Button
            
            sx={{
              background: "linear-gradient(135deg, #d4af37 0%, #e6c547 100%)",
              color: "#000",
              fontWeight: 600,
              "&:hover": {
                background: "linear-gradient(135deg, #e6c547 0%, #d4af37 100%)",
              },
              "&:disabled": {
                opacity: 0.7,
              },
            }}
          >
            {t("collection.bulkAddToCollectionModal.actions.create", { count: 2 })}
          </Button>
        )}
        
      </DialogActions>
    </Dialog>
  );
}
