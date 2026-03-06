'use client'

import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Mentor, Leader, Investor } from '@/src/types'

interface CharacterGroupProps<T> {
  title: string
  subtitle: string
  items: T[]
  selected: string[]
  maxSelect: number
  onToggle: (id: string) => void
  renderBadge: (item: T) => string
  renderMeta: (item: T) => string
}

function CharacterGroup<T extends { id: string; name: string; avatar?: string }>({
  title,
  subtitle,
  items,
  selected,
  maxSelect,
  onToggle,
  renderBadge,
  renderMeta,
}: CharacterGroupProps<T>) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-xs text-muted-foreground">
          {subtitle} — Select {maxSelect} ({selected.length}/{maxSelect})
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const isSelected = selected.includes(item.id)
          const isDisabled = !isSelected && selected.length >= maxSelect

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onToggle(item.id)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/50',
                isDisabled && !isSelected && 'opacity-40 cursor-not-allowed'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              {/* Avatar */}
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold border">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  item.name.charAt(0)
                )}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-medium leading-tight">{item.name}</div>
                <div className="text-[11px] text-primary font-medium">{renderBadge(item)}</div>
                <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                  {renderMeta(item)}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface CharacterPickerProps {
  mentors: Mentor[]
  leaders: Leader[]
  investors: Investor[]
  initialMentors?: string[]
  initialLeaders?: string[]
  initialInvestors?: string[]
  onConfirm: (selected: { mentors: string[]; leaders: string[]; investors: string[] }) => void
  loading?: boolean
}

export function CharacterPicker({
  mentors,
  leaders,
  investors,
  initialMentors = [],
  initialLeaders = [],
  initialInvestors = [],
  onConfirm,
  loading = false,
}: CharacterPickerProps) {
  const [selMentors, setSelMentors] = useState<string[]>(initialMentors)
  const [selLeaders, setSelLeaders] = useState<string[]>(initialLeaders)
  const [selInvestors, setSelInvestors] = useState<string[]>(initialInvestors)

  const toggle = (list: string[], setList: (v: string[]) => void, max: number, id: string) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id))
    } else if (list.length < max) {
      setList([...list, id])
    }
  }

  const isComplete = selMentors.length === 3 && selLeaders.length === 3 && selInvestors.length === 3

  return (
    <div className="space-y-8">
      <CharacterGroup
        title="Mentors"
        subtitle="They provide guidance during assessments"
        items={mentors}
        selected={selMentors}
        maxSelect={3}
        onToggle={(id) => toggle(selMentors, setSelMentors, 3, id)}
        renderBadge={(m) => m.specialization}
        renderMeta={(m) => m.bio?.slice(0, 60) + (m.bio?.length > 60 ? '…' : '') || ''}
      />

      <CharacterGroup
        title="Leaders"
        subtitle="They will question you between phases"
        items={leaders}
        selected={selLeaders}
        maxSelect={3}
        onToggle={(id) => toggle(selLeaders, setSelLeaders, 3, id)}
        renderBadge={(l) => l.specialization}
        renderMeta={(l) => l.bio?.slice(0, 60) + (l.bio?.length > 60 ? '…' : '') || ''}
      />

      <CharacterGroup
        title="Investors"
        subtitle="They will evaluate your pitch in the War Room"
        items={investors}
        selected={selInvestors}
        maxSelect={3}
        onToggle={(id) => toggle(selInvestors, setSelInvestors, 3, id)}
        renderBadge={(i) => i.primary_lens}
        renderMeta={(i) => i.bio?.slice(0, 60) + (i.bio?.length > 60 ? '…' : '') || ''}
      />

      <Button
        className="w-full"
        disabled={!isComplete || loading}
        onClick={() =>
          onConfirm({ mentors: selMentors, leaders: selLeaders, investors: selInvestors })
        }
      >
        {loading
          ? 'Setting up...'
          : isComplete
          ? 'Confirm Characters & Start'
          : `Select 3 from each group (${selMentors.length + selLeaders.length + selInvestors.length}/9)`}
      </Button>
    </div>
  )
}

export default CharacterPicker
