import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Stagger delay in ms. */
  delay?: number
}

/**
 * Scroll-triggered reveal: fades and slides content in the first time it enters the viewport.
 * Uses IntersectionObserver (no dependency); users with reduced motion see content immediately (index.css).
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('reveal', (visible || typeof IntersectionObserver === 'undefined') && 'reveal-in', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
