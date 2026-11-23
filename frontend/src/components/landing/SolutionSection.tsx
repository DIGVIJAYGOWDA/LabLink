import { SOLUTIONS } from '@/data/landing'
import Section from './Section'
import SectionHeading from './SectionHeading'

export default function SolutionSection() {
  return (
    <Section id="about">
      <SectionHeading
        eyebrow="About LabLink"
        title="One shared platform for every campus lab"
        description="LabLink is a GenAI-powered resource-sharing platform that connects students with equipment across departments while keeping faculty in the loop."
      />
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {SOLUTIONS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
