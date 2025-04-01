const User = require('../models/user');
const { generateToken } = require('../utils/jwt');
const { ValidationError, UnauthorizedError } = require('../middleware/errorHandler');

class AuthController {
  // Register new user
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // Validate input
      if (!username || !email || !password) {
        throw new ValidationError('Username, email, and password are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Validate password strength
      if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
      }

      // Create user
      const userId = await User.create({
        username,
        email,
        password
      });

      // Generate token
      const token = generateToken(userId);

      // Get user data (excluding password)
      const user = await User.findById(userId);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate token
      const token = generateToken(user.id);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current user profile
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Get user profile with stats
      const profile = await User.getProfile(userId);
      const stats = await User.getStats(userId);

      res.json({
        profile: {
          ...profile,
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { bio, skills, interests } = req.body;

      await User.updateProfile(userId, {
        bio: bio || '',
        skills: skills || '',
        interests: interests || ''
      });

      const updatedProfile = await User.getProfile(userId);

      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  static async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        throw new ValidationError('Current password and new password are required');
      }

      // Get user with password
      const user = await User.findByEmail(req.user.email);

      // Verify current password
      const isValidPassword = await User.verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Validate new password
      if (newPassword.length < 6) {
        throw new ValidationError('New password must be at least 6 characters long');
      }

      // Update password
      await User.changePassword(userId, newPassword);

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;