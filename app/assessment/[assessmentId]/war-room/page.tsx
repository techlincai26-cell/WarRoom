'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/src/lib/api'
import { useAudioRecorder } from '@/src/hooks/useAudioRecorder'
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
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Audio Recording
    const pitchRecorder = useAudioRecorder(60)  // 60s for pitch
    const responseRecorder = useAudioRecorder(30) // 30s for responses

    // Analysis results
    const [pitchAnalysis, setPitchAnalysis] = useState<{
        transcription: string; feedback: string; strengths: string[]; weaknesses: string[];
        overallScore: number; clarity: number; confidence: number; persuasion: number;
    } | null>(null)
    const [responseTranscription, setResponseTranscription] = useState('')

    // Investor Q&A
    const [currentInvestorIndex, setCurrentInvestorIndex] = useState(0)
    const [investorResponse, setInvestorResponse] = useState('')
    const [scorecards, setScorecards] = useState<InvestorScorecard[]>([])
    const [currentInvestorReaction, setCurrentInvestorReaction] = useState('')
    const [isPlayingAudio, setIsPlayingAudio] = useState(false)

    // Negotiation state
    const [offers, setOffers] = useState<any[]>([])
    const [selectedOffer, setSelectedOffer] = useState<any | null>(null)
    const [negRound, setNegRound] = useState(0)
    const [negHistory, setNegHistory] = useState<{sender: string, msg: string, type: 'investor'|'user'}[]>([])
    const [negInputCap, setNegInputCap] = useState<string>('')
    const [negInputEq, setNegInputEq] = useState<string>('')
    const [dealFinalized, setDealFinalized] = useState(false)

    // Timer (15 min war room)
    const [timeRemaining, setTimeRemaining] = useState(15 * 60); /* Disabled countdown logic */ // 15 minutes in seconds

    // -- Negotiation Logic --
    const handleSelectOffer = (offer: any) => {
        setSelectedOffer(offer)
        setNegRound(1)
        setNegHistory([
            { sender: offer.investorName, msg: offer.message, type: 'investor' }
        ])
        setNegInputCap(offer.capital.toString())
        setNegInputEq(offer.equity.toString())
    }

    const handleNegotiate = async () => {
        if (!selectedOffer) return

        const userCap = parseFloat(negInputCap) || 0
        const userEq = parseFloat(negInputEq) || 0

        const newHistory = [...negHistory, {
            sender: 'You',
            msg: `I want $${userCap.toLocaleString()} for ${userEq}% equity.`,
            type: 'user' as const
        }]

        let investorResponse = ""
        let isFinal = false
        let accepted = false
        let updatedOffer = { ...selectedOffer }

        // Logic based on Offer Type
        if (selectedOffer.type === 'OFFER_1') {
            if (negRound === 1) {
                investorResponse = "I can reduce to 35%, but I want milestone-based capital release."
                updatedOffer.equity = 35
                setNegRound(2)
            } else {
                investorResponse = "My final is 35% at milestone-based capital release. Risk is too high. Take it or leave it."
                updatedOffer.equity = 35
                isFinal = true
            }
        } else if (selectedOffer.type === 'OFFER_2') {
            investorResponse = "Best I can do is 50%. Take it or leave it."
            updatedOffer.equity = 50
            isFinal = true
        } else if (selectedOffer.type === 'OFFER_3') {
            if (negRound === 1) {
                investorResponse = "I can increase to $800K for 30%"
                updatedOffer.capital = 800000
                setNegRound(2)
            } else {
                investorResponse = "Agreed."
                updatedOffer.capital = userCap // the user negotiated $850k
                updatedOffer.equity = userEq
                accepted = true
                isFinal = true
            }
        } else {
            // Fallback
            investorResponse = "I'm sticking to my original offer. Take it or leave it."
            isFinal = true
        }

        newHistory.push({
            sender: selectedOffer.investorName,
            msg: investorResponse,
            type: 'investor'
        })

        setNegHistory(newHistory)
        setSelectedOffer(updatedOffer)
        setNegInputCap(updatedOffer.capital.toString())
        setNegInputEq(updatedOffer.equity.toString())

        if (accepted) {
            handleAcceptDeal(updatedOffer)
        }
    }

    const handleAcceptDeal = async (offer: any) => {
        try {
            await api.assessments.acceptDeal(assessmentId, offer.investorId, offer.capital, offer.equity)
            setDealFinalized(true)
        } catch (e) {
            console.error(e)
        }
    }

    const handleRejectDeal = () => {
        setSelectedOffer(null)
        setNegRound(0)
    }

    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

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

        // timer disabled per user request

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
    // PITCH SUBMISSION (AUDIO)
    // ============================================
    const handleSubmitPitchAudio = async () => {
        if (!pitchRecorder.audioBlob) {
            setError('Please record your pitch before submitting')
            return
        }
        setIsAnalyzing(true)
        setIsSubmitting(true)
        setError('')

        try {
            const result = await api.assessments.submitPitchAudio(assessmentId, pitchRecorder.audioBlob)
            setPitchAnalysis(result.analysis)
            setPitchText(result.analysis.transcription)
        } catch (err: any) {
            setError(err.message || 'Failed to analyze pitch')
        } finally {
            setIsAnalyzing(false)
            setIsSubmitting(false)
        }
    }

    const handleContinueFromPitch = () => {
        setPhase('INVESTOR_QA')
        setCurrentInvestorIndex(0)
        setCurrentInvestorReaction('')
        setPitchAnalysis(null)
    }

    // ============================================
    // INVESTOR RESPONSE (AUDIO)
    // ============================================
    const handleRespondToInvestorAudio = async () => {
        if (!responseRecorder.audioBlob) {
            setError('Please record your response')
            return
        }

        const investor = investors[currentInvestorIndex]
        if (!investor) return

        setIsAnalyzing(true)
        setIsSubmitting(true)
        setError('')

        try {
            const result = await api.assessments.respondToInvestorAudio(
                assessmentId,
                investor.id,
                responseRecorder.audioBlob
            )
            setScorecards(prev => [...prev, result.scorecard])
            setResponseTranscription(result.transcription)
            setCurrentInvestorReaction(
                result.scorecard.investorReaction || `${investor.name} has considered your response.`
            )
            responseRecorder.resetRecording()

            if (result.ttsError) {
                console.warn("TTS Generation Warning:", result.ttsError)
                setError(`Note: Audio generation failed (${result.ttsError}). Please read the text response instead.`)
            }

            if (result.audioBase64) {
                if (audioRef.current) {
                    audioRef.current.pause()
                }
                const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`)
                audioRef.current = audio
                audio.onplay = () => setIsPlayingAudio(true)
                audio.onended = () => setIsPlayingAudio(false)
                audio.onerror = () => setIsPlayingAudio(false)
                audio.play().catch(e => {
                    console.error("Auto-play failed:", e)
                    setIsPlayingAudio(false)
                })
            }
        } catch (err: any) {
            setError(err.message || 'Failed to analyze response')
        } finally {
            setIsAnalyzing(false)
            setIsSubmitting(false)
        }
    }

    // Move to next investor after viewing reaction
    const handleContinueToNextInvestor = async () => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlayingAudio(false)
        }
        setCurrentInvestorReaction('')
        if (currentInvestorIndex < investors.length - 1) {
            setCurrentInvestorIndex(prev => prev + 1)
        } else {
            try {
                const fetchedOffers = await api.assessments.getWarRoomOffers(assessmentId)
                setOffers(fetchedOffers)
            } catch (err) {
                console.error("Failed to fetch offers", err)
            }
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
                    {/* timer removed */}
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
                {/* PITCH PHASE — AUDIO RECORDING */}
                {/* ============================================ */}
                {phase === 'PITCH' && (
                    <motion.div
                        className="pitch-phase"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div className="phase-badge" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}>PHASE 1 — YOUR PITCH</motion.div>
                        <motion.h2 className="phase-title" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                            Record Your 1-Minute War Room Pitch
                        </motion.h2>
                        <motion.p className="phase-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            You are standing before the investor panel. Tap the microphone and deliver your pitch out loud.
                            You have <strong>60 seconds</strong> to make your case.
                        </motion.p>

                        {/* Pitch Template - Collapsible */}
                        <motion.details className="pitch-template" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#d1d5db' }}>📝 Pitch Template Guide (tap to expand)</summary>
                            <div className="template-text" style={{ marginTop: '0.8rem' }}>
                                <p>Hello Sharks, my name is <strong>[NAME]</strong> and I am the founder of <strong>[BUSINESS]</strong>.</p>
                                <p><em>(The Problem)</em> Today, [TARGET CUSTOMER] struggles with [PROBLEM].</p>
                                <p><em>(The Solution)</em> I created [PRODUCT], which [VALUE PROP].</p>
                                <p><em>(Why Different)</em> Unlike [COMPETITORS], we [DIFFERENTIATION].</p>
                                <p><em>(Proof)</em> We validated this by [VALIDATION]. So far, [TRACTION].</p>
                                <p><em>(The Ask)</em> We are raising $[AMOUNT] for [EQUITY]% equity.</p>
                            </div>
                        </motion.details>

                        {/* Recording UI */}
                        {!pitchAnalysis && !isAnalyzing && (
                            <motion.div className="recording-zone" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                <div className={`mic-button-wrapper ${pitchRecorder.isRecording ? 'recording' : ''}`}>
                                    {pitchRecorder.isRecording && (
                                        <>
                                            <div className="pulse-ring ring-1" />
                                            <div className="pulse-ring ring-2" />
                                            <div className="pulse-ring ring-3" />
                                        </>
                                    )}
                                    <motion.button
                                        className={`mic-button ${pitchRecorder.isRecording ? 'active' : ''} ${pitchRecorder.audioBlob ? 'done' : ''}`}
                                        onClick={pitchRecorder.isRecording ? pitchRecorder.stopRecording : pitchRecorder.startRecording}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {pitchRecorder.isRecording ? '⏹' : pitchRecorder.audioBlob ? '🔄' : '🎤'}
                                    </motion.button>
                                </div>

                                <div className="recording-status">
                                    {pitchRecorder.isRecording ? (
                                        <>
                                            <span className="rec-dot" />
                                            <span className="rec-text">Recording... {Math.max(0, 60 - pitchRecorder.recordingTime)}s left</span>
                                        </>
                                    ) : pitchRecorder.audioBlob ? (
                                        <span className="rec-done">✅ Pitch recorded ({pitchRecorder.recordingTime}s) — Tap 🔄 to re-record</span>
                                    ) : (
                                        <span className="rec-hint">Tap the microphone to start recording</span>
                                    )}
                                </div>

                                {/* Countdown bar */}
                                {pitchRecorder.isRecording && (
                                    <div className="countdown-bar">
                                        <div className="countdown-fill" style={{ width: `${Math.max(0, ((60 - pitchRecorder.recordingTime) / 60) * 100)}%` }} />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Analyzing state */}
                        {isAnalyzing && (
                            <motion.div className="analyzing-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="analyzing-spinner" />
                                <h3>Analyzing Your Pitch...</h3>
                                <p>Our AI panel is reviewing your delivery, content, and persuasiveness.</p>
                            </motion.div>
                        )}

                        {/* Pitch Analysis Results */}
                        {pitchAnalysis && (
                            <motion.div className="analysis-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <h3 className="analysis-title">📊 Pitch Analysis</h3>
                                <div className="analysis-scores">
                                    <div className="score-item"><span className="score-label">Overall</span><span className="score-value">{pitchAnalysis.overallScore}/10</span></div>
                                    <div className="score-item"><span className="score-label">Clarity</span><span className="score-value">{pitchAnalysis.clarity}/5</span></div>
                                    <div className="score-item"><span className="score-label">Confidence</span><span className="score-value">{pitchAnalysis.confidence}/5</span></div>
                                    <div className="score-item"><span className="score-label">Persuasion</span><span className="score-value">{pitchAnalysis.persuasion}/5</span></div>
                                </div>
                                <div className="analysis-transcript">
                                    <span className="analysis-label">📝 What you said:</span>
                                    <p>{pitchAnalysis.transcription}</p>
                                </div>
                                
                                {pitchAnalysis.strengths?.length > 0 && (
                                    <div className="analysis-list strengths">
                                        <span className="analysis-label">✅ Strengths:</span>
                                        <ul>{pitchAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}
                                {pitchAnalysis.weaknesses?.length > 0 && (
                                    <div className="analysis-list weaknesses">
                                        <span className="analysis-label">⚠️ Areas to Improve:</span>
                                        <ul>{pitchAnalysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                    </div>
                                )}
                                <motion.button className="submit-pitch-btn" onClick={handleContinueFromPitch} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    Continue to Investor Questions →
                                </motion.button>
                            </motion.div>
                        )}

                        {error && <div className="error-msg">{error}</div>}

                        {!pitchAnalysis && !isAnalyzing && pitchRecorder.audioBlob && (
                            <motion.button
                                className="submit-pitch-btn"
                                onClick={handleSubmitPitchAudio}
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isSubmitting ? 'Analyzing Pitch...' : '🚀 Submit Pitch for Analysis'}
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {/* ============================================ */}
                {/* INVESTOR Q&A PHASE — AUDIO RECORDING */}
                {/* ============================================ */}
                {phase === 'INVESTOR_QA' && currentInvestor && (
                    <motion.div className="investor-qa-phase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <motion.div className="phase-badge" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>PHASE 2 — INVESTOR QUESTIONS</motion.div>
                        <div className="investor-counter">Investor {currentInvestorIndex + 1} of {investors.length}</div>

                        {/* Investor Card */}
                        <AnimatePresence mode="wait">
                            <motion.div key={currentInvestor.id || currentInvestorIndex} className="investor-card" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ duration: 0.4 }}>
                                <motion.div className="investor-avatar" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}>
                                    {currentInvestor.name.charAt(0)}
                                </motion.div>
                                <div className="investor-info">
                                    <h2 className="investor-name">{currentInvestor.name}</h2>
                                    <span className="investor-lens">{currentInvestor.primary_lens}</span>
                                    <p className="investor-bio">{currentInvestor.bio}</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Question */}
                        <motion.div className="investor-question" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                            <span className="question-label">🎯 {currentInvestor.name} asks:</span>
                            <p className="question-text">{currentInvestor.signature_question}</p>
                        </motion.div>

                        {/* Investor Reaction (after response) */}
                        <AnimatePresence>
                        {currentInvestorReaction && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {responseTranscription && (
                                    <div className="analysis-transcript" style={{ marginBottom: '1rem' }}>
                                        <span className="analysis-label">📝 What you said:</span>
                                        <p>{responseTranscription}</p>
                                    </div>
                                )}
                                <div className="investor-reaction">
                                    <span className="reaction-label">
                                        💬 {currentInvestor.name} responds:
                                        {isPlayingAudio && <span style={{ marginLeft: '10px', fontSize: '0.85em', color: '#10b981', fontWeight: 'normal' }}>🔊 Playing...</span>}
                                    </span>
                                    <p>{currentInvestorReaction}</p>
                                </div>
                                <motion.button className="respond-btn" onClick={handleContinueToNextInvestor} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    {currentInvestorIndex < investors.length - 1 ? `Continue to Next Investor →` : `View Panel Decisions →`}
                                </motion.button>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* Walk-out warning */}
                        <motion.div className="walkout-warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            <span>🚨 Walk-out trigger:</span> {currentInvestor.walk_out_trigger}
                        </motion.div>

                        {/* Audio Recording for Response */}
                        {!currentInvestorReaction && !isAnalyzing && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                                <div className="recording-zone" style={{ marginBottom: '1rem' }}>
                                    <div className={`mic-button-wrapper ${responseRecorder.isRecording ? 'recording' : ''}`}>
                                        {responseRecorder.isRecording && (
                                            <>
                                                <div className="pulse-ring ring-1" />
                                                <div className="pulse-ring ring-2" />
                                                <div className="pulse-ring ring-3" />
                                            </>
                                        )}
                                        <motion.button
                                            className={`mic-button ${responseRecorder.isRecording ? 'active' : ''} ${responseRecorder.audioBlob ? 'done' : ''}`}
                                            onClick={responseRecorder.isRecording ? responseRecorder.stopRecording : responseRecorder.startRecording}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {responseRecorder.isRecording ? '⏹' : responseRecorder.audioBlob ? '🔄' : '🎤'}
                                        </motion.button>
                                    </div>
                                    <div className="recording-status">
                                        {responseRecorder.isRecording ? (
                                            <><span className="rec-dot" /><span className="rec-text">Recording... {Math.max(0, 30 - responseRecorder.recordingTime)}s left</span></>
                                        ) : responseRecorder.audioBlob ? (
                                            <span className="rec-done">✅ Response recorded ({responseRecorder.recordingTime}s)</span>
                                        ) : (
                                            <span className="rec-hint">Tap the microphone to record your response (30s max)</span>
                                        )}
                                    </div>
                                    {responseRecorder.isRecording && (
                                        <div className="countdown-bar"><div className="countdown-fill" style={{ width: `${Math.max(0, ((30 - responseRecorder.recordingTime) / 30) * 100)}%` }} /></div>
                                    )}
                                </div>

                                {error && <div className="error-msg">{error}</div>}

                                {responseRecorder.audioBlob && (
                                    <motion.button className="respond-btn" onClick={handleRespondToInvestorAudio} disabled={isSubmitting} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                        {isSubmitting ? 'Analyzing Response...' : '🚀 Submit Response →'}
                                    </motion.button>
                                )}
                            </motion.div>
                        )}

                        {/* Analyzing state */}
                        {isAnalyzing && (
                            <motion.div className="analyzing-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="analyzing-spinner" />
                                <h3>Analyzing Your Response...</h3>
                                <p>{currentInvestor.name} is evaluating your answer.</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* ============================================ */}
                {/* DEAL RESULTS / NEGOTIATION */}
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
                        >PHASE 3 — INVESTOR OFFERS</motion.div>
                        <motion.h2
                            className="phase-title"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {dealFinalized ? "Deal Finalized!" : selectedOffer ? "Negotiation Room" : "Investor Panel Results"}
                        </motion.h2>

                        {!selectedOffer && !dealFinalized && (
                            <div className="scorecards-grid">
                                {offers.map((offer, i) => (
                                    <motion.div
                                        key={i}
                                        className="scorecard"
                                        style={{ borderColor: '#10b98144', cursor: 'pointer' }}
                                        initial={{ opacity: 0, y: 30, rotateX: -10 }}
                                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                        transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                                        onClick={() => handleSelectOffer(offer)}
                                    >
                                        <div className="sc-header">
                                            <motion.div
                                                className="sc-avatar"
                                                style={{ borderColor: '#10b981' }}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.5 + i * 0.15, type: 'spring', stiffness: 300 }}
                                            >
                                                {offer.investorName.charAt(0)}
                                            </motion.div>
                                            <div>
                                                <h3 className="sc-name">{offer.investorName}</h3>
                                                <span className="sc-decision" style={{ color: '#10b981' }}>
                                                    🔥 OFFER RECEIVED
                                                </span>
                                            </div>
                                        </div>
                                        <div className="sc-deal">
                                            <span>💰 Offer: ${(offer.capital || 0).toLocaleString()}</span>
                                            <span>📊 For {offer.equity}% equity</span>
                                        </div>
                                        <div className="sc-investor-reaction">
                                            <p>"{offer.message}"</p>
                                        </div>
                                        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
                                            Click to Negotiate →
                                        </div>
                                    </motion.div>
                                ))}
                                {offers.length === 0 && (
                                    <div className="no-scorecards">
                                        <p>No investor offers available.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedOffer && !dealFinalized && (
                            <motion.div
                                className="negotiation-room"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="neg-header" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                    <h3>Negotiating with {selectedOffer.investorName}</h3>
                                    <p>Current Offer: ${selectedOffer.capital.toLocaleString()} for {selectedOffer.equity}%</p>
                                </div>

                                <div className="neg-history" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {negHistory.map((item, idx) => (
                                        <div key={idx} style={{ 
                                            padding: '1rem', 
                                            borderRadius: '12px', 
                                            background: item.type === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            alignSelf: item.type === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%'
                                        }}>
                                            <strong style={{ display: 'block', marginBottom: '0.3rem', color: item.type === 'user' ? '#60a5fa' : '#34d399' }}>{item.sender}</strong>
                                            {item.msg}
                                        </div>
                                    ))}
                                </div>

                                <div className="neg-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input 
                                        type="number" 
                                        value={negInputCap} 
                                        onChange={e => setNegInputCap(e.target.value)} 
                                        placeholder="Capital Ask ($)" 
                                        className="pitch-input" 
                                        style={{ marginBottom: 0, flex: 1 }}
                                    />
                                    <input 
                                        type="number" 
                                        value={negInputEq} 
                                        onChange={e => setNegInputEq(e.target.value)} 
                                        placeholder="Equity Offered (%)" 
                                        className="pitch-input" 
                                        style={{ marginBottom: 0, flex: 1 }}
                                    />
                                    <button className="submit-pitch-btn" style={{ flex: 1, padding: '1.2rem' }} onClick={handleNegotiate}>
                                        Counter Offer
                                    </button>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                    <button className="respond-btn" style={{ background: '#10b981' }} onClick={() => handleAcceptDeal(selectedOffer)}>
                                        Accept Current Offer
                                    </button>
                                    <button className="respond-btn" style={{ background: '#ef4444' }} onClick={handleRejectDeal}>
                                        Walk Away
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {dealFinalized && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '3rem', background: 'rgba(16,185,129,0.1)', borderRadius: '16px', border: '1px solid #10b981' }}
                            >
                                <h2 style={{ fontSize: '2rem', color: '#10b981', marginBottom: '1rem' }}>Deal Secured! 🎉</h2>
                                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>You accepted an offer from {selectedOffer?.investorName}.</p>
                                <button className="final-report-btn" onClick={handleEndSimulation}>
                                    Complete Simulation & View Report →
                                </button>
                            </motion.div>
                        )}

                        {!selectedOffer && !dealFinalized && (
                            <motion.button
                                className="final-report-btn"
                                onClick={handleEndSimulation}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + offers.length * 0.15 }}
                                style={{ marginTop: '2rem' }}
                            >
                                Walk Away from All Offers →
                            </motion.button>
                        )}
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
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
          backface-visibility: hidden;
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
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
          backface-visibility: hidden;
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
          .mic-button { width: 80px; height: 80px; font-size: 2rem; }
          .analysis-scores { grid-template-columns: repeat(2, 1fr); }
        }

        /* ============================================ */
        /* AUDIO RECORDING UI */
        /* ============================================ */
        .recording-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
          padding: 2rem 1rem;
        }
        .mic-button-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 140px;
          height: 140px;
        }
        .mic-button {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 4px solid rgba(220, 38, 38, 0.6);
          background: radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.3), rgba(20, 20, 20, 1));
          color: #ef4444;
          font-size: 3rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 0 40px rgba(220, 38, 38, 0.25), inset 0 0 20px rgba(220, 38, 38, 0.1);
        }
        .mic-button:hover {
          border-color: #ef4444;
          box-shadow: 0 0 40px rgba(220, 38, 38, 0.3);
        }
        .mic-button.active {
          border-color: #ef4444;
          background: radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.3), rgba(30, 5, 5, 0.95));
          box-shadow: 0 0 50px rgba(220, 38, 38, 0.4);
          animation: mic-glow 2s ease-in-out infinite;
          will-change: box-shadow;
          transform: translateZ(0);
        }
        .mic-button.done {
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
        }
        @keyframes mic-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(220, 38, 38, 0.3); }
          50% { box-shadow: 0 0 60px rgba(220, 38, 38, 0.6); }
        }

        /* Pulse rings */
        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(220, 38, 38, 0.25);
          animation: pulse-expand 2s ease-out infinite;
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        .ring-1 { width: 120px; height: 120px; animation-delay: 0s; }
        .ring-2 { width: 150px; height: 150px; animation-delay: 0.5s; }
        .ring-3 { width: 180px; height: 180px; animation-delay: 1s; }
        @keyframes pulse-expand {
          0% { opacity: 0.6; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(1.3); }
        }

        /* Recording status */
        .recording-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        .rec-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
          animation: rec-blink 1s infinite;
        }
        @keyframes rec-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .rec-text { color: #ef4444; font-weight: 700; }
        .rec-done { color: #22c55e; font-weight: 600; }
        .rec-hint { color: #6b7280; }

        /* Countdown bar */
        .countdown-bar {
          width: 100%;
          max-width: 400px;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }
        .countdown-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #dc2626);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        /* Analyzing state */
        .analyzing-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem 1rem;
        }
        .analyzing-state h3 { color: #e5e7eb; font-size: 1.2rem; margin: 0; }
        .analyzing-state p { color: #9ca3af; margin: 0; }
        .analyzing-spinner {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 4px solid rgba(220, 38, 38, 0.15);
          border-top-color: #dc2626;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Analysis panel */
        .analysis-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          margin-top: 1rem;
        }
        .analysis-title {
          color: #e5e7eb;
          font-size: 1.1rem;
          margin: 0 0 1rem;
          font-weight: 800;
        }
        .analysis-scores {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.8rem;
          margin-bottom: 1.2rem;
        }
        .score-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          padding: 0.8rem;
          background: rgba(220, 38, 38, 0.06);
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: 12px;
        }
        .score-label { font-size: 0.7rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .score-value { font-size: 1.3rem; font-weight: 900; color: #ef4444; font-family: monospace; }
        .analysis-transcript, .analysis-feedback {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 0.8rem;
        }
        .analysis-transcript p, .analysis-feedback p {
          color: #d1d5db;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0.4rem 0 0;
        }
        .analysis-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .analysis-list { margin-bottom: 0.8rem; }
        .analysis-list ul {
          margin: 0.4rem 0 0;
          padding-left: 1.3rem;
        }
        .analysis-list li {
          color: #d1d5db;
          font-size: 0.9rem;
          margin-bottom: 0.3rem;
        }
        .analysis-list.strengths .analysis-label { color: #22c55e; }
        .analysis-list.weaknesses .analysis-label { color: #f59e0b; }
      `}</style>
        </div>
    )
}
