const { query, queryOne, run } = require('./db');
const Community = require('./community');
const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

class CommunityChat {
  // Send a message in community chat
  static async sendMessage(communityId, userId, message) {
    try {
      // Check if user is a member of the community
      const isMember = await Community.isMember(communityId, userId);
      if (!isMember) {
        throw new ForbiddenError('Only community members can send messages');
      }

      // Insert the message
      const result = await run(
        'INSERT INTO community_chat (community_id, user_id, message) VALUES (?, ?, ?)',
        [communityId, userId, message]
      );

      // Get the inserted message with user details
      const chatMessage = await queryOne(
        `SELECT cc.*, u.username, u.email
         FROM community_chat cc
         JOIN users u ON u.id = cc.user_id
         WHERE cc.id = ?`,
        [result.id]
      );

      return chatMessage;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error('Failed to send message');
    }
  }

  // Get chat messages for a community
  static async getMessages(communityId, { limit = 50, before = Date.now() } = {}) {
    try {
      // Check if community exists
      const community = await Community.findById(communityId);
      if (!community) {
        throw new NotFoundError('Community not found');
      }

      // Get messages with user details
      const messages = await query(
        `SELECT cc.*, u.username, u.email
         FROM community_chat cc
         JOIN users u ON u.id = cc.user_id
         WHERE cc.community_id = ? 
         AND cc.created_at < datetime(?, 'unixepoch', 'millisecond')
         ORDER BY cc.created_at DESC
         LIMIT ?`,
        [communityId, before, limit]
      );

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error('Failed to fetch messages');
    }
  }

  // Delete a message (only by message sender or community admin)
  static async deleteMessage(messageId, userId) {
    try {
      // Get message with community details
      const message = await queryOne(
        `SELECT cc.*, c.admin_id
         FROM community_chat cc
         JOIN communities c ON c.id = cc.community_id
         WHERE cc.id = ?`,
        [messageId]
      );

      if (!message) {
        throw new NotFoundError('Message not found');
      }

      // Check if user is the message sender or community admin
      if (message.user_id !== userId && message.admin_id !== userId) {
        throw new ForbiddenError('You can only delete your own messages or messages in communities you admin');
      }

      // Delete the message
      await run('DELETE FROM community_chat WHERE id = ?', [messageId]);

      return true;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error('Failed to delete message');
    }
  }

  // Edit a message (only by message sender)
  static async editMessage(messageId, userId, newMessage) {
    try {
      // Get message
      const message = await queryOne(
        'SELECT * FROM community_chat WHERE id = ?',
        [messageId]
      );

      if (!message) {
        throw new NotFoundError('Message not found');
      }

      // Check if user is the message sender
      if (message.user_id !== userId) {
        throw new ForbiddenError('You can only edit your own messages');
      }

      // Update the message
      await run(
        'UPDATE community_chat SET message = ? WHERE id = ?',
        [newMessage, messageId]
      );

      // Get updated message with user details
      const updatedMessage = await queryOne(
        `SELECT cc.*, u.username, u.email
         FROM community_chat cc
         JOIN users u ON u.id = cc.user_id
         WHERE cc.id = ?`,
        [messageId]
      );

      return updatedMessage;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error('Failed to edit message');
    }
  }

  // Get recent chat activity for a community
  static async getRecentActivity(communityId, { minutes = 5 } = {}) {
    try {
      const activity = await query(
        `SELECT COUNT(*) as message_count,
         COUNT(DISTINCT user_id) as active_users
         FROM community_chat
         WHERE community_id = ?
         AND created_at >= datetime('now', ?, 'minutes')`,
        [communityId, -minutes]
      );

      return activity[0];
    } catch (error) {
      throw new Error('Failed to fetch chat activity');
    }
  }
}

module.exports = CommunityChat;