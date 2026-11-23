import {
  Boxes,
  CalendarClock,
  ClipboardCheck,
  Cpu,
  FileText,
  Gauge,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export interface NavLink {
  label: string
  href: string
}

export interface IconItem {
  icon: LucideIcon
  title: string
  description: string
}

export const GITHUB_URL = 'https://github.com/DIGVIJAYGOWDA/LabLink'

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'AI Assistant', href: '#assistant' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

export const PROBLEMS: IconItem[] = [
  {
    icon: Boxes,
    title: 'Hard-to-find equipment',
    description:
      'Specialised equipment, development kits and lab workstations are spread across departments, so students often cannot tell what exists or where.',
  },
  {
    icon: CalendarClock,
    title: 'Clashing schedules',
    description:
      'When several teams need the same resource around the same deadline, booking turns into a conflict that someone has to settle by hand.',
  },
  {
    icon: ClipboardCheck,
    title: 'Slow access requests',
    description:
      'Project-based access needs faculty sign-off, and without a shared process requests are difficult to track and prioritise.',
  },
  {
    icon: Gauge,
    title: 'Underused resources',
    description:
      'Valuable equipment can sit idle in one lab while another team waits for something similar. Utilisation is hard to see and harder to improve.',
  },
]

export const SOLUTIONS: IconItem[] = [
  {
    icon: Search,
    title: 'One place to look',
    description: 'Browse equipment, kits and workstations from every department in a single catalogue.',
  },
  {
    icon: Sparkles,
    title: 'AI that resolves conflicts',
    description:
      'Gemini-powered recommendations propose fair, feasible allocations using deadlines, availability and student requirements.',
  },
  {
    icon: ShieldCheck,
    title: 'Faculty stay in control',
    description: 'Access requests are tied to projects and reviewed by faculty before anything is confirmed.',
  },
]

export const FEATURES: IconItem[] = [
  {
    icon: Search,
    title: 'Equipment discovery',
    description: 'Find specialised equipment, development kits and lab workstations across departments.',
  },
  {
    icon: CalendarClock,
    title: 'Intelligent slot booking',
    description: 'Book time slots against real availability instead of chasing people for it.',
  },
  {
    icon: FileText,
    title: 'Project-based access requests',
    description: 'Request access for a specific project, with its requirements and deadline attached.',
  },
  {
    icon: ClipboardCheck,
    title: 'Faculty approvals',
    description: 'Faculty review and approve requests, keeping access accountable.',
  },
  {
    icon: Scale,
    title: 'Fair conflict resolution',
    description: 'When bookings collide, get recommended allocations that are fair and feasible.',
  },
  {
    icon: Gauge,
    title: 'Better utilisation',
    description: 'Spread demand across shared resources so less equipment sits idle.',
  },
]

export const STEPS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Search the shared catalogue for the equipment, kit or workstation your project needs.',
  },
  {
    icon: FileText,
    title: 'Request',
    description: 'Pick a slot and submit an access request with your project details and deadline.',
  },
  {
    icon: Cpu,
    title: 'Get allocated',
    description:
      'Faculty approve the request. If slots conflict, AI recommends a fair allocation based on deadlines and availability.',
  },
]
