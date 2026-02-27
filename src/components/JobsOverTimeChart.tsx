import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "../context/ThemeContext";

export type JobsOverTimeChartProps = {
  data?: Array<{
    date: string;
    count: number;
  }> | any[];
};


const DEFAULT_TIME_DATA = [
  { date: "12/07/2024", count: 1 },
  { date: "12/07/2025", count: 2 },
  { date: "13/07/2025", count: 1 },
];

const JobsOverTimeChart: React.FC<JobsOverTimeChartProps> = ({
  data = DEFAULT_TIME_DATA,
}) => {
  const { isDark } = useTheme();
  const axisColor = isDark ? "#b7aed7" : "#7d6a12";
  const tooltipBg = isDark ? "#1e1b31" : "#fffde4";
  const tooltipBorder = isDark ? "1px solid rgba(139, 92, 246, 0.35)" : "1px solid #b99a2a";
  const tooltipColor = isDark ? "#f2edff" : "#4b3c00";
  const lineColor = isDark ? "#a78bfa" : "#B99A2A";
  const dotFill = isDark ? "#1b1630" : "#fffde4";
  const activeColor = isDark ? "#c4b5fd" : "#FFB300";

  let chartData = data;

  if (
    Array.isArray(data) &&
    data.length > 0 &&
    data[0] &&
    (data[0] as any).date && (data[0] as any).title
  ) {
    const counts: Record<string, number> = {};
    (data as any[]).forEach(job => {
      counts[job.date] = (counts[job.date] || 0) + 1;
    });
    chartData = Object.keys(counts).map(date => ({
      date,
      count: counts[date],
    }));
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData as any[]}
          margin={{
            top: 16,
            right: 16,
            bottom: 16,
            left: 16,
          }}
        >
          <XAxis
            dataKey="date"
            stroke={axisColor}
            tick={{
              fill: axisColor,
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <YAxis
            stroke={axisColor}
            allowDecimals={false}
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
          />
          <Legend
            wrapperStyle={{
              color: tooltipColor,
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Jobs"
            stroke={lineColor}
            strokeWidth={3}
            dot={{ r: 4, stroke: lineColor, strokeWidth: 1, fill: dotFill }}
            activeDot={{
              r: 5,
              stroke: activeColor,
              strokeWidth: 2,
              fill: isDark ? "#241d3b" : "#fff",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default JobsOverTimeChart;
