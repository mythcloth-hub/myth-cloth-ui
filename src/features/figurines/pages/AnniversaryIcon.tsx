
import { SvgIcon } from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";

type AnniversaryIconProps = SvgIconProps & {
  year?: number;
};

export default function AnniversaryIcon({ year, ...props }: AnniversaryIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fontSize="small">
      {/* Gold star background */}
      <polygon
        points="12,2 14.85,8.19 21.51,8.63 16.18,13.14 17.91,19.69 12,16.2 6.09,19.69 7.82,13.14 2.49,8.63 9.15,8.19"
        fill="#ffe082"
        stroke="#bfa100"
        strokeWidth="1.1"
      />
      {/* Number in the center */}
      <text
        x="12"
        y="15.2"
        textAnchor="middle"
        fontSize="7"
        fill="#bfa100"
        fontFamily="inherit"
        fontWeight="bold"
        dominantBaseline="middle"
      >
        {year ?? '★'}
      </text>
    </SvgIcon>
  );
}
