import { FlaskConical } from 'lucide-react'

import { GITHUB_URL, NAV_LINKS } from '@/data/landing'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <a href="#home" className="flex items-center gap-2 font-bold">
            <span className="flex size-7 items-center justify-center rounded-md bg-brand text-white">
              <FlaskConical className="size-4" aria-hidden="true" />
            </span>
            LabLink
          </a>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A GenAI-powered platform for sharing campus laboratory equipment, kits and workstations.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-semibold">Navigate</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-foreground">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold">Project</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
                GitHub repository
              </a>
            </li>
            <li>Built for the Hack2Skill hackathon</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        &copy; {YEAR} LabLink. Released under the MIT License.
      </div>
    </footer>
  )
}
