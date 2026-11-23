import { PROBLEMS } from '@/data/landing'
import FeatureCard from './FeatureCard'
import Reveal from './Reveal'
import Section from './Section'
import SectionHeading from './SectionHeading'

export default function ProblemSection() {
  return (
    <Section className="bg-muted/50">
      <SectionHeading
        eyebrow="The problem"
        title="Great lab resources, hard to reach"
        description="Equipment exists on campus, but finding it, booking it and getting approval is harder than it should be."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PROBLEMS.map((p, i) => (
          <Reveal key={p.title} delay={(i % 4) * 90} className="h-full">
            <FeatureCard {...p} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
