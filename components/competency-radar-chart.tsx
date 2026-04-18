'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

interface CompetencyRadarChartProps {
  spiderData: Record<string, number> // {"C1": 3.5, "C2": 4.1}
  competencyRanking: { code: string; name: string }[]
}

export function CompetencyRadarChart({ spiderData, competencyRanking }: CompetencyRadarChartProps) {
  // Convert dict to array for recharts
  const data = competencyRanking.map((comp) => ({
    subject: comp.name,
    score: spiderData[comp.code] || 0,
    fullMark: 5,
  }))

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} />
          <Radar name="Competency Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderRadius: '8px' }}
            itemStyle={{ color: 'hsl(var(--primary))' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
