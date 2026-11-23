"""MOCK DATA - temporary seed for the in-memory repositories until the database phase.

Mirrors frontend/src/data/mockLab.ts. Dates are relative to today so the demo always has
upcoming activity. Not used by business logic directly.
"""

from datetime import UTC, date, datetime, timedelta

from app.schemas.lab import Activity, Booking, Resource
from app.services import scheduling

CURRENT_STUDENT = "Demo Student"


def _resources() -> list[Resource]:
    rows = [
        (
            "r-gpu",
            "GPU Workstation",
            "workstation",
            "Computer Science",
            "AI & ML Lab",
            "High-memory GPU workstation for model training and computer-vision projects.",
            True,
            "available",
        ),
        (
            "r-rpi",
            "Raspberry Pi Kit",
            "kit",
            "Computer Science",
            "IoT Lab",
            "Single-board computer kit with sensors, camera module and breadboard.",
            False,
            "available",
        ),
        (
            "r-osc",
            "Digital Storage Oscilloscope",
            "equipment",
            "Electronics",
            "Circuits Lab",
            "Four-channel oscilloscope for signal analysis and circuit debugging.",
            False,
            "available",
        ),
        (
            "r-fpga",
            "FPGA Development Board",
            "kit",
            "Electronics",
            "VLSI Lab",
            "FPGA board with programming cable for digital design projects.",
            False,
            "available",
        ),
        (
            "r-3dp",
            "3D Printer",
            "equipment",
            "Mechanical",
            "Prototyping Lab",
            "FDM 3D printer for project prototypes. Material use is reviewed by faculty.",
            True,
            "available",
        ),
        (
            "r-utm",
            "Universal Testing Machine",
            "equipment",
            "Mechanical",
            "Materials Lab",
            "Tensile and compression testing of material samples.",
            True,
            "available",
        ),
        (
            "r-cad",
            "CAD Workstation",
            "workstation",
            "Mechanical",
            "Design Studio",
            "Workstation with CAD and simulation software.",
            False,
            "maintenance",
        ),
        (
            "r-pcr",
            "PCR Thermal Cycler",
            "equipment",
            "Biotechnology",
            "Molecular Biology Lab",
            "Thermal cycler for DNA amplification experiments.",
            True,
            "available",
        ),
        (
            "r-spec",
            "UV-Vis Spectrophotometer",
            "equipment",
            "Biotechnology",
            "Analytical Lab",
            "Absorbance measurements for biochemical assays.",
            False,
            "available",
        ),
    ]
    keys = ("id", "name", "type", "department", "lab", "description", "requires_approval", "status")
    return [Resource(**dict(zip(keys, r, strict=True))) for r in rows]


def _bookings(today: date, now: datetime) -> list[Booking]:
    d = lambda n: today + timedelta(days=n)  # noqa: E731
    ago = lambda h: now - timedelta(hours=h)  # noqa: E731
    rows = [
        # (id, resource, day, slot, student, project, purpose, deadline day, status, hours ago, note)
        (
            "b-1",
            "r-gpu",
            2,
            "s3",
            "Priya S.",
            "Crop disease detection",
            "Train a CNN on 20k leaf images for the final-year project.",
            6,
            "pending",
            20,
            None,
        ),
        (
            "b-2",
            "r-gpu",
            2,
            "s3",
            "Arjun K.",
            "Speech emotion recognition",
            "Fine-tune an audio model before the mid-term review.",
            12,
            "pending",
            8,
            None,
        ),
        (
            "b-3",
            "r-3dp",
            3,
            "s1",
            CURRENT_STUDENT,
            "Line-following robot chassis",
            "Print the chassis and sensor mounts for the robot.",
            9,
            "pending",
            5,
            None,
        ),
        (
            "b-4",
            "r-3dp",
            3,
            "s1",
            "Meera N.",
            "Prosthetic hand prototype",
            "Print finger joints for grip testing at the expo.",
            4,
            "pending",
            3,
            None,
        ),
        (
            "b-5",
            "r-pcr",
            4,
            "s2",
            "Rohan P.",
            "Soil microbiome study",
            "Amplify 16S rRNA samples collected from campus soil.",
            15,
            "pending",
            30,
            None,
        ),
        (
            "b-6",
            "r-utm",
            1,
            "s4",
            CURRENT_STUDENT,
            "Recycled concrete strength",
            "Compression tests on six recycled-aggregate cubes.",
            10,
            "pending",
            26,
            None,
        ),
        (
            "b-7",
            "r-osc",
            1,
            "s1",
            CURRENT_STUDENT,
            "Line-following robot",
            "Debug motor driver PWM signals.",
            9,
            "confirmed",
            50,
            None,
        ),
        (
            "b-8",
            "r-gpu",
            1,
            "s2",
            "Kavya R.",
            "Traffic sign detection",
            "Model training run.",
            5,
            "confirmed",
            70,
            "Approved.",
        ),
        ("b-9", "r-rpi", 0, "s3", "Arjun K.", "Smart attendance", "Camera module testing.", 8, "confirmed", 40, None),
        (
            "b-10",
            "r-fpga",
            2,
            "s2",
            "Sneha L.",
            "UART controller",
            "Synthesis and on-board testing.",
            7,
            "confirmed",
            60,
            None,
        ),
        (
            "b-11",
            "r-spec",
            3,
            "s4",
            "Rohan P.",
            "Enzyme kinetics",
            "Absorbance readings at 340 nm.",
            11,
            "confirmed",
            45,
            None,
        ),
        (
            "b-12",
            "r-gpu",
            4,
            "s1",
            "Priya S.",
            "Crop disease detection",
            "Evaluation run.",
            6,
            "confirmed",
            90,
            "Approved.",
        ),
        ("b-13", "r-osc", 5, "s3", "Sneha L.", "UART controller", "Signal verification.", 7, "confirmed", 35, None),
        (
            "b-14",
            "r-pcr",
            -2,
            "s2",
            CURRENT_STUDENT,
            "Plant DNA barcoding",
            "Not enough detail on sample handling.",
            -1,
            "rejected",
            120,
            "Please attach the sample-handling protocol and resubmit.",
        ),
        (
            "b-15",
            "r-rpi",
            -3,
            "s1",
            CURRENT_STUDENT,
            "Line-following robot",
            "Sensor calibration.",
            9,
            "confirmed",
            150,
            None,
        ),
    ]
    return [
        Booking(
            id=i,
            resource_id=res,
            date=d(day),
            slot_id=slot,
            student_name=who,
            project_title=proj,
            purpose=why,
            deadline=d(dl),
            status=status,
            created_at=ago(h),
            faculty_note=note,
        )
        for i, res, day, slot, who, proj, why, dl, status, h, note in rows
    ]


def _activities(now: datetime) -> list[Activity]:
    rows = [
        ("a-1", "request", "Meera N. requested the 3D Printer", 3),
        ("a-2", "request", f"{CURRENT_STUDENT} requested the 3D Printer", 5),
        ("a-3", "request", "Arjun K. requested the GPU Workstation", 8),
        ("a-4", "request", "Priya S. requested the GPU Workstation", 20),
        ("a-5", "request", f"{CURRENT_STUDENT} requested the Universal Testing Machine", 26),
        ("a-6", "booking", "Arjun K. booked the Raspberry Pi Kit", 40),
        ("a-7", "approval", "Faculty approved Kavya R. on the GPU Workstation", 68),
    ]
    return [Activity(id=i, kind=k, message=m, at=now - timedelta(hours=h)) for i, k, m, h in rows]


def build_seed() -> tuple[list[Resource], list[Booking], list[Activity]]:
    now = datetime.now(UTC)
    today = scheduling.today()
    return _resources(), _bookings(today, now), _activities(now)
