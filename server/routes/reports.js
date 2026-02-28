const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const adminAuth = require('../middleware/auth');
const { Parser } = require('json2csv');

// Get weekly report
router.get('/weekly', adminAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Calculate week boundaries (Sunday to Saturday)
    const day = targetDate.getDay();
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - day);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select('*, families(name, spouse_name, email, mobile)')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: false });

    if (error) throw error;

    const totalFamilies = new Set(data.map((r) => r.family_id)).size;
    const totalAdults = data.reduce((sum, r) => sum + r.adults_count, 0);
    const totalChildren = data.reduce((sum, r) => sum + r.children_count, 0);

    res.json({
      week_start: startStr,
      week_end: endStr,
      total_families: totalFamilies,
      total_adults: totalAdults,
      total_children: totalChildren,
      total_people: totalAdults + totalChildren,
      records: data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get family attendance history
router.get('/family/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('family_id', id)
      .order('date', { ascending: false });

    if (start_date) query = query.gte('date', start_date);
    if (end_date) query = query.lte('date', end_date);

    const { data: attendance, error } = await query;
    if (error) throw error;

    const { data: family, error: famErr } = await supabase
      .from('families')
      .select('*')
      .eq('id', id)
      .single();
    if (famErr) throw famErr;

    // Calculate regularity over last 10 weeks
    const tenWeeksAgo = new Date();
    tenWeeksAgo.setDate(tenWeeksAgo.getDate() - 70);
    const tenWeeksStr = tenWeeksAgo.toISOString().split('T')[0];

    const { data: recentAttendance, error: recentErr } = await supabase
      .from('attendance')
      .select('date')
      .eq('family_id', id)
      .gte('date', tenWeeksStr);

    if (recentErr) throw recentErr;

    // Count distinct weeks attended
    const weeksAttended = new Set(
      recentAttendance.map((r) => {
        const d = new Date(r.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return weekStart.toISOString().split('T')[0];
      })
    ).size;

    res.json({
      family,
      attendance,
      regularity: {
        weeks_attended: weeksAttended,
        out_of_weeks: 10,
        summary: `Attended ${weeksAttended} out of last 10 weeks`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export attendance data as CSV
router.get('/export', adminAuth, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('attendance')
      .select('date, adults_count, children_count, families(name, email, mobile)')
      .order('date', { ascending: false });

    if (start_date) query = query.gte('date', start_date);
    if (end_date) query = query.lte('date', end_date);

    const { data, error } = await query;
    if (error) throw error;

    const csvData = data.map((r) => ({
      Date: r.date,
      'Family Name': r.families.name,
      Email: r.families.email || '',
      Mobile: r.families.mobile || '',
      Adults: r.adults_count,
      Children: r.children_count,
      Total: r.adults_count + r.children_count,
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance matrix (all families x all Saturdays in range)
router.get('/matrix', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setUTCDate(today.getUTCDate() - 90);

    const startStr = req.query.start_date || ninetyDaysAgo.toISOString().split('T')[0];
    const endStr = req.query.end_date || today.toISOString().split('T')[0];

    // Generate all Saturdays in range (UTC dates)
    const saturdays = [];
    const startDate = new Date(startStr + 'T00:00:00Z');
    const endDate = new Date(endStr + 'T00:00:00Z');
    const daysToFirstSat = (6 - startDate.getUTCDay() + 7) % 7;
    const current = new Date(startDate);
    current.setUTCDate(startDate.getUTCDate() + daysToFirstSat);
    while (current <= endDate) {
      saturdays.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 7);
    }
    const saturdaySet = new Set(saturdays);

    // Fetch all families
    const { data: families, error: famErr } = await supabase
      .from('families')
      .select('id, name, spouse_name, mobile')
      .order('name');
    if (famErr) throw famErr;

    // Fetch all attendance records in range
    const { data: attendance, error: attErr } = await supabase
      .from('attendance')
      .select('family_id, date')
      .gte('date', startStr)
      .lte('date', endStr);
    if (attErr) throw attErr;

    // Map each attendance date to its week's Saturday, keep only Saturdays in range
    const attendanceMap = {};
    for (const record of attendance) {
      const d = new Date(record.date + 'T00:00:00Z');
      const daysToSat = (6 - d.getUTCDay() + 7) % 7;
      const sat = new Date(d);
      sat.setUTCDate(d.getUTCDate() + daysToSat);
      const satStr = sat.toISOString().split('T')[0];
      if (!saturdaySet.has(satStr)) continue;
      if (!attendanceMap[record.family_id]) attendanceMap[record.family_id] = new Set();
      attendanceMap[record.family_id].add(satStr);
    }

    const result = families.map((f) => ({
      id: f.id,
      name: f.name,
      spouse_name: f.spouse_name || null,
      mobile: f.mobile || null,
      attended_dates: Array.from(attendanceMap[f.id] || []),
    }));

    res.json({ saturdays, families: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
