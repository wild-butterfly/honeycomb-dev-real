import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

// Varsayılan dilim verisi
const DEFAULT_DATA = [
  { name: "Paid", value: 68 },
  { name: "Unpaid", value: 32 },
];

const COLORS = ["#B99A2A", "#FFB300"];

// Label renderer
const renderLabel = (props: any) => {
  const {
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
  } = props;

  const RAD = Math.PI / 180;
  const radius = outerRadius + 12;
  const x = cx + radius * Math.cos(-midAngle * RAD);
  const y = cy + radius * Math.sin(-midAngle * RAD);

  const textColor = name === "Paid" ? "#5a4a00" : "#d3a000";

  return (
    <text
      x={x}
      y={y}
      fill={textColor}
      fontSize={12}
      fontWeight={500}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${name} ${Math.round((percent || 0) * 100)}%`}
    </text>
  );
};

export type PaymentsPieChartProps = {
  data?: Array<{
    name: string;
    value: number;
  }> | any[]; // şu an visibleJobs geçiyoruz, tip gevşek tutuyoruz
};

const PaymentsPieChart: React.FC<PaymentsPieChartProps> = ({
  data = DEFAULT_DATA,
}) => {
  // Eğer yanlışlıkla job array'i (visibleJobs) geldiyse,
  // bunu Paid/Unpaid'e map etmeye çalışalım ki grafik boş kalmasın.
  // visibleJobs tipinde 'status' varsa buradan türetebiliriz.
  let chartData = data;

  if (
    Array.isArray(data) &&
    data.length > 0 &&
    data[0] &&
    (data[0] as any).status // job objesi gibi görünüyor mu?
  ) {
    const paidCount = data.filter(
      (j: any) => j.status === "Complete"
    ).length;
    const unpaidCount = data.length - paidCount;

    chartData = [
      { name: "Paid", value: paidCount },
      { name: "Unpaid", value: unpaidCount },
    ];
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData as any[]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            labelLine={false}
            label={renderLabel}
          >
            {(chartData as any[]).map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={COLORS[idx % COLORS.length]}
              />
            ))}
          </Pie>

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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentsPieChart;
