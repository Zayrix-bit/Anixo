import User from '../models/User.js';

// @desc    Get user watchlist
export const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('watchlist');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      watchlist: user.watchlist || []
    });
  } catch (error) {
    console.error("Get watchlist error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add to watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const { animeId, title, coverImage, status, progress, score } = req.body;
    
    if (!animeId || !title) {
      return res.status(400).json({ success: false, message: 'Please provide animeId and title' });
    }

    const sAnimeId = String(animeId);

    // 1. Check if it exists
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const existingIndex = user.watchlist.findIndex(item => item.animeId === sAnimeId);

    if (existingIndex > -1) {
        // UPDATE existing entry
        const updateObj = {};
        if (status) updateObj[`watchlist.${existingIndex}.status`] = status;
        if (progress !== undefined) updateObj[`watchlist.${existingIndex}.progress`] = progress;
        if (score !== undefined) updateObj[`watchlist.${existingIndex}.score`] = score;
        if (coverImage) updateObj[`watchlist.${existingIndex}.coverImage`] = coverImage;
        updateObj[`watchlist.${existingIndex}.addedAt`] = Date.now();

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateObj },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Watchlist updated',
            watchlist: updatedUser.watchlist
        });
    } else {
        // ADD new entry
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { 
                $push: { 
                    watchlist: { 
                        animeId: sAnimeId, 
                        title, 
                        coverImage, 
                        status: status || 'Planning', 
                        progress: progress || 0, 
                        score: score || 0,
                        addedAt: Date.now()
                    } 
                } 
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Added to watchlist',
            watchlist: updatedUser.watchlist
        });
    }
  } catch (error) {
    console.error("Add/Update watchlist error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove from watchlist
export const removeFromWatchlist = async (req, res) => {
  try {
    const { animeId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { watchlist: { animeId: String(animeId) } } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Removed from watchlist',
      watchlist: updatedUser.watchlist
    });
  } catch (error) {
    console.error("Remove watchlist error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Bulk import watchlist (merge or replace)
export const bulkImport = async (req, res) => {
  try {
    const { items, mode } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'No items to import' });
    }

    if (mode === "Replace") {
        const formattedItems = items.map(item => ({
            animeId: String(item.animeId),
            title: item.title || `Anime ${item.animeId}`,
            coverImage: item.coverImage || '',
            status: item.status || 'Planning',
            progress: item.progress || 0,
            score: item.score || 0,
            addedAt: Date.now()
        }));

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { watchlist: formattedItems } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Watchlist replaced',
            watchlist: updatedUser.watchlist
        });
    }

    // Merge Mode: More complex, but let's keep it safe
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    for (const item of items) {
        const sAnimeId = String(item.animeId);
        const existingIndex = user.watchlist.findIndex(w => w.animeId === sAnimeId);

        if (existingIndex > -1) {
            const existing = user.watchlist[existingIndex];
            if (item.status) existing.status = item.status;
            if (item.progress !== undefined && item.progress > existing.progress) existing.progress = item.progress;
            if (item.score !== undefined && item.score > 0) existing.score = item.score;
        } else {
            user.watchlist.push({
                animeId: sAnimeId,
                title: item.title || `Anime ${item.animeId}`,
                coverImage: item.coverImage || '',
                status: item.status || 'Planning',
                progress: item.progress || 0,
                score: item.score || 0,
                addedAt: Date.now()
            });
        }
    }

    await user.save(); // Using save here for bulk import is acceptable as it's a one-time operation

    res.status(200).json({
      success: true,
      message: 'Watchlist merged',
      watchlist: user.watchlist
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
