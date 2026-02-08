require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env' : '../.env' });
const express = require('express');
const cors = require('cors');

const attendanceRoutes = require('./routes/attendance');
const familyRoutes = require('./routes/families');
const reportRoutes = require('./routes/reports');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));
app.use(express.json());

app.use('/api/attendance', attendanceRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
