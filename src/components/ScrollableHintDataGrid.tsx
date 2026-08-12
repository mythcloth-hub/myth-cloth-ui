import { useEffect, useRef, useState } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import { DataGrid, type DataGridProps, type GridValidRowModel } from "@mui/x-data-grid";

type ScrollableHintDataGridProps<R extends GridValidRowModel> = DataGridProps<R> & {
  containerStyle?: React.CSSProperties;
  containerSx?: SxProps<Theme>;
};

export default function ScrollableHintDataGrid<R extends GridValidRowModel>(props: ScrollableHintDataGridProps<R>) {
  const { containerStyle, containerSx, sx, rows, loading, ...dataGridProps } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollUpHint, setShowScrollUpHint] = useState(false);
  const [showScrollDownHint, setShowScrollDownHint] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);

  const rootContainerSx: SxProps<Theme> = containerSx
    ? [{ position: "relative" }, ...(Array.isArray(containerSx) ? containerSx : [containerSx])]
    : { position: "relative" };

  const baseGridSx: SxProps<Theme> = {
    "& .MuiDataGrid-virtualScroller": {
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      "&::-webkit-scrollbar": {
        display: "none",
      },
    },
    "& .MuiDataGrid-scrollbar, & .MuiDataGrid-scrollbar--vertical, & .MuiDataGrid-scrollbar--horizontal": {
      display: "none",
    },
  };

  const mergedGridSx: SxProps<Theme> = sx
    ? [baseGridSx, ...(Array.isArray(sx) ? sx : [sx])]
    : baseGridSx;

  const updateScrollHints = () => {
    const gridRoot = containerRef.current;
    const scroller = gridRoot?.querySelector<HTMLDivElement>(".MuiDataGrid-virtualScroller");
    const header = gridRoot?.querySelector<HTMLDivElement>(".MuiDataGrid-columnHeaders");

    if (header) {
      setHeaderHeight(header.offsetHeight || 56);
    }

    if (!scroller) {
      setShowScrollUpHint(false);
      setShowScrollDownHint(false);
      return;
    }

    const hasOverflow = scroller.scrollHeight > scroller.clientHeight + 2;
    const canScrollUp = scroller.scrollTop > 6;
    const canScrollDown = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 6;

    setShowScrollUpHint(hasOverflow && canScrollUp);
    setShowScrollDownHint(hasOverflow && canScrollDown);
  };

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      updateScrollHints();
    });

    const gridRoot = containerRef.current;
    const scroller = gridRoot?.querySelector<HTMLDivElement>(".MuiDataGrid-virtualScroller");
    if (!scroller) {
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const handleScroll = () => updateScrollHints();
    const handleResize = () => updateScrollHints();

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [loading, rows]);

  return (
    <Box ref={containerRef} style={containerStyle} sx={rootContainerSx}>
      <DataGrid
        rows={rows}
        loading={loading}
        {...dataGridProps}
        sx={mergedGridSx}
      />

      {showScrollUpHint && (
        <Box
          sx={{
            position: "absolute",
            top: headerHeight,
            left: 0,
            right: 0,
            height: 36,
            pointerEvents: "none",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            pt: 0.2,
            background: (theme) => `linear-gradient(180deg, ${theme.palette.background.paper} 0%, rgba(0,0,0,0) 100%)`,
            zIndex: 2,
          }}
        >
          <KeyboardArrowUpOutlinedIcon
            sx={{
              color: "text.secondary",
              fontSize: 20,
              animation: "gridScrollHintUp 1.4s ease-in-out infinite",
              "@keyframes gridScrollHintUp": {
                "0%, 100%": { transform: "translateY(0)", opacity: 0.65 },
                "50%": { transform: "translateY(-3px)", opacity: 1 },
              },
            }}
          />
        </Box>
      )}

      {showScrollDownHint && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 40,
            pointerEvents: "none",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            pb: 0.2,
            background: (theme) => `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${theme.palette.background.paper} 100%)`,
            zIndex: 2,
          }}
        >
          <KeyboardArrowDownOutlinedIcon
            sx={{
              color: "text.secondary",
              fontSize: 20,
              animation: "gridScrollHintDown 1.4s ease-in-out infinite",
              "@keyframes gridScrollHintDown": {
                "0%, 100%": { transform: "translateY(0)", opacity: 0.65 },
                "50%": { transform: "translateY(3px)", opacity: 1 },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}