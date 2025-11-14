import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { BookOpen, Users, Calendar, FileText, CheckSquare } from 'lucide-react';

export function TeacherDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your assigned classes</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <p className="text-sm text-green-800 font-medium">Teacher Access</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Classes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">2</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">64</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">3</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 text-left text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center">
                <CheckSquare className="h-4 w-4 mr-3" />
                Mark Attendance
              </button>
              <button className="w-full px-4 py-3 text-left text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 flex items-center">
                <FileText className="h-4 w-4 mr-3" />
                Upload Grades
              </button>
              <button className="w-full px-4 py-3 text-left text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 flex items-center">
                <BookOpen className="h-4 w-4 mr-3" />
                Create Assignment
              </button>
              <button className="w-full px-4 py-3 text-left text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 flex items-center">
                <Calendar className="h-4 w-4 mr-3" />
                Submit Leave Application
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">My Classes Today</h2>
            <div className="space-y-3">
              {[
                { class: 'Class 10-A', subject: 'Mathematics', time: '9:00 - 10:00 AM', room: 'Room 201' },
                { class: 'Class 10-B', subject: 'Mathematics', time: '11:00 AM - 12:00 PM', room: 'Room 201' },
                { class: 'Class 9-A', subject: 'Mathematics', time: '2:00 - 3:00 PM', room: 'Room 305' }
              ].map((cls, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-900">{cls.class}</p>
                    <span className="text-xs text-gray-500">{cls.room}</span>
                  </div>
                  <p className="text-sm text-gray-600">{cls.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">{cls.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Student Performance Overview</h2>
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">View and manage student profiles</p>
            <p className="text-sm text-gray-500 mt-2">Track grades, attendance, and progress</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
