import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="text-sm underline">
        Back to home
      </Link>
    </section>
  )
}
