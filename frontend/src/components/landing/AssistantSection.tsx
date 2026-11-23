import { Bot, CalendarSearch, MessageSquareText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import Reveal from './Reveal'
import Section from './Section'
import SectionHeading from './SectionHeading'

const POINTS = [
  { icon: CalendarSearch, text: 'Ask which labs, kits or workstations are free today, tomorrow or this week.' },
  { icon: MessageSquareText, text: 'Get answers about your own bookings, pending requests and booking rules.' },
  { icon: ShieldCheck, text: 'Faculty get summaries of pending requests and slot conflicts. Answers come from live LabLink data.' },
]

export default function AssistantSection() {
  return (
    <Section id="assistant" className="overflow-hidden">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="AI lab assistant"
            title="Just ask what's free"
            description="A Gemini-powered assistant inside LabLink answers questions about equipment and slots in plain language."
          />
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }, i) => (
              <Reveal key={text} delay={i * 100}>
                <li className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <p className="pt-1.5 text-muted-foreground">{text}</p>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={300} className="mt-8">
            <Button asChild size="lg">
              <Link to="/app">Try the assistant</Link>
            </Button>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <div
            className="relative rounded-2xl border bg-card p-4 shadow-xl sm:p-5"
            role="img"
            aria-label="Example conversation with the LabLink assistant"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand text-white">
                  <Bot className="size-4" aria-hidden="true" />
                </span>
                LabLink Assistant
              </p>
              <span className="text-xs text-muted-foreground">Example</span>
            </div>
            <div className="mt-4 space-y-3 text-sm" aria-hidden="true">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-brand px-3.5 py-2.5 text-white">
                Is the GPU workstation free tomorrow afternoon?
              </p>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm border bg-muted/50 px-3.5 py-2.5">
                <p>Yes, 16:00 - 18:00 is free tomorrow. 14:00 - 16:00 already has a pending request.</p>
                <p className="mt-1.5 text-muted-foreground">
                  The GPU workstation needs faculty approval, so use <strong className="text-foreground">Request access</strong> in the
                  Catalogue.
                </p>
              </div>
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-brand px-3.5 py-2.5 text-white">
                Any oscilloscope free today?
              </p>
              <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-sm border bg-muted/50 py-3">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
