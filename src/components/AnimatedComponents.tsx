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
