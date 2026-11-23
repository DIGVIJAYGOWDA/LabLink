import { Boxes, Cpu, Monitor, type LucideIcon } from 'lucide-react'

import type { ResourceType } from '@/types/lab'

/** Display label and icon for each resource type. */
export const RESOURCE_TYPE: Record<ResourceType, { label: string; icon: LucideIcon }> = {
  equipment: { label: 'Equipment', icon: Cpu },
  kit: { label: 'Development kit', icon: Boxes },
  workstation: { label: 'Workstation', icon: Monitor },
}
