const express = require('express');
const savedLocationsRoutes = require('./routes/savedLocationsRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');
const sharedLocationRoutes = require('./routes/sharedLocationRoutes');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use('/api/savedLocations', savedLocationsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/friend-requests', friendRequestRoutes);
app.use('/api/shared-locations', sharedLocationRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});