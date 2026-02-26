'use client'

// LEGACY COMPONENT — No longer used in SOP 2.0 flow
// Kept for backward compatibility; mentor system replaces the old panelist panel

import { useState, useEffect } from 'react'
import api from '@/src/lib/api'
import type { Mentor } from '@/src/types'

export default function PanelistPanel() {
  const [mentors, setMentors] = useState<Mentor[]>([])

  useEffect(() => {
    api.config.getMentors().then(setMentors).catch(console.error)
  }, [])

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Available Mentors</h3>
      {mentors.map(m => (
        <div key={m.id} style={{ marginBottom: '0.5rem' }}>
          <strong>{m.name}</strong> — {m.specialization}
        </div>
      ))}
    </div>
  )
}
