import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CrimeStats } from "@shared/schema";

interface CrimeTrendChartProps {
  crimeStats: CrimeStats[];
  height?: number;
  showLegend?: boolean;
}

export function CrimeTrendChart({ crimeStats, height = 300, showLegend = true }: CrimeTrendChartProps) {
  if (!crimeStats.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  // Combine monthly data from all crime stats
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const chartData = months.map(month => {
    const dataPoint: any = { month };
    crimeStats.forEach(stat => {
      const monthData = stat.monthlyData.find(data => data.month === month);
      dataPoint[stat.category.name] = monthData ? monthData.count : 0;
    });
    return dataPoint;
  });

  const colors = [
    'hsl(280, 100%, 70%)', // Purple
    'hsl(170, 70%, 50%)',  // Teal
    'hsl(0, 72%, 51%)',    // Red
    'hsl(45, 93%, 58%)',   // Yellow
    'hsl(260, 100%, 60%)', // Dark Purple
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 26%)" />
        <XAxis 
          dataKey="month" 
          tick={{ fill: 'hsl(240, 5%, 65%)', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(240, 6%, 26%)' }}
        />
        <YAxis 
          tick={{ fill: 'hsl(240, 5%, 65%)', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(240, 6%, 26%)' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(240, 10%, 18%)',
            border: '1px solid hsl(240, 6%, 26%)',
            borderRadius: '8px',
            color: 'hsl(240, 5%, 96%)',
          }}
        />
        {showLegend && (
          <Legend 
            wrapperStyle={{
              color: 'hsl(240, 5%, 96%)',
              fontSize: '12px',
            }}
          />
        )}
        {crimeStats.map((stat, index) => (
          <Line
            key={stat.category.id}
            type="monotone"
            dataKey={stat.category.name}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ fill: colors[index % colors.length], strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, stroke: colors[index % colors.length], strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
