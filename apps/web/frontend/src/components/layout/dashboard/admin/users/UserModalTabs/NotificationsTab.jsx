// src/components/dashboard/admin/Users/UserModalTabs/NotificationsTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  Bell, Mail, Send, RefreshCw, Eye, EyeOff, Clock, Calendar,
  CheckCircle, XCircle, AlertCircle, Info, User, Filter,
  ChevronLeft, ChevronRight, Download, Archive
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

const NotificationsTab = ({ userDetails, userId }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const [sendForm, setSendForm] = useState({
    title: "",
    message: "",
    sendType: "both", // "notification", "email", "both"
    priority: "normal",
    type: "admin_message"
  });

  const notificationTypes = [
    { value: "admin_message", label: "Admin Message", icon: Bell, color: "text-blue-400" },
    { value: "system_alert", label: "System Alert", icon: AlertCircle, color: "text-yellow-400" },
    { value: "subscription", label: "Subscription", icon: CheckCircle, color: "text-green-400" },
    { value: "security", label: "Security", icon: Info, color: "text-red-400" },
    { value: "promotional", label: "Promotional", icon: Send, color: "text-purple-400" }
  ];

  const priorityLevels = [
    { value: "low", label: "Low", color: "text-gray-400", bg: "bg-gray-400/10" },
    { value: "normal", label: "Normal", color: "text-blue-400", bg: "bg-blue-400/10" },
    { value: "high", label: "High", color: "text-orange-400", bg: "bg-orange-400/10" },
    { value: "urgent", label: "Urgent", color: "text-red-400", bg: "bg-red-400/10" }
  ];

  const statusTypes = [
    { value: "unread", label: "Unread", color: "text-blue-400", bg: "bg-blue-400/10" },
    { value: "read", label: "Read", color: "text-green-400", bg: "bg-green-400/10" },
    { value: "archived", label: "Archived", color: "text-gray-400", bg: "bg-gray-400/10" }
  ];

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get(`/user/${userId}/notifications`, { params });
      
      setNotifications(response.data.notifications || []);
      setTotalNotifications(response.data.total || 0);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error("❌ Failed to fetch notifications:", error);
      setNotifications([]);
      setTotalNotifications(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSendNotification = async () => {
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      alert("Please fill in both title and message");
      return;
    }

    try {
      setIsSending(true);
      await api.post(`/user/${userId}/send-notification`, sendForm);
      
      // Reset form and refresh
      setSendForm({
        title: "",
        message: "",
        sendType: "both",
        priority: "normal",
        type: "admin_message"
      });
      setShowSendForm(false);
      
      // Refresh notifications if notification was sent
      if (sendForm.sendType !== "email") {
        await fetchNotifications();
      }
      
      alert("Message sent successfully!");
    } catch (error) {
      console.error("❌ Failed to send notification:", error);
      alert(error.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/user/${userId}/notifications/${notificationId}/read`);
      await fetchNotifications(); // Refresh list
    } catch (error) {
      console.error("❌ Failed to mark as read:", error);
    }
  };

  const handleArchiveNotification = async (notificationId) => {
    try {
      await api.put(`/user/${userId}/notifications/${notificationId}/archive`);
      await fetchNotifications(); // Refresh list
    } catch (error) {
      console.error("❌ Failed to archive notification:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getNotificationTypeConfig = (type) => {
    const notificationType = notificationTypes.find(t => t.value === type);
    if (!notificationType) return { label: type, icon: Bell, color: "text-gray-400" };
    return notificationType;
  };

  const getPriorityConfig = (priority) => {
    const priorityConfig = priorityLevels.find(p => p.value === priority);
    if (!priorityConfig) return { label: priority, color: "text-gray-400", bg: "bg-gray-400/10" };
    return priorityConfig;
  };

  const getStatusConfig = (status) => {
    const statusConfig = statusTypes.find(s => s.value === status);
    if (!statusConfig) return { label: status, color: "text-gray-400", bg: "bg-gray-400/10" };
    return statusConfig;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDateTime(dateString);
    } catch (error) {
      return "";
    }
  };

  const totalPages = Math.ceil(totalNotifications / pagination.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications & Emails</span>
          </h3>
          <p className="text-gray-400 text-sm">
            Send messages and manage notifications for this user
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSendForm(!showSendForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send Message</span>
          </button>
          <button
            onClick={fetchNotifications}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Send Message Form */}
      {showSendForm && (
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4 border border-purple-500/30">
          <h4 className="text-white font-semibold flex items-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Send Message to User</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Title *</label>
              <input
                type="text"
                value={sendForm.title}
                onChange={(e) => setSendForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter message title"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
              <select
                value={sendForm.type}
                onChange={(e) => setSendForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Send As</label>
              <select
                value={sendForm.sendType}
                onChange={(e) => setSendForm(prev => ({ ...prev, sendType: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="notification">Notification Only</option>
                <option value="email">Email Only</option>
                <option value="both">Both Notification & Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
              <select
                value={sendForm.priority}
                onChange={(e) => setSendForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
              >
                {priorityLevels.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Message *</label>
            <textarea
              value={sendForm.message}
              onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter your message here..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm resize-vertical"
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowSendForm(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSendNotification}
              disabled={isSending || !sendForm.title.trim() || !sendForm.message.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send Message</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </div>

          <div className="sm:w-40">
            <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
            >
              <option value="">All Types</option>
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:w-32">
            <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
            >
              <option value="">All Status</option>
              {statusTypes.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-semibold">
            User Notifications ({totalNotifications})
          </h4>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h4 className="text-gray-400 font-medium text-lg mb-2">No notifications found</h4>
            <p className="text-gray-500 text-sm">
              {filters.search || filters.type || filters.status ? 
                "Try adjusting your filters to see more results" : 
                "No notifications have been sent to this user yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => {
                const typeConfig = getNotificationTypeConfig(notification.type);
                const priorityConfig = getPriorityConfig(notification.priority);
                const statusConfig = getStatusConfig(notification.status);
                const IconComponent = typeConfig.icon;

                return (
                  <div
                    key={notification.id}
                    className={clsx(
                      "bg-gray-800/50 rounded-lg p-4 border transition-all",
                      notification.status === "unread" 
                        ? "border-purple-500/30 bg-purple-500/5" 
                        : "border-gray-700/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className={clsx("p-2 rounded-lg", priorityConfig.bg)}>
                          <IconComponent className={clsx("w-4 h-4", typeConfig.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className={clsx(
                              "text-sm font-semibold truncate",
                              notification.status === "unread" ? "text-white" : "text-gray-300"
                            )}>
                              {notification.title}
                            </h5>
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              priorityConfig.bg,
                              priorityConfig.color
                            )}>
                              {priorityConfig.label}
                            </span>
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-2 whitespace-pre-wrap">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{getTimeAgo(notification.created_at)}</span>
                            </div>
                            <span className={clsx(
                              "px-2 py-0.5 rounded-full",
                              statusConfig.bg,
                              statusConfig.color
                            )}>
                              {statusConfig.label}
                            </span>
                            {notification.read_at && (
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>Read {getTimeAgo(notification.read_at)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        {notification.status === "unread" && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-green-400 transition-colors"
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleArchiveNotification(notification.id)}
                          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                <div className="text-gray-400 text-sm">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalNotifications)} of {totalNotifications} notifications
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={clsx(
                            "px-3 py-1 rounded-lg text-sm font-medium",
                            pagination.page === pageNum
                              ? "bg-purple-600 text-white"
                              : "text-gray-400 hover:bg-gray-700"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;