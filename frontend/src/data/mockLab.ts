// MOCK DATA - frontend-only sample data until the database phase adds the Supabase schema.
// Dates are generated relative to today so the demo always shows upcoming activity.
import { addDays, todayIso } from '@/lib/date'
import type { Activity, Booking, LabData, LabResource } from '@/types/lab'

export const CURRENT_STUDENT = 'Demo Student'
export const CURRENT_FACULTY = 'Demo Faculty'

const RESOURCES: LabResource[] = [
  {
    id: 'r-gpu',
    name: 'GPU Workstation',
    type: 'workstation',
    department: 'Computer Science',
    lab: 'AI & ML Lab',
    description: 'High-memory GPU workstation for model training and computer-vision projects.',
    requiresApproval: true,
    status: 'available',
  },
  {
    id: 'r-rpi',
    name: 'Raspberry Pi Kit',
    type: 'kit',
    department: 'Computer Science',
    lab: 'IoT Lab',
    description: 'Single-board computer kit with sensors, camera module and breadboard.',
    requiresApproval: false,
    status: 'available',
  },
  {
    id: 'r-osc',
    name: 'Digital Storage Oscilloscope',
    type: 'equipment',
    department: 'Electronics',
    lab: 'Circuits Lab',
    description: 'Four-channel oscilloscope for signal analysis and circuit debugging.',
    requiresApproval: false,
    status: 'available',
  },
  {
    id: 'r-fpga',
    name: 'FPGA Development Board',
    type: 'kit',
    department: 'Electronics',
    lab: 'VLSI Lab',
    description: 'FPGA board with programming cable for digital design projects.',
    requiresApproval: false,
    status: 'available',
  },
  {
    id: 'r-3dp',
    name: '3D Printer',
    type: 'equipment',
    department: 'Mechanical',
    lab: 'Prototyping Lab',
    description: 'FDM 3D printer for project prototypes. Material use is reviewed by faculty.',
    requiresApproval: true,
    status: 'available',
  },
  {
    id: 'r-utm',
    name: 'Universal Testing Machine',
    type: 'equipment',
    department: 'Mechanical',
    lab: 'Materials Lab',
    description: 'Tensile and compression testing of material samples.',
    requiresApproval: true,
    status: 'available',
  },
  {
    id: 'r-cad',
    name: 'CAD Workstation',
    type: 'workstation',
    department: 'Mechanical',
    lab: 'Design Studio',
    description: 'Workstation with CAD and simulation software.',
    requiresApproval: false,
    status: 'maintenance',
  },
  {
    id: 'r-pcr',
    name: 'PCR Thermal Cycler',
    type: 'equipment',
    department: 'Biotechnology',
    lab: 'Molecular Biology Lab',
    description: 'Thermal cycler for DNA amplification experiments.',
    requiresApproval: true,
    status: 'available',
  },
  {
    id: 'r-spec',
    name: 'UV-Vis Spectrophotometer',
    type: 'equipment',
    department: 'Biotechnology',
    lab: 'Analytical Lab',
    description: 'Absorbance measurements for biochemical assays.',
    requiresApproval: false,
    status: 'available',
  },
]

function buildBookings(today: string): Booking[] {
  const d = (n: number) => addDays(today, n)
  const created = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600_000).toISOString()

  return [
    // Conflict 1: two pending requests for the GPU workstation, same slot.
    {
      id: 'b-1', resourceId: 'r-gpu', date: d(2), slotId: 's3', studentName: 'Priya S.',
      projectTitle: 'Crop disease detection', purpose: 'Train a CNN on 20k leaf images for the final-year project.',
      deadline: d(6), status: 'pending', createdAt: created(20),
    },
    {
      id: 'b-2', resourceId: 'r-gpu', date: d(2), slotId: 's3', studentName: 'Arjun K.',
      projectTitle: 'Speech emotion recognition', purpose: 'Fine-tune an audio model before the mid-term review.',
      deadline: d(12), status: 'pending', createdAt: created(8),
    },
    // Conflict 2: the demo student and another team want the 3D printer.
    {
      id: 'b-3', resourceId: 'r-3dp', date: d(3), slotId: 's1', studentName: CURRENT_STUDENT,
      projectTitle: 'Line-following robot chassis', purpose: 'Print the chassis and sensor mounts for the robot.',
      deadline: d(9), status: 'pending', createdAt: created(5),
    },
    {
      id: 'b-4', resourceId: 'r-3dp', date: d(3), slotId: 's1', studentName: 'Meera N.',
      projectTitle: 'Prosthetic hand prototype', purpose: 'Print finger joints for grip testing at the expo.',
      deadline: d(4), status: 'pending', createdAt: created(3),
    },
    // Other pending requests
    {
      id: 'b-5', resourceId: 'r-pcr', date: d(4), slotId: 's2', studentName: 'Rohan P.',
      projectTitle: 'Soil microbiome study', purpose: 'Amplify 16S rRNA samples collected from campus soil.',
      deadline: d(15), status: 'pending', createdAt: created(30),
    },
    {
      id: 'b-6', resourceId: 'r-utm', date: d(1), slotId: 's4', studentName: CURRENT_STUDENT,
      projectTitle: 'Recycled concrete strength', purpose: 'Compression tests on six recycled-aggregate cubes.',
      deadline: d(10), status: 'pending', createdAt: created(26),
    },
    // Confirmed bookings
    {
      id: 'b-7', resourceId: 'r-osc', date: d(1), slotId: 's1', studentName: CURRENT_STUDENT,
      projectTitle: 'Line-following robot', purpose: 'Debug motor driver PWM signals.',
      deadline: d(9), status: 'confirmed', createdAt: created(50),
    },
    {
      id: 'b-8', resourceId: 'r-gpu', date: d(1), slotId: 's2', studentName: 'Kavya R.',
      projectTitle: 'Traffic sign detection', purpose: 'Model training run.',
      deadline: d(5), status: 'confirmed', createdAt: created(70), facultyNote: 'Approved.',
    },
    {
      id: 'b-9', resourceId: 'r-rpi', date: d(0), slotId: 's3', studentName: 'Arjun K.',
      projectTitle: 'Smart attendance', purpose: 'Camera module testing.',
      deadline: d(8), status: 'confirmed', createdAt: created(40),
    },
    {
      id: 'b-10', resourceId: 'r-fpga', date: d(2), slotId: 's2', studentName: 'Sneha L.',
      projectTitle: 'UART controller', purpose: 'Synthesis and on-board testing.',
      deadline: d(7), status: 'confirmed', createdAt: created(60),
    },
    {
      id: 'b-11', resourceId: 'r-spec', date: d(3), slotId: 's4', studentName: 'Rohan P.',
      projectTitle: 'Enzyme kinetics', purpose: 'Absorbance readings at 340 nm.',
      deadline: d(11), status: 'confirmed', createdAt: created(45),
    },
    {
      id: 'b-12', resourceId: 'r-gpu', date: d(4), slotId: 's1', studentName: 'Priya S.',
      projectTitle: 'Crop disease detection', purpose: 'Evaluation run.',
      deadline: d(6), status: 'confirmed', createdAt: created(90), facultyNote: 'Approved.',
    },
    {
      id: 'b-13', resourceId: 'r-osc', date: d(5), slotId: 's3', studentName: 'Sneha L.',
      projectTitle: 'UART controller', purpose: 'Signal verification.',
      deadline: d(7), status: 'confirmed', createdAt: created(35),
    },
    // Closed
    {
      id: 'b-14', resourceId: 'r-pcr', date: d(-2), slotId: 's2', studentName: CURRENT_STUDENT,
      projectTitle: 'Plant DNA barcoding', purpose: 'Not enough detail on sample handling.',
      deadline: d(-1), status: 'rejected', createdAt: created(120),
      facultyNote: 'Please attach the sample-handling protocol and resubmit.',
    },
    {
      id: 'b-15', resourceId: 'r-rpi', date: d(-3), slotId: 's1', studentName: CURRENT_STUDENT,
      projectTitle: 'Line-following robot', purpose: 'Sensor calibration.',
      deadline: d(9), status: 'confirmed', createdAt: created(150),
    },
  ]
}

function buildActivities(): Activity[] {
  const at = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600_000).toISOString()
  return [
    { id: 'a-1', kind: 'request', message: 'Meera N. requested the 3D Printer', at: at(3) },
    { id: 'a-2', kind: 'request', message: `${CURRENT_STUDENT} requested the 3D Printer`, at: at(5) },
    { id: 'a-3', kind: 'request', message: 'Arjun K. requested the GPU Workstation', at: at(8) },
    { id: 'a-4', kind: 'request', message: 'Priya S. requested the GPU Workstation', at: at(20) },
    { id: 'a-5', kind: 'request', message: `${CURRENT_STUDENT} requested the Universal Testing Machine`, at: at(26) },
    { id: 'a-6', kind: 'booking', message: 'Arjun K. booked the Raspberry Pi Kit', at: at(40) },
    { id: 'a-7', kind: 'approval', message: 'Faculty approved Kavya R. on the GPU Workstation', at: at(68) },
  ]
}

export function createMockLabData(): LabData {
  return {
    resources: RESOURCES.map((r) => ({ ...r })),
    bookings: buildBookings(todayIso()),
    activities: buildActivities(),
  }
}
