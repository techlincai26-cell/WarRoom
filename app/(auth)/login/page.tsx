'use client'

import React, { Suspense } from "react"
import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/src/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')

  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [batchCode, setBatchCode] = useState('')
  const [batchValid, setBatchValid] = useState<boolean | null>(null)
  const [batchName, setBatchName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleBatchCodeBlur = async () => {
    if (!batchCode.trim()) return
    try {
      const res = await api.batches.validate(batchCode.trim().toUpperCase())
      if (res.valid && res.batch) {
        setBatchValid(true)
        setBatchName(res.batch.name)
      } else {
        setBatchValid(false)
        setBatchName('')
      }
    } catch {
      setBatchValid(false)
      setBatchName('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin && !batchCode.trim()) {
      setError('Batch code is required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const loginData: { email: string; password: string; batchCode?: string } = {
        email,
        password,
      }
      if (!isAdmin) {
        loginData.batchCode = batchCode.trim().toUpperCase()
      }

      const response = await api.auth.login(loginData)

      if (response.token) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        if (response.batch) {
          localStorage.setItem('batch', JSON.stringify(response.batch))
        }

        if (response.user?.role === 'admin') {
          router.push('/admin/cohorts')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError('Invalid credentials')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated mesh background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-mesh-move" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl animate-mesh-move" style={{ animationDelay: '-7s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-mesh-move" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-yellow-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 animate-glow-pulse"
          >
            KK
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold"
          >
            Welcome Back
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-2"
          >
            {isAdmin ? 'Sign in to the admin panel' : 'Sign in to your War Room assessment'}
          </motion.p>
        </div>

        {/* Admin / Participant Toggle */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex rounded-lg border bg-muted p-1 mb-4"
        >
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-300 ${
              !isAdmin ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => { setIsAdmin(false); setError('') }}
          >
            Participant
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all duration-300 ${
              isAdmin ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => { setIsAdmin(true); setError('') }}
          >
            Admin
          </button>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle>{isAdmin ? 'Admin Sign In' : 'Sign In'}</CardTitle>
              <CardDescription>
                {isAdmin
                  ? 'Enter your admin credentials'
                  : 'Enter your batch code and credentials to access your assessments'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registered && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm"
                >
                  Account created successfully! Please sign in.
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isAdmin && (
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                    <label className="text-sm font-medium">Batch Code</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="text"
                        placeholder="e.g. BATCH2024A"
                        value={batchCode}
                        onChange={(e) => {
                          setBatchCode(e.target.value.toUpperCase())
                          setBatchValid(null)
                          setBatchName('')
                        }}
                        onBlur={handleBatchCodeBlur}
                        required={!isAdmin}
                        className={`transition-all duration-300 ${batchValid === true ? 'border-green-500 shadow-green-500/20 shadow-sm' : batchValid === false ? 'border-red-500 shadow-red-500/20 shadow-sm' : ''}`}
                      />
                    </div>
                    {batchValid === true && batchName && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        &#10003; {batchName}
                      </motion.p>
                    )}
                    {batchValid === false && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 mt-1">Invalid or inactive batch code</motion.p>
                    )}
                  </motion.div>
                )}
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.65 }}>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 transition-all duration-300 focus:shadow-md"
                  />
                </motion.div>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 transition-all duration-300 focus:shadow-md"
                  />
                </motion.div>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.75 }}>
                  <Button type="submit" className="w-full glow-button" disabled={loading}>
                    {loading ? 'Signing in...' : isAdmin ? 'Sign In as Admin' : 'Sign In'}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {!isAdmin && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <LoginContent />
    </Suspense>
  )
}