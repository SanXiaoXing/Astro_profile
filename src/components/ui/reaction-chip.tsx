import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { SupabaseClient } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'
import { getOrCreateVisitorId } from '@/lib/reactions'
import { getSupabase } from '@/lib/supabase'

type MessageWithReactionsProps = {
  text: string
  postSlug: string
  initialCounts?: Record<string, number>
  reactionOptions?: string[]
  className?: string
}

type Row = { emoji: string }

export function MessageWithReactions({
  text,
  postSlug,
  initialCounts = {},
  reactionOptions = ['👍', '❤️', '😂', '🎉'],
  className,
}: MessageWithReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts)
  const [mySelection, setMySelection] = useState<string | null>(null)
  const [bump, setBump] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [disabled, setDisabled] = useState(false)
  const pendingRef = useRef(false)

  useEffect(() => {
    const visitorId = getOrCreateVisitorId()
    if (!visitorId) {
      setDisabled(true)
      setHydrated(true)
      return
    }

    const client = getSupabase(visitorId)
    if (!client) {
      setDisabled(true)
      setHydrated(true)
      return
    }

    setSupabase(client)

    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await client
          .from('reactions')
          .select('emoji')
          .eq('post_slug', postSlug)

        if (cancelled) return

        if (error) throw error

        const fresh: Record<string, number> = {}
        let mine: string | null = null
        for (const row of (data ?? []) as Row[]) {
          fresh[row.emoji] = (fresh[row.emoji] ?? 0) + 1
        }
        const { data: mineRow, error: mineErr } = await client
          .from('reactions')
          .select('emoji')
          .eq('post_slug', postSlug)
          .eq('visitor_id', visitorId)
          .maybeSingle()
        if (!cancelled && !mineErr && mineRow) {
          mine = (mineRow as Row).emoji
        }
        if (!cancelled) {
          setCounts(fresh)
          setMySelection(mine)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[reactions] 拉取失败', err)
        }
      } finally {
        if (!cancelled) setHydrated(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [postSlug])

  const triggerBump = useCallback(() => {
    setBump(true)
    window.setTimeout(() => setBump(false), 180)
  }, [])

  const applyLocal = useCallback(
    (previous: string | null, next: string | null) => {
      setCounts((prev) => {
        const nextCounts = { ...prev }
        if (previous) {
          nextCounts[previous] = Math.max(0, (nextCounts[previous] ?? 1) - 1)
          if (nextCounts[previous] === 0) delete nextCounts[previous]
        }
        if (next) {
          nextCounts[next] = (nextCounts[next] ?? 0) + 1
        }
        return nextCounts
      })
    },
    [],
  )

  async function handleSelect(emoji: string) {
    if (disabled || !supabase || pendingRef.current) return

    const previous = mySelection
    const next = previous === emoji ? null : emoji
    if (next === previous) return

    pendingRef.current = true
    const previousCounts = counts

    setMySelection(next)
    applyLocal(previous, next)
    if (next) triggerBump()

    try {
      const visitorId = getOrCreateVisitorId()
      if (!visitorId) throw new Error('无法识别访客身份')

      if (next === null) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('post_slug', postSlug)
          .eq('visitor_id', visitorId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('reactions').upsert(
          {
            post_slug: postSlug,
            emoji: next,
            visitor_id: visitorId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'post_slug,visitor_id' },
        )
        if (error) throw error
      }
    } catch (err) {
      console.error('[reactions] 写入失败', err)
      setMySelection(previous)
      setCounts(previousCounts)
      toast.error('网络开了小差,反应没存上')
    } finally {
      pendingRef.current = false
    }
  }

  const visibleCounts = useMemo(() => {
    return mySelection
      ? Object.entries(counts).filter(([emoji]) => emoji === mySelection)
      : []
  }, [counts, mySelection])

  return (
    <div className={cn('flex w-full justify-center p-6', className)}>
      <div
        className={cn(
          'group relative inline-block max-w-sm',
          'rounded-lg border border-border bg-card px-3 py-2',
          'text-sm text-foreground shadow-sm',
        )}
      >
        <p className="text-pretty">{text}</p>

        <div
          className="mt-2 flex flex-wrap items-center gap-1.5"
          aria-live="polite"
          aria-atomic="false"
        >
          {hydrated &&
            visibleCounts.map(([emoji, count]) => (
              <span
                key={emoji}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full',
                  'bg-muted px-2 py-0.5 text-xs text-foreground/80 ring-1 ring-border',
                  'transition-transform duration-200 ease-out',
                  bump ? 'scale-110' : 'scale-100',
                )}
                aria-label={`${emoji} ${count}`}
                title={`${emoji} ${count}`}
              >
                <span aria-hidden="true">{emoji}</span>
                <span className="tabular-nums">{count}</span>
              </span>
            ))}
        </div>

        <div
          className={cn(
            'pointer-events-none absolute -top-3 right-0 z-10',
            'translate-y-1 opacity-0',
            'transition-all duration-200 ease-out',
            'group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto',
            'focus-within:translate-y-0 focus-within:opacity-100 focus-within:pointer-events-auto',
          )}
        >
          <ReactionChip
            onSelect={handleSelect}
            emojis={reactionOptions}
            selected={mySelection ?? undefined}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

type ReactionChipProps = {
  onSelect: (emoji: string) => void
  className?: string
  emojis?: string[]
  selected?: string
  disabled?: boolean
}

function ReactionChip({
  onSelect,
  className,
  emojis = ['👍', '❤️', '😂', '🎉'],
  selected,
  disabled,
}: ReactionChipProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-1 rounded-full',
        'bg-card/90 px-2 py-1 shadow-sm ring-1 ring-border backdrop-blur',
        'transition-shadow',
        disabled && 'opacity-50',
        className,
      )}
      role="group"
      aria-label="Add reaction"
      aria-disabled={disabled}
    >
      {emojis.map((em) => {
        const isActive = selected === em
        return (
          <button
            key={em}
            type="button"
            disabled={disabled}
            onMouseDown={(evt) => evt.preventDefault()}
            onClick={(evt) => {
              const btn = evt.currentTarget as HTMLButtonElement
              onSelect(em)
              setTimeout(() => btn.blur(), 0)
            }}
            aria-pressed={isActive}
            className={cn(
              'rounded-full p-1 text-base leading-none',
              'transition-transform duration-150 ease-out',
              'hover:scale-110 focus:scale-110 focus:outline-none',
              'disabled:cursor-not-allowed disabled:hover:scale-100',
              isActive ? 'bg-muted ring-1 ring-border' : '',
            )}
            aria-label={`React with ${em}`}
            title={`React with ${em}`}
          >
            {em}
          </button>
        )
      })}
    </div>
  )
}
