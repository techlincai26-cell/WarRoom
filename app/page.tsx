'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowRight, Zap, Users, Lightbulb, TrendingUp, Target, Crown, Sparkles, MessageSquare, DollarSign, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { FadeInUp, GlowCard, StaggerGrid, AnimatedGradientText, Floating, ScaleOnHover } from '@/src/components/AnimatedComponents'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function HomePage() {
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const glowCardRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Hero title word reveal
    if (heroTitleRef.current) {
      const words = heroTitleRef.current.querySelectorAll('.word-reveal')
      gsap.fromTo(
        words,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
        }
      )
    }

    // Glow card entrance
    if (glowCardRef.current) {
      gsap.fromTo(
        glowCardRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          delay: 0.5,
          ease: 'back.out(1.7)',
        }
      )
    }

    // Scroll trigger animations for sections
    gsap.utils.toArray<HTMLElement>('.scroll-reveal').forEach((element) => {
      gsap.fromTo(
        element,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
          },
        }
      )
    })
  }, [])

  const panelCategories = [
    { icon: Sparkles, name: 'Mentors', desc: 'Master strategists who challenge your mindset', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.15)' },
    { icon: TrendingUp, name: 'Investors', desc: 'Sharks who demand numbers and execution', color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)' },
    { icon: Crown, name: 'Leaders', desc: 'Visionaries who push purpose and ethics', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.15)' },
  ]

  const featuredPanelists = [
    { name: "Kevin O'Leary", avatar: 'KO', role: 'Financial Enforcer', color: 'bg-green-500' },
    { name: 'Tony Robbins', avatar: 'TR', role: 'Belief Breaker', color: 'bg-purple-500' },
    { name: 'Mark Cuban', avatar: 'MC', role: 'Product Truth-Teller', color: 'bg-green-500' },
    { name: 'Simon Sinek', avatar: 'SS', role: 'Purpose Clarifier', color: 'bg-blue-500' },
    { name: 'Barbara Corcoran', avatar: 'BC', role: 'Intuitive Judge', color: 'bg-green-500' },
    { name: 'Indra Nooyi', avatar: 'IN', role: 'Growth Strategist', color: 'bg-blue-500' },
  ]

  const stages = [
    { num: 1, icon: Users, title: 'Assemble Your Panel', desc: 'Choose 6 panelists: 2 mentors, 2 investors, 2 leaders. Each has a unique lens.', gradient: 'from-purple-500/10 to-transparent', border: 'border-purple-500/20', badge: 'bg-purple-500' },
    { num: 2, icon: MessageSquare, title: 'Pitch & Defend', desc: 'Navigate 6 stages. Answer hard questions. Your decisions affect cash, team, and reputation.', gradient: 'from-yellow-500/10 to-transparent', border: 'border-yellow-500/20', badge: 'bg-yellow-500' },
    { num: 3, icon: Target, title: 'Get Graded', desc: 'Receive AI-powered feedback from each panelist. Discover blind spots and your founder profile.', gradient: 'from-green-500/10 to-transparent', border: 'border-green-500/20', badge: 'bg-green-500' },
  ]

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border bg-card/80 backdrop-blur-sm fixed w-full z-50"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-yellow-500 flex items-center justify-center text-white font-bold animate-glow-pulse"
              >
                KK
              </motion.div>
              <span className="font-bold text-lg">War Room</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" className="transition-all hover:shadow-md">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90 glow-button">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        {/* Animated Mesh Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-mesh-move" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-mesh-move" style={{ animationDelay: '-5s' }} />
        </div>

        <div className="mx-auto max-w-4xl text-center relative">
          <FadeInUp delay={0.1}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-yellow-500/20"
            >
              <Zap className="h-4 w-4" />
              Shark Tank Meets AI-Powered Training
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            </motion.div>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <h1 ref={heroTitleRef} className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              <span className="word-reveal inline-block">Pitch to</span>
              <span className="word-reveal inline-block ml-2">World-Class</span>
              <span className="word-reveal block gradient-text-animate text-5xl sm:text-6xl md:text-7xl mt-1">
                Virtual Investors
              </span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Face a simulated panel of legendary investors, mentors, and business leaders.
              Get grilled on your startup decisions. Build founder resilience.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.5}>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90 glow-button text-base px-8">
                    Enter the War Room
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent text-base px-8">
                  Watch Demo
                </Button>
              </motion.div>
            </div>
          </FadeInUp>

          {/* Featured Panelists Preview — Animated Orbital */}
          <FadeInUp delay={0.7}>
            <div className="mt-12 flex justify-center items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground mr-2">Face panelists like:</span>
              {featuredPanelists.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8 + idx * 0.1, type: 'spring', stiffness: 300 }}
                  whileHover={{ scale: 1.25, y: -6, zIndex: 10 }}
                  className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center text-white font-bold text-sm -ml-2 first:ml-0 border-2 border-background shadow-md cursor-pointer`}
                  title={`${p.name} - ${p.role}`}
                >
                  {p.avatar}
                </motion.div>
              ))}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-sm text-muted-foreground ml-2"
              >
                + 15 more
              </motion.span>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* How It Works - Shark Tank Style */}
      <section className="bg-card px-4 py-20 sm:px-6 lg:px-8 scroll-reveal">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <h2 className="text-center text-3xl font-bold mb-4 animate-glow-border pb-4">Your Shark Tank Experience</h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Not just another simulation. This is a pressure-tested simulation that builds real founder skills.
            </p>
          </FadeInUp>

          <StaggerGrid className="grid grid-cols-1 gap-8 md:grid-cols-3" stagger={0.15}>
            {stages.map((stage) => {
              const Icon = stage.icon
              return (
                <ScaleOnHover key={stage.num}>
                  <div className={`relative p-6 rounded-xl border bg-gradient-to-b ${stage.gradient} ${stage.border} transition-shadow hover:shadow-xl`}>
                    <div className={`absolute -top-4 left-6 ${stage.badge} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg`}>
                      {stage.num}
                    </div>
                    <Icon className="h-10 w-10 mb-4 mt-2" style={{ color: stage.badge.includes('purple') ? '#a855f7' : stage.badge.includes('yellow') ? '#eab308' : '#22c55e' }} />
                    <h3 className="font-semibold text-lg mb-2">{stage.title}</h3>
                    <p className="text-sm text-muted-foreground">{stage.desc}</p>
                  </div>
                </ScaleOnHover>
              )
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* Panel Categories */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 scroll-reveal">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <h2 className="text-center text-3xl font-bold mb-4 animate-glow-border pb-4">Meet Your Panel Categories</h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Each category brings a different perspective. Their advice will often conflict — you must choose wisely.
            </p>
          </FadeInUp>

          <StaggerGrid className="grid grid-cols-1 gap-6 sm:grid-cols-3" stagger={0.12}>
            {panelCategories.map((cat) => {
              const Icon = cat.icon
              return (
                <GlowCard key={cat.name} glowColor={cat.glow} className="p-8">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <Icon className="h-7 w-7" />
                  </motion.div>
                  <h3 className="font-bold text-xl mb-2">{cat.name}</h3>
                  <p className="text-muted-foreground">{cat.desc}</p>
                </GlowCard>
              )
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* The Twist Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 overflow-hidden scroll-reveal">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10" />
        <div className="absolute inset-0">
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-mesh-move" />
          <div className="absolute bottom-10 left-1/4 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl animate-mesh-move" style={{ animationDelay: '-7s' }} />
        </div>

        <div className="mx-auto max-w-4xl text-center relative">
          <FadeInUp>
            <Floating duration={4} y={6}>
              <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-pulse-ring-thick" />
            </Floating>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent animate-text-gradient">The Twist: Conflicting Advice</h2>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <p className="text-lg text-muted-foreground mb-8">
              Kevin O&apos;Leary wants you to cut costs. Richard Branson says invest in culture.
              Grant Cardone screams 10X. Codie Sanchez warns about cash flow.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.3}>
            <p className="text-xl font-semibold">
              <AnimatedGradientText className="text-xl font-bold" from="#6366f1" via="#f59e0b" to="#ef4444">
                Real entrepreneurs face conflicting advice every day. Learn to navigate it.
              </AnimatedGradientText>
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-yellow-600 text-white px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        </div>
        <div className="mx-auto max-w-4xl text-center relative">
          <FadeInUp>
            <h2 className="text-3xl font-bold">Ready to Face the Panel?</h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="mt-4 text-lg opacity-90">
              Two attempts. Six stages. One shot at proving you&apos;ve got what it takes.
            </p>
          </FadeInUp>
          <FadeInUp delay={0.2}>
            <div className="mt-8">
              <Link href="/dashboard">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Button size="lg" variant="secondary" className="text-lg px-8">
                    Enter the War Room
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2026 KK&apos;s War Room. All rights reserved.</p>
          <p className="mt-2 text-xs">Inspired by Shark Tank. Powered by AI. Built for founders.</p>
        </div>
      </footer>
    </div>
  )
}
