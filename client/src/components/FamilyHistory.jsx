import { useState } from 'react';
import { searchFamilies, getFamilyReport } from '../utils/api';

function FamilyHistory({ password }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function handleSearch(value) {
    setQuery(value);
    if (value.length >= 1) {
      try {
        const results = await searchFamilies(value);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }

  async function selectFamily(family) {
    setSelectedFamily(family);
    setQuery(family.name);
    setSuggestions([]);
    await fetchHistory(family.id);
  }

  async function fetchHistory(familyId) {
    setLoading(true);
    try {
      const data = await getFamilyReport(familyId || selectedFamily.id, password, startDate, endDate);
      setReport(data);
    } catch (err) {
      console.error('Failed to fetch family history:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Search Family</h3>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type family name to search..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 outline-none"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((family) => (
                <li
                  key={family.id}
                  onClick={() => selectFamily(family)}
                  className="px-4 py-2.5 hover:bg-saffron-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{family.name}</span>
                  {family.email && (
                    <span className="text-gray-400 text-sm ml-2">{family.email}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedFamily && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-saffron-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-saffron-500 outline-none"
              />
            </div>
            <button
              onClick={() => fetchHistory()}
              className="px-4 py-1.5 bg-saffron-600 hover:bg-saffron-700 text-white text-sm font-medium rounded-lg transition"
            >
              Filter
            </button>
          </div>
        )}
      </div>

      {loading && <div className="text-center py-8 text-gray-500">Loading history...</div>}

      {report && (
        <>
          {/* Family Info & Regularity */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{report.family.name}</h3>
                {report.family.email && (
                  <p className="text-sm text-gray-500">{report.family.email}</p>
                )}
                {report.family.mobile && (
                  <p className="text-sm text-gray-500">{report.family.mobile}</p>
                )}
              </div>
              <div className="bg-saffron-50 border border-saffron-200 rounded-lg px-4 py-2">
                <p className="text-sm font-medium text-saffron-800">
                  {report.regularity.summary}
                </p>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Attendance History</h3>
            </div>
            {report.attendance.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No attendance records found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Adults</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Children</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.attendance.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">{r.date}</td>
                        <td className="px-4 py-3 text-center">{r.adults_count}</td>
                        <td className="px-4 py-3 text-center">{r.children_count}</td>
                        <td className="px-4 py-3 text-center font-medium">
                          {r.adults_count + r.children_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default FamilyHistory;
