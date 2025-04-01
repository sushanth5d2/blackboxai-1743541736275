const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const storiesRoutes = require('./routes/stories');
const messagesRoutes = require('./routes/messages');
const communitiesRoutes = require('./routes/communities');
const communityChatRoutes = require('./routes/community-chat');
const eventsRoutes = require('./routes/events');
const profilesRoutes = require('./routes/profiles');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/authMiddleware');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', authMiddleware, postsRoutes);
app.use('/api/stories', authMiddleware, storiesRoutes);
app.use('/api/messages', authMiddleware, messagesRoutes);
app.use('/api/communities', authMiddleware, communitiesRoutes);
app.use('/api/community-chat', authMiddleware, communityChatRoutes);
app.use('/api/events', authMiddleware, eventsRoutes);
app.use('/api/profiles', authMiddleware, profilesRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);
app.use('/api/search', authMiddleware, searchRoutes);

// Error handling middleware
app.use(errorHandler);

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;