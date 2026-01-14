import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, Star, ThumbsUp, ThumbsDown, Clock, AlertCircle, 
  CheckCircle, MoreHorizontal, Eye, Trash2, Download, RefreshCw,
  MessageSquare, User, Smartphone, Monitor, Tablet, Tv
} from "lucide-react";
import api from "../../../../api/axios"; // Adjust path as needed

export default function FeedbackManager() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    feedback_type: "",
    status: "",
    platform: "",
    rating: "",
    sortBy: "created_at",
    sortOrder: "DESC",
    page: 1,
    limit: 20,
    date_start: "",
    date_end: "",
    allow_contact: ""
  });

  const LIMIT = 20;

  // Categories for filtering
  const feedbackCategories = [
    { value: "FEATURE_REQUEST", label: "Feature Request" },
    { value: "BUG_REPORT", label: "Bug Report" },
    { value: "STREAMING_ISSUE", label: "Streaming Issue" },
    { value: "CONTENT_SUGGESTION", label: "Content Suggestion" },
    { value: "ACCOUNT_ISSUE", label: "Account Issue" },
    { value: "PAYMENT_ISSUE", label: "Payment Issue" },
    { value: "WEBSITE_APP_FEEDBACK", label: "Website/App Feedback" },
    { value: "CUSTOMER_SERVICE", label: "Customer Service" },
    { value: "GENERAL_FEEDBACK", label: "General Feedback" },
    { value: "LIKE_DISLIKE", label: "Like/Dislike" }
  ];

  const feedbackTypes = [
    { value: "LIKE", label: "Like", icon: ThumbsUp, color: "text-green-600" },
    { value: "DISLIKE", label: "Dislike", icon: ThumbsDown, color: "text-red-600" },
    { value: "DETAILED", label: "Detailed", icon: MessageSquare, color: "text-blue-600" }
  ];

  const statusOptions = [
    { value: "NEW", label: "New", color: "bg-blue-100 text-blue-800" },
    { value: "REVIEWED", label: "Reviewed", color: "bg-purple-100 text-purple-800" },
    { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
    { value: "RESOLVED", label: "Resolved", color: "bg-green-100 text-green-800" },
    { value: "CLOSED", label: "Closed", color: "bg-gray-100 text-gray-800" }
  ];

  const platformOptions = [
    { value: "WEB", label: "Web", icon: Monitor },
    { value: "ANDROID", label: "Android", icon: Smartphone },
    { value: "IOS", label: "iOS", icon: Smartphone },
    { value: "SMART_TV", label: "Smart TV", icon: Tv },
    { value: "TABLET", label: "Tablet", icon: Tablet },
    { value: "DESKTOP_APP", label: "Desktop App", icon: Monitor }
  ];

  // Fetch feedbacks
  const fetchFeedbacks = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      
      // Add all filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value);
        }
      });

      const response = await api.get(`/contact/admin/feedback?${params}`);
      
      if (response.data.success) {
        const fetchedFeedbacks = response.data.data.feedbacks || [];
        const total = response.data.data.pagination?.totalFeedbacks || fetchedFeedbacks.length;

        if (reset) {
          setFeedbacks(fetchedFeedbacks);
        } else {
          setFeedbacks(prev => [...prev, ...fetchedFeedbacks]);
        }
        
        setTotalFeedbacks(total);
        setHasMore(fetchedFeedbacks.length === LIMIT);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, loading]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  // Handle feedback click to view details
  const handleFeedbackClick = (feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailModalOpen(true);
  };

  // Handle status update
  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      const response = await api.put(`/contact/admin/feedback/${feedbackId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        // Update local state
        setFeedbacks(prev => 
          prev.map(fb => 
            fb.id === feedbackId ? { ...fb, status: newStatus } : fb
          )
        );
        
        if (selectedFeedback && selectedFeedback.id === feedbackId) {
          setSelectedFeedback(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error("Error updating feedback status:", err);
    }
  };

  // Handle delete feedback
  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const response = await api.delete(`/contact/admin/feedback/${feedbackId}`);

      if (response.data.success) {
        // Remove from local state
        setFeedbacks(prev => prev.filter(fb => fb.id !== feedbackId));
        
        if (selectedFeedback && selectedFeedback.id === feedbackId) {
          setIsDetailModalOpen(false);
          setSelectedFeedback(null);
        }
      }
    } catch (err) {
      console.error("Error deleting feedback:", err);
    }
  };

  // Export feedbacks as CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "" && key !== 'page' && key !== 'limit') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/contact/admin/feedback/export?${params}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `feedback_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting feedback:", err);
      alert("Failed to export feedback.");
    }
  };

  // Refresh feedbacks
  const handleRefresh = () => {
    fetchFeedbacks(true);
  };

  // Load more feedbacks
  const loadMore = () => {
    if (!loading && hasMore) {
      handleFilterChange('page', filters.page + 1);
    }
  };

  // Fetch feedbacks when filters change
  useEffect(() => {
    fetchFeedbacks(true);
  }, [
    filters.search,
    filters.category,
    filters.feedback_type,
    filters.status,
    filters.platform,
    filters.rating,
    filters.sortBy,
    filters.sortOrder,
    filters.date_start,
    filters.date_end,
    filters.allow_contact
  ]);

  // Also fetch when page changes (for load more)
  useEffect(() => {
    if (filters.page > 1) {
      fetchFeedbacks(false);
    }
  }, [filters.page]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get platform icon
  const getPlatformIcon = (platform) => {
    const option = platformOptions.find(p => p.value === platform);
    return option ? option.icon : Monitor;
  };

  // Get feedback type icon and color
  const getFeedbackTypeIcon = (type) => {
    const option = feedbackTypes.find(t => t.value === type);
    return option || { icon: MessageSquare, color: "text-gray-600" };
  };

  return (
    <div className="w-full">
      {/* Header with filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              User Feedback ({totalFeedbacks})
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Read-only feedback from users
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search in names, emails, or messages..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {feedbackCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={filters.feedback_type}
              onChange={(e) => handleFilterChange('feedback_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              {feedbackTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.date_start}
              onChange={(e) => handleFilterChange('date_start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Date End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.date_end}
              onChange={(e) => handleFilterChange('date_end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Platform Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Platform
            </label>
            <select
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Platforms</option>
              {platformOptions.map(platform => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Ratings</option>
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>
                  {num} Star{num > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {feedbacks.length === 0 && !loading ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No feedback</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No feedback found matching your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User / Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type / Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {feedbacks.map((feedback) => {
                  const TypeIcon = getFeedbackTypeIcon(feedback.feedback_type).icon;
                  const PlatformIcon = getPlatformIcon(feedback.platform);
                  const statusInfo = statusOptions.find(s => s.value === feedback.status);
                  
                  return (
                    <tr 
                      key={feedback.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleFeedbackClick(feedback)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 p-1.5 text-gray-500 dark:text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {feedback.user_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {feedback.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TypeIcon className="h-5 w-5 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {feedbackCategories.find(c => c.value === feedback.category)?.label || feedback.category}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {feedbackTypes.find(t => t.value === feedback.feedback_type)?.label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 dark:text-white truncate">
                            {feedback.message || (feedback.feedback_type === 'LIKE' ? 'User liked something' : 'User disliked something')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {feedback.rating ? (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                              ({feedback.rating}/5)
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <PlatformIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {platformOptions.find(p => p.value === feedback.platform)?.label || feedback.platform}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusInfo?.label || feedback.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(feedback.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedbackClick(feedback);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFeedback(feedback.id);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading feedback...</p>
          </div>
        )}

        {/* Load more button */}
        {hasMore && !loading && feedbacks.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <button
              onClick={loadMore}
              className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {isDetailModalOpen && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Feedback Details
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: #{selectedFeedback.id}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Feedback Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* User Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">User Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">{selectedFeedback.user_name}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedFeedback.user_email}</span>
                    </div>
                    {selectedFeedback.allow_contact && (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">Allowed to contact</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback Metadata */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Feedback Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {feedbackCategories.find(c => c.value === selectedFeedback.category)?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                      <div className="flex items-center">
                        {(() => {
                          const typeInfo = getFeedbackTypeIcon(selectedFeedback.feedback_type);
                          const Icon = typeInfo.icon;
                          return (
                            <>
                              <Icon className={`h-4 w-4 mr-1 ${typeInfo.color}`} />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {feedbackTypes.find(t => t.value === selectedFeedback.feedback_type)?.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Platform</p>
                      <div className="flex items-center">
                        {(() => {
                          const PlatformIcon = getPlatformIcon(selectedFeedback.platform);
                          return (
                            <>
                              <PlatformIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {platformOptions.find(p => p.value === selectedFeedback.platform)?.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedFeedback.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message/Rating Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {selectedFeedback.feedback_type === 'DETAILED' ? 'Detailed Feedback' : 'Feedback'}
                  </h4>
                  {selectedFeedback.rating && (
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < selectedFeedback.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {selectedFeedback.rating}/5
                      </span>
                    </div>
                  )}
                </div>
                
                {selectedFeedback.message ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedFeedback.message}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
                      {selectedFeedback.feedback_type === 'LIKE' ? (
                        <>
                          <ThumbsUp className="h-5 w-5 mr-2 text-green-500" />
                          <span>User liked something</span>
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-5 w-5 mr-2 text-red-500" />
                          <span>User disliked something</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* System Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">System Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {selectedFeedback.ip_address || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedFeedback.updated_at ? formatDate(selectedFeedback.updated_at) : 'Never'}
                    </p>
                  </div>
                </div>
                {selectedFeedback.user_agent && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">User Agent</p>
                    <p className="text-xs font-mono text-gray-900 dark:text-white truncate">
                      {selectedFeedback.user_agent}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <select
                    value={selectedFeedback.status}
                    onChange={(e) => handleStatusUpdate(selectedFeedback.id, e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                  >
                    Delete Feedback
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}