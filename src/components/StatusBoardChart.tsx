import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "../context/ThemeContext";

// fallback veri: (Status, kaç job, $ amount gibi placeholder)
const DEFAULT_DATA = [
  { name: "Pending", jobs: 3, value: 2000 },
  { name: "Active", jobs: 1, value: 800 },
  { name: "Complete", jobs: 2, value: 1200 },
];

export type StatusBoardChartProps = {
  data?: Array<{
    name: string;
    jobs: number;
    value: number;
  }>;
};

const StatusBoardChart: React.FC<StatusBoardChartProps> = ({
  data = DEFAULT_DATA,
}) => {
  const { isDark } = useTheme();

  const axisColor = isDark ? "#b7aed7" : "#7d6a12";
  const tooltipBg = isDark ? "#1e1b31" : "#fffde4";
  const tooltipBorder = isDark ? "1px solid rgba(139, 92, 246, 0.35)" : "1px solid #b99a2a";
  const tooltipColor = isDark ? "#f2edff" : "#4b3c00";
  const cursorFill = isDark ? "rgba(139, 92, 246, 0.18)" : "rgba(255, 236, 140, 0.2)";
  const jobsBar = isDark ? "#7c5cc5" : "#B99A2A";
  const amountBar = isDark ? "#a78bfa" : "#FFC857";

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 16,
            right: 16,
            bottom: 16,
            left: 16,
          }}
        >
          <XAxis
            dataKey="name"
            stroke={axisColor}
            tick={{
              fill: axisColor,
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <YAxis
            stroke={axisColor}
            tick={{
              fill: axisColor,
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: tooltipBorder,
              borderRadius: "8px",
              boxShadow: isDark
                ? "0 8px 18px rgba(0, 0, 0, 0.35)"
                : "0 4px 12px rgba(185,154,42,0.15)",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: tooltipColor,
            }}
            cursor={{ fill: cursorFill }}
          />
          <Legend
            wrapperStyle={{
              color: tooltipColor,
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          />
          <Bar dataKey="jobs" name="Jobs" fill={jobsBar} />
          <Bar dataKey="value" name="Amount ($)" fill={amountBar} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusBoardChart;
