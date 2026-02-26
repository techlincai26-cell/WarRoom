'use client'

// LEGACY COMPONENT — No longer used in SOP 2.0 flow
// The mentor lifeline system replaces the old panel selection

import { useState, useEffect } from 'react'
import api from '@/src/lib/api'
import type { Mentor } from '@/src/types'

export default function PanelSelection() {
  const [mentors, setMentors] = useState<Mentor[]>([])

  useEffect(() => {
    api.config.getMentors().then(setMentors).catch(console.error)
  }, [])

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Mentor Selection</h3>
      <p>This component has been replaced by the in-simulation mentor lifeline system.</p>
    </div>
  )
}
