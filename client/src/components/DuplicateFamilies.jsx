import { useState, useEffect } from 'react';
import { getDuplicateFamilies, mergeFamilies } from '../utils/api';

function FamilyCard({ family, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border-2 transition ${
        selected
          ? 'border-saffron-500 bg-saffron-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
            selected ? 'border-saffron-500 bg-saffron-500' : 'border-gray-300'
          }`}
        />
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 truncate">{family.name}</p>
          {family.spouse_name && (
            <p className="text-sm text-gray-500 truncate">{family.spouse_name}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{family.mobile}</p>
          {family.email && (
            <p className="text-xs text-gray-400 truncate">{family.email}</p>
          )}
          <p className="text-xs text-gray-400">
            Created {new Date(family.created_at).toLocaleDateString('en-AU')}
          </p>
          <p className={`text-xs font-medium mt-1 ${family.attendance_count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {family.attendance_count} attendance record{family.attendance_count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </button>
  );
}

function DuplicateGroup({ group, onMerged }) {
  const [keepId, setKeepId] = useState(
    // Default: keep the one with more attendance records
    group.reduce((a, b) => (a.attendance_count >= b.attendance_count ? a : b)).id
  );
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState(null);

  async function handleMerge(password) {
    const discardId = group.find((f) => f.id !== keepId).id;
    setMerging(true);
    setError(null);
    try {
      await mergeFamilies(password, keepId, discardId);
      onMerged();
    } catch (err) {
      setError(err.message);
    } finally {
      setMerging(false);
    }
  }

  return { keepId, setKeepId, merging, error, handleMerge };
}

function DuplicateFamilies({ password }) {
  const [groups, setGroups] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Per-group state: { [index]: { keepId, merging, error } }
  const [groupState, setGroupState] = useState({});

  useEffect(() => {
    fetchDuplicates();
  }, []);

  async function fetchDuplicates() {
    setLoading(true);
    setError(null);
    try {
      const data = await getDuplicateFamilies(password);
      setGroups(data);
      // Initialise per-group keep selection to the record with most attendance
      const initial = {};
      data.forEach((group, i) => {
        const best = group.reduce((a, b) => (a.attendance_count >= b.attendance_count ? a : b));
        initial[i] = { keepId: best.id, merging: false, error: null };
      });
      setGroupState(initial);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function setKeepId(index, id) {
    setGroupState((s) => ({ ...s, [index]: { ...s[index], keepId: id } }));
  }

  async function handleMerge(index, group) {
    const { keepId } = groupState[index];
    const discardId = group.find((f) => f.id !== keepId).id;
    setGroupState((s) => ({ ...s, [index]: { ...s[index], merging: true, error: null } }));
    try {
      await mergeFamilies(password, keepId, discardId);
      // Remove this group from the list
      setGroups((prev) => prev.filter((_, i) => i !== index));
      setGroupState((s) => {
        const next = { ...s };
        delete next[index];
        return next;
      });
    } catch (err) {
      setGroupState((s) => ({ ...s, [index]: { ...s[index], merging: false, error: err.message } }));
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Checking for duplicates…</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (groups && groups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
        No duplicate phone numbers found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {groups ? `${groups.length} duplicate group${groups.length !== 1 ? 's' : ''} found` : ''}
        </p>
        <button
          onClick={fetchDuplicates}
          className="text-sm text-saffron-600 hover:text-saffron-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {groups &&
        groups.map((group, index) => {
          const state = groupState[index] || {};
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Shared mobile: {group[0].mobile}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {group.map((family) => (
                  <FamilyCard
                    key={family.id}
                    family={family}
                    selected={state.keepId === family.id}
                    onSelect={() => setKeepId(index, family.id)}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Select the record to <span className="font-semibold text-gray-600">keep</span>.
                  The other's attendance will be merged into it and then deleted.
                </p>
                <button
                  onClick={() => handleMerge(index, group)}
                  disabled={state.merging}
                  className="ml-4 flex-shrink-0 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {state.merging ? 'Merging…' : 'Merge'}
                </button>
              </div>
              {state.error && (
                <p className="mt-2 text-sm text-red-600">{state.error}</p>
              )}
            </div>
          );
        })}
    </div>
  );
}

export default DuplicateFamilies;
