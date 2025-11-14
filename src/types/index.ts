export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'professor' | 'student';
  sub_role?: string | null;
  department_id?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  admission_no?: string | null;
  employee_id?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval' | string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at?: string;
  house?: 'green' | 'blue' | 'red' | 'yellow' | null;
  duties?: string[] | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  tuition_fee: number;
  description?: string;
  hod_id?: string;
  created_at: string;
  updated_at: string;
  hod?: Profile;
}

export interface Class {
  id: string;
  name: string;
  grade_level: number;
  section: string;
  capacity: number;
  current_strength: number;
  class_teacher_id?: string;
  academic_year: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  class_teacher?: Profile;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  department_id?: string;
  grade_levels: number[];
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  created_at: string;
  class?: Class;
  subject?: Subject;
  teacher?: Profile;
}

export interface Timetable {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number?: string;
  created_at: string;
  updated_at: string;
  class?: Class;
  subject?: Subject;
  teacher?: Profile;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by?: string;
  remarks?: string;
  created_at: string;
  student?: Profile;
  class?: Class;
  marker?: Profile;
}

export interface Assignment {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  title: string;
  description?: string;
  due_date: string;
  total_marks: number;
  attachments: any[];
  created_at: string;
  updated_at: string;
  class?: Class;
  subject?: Subject;
  teacher?: Profile;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_date: string;
  content?: string;
  attachments: any[];
  marks_obtained?: number;
  feedback?: string;
  status: 'pending' | 'submitted' | 'graded';
  created_at: string;
  updated_at: string;
  assignment?: Assignment;
  student?: Profile;
}

export interface Exam {
  id: string;
  name: string;
  exam_type: 'midterm' | 'final' | 'quiz' | 'assignment';
  class_id: string;
  subject_id: string;
  date: string;
  total_marks: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  class?: Class;
  subject?: Subject;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  grade?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  exam?: Exam;
  student?: Profile;
}

export interface LeaveApplication {
  id: string;
  applicant_id: string;
  leave_type: 'sick' | 'casual' | 'emergency';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
  applicant?: Profile;
  approver?: Profile;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  fee_type: 'tuition' | 'transport' | 'library' | 'exam' | 'other';
  amount: number;
  due_date: string;
  paid_date?: string;
  payment_status: 'pending' | 'paid' | 'overdue';
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
}

export interface TransportRoute {
  id: string;
  route_name: string;
  route_number: string;
  driver_name?: string;
  vehicle_number?: string;
  stops: any[];
  monthly_fee: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StudentTransport {
  id: string;
  student_id: string;
  route_id: string;
  stop_name: string;
  pickup_time?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
  route?: TransportRoute;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}

export interface LibraryTransaction {
  id: string;
  book_id: string;
  user_id: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: 'issued' | 'returned' | 'overdue';
  fine_amount: number;
  created_at: string;
  updated_at: string;
  book?: LibraryBook;
  user?: Profile;
}

export interface Course {
  id: string;
  department_id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  professor_id?: string;
  capacity: number;
  schedule: Record<string, any>;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  department?: Department;
  professor?: Profile;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'active' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid';
  payment_amount: number;
  enrolled_date?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
  course?: Course;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface RolePermission {
  id: string;
  role: string;
  sub_role?: string;
  permission_id: string;
  permission?: Permission;
}

export interface Announcement {
  id: string;
  author_id?: string;
  title: string;
  content: string;
  target_audience: 'all' | 'students' | 'professors' | 'department';
  department_id?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  author?: Profile;
  department?: Department;
}


export type AdminSubRole = 'head' | 'principal' | 'hod' | 'other';
export type TeacherSubRole = 'coordinator' | 'teacher';
export type StudentSubRole = 'student';

export type SubRole = AdminSubRole | TeacherSubRole | StudentSubRole | null;

export const adminSubRoles = [
  { value: 'head', label: 'Head', description: 'Global view, read-only access to all data' },
  { value: 'principal', label: 'Principal', description: 'Full CRUD access to entire school' },
  { value: 'hod', label: 'HOD (Head of Department)', description: 'Department-level management' },
  { value: 'other', label: 'Other', description: 'Custom administrative role' }
];

export const teacherSubRoles = [
  { value: 'coordinator', label: 'Coordinator', description: 'Class and subject-level management' },
  { value: 'teacher', label: 'Teacher', description: 'Assigned classes only' }
];

export const studentSubRoles = [
  { value: 'student', label: 'Student', description: 'View-only access to personal data' }
];

export interface TransferCertificate {
  id: string;
  student_id: string;
  issued_by: string;
  tc_number: string;
  issue_date: string;
  reason: string;
  conduct: string;
  character: string;
  remarks?: string | null;
  last_class_attended?: string | null;
  subjects_studied?: string | null;
  date_of_admission?: string | null;
  date_of_leaving?: string | null;
  created_at: string;
  updated_at: string;
  student?: Profile;
  issuer?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}
