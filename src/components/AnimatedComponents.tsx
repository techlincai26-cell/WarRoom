'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================
// FADE IN UP — Viewport-triggered fade + slide
// ============================================

interface FadeInUpProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  y?: number
}

export function FadeInUp({ children, delay = 0, duration = 0.5, className, y = 24 }: FadeInUpProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// GLOW CARD — Premium glassmorphism card
// ============================================

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  hoverScale?: number
}

export function GlowCard({ children, className, glowColor = 'rgba(99, 102, 241, 0.15)', hoverScale = 1.02 }: GlowCardProps) {
  return (
    <motion.div
      whileHover={{
        scale: hoverScale,
        boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'relative rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl overflow-hidden',
        'before:absolute before:inset-0 before:rounded-2xl before:border before:border-white/5',
        'shadow-lg shadow-black/5',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// COUNT UP — Animated number counter
// ============================================

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export function CountUp({ end, duration = 2, prefix = '', suffix = '', decimals = 0, className }: CountUpProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true

    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * end)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  )
}

// ============================================
// TYPEWRITER TEXT — Character-by-character reveal
// ============================================

interface TypewriterTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  onComplete?: () => void
}

export function TypewriterText({ text, speed = 40, delay = 0, className, onComplete }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) {
      onComplete?.()
      return
    }
    const timeout = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, speed)
    return () => clearTimeout(timeout)
  }, [started, displayed, text, speed, onComplete])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  )
}

// ============================================
// PULSE GLOW — Pulsing glow indicator
// ============================================

interface PulseGlowProps {
  color?: string
  size?: number
  className?: string
}

export function PulseGlow({ color = '#10b981', size = 8, className }: PulseGlowProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <motion.span
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, width: size, height: size }}
      />
      <span
        className="relative rounded-full"
        style={{ backgroundColor: color, width: size, height: size }}
      />
    </span>
  )
}

// ============================================
// STAGGER GRID — Staggered entrance grid
// ============================================

interface StaggerGridProps {
  children: React.ReactNode
  className?: string
  stagger?: number
}

export function StaggerGrid({ children, className, stagger = 0.08 }: StaggerGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: stagger,
      },
    },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } },
  }

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      className={className}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? (
          <motion.div variants={item}>{child}</motion.div>
        ) : child
      )}
    </motion.div>
  )
}

// ============================================
// SCALE ON HOVER — 3D tilt + scale wrapper
// ============================================

interface ScaleOnHoverProps {
  children: React.ReactNode
  className?: string
  scale?: number
}

export function ScaleOnHover({ children, className, scale = 1.03 }: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// ANIMATED GRADIENT TEXT
// ============================================

interface AnimatedGradientTextProps {
  children: React.ReactNode
  className?: string
  from?: string
  via?: string
  to?: string
}

export function AnimatedGradientText({
  children,
  className,
  from = '#6366f1',
  via = '#f59e0b',
  to = '#ef4444',
}: AnimatedGradientTextProps) {
  return (
    <motion.span
      className={cn('inline-block bg-clip-text text-transparent bg-[length:200%_auto]', className)}
      style={{
        backgroundImage: `linear-gradient(90deg, ${from}, ${via}, ${to}, ${from})`,
      }}
      animate={{ backgroundPosition: ['0% center', '200% center'] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.span>
  )
}

// ============================================
// SLIDE TRANSITION — For page/question transitions
// ============================================

interface SlideTransitionProps {
  children: React.ReactNode
  transitionKey: string | number
  direction?: 'left' | 'right'
  className?: string
}

export function SlideTransition({ children, transitionKey, direction = 'left', className }: SlideTransitionProps) {
  const xOffset = direction === 'left' ? 60 : -60

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, x: xOffset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -xOffset }}
        transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ============================================
// FLOATING ANIMATION — For decorative elements
// ============================================

interface FloatingProps {
  children: React.ReactNode
  className?: string
  duration?: number
  y?: number
}

export function Floating({ children, className, duration = 3, y = 10 }: FloatingProps) {
  return (
    <motion.div
      animate={{ y: [-y, y, -y] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// SHIMMER — Loading shimmer effect
// ============================================

interface ShimmerProps {
  className?: string
  width?: string
  height?: string
}

export function Shimmer({ className, width = '100%', height = '20px' }: ShimmerProps) {
  return (
    <div
      className={cn('animate-shimmer rounded-lg bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]', className)}
      style={{ width, height }}
    />
  )
}

// ============================================
// CINEMA OVERLAY — Full-screen dramatic transition
// ============================================

interface CinemaOverlayProps {
  show: boolean
  icon?: React.ReactNode
  title?: string
  subtitle?: string
}

export function CinemaOverlay({ show, icon, title, subtitle }: CinemaOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center gap-4"
        >
          {icon && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-5xl"
            >
              {icon}
            </motion.div>
          )}
          {title && (
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent"
            >
              {title}
            </motion.h2>
          )}
          {subtitle && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          )}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 1.5, ease: 'easeInOut' }}
            className="w-48 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent origin-center"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// STAGE NARRATION OVERLAY — Cinematic Phase Intro
// ============================================

interface StageNarrationData {
  month: string
  title: string
  desc: string
}

interface StageNarrationOverlayProps {
  show: boolean
  data: StageNarrationData
  stageIndex: number
  totalStages: number
  stageLabels: string[]
  accentColor?: string
  onDismiss: () => void
}

export function StageNarrationOverlay({ show, data, stageIndex, totalStages, stageLabels, accentColor = '#6366f1', onDismiss }: StageNarrationOverlayProps) {
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timer)
  }, [show, onDismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center text-center p-6 cursor-pointer"
          style={{ background: 'radial-gradient(ellipse at center, hsl(var(--background) / 0.97), hsl(var(--background) / 0.99))' }}
          onClick={onDismiss}
        >
          {/* Month badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold tracking-[0.15em] uppercase mb-6 border"
            style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
          >
            <span>📅</span> {data.month}
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-4xl sm:text-5xl font-black tracking-tight mb-3"
          >
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, hsl(var(--foreground)), ${accentColor})` }}>
              {data.title}
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="text-muted-foreground max-w-md leading-relaxed text-base"
          >
            {data.desc}
          </motion.p>

          {/* Journey Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="flex items-center gap-0 w-full max-w-sm mt-8"
          >
            {stageLabels.map((label, i) => (
              <React.Fragment key={i}>
                <div
                  className={cn(
                    'w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all duration-300',
                    i === stageIndex ? 'scale-125' : '',
                    i < stageIndex ? 'bg-emerald-500 border-emerald-500' :
                    i === stageIndex ? 'border-[var(--active-color)] bg-[var(--active-color)]' :
                    'border-muted-foreground/20 bg-muted/30'
                  )}
                  style={{ '--active-color': accentColor } as React.CSSProperties}
                  title={label}
                />
                {i < stageLabels.length - 1 && (
                  <div className={cn('flex-1 h-0.5', i < stageIndex ? 'bg-emerald-500' : 'bg-muted-foreground/10')} />
                )}
              </React.Fragment>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-between w-full max-w-sm mt-1.5 px-0"
          >
            {stageLabels.map((label, i) => (
              <span key={i} className={cn(
                'text-[8px] font-bold tracking-wider',
                i === stageIndex ? 'text-foreground' : i < stageIndex ? 'text-emerald-500/50' : 'text-muted-foreground/30'
              )} style={i === stageIndex ? { color: accentColor } : undefined}>
                {label}
              </span>
            ))}
          </motion.div>

          {/* Skip hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-xs text-muted-foreground/40 mt-8 tracking-wide"
          >
            Click anywhere or wait to continue...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// SNAPSHOT DASHBOARD — Post-Stage Performance
// ============================================

interface SnapshotEntry {
  name: string
  score: number
  isUser: boolean
}

interface SnapshotDashboardProps {
  show: boolean
  revenue: number
  previousRevenue?: number
  leaderboardEntries: SnapshotEntry[]
  currentUserId?: string
  stageName: string
  onContinue: () => void
}

export function SnapshotDashboard({ show, revenue, previousRevenue, leaderboardEntries, stageName, onContinue }: SnapshotDashboardProps) {
  const revChange = previousRevenue && previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue * 100) : 0
  const isPositive = revChange >= 0

  function fmtRev(amount: number): string {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
    return `$${amount.toLocaleString()}`
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-lg space-y-5"
          >
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span>📊</span> Stage Complete
              </div>
              <h3 className="text-xl font-bold">{stageName}</h3>
            </div>

            {/* Revenue Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "rounded-2xl border p-6 text-center bg-card",
                isPositive ? "border-emerald-500/30" : "border-red-500/30"
              )}
            >
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Revenue Projection</p>
              <div className={cn(
                "text-4xl font-black font-mono",
                isPositive ? "text-emerald-500" : "text-red-500"
              )}>
                {fmtRev(revenue)}
              </div>
              {previousRevenue !== undefined && previousRevenue > 0 && (
                <div className={cn("flex items-center justify-center gap-1 mt-2 text-sm font-semibold", isPositive ? "text-emerald-500" : "text-red-500")}>
                  <span>{isPositive ? '📈' : '📉'}</span>
                  <span>{isPositive ? '+' : ''}{revChange.toFixed(1)}% from last stage</span>
                </div>
              )}
            </motion.div>

            {/* Mini Leaderboard */}
            {leaderboardEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="rounded-2xl border bg-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">🏆 Leaderboard</p>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
                <div className="space-y-1">
                  {leaderboardEntries.slice(0, 6).map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                        entry.isUser ? "bg-primary/5 border border-primary/20" : ""
                      )}
                    >
                      <span className="w-6 text-center font-bold text-xs" style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : undefined }}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                      </span>
                      <span className="flex-1 truncate">
                        {entry.name}
                        {entry.isUser && <span className="ml-1 text-[10px] text-primary font-bold">(YOU)</span>}
                      </span>
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {entry.score.toFixed(0)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Continue button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                className="px-8 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-lg transition-all hover:shadow-xl"
              >
                Continue →
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// MENTOR TIP POPUP — Contextual Auto-Guidance
// ============================================

interface MentorTipPopupProps {
  show: boolean
  message: string
  emoji?: string
  onDismiss: () => void
  onAskMentor?: () => void
}

export function MentorTipPopup({ show, message, emoji = '💡', onDismiss, onAskMentor }: MentorTipPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-24 right-6 z-[55] max-w-xs"
        >
          <div className="relative bg-card border-2 border-primary/20 rounded-2xl p-4 shadow-xl">
            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              ✕
            </button>

            <div className="flex items-start gap-3 pr-4">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg flex-shrink-0"
              >
                {emoji}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Mentor Tip</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{message}</p>
              </div>
            </div>

            {onAskMentor && (
              <button
                onClick={() => { onDismiss(); onAskMentor(); }}
                className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
              >
                💬 Use a Mentor Lifeline
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

