import { useState } from 'react';
import { getAttendanceMatrix } from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}-${MONTHS[parseInt(month, 10) - 1]}-${year}`;
}

function getDefaultDates() {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  const start = new Date(now);
  start.setDate(now.getDate() - 14);
  return { start: start.toISOString().split('T')[0], end };
}

function buildCSV(saturdays, families) {
  const headers = ['Name', 'Spouse Name', 'Mobile', ...saturdays.map(formatDate), 'Total'];
  const rows = families.map((f) => {
    const attended = new Set(f.attended_dates);
    const cells = saturdays.map((s) => (attended.has(s) ? '✓' : ''));
    return [f.name, f.spouse_name || '', f.mobile || '', ...cells, f.attended_dates.length];
  });
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function AttendanceMatrix({ password }) {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchMatrix() {
    setLoading(true);
    setError(null);
    try {
      const result = await getAttendanceMatrix(password, startDate, endDate);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (!data) return;
    const csv = buildCSV(data.saturdays, data.families);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_matrix_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
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
            onClick={fetchMatrix}
            disabled={loading}
            className="px-4 py-1.5 bg-saffron-600 hover:bg-saffron-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load Report'}
          </button>
          {data && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
            >
              Download CSV
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Matrix Table */}
      {data && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">
              {data.families.length} families &middot; {data.saturdays.length} Saturdays
            </h3>
          </div>
          {data.families.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No families found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 text-left px-4 py-3 font-medium text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                      Spouse Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                      Mobile
                    </th>
                    {data.saturdays.map((s) => (
                      <th
                        key={s}
                        className="text-center px-3 py-3 font-medium text-gray-600 whitespace-nowrap"
                      >
                        {formatDate(s)}
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.families.map((family) => {
                    const attended = new Set(family.attended_dates);
                    return (
                      <tr key={family.id} className="group hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-4 py-3 font-medium text-gray-800 border-r border-gray-200 whitespace-nowrap transition-colors">
                          {family.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {family.spouse_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {family.mobile || '—'}
                        </td>
                        {data.saturdays.map((s) => (
                          <td key={s} className="px-3 py-3 text-center text-green-600 font-bold">
                            {attended.has(s) ? '✓' : ''}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center font-semibold text-saffron-600">
                          {family.attended_dates.length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceMatrix;
