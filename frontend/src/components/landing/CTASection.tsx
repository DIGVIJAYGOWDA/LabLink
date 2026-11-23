import { ArrowRight, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GITHUB_URL } from '@/data/landing'
import Section from './Section'

export default function CTASection() {
  return (
    <Section className="pt-0 sm:pt-0">
      <div className="rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Give every student fair access to campus labs
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 text-pretty">
          LabLink is being built in the open. Follow the project and see where it is headed.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary">
            <a href="#features">
              Explore Features <ArrowRight />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              View on GitHub <ExternalLink />
            </a>
          </Button>
        </div>
      </div>
    </Section>
  )
}
