import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, ClipboardCheck, Search } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** Shortcut tiles to the main pages. */
export default function QuickActions({ isFaculty }: { isFaculty: boolean }) {
  return (
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
  )
}
