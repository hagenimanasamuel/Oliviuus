import React, { useState, useEffect, useRef } from "react";
import {
    X, Mail, Clock, User, AlertCircle, CheckCircle,
    MessageSquare, Reply, RefreshCw, MoreHorizontal,
    ChevronRight, Eye, Edit, Calendar
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function ContactModal({ contact, onClose, onContactUpdated }) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [currentContact, setCurrentContact] = useState(contact);
    const [replyMessage, setReplyMessage] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [responses, setResponses] = useState([]);
    const [loadingResponses, setLoadingResponses] = useState(false);

    const modalRef = useRef(null);
    const moreButtonRef = useRef(null);
    const dropdownRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (contact) {
            setIsVisible(true);
            setIsClosing(false);
            setCurrentContact(contact);
            // Fetch full contact details and responses when modal opens
            fetchContactDetails();
            fetchContactResponses();
        }
    }, [contact]);

    const fetchContactDetails = async () => {
        try {
            const response = await api.get(`/contact/admin/contacts/${contact.id}`);
            if (response.data.success) {
                setCurrentContact(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch contact details:', error);
        }
    };

    const fetchContactResponses = async () => {
        setLoadingResponses(true);
        try {
            const response = await api.get(`/contact/admin/contacts/${contact.id}/responses`);
            if (response.data.success) {
                setResponses(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch contact responses:', error);
        } finally {
            setLoadingResponses(false);
        }
    };

    // Scroll to bottom when new responses are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [responses]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showMoreActions &&
                moreButtonRef.current &&
                !moreButtonRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowMoreActions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showMoreActions]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setReplyMessage("");
            setResponses([]);
            onClose();
        }, 300);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleStatusChange = async (newStatus) => {
        setIsUpdatingStatus(true);
        try {
            const response = await api.put(`/contact/admin/contacts/${currentContact.id}/status`, {
                status: newStatus
            });

            if (response.data.success) {
                const updatedContact = response.data.data;
                setCurrentContact(updatedContact);
                onContactUpdated(updatedContact);
                setShowMoreActions(false);
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            alert(t('contact.modal.statusUpdateError'));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim()) return;

        setIsReplying(true);
        try {
            const response = await api.post(`/contact/admin/contacts/${currentContact.id}/reply`, {
                message: replyMessage
            });

            if (response.data.success) {
                setReplyMessage("");
                const updatedContact = response.data.data;
                setCurrentContact(updatedContact);
                onContactUpdated(updatedContact);

                // Refresh responses to show the new reply
                await fetchContactResponses();
                setActiveTab("details");
                alert(t('contact.modal.replySuccess'));
            }
        } catch (error) {
            console.error("Failed to send reply:", error);
            alert(t('contact.modal.replyError'));
        } finally {
            setIsReplying(false);
        }
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return t('contact.modal.never');
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusOptions = [
        { value: 'new', label: t('contact.status.new'), color: 'blue' },
        { value: 'open', label: t('contact.status.open'), color: 'yellow' },
        { value: 'in_progress', label: t('contact.status.in_progress'), color: 'purple' },
        { value: 'awaiting_reply', label: t('contact.status.awaiting_reply'), color: 'orange' },
        { value: 'resolved', label: t('contact.status.resolved'), color: 'green' },
        { value: 'closed', label: t('contact.status.closed'), color: 'gray' }
    ];

    if (!currentContact && !isVisible) return null;

    return (
        <div
            className={clsx(
                "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300",
                isVisible ? "bg-black/60" : "bg-transparent",
                isClosing ? "bg-black/0" : ""
            )}
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className={clsx(
                    "bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] shadow-2xl transform transition-all duration-300 overflow-hidden flex flex-col",
                    isClosing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center">
                                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                                <h2 className="text-white text-lg sm:text-xl font-bold truncate">
                                    {currentContact.name}
                                </h2>
                                <div className="flex items-center space-x-2 flex-wrap">
                                    <span className={clsx(
                                        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium flex-shrink-0",
                                        getStatusColor(currentContact.status)
                                    )}>
                                        {t(`contact.status.${currentContact.status}`)}
                                    </span>
                                    <span className={clsx(
                                        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium flex-shrink-0",
                                        getPriorityColor(currentContact.priority)
                                    )}>
                                        {t(`contact.priority.${currentContact.priority}`)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm truncate mt-1">{currentContact.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="relative" ref={moreButtonRef}>
                            <button
                                onClick={() => setShowMoreActions(!showMoreActions)}
                                disabled={isUpdatingStatus}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {showMoreActions && (
                                <div
                                    className="absolute right-0 top-full mt-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-40"
                                    ref={dropdownRef}
                                >
                                    <div className="p-2 border-b border-gray-700">
                                        <p className="text-xs font-medium text-gray-400 px-2 py-1">{t('contact.modal.changeStatus')}</p>
                                    </div>
                                    {statusOptions.map((status) => (
                                        <button
                                            key={status.value}
                                            onClick={() => handleStatusChange(status.value)}
                                            disabled={isUpdatingStatus}
                                            className={clsx(
                                                "flex items-center space-x-2 w-full text-left px-3 py-2 text-sm transition first:rounded-t-lg last:rounded-b-lg",
                                                currentContact.status === status.value
                                                    ? "bg-gray-800 text-white"
                                                    : "text-gray-300 hover:bg-gray-800 hover:text-white",
                                                isUpdatingStatus && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {isUpdatingStatus && currentContact.status === status.value ? (
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <div className={clsx("w-2 h-2 rounded-full", `bg-${status.color}-500`)}></div>
                                            )}
                                            <span>{status.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center px-4 sm:px-6">
                        <button
                            onClick={() => setActiveTab("details")}
                            className={clsx(
                                "flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2",
                                activeTab === "details"
                                    ? "text-white border-[#BC8BBC]"
                                    : "text-gray-400 hover:text-gray-300 border-transparent"
                            )}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {t('contact.modal.details')}
                        </button>
                        <button
                            onClick={() => setActiveTab("conversation")}
                            className={clsx(
                                "flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2",
                                activeTab === "conversation"
                                    ? "text-white border-[#BC8BBC]"
                                    : "text-gray-400 hover:text-gray-300 border-transparent"
                            )}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            {t('contact.modal.conversation')}
                            {responses.length > 0 && (
                                <span className="ml-2 bg-[#BC8BBC] text-white text-xs px-2 py-1 rounded-full">
                                    {responses.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("reply")}
                            className={clsx(
                                "flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2",
                                activeTab === "reply"
                                    ? "text-white border-[#BC8BBC]"
                                    : "text-gray-400 hover:text-gray-300 border-transparent"
                            )}
                        >
                            <Reply className="w-4 h-4 mr-2" />
                            {t('contact.modal.reply')}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-4 sm:p-6">
                        {activeTab === "details" && (
                            <div className="space-y-6">
                                {/* Contact Information */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-4">{t('contact.modal.contactInfo')}</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                    <span className="text-gray-400">{t('contact.categoryLabel')}</span>
                                                    <span className="text-white font-medium">
                                                        {t(`contact.category.${currentContact.category}`)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                    <span className="text-gray-400">{t('contact.priorityLabel')}</span>
                                                    <span className={clsx("font-medium px-2 py-1 rounded text-xs", getPriorityColor(currentContact.priority))}>
                                                        {t(`contact.priority.${currentContact.priority}`)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                    <span className="text-gray-400">{t('contact.statusLabel')}</span>
                                                    <span className={clsx("font-medium px-2 py-1 rounded text-xs", getStatusColor(currentContact.status))}>
                                                        {t(`contact.status.${currentContact.status}`)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                    <span className="text-gray-400">{t('contact.modal.submitted')}</span>
                                                    <span className="text-white font-medium">
                                                        {formatDate(currentContact.created_at)}
                                                    </span>
                                                </div>
                                                {currentContact.last_response_at && (
                                                    <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                        <span className="text-gray-400">{t('contact.modal.lastResponse')}</span>
                                                        <span className="text-white font-medium">
                                                            {formatDate(currentContact.last_response_at)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">{t('contact.modal.technicalDetails')}</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                <span className="text-gray-400">{t('contact.modal.source')}</span>
                                                <span className="text-white font-medium capitalize">
                                                    {currentContact.source || t('contact.modal.notAvailable')}
                                                </span>
                                            </div>
                                            {currentContact.ip_address && (
                                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                    <span className="text-gray-400">{t('contact.modal.ipAddress')}</span>
                                                    <span className="text-white font-medium">
                                                        {currentContact.ip_address}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                <span className="text-gray-400">{t('contact.modal.responses')}</span>
                                                <span className="text-white font-medium">
                                                    {currentContact.response_count || 0}
                                                </span>
                                            </div>
                                            {currentContact.read_at && (
                                                <div className="flex items-center justify-between py-2 border-b border-gray-800">
                                                    <span className="text-gray-400">{t('contact.modal.firstRead')}</span>
                                                    <span className="text-white font-medium">
                                                        {formatDate(currentContact.read_at)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">{t('contact.modal.message')}</h3>
                                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                        <h4 className="text-white font-semibold mb-2">{currentContact.subject}</h4>
                                        <p className="text-gray-300 whitespace-pre-wrap">{currentContact.message}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "conversation" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">{t('contact.modal.conversation')}</h3>
                                    <button
                                        onClick={fetchContactResponses}
                                        disabled={loadingResponses}
                                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        <RefreshCw className={clsx("w-4 h-4", loadingResponses && "animate-spin")} />
                                        <span>{t('contact.modal.refresh')}</span>
                                    </button>
                                </div>

                                {/* Original Message */}
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-white font-medium">{currentContact.name}</span>
                                                <span className="text-gray-400 text-sm">{formatTime(currentContact.created_at)}</span>
                                            </div>
                                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                                <h4 className="text-white font-semibold mb-2">{currentContact.subject}</h4>
                                                <p className="text-gray-300 whitespace-pre-wrap">{currentContact.message}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Responses */}
                                    {loadingResponses ? (
                                        <div className="flex justify-center py-8">
                                            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                                        </div>
                                    ) : responses.length > 0 ? (
                                        responses.map((response) => (
                                            <div key={response.id} className="flex items-start space-x-3">
                                                <div className="w-8 h-8 bg-[#BC8BBC] rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className="text-white font-medium">{t('contact.modal.supportTeam')}</span>
                                                        <span className="text-gray-400 text-sm">{formatTime(response.created_at)}</span>
                                                    </div>
                                                    <div className="bg-gray-800 rounded-lg p-4 border border-[#BC8BBC]">
                                                        <p className="text-gray-300 whitespace-pre-wrap">{response.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>{t('contact.modal.noResponses')}</p>
                                            <p className="text-sm">{t('contact.modal.sendFirstResponse')}</p>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}

                        {activeTab === "reply" && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">{t('contact.modal.sendReply')}</h3>
                                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
                                        <h4 className="text-white font-semibold mb-2">{t('contact.modal.originalMessage')}</h4>
                                        <p className="text-gray-300 text-sm">{currentContact.message}</p>
                                    </div>

                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder={t('contact.modal.replyPlaceholder')}
                                        rows="8"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] resize-none"
                                    />

                                    <div className="flex justify-end space-x-3 mt-4">
                                        <button
                                            onClick={() => setActiveTab("details")}
                                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                        >
                                            {t('contact.modal.cancel')}
                                        </button>
                                        <button
                                            onClick={handleSendReply}
                                            disabled={!replyMessage.trim() || isReplying}
                                            className={clsx(
                                                "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                                !replyMessage.trim() || isReplying
                                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                                    : "bg-[#BC8BBC] text-white hover:bg-purple-600"
                                            )}
                                        >
                                            {isReplying ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Reply className="w-4 h-4" />
                                            )}
                                            <span>{isReplying ? t('contact.modal.sending') : t('contact.modal.sendReply')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}