import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowUp, Bot, RotateCcw, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLabStore } from '@/hooks/useLabStore'
import { cn } from '@/lib/utils'
import { errorMessage } from '@/services/api'
import { sendChat } from '@/services/assistantService'
import type { ChatMessage } from '@/types/lab'

const SUGGESTIONS = {
  student: [
    'Which labs are free today?',
    'When is the GPU Workstation free this week?',
    'What are my upcoming bookings?',
    'Which equipment needs faculty approval?',
  ],
  faculty: [
    'Which requests are waiting for approval?',
    'Summarise the open slot conflicts',
    'Which labs are free tomorrow?',
    'Which department is busiest this week?',
  ],
}

/** Renders the small subset of Markdown the model uses: paragraphs, bullet/numbered lists, **bold**. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  )
}

function FormattedText({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let items: string[] = []
  const flush = () => {
    if (items.length) {
      blocks.push(
        <ul key={blocks.length} className="my-1 list-disc space-y-0.5 pl-4">
          {items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      )
      items = []
    }
  }
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^#{1,6}\s+/, '')
    const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (bullet) {
      items.push(bullet[1])
      continue
    }
    flush()
    if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line)}</p>)
  }
  flush()
  return <div className="space-y-1.5">{blocks}</div>
}

export default function AssistantChat() {
  const { role, currentUser } = useLabStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallback, setFallback] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, error])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function ask(history: ChatMessage[]) {
    setSending(true)
    setError(null)
    try {
      const res = await sendChat(history, role, currentUser)
      setFallback(res.source === 'fallback')
      setMessages([...history, { role: 'assistant', content: res.reply }])
    } catch (err) {
      setError(errorMessage(err, 'The assistant is unavailable right now.'))
    } finally {
      setSending(false)
    }
  }

  function send(text: string) {
    const content = text.trim()
    if (!content || sending) return
    const history: ChatMessage[] = [...messages, { role: 'user', content: content.slice(0, 2000) }]
    setMessages(history)
    setInput('')
    void ask(history)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <>
      {open && (
        <section
          aria-label="LabLink assistant"
          className="fixed inset-x-3 bottom-20 z-50 flex h-[min(34rem,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:inset-x-auto sm:right-6 sm:w-96"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-brand to-teal-600 px-4 py-3 text-white">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
              <Bot className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">LabLink Assistant</p>
              <p className="truncate text-xs text-white/80">Free slots, equipment, bookings{role === 'faculty' ? ', conflicts' : ''}</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([])
                  setError(null)
                }}
                className="rounded-md p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
                aria-label="Start a new conversation"
                title="New conversation"
              >
                <RotateCcw className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4" aria-live="polite">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-background px-3.5 py-2.5 text-sm shadow-xs">
              Hi! I can check which labs and equipment are free, explain booking rules
              {role === 'faculty' ? ', and summarise pending requests and conflicts.' : ', and tell you about your bookings.'}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS[role].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:border-brand/50 hover:bg-brand-soft hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'ml-auto rounded-tr-sm bg-brand text-white'
                    : 'rounded-tl-sm border bg-background shadow-xs',
                )}
              >
                {m.role === 'assistant' ? <FormattedText text={m.content} /> : m.content}
              </div>
            ))}

            {sending && (
              <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-sm border bg-background py-3" role="status">
                <span className="sr-only">Assistant is typing</span>
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p>{error}</p>
                {messages.at(-1)?.role === 'user' && (
                  <button type="button" onClick={() => void ask(messages)} className="mt-1.5 font-medium underline underline-offset-2">
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>

          {fallback && (
            <p className="border-t bg-amber-50 px-4 py-1.5 text-xs text-amber-900">
              Basic mode: add a Gemini API key on the server for full AI answers.
            </p>
          )}

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3">
            <label htmlFor="assistant-input" className="sr-only">
              Ask the LabLink assistant
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about labs, slots or bookings…"
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" className="size-10 shrink-0 rounded-xl bg-brand hover:bg-brand/90" disabled={!input.trim() || sending} aria-label="Send">
              <ArrowUp />
            </Button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close LabLink assistant' : 'Open LabLink assistant'}
        className="fixed bottom-5 right-5 z-50 flex size-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-teal-600 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:scale-105 hover:shadow-xl sm:right-6 sm:h-12 sm:w-auto sm:pl-4 sm:pr-5"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Sparkles className="size-5" aria-hidden="true" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Ask LabLink AI'}</span>
      </button>
    </>
  )
}
