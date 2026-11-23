-- LabLink sample data (same records as the backend in-memory mock data).
-- Run after schema.sql. Dates are relative to the day you run it. Safe to re-run (existing ids are skipped).

insert into public.resources (id, name, type, department, lab, description, requires_approval, status) values
  ('r-gpu',  'GPU Workstation',              'workstation', 'Computer Science', 'AI & ML Lab',           'High-memory GPU workstation for model training and computer-vision projects.', true,  'available'),
  ('r-rpi',  'Raspberry Pi Kit',             'kit',         'Computer Science', 'IoT Lab',               'Single-board computer kit with sensors, camera module and breadboard.',       false, 'available'),
  ('r-osc',  'Digital Storage Oscilloscope', 'equipment',   'Electronics',      'Circuits Lab',          'Four-channel oscilloscope for signal analysis and circuit debugging.',        false, 'available'),
  ('r-fpga', 'FPGA Development Board',       'kit',         'Electronics',      'VLSI Lab',              'FPGA board with programming cable for digital design projects.',              false, 'available'),
  ('r-3dp',  '3D Printer',                   'equipment',   'Mechanical',       'Prototyping Lab',       'FDM 3D printer for project prototypes. Material use is reviewed by faculty.', true,  'available'),
  ('r-utm',  'Universal Testing Machine',    'equipment',   'Mechanical',       'Materials Lab',         'Tensile and compression testing of material samples.',                        true,  'available'),
  ('r-cad',  'CAD Workstation',              'workstation', 'Mechanical',       'Design Studio',         'Workstation with CAD and simulation software.',                               false, 'maintenance'),
  ('r-pcr',  'PCR Thermal Cycler',           'equipment',   'Biotechnology',    'Molecular Biology Lab', 'Thermal cycler for DNA amplification experiments.',                           true,  'available'),
  ('r-spec', 'UV-Vis Spectrophotometer',     'equipment',   'Biotechnology',    'Analytical Lab',        'Absorbance measurements for biochemical assays.',                             false, 'available')
on conflict (id) do nothing;

insert into public.bookings (id, resource_id, date, slot_id, student_name, project_title, purpose, deadline, status, created_at, faculty_note) values
  ('b-1',  'r-gpu',  current_date + 2,  's3', 'Priya S.',     'Crop disease detection',       'Train a CNN on 20k leaf images for the final-year project.', current_date + 6,  'pending',   now() - interval '20 hours',  null),
  ('b-2',  'r-gpu',  current_date + 2,  's3', 'Arjun K.',     'Speech emotion recognition',   'Fine-tune an audio model before the mid-term review.',        current_date + 12, 'pending',   now() - interval '8 hours',   null),
  ('b-3',  'r-3dp',  current_date + 3,  's1', 'Demo Student', 'Line-following robot chassis', 'Print the chassis and sensor mounts for the robot.',          current_date + 9,  'pending',   now() - interval '5 hours',   null),
  ('b-4',  'r-3dp',  current_date + 3,  's1', 'Meera N.',     'Prosthetic hand prototype',    'Print finger joints for grip testing at the expo.',           current_date + 4,  'pending',   now() - interval '3 hours',   null),
  ('b-5',  'r-pcr',  current_date + 4,  's2', 'Rohan P.',     'Soil microbiome study',        'Amplify 16S rRNA samples collected from campus soil.',        current_date + 15, 'pending',   now() - interval '30 hours',  null),
  ('b-6',  'r-utm',  current_date + 1,  's4', 'Demo Student', 'Recycled concrete strength',   'Compression tests on six recycled-aggregate cubes.',          current_date + 10, 'pending',   now() - interval '26 hours',  null),
  ('b-7',  'r-osc',  current_date + 1,  's1', 'Demo Student', 'Line-following robot',         'Debug motor driver PWM signals.',                             current_date + 9,  'confirmed', now() - interval '50 hours',  null),
  ('b-8',  'r-gpu',  current_date + 1,  's2', 'Kavya R.',     'Traffic sign detection',       'Model training run.',                                         current_date + 5,  'confirmed', now() - interval '70 hours',  'Approved.'),
  ('b-9',  'r-rpi',  current_date,      's3', 'Arjun K.',     'Smart attendance',             'Camera module testing.',                                      current_date + 8,  'confirmed', now() - interval '40 hours',  null),
  ('b-10', 'r-fpga', current_date + 2,  's2', 'Sneha L.',     'UART controller',              'Synthesis and on-board testing.',                             current_date + 7,  'confirmed', now() - interval '60 hours',  null),
  ('b-11', 'r-spec', current_date + 3,  's4', 'Rohan P.',     'Enzyme kinetics',              'Absorbance readings at 340 nm.',                              current_date + 11, 'confirmed', now() - interval '45 hours',  null),
  ('b-12', 'r-gpu',  current_date + 4,  's1', 'Priya S.',     'Crop disease detection',       'Evaluation run.',                                             current_date + 6,  'confirmed', now() - interval '90 hours',  'Approved.'),
  ('b-13', 'r-osc',  current_date + 5,  's3', 'Sneha L.',     'UART controller',              'Signal verification.',                                        current_date + 7,  'confirmed', now() - interval '35 hours',  null),
  ('b-14', 'r-pcr',  current_date - 2,  's2', 'Demo Student', 'Plant DNA barcoding',          'Not enough detail on sample handling.',                       current_date - 1,  'rejected',  now() - interval '120 hours', 'Please attach the sample-handling protocol and resubmit.'),
  ('b-15', 'r-rpi',  current_date - 3,  's1', 'Demo Student', 'Line-following robot',         'Sensor calibration.',                                         current_date + 9,  'confirmed', now() - interval '150 hours', null)
on conflict (id) do nothing;

insert into public.activities (id, kind, message, at) values
  ('a-1', 'request',  'Meera N. requested the 3D Printer',                         now() - interval '3 hours'),
  ('a-2', 'request',  'Demo Student requested the 3D Printer',                     now() - interval '5 hours'),
  ('a-3', 'request',  'Arjun K. requested the GPU Workstation',                    now() - interval '8 hours'),
  ('a-4', 'request',  'Priya S. requested the GPU Workstation',                    now() - interval '20 hours'),
  ('a-5', 'request',  'Demo Student requested the Universal Testing Machine',      now() - interval '26 hours'),
  ('a-6', 'booking',  'Arjun K. booked the Raspberry Pi Kit',                      now() - interval '40 hours'),
  ('a-7', 'approval', 'Faculty approved Kavya R. on the GPU Workstation',          now() - interval '68 hours')
on conflict (id) do nothing;
