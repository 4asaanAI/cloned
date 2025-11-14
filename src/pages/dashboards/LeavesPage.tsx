import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  Plus,
  X,
  Check,
  XCircle,
  Loader2,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface LeaveApplication {
  id: string;
  applicant_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  approved_by?: string;
  approval_date?: string;
  rejection_reason?: string;
  contact_during_leave?: string;
  created_at: string;
  applicant?: {
    full_name: string;
    email: string;
    role: string;
  };
}

export function LeavesPage() {
  const { profile } = useAuth();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveApplication | null>(
    null
  );
  const [formData, setFormData] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
    contact_during_leave: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isAdmin =
    profile?.sub_role === 'head' || profile?.sub_role === 'principal';

  useEffect(() => {
    fetchLeaves();
  }, [profile]);

  const fetchLeaves = async () => {
    try {
      const query = supabase
        .from('leave_applications')
        .select(
          `
          *,
          applicant:profiles!leave_applications_applicant_id_fkey(full_name, email, role)
        `
        )
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setLeaves(data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (editingLeave) {
        const { error } = await supabase
          .from('leave_applications')
          .update(formData)
          .eq('id', editingLeave.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Leave updated successfully' });
      } else {
        const { error } = await supabase
          .from('leave_applications')
          .insert({ ...formData, applicant_id: profile?.id });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Leave application submitted' });
      }
      setShowModal(false);
      setFormData({
        leave_type: 'casual',
        start_date: '',
        end_date: '',
        reason: '',
        contact_during_leave: '',
      });
      setEditingLeave(null);
      fetchLeaves();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leave_applications')
        .update({
          status: 'approved',
          approved_by: profile?.id,
          approval_date: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Leave approved' });
      fetchLeaves();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      const { error } = await supabase
        .from('leave_applications')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Leave rejected' });
      fetchLeaves();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const chartData = leaves.reduce((acc, leave) => {
    const type = leave.leave_type;
    const existing = acc.find((item) => item.name === type);
    if (existing) existing.value++;
    else acc.push({ name: type, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  const statusData = leaves.reduce((acc, leave) => {
    const status = leave.status;
    const existing = acc.find((item) => item.name === status);
    if (existing) existing.value++;
    else acc.push({ name: status, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Leave Management
          </h1>
          <button
            onClick={() => {
              setShowModal(true);
              setEditingLeave(null);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Apply Leave
          </button>
        </div>

        {message && (
          <div
            className={`p-3 sm:p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Leave Types Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* List / Table (responsive, no horizontal scroll on mobile) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              </div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                No leave applications found
              </div>
            ) : (
              leaves.map((leave) => (
                <div key={leave.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                        {leave.applicant?.full_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {leave.applicant?.role}
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize shrink-0">
                      {leave.leave_type}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex flex-wrap gap-x-2">
                      <span className="font-medium">Dates:</span>
                      <span className="break-words">
                        {new Date(leave.start_date).toLocaleDateString()} –{' '}
                        {new Date(leave.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    {leave.reason && (
                      <div className="mt-1">
                        <span className="font-medium">Reason:</span>{' '}
                        <span className="break-words">{leave.reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                        leave.status
                      )}`}
                    >
                      {leave.status}
                    </span>

                    {isAdmin && (
                      <div className="flex gap-2">
                        {leave.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(leave.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                              title="Approve"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Reject"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            —
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-[24%]">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-[12%]">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-[22%]">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-[26%]">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-[10%]">
                      Status
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-[6%]">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 6 : 5}
                        className="px-6 py-10 text-center"
                      >
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                      </td>
                    </tr>
                  ) : leaves.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 6 : 5}
                        className="px-6 py-10 text-center text-gray-500 dark:text-gray-400"
                      >
                        No leave applications found
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr
                        key={leave.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 align-top">
                          <div className="text-sm font-medium text-gray-900 dark:text-white break-words">
                            {leave.applicant?.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 capitalize break-words">
                            {leave.applicant?.role}
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                            {leave.leave_type}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-top text-sm text-gray-900 dark:text-white break-words">
                          {new Date(leave.start_date).toLocaleDateString()} -{' '}
                          {new Date(leave.end_date).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 align-top text-sm text-gray-900 dark:text-white break-words">
                          {leave.reason}
                        </td>

                        <td className="px-6 py-4 align-top">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                              leave.status
                            )}`}
                          >
                            {leave.status}
                          </span>
                        </td>

                        {isAdmin && (
                          <td className="px-6 py-4 align-top">
                            {leave.status === 'pending' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(leave.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                                  title="Approve"
                                >
                                  <Check className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleReject(leave.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                  title="Reject"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                —
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                {editingLeave ? 'Edit Leave' : 'Apply Leave'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Leave Type
                </label>
                <select
                  value={formData.leave_type}
                  onChange={(e) =>
                    setFormData({ ...formData, leave_type: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="emergency">Emergency</option>
                  <option value="annual">Annual</option>
                  <option value="maternity">Maternity</option>
                  <option value="paternity">Paternity</option>
                  <option value="study">Study</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact During Leave
                </label>
                <input
                  type="text"
                  value={formData.contact_during_leave}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_during_leave: e.target.value,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Phone or email"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
