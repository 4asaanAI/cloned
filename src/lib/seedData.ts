import { supabase } from './supabase';

export async function seedDatabaseWithDummyData() {
  try {
    // Insert departments
    const departments = [
      {
        id: 'd1111111-1111-1111-1111-111111111111',
        name: 'Computer Technologies',
        code: 'CSE',
        tuition_fee: 5000,
        description: 'Department of Computer Science and Engineering'
      },
      {
        id: 'd2222222-2222-2222-2222-222222222222',
        name: 'Accounting Technologies',
        code: 'ACC',
        tuition_fee: 3000,
        description: 'Department of Accounting and Finance'
      },
      {
        id: 'd3333333-3333-3333-3333-333333333333',
        name: 'Electrical Engineering',
        code: 'ELE',
        tuition_fee: 4500,
        description: 'Department of Electrical Engineering'
      },
      {
        id: 'd4444444-4444-4444-4444-444444444444',
        name: 'Chemical Engineering',
        code: 'CHE',
        tuition_fee: 3500,
        description: 'Department of Chemical Engineering'
      }
    ];

    const { error: deptError } = await supabase
      .from('departments')
      .upsert(departments, { onConflict: 'code' });

    if (deptError) console.error('Department seeding error:', deptError);

    // Insert permissions
    const permissions = [
      { name: 'view_users', description: 'View all users', resource: 'users', action: 'view' },
      { name: 'create_users', description: 'Create new users', resource: 'users', action: 'create' },
      { name: 'edit_users', description: 'Edit existing users', resource: 'users', action: 'edit' },
      { name: 'delete_users', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'view_courses', description: 'View all courses', resource: 'courses', action: 'view' },
      { name: 'create_courses', description: 'Create new courses', resource: 'courses', action: 'create' },
      { name: 'edit_courses', description: 'Edit existing courses', resource: 'courses', action: 'edit' },
      { name: 'delete_courses', description: 'Delete courses', resource: 'courses', action: 'delete' },
      { name: 'view_enrollments', description: 'View enrollments', resource: 'enrollments', action: 'view' },
      { name: 'approve_enrollments', description: 'Approve enrollments', resource: 'enrollments', action: 'approve' },
      { name: 'manage_enrollments', description: 'Manage all enrollments', resource: 'enrollments', action: 'manage' },
      { name: 'view_departments', description: 'View departments', resource: 'departments', action: 'view' },
      { name: 'manage_departments', description: 'Manage departments', resource: 'departments', action: 'manage' },
      { name: 'view_reports', description: 'View system reports', resource: 'reports', action: 'view' },
      { name: 'post_announcements', description: 'Post announcements', resource: 'announcements', action: 'create' }
    ];

    const { error: permError } = await supabase
      .from('permissions')
      .upsert(permissions, { onConflict: 'name' });

    if (permError) console.error('Permission seeding error:', permError);

    console.log('Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('Seeding error:', error);
    return false;
  }
}

// Dummy data for displaying in dashboards (not stored in DB yet)
export const dummyAnalytics = {
  totalVisits: 1500,
  pageViews: 3000,
  uniqueVisitors: 5000,
  universityEarnings: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    cse: [4000, 4200, 3800, 5000, 4800, 5200, 5400, 5600],
    accounting: [2000, 2100, 2300, 2500, 2400, 2600, 2700, 2800],
    electrical: [3000, 3200, 3100, 3300, 3500, 3600, 3800, 4000]
  },
  departmentProgress: [
    { department: 'Computer Technologies', progress: 20, color: 'bg-blue-500' },
    { department: 'Accounting Technologies', progress: 30, color: 'bg-purple-500' },
    { department: 'Electrical Engineering', progress: 60, color: 'bg-green-500' },
    { department: 'Chemical Engineering', progress: 80, color: 'bg-red-500' }
  ]
};

// Hardcoded library data
export const dummyLibraryData = [
  {
    id: 1,
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    dueDate: '2025-11-15',
    status: 'borrowed'
  },
  {
    id: 2,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    dueDate: '2025-11-20',
    status: 'borrowed'
  }
];

// Hardcoded attendance data
export const dummyAttendanceData = {
  overall: 85,
  byCourse: [
    { courseName: 'Data Structures', attendance: 90 },
    { courseName: 'Database Systems', attendance: 82 },
    { courseName: 'Web Development', attendance: 88 },
    { courseName: 'Operating Systems', attendance: 80 }
  ]
};

// Hardcoded grades data
export const dummyGradesData = {
  gpa: 3.5,
  courses: [
    { courseName: 'Data Structures', grade: 'A', score: 92 },
    { courseName: 'Database Systems', grade: 'B+', score: 85 },
    { courseName: 'Web Development', grade: 'A-', score: 88 },
    { courseName: 'Operating Systems', grade: 'B', score: 82 }
  ],
  distribution: {
    A: 25,
    B: 35,
    C: 20,
    D: 10,
    F: 10
  }
};
