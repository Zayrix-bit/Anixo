/* eslint-env node */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '../.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Root endpoint to prevent "Cannot GET /" on Hugging Face Spaces
app.get('/', (req, res) => {
    res.json({ status: "ok", message: "Anigo Comments Service is running successfully!" });
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Report Schema
const reportSchema = new mongoose.Schema({
    targetId: { type: String, required: true },
    targetType: { type: String, enum: ['Comment', 'Reply'], required: true },
    reportedBy: { type: String, required: true }, // username or profileId
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// MongoDB Schema
const commentSchema = new mongoose.Schema({
    animeId: { type: String, required: true },
    episodeNumber: { type: String, required: true },
    user: {
        username: { type: String, required: true },
        profileId: { type: String },
        displayName: { type: String },
        avatar: { type: String },
        role: { type: String, default: 'user' }
    },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    dislikedBy: [{ type: String }],
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    bannedByRole: { type: String, default: null },
    bannedReason: { type: String, default: null },
    isSpoiler: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
    replies: [{
        user: {
            username: { type: String, required: true },
            profileId: { type: String },
            displayName: { type: String },
            avatar: { type: String },
            role: { type: String, default: 'user' }
        },
        content: { type: String, required: true },
        replyToId: { type: String, default: null },
        likes: { type: Number, default: 0 },
        dislikes: { type: Number, default: 0 },
        likedBy: [{ type: String }],
        dislikedBy: [{ type: String }],
        isDeleted: { type: Boolean, default: false },
        bannedByRole: { type: String, default: null },
        bannedReason: { type: String, default: null },
        isSpoiler: { type: Boolean, default: false },
        reportCount: { type: Number, default: 0 },
        reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

commentSchema.index({ animeId: 1, episodeNumber: 1, createdAt: -1 });

const Comment = mongoose.model('RealtimeComment', commentSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/anime')
    .then(() => console.log('Connected to MongoDB for Realtime Comments'))
    .catch(err => console.error('MongoDB connection error:', err));


// Initial REST fetch (Paginated)
app.get('/api/comments', async (req, res) => {
    try {
        const { animeId, episodeNumber, page = 1, limit = 50 } = req.query;
        if (!animeId || !episodeNumber) return res.status(400).json({ error: 'Missing parameters' });

        const skip = (page - 1) * limit;
        const comments = await Comment.find({ animeId, episodeNumber, isDeleted: false })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get recent global comments
app.get('/api/recent-comments', async (req, res) => {
    try {
        const { limit = 15 } = req.query;
        const comments = await Comment.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Socket.IO Logic - Verify JWT directly (no HTTP call needed)
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token || token === 'null' || token === 'undefined') return next(); // allow anonymous for reading
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Store user info - ID from JWT, username from handshake auth
        socket.user = {
            _id: decoded.id,
            id: decoded.id,
            username: socket.handshake.auth.username || ''
        };
        const userDoc = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
        if (userDoc) {
            socket.user.role = userDoc.role || 'user';
            socket.user.banUntil = userDoc.banUntil || null;
        } else {
            socket.user.role = 'user';
        }
        next();
    } catch (err) {
        socket.user = null;
        socket.jwtError = err.message;
        next();
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_episode', ({ animeId, episodeNumber }) => {
        const room = `${animeId}:${episodeNumber}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leave_episode', ({ animeId, episodeNumber }) => {
        const room = `${animeId}:${episodeNumber}`;
        socket.leave(room);
    });

    socket.on('post_comment', async (data, callback) => {
        if (!socket.user) return callback({ error: `Auth Error: ${socket.jwtError || 'No token'}. Please log out and log back in.` });
        if (socket.user.banUntil && new Date(socket.user.banUntil) > new Date()) {
            return callback({ error: `You are banned from commenting until ${new Date(socket.user.banUntil).toLocaleString()}` });
        }

        try {
            const { animeId, episodeNumber, content, avatar, username, profileId, displayName } = data;

            const finalUsername = username || socket.user.username || 'Anonymous';
            const finalProfileId = profileId || socket.handshake.auth.profileId || null;

            const newComment = new Comment({
                animeId,
                episodeNumber,
                user: {
                    username: finalUsername,
                    profileId: finalProfileId,
                    displayName: displayName || null,
                    avatar: avatar || `https://ui-avatars.com/api/?name=${finalUsername}&background=random&color=fff`,
                    role: socket.user.role || 'user'
                },
                content
            });

            await newComment.save();

            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('new_comment', newComment);
            // Emit global event for homepage live feed
            io.emit('global_new_comment', newComment);

            if (callback) callback({ success: true, comment: newComment });
        } catch (err) {
            console.error('Post comment error:', err);
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('post_reply', async (data, callback) => {
        if (!socket.user) return callback({ error: `Auth Error: ${socket.jwtError || 'No token'}. Please log out and log back in.` });
        if (socket.user.banUntil && new Date(socket.user.banUntil) > new Date()) {
            return callback({ error: `You are banned from replying until ${new Date(socket.user.banUntil).toLocaleString()}` });
        }

        try {
            const { commentId, animeId, episodeNumber, content, replyToId, avatar, username, profileId, displayName } = data;
            const comment = await Comment.findById(commentId);
            if (!comment || comment.isDeleted) return callback({ error: 'Comment not found' });

            const finalUsername = username || socket.user.username || 'Anonymous';
            const finalProfileId = profileId || socket.handshake.auth.profileId || null;

            const newReply = {
                user: {
                    username: finalUsername,
                    profileId: finalProfileId,
                    displayName: displayName || null,
                    avatar: avatar || `https://ui-avatars.com/api/?name=${finalUsername}&background=random&color=fff`,
                    role: socket.user.role || 'user'
                },
                content,
                replyToId: replyToId || null
            };

            comment.replies.push(newReply);
            await comment.save();

            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('update_comment', comment.toObject());

            // --- Reply Notification Logic ---
            try {
                // Find the saved reply (last one pushed)
                const savedReply = comment.replies[comment.replies.length - 1];
                const savedReplyId = savedReply._id.toString();

                // Determine who to notify
                let targetUsername = null;
                if (replyToId) {
                    // Replying to another reply - find that reply's author
                    const parentReply = comment.replies.find(r => r._id.toString() === replyToId);
                    if (parentReply) {
                        targetUsername = parentReply.user.username;
                    }
                }
                if (!targetUsername) {
                    // Replying to the main comment
                    targetUsername = comment.user.username;
                }

                // Don't notify yourself
                if (targetUsername && targetUsername !== finalUsername) {
                    const targetUser = await mongoose.connection.collection('users').findOne({ username: targetUsername });
                    if (targetUser) {
                        const senderName = displayName || finalProfileId || finalUsername;
                        const targetUrl = `/watch/${animeId}?animeId=${animeId}&episode=${episodeNumber}#comment-${savedReplyId}`;
                        await mongoose.connection.collection('notifications').insertOne({
                            user: targetUser._id,
                            title: `${senderName} replied to your comment`,
                            message: content.length > 80 ? content.substring(0, 80) + '...' : content,
                            type: 'REPLY',
                            targetUrl,
                            animeId,
                            episode: parseInt(episodeNumber) || null,
                            isRead: false,
                            isHidden: false,
                            createdAt: new Date()
                        });
                    }
                }
            } catch (notifErr) {
                console.error("Reply notification error (non-fatal):", notifErr.message);
            }
            // --- End Notification Logic ---

            if (callback) callback({ success: true });
        } catch (err) {
            console.error("Post Reply Error:", err);
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('vote_comment', async (data, callback) => {
        if (!socket.user) return callback({ error: 'Unauthorized. Please login.' });

        try {
            const { commentId, action, animeId, episodeNumber } = data;
            const comment = await Comment.findById(commentId);
            if (!comment || comment.isDeleted) return callback({ error: 'Comment not found' });

            const username = socket.user.username;

            let liked = comment.likedBy.includes(username);
            let disliked = comment.dislikedBy.includes(username);

            if (action === 'like') {
                if (liked) {
                    comment.likedBy = comment.likedBy.filter(u => u !== username);
                    comment.likes = Math.max(0, comment.likes - 1);
                } else {
                    comment.likedBy.push(username);
                    comment.likes += 1;
                    if (disliked) {
                        comment.dislikedBy = comment.dislikedBy.filter(u => u !== username);
                        comment.dislikes = Math.max(0, comment.dislikes - 1);
                    }
                }
            } else if (action === 'dislike') {
                if (disliked) {
                    comment.dislikedBy = comment.dislikedBy.filter(u => u !== username);
                    comment.dislikes = Math.max(0, comment.dislikes - 1);
                } else {
                    comment.dislikedBy.push(username);
                    comment.dislikes += 1;
                    if (liked) {
                        comment.likedBy = comment.likedBy.filter(u => u !== username);
                        comment.likes = Math.max(0, comment.likes - 1);
                    }
                }
            }

            await comment.save();

            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('update_comment', {
                _id: comment._id,
                likes: comment.likes,
                dislikes: comment.dislikes,
                likedBy: comment.likedBy,
                dislikedBy: comment.dislikedBy
            });

            if (callback) callback({ success: true });
        } catch (err) {
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('vote_reply', async (data, callback) => {
        if (!socket.user) return callback({ error: 'Unauthorized. Please login.' });

        try {
            const { commentId, replyId, action, animeId, episodeNumber } = data;
            const comment = await Comment.findById(commentId);
            if (!comment || comment.isDeleted) return callback({ error: 'Comment not found' });

            const reply = comment.replies.id(replyId);
            if (!reply) return callback({ error: 'Reply not found' });

            const username = socket.user.username;

            let liked = reply.likedBy?.includes(username);
            let disliked = reply.dislikedBy?.includes(username);

            if (action === 'like') {
                if (liked) {
                    reply.likedBy = reply.likedBy.filter(u => u !== username);
                    reply.likes = Math.max(0, (reply.likes || 0) - 1);
                } else {
                    reply.likedBy.push(username);
                    reply.likes = (reply.likes || 0) + 1;
                    if (disliked) {
                        reply.dislikedBy = reply.dislikedBy.filter(u => u !== username);
                        reply.dislikes = Math.max(0, (reply.dislikes || 0) - 1);
                    }
                }
            } else if (action === 'dislike') {
                if (disliked) {
                    reply.dislikedBy = reply.dislikedBy.filter(u => u !== username);
                    reply.dislikes = Math.max(0, (reply.dislikes || 0) - 1);
                } else {
                    reply.dislikedBy.push(username);
                    reply.dislikes = (reply.dislikes || 0) + 1;
                    if (liked) {
                        reply.likedBy = reply.likedBy.filter(u => u !== username);
                        reply.likes = Math.max(0, (reply.likes || 0) - 1);
                    }
                }
            }

            await comment.save();

            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('update_comment', comment.toObject());

            if (callback) callback({ success: true });
        } catch (err) {
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('delete_comment', async (data, callback) => {
        if (!socket.user) return callback({ error: 'Unauthorized' });

        try {
            const { commentId, animeId, episodeNumber } = data;
            const comment = await Comment.findById(commentId);
            if (!comment) return callback({ error: 'Comment not found' });

            if (comment.user.username !== socket.user.username && socket.user.role !== 'admin' && socket.user.role !== 'moderator') {
                return callback({ error: 'Unauthorized to delete this comment' });
            }

            comment.isDeleted = true;
            await comment.save();

            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('update_comment', comment.toObject());

            if (callback) callback({ success: true });
        } catch (err) {
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('edit_comment', async (data, callback) => {
        if (!socket.user) return callback({ error: 'Unauthorized' });
        try {
            const { commentId, animeId, episodeNumber, content } = data;
            const comment = await Comment.findById(commentId);
            if (!comment) return callback({ error: 'Comment not found' });
            if (comment.user.username !== socket.user.username) return callback({ error: 'Unauthorized' });

            comment.content = content;
            await comment.save();
            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('update_comment', comment.toObject());
            if (callback) callback({ success: true });
        } catch (err) {
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('pin_comment', async (data, callback) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'moderator')) {
            if (callback) callback({ error: 'Unauthorized: Admins and Moderators only' });
            return;
        }
        try {
            const { commentId, animeId, episodeNumber } = data;
            const comment = await Comment.findById(commentId);
            if (!comment) return callback && callback({ error: 'Comment not found' });

            comment.isPinned = !comment.isPinned; // Toggle pin status
            await comment.save();

            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('update_comment', comment.toObject());
            if (callback) callback({ success: true, isPinned: comment.isPinned });
        } catch (err) {
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('delete_reply', async (data, callback) => {
        if (!socket.user) return callback({ error: 'Unauthorized' });
        try {
            const { commentId, replyId, animeId, episodeNumber } = data;
            const comment = await Comment.findById(commentId);
            if (!comment) return callback({ error: 'Comment not found' });

            const reply = comment.replies.id(replyId);
            if (!reply) return callback({ error: 'Reply not found' });
            if (reply.user.username !== socket.user.username && socket.user.role !== 'admin' && socket.user.role !== 'moderator') {
                return callback({ error: 'Unauthorized to delete this reply' });
            }

            reply.isDeleted = true;
            await comment.save();

            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('update_comment', comment.toObject());
            if (callback) callback({ success: true });
        } catch (err) {
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('edit_reply', async (data, callback) => {
        if (!socket.user) return callback({ error: 'Unauthorized' });
        try {
            const { commentId, replyId, animeId, episodeNumber, content } = data;
            const comment = await Comment.findById(commentId);
            if (!comment) return callback({ error: 'Comment not found' });

            const reply = comment.replies.id(replyId);
            if (!reply) return callback({ error: 'Reply not found' });
            if (reply.user.username !== socket.user.username) return callback({ error: 'Unauthorized' });

            reply.content = content;
            await comment.save();

            const room = `${animeId}:${episodeNumber}`;
            io.to(room).emit('update_comment', comment.toObject());
            if (callback) callback({ success: true });
        } catch (err) {
            if (callback) callback({ error: err.message });
        }
    });

    socket.on('report_comment', async (data, callback) => {
        if (!socket.user) return callback({ error: 'Auth Error: You must be logged in to report.' });
        try {
            const { targetId, targetType, reason, animeId, episodeNumber, commentId } = data; // commentId is provided if targetType is 'Reply'

            // Check if already reported by this user
            const existingReport = await Report.findOne({ targetId, reportedBy: socket.user.username });
            if (existingReport) return callback({ error: 'You have already reported this item.' });

            // Create Report
            const report = new Report({
                targetId,
                targetType,
                reportedBy: socket.user.username,
                reason
            });
            await report.save();

            // Find the item to update
            let mainComment = null;
            let targetItem = null;
            let targetUsername = null;

            if (targetType === 'Comment') {
                mainComment = await Comment.findById(targetId);
                targetItem = mainComment;
                if (mainComment) targetUsername = mainComment.user.username;
            } else if (targetType === 'Reply') {
                mainComment = await Comment.findById(commentId);
                if (mainComment) {
                    targetItem = mainComment.replies.id(targetId);
                    if (targetItem) targetUsername = targetItem.user.username;
                }
            }

            if (!targetItem || !mainComment) return callback({ error: 'Item not found.' });

            targetItem.reportCount += 1;
            targetItem.reports.push(report._id);

            // Punishment Threshold Logic
            const THRESHOLD = 10;
            if (targetItem.reportCount >= THRESHOLD && !targetItem.bannedByRole) {
                let isTargetAdminOrMod = false;
                if (targetUsername) {
                    const targetUser = await mongoose.connection.collection('users').findOne({ username: targetUsername });
                    isTargetAdminOrMod = targetUser && (targetUser.role === 'admin' || targetUser.role === 'moderator');
                }

                if (!isTargetAdminOrMod && (reason === 'Abuse or Harassment' || reason === 'Spam or Misleading')) {
                    targetItem.bannedByRole = 'system (reports)';
                    targetItem.bannedReason = `Auto-restricted due to multiple reports (${reason})`;

                    // Auto-ban
                    if (targetUsername) {
                        const banDays = reason === 'Abuse or Harassment' ? 7 : 1;
                        const banUntil = new Date(Date.now() + banDays * 24 * 60 * 60 * 1000);
                        await mongoose.connection.collection('users').updateOne(
                            { username: targetUsername },
                            { $set: { banUntil, bannedByRole: 'system (reports)' } }
                        );

                        // Update any active sockets for this user
                        for (let [_, s] of io.sockets.sockets) {
                            if (s.user && s.user.username === targetUsername) {
                                s.user.banUntil = banUntil;
                            }
                        }
                    }
                } else if (reason === 'Contains Spoilers') {
                    targetItem.isSpoiler = true; // Auto-blur
                }
            }

            await mainComment.save();

            if (animeId && episodeNumber) {
                const room = `${animeId}:${episodeNumber}`;
                io.to(room).emit('update_comment', mainComment.toObject());
            }

            if (callback) callback({ success: true });
        } catch (err) {
            console.error('Report comment error:', err);
            if (callback) callback({ error: 'Failed to process report.' });
        }
    });

    socket.on('admin_ban_user', async (data, callback) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'moderator')) {
            return callback({ error: 'Auth Error: You do not have permission to ban users.' });
        }
        try {
            const { targetUsername, durationHours, commentId, replyId, animeId, episodeNumber, reason } = data;

            if (!targetUsername || !durationHours) return callback({ error: 'Missing target user or duration.' });

            const targetUser = await mongoose.connection.collection('users').findOne({ username: targetUsername });
            if (targetUser && (targetUser.role === 'admin' || targetUser.role === 'moderator')) {
                return callback({ error: 'Auth Error: Cannot ban an admin or moderator.' });
            }

            const banUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);

            const result = await mongoose.connection.collection('users').updateOne(
                { username: targetUsername },
                { $set: { banUntil, bannedByRole: socket.user.role } }
            );

            if (result.matchedCount === 0) {
                return callback({ error: 'User not found.' });
            }

            // Also restrict the comment that was used to ban the user
            if (commentId) {
                const comment = await Comment.findById(commentId);
                if (comment) {
                    if (replyId) {
                        const reply = comment.replies.id(replyId);
                        if (reply) {
                            reply.isDeleted = false;
                            reply.bannedByRole = socket.user.role;
                            reply.bannedReason = reason || 'Violation of community guidelines';
                        }
                    } else {
                        comment.isDeleted = false;
                        comment.bannedByRole = socket.user.role;
                        comment.bannedReason = reason || 'Violation of community guidelines';
                    }
                    await comment.save();

                    if (animeId && episodeNumber) {
                        const room = `${animeId}:${episodeNumber}`;
                        io.to(room).emit('update_comment', comment.toObject());
                    }
                }
            }

            // Update any active sockets for this user
            for (let [_, s] of io.sockets.sockets) {
                if (s.user && s.user.username === targetUsername) {
                    s.user.banUntil = banUntil;
                }
            }

            if (callback) callback({ success: true, message: `User ${targetUsername} has been banned for ${durationHours} hours.` });
        } catch (err) {
            console.error('Admin ban error:', err);
            if (callback) callback({ error: 'Failed to ban user.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.COMMENT_PORT || process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Comment service running on port ${PORT}`);
});
