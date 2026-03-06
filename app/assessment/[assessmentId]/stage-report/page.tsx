'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function StageReportPage() {
  const params = useParams()
  const router = useRouter()
  useEffect(() => {
    router.replace(`/assessment/${params.assessmentId}`)
  }, [params.assessmentId, router])
  return null
}
