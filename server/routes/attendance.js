const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// Submit attendance
router.post('/', async (req, res) => {
  try {
    const { family_name, spouse_name, email, mobile, adults_count, children_count } = req.body;

    if (!family_name || !family_name.trim()) {
      return res.status(400).json({ error: 'Family name is required' });
    }

    if (adults_count == null || children_count == null) {
      return res.status(400).json({ error: 'Adults and children count are required' });
    }

    if (adults_count < 0 || children_count < 0) {
      return res.status(400).json({ error: 'Counts cannot be negative' });
    }

    if (adults_count === 0 && children_count === 0) {
      return res.status(400).json({ error: 'At least one person must be attending' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (mobile && !/^[+]?[\d\s-]{10,15}$/.test(mobile)) {
      return res.status(400).json({ error: 'Invalid mobile number format' });
    }

    // Find or create family
    let family;
    const { data: existing } = await supabase
      .from('families')
      .select('*')
      .ilike('name', family_name.trim())
      .single();

    if (existing) {
      // Update contact info if provided
      const updates = {};
      if (email) updates.email = email;
      if (mobile) updates.mobile = mobile;
      if (spouse_name) updates.spouse_name = spouse_name;

      if (Object.keys(updates).length > 0) {
        const { data, error } = await supabase
          .from('families')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        family = data;
      } else {
        family = existing;
      }
    } else {
      const { data, error } = await supabase
        .from('families')
        .insert({ name: family_name.trim(), email, mobile, spouse_name })
        .select()
        .single();
      if (error) throw error;
      family = data;
    }

    // Get today's date in AEDT
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });

    // Check for duplicate submission
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('family_id', family.id)
      .eq('date', today)
      .single();

    if (existingAttendance) {
      return res.status(409).json({
        error: 'Attendance already submitted today for this family',
        existing: existingAttendance,
      });
    }

    // Insert attendance record
    const { data: attendance, error } = await supabase
      .from('attendance')
      .insert({
        family_id: family.id,
        date: today,
        adults_count: parseInt(adults_count),
        children_count: parseInt(children_count),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendance,
      family,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
