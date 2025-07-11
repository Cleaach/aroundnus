const express = require('express');
const savedLocationsRoutes = require('./routes/savedLocationsRoutes');
const authRoutes = require('./routes/authRoutes');
const profilePictureRoutes = require('./routes/profileRoutes');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: '*', // Allow all origins for testing, restrict in production)
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// routes
app.use('/api/savedLocations', savedLocationsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profilePicture', profilePictureRoutes);

// Catch-all 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});