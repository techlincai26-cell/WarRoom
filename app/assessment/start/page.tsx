'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/src/lib/api'

const STAGES = [
  { name: 'Ideation', number: -2, duration: '10 min', competencies: ['C1', 'C2'] },
  { name: 'Vision', number: -1, duration: '5 min', competencies: ['C5', 'C8'] },
  { name: 'Commitment', number: 0, duration: '10 min', competencies: ['C3', 'C4'] },
  { name: 'Validation', number: 1, duration: '10 min', competencies: ['C1', 'C2', 'C7'] },
  { name: 'Growth', number: 2, duration: '10 min', competencies: ['C4', 'C5', 'C7'] },
  { name: 'Expansion', number: 2, duration: '10 min', competencies: ['C6', 'C5', 'C3'] },
  { name: 'Scale', number: 3, duration: '10 min', competencies: ['C7', 'C8', 'C2'] },
  { name: 'War Room Prep', number: 3, duration: '5 min', competencies: ['C4', 'C6', 'C5'] },
  { name: 'War Room', number: 4, duration: '15 min', competencies: ['C1-C8'] },
]

export default function AssessmentStartPage() {
  const router = useRouter()
  const [level, setLevel] = useState<1 | 2>(1)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    setIsStarting(true)
    setError('')
    try {
      const assessment = await api.assessments.create({ level })
      router.push(`/assessment/${assessment.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to start assessment')
      setIsStarting(false)
    }
  }

  return (
    <div className="assessment-start-page">
      <div className="start-container">
        <Link href="/" className="back-link">← Back to Dashboard</Link>

        <div className="hero-section">
          <div className="hero-badge">KK&apos;s War Room 2.0</div>
          <h1>Business Simulation Assessment</h1>
          <p className="hero-subtitle">
            Navigate a 12-month startup journey across 7 stages. Make decisions under pressure,
            consult mentors, and pitch to investors. Your 8 core competencies will be evaluated
            to reveal your entrepreneur type and organizational role fit.
          </p>
        </div>

        {/* Level Selection */}
        <div className="level-selection">
          <h2>Select Your Level</h2>
          <div className="level-cards">
            <button
              className={`level-card ${level === 1 ? 'selected' : ''}`}
              onClick={() => setLevel(1)}
            >
              <div className="level-icon">🎓</div>
              <h3>Level 1: Student</h3>
              <p>For students & early-career professionals exploring entrepreneurship</p>
              <ul>
                <li>Guided scenarios</li>
                <li>Foundational questions</li>
                <li>~85 minutes total</li>
              </ul>
            </button>
            <button
              className={`level-card ${level === 2 ? 'selected' : ''}`}
              onClick={() => setLevel(2)}
            >
              <div className="level-icon">💼</div>
              <h3>Level 2: Manager</h3>
              <p>For mid-level managers & experienced professionals</p>
              <ul>
                <li>Complex scenarios</li>
                <li>Advanced pressure</li>
                <li>~85 minutes total</li>
              </ul>
            </button>
          </div>
        </div>

        {/* Journey Overview */}
        <div className="journey-overview">
          <h2>Your 12-Month Journey</h2>
          <div className="journey-timeline">
            {STAGES.map((stage, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="stage-badge">Stage {stage.number}</span>
                    <span className="duration-badge">{stage.duration}</span>
                  </div>
                  <h4>{stage.name}</h4>
                  <div className="competency-tags">
                    {stage.competencies.map((c, j) => (
                      <span key={j} className="comp-tag">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>8 Core Competencies</h3>
            <p>Problem Sensing, Learning Agility, Courage, Financial Discipline, Strategy, Influence, Team Management, Value Creation</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>3 Mentor Lifelines</h3>
            <p>Consult Tony Robbins, Grant Cardone, Richard Branson, and 4 more world-class mentors when you need guidance</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🦈</div>
            <h3>Investor War Room</h3>
            <p>Pitch to 7 investors including Kevin O&apos;Leary, Mark Cuban, and Barbara Corcoran. Negotiate your deal.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>3-Page Evaluation</h3>
            <p>Get your entrepreneur archetype, competency spider chart, role fit map, and personalized action plan</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="start-button"
          onClick={handleStart}
          disabled={isStarting}
        >
          {isStarting ? 'Initializing Simulation...' : 'Begin Simulation →'}
        </button>
      </div>

      <style jsx>{`
        .assessment-start-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%);
          color: #e0e0e0;
          padding: 2rem;
        }
        .start-container {
          max-width: 900px;
          margin: 0 auto;
        }
        .back-link {
          color: #8b8bcc;
          text-decoration: none;
          font-size: 0.9rem;
          display: inline-block;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }
        .back-link:hover { color: #b0b0ff; }

        .hero-section {
          text-align: center;
          margin-bottom: 3rem;
        }
        .hero-badge {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 0.4rem 1.2rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1rem;
          letter-spacing: 0.5px;
        }
        h1 {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff, #c4b5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
        }
        .hero-subtitle {
          color: #9ca3af;
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 700px;
          margin: 0 auto;
        }

        .level-selection, .journey-overview { margin-bottom: 3rem; }
        h2 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #c4b5fd;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .level-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .level-card {
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 2rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s;
          color: #e0e0e0;
        }
        .level-card:hover {
          border-color: rgba(139, 92, 246, 0.3);
          background: rgba(139, 92, 246, 0.05);
        }
        .level-card.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
        }
        .level-icon { font-size: 2rem; margin-bottom: 0.8rem; }
        .level-card h3 { font-size: 1.2rem; margin-bottom: 0.5rem; color: white; }
        .level-card p { font-size: 0.9rem; color: #9ca3af; margin-bottom: 1rem; }
        .level-card ul {
          list-style: none;
          padding: 0;
          font-size: 0.85rem;
          color: #a5b4fc;
        }
        .level-card ul li {
          padding: 0.2rem 0;
        }
        .level-card ul li::before {
          content: '✓ ';
          color: #34d399;
        }

        .journey-timeline {
          position: relative;
          padding-left: 2rem;
        }
        .journey-timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #6366f1, #8b5cf6, #a78bfa);
        }
        .timeline-item {
          position: relative;
          padding-bottom: 1.2rem;
          padding-left: 1.5rem;
        }
        .timeline-dot {
          position: absolute;
          left: -1.95rem;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #8b5cf6;
          border: 2px solid #0a0a1a;
        }
        .timeline-header {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.3rem;
        }
        .stage-badge {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
          padding: 0.15rem 0.6rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .duration-badge {
          color: #6b7280;
          font-size: 0.75rem;
        }
        .timeline-content h4 {
          color: white;
          font-size: 1rem;
          margin-bottom: 0.4rem;
        }
        .competency-tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .comp-tag {
          background: rgba(52, 211, 153, 0.12);
          color: #34d399;
          padding: 0.1rem 0.5rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.2rem;
          margin-bottom: 2.5rem;
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .feature-icon { font-size: 1.5rem; margin-bottom: 0.6rem; }
        .feature-card h3 { font-size: 1rem; color: white; margin-bottom: 0.4rem; }
        .feature-card p { font-size: 0.85rem; color: #9ca3af; line-height: 1.5; }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 0.8rem 1.2rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .start-button {
          display: block;
          width: 100%;
          padding: 1.2rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.15rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.5px;
        }
        .start-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35);
        }
        .start-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .level-cards, .features-grid { grid-template-columns: 1fr; }
          h1 { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  )
}
