import type {
  Employee,
  EmployeeProfileDetail,
  Profile,
  UserRole,
} from "@/types/domain"

/**
 * Static seed roster for the demo. Attendance, leave, and salary records are
 * generated from this list in seed.ts, relative to "today", so the demo
 * always looks current no matter when it's run.
 */
export interface PersonSeed {
  profile: Profile
  employee: Employee
  detail: EmployeeProfileDetail
  /** demo-only password for the mock auth layer */
  password: string
}

function iso(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d)).toISOString()
}

function makeProfile(
  id: string,
  email: string,
  role: UserRole,
  display_name: string
): Profile {
  return {
    id,
    email,
    role,
    display_name,
    is_active: true,
    created_at: iso(2024, 1, 1),
    updated_at: iso(2024, 1, 1),
  }
}

const COMPANY = "Dayflow Technologies"

const raw: Array<{
  id: string
  first: string
  last: string
  role: UserRole
  department: string
  title: string
  join: [number, number, number]
  serial: number
  password: string
  manager: string | null
  location: string
  phone: string
  gender: string
  marital: string
  dob: [number, number, number]
  skills: string[]
  certs: string[]
  about: string
  loves: string
  interests: string
}> = [
  {
    id: "01",
    first: "Ananya",
    last: "Verma",
    role: "admin",
    department: "Leadership",
    title: "HR Administrator",
    join: [2020, 1, 15],
    serial: 1,
    password: "Admin@123",
    manager: null,
    location: "Bengaluru, IN",
    phone: "+91 98450 11201",
    gender: "Female",
    marital: "Married",
    dob: [1990, 4, 12],
    skills: ["People Ops", "HRIS Administration", "Payroll Compliance"],
    certs: ["SHRM-CP"],
    about: "Runs HR operations end to end, from onboarding to payroll sign-off.",
    loves: "Watching a new hire's first week go smoothly.",
    interests: "Trail running, pottery",
  },
  {
    id: "02",
    first: "Rohan",
    last: "Mehta",
    role: "hr",
    department: "Human Resources",
    title: "HR Officer",
    join: [2021, 3, 10],
    serial: 1,
    password: "Hr@12345",
    manager: "Ananya Verma",
    location: "Bengaluru, IN",
    phone: "+91 98450 11202",
    gender: "Male",
    marital: "Single",
    dob: [1992, 8, 3],
    skills: ["Recruiting", "Employee Relations", "Attendance Audits"],
    certs: [],
    about: "Handles day-to-day HR requests, attendance reviews, and leave approvals.",
    loves: "Closing out a clean attendance cycle.",
    interests: "Cricket, cooking",
  },
  {
    id: "03",
    first: "Priya",
    last: "Sharma",
    role: "employee",
    department: "Design",
    title: "UI/UX Designer",
    join: [2022, 6, 1],
    serial: 1,
    password: "Employee@123",
    manager: "Divya Menon",
    location: "Bengaluru, IN",
    phone: "+91 98450 11203",
    gender: "Female",
    marital: "Single",
    dob: [1996, 2, 27],
    skills: ["Figma", "Design Systems", "Prototyping"],
    certs: ["Google UX Design"],
    about: "Designs the customer-facing product surface, end to end.",
    loves: "Turning a messy flow into something obvious.",
    interests: "Ceramics, hiking",
  },
  {
    id: "04",
    first: "Karan",
    last: "Singh",
    role: "employee",
    department: "Engineering",
    title: "Frontend Engineer",
    join: [2022, 7, 18],
    serial: 2,
    password: "Employee@123",
    manager: "Meera Iyer",
    location: "Pune, IN",
    phone: "+91 98450 11204",
    gender: "Male",
    marital: "Single",
    dob: [1997, 11, 9],
    skills: ["React", "TypeScript", "Accessibility"],
    certs: [],
    about: "Builds and maintains the internal dashboard suite.",
    loves: "Shipping something users notice on day one.",
    interests: "Chess, badminton",
  },
  {
    id: "05",
    first: "Meera",
    last: "Iyer",
    role: "employee",
    department: "Engineering",
    title: "Engineering Lead",
    join: [2021, 11, 2],
    serial: 2,
    password: "Employee@123",
    manager: "Ananya Verma",
    location: "Pune, IN",
    phone: "+91 98450 11205",
    gender: "Female",
    marital: "Married",
    dob: [1991, 6, 30],
    skills: ["Node.js", "System Design", "Mentoring"],
    certs: ["AWS Solutions Architect"],
    about: "Leads the engineering pod and owns technical roadmap decisions.",
    loves: "Watching a junior engineer level up fast.",
    interests: "Reading, home coffee brewing",
  },
  {
    id: "06",
    first: "Aditya",
    last: "Rao",
    role: "employee",
    department: "Sales",
    title: "Sales Executive",
    join: [2023, 2, 20],
    serial: 1,
    password: "Employee@123",
    manager: "Rahul Chawla",
    location: "Mumbai, IN",
    phone: "+91 98450 11206",
    gender: "Male",
    marital: "Single",
    dob: [1998, 3, 14],
    skills: ["Cold Outreach", "CRM", "Negotiation"],
    certs: [],
    about: "Owns new-business outreach for the west region.",
    loves: "The call where a 'no' turns into a 'let's talk'.",
    interests: "Football, travel",
  },
  {
    id: "07",
    first: "Sneha",
    last: "Kapoor",
    role: "employee",
    department: "Marketing",
    title: "Marketing Specialist",
    join: [2022, 9, 5],
    serial: 3,
    password: "Employee@123",
    manager: "Ananya Verma",
    location: "Delhi, IN",
    phone: "+91 98450 11207",
    gender: "Female",
    marital: "Single",
    dob: [1995, 9, 22],
    skills: ["Content Strategy", "SEO", "Analytics"],
    certs: ["HubSpot Content Marketing"],
    about: "Plans and runs campaigns across owned and paid channels.",
    loves: "A launch week that actually goes to plan.",
    interests: "Photography, journaling",
  },
  {
    id: "08",
    first: "Vikram",
    last: "Nair",
    role: "employee",
    department: "Finance",
    title: "Accountant",
    join: [2020, 8, 12],
    serial: 2,
    password: "Employee@123",
    manager: "Ananya Verma",
    location: "Bengaluru, IN",
    phone: "+91 98450 11208",
    gender: "Male",
    marital: "Married",
    dob: [1989, 12, 5],
    skills: ["Bookkeeping", "GST Filing", "Payroll Reconciliation"],
    certs: ["ACCA (in progress)"],
    about: "Keeps the books straight and payroll accurate every cycle.",
    loves: "A reconciliation that balances on the first try.",
    interests: "Carnatic music, cycling",
  },
  {
    id: "09",
    first: "Isha",
    last: "Gupta",
    role: "employee",
    department: "Support",
    title: "Support Lead",
    join: [2021, 5, 24],
    serial: 3,
    password: "Employee@123",
    manager: "Ananya Verma",
    location: "Hyderabad, IN",
    phone: "+91 98450 11209",
    gender: "Female",
    marital: "Married",
    dob: [1993, 7, 17],
    skills: ["Zendesk", "Escalation Handling", "Documentation"],
    certs: [],
    about: "Runs the frontline support queue and escalation process.",
    loves: "Turning an angry ticket into a five-star one.",
    interests: "Baking, board games",
  },
  {
    id: "10",
    first: "Arjun",
    last: "Malhotra",
    role: "employee",
    department: "Engineering",
    title: "DevOps Engineer",
    join: [2023, 4, 11],
    serial: 2,
    password: "Employee@123",
    manager: "Meera Iyer",
    location: "Pune, IN",
    phone: "+91 98450 11210",
    gender: "Male",
    marital: "Single",
    dob: [1999, 1, 19],
    skills: ["CI/CD", "Kubernetes", "Observability"],
    certs: ["CKA"],
    about: "Keeps deploys boring and infrastructure predictable.",
    loves: "A green pipeline at 6pm on a Friday.",
    interests: "Running, sci-fi novels",
  },
  {
    id: "11",
    first: "Divya",
    last: "Menon",
    role: "employee",
    department: "Design",
    title: "Design Manager",
    join: [2022, 1, 9],
    serial: 4,
    password: "Employee@123",
    manager: "Ananya Verma",
    location: "Bengaluru, IN",
    phone: "+91 98450 11211",
    gender: "Female",
    marital: "Single",
    dob: [1990, 10, 2],
    skills: ["Design Leadership", "Design Systems", "Research"],
    certs: [],
    about: "Leads the product design team and owns the design system.",
    loves: "A design crit that changes the outcome for the better.",
    interests: "Pottery, film photography",
  },
  {
    id: "12",
    first: "Rahul",
    last: "Chawla",
    role: "employee",
    department: "Sales",
    title: "Sales Manager",
    join: [2021, 10, 3],
    serial: 4,
    password: "Employee@123",
    manager: "Ananya Verma",
    location: "Mumbai, IN",
    phone: "+91 98450 11212",
    gender: "Male",
    marital: "Married",
    dob: [1988, 5, 26],
    skills: ["Pipeline Management", "Forecasting", "Coaching"],
    certs: [],
    about: "Owns the west-region sales pipeline and quota planning.",
    loves: "Hitting a quarterly number as a team.",
    interests: "Golf, cricket",
  },
  {
    id: "13",
    first: "Neha",
    last: "Joshi",
    role: "employee",
    department: "Human Resources",
    title: "HR Executive",
    join: [2023, 6, 15],
    serial: 3,
    password: "Employee@123",
    manager: "Rohan Mehta",
    location: "Bengaluru, IN",
    phone: "+91 98450 11213",
    gender: "Female",
    marital: "Single",
    dob: [1999, 4, 8],
    skills: ["Onboarding", "HR Documentation", "Employee Engagement"],
    certs: [],
    about: "Runs onboarding logistics and employee documentation.",
    loves: "A new hire's paperwork closed out before day one.",
    interests: "Dance, gardening",
  },
]

export const people: PersonSeed[] = raw.map((r) => {
  const profileId = `profile-${r.id}`
  const employeeId = `emp-${r.id}`
  const joiningDate = iso(...r.join)
  const employeeCode = `OI${r.first
    .slice(0, 2)
    .toUpperCase()}${r.last.slice(0, 2).toUpperCase()}${r.join[0]}${String(
    r.serial
  ).padStart(4, "0")}`

  const profile = makeProfile(
    profileId,
    `${r.first.toLowerCase()}.${r.last.toLowerCase()}@dayflow.io`,
    r.role,
    `${r.first} ${r.last}`
  )

  const employee: Employee = {
    id: employeeId,
    profile_id: profileId,
    employee_code: employeeCode,
    full_name: `${r.first} ${r.last}`,
    phone: r.phone,
    address: `${r.location.split(",")[0]}, India`,
    department: r.department,
    job_title: r.title,
    joining_date: joiningDate,
    employment_status: "active",
    profile_picture_url: null,
    created_at: joiningDate,
    updated_at: joiningDate,
  }

  const detail: EmployeeProfileDetail = {
    employee_id: employeeId,
    manager_name: r.manager,
    company_name: COMPANY,
    location: r.location,
    about: r.about,
    loves_about_job: r.loves,
    interests: r.interests,
    skills: r.skills,
    certifications: r.certs,
    date_of_birth: iso(...r.dob),
    personal_email: `${r.first.toLowerCase()}.${r.last.toLowerCase()}.personal@gmail.com`,
    gender: r.gender,
    marital_status: r.marital,
    nationality: "Indian",
    bank_account_number: `XXXXXXXX${1000 + Number(r.id)}`,
    bank_name: "HDFC Bank",
    ifsc_code: "HDFC0001234",
    pan_no: `ABCDE${1000 + Number(r.id)}F`,
    uan_no: `10020030${r.id}0`,
  }

  return { profile, employee, detail, password: r.password }
})

export const findPersonByLoginId = (loginId: string) =>
  people.find(
    (p) => p.employee.employee_code.toLowerCase() === loginId.trim().toLowerCase()
  )

export const findPersonByEmail = (email: string) =>
  people.find((p) => p.profile.email.toLowerCase() === email.trim().toLowerCase())
