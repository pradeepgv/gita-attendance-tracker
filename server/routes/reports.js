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
      .select('*, families(name, email, mobile)')
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

module.exports = router;
