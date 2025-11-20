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

export type JobsOverTimeChartProps = {
  data?: Array<{
    date: string;
    count: number;
  }> | any[];
};

// basit default data
const DEFAULT_TIME_DATA = [
  { date: "12/07/2024", count: 1 },
  { date: "12/07/2025", count: 2 },
  { date: "13/07/2025", count: 1 },
];

const JobsOverTimeChart: React.FC<JobsOverTimeChartProps> = ({
  data = DEFAULT_TIME_DATA,
}) => {
  // Eğer visibleJobs (job listesi) geldiyse,
  // aynı tarihi paylaşan işlerin adetini gruplayalım ki grafik dolu olsun.
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
            stroke="#7d6a12"
            tick={{
              fill: "#7d6a12",
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <YAxis
            stroke="#7d6a12"
            allowDecimals={false}
            tick={{
              fill: "#7d6a12",
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fffde4",
              border: "1px solid #b99a2a",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(185,154,42,0.15)",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "#4b3c00",
            }}
          />
          <Legend
            wrapperStyle={{
              color: "#4b3c00",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Jobs"
            stroke="#B99A2A"
            strokeWidth={3}
            dot={{ r: 4, stroke: "#B99A2A", strokeWidth: 1, fill: "#fffde4" }}
            activeDot={{
              r: 5,
              stroke: "#FFB300",
              strokeWidth: 2,
              fill: "#fff",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default JobsOverTimeChart;
