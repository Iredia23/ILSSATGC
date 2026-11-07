import Notification from "../models/Notification.js";

/**
 * @desc    Create a notification (called internally)
 */
export const createNotification = async ({ type, message, userData, targetRole }) => {
  try {
    await Notification.create({ type, message, userData, targetRole });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

/**
 * @desc    Get notifications (polling endpoint)
 * @route   GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const { since, limit = 50 } = req.query;

    const query = { targetRole: req.user?.role || "Admin" };
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Mark as read by this user
    const userId = req.user?._id;
    if (userId) {
      await Notification.updateMany(
        {
          _id: { $in: notifications.map((n) => n._id) },
          "readBy.userId": { $ne: userId },
        },
        { $push: { readBy: { userId } } }
      );
    }

    res.json({
      success: true,
      notifications: notifications.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        message: n.message,
        user: n.userData,
        timestamp: n.createdAt,
        read: userId ? n.readBy.some((r) => r.userId?.toString() === userId.toString()) : false,
      })),
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read
 */
export const markAllRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    await Notification.updateMany(
      { "readBy.userId": { $ne: userId } },
      { $push: { readBy: { userId } } }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Clear all notifications
 * @route   DELETE /api/notifications
 */
export const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ targetRole: req.user?.role || "Admin" });
    res.json({ success: true, message: "Notifications cleared" });
  } catch (err) {
    console.error("Clear notifications error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
