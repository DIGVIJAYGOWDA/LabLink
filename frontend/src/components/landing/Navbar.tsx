import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { NAV_LINKS } from '@/data/landing'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#home" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
            <FlaskConical className="size-4.5" aria-hidden="true" />
          </span>
          LabLink
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden md:inline-flex">
            <Link to="/app">Get Started</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t bg-background md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={close}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Button asChild className="w-full">
                <Link to="/app" onClick={close}>
                  Get Started
                </Link>
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
