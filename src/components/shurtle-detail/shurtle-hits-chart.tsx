"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

interface ChartData {
  date: string
  hits: number
  formattedDate: string
}

interface ShurtleHitsChartProps {
  data: ChartData[]
}

const chartConfig = {
  hits: {
    label: "Hits",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ShurtleHitsChart({ data }: ShurtleHitsChartProps) {
  return (
    <ChartContainer config={chartConfig}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="formattedDate" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar 
          dataKey="hits" 
          fill="var(--color-hits)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}