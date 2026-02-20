const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

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
