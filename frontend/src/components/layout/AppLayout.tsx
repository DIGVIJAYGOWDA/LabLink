import { FlaskConical } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <FlaskConical className="size-5" />
            LabLink
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
