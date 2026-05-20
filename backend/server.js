const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with dynamic origin support (development + VITE/Vercel URLs)
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server or mobile apps)
    if (!origin) return callback(null, true);
    
    // Allow explicit domains or any localhost/Vercel preview URL dynamically
    if (
      allowedOrigins.indexOf(origin) !== -1 || 
      origin.includes('localhost') || 
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    
    return callback(new Error('CORS blocked by AI Estate Vision security policy.'), false);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Serve uploads folder as a static route
const uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadPath));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/architect_ai')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const authRoute = require('./routes/auth');
const uploadRoute = require('./routes/upload');
const ollamaRoute = require('./routes/ollama');
const pullModelRoute = require('./routes/pullModel');

app.use('/api/auth', authRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/ai', ollamaRoute);
app.use('/api/ai/pull', pullModelRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
