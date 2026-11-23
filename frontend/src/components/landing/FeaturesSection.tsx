import { FEATURES } from '@/data/landing'
import FeatureCard from './FeatureCard'
import Reveal from './Reveal'
import Section from './Section'
import SectionHeading from './SectionHeading'

export default function FeaturesSection() {
  return (
    <Section id="features" className="bg-muted/50">
      <SectionHeading
        eyebrow="Features"
        title="Everything needed to share lab resources"
        description="From finding equipment to a fair, approved booking."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 4) * 90} className="h-full">
            <FeatureCard {...f} />
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
