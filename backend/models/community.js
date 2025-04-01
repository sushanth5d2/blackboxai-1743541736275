const { query, queryOne, run } = require('./db');
const { NotFoundError } = require('../middleware/errorHandler');

class Community {
  // Create a new community
  static async create({ name, description, adminId }) {
    try {
      const result = await run(
        'INSERT INTO communities (name, description, admin_id) VALUES (?, ?, ?)',
        [name, description, adminId]
      );

      // Add admin as a member automatically
      await run(
        'INSERT INTO community_members (community_id, user_id) VALUES (?, ?)',
        [result.id, adminId]
      );

      return result.id;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed: communities.name')) {
        throw new Error('Community name already exists');
      }
      throw error;
    }
  }

  // Get community by ID
  static async findById(id) {
    const community = await queryOne(
      `SELECT c.*, u.username as admin_username,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
       FROM communities c
       JOIN users u ON u.id = c.admin_id
       WHERE c.id = ?`,
      [id]
    );

    if (!community) {
      throw new NotFoundError('Community not found');
    }

    return community;
  }

  // Get all communities (with optional search and pagination)
  static async getAll({ search = '', limit = 10, offset = 0 } = {}) {
    const communities = await query(
      `SELECT c.*, u.username as admin_username,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
       FROM communities c
       JOIN users u ON u.id = c.admin_id
       WHERE c.name LIKE ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset]
    );

    return communities;
  }

  // Join community
  static async join(communityId, userId) {
    try {
      await run(
        'INSERT INTO community_members (community_id, user_id) VALUES (?, ?)',
        [communityId, userId]
      );
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('User is already a member of this community');
      }
      throw error;
    }
  }

  // Leave community
  static async leave(communityId, userId) {
    const result = await run(
      'DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
      [communityId, userId]
    );

    if (result.changes === 0) {
      throw new Error('User is not a member of this community');
    }
  }

  // Check if user is member
  static async isMember(communityId, userId) {
    const member = await queryOne(
      'SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?',
      [communityId, userId]
    );
    return !!member;
  }

  // Get community members
  static async getMembers(communityId, { limit = 10, offset = 0 } = {}) {
    return await query(
      `SELECT u.id, u.username, u.email, cm.joined_at
       FROM community_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.community_id = ?
       ORDER BY cm.joined_at DESC
       LIMIT ? OFFSET ?`,
      [communityId, limit, offset]
    );
  }

  // Get user's communities
  static async getUserCommunities(userId) {
    return await query(
      `SELECT c.*, u.username as admin_username,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
       FROM communities c
       JOIN community_members cm ON cm.community_id = c.id
       JOIN users u ON u.id = c.admin_id
       WHERE cm.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );
  }

  // Update community
  static async update(communityId, adminId, { name, description }) {
    // Verify admin
    const community = await this.findById(communityId);
    if (community.admin_id !== adminId) {
      throw new Error('Only admin can update community details');
    }

    try {
      await run(
        'UPDATE communities SET name = ?, description = ? WHERE id = ?',
        [name, description, communityId]
      );
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed: communities.name')) {
        throw new Error('Community name already exists');
      }
      throw error;
    }
  }

  // Delete community
  static async delete(communityId, adminId) {
    // Verify admin
    const community = await this.findById(communityId);
    if (community.admin_id !== adminId) {
      throw new Error('Only admin can delete community');
    }

    await run('DELETE FROM communities WHERE id = ?', [communityId]);
  }
}

module.exports = Community;