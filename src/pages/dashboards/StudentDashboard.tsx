import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { BookOpen, Calendar, BarChart3, Library, DollarSign, AlertCircle } from 'lucide-react';
import { dummyGradesData, dummyAttendanceData, dummyLibraryData } from '../../lib/seedData';

export function StudentDashboard() {
  const enrolledCourses = [
    { id: 1, name: 'Data Structures', code: 'CS201', professor: 'Dr. Smith', progress: 65 },
    { id: 2, name: 'Database Systems', code: 'CS301', professor: 'Dr. Johnson', progress: 78 },
    { id: 3, name: 'Web Development', code: 'CS302', professor: 'Dr. Williams', progress: 82 },
    { id: 4, name: 'Operating Systems', code: 'CS303', professor: 'Dr. Brown', progress: 55 }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Track your academic progress and upcoming deadlines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current GPA</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{dummyGradesData.gpa}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{enrolledCourses.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{dummyAttendanceData.overall}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tuition Due</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">$5,000</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">My Courses</h2>
            <div className="space-y-4">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500">{course.code} - {course.professor}</p>
                    </div>
                    <span className="text-sm font-medium text-blue-600">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Grades (Hardcoded)</h2>
            <div className="space-y-3">
              {dummyGradesData.courses.map((course, index) => (
                <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{course.courseName}</p>
                    <p className="text-sm text-gray-500">Score: {course.score}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-bold rounded ${
                    course.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                    course.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.grade}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Feature coming soon - View detailed grades</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Library Books (Hardcoded)</h2>
              <Library className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {dummyLibraryData.map((book) => (
                <div key={book.id} className="flex justify-between items-start p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{book.title}</p>
                    <p className="text-sm text-gray-500">{book.author}</p>
                    <p className="text-xs text-gray-400 mt-1">Due: {book.dueDate}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Borrowed
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              View Library (Coming Soon)
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Attendance by Course (Hardcoded)</h2>
            <div className="space-y-3">
              {dummyAttendanceData.byCourse.map((course, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{course.courseName}</span>
                    <span className="text-sm font-bold text-gray-900">{course.attendance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        course.attendance >= 90 ? 'bg-green-500' :
                        course.attendance >= 75 ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${course.attendance}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Feature coming soon - View detailed attendance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Assignments</h2>
            <div className="space-y-3">
              {[
                { title: 'Data Structures - Assignment 3', due: '2025-11-08', status: 'pending' },
                { title: 'Database Systems - Project Proposal', due: '2025-11-10', status: 'pending' },
                { title: 'Web Development - Final Project', due: '2025-11-15', status: 'in_progress' }
              ].map((assignment, index) => (
                <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{assignment.title}</p>
                    <p className="text-sm text-gray-500">Due: {assignment.due}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {assignment.status === 'pending' ? 'Pending' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tuition Payment</h2>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900">Outstanding Balance</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">$5,000</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tuition Fee</span>
                  <span className="font-medium text-gray-900">$5,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount</span>
                  <span className="font-medium text-green-600">$0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due Date</span>
                  <span className="font-medium text-gray-900">Dec 15, 2025</span>
                </div>
              </div>
              <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                Make Payment
              </button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Note</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Library, Attendance, and Grades features are currently under development and showing dummy data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
