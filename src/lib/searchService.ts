import { supabase } from './supabase';

export interface DatabaseSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  category: string;
  table: string;
  metadata?: Record<string, any>;
}

export async function searchDatabase(query: string, userRole: string, userId: string): Promise<DatabaseSearchResult[]> {
  if (!query || query.length < 2) return [];

  const results: DatabaseSearchResult[] = [];
  const searchTerm = `%${query.toLowerCase()}%`;

  try {
    const searches = await Promise.allSettled([
      searchProfiles(searchTerm, userRole),
      searchClasses(searchTerm, userRole),
      searchSubjects(searchTerm, userRole),
      searchExams(searchTerm, userRole),
      searchAssignments(searchTerm, userRole),
      searchEvents(searchTerm, userRole),
      searchAnnouncements(searchTerm, userRole),
      searchCourses(searchTerm, userRole),
      searchDepartments(searchTerm, userRole),
      searchTransportRoutes(searchTerm, userRole),
      searchLeaveApplications(searchTerm, userRole, userId),
      searchSupportTickets(searchTerm, userRole, userId),
      searchLibraryBooks(searchTerm, userRole),
      searchFeeRecords(searchTerm, userRole, userId),
      searchInventoryItems(searchTerm, userRole),
    ]);

    searches.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...result.value);
      }
    });

    return results.slice(0, 50);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

async function searchProfiles(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, admission_no, employee_id')
    .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},admission_no.ilike.${searchTerm},employee_id.ilike.${searchTerm}`)
    .eq('approval_status', 'approved')
    .limit(10);

  if (!data) return [];

  return data.map(profile => ({
    id: profile.id,
    title: profile.full_name,
    subtitle: `${profile.email} • ${profile.role}`,
    path: '/dashboard/users',
    category: 'Users',
    table: 'profiles',
    metadata: { profileId: profile.id, role: profile.role }
  }));
}

async function searchClasses(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('classes')
    .select('id, name, grade_level, section, academic_year, current_strength, capacity')
    .or(`name.ilike.${searchTerm},section.ilike.${searchTerm},academic_year.ilike.${searchTerm}`)
    .eq('status', 'active')
    .limit(10);

  if (!data) return [];

  return data.map(cls => ({
    id: cls.id,
    title: cls.name,
    subtitle: `Grade ${cls.grade_level} • Section ${cls.section} • ${cls.current_strength}/${cls.capacity} students`,
    path: '/dashboard/classes',
    category: 'Classes',
    table: 'classes',
    metadata: { classId: cls.id }
  }));
}

async function searchSubjects(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('subjects')
    .select('id, name, code, description')
    .or(`name.ilike.${searchTerm},code.ilike.${searchTerm}`)
    .limit(10);

  if (!data) return [];

  return data.map(subject => ({
    id: subject.id,
    title: subject.name,
    subtitle: `Code: ${subject.code}`,
    path: '/dashboard/classes',
    category: 'Subjects',
    table: 'subjects',
    metadata: { subjectId: subject.id }
  }));
}

async function searchExams(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('exams')
    .select('id, name, exam_type, date, total_marks, classes(name), subjects(name)')
    .or(`name.ilike.${searchTerm},exam_type.ilike.${searchTerm}`)
    .order('date', { ascending: false })
    .limit(10);

  if (!data) return [];

  return data.map(exam => ({
    id: exam.id,
    title: exam.name,
    subtitle: `${exam.exam_type} • ${new Date(exam.date).toLocaleDateString()} • ${exam.total_marks} marks`,
    path: '/dashboard/exams',
    category: 'Exams',
    table: 'exams',
    metadata: { examId: exam.id }
  }));
}

async function searchAssignments(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('assignments')
    .select('id, title, due_date, total_marks, classes(name), subjects(name)')
    .ilike('title', searchTerm)
    .order('due_date', { ascending: false })
    .limit(10);

  if (!data) return [];

  return data.map(assignment => ({
    id: assignment.id,
    title: assignment.title,
    subtitle: `Due: ${new Date(assignment.due_date).toLocaleDateString()} • ${assignment.total_marks} marks`,
    path: '/dashboard/assignments',
    category: 'Assignments',
    table: 'assignments',
    metadata: { assignmentId: assignment.id }
  }));
}

async function searchEvents(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('events')
    .select('id, title, event_date, event_type, location')
    .or(`title.ilike.${searchTerm},event_type.ilike.${searchTerm},location.ilike.${searchTerm}`)
    .order('event_date', { ascending: false })
    .limit(10);

  if (!data) return [];

  return data.map(event => ({
    id: event.id,
    title: event.title,
    subtitle: `${event.event_type} • ${new Date(event.event_date).toLocaleDateString()} • ${event.location || 'TBA'}`,
    path: '/dashboard/events',
    category: 'Events',
    table: 'events',
    metadata: { eventId: event.id }
  }));
}

async function searchAnnouncements(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('announcements')
    .select('id, title, content, target_audience, priority, created_at')
    .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!data) return [];

  return data.map(announcement => ({
    id: announcement.id,
    title: announcement.title,
    subtitle: `${announcement.priority} priority • For ${announcement.target_audience}`,
    path: '/dashboard/announcements',
    category: 'Announcements',
    table: 'announcements',
    metadata: { announcementId: announcement.id }
  }));
}

async function searchCourses(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('courses')
    .select('id, name, code, credits, departments(name)')
    .or(`name.ilike.${searchTerm},code.ilike.${searchTerm}`)
    .eq('status', 'active')
    .limit(10);

  if (!data) return [];

  return data.map(course => ({
    id: course.id,
    title: course.name,
    subtitle: `Code: ${course.code} • ${course.credits} credits`,
    path: '/dashboard/classes',
    category: 'Courses',
    table: 'courses',
    metadata: { courseId: course.id }
  }));
}

async function searchDepartments(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('departments')
    .select('id, name, code, description')
    .or(`name.ilike.${searchTerm},code.ilike.${searchTerm}`)
    .limit(10);

  if (!data) return [];

  return data.map(dept => ({
    id: dept.id,
    title: dept.name,
    subtitle: `Code: ${dept.code}`,
    path: '/dashboard/users',
    category: 'Departments',
    table: 'departments',
    metadata: { departmentId: dept.id }
  }));
}

async function searchTransportRoutes(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('transport_routes')
    .select('id, route_name, route_number, vehicle_number, driver_name, monthly_fee')
    .or(`route_name.ilike.${searchTerm},route_number.ilike.${searchTerm},vehicle_number.ilike.${searchTerm},driver_name.ilike.${searchTerm}`)
    .eq('status', 'active')
    .limit(10);

  if (!data) return [];

  return data.map(route => ({
    id: route.id,
    title: route.route_name,
    subtitle: `Route ${route.route_number} • ${route.vehicle_number || 'No vehicle'} • ₹${route.monthly_fee}/month`,
    path: '/dashboard/transport',
    category: 'Transport',
    table: 'transport_routes',
    metadata: { routeId: route.id }
  }));
}

async function searchLeaveApplications(searchTerm: string, userRole: string, userId: string): Promise<DatabaseSearchResult[]> {
  let query = supabase
    .from('leave_applications')
    .select('id, leave_type, start_date, end_date, status, profiles!leave_applications_applicant_id_fkey(full_name)')
    .or(`leave_type.ilike.${searchTerm},reason.ilike.${searchTerm},status.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (userRole === 'student' || userRole === 'professor') {
    query = query.eq('applicant_id', userId);
  }

  const { data } = await query;

  if (!data) return [];

  return data.map(leave => ({
    id: leave.id,
    title: `${leave.leave_type} Leave`,
    subtitle: `${new Date(leave.start_date).toLocaleDateString()} to ${new Date(leave.end_date).toLocaleDateString()} • ${leave.status}`,
    path: '/dashboard/leaves',
    category: 'Leaves',
    table: 'leave_applications',
    metadata: { leaveId: leave.id }
  }));
}

async function searchSupportTickets(searchTerm: string, userRole: string, userId: string): Promise<DatabaseSearchResult[]> {
  let query = supabase
    .from('support_tickets')
    .select('id, title, issue_type, status, priority, created_at')
    .or(`title.ilike.${searchTerm},issue_type.ilike.${searchTerm},description.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (userRole === 'student' || userRole === 'professor') {
    query = query.eq('student_id', userId);
  }

  const { data } = await query;

  if (!data) return [];

  return data.map(ticket => ({
    id: ticket.id,
    title: ticket.title,
    subtitle: `${ticket.issue_type} • ${ticket.status} • ${ticket.priority} priority`,
    path: '/dashboard/support',
    category: 'Support',
    table: 'support_tickets',
    metadata: { ticketId: ticket.id }
  }));
}

async function searchLibraryBooks(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('library_books')
    .select('id, title, author, isbn, category, available_copies, total_copies')
    .or(`title.ilike.${searchTerm},author.ilike.${searchTerm},isbn.ilike.${searchTerm},category.ilike.${searchTerm}`)
    .limit(10);

  if (!data) return [];

  return data.map(book => ({
    id: book.id,
    title: book.title,
    subtitle: `by ${book.author} • ${book.available_copies}/${book.total_copies} available`,
    path: '/dashboard/library',
    category: 'Library',
    table: 'library_books',
    metadata: { bookId: book.id }
  }));
}

async function searchFeeRecords(searchTerm: string, userRole: string, userId: string): Promise<DatabaseSearchResult[]> {
  let query = supabase
    .from('fee_records')
    .select('id, fee_type, amount, due_date, payment_status, profiles!fee_records_student_id_fkey(full_name)')
    .or(`fee_type.ilike.${searchTerm},payment_status.ilike.${searchTerm}`)
    .order('due_date', { ascending: false })
    .limit(10);

  if (userRole === 'student') {
    query = query.eq('student_id', userId);
  }

  const { data } = await query;

  if (!data) return [];

  return data.map(fee => ({
    id: fee.id,
    title: `${fee.fee_type} Fee`,
    subtitle: `₹${fee.amount} • Due: ${new Date(fee.due_date).toLocaleDateString()} • ${fee.payment_status}`,
    path: '/dashboard/finance',
    category: 'Finance',
    table: 'fee_records',
    metadata: { feeId: fee.id }
  }));
}

async function searchInventoryItems(searchTerm: string, _userRole: string): Promise<DatabaseSearchResult[]> {
  const { data } = await supabase
    .from('inventory_items')
    .select('id, item_name, item_code, quantity, unit, status, location, inventory_categories(name)')
    .or(`item_name.ilike.${searchTerm},item_code.ilike.${searchTerm},location.ilike.${searchTerm}`)
    .limit(10);

  if (!data) return [];

  return data.map(item => ({
    id: item.id,
    title: item.item_name,
    subtitle: `Code: ${item.item_code} • ${item.quantity} ${item.unit} • ${item.status}`,
    path: '/dashboard/inventory',
    category: 'Inventory',
    table: 'inventory_items',
    metadata: { itemId: item.id }
  }));
}
