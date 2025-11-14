import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { ColumnFilter } from '../../components/ColumnFilter';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  UserPlus,
  Search,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Award,
  X,
  Wand2,
} from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string;
  event_type: string;
  event_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  venue: string;
  status: string;
  max_participants: number;
  current_volunteers: number;
  budget: number;
  coordinator_name?: string;
  coordinator_email?: string;
}

export function EventsPage() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>(
    []
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    event_type: 'seminar',
    description: '',
    event_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    max_participants: '',
    budget: '',
    status: 'upcoming',
  });
  const [saving, setSaving] = useState(false);

  // --- Beautify states ---
  const [beautifying, setBeautifying] = useState(false);
  const [showBeautifyConfirm, setShowBeautifyConfirm] = useState(false);
  const [beautifiedData, setBeautifiedData] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const isDark = theme === 'dark';
  const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

  const handleCreateEvent = async () => {
    if (!profile || !formData.name || !formData.event_date) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('events').insert({
        name: formData.name,
        event_type: formData.event_type,
        description: formData.description,
        event_date: formData.event_date,
        end_date: formData.end_date || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        venue: formData.venue,
        coordinator_id: profile.id,
        max_participants: formData.max_participants
          ? parseInt(formData.max_participants)
          : null,
        current_volunteers: 0,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
        created_by: profile.id,
      });

      if (error) throw error;

      setShowCreateModal(false);
      setFormData({
        name: '',
        event_type: 'seminar',
        description: '',
        event_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        venue: '',
        max_participants: '',
        budget: '',
        status: 'upcoming',
      });
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setSaving(false);
    }
  };

  const canCreateEvent = profile?.role && profile.role !== 'student';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          coordinator:profiles!events_coordinator_id_fkey(full_name, email)
        `
        )
        .order('event_date', { ascending: false });

      if (error) throw error;

      const formattedEvents: Event[] = (data || []).map((event: any) => ({
        id: event.id,
        name: event.name,
        description: event.description || '',
        event_type: event.event_type,
        event_date: event.event_date,
        end_date: event.end_date,
        start_time: event.start_time,
        end_time: event.end_time,
        venue: event.venue,
        status: event.status,
        max_participants: event.max_participants || 0,
        current_volunteers: event.current_volunteers || 0,
        budget: event.budget || 0,
        coordinator_name: event.coordinator?.full_name || 'N/A',
        coordinator_email: event.coordinator?.email || 'N/A',
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.coordinator_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(event.event_type);
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(event.status);
    const matchesCoordinator =
      selectedCoordinators.length === 0 ||
      selectedCoordinators.includes(event.coordinator_name || '');

    return matchesSearch && matchesType && matchesStatus && matchesCoordinator;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      upcoming: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
      },
      ongoing: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
      },
      completed: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
      },
      cancelled: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
      },
    };

    const config = statusConfig[status] || statusConfig.upcoming;
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string }> = {
      cultural: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300',
      },
      sports: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
      },
      academic: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
      },
      technical: {
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        text: 'text-teal-700 dark:text-teal-300',
      },
      social: {
        bg: 'bg-pink-100 dark:bg-pink-900/30',
        text: 'text-pink-700 dark:text-pink-300',
      },
      other: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
      },
    };

    const config = typeConfig[type] || typeConfig.other;
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const calculateStats = () => {
    const totalEvents = filteredEvents.length;
    const upcomingEvents = filteredEvents.filter(
      (e) => e.status === 'upcoming'
    ).length;
    const ongoingEvents = filteredEvents.filter(
      (e) => e.status === 'ongoing'
    ).length;
    const totalVolunteers = filteredEvents.reduce(
      (sum, e) => sum + e.current_volunteers,
      0
    );

    return { totalEvents, upcomingEvents, ongoingEvents, totalVolunteers };
  };

  const stats = calculateStats();

  // ---------- Beautify handlers (fetch -> supabase function) ----------
  const handleBeautifyEvent = async () => {
    // send current title & description to backend
    if (!formData.name.trim() && !formData.description.trim()) {
      try {
        // eslint-disable-next-line no-alert
        alert('Please enter title or description to beautify.');
      } catch {}
      return;
    }

    setBeautifying(true);
    try {
      const apiUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/beautify-announcement`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.name,
          content: formData.description,
          tone: 'friendly',
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const serverMessage =
          data?.error ||
          data?.message ||
          `Beautify failed (${response.status})`;
        throw new Error(serverMessage);
      }

      const newTitle = (data?.beautifiedTitle as string) || formData.name;
      const newDescription =
        (data?.beautifiedContent as string) || formData.description;

      setBeautifiedData({ title: newTitle, description: newDescription });
      setShowBeautifyConfirm(true);
    } catch (err) {
      console.error('Error beautifying event:', err);
      try {
        // eslint-disable-next-line no-alert
        alert(
          err instanceof Error
            ? err.message
            : 'Failed to beautify. Please try again.'
        );
      } catch {}
    } finally {
      setBeautifying(false);
    }
  };

  const handleAcceptBeautifiedEvent = () => {
    if (!beautifiedData) return;
    setFormData({
      ...formData,
      name: beautifiedData.title,
      description: beautifiedData.description,
    });
    setShowBeautifyConfirm(false);
    setBeautifiedData(null);
  };

  const handleRejectBeautifiedEvent = () => {
    setShowBeautifyConfirm(false);
    setBeautifiedData(null);
  };

  // --- Mobile card renderer (visible on <md) ---
  const MobileEventCard = ({ e }: { e: Event }) => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {e.name}
          </div>
          {e.description && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {e.description}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {getTypeBadge(e.event_type)}
            {getStatusBadge(e.status)}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(e.event_date).toLocaleDateString()}
              {e.end_date
                ? ` – ${new Date(e.end_date).toLocaleDateString()}`
                : ''}
            </div>
            {e.start_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {e.start_time} – {e.end_time}
              </div>
            )}
            {e.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{e.venue}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {e.current_volunteers}
                {e.max_participants > 0 && `/${e.max_participants}`} volunteers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Coordinator:
              </span>
              <span className="truncate">{e.coordinator_name}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 w-full min-w-0 px-4 sm:px-6 md:px-8 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Events Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage school events, coordinators, and student volunteers
            </p>
          </div>
          {canCreateEvent && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add New Event
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Events
              </span>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.totalEvents}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Upcoming
              </span>
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.upcomingEvents}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Ongoing
              </span>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.ongoingEvents}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Volunteers
              </span>
              <UserPlus className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.totalVolunteers}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Events List
            </h3>
            <div className="flex items-center gap-3">
              {/* Desktop search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile search (separate row for spacing) */}
          <div className="sm:hidden mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((e) => (
                    <MobileEventCard key={e.id} e={e} />
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No events found matching your filters
                  </div>
                )}
              </div>

              {/* Desktop table (unchanged UI/behavior) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Event Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Type
                          <ColumnFilter
                            column="Type"
                            values={uniq(events.map((e) => e.event_type))}
                            selectedValues={selectedTypes}
                            onFilterChange={setSelectedTypes}
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Coordinator
                          <ColumnFilter
                            column="Coordinator"
                            values={uniq(
                              events.map((e) => e.coordinator_name || '')
                            )}
                            selectedValues={selectedCoordinators}
                            onFilterChange={setSelectedCoordinators}
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Date & Time
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Venue
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Volunteers
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          Status
                          <ColumnFilter
                            column="Status"
                            values={uniq(events.map((e) => e.status))}
                            selectedValues={selectedStatuses}
                            onFilterChange={setSelectedStatuses}
                            isDark={isDark}
                          />
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr
                        key={event.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {event.name}
                            </div>
                            {event.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                {event.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getTypeBadge(event.event_type)}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                              {event.coordinator_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {event.coordinator_email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.event_date).toLocaleDateString()}
                            {event.end_date
                              ? ` – ${new Date(
                                  event.end_date
                                ).toLocaleDateString()}`
                              : ''}
                          </div>
                          {event.start_time && (
                            <div className="flex items-center gap-2 text-xs mt-1">
                              <Clock className="h-3 w-3" />
                              {event.start_time} - {event.end_time}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {event.venue && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.venue}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {event.current_volunteers}
                              {event.max_participants > 0 &&
                                `/${event.max_participants}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(event.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEvents.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No events found matching your filters
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create Event
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Type *
                    </label>
                    <select
                      value={formData.event_type}
                      onChange={(e) =>
                        setFormData({ ...formData, event_type: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="seminar">Seminar</option>
                      <option value="workshop">Workshop</option>
                      <option value="cultural">Cultural</option>
                      <option value="sports">Sports</option>
                      <option value="academic">Academic</option>
                      <option value="technical">Technical</option>
                      <option value="social">Social</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleBeautifyEvent}
                      disabled={
                        beautifying ||
                        (!formData.name.trim() && !formData.description.trim())
                      }
                      title="Beautify Title & Description with AI"
                      className="absolute right-2 top-2 p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Wand2
                        className={`h-4 w-4 ${
                          beautifying ? 'animate-spin' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) =>
                        setFormData({ ...formData, event_date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_participants: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={saving || !formData.name || !formData.event_date}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautify confirm modal */}
      {showBeautifyConfirm && beautifiedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[40rem] bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Improved Event
              </h3>
              <button
                onClick={handleRejectBeautifiedEvent}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Original Title
                </label>
                <div className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white whitespace-pre-wrap">
                  {formData.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Improved Title
                </label>
                <div className="w-full px-4 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white whitespace-pre-wrap">
                  {beautifiedData.title}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Original Description
                </label>
                <div className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {formData.description}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Improved Description
                </label>
                <div className="w-full px-4 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {beautifiedData.description}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleRejectBeautifiedEvent}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Keep Original
                </button>
                <button
                  onClick={handleAcceptBeautifiedEvent}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Use Improved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
