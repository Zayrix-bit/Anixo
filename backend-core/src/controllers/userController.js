import User from '../models/User.js';
import Progress from '../models/Progress.js';
import mongoose from 'mongoose';

// @desc    Get public user profile
// @route   GET /api/users/:profileId
// @access  Public

export const getPublicProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    // Find the user by profileId, username, or _id
    const orQuery = [
      { profileId: profileId },
      { username: profileId }
    ];

    if (mongoose.Types.ObjectId.isValid(profileId)) {
      orQuery.push({ _id: profileId });
    }

    const user = await User.findOne({ $or: orQuery }).select('-password -email -resetPasswordToken -resetPasswordExpire');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's progress (recently watched)
    const progressList = await Progress.find({ user: user._id })
      .sort({ updatedAt: -1 })
      .limit(20);

    // Get user's recent comments from realtimecomments collection
    const recentComments = await mongoose.connection.db.collection('realtimecomments')
      .find({ 'user.profileId': user.profileId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Map watchlist to a public format (hiding any internal IDs if necessary, though they are usually safe)
    const publicWatchlist = user.watchlist || [];

    // Calculate accurate total episodes watched using aggregation
    const statsAgg = await Progress.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, totalEpisodes: { $sum: "$episode" } } }
    ]);
    const trueTotalEpisodes = statsAgg.length > 0 ? statsAgg[0].totalEpisodes : 0;

    res.json({
      success: true,
      profile: {
        id: user._id,
        username: user.username,
        profileId: user.profileId,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        anilistConnected: !!(user.anilist && user.anilist.id),
        banUntil: user.banUntil,
        bannedByRole: user.bannedByRole
      },
      stats: {
        totalAnime: publicWatchlist.length,
        totalEpisodesWatched: trueTotalEpisodes
      },
      watchlist: publicWatchlist,
      recentProgress: progressList,
      recentComments: recentComments
    });
  } catch (error) {
    console.error("GET PUBLIC PROFILE ERROR:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
