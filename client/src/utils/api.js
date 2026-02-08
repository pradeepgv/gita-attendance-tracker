const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Request failed: ${res.status}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return res.blob();
  }
  return res.json();
}

export function searchFamilies(query) {
  return request(`/families/search?query=${encodeURIComponent(query)}`);
}

export function submitAttendance(data) {
  return request('/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getWeeklyReport(date, password) {
  return request(`/reports/weekly?date=${date}`, {
    headers: { 'x-admin-password': password },
  });
}

export function getFamilyReport(familyId, password, startDate, endDate) {
  let url = `/reports/family/${familyId}?`;
  if (startDate) url += `start_date=${startDate}&`;
  if (endDate) url += `end_date=${endDate}`;
  return request(url, {
    headers: { 'x-admin-password': password },
  });
}

export function getAbsentFamilies(password) {
  return request('/alerts/absent', {
    headers: { 'x-admin-password': password },
  });
}

export function exportCSV(password, startDate, endDate) {
  let url = `/reports/export?`;
  if (startDate) url += `start_date=${startDate}&`;
  if (endDate) url += `end_date=${endDate}`;
  return request(url, {
    headers: { 'x-admin-password': password },
  });
}
