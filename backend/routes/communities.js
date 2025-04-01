const express = require('express');
const router = express.Router();
const CommunityController = require('../controllers/communityController');

// Community Management Routes
router.post('/', CommunityController.createCommunity);
router.get('/', CommunityController.getAllCommunities);
router.get('/:id', CommunityController.getCommunity);
router.put('/:id', CommunityController.updateCommunity);
router.delete('/:id', CommunityController.deleteCommunity);

// Community Membership Routes
router.post('/:id/join', CommunityController.joinCommunity);
router.delete('/:id/leave', CommunityController.leaveCommunity);
router.get('/:id/members', CommunityController.getCommunityMembers);

// Community Chat Routes
router.get('/:id/chat', CommunityController.getChatMessages);
router.post('/:id/chat', CommunityController.sendChatMessage);
router.put('/:id/chat/:messageId', CommunityController.editChatMessage);
router.delete('/:id/chat/:messageId', CommunityController.deleteChatMessage);
router.get('/:id/chat/activity', CommunityController.getChatActivity);

module.exports = router;