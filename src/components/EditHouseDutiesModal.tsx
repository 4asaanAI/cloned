import { useState } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface EditHouseDutiesModalProps {
  profile: Profile;
  onClose: () => void;
  onSuccess: () => void;
}

const HOUSES = ['green', 'blue', 'red', 'yellow'];
const AVAILABLE_DUTIES = [
  'Head Boy', 'Head Girl', 'Vice Head Boy', 'Vice Head Girl',
  'House Captain', 'Vice House Captain', 'Sports Captain',
  'Cultural Captain', 'Discipline Prefect', 'Library Prefect',
  'Science Club Head', 'Drama Club Head', 'Music Club Head',
  'Art Club Head', 'Debate Captain', 'Quiz Captain',
  'Green House Head', 'Blue House Head', 'Red House Head', 'Yellow House Head',
  'Football Coach', 'Basketball Coach', 'Cricket Coach',
  'Class Monitor', 'Lab Assistant'
];

export function EditHouseDutiesModal({ profile, onClose, onSuccess }: EditHouseDutiesModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [house, setHouse] = useState<string>(profile.house || '');
  const [duties, setDuties] = useState<string[]>(profile.duties || []);
  const [newDuty, setNewDuty] = useState('');

  const handleAddDuty = () => {
    if (newDuty.trim() && !duties.includes(newDuty.trim())) {
      setDuties([...duties, newDuty.trim()]);
      setNewDuty('');
    }
  };

  const handleRemoveDuty = (duty: string) => {
    setDuties(duties.filter(d => d !== duty));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          house: house || null,
          duties: duties.length > 0 ? duties : null
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update house and duties');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Edit House & Duties
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-semibold">{profile.full_name}</p>
              <p className="text-blue-800 dark:text-blue-400 capitalize">{profile.role}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              House
            </label>
            <select
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white capitalize"
            >
              <option value="">None</option>
              {HOUSES.map(h => (
                <option key={h} value={h} className="capitalize">{h}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duties / Responsibilities
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={newDuty}
                onChange={(e) => setNewDuty(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Select or type custom duty...</option>
                {AVAILABLE_DUTIES.filter(d => !duties.includes(d)).map(duty => (
                  <option key={duty} value={duty}>{duty}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddDuty}
                disabled={!newDuty.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              value={newDuty}
              onChange={(e) => setNewDuty(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDuty())}
              placeholder="Or type custom duty..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            {duties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {duties.map((duty, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-medium rounded-md shadow-sm"
                  >
                    {duty}
                    <button
                      type="button"
                      onClick={() => handleRemoveDuty(duty)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
