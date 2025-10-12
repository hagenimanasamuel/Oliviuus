import React from "react";
import { Mail, Clock, AlertCircle, CheckCircle, MessageSquare, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ContactsList({ contacts, loading, hasMore, loadMore, onContactClick }) {
  const { t } = useTranslation();

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'awaiting_reply': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'high': return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'medium': return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'low': return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default: return <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('contact.time.justNow');
    if (diffInHours < 24) return t('contact.time.hoursAgo', { hours: diffInHours });
    if (diffInHours < 168) return t('contact.time.daysAgo', { days: Math.floor(diffInHours / 24) });
    return formatDate(dateString);
  };

  if (contacts.length === 0 && !loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-12 px-4 text-gray-500 dark:text-gray-400">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">{t('contact.list.noContacts')}</p>
          <p className="text-sm">{t('contact.list.adjustFilters')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contacts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onContactClick(contact)}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                    {contact.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {contact.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                <span className={`inline-flex items-center px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(contact.priority)}`}>
                  {getPriorityIcon(contact.priority)}
                </span>
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </div>

            {/* Subject */}
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm sm:text-base">
              {contact.subject}
            </h4>

            {/* Message Preview */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-2">
              {contact.message}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)} whitespace-nowrap overflow-hidden`}>
                  <span className="truncate">{t(`contact.status.${contact.status}`)}</span>
                </span>
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 whitespace-nowrap overflow-hidden">
                  <span className="truncate">{t(`contact.category.${contact.category}`)}</span>
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 whitespace-nowrap">
                {formatTimeAgo(contact.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-3 sm:pt-4">
          <button
            onClick={loadMore}
            className="px-4 sm:px-6 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
          >
            {t('contact.list.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}