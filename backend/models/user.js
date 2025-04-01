const { query, queryOne, run } = require('./db');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create({ username, email, password }) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const result = await run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      // Create profile for the user
      await run(
        'INSERT INTO profiles (user_id) VALUES (?)',
        [result.id]
      );

      return result.id;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        if (error.message.includes('username')) {
          throw new Error('Username already exists');
        } else if (error.message.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    return await queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
  }

  // Find user by id
  static async findById(id) {
    return await queryOne(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    );
  }

  // Update user profile
  static async updateProfile(userId, { bio, skills, interests }) {
    return await run(
      'UPDATE profiles SET bio = ?, skills = ?, interests = ? WHERE user_id = ?',
      [bio, skills, interests, userId]
    );
  }

  // Get user profile
  static async getProfile(userId) {
    return await queryOne(
      `SELECT p.*, u.username, u.email 
       FROM profiles p 
       JOIN users u ON u.id = p.user_id 
       WHERE p.user_id = ?`,
      [userId]
    );
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Change password
  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
  }

  // Search users
  static async search(searchTerm, limit = 10) {
    return await query(
      `SELECT id, username, email 
       FROM users 
       WHERE username LIKE ? OR email LIKE ? 
       LIMIT ?`,
      [`%${searchTerm}%`, `%${searchTerm}%`, limit]
    );
  }

  // Get user stats
  static async getStats(userId) {
    const stats = {
      posts: 0,
      followers: 0,
      following: 0,
      communities: 0
    };

    // Get post count
    const postCount = await queryOne(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [userId]
    );
    stats.posts = postCount.count;

    // Get community count
    const communityCount = await queryOne(
      'SELECT COUNT(*) as count FROM community_members WHERE user_id = ?',
      [userId]
    );
    stats.communities = communityCount.count;

    return stats;
  }
}

module.exports = User;