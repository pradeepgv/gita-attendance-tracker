const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const adminAuth = require('../middleware/auth');

// Get families absent for 2+ weeks
router.get('/absent', adminAuth, async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksStr = twoWeeksAgo.toISOString().split('T')[0];

    // Get all families
    const { data: allFamilies, error: famErr } = await supabase
      .from('families')
      .select('*')
      .order('name');

    if (famErr) throw famErr;

    // Get families who attended in the last 2 weeks
    const { data: recentAttendance, error: attErr } = await supabase
      .from('attendance')
      .select('family_id')
      .gte('date', twoWeeksStr);

    if (attErr) throw attErr;

    const recentFamilyIds = new Set(recentAttendance.map((r) => r.family_id));

    // Filter families who haven't attended
    const absentFamilies = [];
    for (const family of allFamilies) {
      if (!recentFamilyIds.has(family.id)) {
        // Get their last attendance date
        const { data: lastAttendance } = await supabase
          .from('attendance')
          .select('date')
          .eq('family_id', family.id)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        absentFamilies.push({
          ...family,
          last_attended: lastAttendance ? lastAttendance.date : null,
        });
      }
    }

    res.json({
      count: absentFamilies.length,
      families: absentFamilies,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
