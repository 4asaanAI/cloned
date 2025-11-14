import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Bus, Plus, X, Edit, Loader2, Users } from 'lucide-react';

interface TransportRoute {
  id: string;
  route_name: string;
  route_number: string;
  vehicle_type: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  capacity: number;
  current_occupancy: number;
  monthly_fee: number;
  status: string;
}

interface TransportAssignment {
  id: string;
  user_id: string;
  route_id: string;
  stop_name: string;
  pickup_time?: string;
  user?: { full_name: string; role: string; };
}

export function TransportPage() {
  const { profile } = useAuth();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [assignments, setAssignments] = useState<TransportAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [routeForm, setRouteForm] = useState({
    route_name: '', route_number: '', vehicle_type: 'bus', vehicle_number: '',
    driver_name: '', driver_phone: '', capacity: 50, monthly_fee: 0
  });
  const [assignForm, setAssignForm] = useState({ user_id: '', route_id: '', stop_name: '', pickup_time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const isAdmin = profile?.sub_role === 'head' || profile?.sub_role === 'principal';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [routesRes, assignmentsRes, usersRes] = await Promise.all([
        supabase.from('transport_routes').select('*').order('route_number'),
        supabase.from('transport_assignments').select('*, user:profiles(full_name, role)'),
        supabase.from('profiles').select('id, full_name, role').eq('approval_status', 'approved')
      ]);
      if (routesRes.error) throw routesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      if (usersRes.error) throw usersRes.error;
      setRoutes(routesRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingRoute) {
        const { error } = await supabase.from('transport_routes').update(routeForm).eq('id', editingRoute.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Route updated' });
      } else {
        const { error } = await supabase.from('transport_routes').insert({ ...routeForm, current_occupancy: 0 });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Route created' });
      }
      setShowRouteModal(false);
      setRouteForm({ route_name: '', route_number: '', vehicle_type: 'bus', vehicle_number: '', driver_name: '', driver_phone: '', capacity: 50, monthly_fee: 0 });
      setEditingRoute(null);
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('transport_assignments').insert(assignForm);
      if (error) throw error;
      await supabase.rpc('increment', { row_id: assignForm.route_id, table_name: 'transport_routes', column_name: 'current_occupancy' });
      setMessage({ type: 'success', text: 'User assigned' });
      setShowAssignModal(false);
      setAssignForm({ user_id: '', route_id: '', stop_name: '', pickup_time: '' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transport Management</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => { setShowRouteModal(true); setEditingRoute(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Plus className="h-5 w-5" />
                Add Route
              </button>
              <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                <Users className="h-5 w-5" />
                Assign User
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
          ) : routes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">No transport routes found</div>
          ) : (
            routes.map(route => (
              <div key={route.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Bus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{route.route_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{route.route_number}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => {
                      setEditingRoute(route);
                      setRouteForm({
                        route_name: route.route_name,
                        route_number: route.route_number,
                        vehicle_type: route.vehicle_type,
                        vehicle_number: route.vehicle_number || '',
                        driver_name: route.driver_name || '',
                        driver_phone: route.driver_phone || '',
                        capacity: route.capacity,
                        monthly_fee: route.monthly_fee
                      });
                      setShowRouteModal(true);
                    }} className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{route.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{route.vehicle_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Driver:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{route.driver_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{route.current_occupancy}/{route.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${route.monthly_fee}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${route.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {route.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assigned Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pickup Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {assignments.map(assign => (
                  <tr key={assign.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{assign.user?.full_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{assign.user?.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {routes.find(r => r.id === assign.route_id)?.route_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{assign.stop_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{assign.pickup_time || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showRouteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingRoute ? 'Edit Route' : 'Add Route'}</h2>
              <button onClick={() => setShowRouteModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleRouteSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Route Name</label>
                  <input type="text" value={routeForm.route_name} onChange={e => setRouteForm({ ...routeForm, route_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Route Number</label>
                  <input type="text" value={routeForm.route_number} onChange={e => setRouteForm({ ...routeForm, route_number: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Type</label>
                  <select value={routeForm.vehicle_type} onChange={e => setRouteForm({ ...routeForm, vehicle_type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="taxi">Taxi</option>
                    <option value="car">Car</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Number</label>
                  <input type="text" value={routeForm.vehicle_number} onChange={e => setRouteForm({ ...routeForm, vehicle_number: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Driver Name</label>
                  <input type="text" value={routeForm.driver_name} onChange={e => setRouteForm({ ...routeForm, driver_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Driver Phone</label>
                  <input type="tel" value={routeForm.driver_phone} onChange={e => setRouteForm({ ...routeForm, driver_phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capacity</label>
                  <input type="number" value={routeForm.capacity} onChange={e => setRouteForm({ ...routeForm, capacity: parseInt(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monthly Fee</label>
                  <input type="number" value={routeForm.monthly_fee} onChange={e => setRouteForm({ ...routeForm, monthly_fee: parseFloat(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowRouteModal(false)} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign User to Route</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
                <select value={assignForm.user_id} onChange={e => setAssignForm({ ...assignForm, user_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                  <option value="">Select user</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Route</label>
                <select value={assignForm.route_id} onChange={e => setAssignForm({ ...assignForm, route_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                  <option value="">Select route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.route_number} - {r.route_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stop Name</label>
                <input type="text" value={assignForm.stop_name} onChange={e => setAssignForm({ ...assignForm, stop_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pickup Time</label>
                <input type="time" value={assignForm.pickup_time} onChange={e => setAssignForm({ ...assignForm, pickup_time: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Assign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
