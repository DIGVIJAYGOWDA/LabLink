import { Link } from 'react-router-dom'
import { AlertTriangle, Boxes, CalendarCheck, Clock } from 'lucide-react'

import ActivityFeed from '@/components/app/ActivityFeed'
import QuickActions from '@/components/app/dashboard/QuickActions'
import WelcomeBanner from '@/components/app/dashboard/WelcomeBanner'
import UtilisationInsights from '@/components/app/UtilisationInsights'
import { UtilisationBars, WeeklyBookingsChart } from '@/components/app/charts'
import { LoadError, StatCard, StatusBadge } from '@/components/app/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import { useLabStore } from '@/hooks/useLabStore'
import { addDays, formatDate, todayIso } from '@/lib/date'
import { bookingsPerDay, slotLabel, utilisationByDepartment, utilisationInsights } from '@/services/labService'

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
      <WelcomeBanner role={role} currentUser={currentUser} pendingCount={pending.length} conflictCount={scopedConflicts.length} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Available resources"
          value={`${available}/${resources.length}`}
          hint="Across all departments"
          to="/app/catalogue?available=1"
        />
        {isFaculty ? (
          <StatCard icon={CalendarCheck} label="Confirmed this week" value={thisWeek} hint="All departments, next 7 days" to="/app/bookings?tab=upcoming" />
        ) : (
          <StatCard icon={CalendarCheck} label="Upcoming bookings" value={upcoming.length} hint="Confirmed slots" to="/app/bookings?tab=upcoming" />
        )}
        <StatCard
          icon={Clock}
          label={isFaculty ? 'Pending requests' : 'Awaiting approval'}
          value={pending.length}
          hint="Project-based access requests"
          to={isFaculty ? '/app/approvals#pending' : '/app/bookings?tab=pending'}
        />
        <StatCard
          icon={AlertTriangle}
          label="Slot conflicts"
          value={scopedConflicts.length}
          hint={isFaculty ? 'Need an allocation decision' : 'Involving your requests'}
          to={isFaculty ? '/app/approvals#conflicts' : '/app/bookings?tab=pending'}
        />
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
            <UtilisationInsights insights={utilisationInsights(resources, bookings)} role={role} />
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

      <QuickActions isFaculty={isFaculty} />
    </>
  )
}
