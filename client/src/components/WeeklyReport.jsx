import { useState, useEffect } from 'react';
import { getWeeklyReport, exportCSV } from '../utils/api';

function WeeklyReport({ password }) {
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  useEffect(() => {
    fetchReport();
  }, [date]);

  async function fetchReport() {
    setLoading(true);
    try {
      const data = await getWeeklyReport(date, password);
      setReport(data);
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const blob = await exportCSV(password, exportStartDate, exportEndDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  function navigateWeek(direction) {
    const d = new Date(date);
    d.setDate(d.getDate() + direction * 7);
    setDate(d.toISOString().split('T')[0]);
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            &larr; Previous
          </button>
          <div className="text-center">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-saffron-500 outline-none"
            />
            {report && (
              <p className="text-xs text-gray-500 mt-1">
                Week: {report.week_start} to {report.week_end}
              </p>
            )}
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading report...</div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-3xl font-bold text-saffron-600">{report.total_families}</p>
              <p className="text-xs text-gray-500 mt-1">Families</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{report.total_adults}</p>
              <p className="text-xs text-gray-500 mt-1">Adults</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{report.total_children}</p>
              <p className="text-xs text-gray-500 mt-1">Children</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{report.total_people}</p>
              <p className="text-xs text-gray-500 mt-1">Total People</p>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Attendance Details</h3>
            </div>
            {report.records.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No attendance records this week</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Family</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Adults</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Children</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {r.families?.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{r.date}</td>
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
      ) : null}

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Export Data (CSV)</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-saffron-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-saffron-500 outline-none"
            />
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-1.5 bg-saffron-600 hover:bg-saffron-700 text-white text-sm font-medium rounded-lg transition"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export default WeeklyReport;
