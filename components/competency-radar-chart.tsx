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
  const scoreValues = competencyRanking
    .map((comp) => Number(spiderData[comp.code] ?? 0))
    .filter((value) => Number.isFinite(value))

  const observedMax = scoreValues.length > 0 ? Math.max(...scoreValues) : 0
  const isThreePointScale = observedMax <= 3.2
  const domainMin = isThreePointScale ? 1 : 0
  const domainMax = isThreePointScale ? 3 : 5
  const ticks = isThreePointScale ? [1, 1.5, 2, 2.5, 3] : [1, 2, 3, 4, 5]

  // Convert dict to array for recharts
  const data = competencyRanking.map((comp) => ({
    subject: comp.name,
    score: Number(spiderData[comp.code] ?? domainMin),
    fullMark: domainMax,
  }))

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[domainMin, domainMax]} ticks={ticks as any[]} />
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
