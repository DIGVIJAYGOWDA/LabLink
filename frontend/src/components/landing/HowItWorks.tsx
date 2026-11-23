import { STEPS } from '@/data/landing'
import Reveal from './Reveal'
import Section from './Section'
import SectionHeading from './SectionHeading'

export default function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading eyebrow="How it works" title="From idea to approved booking in three steps" />
      <div className="relative mt-14">
        <div
          className="absolute top-6 hidden h-px bg-border md:block"
          style={{ left: '16.66%', right: '16.66%' }}
          aria-hidden="true"
        />
        <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <li key={title} className="relative">
              <Reveal delay={i * 150} className="flex gap-4 md:flex-col md:items-center md:text-center">
              <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-background text-brand">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:mt-1">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
