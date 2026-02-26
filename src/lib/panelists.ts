// SOP 2.0 — Panelists are now split into mentors, investors, and leaders
// Re-exported from the new types for backward compatibility
export type { Mentor, Investor, Leader } from '@/src/types'

// Legacy type alias
export type Panelist = {
  id: string
  name: string
  specialization: string
  avatar: string
  bio: string
  tone: string
}

export const getPanelistById = (panelists: Panelist[], id: string): Panelist | undefined => {
  return panelists.find(p => p.id === id)
}
