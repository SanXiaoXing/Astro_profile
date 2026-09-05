import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [hydrated, setHydrated] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [disabled, setDisabled] = useState(false)
  const [bumpingEmoji, setBumpingEmoji] = useState<string | null>(null)
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

  const triggerBump = useCallback((emoji: string) => {
    setBumpingEmoji(emoji)
    window.setTimeout(() => setBumpingEmoji(null), 180)
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
    if (next) triggerBump(emoji)

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

  const isActuallyDisabled = disabled || !hydrated

  return (
    <div className={cn('flex w-full justify-center', className)}>
      <div
        className={cn(
          'relative w-full max-w-md',
          'rounded-xl border border-white/[0.06]',
          'bg-card/40 backdrop-blur-sm',
          'px-5 py-4 sm:px-6 sm:py-5',
          'shadow-lg shadow-black/10',
        )}
      >
        <div className="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-hc/20 to-transparent" />

        <p className="mb-4 text-center text-sm text-foreground/70">
          {text}
        </p>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {reactionOptions.map((emoji) => {
            const count = counts[emoji] ?? 0
            const isSelected = emoji === mySelection
            const isBumping = emoji === bumpingEmoji

            return (
              <button
                key={emoji}
                type="button"
                disabled={isActuallyDisabled}
                onClick={() => handleSelect(emoji)}
                aria-pressed={isSelected}
                className={cn(
                  'relative flex min-w-[52px] flex-col items-center gap-0.5',
                  'rounded-xl px-3 py-2.5',
                  'transition-[background-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-out)] select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',

                  isSelected
                    ? [
                        'bg-primary/10',
                        'ring-1 ring-primary/30',
                        'shadow-[0_0_20px_-8px_hsl(var(--primary))]',
                      ]
                    : [
                        'bg-muted/30 hover:bg-muted/50',
                        'ring-1 ring-transparent hover:ring-border/50',
                        'active:bg-muted/70',
                      ],

                  isBumping && 'scale-110',

                  isActuallyDisabled && 'cursor-not-allowed opacity-40',
                )}
                aria-label={`${isSelected ? '已选择 ' : ''}反应 ${emoji}`}
              >
                <span
                  className={cn(
                    'text-xl leading-none transition-transform duration-150',
                    'hover:scale-110',
                    isSelected && 'scale-110',
                  )}
                  aria-hidden="true"
                >
                  {emoji}
                </span>
                <span
                  className={cn(
                    'text-xs tabular-nums leading-none',
                    isSelected
                      ? 'font-medium text-primary'
                      : 'text-foreground/60',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {!disabled && hydrated && (
          <p className="mt-3 text-center text-xs text-foreground/40">
            {mySelection ? '再次点击可取消反应' : '点击表情参与互动'}
          </p>
        )}

        {disabled && (
          <p className="mt-3 text-center text-xs text-foreground/25">
            阅读模式下无法记录反应
          </p>
        )}
      </div>
    </div>
  )
}