import { useEffect, useState } from 'react'

import { apiGet } from '@/services/api'
import type { HealthResponse } from '@/types/api'

export type HealthState = 'loading' | 'online' | 'offline'

export function useHealth() {
  const [state, setState] = useState<HealthState>('loading')
  const [data, setData] = useState<HealthResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    apiGet<HealthResponse>('/api/health')
      .then((res) => {
        if (cancelled) return
        setData(res)
        setState('online')
      })
      .catch(() => {
        if (!cancelled) setState('offline')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { state, data }
}
