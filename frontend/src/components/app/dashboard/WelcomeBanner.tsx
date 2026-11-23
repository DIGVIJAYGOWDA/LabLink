import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Atom,
  CalendarCheck,
  ClipboardCheck,
  Cpu,
  Dna,
  FlaskConical,
  GraduationCap,
  Microscope,
  Scale,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatLongDate, todayIso } from '@/lib/date'
import type { Role } from '@/types/lab'

// Decorative illustration for the welcome banner: floating lab icons, different per role
const ART: Record<'student' | 'faculty', { icon: LucideIcon; className: string; delay: string }[]> = {
  student: [
    { icon: Microscope, className: 'right-24 top-8 size-20 [&_svg]:size-10', delay: '0s' },
    { icon: FlaskConical, className: 'right-56 top-6 size-14 [&_svg]:size-7', delay: '-1.5s' },
    { icon: Cpu, className: 'right-8 top-24 size-14 [&_svg]:size-7', delay: '-3s' },
    { icon: Atom, className: 'right-48 bottom-8 size-16 [&_svg]:size-8', delay: '-4.5s' },
    { icon: Dna, className: 'right-14 bottom-6 size-12 [&_svg]:size-6', delay: '-2.2s' },
  ],
  faculty: [
    { icon: ClipboardCheck, className: 'right-24 top-8 size-20 [&_svg]:size-10', delay: '0s' },
    { icon: GraduationCap, className: 'right-56 top-6 size-14 [&_svg]:size-7', delay: '-1.5s' },
    { icon: Scale, className: 'right-8 top-24 size-14 [&_svg]:size-7', delay: '-3s' },
    { icon: CalendarCheck, className: 'right-48 bottom-8 size-16 [&_svg]:size-8', delay: '-4.5s' },
    { icon: ShieldCheck, className: 'right-14 bottom-6 size-12 [&_svg]:size-6', delay: '-2.2s' },
  ],
}

interface WelcomeBannerProps {
  role: Role
  currentUser: string
  pendingCount: number
  conflictCount: number
}

/** Role-coloured greeting with today's date, a summary line and the main call to action. */
export default function WelcomeBanner({ role, currentUser, pendingCount, conflictCount }: WelcomeBannerProps) {
  const isFaculty = role === 'faculty'
  return (
    <section
      className={`relative isolate mb-6 overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg sm:p-8 ${
        isFaculty ? 'from-indigo-600 via-violet-600 to-purple-700 shadow-indigo-500/25' : 'from-brand via-teal-600 to-cyan-700 shadow-brand/20'
      }`}
    >
      <div className="bg-dot-grid absolute inset-0 -z-10 opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-96 lg:block">
        {ART[role].map(({ icon: Icon, className, delay }, i) => (
          <span
            key={i}
            className={`animate-float absolute flex items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm ${className}`}
            style={{ animationDelay: delay }}
          >
            <Icon strokeWidth={1.6} />
          </span>
        ))}
      </div>
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">
        {isFaculty ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : <GraduationCap className="size-3.5" aria-hidden="true" />}
        {isFaculty ? 'Faculty view' : 'Student view'}
      </p>
      <p className="text-sm font-medium text-white/80">
        {formatLongDate(todayIso())}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
        {isFaculty ? 'Faculty dashboard' : `Welcome back, ${currentUser.split(' ')[0]}`}
      </h1>
      <p className="mt-2 max-w-xl text-white/85 text-pretty">
        {isFaculty
          ? pendingCount
            ? `${pendingCount} request${pendingCount === 1 ? '' : 's'} waiting for review${conflictCount ? `, ${conflictCount} with slot conflicts` : ''}.`
            : 'No requests are waiting for review.'
          : 'Find lab resources, track your bookings and follow your access requests.'}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="secondary" className={`bg-white hover:bg-white/90 ${isFaculty ? 'text-indigo-700' : 'text-brand'}`}>
          <Link to={isFaculty ? '/app/approvals' : '/app/catalogue'}>
            {isFaculty ? 'Review requests' : 'Find equipment'} <ArrowRight />
          </Link>
        </Button>
        <p className="flex items-center gap-1.5 text-sm text-white/85 sm:ml-2">
          <Sparkles className="size-4" aria-hidden="true" /> Tip: ask LabLink AI which labs are free.
        </p>
      </div>
    </section>
  )
}
