import { Link } from 'react-router-dom'
import { Database, ExternalLink, FlaskConical, Sparkles } from 'lucide-react'

import Reveal from '@/components/ui/reveal'

const GITHUB_URL = 'https://github.com/DIGVIJAYGOWDA/LabLink'

const NAV = [
  { to: '/app', label: 'Dashboard' },
  { to: '/app/catalogue', label: 'Catalogue' },
  { to: '/app/bookings', label: 'Bookings' },
  { to: '/app/approvals', label: 'Approvals' },
]

export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer relative isolate mt-8 overflow-hidden text-white">
      <div className="h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-cyan-400" aria-hidden="true" />
      <div className="bg-dot-grid absolute inset-0 -z-10 opacity-20" aria-hidden="true" />
      <div className="animate-float absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-teal-400/25 blur-3xl" aria-hidden="true" />
      <div
        className="animate-float absolute -bottom-24 left-10 -z-10 size-64 rounded-full bg-cyan-400/20 blur-3xl"
        style={{ animationDelay: '-3s' }}
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <Reveal>
          <Link to="/app" className="flex items-center gap-2 text-lg font-bold">
            <span className="shine relative flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white/15 ring-1 ring-white/25">
              <FlaskConical className="size-5" aria-hidden="true" />
            </span>
            LabLink
          </Link>
          <p className="mt-3 max-w-sm text-sm text-white/75">
            Making college laboratories more accessible. Discover equipment across departments, book slots and get fair,
            AI-assisted allocations.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <nav aria-label="Footer">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">Navigate</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="footer-link hover:text-white">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>

        <Reveal delay={200}>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-300" aria-hidden="true" /> AI assistant by Google Gemini
            </li>
            <li className="flex items-center gap-2">
              <Database className="size-4 text-teal-300" aria-hidden="true" /> Data stored in Supabase
            </li>
            <li>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="footer-link inline-flex items-center gap-1.5 hover:text-white">
                GitHub repository <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </Reveal>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 pr-24 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pr-48">
          <p>&copy; {year} LabLink. Released under the MIT License.</p>
          <p className="flex items-center gap-2">
            <span className="live-dot inline-block size-2 rounded-full bg-emerald-400" aria-hidden="true" />
            Built for the Hack2Skill hackathon
          </p>
        </div>
      </div>
    </footer>
  )
}
