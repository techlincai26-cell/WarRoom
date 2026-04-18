'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import api from '@/src/lib/api'
import { CompetencyRadarChart } from '@/components/competency-radar-chart'
import type { EvaluationReport, RankedCompetency, InvestorScorecard, CompetencyCode, UserResponseEntry, StageName } from '@/src/types'

const COMP_COLORS: Record<string, string> = {
  C1: '#6366f1', C2: '#8b5cf6', C3: '#f59e0b', C4: '#10b981',
  C5: '#3b82f6', C6: '#ec4899', C7: '#06b6d4', C8: '#f97316',
}

function stageLabel(s: string) {
  return s.replace('STAGE_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function FinalReportPage() {
  const params = useParams()
  const assessmentId = params?.assessmentId as string
  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePage, setActivePage] = useState<1 | 2 | 3 | 4 | 5>(1)

  useEffect(() => {
    api.assessments
      .getReport(assessmentId)
      .then((r) => setReport(r))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [assessmentId])

  if (loading) {
    return (
      <div className="report-loading">
        <div className="loader-text">Loading your saved evaluation report...</div>
        <style jsx>{`.report-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a1a; color: #c4b5fd; font-size: 1.2rem; }`}</style>
      </div>
    )
  }
  if (error || !report) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a', color: '#fca5a5' }}>
        <div style={{ textAlign: 'center' }}>
          <p>{error || 'Report not found'}</p>
          <Link href="/" style={{ color: '#a5b4fc' }}>← Return Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="report-page">
      <header className="report-header">
        <Link href="/" className="back-link">← Dashboard</Link>
        <h1>Evaluation Report</h1>
        <p className="subtitle">{report.entrepreneurType} • {report.organizationalRole}</p>
      </header>

      {/* Page Tabs */}
      <nav className="page-tabs">
        <button className={`tab ${activePage === 1 ? 'active' : ''}`} onClick={() => setActivePage(1)}>
          🦈 Deal Summary
        </button>
        <button className={`tab ${activePage === 2 ? 'active' : ''}`} onClick={() => setActivePage(2)}>
          📊 Competency Profile
        </button>
        <button className={`tab ${activePage === 3 ? 'active' : ''}`} onClick={() => setActivePage(3)}>
          🧠 AI Analysis
        </button>
        <button className={`tab ${activePage === 4 ? 'active' : ''}`} onClick={() => setActivePage(4)}>
          📝 Your Responses
        </button>
        <button className={`tab ${activePage === 5 ? 'active' : ''}`} onClick={() => setActivePage(5)}>
          🔍 Deep Dive
        </button>
      </nav>

      <main className="report-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activePage === 1 && <DealPage report={report} />}
            {activePage === 2 && <CompetencyPage report={report} />}
            {activePage === 3 && <AIAnalysisPage report={report} />}
            {activePage === 4 && <UserResponsesPage report={report} />}
            {activePage === 5 && <DeepDivePage report={report} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <style jsx>{`
        .report-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%);
          color: #e0e0e0;
          padding: 2rem;
        }
        .report-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .back-link {
          color: #8b8bcc;
          text-decoration: none;
          font-size: 0.85rem;
          display: inline-block;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff, #c4b5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: #a5b4fc;
          font-size: 1rem;
          font-weight: 500;
        }

        .page-tabs {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        .tab {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #9ca3af;
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .tab:hover { background: rgba(255,255,255,0.08); }
        .tab.active {
          background: rgba(139,92,246,0.15);
          border-color: #8b5cf6;
          color: #c4b5fd;
        }

        .report-content {
          max-width: 900px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  )
}

// ============================================
// PAGE 1: DEAL SUMMARY
// ============================================

function DealPage({ report }: { report: EvaluationReport }) {
  const deal = report.dealSummary

  return (
    <div className="deal-page">
      <div className="deal-stats">
        {[
          { value: deal?.totalInvestors || 0, label: 'Investors Faced', highlight: false },
          { value: deal?.dealsOffered || 0, label: 'Deals Offered', highlight: true },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`stat-card ${stat.highlight ? 'highlight' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
          >
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {deal?.investorResults && deal.investorResults.length > 0 && (
        <div className="investor-results">
          <h3>Investor Scorecards</h3>
          {deal.investorResults.map((sc: any, i: number) => (
            <motion.div
              key={i}
              className="scorecard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="sc-header">
                <strong>{sc.investorName || sc.investor_name}</strong>
                <span className={`deal-badge ${(sc.dealDecision || sc.deal_decision) === 'WALK_OUT' ? 'walkout' : 'deal'}`}>
                  {sc.dealDecision || sc.deal_decision}
                </span>
              </div>
              <div className="sc-scores">
                <span>Primary: {sc.primaryScore || sc.primary_score}/5</span>
                <span>Bias Trait: {sc.biasTraitScore || sc.bias_trait_score}/5</span>
                {sc.redFlag && <span className="red-flag">🚩 Red Flag</span>}
              </div>
              {sc.investorReaction && (
                <blockquote>&ldquo;{sc.investorReaction || sc.investor_reaction}&rdquo;</blockquote>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <style jsx>{`
        .deal-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .deal-stats {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 2rem 3rem;
          text-align: center;
        }
        .stat-card.highlight {
          border-color: rgba(16,185,129,0.3);
          background: rgba(16,185,129,0.05);
        }
        .stat-value { font-size: 2.5rem; font-weight: 800; color: white; }
        .stat-label { font-size: 0.85rem; color: #9ca3af; margin-top: 0.3rem; }

        .investor-results h3 { color: white; margin-bottom: 1rem; }
        .scorecard {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.2rem;
          margin-bottom: 0.8rem;
        }
        .sc-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .sc-header strong { color: white; }
        .deal-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }
        .deal-badge.deal { background: rgba(16,185,129,0.15); color: #34d399; }
        .deal-badge.walkout { background: rgba(239,68,68,0.15); color: #fca5a5; }
        .sc-scores {
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }
        .red-flag { color: #ef4444; font-weight: 600; }
        blockquote {
          background: rgba(255,255,255,0.02);
          border-left: 2px solid rgba(255,255,255,0.1);
          padding: 0.6rem 1rem;
          border-radius: 0 6px 6px 0;
          font-style: italic;
          color: #9ca3af;
          font-size: 0.9rem;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

// ============================================
// PAGE 2: COMPETENCY PROFILE
// ============================================

function CompetencyPage({ report }: { report: EvaluationReport }) {
  const ranking = report.competencyRanking || []
  const spiderData = report.spiderChartData || {}

  // Simple bar chart representation since we can't use recharts in server component
  const maxVal = 3

  return (
    <div className="comp-page">
      {/* Archetype */}
      <div className="archetype-section">
        <div className="archetype-badge">{report.entrepreneurType}</div>
        <p className="archetype-role">Organizational Role: <strong>{report.organizationalRole}</strong></p>
        {report.archetypeNarrative && (
          <p className="archetype-narrative">{report.archetypeNarrative}</p>
        )}
      </div>

      {/* Radar Chart */}
      <div className="radar-chart bg-neutral-950 p-6 rounded-2xl mb-8 border border-neutral-800">
         <h3 className="text-xl font-bold mb-4">Competency Radar</h3>
         <CompetencyRadarChart spiderData={spiderData} competencyRanking={ranking} />
      </div>

      {/* Spider Chart (bar representation) */}
      <div className="spider-chart">
        <h3>Competency Profile</h3>
        {ranking.map((comp: RankedCompetency) => (
          <div key={comp.code} className="bar-row">
            <div className="bar-label">
              <span className="comp-code" style={{ color: COMP_COLORS[comp.code] || '#8b5cf6' }}>
                {comp.code}
              </span>
              <span className="comp-name">{comp.name}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(comp.weightedAverage / maxVal) * 100}%`,
                  background: COMP_COLORS[comp.code] || '#8b5cf6',
                }}
              />
            </div>
            <div className="bar-value">{comp.weightedAverage.toFixed(2)}</div>
            <span className={`cat-badge cat-${comp.category.toLowerCase().replace(/_/g, '-')}`}>
              {comp.category.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Role Fit */}
      {report.roleFitMap && (
        <div className="role-fit">
          <h3>Role Fit Analysis</h3>
          <div className="role-card">
            <div className="role-name">{report.roleFitMap.role}</div>
            <p>{report.roleFitMap.bestEnvironment}</p>
            <div className="dominant-comps">
              {report.roleFitMap.dominantCompetencies?.map((c: CompetencyCode) => (
                <span key={c} className="dom-comp" style={{ borderColor: COMP_COLORS[c] }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Plan */}
      {report.actionPlan && report.actionPlan.length > 0 && (
        <div className="action-plan">
          <h3>Action Plan</h3>
          {report.actionPlan.map((item, i) => (
            <div key={i} className="action-item">
              <div className="action-comp">{item.competency}</div>
              <p>{item.action}</p>
              <span className="target">{item.targetDate}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .comp-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .archetype-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .archetype-badge {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 0.6rem 2rem;
          border-radius: 12px;
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.8rem;
        }
        .archetype-role {
          color: #9ca3af;
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        .archetype-role strong { color: #c4b5fd; }
        .archetype-narrative {
          color: #d1d5db;
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto;
          font-size: 0.95rem;
        }

        .spider-chart {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .spider-chart h3, .role-fit h3, .action-plan h3 {
          color: white;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.7rem;
        }
        .bar-label {
          width: 200px;
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .comp-code { font-weight: 700; font-size: 0.85rem; width: 28px; }
        .comp-name { font-size: 0.8rem; color: #d1d5db; }
        .bar-track {
          flex: 1;
          height: 8px;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
        }
        .bar-value {
          width: 40px;
          text-align: right;
          font-weight: 600;
          font-size: 0.85rem;
          color: white;
        }
        .cat-badge {
          font-size: 0.65rem;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-weight: 600;
          white-space: nowrap;
          width: 130px;
          text-align: center;
        }
        .cat-natural-dominant { background: rgba(16,185,129,0.12); color: #34d399; }
        .cat-strong { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .cat-functional { background: rgba(245,158,11,0.12); color: #fbbf24; }
        .cat-development-required { background: rgba(239,68,68,0.12); color: #fca5a5; }
        .cat-high-risk { background: rgba(239,68,68,0.2); color: #ef4444; }

        .role-fit { margin-bottom: 2rem; }
        .role-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .role-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #c4b5fd;
          margin-bottom: 0.5rem;
        }
        .role-card p { color: #9ca3af; font-size: 0.9rem; margin-bottom: 0.8rem; }
        .dominant-comps { display: flex; gap: 0.4rem; }
        .dom-comp {
          border: 1px solid;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #a5b4fc;
        }

        .action-plan { margin-bottom: 2rem; }
        .action-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 1rem 1.2rem;
          margin-bottom: 0.6rem;
        }
        .action-comp {
          font-weight: 600;
          color: #f59e0b;
          font-size: 0.85rem;
          margin-bottom: 0.3rem;
        }
        .action-item p { color: #d1d5db; font-size: 0.9rem; margin: 0 0 0.3rem 0; }
        .target { font-size: 0.75rem; color: #6b7280; }

        @media (max-width: 768px) {
          .bar-label { width: 120px; }
          .cat-badge { display: none; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// PAGE 3: AI DETAILED ANALYSIS
// ============================================

function AIAnalysisPage({ report }: { report: EvaluationReport }) {
  const analysis = report.detailedAnalysis || ''

  // Parse markdown-like headings and bullet points for rendering
  const renderAnalysis = (text: string) => {
    if (!text) return <p className="no-data">No detailed analysis available.</p>

    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let key = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        elements.push(<br key={key++} />)
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={key++} className="analysis-heading">{trimmed.replace('## ', '')}</h3>
        )
      } else if (trimmed.startsWith('- ')) {
        elements.push(
          <div key={key++} className="analysis-bullet">
            <span className="bullet">•</span>
            <span>{trimmed.replace('- ', '')}</span>
          </div>
        )
      } else {
        elements.push(<p key={key++} className="analysis-text">{trimmed}</p>)
      }
    }
    return <>{elements}</>
  }

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <h2>🧠 Detailed AI Evaluation</h2>
        <p className="analysis-subtitle">
          Comprehensive analysis of your simulation journey — strengths, weaknesses, and actionable insights
        </p>
      </div>

      <div className="analysis-content">
        {renderAnalysis(analysis)}
      </div>

      <style jsx>{`
        .analysis-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .analysis-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .analysis-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
        }
        .analysis-subtitle {
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .analysis-content {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 2rem;
        }
        .analysis-heading {
          font-size: 1.15rem;
          font-weight: 700;
          color: #c4b5fd;
          margin: 1.5rem 0 0.6rem 0;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid rgba(196, 181, 253, 0.15);
        }
        .analysis-heading:first-child {
          margin-top: 0;
        }
        .analysis-bullet {
          display: flex;
          gap: 0.6rem;
          padding: 0.3rem 0;
          font-size: 0.95rem;
          color: #d1d5db;
          line-height: 1.6;
        }
        .bullet {
          color: #8b5cf6;
          font-weight: 700;
          flex-shrink: 0;
        }
        .analysis-text {
          font-size: 0.95rem;
          color: #d1d5db;
          line-height: 1.6;
          margin: 0.3rem 0;
        }
        .no-data {
          color: #6b7280;
          text-align: center;
          padding: 3rem;
        }
      `}</style>
    </div>
  )
}

// ============================================
// PAGE 4: USER RESPONSES
// ============================================

function UserResponsesPage({ report }: { report: EvaluationReport }) {
  const responses = report.userResponses || []

  // Group responses by stage
  const grouped: Record<string, UserResponseEntry[]> = {}
  for (const r of responses) {
    const stage = r.stageName || 'Unknown'
    if (!grouped[stage]) grouped[stage] = []
    grouped[stage].push(r)
  }

  const stageOrder = [
    'STAGE_NEG2_IDEATION', 'STAGE_NEG1_VISION', 'STAGE_0_COMMITMENT',
    'STAGE_1_VALIDATION', 'STAGE_2A_GROWTH', 'STAGE_2B_EXPANSION',
    'STAGE_3_SCALE', 'STAGE_WARROOM_PREP',
  ]

  const sortedStages = Object.keys(grouped);

  const getResponseText = (entry: any): string => {
      if (entry.selectedOptionText) return entry.selectedOptionText;
    if (!entry.response) return '(no response)'
    if (entry.response.text) return entry.response.text
    if (entry.response.selectedOptionId) return `Selected: ${entry.response.selectedOptionId}`
    if (entry.response.allocations) {
      return Object.entries(entry.response.allocations)
        .map(([k, v]) => `${k}: ${v}%`)
        .join(', ')
    }
    return JSON.stringify(entry.response)
  }

  const getProficiencyBadge = (p: number | null) => {
    if (p === null || p === undefined) return null
    const colors: Record<number, { bg: string; text: string; label: string }> = {
      1: { bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', label: 'P1 — Developing' },
      2: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', label: 'P2 — Strong' },
      3: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', label: 'P3 — Advanced' },
    }
    const c = colors[p] || colors[1]
    return (
      <span style={{ background: c.bg, color: c.text, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
        {c.label}
      </span>
    )
  }

  return (
    <div className="responses-page">
      <div className="responses-header">
        <h2>📝 Your Responses</h2>
        <p className="responses-subtitle">
          All your answers throughout the simulation, grouped by stage
        </p>
      </div>

      {sortedStages.length === 0 && (
        <div className="no-data">No responses recorded.</div>
      )}

      {sortedStages.map((stageName) => (
        <div key={stageName} className="stage-group">
          <div className="stage-header">
            <span className="stage-badge">{stageLabel(stageName)}</span>
            <span className="response-count">{grouped[stageName].length} responses</span>
          </div>

          {grouped[stageName].map((entry, i) => (
            <div key={i} className="response-card">
              <div className="response-question">
                <span className="q-type">{entry.questionType.replace(/_/g, ' ')}</span>
                <p>{entry.questionText}</p>
              </div>
              <div className="response-answer">
                <span className="answer-label">Your Answer:</span>
                <p>{getResponseText(entry)}</p>
              </div>
              <div className="response-footer">
                {getProficiencyBadge(entry.proficiency)}
                {entry.aiFeedback && entry.aiFeedback.feedback && (
                  <span className="ai-feedback-text">
                    💡 {typeof entry.aiFeedback.feedback === 'string' ? entry.aiFeedback.feedback : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <style jsx>{`
        .responses-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .responses-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .responses-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
        }
        .responses-subtitle {
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .stage-group {
          margin-bottom: 2rem;
        }
        .stage-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.8rem;
        }
        .stage-badge {
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
          padding: 0.25rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .response-count {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .response-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1rem 1.2rem;
          margin-bottom: 0.6rem;
        }
        .response-question {
          margin-bottom: 0.6rem;
        }
        .q-type {
          font-size: 0.7rem;
          font-weight: 600;
          color: #8b5cf6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .response-question p {
          font-size: 0.9rem;
          color: #e0e0e0;
          font-weight: 600;
          margin: 0.2rem 0 0 0;
        }
        .response-answer {
          background: rgba(255,255,255,0.02);
          border-left: 2px solid rgba(99,102,241,0.3);
          padding: 0.5rem 0.8rem;
          border-radius: 0 6px 6px 0;
          margin-bottom: 0.5rem;
        }
        .answer-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6b7280;
          display: block;
          margin-bottom: 0.2rem;
        }
        .response-answer p {
          font-size: 0.85rem;
          color: #d1d5db;
          line-height: 1.5;
          margin: 0;
          white-space: pre-wrap;
        }
        .response-footer {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          flex-wrap: wrap;
        }
        .ai-feedback-text {
          font-size: 0.8rem;
          color: #9ca3af;
          font-style: italic;
        }
        .no-data {
          text-align: center;
          color: #6b7280;
          padding: 3rem;
        }
      `}</style>
    </div>
  )
}

// ============================================
// PAGE 5: DEEP DIVE
// ============================================

function DeepDivePage({ report }: { report: EvaluationReport }) {
  const narrations = report.stageNarrations || []

  return (
    <div className="deep-dive">
      <h3>Stage-by-Stage Journey</h3>
      {narrations.map((n, i) => (
        <div key={i} className="stage-narration">
          <div className="sn-header">
            <span className="sn-badge">Stage {n.stageNumber}</span>
            <span className="sn-name">{n.stage}</span>
            <span className="sn-count">{n.questionsAnswered} questions</span>
          </div>
          {n.decisions && n.decisions.length > 0 && (
            <div className="sn-decisions">
              <strong>Key Decisions:</strong>
              <ul>{n.decisions.map((d, j) => <li key={j}>{d}</li>)}</ul>
            </div>
          )}
          {n.scoringRationale && (
            <p className="scoring-rationale">{n.scoringRationale}</p>
          )}
        </div>
      ))}

      <style jsx>{`
        .deep-dive { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        h3 { color: white; margin-bottom: 1.5rem; }
        .stage-narration {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.2rem;
          margin-bottom: 0.8rem;
        }
        .sn-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.6rem;
        }
        .sn-badge {
          background: rgba(99,102,241,0.15);
          color: #a5b4fc;
          padding: 0.15rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .sn-name { color: white; font-weight: 600; font-size: 0.95rem; }
        .sn-count { color: #6b7280; font-size: 0.8rem; }
        .sn-decisions {
          font-size: 0.9rem;
          color: #d1d5db;
        }
        .sn-decisions strong { color: #a5b4fc; font-size: 0.85rem; }
        .sn-decisions ul {
          margin: 0.3rem 0 0 1.2rem;
          padding: 0;
        }
        .sn-decisions li { margin-bottom: 0.2rem; }
        .scoring-rationale {
          font-size: 0.85rem;
          color: #9ca3af;
          font-style: italic;
          margin: 0.5rem 0 0 0;
        }
      `}</style>
    </div>
  )
}
