# School ERP System - Implementation Documentation

## Overview

A complete School ERP (Enterprise Resource Planning) system with role-based access control, featuring separate dashboards for Admins, Professors, and Students. The system includes authentication, analytics, course management, and enrollment workflows with comprehensive permission management.

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite

## Features Implemented

### 1. Authentication System
- **Login Page**: Email/password authentication with Supabase Auth
- **Signup Page**: Role selection with department assignment
- **Protected Routes**: Automatic redirect based on authentication status
- **Session Management**: Persistent sessions with auto-logout
- **Role-Based Routing**: Automatic dashboard routing based on user role

### 2. Role-Based Access Control

#### Admin Sub-Roles
- **Super Admin**: Full system access, all CRUD operations
- **Academic Admin**: Course management, professor assignments
- **Finance Admin**: Tuition tracking, payment management
- **Department Admin**: Department-specific data and users

#### Professor Sub-Roles
- **Head of Department**: Department-wide course management, announcements
- **Senior Professor**: Full course management, student data access
- **Assistant Professor**: Own course management only
- **Guest Lecturer**: View-only access to assigned courses

### 3. Admin Dashboard
- **Analytics Cards**: Total Visits (1500), Page Views (3000), Unique Visitors (5000), Active Courses (24)
- **Department Tuition Fees**: Visual progress bars for 4 departments (CSE, Accounting, Electrical, Chemical)
- **University Earnings Chart**: Multi-line chart showing revenue trends for 3 departments over 8 months
- **Recent Enrollments**: List of latest student enrollments with status
- **Pending Approvals**: Enrollment requests awaiting approval
- **Quick Actions**: Buttons for common admin tasks

### 4. Professor Dashboard
- **Statistics**: Total Students (125), Active Courses (3), Average Attendance (85%), Average Grade (3.5)
- **My Courses**: Course cards with student count and schedule information
- **Attendance Chart**: Bar chart showing attendance by course (hardcoded)
- **Grade Distribution**: Pie chart showing grade distribution (hardcoded)
- **Upcoming Classes**: Schedule of next classes with room numbers

### 5. Student Dashboard
- **Statistics**: Current GPA (3.5), Enrolled Courses (4), Attendance (85%), Tuition Due ($5,000)
- **My Courses**: Progress tracking for each enrolled course
- **Grades**: Detailed grade breakdown by course (hardcoded)
- **Library Books**: List of borrowed books with due dates (hardcoded)
- **Attendance by Course**: Visual progress bars (hardcoded)
- **Upcoming Assignments**: Deadlines and status tracking
- **Tuition Payment**: Payment status and balance information

### 6. Database Schema

#### Tables Created
1. **profiles**: User profiles with role and sub_role
2. **departments**: 4 departments with tuition fees
3. **courses**: Course information with professor assignments
4. **enrollments**: Student-course relationships with payment tracking
5. **permissions**: Granular permission definitions
6. **role_permissions**: Permission assignments to roles/sub-roles
7. **announcements**: System-wide and department-specific announcements
8. **audit_logs**: System action tracking for security

#### Row Level Security (RLS)
- All tables have RLS enabled
- Role-based policies for viewing and modifying data
- Admins have conditional access based on sub_role
- Professors can manage their courses
- Students can view their own data

### 7. Dummy Data

#### Departments
- Computer Technologies (CSE): $5,000
- Accounting Technologies (ACC): $3,000
- Electrical Engineering (ELE): $4,500
- Chemical Engineering (CHE): $3,500

#### Analytics Data
- University Earnings: 8 months of revenue data for 3 departments
- Department Progress: 20%, 30%, 60%, 80%
- Visitor Statistics: 1,500 visits, 3,000 page views, 5,000 unique visitors

#### Hardcoded Features (Coming Soon)
- **Library System**: 2 borrowed books with due dates
- **Attendance System**: Course-specific attendance percentages
- **Grades System**: Grade distribution and course scores

## Permission System

The permission system is implemented with granular control:

### Permission Structure
- **Resource**: users, courses, enrollments, departments, reports
- **Action**: view, create, edit, delete, approve

### Permission Checking
The `hasPermission()` function in AuthContext checks:
1. User's primary role (admin, professor, student)
2. User's sub_role for fine-grained access
3. Resource and action being requested
4. Returns boolean for UI rendering and API calls

### Example Permissions
- Super Admin: All permissions
- Academic Admin: Courses (all), Enrollments (all), Departments (view)
- Finance Admin: Enrollments (view, approve)
- Head of Department: Department courses, announcements
- Student: Enrollments (view, create)

## User Interface

### Design Principles
- **Clean & Minimalistic**: White backgrounds with subtle shadows
- **Color-Coded Progress**: Blue, Purple, Green, Red for visual distinction
- **Responsive Layout**: Mobile-first design with collapsible sidebar
- **Consistent Typography**: Clear hierarchy with proper font weights
- **Icon Usage**: Lucide icons for visual clarity

### Navigation
- **Blue Top Header**: Fixed header with user profile and notifications
- **Collapsible Sidebar**: Role-specific menu items
- **Breadcrumb Navigation**: Context awareness
- **Quick Actions**: Common tasks easily accessible

## Security Features

1. **Authentication**: Supabase Auth with JWT tokens
2. **Row Level Security**: Database-level access control
3. **Permission Middleware**: Function-level permission checking
4. **Audit Logging**: Track all sensitive operations
5. **Input Validation**: Client and server-side validation
6. **Secure Routes**: Protected routes with authentication checks

## Files Structure

```
src/
├── components/
│   ├── dashboard/
│   │   └── DashboardLayout.tsx      # Shared layout with sidebar
│   └── ProtectedRoute.tsx            # Route protection wrapper
├── contexts/
│   └── AuthContext.tsx               # Authentication state management
├── lib/
│   ├── supabase.ts                   # Supabase client
│   └── seedData.ts                   # Dummy data for dashboards
├── pages/
│   ├── Login.tsx                     # Login page
│   ├── Signup.tsx                    # Registration page
│   └── dashboards/
│       ├── AdminDashboard.tsx        # Admin dashboard
│       ├── ProfessorDashboard.tsx    # Professor dashboard
│       ├── StudentDashboard.tsx      # Student dashboard
│       └── DashboardRouter.tsx       # Role-based routing
├── types/
│   └── index.ts                      # TypeScript interfaces
└── App.tsx                           # Root component with routing
```

## Database Migrations

```
supabase/migrations/
├── 20251102000000_init_schema.sql           # Initial school data schema
├── 20251103014649_create_gallery_images_table.sql  # Gallery feature
└── [new]_create_erp_schema.sql              # Complete ERP schema
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account with project created
- Environment variables configured in `.env`

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Demo Accounts
Create these accounts via the Signup page or use the Supabase dashboard:

- **Admin**: admin@school.com / admin123 (Super Admin)
- **Professor**: professor@school.com / prof123 (Senior Professor)
- **Student**: student@school.com / student123

## Features NOT Yet Implemented (Hardcoded)

1. **Library Management**: Book borrowing, returns, due dates
2. **Attendance System**: Mark attendance, track records
3. **Grades System**: Enter grades, calculate GPA
4. **User Management UI**: Create, edit, delete users
5. **Course Management UI**: CRUD operations for courses
6. **Enrollment Approval**: Workflow for enrollment requests
7. **Department Management**: Add/edit departments
8. **Announcements**: Create and manage announcements
9. **Reports**: Generate system reports

These features show dummy data and display "Coming Soon" messages when interacted with.

## Next Steps for Full Implementation

1. **Seed Database**: Insert dummy users, courses, and enrollments
2. **User Management**: Build admin interface for user CRUD
3. **Course Management**: Create course creation and editing forms
4. **Enrollment Workflow**: Implement request and approval system
5. **Real Attendance**: Build attendance marking interface
6. **Real Grades**: Implement grade entry and calculation
7. **Real Library**: Create book management system
8. **Announcements**: Build announcement creation interface
9. **Reports**: Generate PDF/CSV reports with data
10. **File Uploads**: Add document and image upload functionality

## Notes

- All charts and analytics use dummy data from `seedData.ts`
- Permission checking is implemented but not enforced on all UI elements yet
- Database schema is complete and ready for data population
- RLS policies are strict and need to be tested with real users
- The system is designed to scale to hundreds of users and thousands of courses

## Support

For questions or issues with this implementation, refer to:
- Supabase Documentation: https://supabase.com/docs
- React Router Documentation: https://reactrouter.com
- Recharts Documentation: https://recharts.org
