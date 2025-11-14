import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { BookOpen, Users, FileText } from 'lucide-react';

export function HODDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HOD Dashboard</h1>
            <p className="text-sm text-gray-600">Department-level management</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-800 font-medium">Department Access</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Department Subjects</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Department Teachers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Department Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Department Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="px-4 py-3 text-left text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
              Manage Subjects
            </button>
            <button className="px-4 py-3 text-left text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100">
              Assign Coordinators
            </button>
            <button className="px-4 py-3 text-left text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100">
              Department Timetable
            </button>
            <button className="px-4 py-3 text-left text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100">
              Performance Reports
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
