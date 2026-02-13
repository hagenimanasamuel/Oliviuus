// src/pages/Account/MessagesPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search,
  Send,
  Phone,
  Mail,
  User,
  Home,
  Calendar,
  Clock,
  Check,
  CheckCheck,
  MoreVertical,
  Hash,
  AtSign,
  ChevronLeft,
  X,
  RefreshCw,
  MapPin,
  DollarSign,
  Shield,
  Building,
  AlertCircle,
  MessageSquare,
  Filter,
  HomeIcon,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  Bed,
  Maximize2,
  Image as ImageIcon,
  Info,
  Loader
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useIsanzureAuth } from '../../context/IsanzureAuthContext';

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { userType } = useIsanzureAuth();
  
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [filter, setFilter] = useState('all');
  const [copiedUid, setCopiedUid] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    booking_related: 0,
    today_new: 0
  });

  // ========== PROFESSIONAL URL PARAMETERS WITH UUID ==========
  const [urlParams, setUrlParams] = useState({
    landlordUid: null,      // Using UUID, not numeric ID
    propertyUid: null,       // Property UUID
    draftMessage: null
  });

  // ========== @MENTION & #TAG STATES ==========
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [hoveredProperty, setHoveredProperty] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [showUid, setShowUid] = useState(false);
  const [newMessageReceived, setNewMessageReceived] = useState(false);
  const [autoSelectAttempted, setAutoSelectAttempted] = useState(false);
  const [hasAutoFocused, setHasAutoFocused] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  
  const colors = {
    primary: '#BC8BBC',
    primaryDark: '#8A5A8A',
    primaryLight: '#E6D3E6'
  };

  // ========== PROFESSIONAL URL PARSING ==========
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const landlordUid = params.get('landlord');
    const propertyUid = params.get('property');
    const draftMessage = params.get('draft');

    setUrlParams({
      landlordUid: landlordUid || null,
      propertyUid: propertyUid || null,
      draftMessage: draftMessage ? decodeURIComponent(draftMessage) : null
    });

    // Set draft message if present
    if (draftMessage) {
      setNewMessage(decodeURIComponent(draftMessage));
    }
  }, [location.search]);

  // ========== PROFESSIONAL AUTO-FOCUS ==========
  useEffect(() => {
    if (urlParams.draftMessage && textareaRef.current && !hasAutoFocused && !selectedConversation) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        const len = newMessage.length;
        textareaRef.current?.setSelectionRange(len, len);
        setHasAutoFocused(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [urlParams.draftMessage, newMessage.length, hasAutoFocused, selectedConversation]);

  // ========== FETCH USER CONVERSATIONS ==========
  useEffect(() => {
    fetchConversations();
    fetchStats();
    
    pollingIntervalRef.current = setInterval(() => {
      checkForNewMessages();
    }, 10000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // ========== PROFESSIONAL AUTO-SELECT CONVERSATION USING UUID ==========
  useEffect(() => {
    if (!loading && conversations.length > 0 && urlParams.landlordUid && !selectedConversation && !autoSelectAttempted) {
      // Find conversation by landlord UUID
      const conversation = conversations.find(c => 
        c.other_user?.user_uid === urlParams.landlordUid
      );
      
      if (conversation) {
        handleSelectConversation(conversation);
      }
      setAutoSelectAttempted(true);
    }
  }, [conversations, loading, urlParams.landlordUid, selectedConversation, autoSelectAttempted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========== SILENT POLLING WITH ERROR HANDLING ==========
  const checkForNewMessages = async () => {
    try {
      const statsRes = await api.get('/user/messages/stats');
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      // Silent fail - no console errors
    }
    
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (searchTerm) params.append('search', searchTerm);
      
      const convRes = await api.get(`/user/messages/conversations?${params}`);
      if (convRes.data?.success) {
        setConversations(convRes.data.data.conversations || []);
      }
    } catch (error) {
      // Silent fail
    }
    
    if (selectedConversation) {
      try {
        const msgRes = await api.get(`/user/messages/conversations/${selectedConversation.id}`);
        if (msgRes.data?.success) {
          const newMessages = msgRes.data.data.messages || [];
          if (newMessages.length > messages.length) {
            setMessages(newMessages);
            setNewMessageReceived(true);
            await api.put(`/user/messages/conversations/${selectedConversation.id}/read`);
            setTimeout(scrollToBottom, 100);
            setTimeout(() => setNewMessageReceived(false), 3000);
          }
        }
      } catch (error) {
        // Silent fail
      }
    }
  };

  // ========== PROPERTY SUGGESTIONS ==========
  const fetchPropertySuggestions = useCallback(async (query) => {
    try {
      const params = new URLSearchParams({
        query: query || ''
      });
      
      const response = await api.get(`/user/messages/suggestions/properties?${params}`);
      
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions);
        setSuggestionType('property');
        setSelectedSuggestionIndex(0);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching property suggestions:', error);
    }
  }, []);

  const fetchTagSuggestions = useCallback(async (query) => {
    try {
      const response = await api.get(`/user/messages/suggestions/tags?query=${encodeURIComponent(query || '')}`);
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions);
        setSuggestionType('tag');
        setSelectedSuggestionIndex(0);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  }, []);

  // ========== COPY PROPERTY UID ==========
  const copyPropertyUid = (uid, event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedUid(null);
    }, 2000);
  };

  // ========== TEXTAREA HANDLERS ==========
  const handleKeyDown = (e) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (suggestions[selectedSuggestionIndex]) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewMessage(value);
    setCursorPosition(position);

    const textBeforeCursor = value.slice(0, position);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9-]+)$/);
    
    if (atMatch) {
      const query = atMatch[1];
      setSuggestionQuery(query);
      fetchPropertySuggestions(query);
    } else {
      const hashMatch = textBeforeCursor.match(/#([a-zA-Z0-9-]+)$/);
      if (hashMatch) {
        const query = hashMatch[1];
        setSuggestionQuery(query);
        fetchTagSuggestions(query);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const insertSuggestion = (suggestion) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const value = newMessage;
    const position = cursorPosition;

    let startPos = position;
    while (startPos > 0 && /[@#a-zA-Z0-9-]/.test(value[startPos - 1])) {
      startPos--;
    }
    while (startPos > 0 && (value[startPos - 1] === '@' || value[startPos - 1] === '#')) {
      startPos--;
    }

    let insertText = '';
    if (suggestionType === 'property') {
      insertText = `@${suggestion.id} `;
    } else {
      insertText = `#${suggestion.tag} `;
    }

    const newValue = value.slice(0, startPos) + insertText + value.slice(position);
    setNewMessage(newValue);
    setShowSuggestions(false);

    setTimeout(() => {
      textarea.focus();
      const newPosition = startPos + insertText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 10);
  };

  // ========== PROFESSIONAL SEND MESSAGE ==========
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    try {
      setSending(true);
      
      const response = await api.post(`/user/messages/conversations/${selectedConversation.id}`, {
        message: newMessage,
        recipient_id: selectedConversation.other_user.id
      });
      
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.data.message]);
        setNewMessage('');
        setShowSuggestions(false);
        
        // Clear URL params after successful send
        if (urlParams.landlordUid || urlParams.draftMessage) {
          navigate('/account/messages', { replace: true });
        }
        
        checkForNewMessages();
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // ========== FETCH CONVERSATIONS ==========
  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await api.get(`/user/messages/conversations?${params}`);
      
      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchMessages = async (conversationId, markAsRead = true) => {
    try {
      const response = await api.get(`/user/messages/conversations/${conversationId}`);
      
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
        
        if (markAsRead) {
          await api.put(`/user/messages/conversations/${conversationId}/read`);
          fetchConversations(true);
          fetchStats();
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/messages/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // ========== CONVERSATION HANDLERS ==========
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    fetchMessages(conversation.id);
    setShowMobileList(false);
    setShowSuggestions(false);
    setNewMessageReceived(false);
  };

  const handleBackToList = () => {
    setShowMobileList(true);
    setSelectedConversation(null);
    setShowSuggestions(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ========== PROPERTY HOVER ==========
  const handlePropertyMouseEnter = (property, event) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    const rect = event.target.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + (rect.width / 2),
      y: rect.bottom + window.scrollY + 15
    });
    setHoveredProperty(property);
  };

  const handlePropertyMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredProperty(null);
    }, 300);
  };

  const toggleUidVisibility = () => {
    setShowUid(!showUid);
  };

  const handleManualRefresh = async () => {
    await checkForNewMessages();
  };

  // ========== UTILITIES ==========
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return format(date, 'EEEE');
    
    return format(date, 'MMM d');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getConversationAvatar = (conversation) => {
    const user = conversation.other_user;
    
    if (user?.avatar) {
      return (
        <img 
          src={user.avatar} 
          alt={user.full_name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `<div class="w-10 h-10 rounded-full bg-[#BC8BBC] flex items-center justify-center text-white font-medium">${getInitials(user.full_name)}</div>`;
          }}
        />
      );
    }
    
    return (
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
        style={{ backgroundColor: colors.primary }}
      >
        {getInitials(user?.full_name || 'User')}
      </div>
    );
  };

  // ========== RENDER MESSAGE CONTENT ==========
  const renderMessageContent = (message, isCurrentUser) => {
    let content = message.content;
    
    let metadata = null;
    if (message.metadata) {
      try {
        metadata = typeof message.metadata === 'string' 
          ? JSON.parse(message.metadata) 
          : message.metadata;
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }

    const parts = [];
    let lastIndex = 0;
    
    const mentionRegex = /@([a-zA-Z0-9-]+)/g;
    let mentionMatch;
    while ((mentionMatch = mentionRegex.exec(content)) !== null) {
      if (mentionMatch.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, mentionMatch.index)
        });
      }
      
      const propertyUid = mentionMatch[1];
      const mentionedProperty = metadata?.mentions?.find(m => m.property_uid === propertyUid);
      
      parts.push({
        type: 'mention',
        content: mentionMatch[0],
        property: mentionedProperty,
        uid: propertyUid,
        fullMatch: mentionMatch[0],
        index: mentionMatch.index
      });
      
      lastIndex = mentionMatch.index + mentionMatch[0].length;
    }
    
    const tagRegex = /#([a-zA-Z0-9-]+)/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(content)) !== null) {
      if (tagMatch.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, tagMatch.index)
        });
      }
      
      parts.push({
        type: 'tag',
        content: tagMatch[0],
        tag: tagMatch[1]
      });
      
      lastIndex = tagMatch.index + tagMatch[0].length;
    }
    
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return (
      <div className="space-y-3">
        <div className="break-words">
          {parts.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index} className="text-sm">{part.content}</span>;
            }
            
            if (part.type === 'mention') {
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 mx-0.5 relative group"
                >
                  <button
                    onClick={() => part.property?.property_uid && navigate(`/property/${part.property.property_uid}`)}
                    onMouseEnter={(e) => part.property && handlePropertyMouseEnter(part.property, e)}
                    onMouseLeave={handlePropertyMouseLeave}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                      isCurrentUser
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                    }`}
                  >
                    <AtSign className="h-3.5 w-3.5 flex-shrink-0" />
                    
                    <span className="font-medium text-sm">
                      {part.property?.title 
                        ? part.property.title.length > 25 
                          ? part.property.title.substring(0, 25) + '...'
                          : part.property.title
                        : 'Property'
                      }
                    </span>
                    
                    {part.property?.images?.cover && (
                      <img 
                        src={part.property.images.cover} 
                        alt=""
                        className="w-5 h-5 rounded-sm object-cover ml-1 group-hover:scale-110 transition-transform"
                      />
                    )}
                  </button>

                  <button
                    onClick={(e) => copyPropertyUid(part.uid, e)}
                    className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-md text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 ${
                      isCurrentUser
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {copiedUid === part.uid ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Copied!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        Copy ID
                      </span>
                    )}
                  </button>

                  {showUid && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ml-1 ${
                      isCurrentUser
                        ? 'bg-white/10 text-white/80'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      @{part.uid.slice(0, 8)}
                    </span>
                  )}
                </span>
              );
            }
            
            if (part.type === 'tag') {
              return (
                <button
                  key={index}
                  onClick={() => {
                    setFilter(part.tag);
                    fetchConversations();
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-all mx-0.5 ${
                    isCurrentUser
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-medium text-sm">{part.tag}</span>
                </button>
              );
            }
            
            return null;
          })}
        </div>
        
        {metadata?.mentions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {metadata.mentions.map((property, idx) => (
              <div
                key={idx}
                className={`relative group rounded-lg overflow-hidden ${
                  isCurrentUser
                    ? 'bg-white/10'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <button
                  onClick={() => navigate(`/property/${property.property_uid}`)}
                  onMouseEnter={(e) => handlePropertyMouseEnter(property, e)}
                  onMouseLeave={handlePropertyMouseLeave}
                  className="flex items-center gap-3 p-2 w-full text-left"
                >
                  {property.images?.cover ? (
                    <img 
                      src={property.images.cover} 
                      alt={property.title}
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Home className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {property.title}
                      </h4>
                      {property.verified && (
                        <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {property.location?.district || property.location?.sector || 'Location not specified'}
                      </span>
                    </p>
                    
                    <div className="flex items-center gap-3 mt-1.5">
                      {property.price?.monthly > 0 && (
                        <span className="text-xs font-bold text-purple-700">
                          {new Intl.NumberFormat('en-RW', {
                            style: 'currency',
                            currency: 'RWF',
                            minimumFractionDigits: 0
                          }).format(property.price.monthly)}
                          <span className="text-[10px] font-normal text-gray-500 ml-1">/mo</span>
                        </span>
                      )}
                      
                      {property.specs?.guests > 0 && (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <Bed className="h-3 w-3" />
                          {property.specs.guests}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ExternalLink className={`h-4 w-4 flex-shrink-0 ${
                    isCurrentUser ? 'text-white/70' : 'text-gray-400'
                  }`} />
                </button>
                
                <button
                  onClick={(e) => copyPropertyUid(property.property_uid, e)}
                  className="absolute top-2 right-2 p-1.5 bg-gray-800/80 hover:bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy Property ID"
                >
                  {copiedUid === property.property_uid ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-12rem)] bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col relative">
      {/* Header with Professional URL Indicators */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: colors.primaryLight }}>
            <MessageSquare className="h-5 w-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              {newMessageReceived && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full animate-pulse">
                  New message
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              {stats.unread > 0 ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-gray-700 font-medium">{stats.unread}</span>
                  <span className="text-gray-600">unread</span>
                </span>
              ) : (
                <span className="text-gray-600">No unread messages</span>
              )}
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">
                {stats.total} conversations
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Check for new messages"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          
          <button
            onClick={toggleUidVisibility}
            className={`p-2 rounded-lg transition-colors ${
              showUid ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={showUid ? 'Hide property IDs' : 'Show property IDs'}
          >
            {showUid ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations List */}
        <div 
          className={`${
            showMobileList ? 'flex' : 'hidden'
          } md:flex w-full md:w-80 lg:w-96 border-r border-gray-200 flex-col bg-gray-50`}
        >
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && fetchConversations()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ focusRingColor: colors.primary }}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  filter === 'all'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filter === 'all' ? { backgroundColor: colors.primary } : {}}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-full transition-colors relative ${
                  filter === 'unread'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filter === 'unread' ? { backgroundColor: colors.primary } : {}}
              >
                Unread
                {stats.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {stats.unread > 9 ? '9+' : stats.unread}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('booking')}
                className={`px-3 py-1.5 rounded-full ${
                  filter === 'booking'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={filter === 'booking' ? { backgroundColor: colors.primary } : {}}
              >
                <Calendar className="h-3 w-3 inline mr-1" />
                Bookings
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader className="animate-spin h-8 w-8" style={{ color: colors.primary }} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
                <p className="text-sm text-gray-600">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'When landlords message you, they\'ll appear here'}
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const isUnread = conv.unread_count > 0;
                const isLandlord = conv.other_user?.user_type === 'landlord';
                const isHighlighted = urlParams.landlordUid && 
                  conv.other_user?.user_uid === urlParams.landlordUid;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors text-left relative ${
                      isSelected ? 'bg-gray-100' : ''
                    } ${isUnread ? 'bg-blue-50/30' : ''} ${
                      isHighlighted && !isSelected ? 'border-l-4 border-purple-500 bg-purple-50/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {getConversationAvatar(conv)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium truncate ${
                              isUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'
                            }`}>
                              {conv.other_user?.full_name || 'User'}
                            </h3>
                            {isLandlord && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full">
                                Landlord
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatMessageTime(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate max-w-[150px] sm:max-w-[180px] ${
                            isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                          }`}>
                            {conv.last_message?.content?.replace(/[@#][a-zA-Z0-9-]+/g, '') || 'No messages yet'}
                          </p>
                          
                          {isUnread && (
                            <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                              {conv.unread_count > 9 ? '9+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                        
                        {conv.related_booking && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <Home className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{conv.related_booking.property?.title || 'Property'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isUnread && (
                      <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-r-full bg-red-500"></span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div 
          className={`${
            !showMobileList ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col bg-white relative`}
        >
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={handleBackToList}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-lg flex-shrink-0"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  
                  {getConversationAvatar(selectedConversation)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900 truncate">
                        {selectedConversation.other_user?.full_name || 'User'}
                      </h2>
                      {selectedConversation.other_user?.user_type === 'landlord' && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Landlord
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      {selectedConversation.other_user?.user_type === 'landlord' && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3 flex-shrink-0" />
                          <span>Property Owner</span>
                        </span>
                      )}
                      {selectedConversation.related_booking && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[100px] sm:max-w-[150px]">
                            {selectedConversation.related_booking.property?.title || 'Booking'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Mail className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No messages yet
                    </h3>
                    <p className="text-sm text-gray-600">
                      Send a message to start the conversation
                    </p>
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                      <p className="flex items-center gap-1 mb-1">
                        <AtSign className="h-3 w-3" />
                        Use <span className="font-mono bg-white px-1 py-0.5 rounded">@property-id</span> to mention a property
                      </p>
                      <p className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Use <span className="font-mono bg-white px-1 py-0.5 rounded">#tag</span> to add a topic
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isCurrentUser = message.sender_id === selectedConversation.other_user?.id ? false : true;
                    const showAvatar = index === 0 || 
                      messages[index - 1]?.sender_id !== message.sender_id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      >
                        <div className={`flex gap-2 max-w-full sm:max-w-[80%] lg:max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                          {!isCurrentUser && showAvatar && (
                            <div className="flex-shrink-0 mt-1">
                              {getConversationAvatar(selectedConversation)}
                            </div>
                          )}
                          
                          <div className="min-w-0 flex-1">
                            <div
                              className={`p-3 rounded-2xl ${
                                isCurrentUser
                                  ? 'text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                              style={isCurrentUser ? { backgroundColor: colors.primary } : {}}
                            >
                              {renderMessageContent(message, isCurrentUser)}
                            </div>
                            
                            <div className={`flex items-center gap-2 mt-1 text-xs ${
                              isCurrentUser ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="text-gray-500">
                                {formatMessageTime(message.created_at)}
                              </span>
                              
                              {isCurrentUser && (
                                <span className="flex items-center gap-1">
                                  {message.is_read ? (
                                    <>
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                      <span className="text-blue-500">Read</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3 text-gray-400" />
                                      <span className="text-gray-400">Sent</span>
                                    </>
                                  )}
                                </span>
                              )}
                              
                              {message.metadata?.has_mentions && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <AtSign className="h-3 w-3" />
                                </span>
                              )}
                              {message.metadata?.has_tags && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Hash className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input with Professional Draft Handling */}
              <div className="p-4 border-t border-gray-200 bg-white relative">
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto z-50"
                  >
                    <div className="p-3 border-b border-gray-100 bg-gray-50 sticky top-0">
                      <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        {suggestionType === 'property' ? (
                          <>
                            <AtSign className="h-3 w-3" />
                            Your booked properties
                          </>
                        ) : (
                          <>
                            <Hash className="h-3 w-3" />
                            Tag suggestions
                          </>
                        )}
                      </p>
                    </div>
                    
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestionType === 'property' ? suggestion.id : suggestion.tag}
                        onClick={() => insertSuggestion(suggestion)}
                        className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          index === selectedSuggestionIndex ? 'bg-gray-50' : ''
                        }`}
                      >
                        {suggestionType === 'property' ? (
                          <>
                            {suggestion.image ? (
                              <img 
                                src={suggestion.image} 
                                alt={suggestion.name}
                                className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Home className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {suggestion.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                {suggestion.subtitle}
                              </p>
                              {suggestion.displayPrice > 0 && (
                                <p className="text-xs font-semibold text-purple-700 mt-1">
                                  {new Intl.NumberFormat('en-RW', {
                                    style: 'currency',
                                    currency: 'RWF',
                                    minimumFractionDigits: 0
                                  }).format(suggestion.displayPrice)}
                                  <span className="text-[10px] font-normal text-gray-500 ml-1">/mo</span>
                                </p>
                              )}
                            </div>
                            {suggestion.relationship === 'booked' && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Booked
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Hash className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium text-gray-900">
                                #{suggestion.tag}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {suggestion.description}
                              </p>
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... Use @ to mention properties you've booked, # for tags"
                      rows="2"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none resize-none pr-20 transition-all ${
                        urlParams.draftMessage && !selectedConversation
                          ? 'border-purple-400 ring-1 ring-purple-200 bg-purple-50/30'
                          : 'border-gray-300'
                      }`}
                      style={{ focusRingColor: colors.primary }}
                    />
                    <div className="absolute right-2 bottom-2 flex gap-1">
                      <button 
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-purple-600"
                        title="Mention property (@)"
                        onClick={() => {
                          const textarea = textareaRef.current;
                          if (textarea) {
                            const pos = textarea.selectionStart;
                            const value = newMessage;
                            setNewMessage(value.slice(0, pos) + '@' + value.slice(pos));
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(pos + 1, pos + 1);
                              fetchPropertySuggestions('');
                            }, 10);
                          }
                        }}
                      >
                        <AtSign className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                        title="Add tag (#)"
                        onClick={() => {
                          const textarea = textareaRef.current;
                          if (textarea) {
                            const pos = textarea.selectionStart;
                            const value = newMessage;
                            setNewMessage(value.slice(0, pos) + '#' + value.slice(pos));
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(pos + 1, pos + 1);
                              fetchTagSuggestions('');
                            }, 10);
                          }
                        }}
                      >
                        <Hash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending || !selectedConversation}
                    className="p-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {sending ? (
                      <Loader className="animate-spin h-5 w-5" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <AtSign className="h-3 w-3" />
                    @property - Mention property
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    #tag - Add topic
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">↵</span>
                    Send
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">⇧+↵</span>
                    New line
                  </span>
                  <button
                    onClick={toggleUidVisibility}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    {showUid ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <span>{showUid ? 'Hide' : 'Show'} IDs</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
              <div className="text-center p-8 max-w-md">
                <div className="p-4 rounded-full bg-gray-100 inline-flex mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Choose a conversation from the list to start messaging
                </p>
                <button
                  onClick={() => setShowMobileList(true)}
                  className="mt-4 md:hidden px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  View Conversations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Hover Preview */}
      {hoveredProperty && (
        <div 
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-96 pointer-events-auto animate-fadeIn"
          style={{
            left: hoverPosition.x,
            top: hoverPosition.y,
            transform: 'translateX(-50%)'
          }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
          }}
          onMouseLeave={handlePropertyMouseLeave}
        >
          <div className="flex gap-4">
            {hoveredProperty.images?.cover ? (
              <img 
                src={hoveredProperty.images.cover} 
                alt={hoveredProperty.title}
                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Home className="h-10 w-10 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 truncate max-w-[200px]">
                    {hoveredProperty.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {hoveredProperty.location?.district || hoveredProperty.location?.sector || 'Location not specified'}
                    </span>
                  </p>
                </div>
                {hoveredProperty.verified && (
                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
              </div>
              
              {hoveredProperty.price?.monthly > 0 && (
                <p className="text-lg font-bold text-purple-700 mt-2">
                  {new Intl.NumberFormat('en-RW', {
                    style: 'currency',
                    currency: 'RWF',
                    minimumFractionDigits: 0
                  }).format(hoveredProperty.price.monthly)}
                  <span className="text-xs font-normal text-gray-500 ml-1">/month</span>
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                {hoveredProperty.specs?.guests > 0 && (
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" />
                    {hoveredProperty.specs.guests} guests
                  </span>
                )}
                {hoveredProperty.relationship === 'booked' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Currently booked
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => {
                    navigate(`/property/${hoveredProperty.id}`);
                    setHoveredProperty(null);
                  }}
                  className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                >
                  View Property <ExternalLink className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => copyPropertyUid(hoveredProperty.id, e)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  {copiedUid === hoveredProperty.id ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy ID
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setHoveredProperty(null)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}