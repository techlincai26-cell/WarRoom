'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/src/lib/api'
import type {
    AssessmentState,
    Investor,
    InvestorScorecard,
} from '@/src/types'

// ============================================
// WAR ROOM – Investor Pitch Simulation
// SOP: 15 minutes, all C1-C8 integrated
// ============================================

type WarRoomPhase = 'LOADING' | 'PITCH' | 'INVESTOR_QA' | 'DEAL_RESULTS' | 'COMPLETE'

export default function WarRoomSimulation() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params?.assessmentId as string

    // State
    const [phase, setPhase] = useState<WarRoomPhase>('LOADING')
    const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null)
    const [investors, setInvestors] = useState<Investor[]>([])
    const [pitchText, setPitchText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Investor Q&A
    const [currentInvestorIndex, setCurrentInvestorIndex] = useState(0)
    const [investorResponse, setInvestorResponse] = useState('')
    const [scorecards, setScorecards] = useState<InvestorScorecard[]>([])
    const [currentInvestorReaction, setCurrentInvestorReaction] = useState('')

    // Timer (15 min war room)
    const [timeRemaining, setTimeRemaining] = useState(15 * 60) // 15 minutes in seconds
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Load assessment state and investors
    useEffect(() => {
        const load = async () => {
            try {
                const [state, investorList] = await Promise.all([
                    api.assessments.get(assessmentId),
                    api.config.getInvestors(),
                ])
                setAssessmentState(state)
                setInvestors(investorList)
                setPhase('PITCH')
            } catch (err: any) {
                setError(err.message || 'Failed to load War Room data')
                setPhase('PITCH') // Still show pitch even if load fails
            }
        }
        load()
    }, [assessmentId])

    // 15-minute countdown timer
    useEffect(() => {
        if (phase === 'LOADING' || phase === 'COMPLETE') return

        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current)
                    // Time's up — end simulation
                    router.push(`/assessment/${assessmentId}/final-report`)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [phase, assessmentId, router])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // ============================================
    // PITCH SUBMISSION
    // ============================================
    const handleSubmitPitch = async () => {
        if (!pitchText.trim()) {
            setError('Please write your pitch before submitting')
            return
        }
        setIsSubmitting(true)
        setError('')

        try {
            await api.assessments.submitPitch(assessmentId, pitchText)
            setPhase('INVESTOR_QA')
            setCurrentInvestorIndex(0)
            setCurrentInvestorReaction('')
        } catch (err: any) {
            setError(err.message || 'Failed to submit pitch')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ============================================
    // INVESTOR RESPONSE
    // ============================================
    const handleRespondToInvestor = async () => {
        if (!investorResponse.trim()) {
            setError('Please write your response')
            return
        }

        const investor = investors[currentInvestorIndex]
        if (!investor) return

        setIsSubmitting(true)
        setError('')

        try {
            const scorecard = await api.assessments.respondToInvestor(
                assessmentId,
                investor.id,
                investorResponse
            )
            setScorecards(prev => [...prev, scorecard])
            setCurrentInvestorReaction(
                scorecard.investorReaction || `${investor.name} has considered your response.`
            )
            setInvestorResponse('')
        } catch (err: any) {
            setError(err.message || 'Failed to submit response')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Move to next investor after viewing reaction
    const handleContinueToNextInvestor = () => {
        setCurrentInvestorReaction('')
        if (currentInvestorIndex < investors.length - 1) {
            setCurrentInvestorIndex(prev => prev + 1)
        } else {
            setPhase('DEAL_RESULTS')
        }
    }

    // ============================================
    // END SIMULATION
    // ============================================
    const handleEndSimulation = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        router.push(`/assessment/${assessmentId}/final-report`)
    }

    const currentInvestor = investors[currentInvestorIndex]
    const isTimeLow = timeRemaining < 120 // < 2 minutes

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="warroom-page">
            {/* Top Bar */}
            <header className="warroom-header">
                <div className="header-left">
                    <h1 className="warroom-title">⚔️ KK'S WAR ROOM</h1>
                    <span className="warroom-subtitle">Live Investor Pitch Simulation</span>
                </div>
                <div className="header-center">
                    {phase !== 'LOADING' && (
                        <div className={`war-timer ${isTimeLow ? 'danger' : ''}`}>
                            <span className="timer-label">WAR ROOM</span>
                            <span className="timer-value">{formatTime(timeRemaining)}</span>
                        </div>
                    )}
                </div>
                <div className="header-right">
                    <button className="end-btn" onClick={handleEndSimulation}>
                        End Simulation →
                    </button>
                </div>
            </header>

            <main className="warroom-main">
                {/* ============================================ */}
                {/* LOADING */}
                {/* ============================================ */}
                {phase === 'LOADING' && (
                    <motion.div
                        className="loading-container"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="loading-icon"
                            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >⚔️</motion.div>
                        <motion.h2
                            className="loading-text"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >ENTERING WAR ROOM</motion.h2>
                        <motion.p
                            className="loading-sub"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >Assembling Investor Panel...</motion.p>
                        <div className="loading-bar">
                            <div className="loading-bar-fill" />
                        </div>
                    </motion.div>
                )}

                {/* ============================================ */}
                {/* PITCH PHASE */}
                {/* ============================================ */}
                {phase === 'PITCH' && (
                    <motion.div
                        className="pitch-phase"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="phase-badge"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring' }}
                        >PHASE 1 — YOUR PITCH</motion.div>
                        <motion.h2
                            className="phase-title"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >Deliver Your 1-Minute War Room Pitch</motion.h2>
                        <motion.p
                            className="phase-desc"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            You are standing before the investor panel. Use the template below to craft a compelling pitch
                            that demonstrates your journey, validation, and growth potential.
                        </motion.p>

                        <motion.div
                            className="pitch-template"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h3>📝 Pitch Template</h3>
                            <div className="template-text">
                                <p>Hello Sharks, my name is <strong>[NAME]</strong> and I am the founder of <strong>[BUSINESS]</strong>.</p>
                                <p><em>(The Problem)</em> Today, [TARGET CUSTOMER] struggles with [PROBLEM]. This problem causes them [IMPACT].</p>
                                <p><em>(The Solution)</em> I created [PRODUCT], which [VALUE PROP]. It works by [HOW].</p>
                                <p><em>(Why We're Different)</em> Unlike [COMPETITORS], we [DIFFERENTIATION].</p>
                                <p><em>(Proof)</em> We validated this by [VALIDATION]. So far, we have [TRACTION].</p>
                                <p><em>(Founder Fit)</em> I am building this because [WHY ME]. The key lesson I've learned is [LESSON].</p>
                                <p><em>(The Ask)</em> We are raising $[AMOUNT] for [EQUITY]% equity. We will use this capital to [PLAN].</p>
                            </div>
                        </motion.div>

                        <textarea
                            className="pitch-input"
                            value={pitchText}
                            onChange={(e) => setPitchText(e.target.value)}
                            placeholder="Hello Sharks, my name is..."
                            rows={12}
                        />

                        {error && <div className="error-msg">{error}</div>}

                        <motion.button
                            className="submit-pitch-btn"
                            onClick={handleSubmitPitch}
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isSubmitting ? 'Submitting Pitch...' : '🎤 Deliver Pitch to Panel →'}
                        </motion.button>
                    </motion.div>
                )}

                {/* ============================================ */}
                {/* INVESTOR Q&A PHASE */}
                {/* ============================================ */}
                {phase === 'INVESTOR_QA' && currentInvestor && (
                    <motion.div
                        className="investor-qa-phase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="phase-badge"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' }}
                        >PHASE 2 — INVESTOR QUESTIONS</motion.div>
                        <div className="investor-counter">
                            Investor {currentInvestorIndex + 1} of {investors.length}
                        </div>

                        {/* Investor Card — slide in */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentInvestor.id || currentInvestorIndex}
                                className="investor-card"
                                initial={{ x: 60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -60, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                            >
                                <motion.div
                                    className="investor-avatar"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                                >
                                    {currentInvestor.name.charAt(0)}
                                </motion.div>
                                <div className="investor-info">
                                    <h2 className="investor-name">{currentInvestor.name}</h2>
                                    <span className="investor-lens">{currentInvestor.primary_lens}</span>
                                    <p className="investor-bio">{currentInvestor.bio}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Investor's signature question */}
                        <motion.div
                            className="investor-question"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="question-label">🎯 {currentInvestor.name} asks:</span>
                            <p className="question-text">{currentInvestor.signature_question}</p>
                        </motion.div>

                        {/* Investor Reaction (after response) */}
                        <AnimatePresence>
                        {currentInvestorReaction && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="investor-reaction">
                                    <span className="reaction-label">💬 {currentInvestor.name} responds:</span>
                                    <p>{currentInvestorReaction}</p>
                                </div>
                                <motion.button
                                    className="respond-btn"
                                    onClick={handleContinueToNextInvestor}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {currentInvestorIndex < investors.length - 1
                                        ? `Continue to Next Investor →`
                                        : `View Panel Decisions →`}
                                </motion.button>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* Walk-out warning */}
                        <motion.div
                            className="walkout-warning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <span>🚨 Walk-out trigger:</span> {currentInvestor.walk_out_trigger}
                        </motion.div>

                        {/* User response */}
                        {!currentInvestorReaction && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <textarea
                                    className="response-input"
                                    value={investorResponse}
                                    onChange={(e) => setInvestorResponse(e.target.value)}
                                    placeholder="Respond to the investor's question..."
                                    rows={5}
                                />

                                {error && <div className="error-msg">{error}</div>}

                                <motion.button
                                    className="respond-btn"
                                    onClick={handleRespondToInvestor}
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {isSubmitting ? 'Evaluating Response...' : 'Submit Response →'}
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* ============================================ */}
                {/* DEAL RESULTS */}
                {/* ============================================ */}
                {phase === 'DEAL_RESULTS' && (
                    <motion.div
                        className="deal-results-phase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="phase-badge"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' }}
                        >PHASE 3 — PANEL DECISIONS</motion.div>
                        <motion.h2
                            className="phase-title"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >Investor Panel Results</motion.h2>

                        <div className="scorecards-grid">
                            {scorecards.map((sc, i) => {
                                const decisionColor = sc.dealDecision === 'PRIORITY_1'
                                    ? '#10b981'
                                    : sc.dealDecision === 'PRIORITY_2'
                                        ? '#f59e0b'
                                        : '#ef4444'
                                const decisionLabel = sc.dealDecision === 'PRIORITY_1'
                                    ? '🔥 PRIORITY 1 — DEAL'
                                    : sc.dealDecision === 'PRIORITY_2'
                                        ? '⚖️ PRIORITY 2 — DEAL'
                                        : '❌ WALK OUT'

                                return (
                                    <motion.div
                                        key={i}
                                        className="scorecard"
                                        style={{ borderColor: `${decisionColor}44` }}
                                        initial={{ opacity: 0, y: 30, rotateX: -10 }}
                                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                        transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                                    >
                                        <div className="sc-header">
                                            <motion.div
                                                className="sc-avatar"
                                                style={{ borderColor: decisionColor }}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.5 + i * 0.15, type: 'spring', stiffness: 300 }}
                                            >
                                                {sc.investorName.charAt(0)}
                                            </motion.div>
                                            <div>
                                                <h3 className="sc-name">{sc.investorName}</h3>
                                                <span className="sc-decision" style={{ color: decisionColor }}>
                                                    {decisionLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="sc-scores">
                                            <div className="sc-score">
                                                <span>Primary Score</span>
                                                <strong>{sc.primaryScore}/5</strong>
                                            </div>
                                            <div className="sc-score">
                                                <span>{sc.biasTraitName}</span>
                                                <strong>{sc.biasTraitScore}/5</strong>
                                            </div>
                                        </div>
                                        {sc.redFlag && (
                                            <div className="sc-redflag">
                                                🚩 Red Flag: {sc.redFlagReasons?.join(', ')}
                                            </div>
                                        )}
                                        {sc.dealProposed && sc.dealDecision !== 'WALK_OUT' && (
                                            <div className="sc-deal">
                                                <span>💰 Offer: ${sc.dealProposed.capitalOffer?.toLocaleString()}</span>
                                                <span>📊 For {sc.dealProposed.equityAsk}% equity</span>
                                            </div>
                                        )}
                                        {sc.participantResponse && (
                                            <div className="sc-user-response">
                                                <span className="sc-label">Your Response:</span>
                                                <p>{sc.participantResponse}</p>
                                            </div>
                                        )}
                                        {sc.investorReaction && (
                                            <div className="sc-investor-reaction">
                                                <span className="sc-label">💬 Investor Reaction:</span>
                                                <p>{sc.investorReaction}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>

                        {scorecards.length === 0 && (
                            <div className="no-scorecards">
                                <p>No investor decisions available yet.</p>
                            </div>
                        )}

                        <motion.button
                            className="final-report-btn"
                            onClick={handleEndSimulation}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + scorecards.length * 0.15 }}
                        >
                            View Full Evaluation Report →
                        </motion.button>
                    </motion.div>
                )}
            </main>

            <style jsx>{`
        .warroom-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #e0e0e0;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        /* HEADER */
        .warroom-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          border-bottom: 1px solid rgba(220, 38, 38, 0.2);
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .warroom-title {
          font-size: 1.3rem;
          font-weight: 900;
          color: #dc2626;
          letter-spacing: 1px;
          margin: 0;
        }
        .warroom-subtitle {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .war-timer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.2);
          padding: 0.4rem 1.4rem;
          border-radius: 10px;
        }
        .war-timer.danger {
          animation: pulse-danger 1.5s infinite;
          border-color: #ef4444;
        }
        @keyframes pulse-danger {
          0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.6); }
          100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.3); }
        }
        .timer-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 2px;
          color: #9ca3af;
          text-transform: uppercase;
        }
        .timer-value {
          font-size: 1.4rem;
          font-weight: 900;
          font-family: monospace;
          color: #ef4444;
          letter-spacing: 2px;
        }
        .end-btn {
          padding: 0.5rem 1.2rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #9ca3af;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .end-btn:hover {
          border-color: #dc2626;
          color: white;
        }

        /* MAIN */
        .warroom-main {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          min-height: calc(100vh - 80px);
        }

        /* LOADING */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }
        .loading-icon {
          font-size: 4rem;
          animation: pulse-danger 2s infinite;
          margin-bottom: 1.5rem;
        }
        .loading-text {
          font-size: 1.8rem;
          font-weight: 900;
          color: #dc2626;
          letter-spacing: 3px;
          margin-bottom: 0.5rem;
        }
        .loading-sub { color: #6b7280; margin-bottom: 2rem; }
        .loading-bar {
          width: 200px;
          height: 3px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .loading-bar-fill {
          width: 100%;
          height: 100%;
          background: #dc2626;
          animation: loading-slide 1.5s ease-in-out infinite;
        }
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* PHASE BADGE */
        .phase-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 2px;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.25);
          padding: 0.3rem 1rem;
          border-radius: 20px;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
        }
        .phase-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.6rem;
        }
        .phase-desc {
          font-size: 0.95rem;
          color: #9ca3af;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        /* PITCH TEMPLATE */
        .pitch-template {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .pitch-template h3 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #d1d5db;
        }
        .template-text {
          font-size: 0.85rem;
          line-height: 1.8;
          color: #9ca3af;
        }
        .template-text p {
          margin-bottom: 0.3rem;
        }
        .template-text strong {
          color: #ef4444;
        }
        .template-text em {
          color: #6b7280;
          font-style: normal;
          font-weight: 600;
        }

        /* PITCH INPUT */
        .pitch-input {
          width: 100%;
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(220, 38, 38, 0.2);
          border-radius: 14px;
          color: #e0e0e0;
          font-size: 0.95rem;
          font-family: inherit;
          line-height: 1.6;
          resize: vertical;
          transition: border-color 0.2s;
          margin-bottom: 1rem;
        }
        .pitch-input:focus {
          outline: none;
          border-color: #dc2626;
          background: rgba(255, 255, 255, 0.05);
        }
        .pitch-input::placeholder { color: #4b5563; }

        /* SUBMIT PITCH */
        .submit-pitch-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
        }
        .submit-pitch-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(220, 38, 38, 0.4);
        }
        .submit-pitch-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ERROR */
        .error-msg {
          color: #fca5a5;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          padding: 0.5rem 0.8rem;
          background: rgba(239, 68, 68, 0.08);
          border-radius: 8px;
        }

        /* INVESTOR Q&A */
        .investor-qa-phase { animation: fadeIn 0.5s ease; }
        .investor-counter {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }
        .investor-card {
          display: flex;
          gap: 1.2rem;
          align-items: flex-start;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .investor-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          font-weight: 900;
          color: white;
          flex-shrink: 0;
        }
        .investor-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.2rem;
        }
        .investor-lens {
          font-size: 0.75rem;
          font-weight: 700;
          color: #dc2626;
          letter-spacing: 0.5px;
        }
        .investor-bio {
          font-size: 0.85rem;
          color: #9ca3af;
          line-height: 1.4;
          margin-top: 0.5rem;
        }
        .investor-question {
          background: rgba(220, 38, 38, 0.06);
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: 14px;
          padding: 1.2rem;
          margin-bottom: 1rem;
        }
        .question-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #ef4444;
          display: block;
          margin-bottom: 0.5rem;
        }
        .question-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          line-height: 1.5;
        }
        .investor-reaction {
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 14px;
          padding: 1.2rem;
          margin-bottom: 1rem;
          animation: fadeIn 0.5s ease;
        }
        .reaction-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #10b981;
          display: block;
          margin-bottom: 0.5rem;
        }
        .investor-reaction p {
          color: #d1d5db;
          line-height: 1.5;
        }
        .walkout-warning {
          font-size: 0.8rem;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.06);
          border: 1px solid rgba(251, 191, 36, 0.15);
          border-radius: 10px;
          padding: 0.6rem 1rem;
          margin-bottom: 1.5rem;
        }
        .walkout-warning span { font-weight: 700; }
        .response-input {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #e0e0e0;
          font-size: 0.95rem;
          font-family: inherit;
          line-height: 1.5;
          resize: vertical;
          margin-bottom: 1rem;
        }
        .response-input:focus {
          outline: none;
          border-color: #dc2626;
          background: rgba(255, 255, 255, 0.05);
        }
        .response-input::placeholder { color: #4b5563; }
        .respond-btn {
          width: 100%;
          padding: 0.9rem;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }
        .respond-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
        }
        .respond-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* DEAL RESULTS */
        .deal-results-phase { animation: fadeIn 0.5s ease; }
        .scorecards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .scorecard {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid;
          border-radius: 16px;
          padding: 1.2rem;
          transition: transform 0.2s;
        }
        .scorecard:hover { transform: translateY(-2px); }
        .sc-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 1rem;
        }
        .sc-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.1rem;
        }
        .sc-name {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.1rem;
        }
        .sc-decision {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .sc-scores {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.8rem;
        }
        .sc-score {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          padding: 0.5rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          color: #9ca3af;
        }
        .sc-score strong {
          display: block;
          color: white;
          font-size: 1rem;
          margin-top: 0.2rem;
        }
        .sc-redflag {
          font-size: 0.8rem;
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.08);
          padding: 0.5rem 0.8rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }
        .sc-deal {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #10b981;
          background: rgba(16, 185, 129, 0.06);
          padding: 0.5rem 0.8rem;
          border-radius: 8px;
        }
        .sc-user-response, .sc-investor-reaction {
          margin-top: 0.6rem;
          padding: 0.5rem 0.8rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }
        .sc-user-response {
          background: rgba(99, 102, 241, 0.06);
          border-left: 2px solid rgba(99, 102, 241, 0.3);
        }
        .sc-investor-reaction {
          background: rgba(16, 185, 129, 0.06);
          border-left: 2px solid rgba(16, 185, 129, 0.3);
        }
        .sc-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #9ca3af;
          display: block;
          margin-bottom: 0.3rem;
        }
        .sc-user-response p, .sc-investor-reaction p {
          color: #d1d5db;
          line-height: 1.5;
          margin: 0;
        }
        .no-scorecards {
          text-align: center;
          color: #6b7280;
          padding: 3rem;
        }
        .final-report-btn {
          width: 100%;
          padding: 1.1rem;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
        }
        .final-report-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(220, 38, 38, 0.4);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .warroom-header { flex-wrap: wrap; gap: 0.5rem; padding: 0.8rem 1rem; }
          .warroom-main { padding: 1.5rem; }
          .scorecards-grid { grid-template-columns: 1fr; }
          .phase-title { font-size: 1.3rem; }
        }
      `}</style>
        </div>
    )
}
