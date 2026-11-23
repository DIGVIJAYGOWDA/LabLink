import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GITHUB_URL } from '@/data/landing'
import Reveal from './Reveal'
import Section from './Section'

export default function CTASection() {
  return (
    <Section className="pt-0 sm:pt-0">
      <Reveal className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-teal-700 px-6 py-14 text-center text-white sm:px-12">
        <div className="bg-dot-grid absolute inset-0 -z-10 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Give every student fair access to campus labs
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/85 text-pretty">
          Find equipment, book a slot or ask the AI assistant. No sign-up needed.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary">
            <Link to="/app">
              Open LabLink <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              View on GitHub <ExternalLink />
            </a>
          </Button>
        </div>
      </Reveal>
    </Section>
  )
}
