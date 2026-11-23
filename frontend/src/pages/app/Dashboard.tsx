import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Atom,
  Boxes,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Cpu,
  Dna,
  FlaskConical,
  GraduationCap,
  Microscope,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import ActivityFeed from '@/components/app/ActivityFeed'
import { UtilisationBars, WeeklyBookingsChart } from '@/components/app/charts'
import { LoadError, StatCard, StatusBadge } from '@/components/app/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import { useLabStore } from '@/hooks/useLabStore'
import { addDays, formatDate, todayIso } from '@/lib/date'
import { bookingsPerDay, slotLabel, utilisationByDepartment } from '@/services/labService'

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

export default function Dashboard() {
  const { loading, error, role, currentUser, resources, bookings, activities, conflicts, getResource } = useLabStore()

  if (loading) return <PageLoader />
  if (error) return <LoadError />

  const today = todayIso()
  const weekEnd = addDays(today, 6)
  const isFaculty = role === 'faculty'
  const scoped = isFaculty ? bookings : bookings.filter((b) => b.studentName === currentUser)
  const available = resources.filter((r) => r.status === 'available').length
  const upcoming = scoped
    .filter((b) => b.status === 'confirmed' && b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.slotId.localeCompare(b.slotId))
  const pending = scoped.filter((b) => b.status === 'pending')
  const scopedConflicts = isFaculty ? conflicts : conflicts.filter((c) => c.bookings.some((b) => b.studentName === currentUser))
  const thisWeek = bookings.filter((b) => b.status === 'confirmed' && b.date >= today && b.date <= weekEnd).length

  return (
    <>
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
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {isFaculty ? 'Faculty dashboard' : `Welcome back, ${currentUser.split(' ')[0]}`}
        </h1>
        <p className="mt-2 max-w-xl text-white/85 text-pretty">
          {isFaculty
            ? pending.length
              ? `${pending.length} request${pending.length === 1 ? '' : 's'} waiting for review${scopedConflicts.length ? `, ${scopedConflicts.length} with slot conflicts` : ''}.`
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Available resources" value={`${available}/${resources.length}`} hint="Across all departments" />
        {isFaculty ? (
          <StatCard icon={CalendarCheck} label="Confirmed this week" value={thisWeek} hint="All departments, next 7 days" />
        ) : (
          <StatCard icon={CalendarCheck} label="Upcoming bookings" value={upcoming.length} hint="Confirmed slots" />
        )}
        <StatCard icon={Clock} label={isFaculty ? 'Pending requests' : 'Awaiting approval'} value={pending.length} hint="Project-based access requests" />
        <StatCard icon={AlertTriangle} label="Slot conflicts" value={scopedConflicts.length} hint={isFaculty ? 'Need an allocation decision' : 'Involving your requests'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bookings for the next 7 days</CardTitle>
            <CardDescription>Confirmed slots and pending requests across all labs.</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyBookingsChart days={bookingsPerDay(bookings)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Utilisation by department</CardTitle>
            <CardDescription>Share of slots taken this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <UtilisationBars rows={utilisationByDepartment(resources, bookings)} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{isFaculty ? 'Upcoming confirmed bookings' : 'Your upcoming bookings'}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length ? (
              <ul className="divide-y">
                {upcoming.slice(0, 5).map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{getResource(b.resourceId)?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.date)} · {slotLabel(b.slotId)}
                        {isFaculty && ` · ${b.studentName}`}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No upcoming bookings.{' '}
                <Link to="/app/catalogue" className="font-medium text-brand underline-offset-4 hover:underline">
                  Browse the catalogue
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={activities.slice(0, 6)} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            { to: '/app/catalogue', icon: Search, title: 'Find equipment', text: 'Search kits and workstations' },
            { to: '/app/bookings', icon: CalendarCheck, title: isFaculty ? 'All bookings' : 'My bookings', text: 'Upcoming, pending and past' },
            { to: '/app/approvals', icon: ClipboardCheck, title: 'Approvals', text: isFaculty ? 'Approve and resolve conflicts' : 'Faculty view' },
          ].map(({ to, icon: Icon, title, text }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:border-brand/40 hover:bg-accent"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted-foreground">{text}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
