import { useHealth } from '@/hooks/useHealth'

export default function Home() {
  const { state, data } = useHealth()

  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold tracking-tight">LabLink</h1>
      <p className="text-muted-foreground">Making College Laboratories More Accessible.</p>
      <p className="text-sm">
        Backend:{' '}
        <span className="font-medium">
          {state === 'loading' && 'checking…'}
          {state === 'online' && `online (${data?.service} v${data?.version})`}
          {state === 'offline' && 'offline'}
        </span>
      </p>
    </section>
  )
}
