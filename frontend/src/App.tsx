import { Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/layout/AppLayout'
import Home from '@/pages/Home'
import Landing from '@/pages/Landing'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route element={<AppLayout />}>
        <Route path="status" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
