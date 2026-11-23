import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/layout/AppLayout'
import AppShell from '@/components/layout/AppShell'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'
import Approvals from '@/pages/app/Approvals'
import Bookings from '@/pages/app/Bookings'
import Catalogue from '@/pages/app/Catalogue'
import Dashboard from '@/pages/app/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/app" replace />} />
      <Route path="app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="catalogue" element={<Catalogue />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="approvals" element={<Approvals />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="status" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
