const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const adminAuth = require('../middleware/auth');

// Search families for autocomplete
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 1) {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from('families')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Find families sharing the same mobile number (duplicates)
router.get('/duplicates', adminAuth, async (req, res) => {
  try {
    const { data: families, error } = await supabase
      .from('families')
      .select('id, name, spouse_name, mobile, email, created_at')
      .not('mobile', 'is', null)
      .neq('mobile', '')
      .order('mobile');
    if (error) throw error;

    // Group by normalised mobile (strip spaces/dashes)
    const groups = {};
    for (const f of families) {
      const key = f.mobile.replace(/[\s\-]/g, '');
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    const dupeGroups = Object.values(groups).filter((g) => g.length > 1);

    if (dupeGroups.length === 0) return res.json([]);

    // Attach attendance counts
    const ids = dupeGroups.flat().map((f) => f.id);
    const { data: attRows, error: attErr } = await supabase
      .from('attendance')
      .select('family_id')
      .in('family_id', ids);
    if (attErr) throw attErr;

    const countMap = {};
    for (const r of attRows) countMap[r.family_id] = (countMap[r.family_id] || 0) + 1;

    const result = dupeGroups.map((group) =>
      group.map((f) => ({ ...f, attendance_count: countMap[f.id] || 0 }))
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Merge two families: re-assign attendance from discard to keep, delete discard
router.post('/merge', adminAuth, async (req, res) => {
  try {
    const { keep_id, discard_id } = req.body;
    if (!keep_id || !discard_id) {
      return res.status(400).json({ error: 'keep_id and discard_id are required' });
    }

    // Find dates where keep_id already has attendance (UNIQUE constraint conflict)
    const { data: keepRows, error: keepErr } = await supabase
      .from('attendance')
      .select('date')
      .eq('family_id', keep_id);
    if (keepErr) throw keepErr;

    const keepDates = keepRows.map((r) => r.date);

    // Delete conflicting discard_id records first
    if (keepDates.length > 0) {
      const { error: conflictErr } = await supabase
        .from('attendance')
        .delete()
        .eq('family_id', discard_id)
        .in('date', keepDates);
      if (conflictErr) throw conflictErr;
    }

    // Re-assign remaining discard_id attendance to keep_id
    const { error: reassignErr } = await supabase
      .from('attendance')
      .update({ family_id: keep_id })
      .eq('family_id', discard_id);
    if (reassignErr) throw reassignErr;

    // Delete the discarded family
    const { error: deleteErr } = await supabase
      .from('families')
      .delete()
      .eq('id', discard_id);
    if (deleteErr) throw deleteErr;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific family
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Family not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new family
router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, spouse_name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Family name is required' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (mobile && !/^[+]?[\d\s-]{10,15}$/.test(mobile)) {
      return res.status(400).json({ error: 'Invalid mobile number format' });
    }

    // Check if family already exists
    const { data: existing } = await supabase
      .from('families')
      .select('*')
      .ilike('name', name.trim())
      .single();

    if (existing) {
      // Update existing family details
      const { data, error } = await supabase
        .from('families')
        .update({
          email: email || existing.email,
          mobile: mobile || existing.mobile,
          spouse_name: spouse_name || existing.spouse_name,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    }

    // Create new family
    const { data, error } = await supabase
      .from('families')
      .insert({ name: name.trim(), email, mobile, spouse_name })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
