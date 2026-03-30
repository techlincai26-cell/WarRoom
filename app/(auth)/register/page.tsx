'use client'

import React from "react"
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
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
    if (!batchCode.trim()) {
      setError('Batch code is required')
      return
    }
    if (batchValid === false) {
      setError('Please enter a valid batch code')
      return
    }
    setLoading(true)
    setError('')

    try {
      await api.auth.register({
        name,
        email,
        password,
        batchCode: batchCode.trim().toUpperCase(),
      })
      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
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
          <h1 className="text-3xl font-bold">Get Started</h1>
          <p className="text-muted-foreground mt-2">Create your War Room account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Enter your batch code and details to begin your simulation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Batch Code</label>
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
                  required
                  className={`mt-1 ${batchValid === true ? 'border-green-500' : batchValid === false ? 'border-red-500' : ''}`}
                />
                {batchValid === true && batchName && (
                  <p className="text-xs text-green-600 mt-1">âœ“ {batchName}</p>
                )}
                {batchValid === false && (
                  <p className="text-xs text-red-500 mt-1">Invalid or inactive batch code</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
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
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
