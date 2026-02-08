import { useState, useEffect } from 'react';
import { getAbsentFamilies } from '../utils/api';

function AbsenceAlerts({ password }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const result = await getAbsentFamilies(password);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading alerts...</div>;
  }

  if (!data || data.families.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <p className="text-green-800 font-medium">All families have attended recently!</p>
        <p className="text-green-600 text-sm mt-1">No follow-up required at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h3 className="font-semibold text-red-800">
          Follow-up Required - {data.count} {data.count === 1 ? 'Family' : 'Families'}
        </h3>
        <p className="text-sm text-red-600 mt-1">
          These families have not attended in the last 2 weeks.
        </p>
      </div>

      <div className="grid gap-3">
        {data.families.map((family) => (
          <div
            key={family.id}
            className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-400"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-800">{family.name}</h4>
                <div className="mt-1 space-y-0.5">
                  {family.email && (
                    <p className="text-sm text-gray-500">
                      <span className="inline-block w-14 text-gray-400">Email:</span>
                      <a href={`mailto:${family.email}`} className="text-saffron-600 hover:underline">
                        {family.email}
                      </a>
                    </p>
                  )}
                  {family.mobile && (
                    <p className="text-sm text-gray-500">
                      <span className="inline-block w-14 text-gray-400">Mobile:</span>
                      <a href={`tel:${family.mobile}`} className="text-saffron-600 hover:underline">
                        {family.mobile}
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {family.last_attended ? (
                  <p className="text-xs text-gray-400">
                    Last attended: <span className="text-gray-600">{family.last_attended}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Never attended</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={fetchAlerts}
        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        Refresh Alerts
      </button>
    </div>
  );
}

export default AbsenceAlerts;
