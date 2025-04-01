const Community = require('../models/community');
const CommunityChat = require('../models/communityChat');
const { ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

class CommunityController {
  // Create new community
  static async createCommunity(req, res, next) {
    try {
      const { name, description } = req.body;
      const adminId = req.user.id;

      // Validate input
      if (!name || !description) {
        throw new ValidationError('Name and description are required');
      }

      // Create community
      const communityId = await Community.create({
        name,
        description,
        adminId
      });

      // Get created community
      const community = await Community.findById(communityId);

      res.status(201).json({
        message: 'Community created successfully',
        community
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all communities
  static async getAllCommunities(req, res, next) {
    try {
      const { search, limit = 10, offset = 0 } = req.query;
      const communities = await Community.getAll({ search, limit, offset });

      res.json({ communities });
    } catch (error) {
      next(error);
    }
  }

  // Get community by ID
  static async getCommunity(req, res, next) {
    try {
      const { id } = req.params;
      const community = await Community.findById(id);

      res.json({ community });
    } catch (error) {
      next(error);
    }
  }

  // Join community
  static async joinCommunity(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await Community.join(id, userId);

      res.json({
        message: 'Successfully joined community'
      });
    } catch (error) {
      next(error);
    }
  }

  // Leave community
  static async leaveCommunity(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await Community.leave(id, userId);

      res.json({
        message: 'Successfully left community'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get community members
  static async getCommunityMembers(req, res, next) {
    try {
      const { id } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const members = await Community.getMembers(id, { limit, offset });

      res.json({ members });
    } catch (error) {
      next(error);
    }
  }

  // Update community
  static async updateCommunity(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const adminId = req.user.id;

      await Community.update(id, adminId, { name, description });

      const updatedCommunity = await Community.findById(id);

      res.json({
        message: 'Community updated successfully',
        community: updatedCommunity
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete community
  static async deleteCommunity(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      await Community.delete(id, adminId);

      res.json({
        message: 'Community deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Chat Methods

  // Send message in community chat
  static async sendChatMessage(req, res, next) {
    try {
      const { id: communityId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;

      // Validate message
      if (!message || !message.trim()) {
        throw new ValidationError('Message cannot be empty');
      }

      const chatMessage = await CommunityChat.sendMessage(
        communityId,
        userId,
        message.trim()
      );

      res.status(201).json({
        message: 'Message sent successfully',
        chatMessage
      });
    } catch (error) {
      next(error);
    }
  }

  // Get community chat messages
  static async getChatMessages(req, res, next) {
    try {
      const { id: communityId } = req.params;
      const { limit = 50, before } = req.query;

      // Verify user is a member
      const isMember = await Community.isMember(communityId, req.user.id);
      if (!isMember) {
        throw new ForbiddenError('Only community members can view messages');
      }

      const messages = await CommunityChat.getMessages(communityId, {
        limit: parseInt(limit),
        before: before ? parseInt(before) : Date.now()
      });

      res.json({ messages });
    } catch (error) {
      next(error);
    }
  }

  // Delete chat message
  static async deleteChatMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      await CommunityChat.deleteMessage(messageId, userId);

      res.json({
        message: 'Message deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Edit chat message
  static async editChatMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const { message: newMessage } = req.body;
      const userId = req.user.id;

      if (!newMessage || !newMessage.trim()) {
        throw new ValidationError('Message cannot be empty');
      }

      const updatedMessage = await CommunityChat.editMessage(
        messageId,
        userId,
        newMessage.trim()
      );

      res.json({
        message: 'Message updated successfully',
        chatMessage: updatedMessage
      });
    } catch (error) {
      next(error);
    }
  }

  // Get chat activity
  static async getChatActivity(req, res, next) {
    try {
      const { id: communityId } = req.params;
      const { minutes = 5 } = req.query;

      const activity = await CommunityChat.getRecentActivity(communityId, {
        minutes: parseInt(minutes)
      });

      res.json({ activity });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CommunityController;