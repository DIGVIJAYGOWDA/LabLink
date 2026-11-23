import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'

import BookingDialog from '@/components/app/BookingDialog'
import ResourceCard from '@/components/app/ResourceCard'
import { EmptyState, LoadError, PageHeader } from '@/components/app/common'
import { RESOURCE_TYPE } from '@/components/app/resourceTypes'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/form'
import { PageLoader } from '@/components/ui/spinner'
import { useLabStore } from '@/hooks/useLabStore'
import { addDays, todayIso } from '@/lib/date'
import { BOOKING_WINDOW_DAYS, resourceUtilisation, suggestFreeSlots } from '@/services/labService'
import type { LabResource, ResourceType } from '@/types/lab'

export default function Catalogue() {
  const { loading, error, resources, bookings, role } = useLabStore()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [department, setDepartment] = useState('all')
  const [type, setType] = useState<ResourceType | 'all'>('all')
  const [availableOnly, setAvailableOnly] = useState(params.get('available') === '1')
  const [booking, setBooking] = useState<LabResource | null>(null)

  const departments = useMemo(() => [...new Set(resources.map((r) => r.department))].sort(), [resources])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter(
      (r) =>
        (!q || `${r.name} ${r.description} ${r.lab} ${r.department}`.toLowerCase().includes(q)) &&
        (department === 'all' || r.department === department) &&
        (type === 'all' || r.type === type) &&
        (!availableOnly || r.status === 'available'),
    )
  }, [resources, query, department, type, availableOnly])

  const hasFilters = query || department !== 'all' || type !== 'all' || availableOnly
  const clear = () => {
    setQuery('')
    setDepartment('all')
    setType('all')
    setAvailableOnly(false)
  }

  return (
    <>
      <PageHeader
        title="Resource catalogue"
        description="Specialised equipment, development kits and lab workstations from every department."
      />

      {loading ? (
        <PageLoader />
      ) : error ? (
        <LoadError />
      ) : (
        <>
          <div className="mb-6 grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto] lg:items-end">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="cat-q">Search</Label>
              <Input id="cat-q" type="search" placeholder="Name, lab or keyword" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-dept">Department</Label>
              <Select id="cat-dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="all">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-type">Type</Label>
              <Select id="cat-type" value={type} onChange={(e) => setType(e.target.value as ResourceType | 'all')}>
                <option value="all">All types</option>
                {(Object.keys(RESOURCE_TYPE) as ResourceType[]).map((t) => (
                  <option key={t} value={t}>
                    {RESOURCE_TYPE[t].label}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--brand)]"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              Available only
            </label>
          </div>

          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {filtered.length} of {resources.length} resources
            {role === 'faculty' && ' · switch to the student view to book'}
          </p>

          {filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  utilisation={resourceUtilisation(r.id, bookings)}
                  nextFree={suggestFreeSlots(bookings, r.id, addDays(todayIso(), BOOKING_WINDOW_DAYS), { limit: 1 })[0]}
                  canBook={role === 'student'}
                  onBook={() => setBooking(r)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No resources match"
              description="Try a different keyword or clear the filters."
              action={hasFilters ? <Button variant="outline" onClick={clear}>Clear filters</Button> : undefined}
            />
          )}
        </>
      )}

      {booking && <BookingDialog resource={booking} onClose={() => setBooking(null)} />}
    </>
  )
}
