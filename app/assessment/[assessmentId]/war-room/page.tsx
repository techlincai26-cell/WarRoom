'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function WarRoomSimulation() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params?.assessmentId as string

    const [loading, setLoading] = useState(true)

    // In a real implementation, we would fetch the user's past answers,
    // select a panel of investors, and manage conversational AI state here.

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => setLoading(false), 2000)
        return () => clearTimeout(timer)
    }, [])

    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white">
                <h1 className="text-3xl font-bold animate-pulse text-red-600 mb-4">ENTERING WAR ROOM</h1>
                <p className="text-gray-400">Loading AI Simulation Panel...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen w-full bg-[#111] text-white overflow-hidden p-6 font-sans">
            <header className="mb-8 border-b border-red-900/40 pb-4">
                <h1 className="text-2xl font-black text-red-500 tracking-wider">KK'S WAR ROOM</h1>
                <p className="text-gray-400 text-sm mt-1">Live Investor Pitch Simulation</p>
            </header>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Investor Panel Placeholder */}
                <div className="lg:col-span-2 space-y-6 flex flex-col">
                    <div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden group">
                        {/* Placeholder for future video/avatar streaming component */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 p-6 flex flex-col justify-end">
                            <span className="text-xs font-bold bg-red-600/80 px-2 py-1 rounded w-max mb-2 backdrop-blur-md">LIVE AI</span>
                            <h2 className="text-xl font-semibold">Investor Panel</h2>
                        </div>

                        <div className="text-center z-20">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            <p className="text-gray-500 max-w-sm mx-auto px-4">
                                [Future Implementation: Interactive AI Video/Avatar Stream of Investors like Steven Bartlett, Kevin O'Leary asking questions based on your earlier stage answers]
                            </p>
                        </div>
                    </div>

                    {/* User Input Area */}
                    <div className="h-48 bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Your Action</h3>
                        <div className="flex-1 relative">
                            <textarea
                                className="w-full h-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500/50 resize-none transition-colors"
                                placeholder="Pitch your idea or respond to the investor's question..."
                            />
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-sm text-gray-300 transition-colors flex items-center gap-2">
                                    <span>🎙️</span> Voice
                                </button>
                            </div>
                            <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                                Send Response →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Data Dashboard & Sidebar */}
                <div className="space-y-6 flex flex-col">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-5 flex-1 overflow-y-auto">
                        <h3 className="text-lg font-semibold border-b border-white/10 pb-3 mb-4">Assessment Context
                        </h3>

                        <div className="space-y-4 text-sm">
                            <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
                                <h4 className="font-bold text-red-400 mb-1">Your Metrics under Scrutiny</h4>
                                <ul className="text-gray-300 space-y-1 list-disc pl-4">
                                    <li>C4 Financial Discipline</li>
                                    <li>C5 Strategic Thinking</li>
                                    <li>C6 Power & Influence</li>
                                    <li>C8 Value Creation</li>
                                </ul>
                            </div>

                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                <h4 className="font-semibold text-gray-300 mb-2">Deal Status</h4>
                                <div className="flex items-center justify-between text-gray-400 mb-1">
                                    <span>Capital Asked:</span>
                                    <span className="text-white font-mono">--</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-400">
                                    <span>Equity Offered:</span>
                                    <span className="text-white font-mono">--</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-xs text-gray-500 italic">
                                *The investors will read your responses from Stage -2 to Stage 3 to challenge your assumptions. Make sure to defend your valuation calmly.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push(`/assessment/${assessmentId}/final-report`)}
                        className="w-full py-4 bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl transition-all font-semibold"
                    >
                        End Simulation & View Report
                    </button>
                </div>

            </main>
        </div>
    )
}
