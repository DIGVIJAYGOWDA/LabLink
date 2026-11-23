import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import DashboardPreview from './DashboardPreview'

export default function Hero() {
  return (
    <section id="home" className="py-14 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center rounded-full border bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            GenAI-powered lab resource sharing
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Making college laboratories more accessible
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
            Discover specialised equipment, development kits and lab workstations across departments, book slots,
            and let AI recommend fair allocations when schedules collide.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/app">
                Get Started <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </div>
        <DashboardPreview />
      </div>
    </section>
  )
}
