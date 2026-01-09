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
            stroke="#7d6a12"
            tick={{
              fill: "#7d6a12",
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <YAxis
            stroke="#7d6a12"
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
            cursor={{ fill: "rgba(255, 236, 140, 0.2)" }}
          />
          <Legend
            wrapperStyle={{
              color: "#4b3c00",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          />
          <Bar dataKey="jobs" name="Jobs" fill="#B99A2A" />
          <Bar dataKey="value" name="Amount ($)" fill="#FFC857" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatusBoardChart;
