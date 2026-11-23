import type { IconItem } from '@/data/landing'

export default function FeatureCard({ icon: Icon, title, description }: IconItem) {
  return (
    <div className="group h-full rounded-xl border bg-card p-6 transition duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md">
      <div className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
