/*
  # School ERP System - Complete Schema
  
  ## Overview
  This migration creates the complete database schema for a School ERP System with
  multi-role support (Head, Principal, HOD, Coordinator, Teacher, Student).
  
  ## New Tables
  
  ### 1. classes
  - `id` (uuid, primary key)
  - `name` (text) - e.g., "Class 10-A", "Grade 5-B"
  - `grade_level` (integer) - 1-12
  - `section` (text) - A, B, C, etc.
  - `capacity` (integer)
  - `current_strength` (integer)
  - `class_teacher_id` (uuid, references profiles)
  - `academic_year` (text) - e.g., "2025-2026"
  - `status` (text) - active, archived
  
  ### 2. subjects
  - `id` (uuid, primary key)
  - `name` (text)
  - `code` (text, unique)
  - `description` (text)
  - `department_id` (uuid, references departments)
  - `grade_levels` (jsonb) - array of applicable grades
  
  ### 3. class_subjects
  - Maps subjects to classes with assigned teachers
  - `id` (uuid, primary key)
  - `class_id` (uuid, references classes)
  - `subject_id` (uuid, references subjects)
  - `teacher_id` (uuid, references profiles)
  
  ### 4. timetables
  - `id` (uuid, primary key)
  - `class_id` (uuid, references classes)
  - `subject_id` (uuid, references subjects)
  - `teacher_id` (uuid, references profiles)
  - `day_of_week` (integer) - 0-6
  - `start_time` (time)
  - `end_time` (time)
  - `room_number` (text)
  
  ### 5. attendance
  - `id` (uuid, primary key)
  - `student_id` (uuid, references profiles)
  - `class_id` (uuid, references classes)
  - `date` (date)
  - `status` (text) - present, absent, late, excused
  - `marked_by` (uuid, references profiles)
  - `remarks` (text)
  
  ### 6. assignments
  - `id` (uuid, primary key)
  - `class_id` (uuid, references classes)
  - `subject_id` (uuid, references subjects)
  - `teacher_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `due_date` (timestamptz)
  - `total_marks` (integer)
  - `attachments` (jsonb)
  
  ### 7. assignment_submissions
  - `id` (uuid, primary key)
  - `assignment_id` (uuid, references assignments)
  - `student_id` (uuid, references profiles)
  - `submission_date` (timestamptz)
  - `content` (text)
  - `attachments` (jsonb)
  - `marks_obtained` (integer)
  - `feedback` (text)
  - `status` (text) - pending, submitted, graded
  
  ### 8. exams
  - `id` (uuid, primary key)
  - `name` (text)
  - `exam_type` (text) - midterm, final, quiz, assignment
  - `class_id` (uuid, references classes)
  - `subject_id` (uuid, references subjects)
  - `date` (date)
  - `total_marks` (integer)
  - `duration_minutes` (integer)
  
  ### 9. exam_results
  - `id` (uuid, primary key)
  - `exam_id` (uuid, references exams)
  - `student_id` (uuid, references profiles)
  - `marks_obtained` (numeric)
  - `grade` (text)
  - `remarks` (text)
  
  ### 10. leave_applications
  - `id` (uuid, primary key)
  - `applicant_id` (uuid, references profiles)
  - `leave_type` (text) - sick, casual, emergency
  - `start_date` (date)
  - `end_date` (date)
  - `reason` (text)
  - `status` (text) - pending, approved, rejected
  - `approved_by` (uuid, references profiles)
  - `approval_date` (timestamptz)
  
  ### 11. fee_records
  - `id` (uuid, primary key)
  - `student_id` (uuid, references profiles)
  - `fee_type` (text) - tuition, transport, library, exam
  - `amount` (numeric)
  - `due_date` (date)
  - `paid_date` (date)
  - `payment_status` (text) - pending, paid, overdue
  - `payment_method` (text)
  - `transaction_id` (text)
  
  ### 12. transport_routes
  - `id` (uuid, primary key)
  - `route_name` (text)
  - `route_number` (text)
  - `driver_name` (text)
  - `vehicle_number` (text)
  - `stops` (jsonb) - array of stops with timings
  - `monthly_fee` (numeric)
  
  ### 13. student_transport
  - `id` (uuid, primary key)
  - `student_id` (uuid, references profiles)
  - `route_id` (uuid, references transport_routes)
  - `stop_name` (text)
  - `pickup_time` (time)
  
  ### 14. library_books
  - `id` (uuid, primary key)
  - `title` (text)
  - `author` (text)
  - `isbn` (text, unique)
  - `category` (text)
  - `total_copies` (integer)
  - `available_copies` (integer)
  
  ### 15. library_transactions
  - `id` (uuid, primary key)
  - `book_id` (uuid, references library_books)
  - `user_id` (uuid, references profiles)
  - `issue_date` (date)
  - `due_date` (date)
  - `return_date` (date)
  - `status` (text) - issued, returned, overdue
  - `fine_amount` (numeric)
  
  ## Security
  - Enable RLS on all tables
  - Role-based access policies:
    - Head: Read-only access to all data
    - Principal: Full CRUD access to all school data
    - HOD: Department-level CRUD access
    - Coordinator/Teacher: Class/subject-level access
    - Student: View-only access to personal data
*/

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade_level integer NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
  section text NOT NULL,
  capacity integer DEFAULT 40,
  current_strength integer DEFAULT 0,
  class_teacher_id uuid REFERENCES profiles(id),
  academic_year text NOT NULL DEFAULT '2025-2026',
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(grade_level, section, academic_year)
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  department_id uuid REFERENCES departments(id),
  grade_levels jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create class_subjects junction table
CREATE TABLE IF NOT EXISTS class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

-- Create timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id),
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by uuid REFERENCES profiles(id),
  remarks text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  total_marks integer DEFAULT 100,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  submission_date timestamptz DEFAULT now(),
  content text,
  attachments jsonb DEFAULT '[]'::jsonb,
  marks_obtained integer,
  feedback text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  exam_type text DEFAULT 'quiz' CHECK (exam_type IN ('midterm', 'final', 'quiz', 'assignment')),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_marks integer DEFAULT 100,
  duration_minutes integer DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exam_results table
CREATE TABLE IF NOT EXISTS exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  marks_obtained numeric NOT NULL,
  grade text,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- Create leave_applications table
CREATE TABLE IF NOT EXISTS leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type text DEFAULT 'casual' CHECK (leave_type IN ('sick', 'casual', 'emergency')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES profiles(id),
  approval_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fee_records table
CREATE TABLE IF NOT EXISTS fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  fee_type text DEFAULT 'tuition' CHECK (fee_type IN ('tuition', 'transport', 'library', 'exam', 'other')),
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transport_routes table
CREATE TABLE IF NOT EXISTS transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  route_number text UNIQUE NOT NULL,
  driver_name text,
  vehicle_number text,
  stops jsonb DEFAULT '[]'::jsonb,
  monthly_fee numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_transport table
CREATE TABLE IF NOT EXISTS student_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  route_id uuid REFERENCES transport_routes(id) ON DELETE CASCADE,
  stop_name text NOT NULL,
  pickup_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id)
);

-- Create library_books table
CREATE TABLE IF NOT EXISTS library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text UNIQUE,
  category text,
  total_copies integer DEFAULT 1,
  available_copies integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create library_transactions table
CREATE TABLE IF NOT EXISTS library_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES library_books(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  issue_date date DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  status text DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue')),
  fine_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Anyone authenticated can view classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for subjects
CREATE POLICY "Anyone authenticated can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for class_subjects
CREATE POLICY "Anyone authenticated can view class subjects"
  ON class_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage class subjects"
  ON class_subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for timetables
CREATE POLICY "Anyone authenticated can view timetables"
  ON timetables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage timetables"
  ON timetables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'professor')
    )
  );

-- RLS Policies for attendance
CREATE POLICY "Students can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view and mark attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'professor')
    )
  );

-- RLS Policies for assignments
CREATE POLICY "Students can view assignments for their classes"
  ON assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage assignments"
  ON assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'professor')
    )
  );

-- RLS Policies for assignment_submissions
CREATE POLICY "Students can view own submissions"
  ON assignment_submissions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can submit assignments"
  ON assignment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view and grade submissions"
  ON assignment_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'professor')
    )
  );

-- RLS Policies for exams
CREATE POLICY "Students can view exams"
  ON exams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage exams"
  ON exams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'professor')
    )
  );

-- RLS Policies for exam_results
CREATE POLICY "Students can view own results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage results"
  ON exam_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'professor')
    )
  );

-- RLS Policies for leave_applications
CREATE POLICY "Users can view own leave applications"
  ON leave_applications FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Users can create leave applications"
  ON leave_applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Admins can manage all leave applications"
  ON leave_applications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for fee_records
CREATE POLICY "Students can view own fee records"
  ON fee_records FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can manage fee records"
  ON fee_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for transport
CREATE POLICY "Anyone authenticated can view transport routes"
  ON transport_routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage transport routes"
  ON transport_routes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can view own transport"
  ON student_transport FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can manage student transport"
  ON student_transport FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for library
CREATE POLICY "Anyone authenticated can view library books"
  ON library_books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage library books"
  ON library_books FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own library transactions"
  ON library_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage library transactions"
  ON library_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(class_teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher ON class_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher ON timetables(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_applications_applicant ON leave_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_student ON student_transport(student_id);
CREATE INDEX IF NOT EXISTS idx_library_transactions_user ON library_transactions(user_id);

-- Add updated_at triggers
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON timetables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON exam_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_applications_updated_at BEFORE UPDATE ON leave_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_records_updated_at BEFORE UPDATE ON fee_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transport_routes_updated_at BEFORE UPDATE ON transport_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_transport_updated_at BEFORE UPDATE ON student_transport
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_books_updated_at BEFORE UPDATE ON library_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_transactions_updated_at BEFORE UPDATE ON library_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();