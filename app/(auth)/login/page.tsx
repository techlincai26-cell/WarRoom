'use client'

import React, { Suspense } from "react"
import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

        // Redirect based on role
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-transparent px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            KK
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin ? 'Sign in to the admin panel' : 'Sign in to your War Room assessment'}
          </p>
        </div>

        {/* Admin / Participant Toggle */}
        <div className="flex rounded-lg border bg-muted p-1 mb-4">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              !isAdmin ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => { setIsAdmin(false); setError('') }}
          >
            Participant
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              isAdmin ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => { setIsAdmin(true); setError('') }}
          >
            Admin
          </button>
        </div>

        <Card>
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
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm">
                Account created successfully! Please sign in.
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isAdmin && (
                <div>
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
                      className={batchValid === true ? 'border-green-500' : batchValid === false ? 'border-red-500' : ''}
                    />
                  </div>
                  {batchValid === true && batchName && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      &#10003; {batchName}
                    </p>
                  )}
                  {batchValid === false && (
                    <p className="text-xs text-red-500 mt-1">Invalid or inactive batch code</p>
                  )}
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : isAdmin ? 'Sign In as Admin' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!isAdmin && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </div>
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