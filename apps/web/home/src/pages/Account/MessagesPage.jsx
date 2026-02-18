// src/pages/Account/pages/MessagesPage.jsx
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
  Users,
  Star,
  Briefcase,
  Loader,
  Sparkles
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useIsanzureAuth } from '../../context/IsanzureAuthContext';

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const { userType, isLandlord, isAgent, isTenant } = useIsanzureAuth();
  
  // ========== URL PARAMETERS ==========
  const landlordUid = searchParams.get('landlord');
  const propertyUid = searchParams.get('property');
  const draftMessage = searchParams.get('draft');
  
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(draftMessage || '');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [filter, setFilter] = useState('all');
  const [copiedUid, setCopiedUid] = useState(null);
  const [targetLandlord, setTargetLandlord] = useState(null);
  const [targetProperty, setTargetProperty] = useState(null);
  const [showComposeView, setShowComposeView] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    booking_related: 0,
    today_new: 0
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
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const suggestionFetchTimeoutRef = useRef(null);
  
  const colors = {
    primary: '#BC8BBC',
    primaryDark: '#8A5A8A',
    primaryLight: '#E6D3E6'
  };

  // ========== SKELETON LOADING COMPONENTS ==========
  const ConversationSkeleton = () => (
    <div className="p-4 border-b border-gray-200 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  const MessageSkeleton = ({ isCurrentUser = false }) => (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 animate-pulse`}>
      <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
        {!isCurrentUser && (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
        )}
        <div>
          <div className={`p-3 rounded-2xl ${isCurrentUser ? 'bg-gray-300' : 'bg-gray-200'} w-64 h-16`}></div>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const MessagesAreaSkeleton = () => (
    <div className="flex-1 p-4 space-y-4">
      <MessageSkeleton />
      <MessageSkeleton isCurrentUser={true} />
      <MessageSkeleton />
      <MessageSkeleton isCurrentUser={true} />
      <MessageSkeleton />
    </div>
  );

  // ========== SHOW REAL TIME FROM DATABASE ==========
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    
    // Format: HH:MM AM/PM (e.g., "11:45 AM" or "2:30 PM")
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // For conversation list - shows time for today, date for older
  const formatConversationTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If today - show time
    if (date >= today) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    // If yesterday - show "Yesterday"
    else if (date >= yesterday) {
      return 'Yesterday';
    }
    // Otherwise show date
    else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // ========== INITIALIZE FROM URL PARAMETERS ==========
  useEffect(() => {
    const initializeFromUrl = async () => {
      if (!landlordUid && !propertyUid && !draftMessage) {
        setLoading(false);
        return;
      }

      setInitializing(true);
      
      try {
        // Step 1: Fetch landlord details if provided
        if (landlordUid) {
          const landlordRes = await api.get(`/user/messages/user/${landlordUid}`);
          if (landlordRes.data.success) {
            setTargetLandlord(landlordRes.data.data);
          }
        }

        // Step 2: Fetch property details if provided
        if (propertyUid) {
          const propertyRes = await api.get(`/public/properties/${propertyUid}`);
          if (propertyRes.data.success) {
            setTargetProperty(propertyRes.data.data.property);
          }
        }

        // Step 3: Check if conversation already exists
        if (landlordUid && landlordUid !== authUser?.id) {
          await findExistingConversation(landlordUid);
        }

      } catch (error) {
        console.error('Error initializing from URL:', error);
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    };

    if (authUser) {
      initializeFromUrl();
    }
  }, [landlordUid, propertyUid, draftMessage, authUser]);

  // ========== FIND EXISTING CONVERSATION ==========
  const findExistingConversation = async (otherUserUid) => {
    try {
      // First, get the user's ID from UID
      const userRes = await api.get(`/user/messages/user/${otherUserUid}`);
      if (!userRes.data.success) return;

      const otherUserId = userRes.data.data.id;
      
      // Look for existing conversation
      const convRes = await api.get('/user/messages/conversations');
      if (convRes.data.success) {
        const existingConv = convRes.data.data.conversations.find(
          conv => conv.other_user?.id === otherUserId
        );
        
        if (existingConv) {
          // Conversation exists - select it
          setSelectedConversation(existingConv);
          setShowComposeView(false);
          await fetchMessages(existingConv.id);
        } else {
          // No conversation - show compose view
          setShowComposeView(true);
        }
      }
    } catch (error) {
      console.error('Error finding conversation:', error);
      setShowComposeView(true);
    }
  };

  // ========== START NEW CONVERSATION ==========
  const startNewConversation = async () => {
    if (!targetLandlord) return;

    try {
      setSending(true);
      
      const response = await api.post('/user/messages/send/first', {
        recipient_uid: targetLandlord.user_uid,
        message: newMessage,
        property_uid: propertyUid
      });
      
      if (response.data.success) {
        // Clear URL parameters
        navigate('/account/messages', { replace: true });
        
        // Select the new conversation
        const convId = response.data.data.conversation_id;
        await fetchConversations();
        
        // Find and select the new conversation
        setTimeout(() => {
          const newConv = conversations.find(c => c.id === convId);
          if (newConv) {
            setSelectedConversation(newConv);
            setShowComposeView(false);
            fetchMessages(newConv.id);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setSending(false);
    }
  };

  // ========== FETCH DATA ==========
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
      if (suggestionFetchTimeoutRef.current) {
        clearTimeout(suggestionFetchTimeoutRef.current);
      }
    };
  }, []);

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

  // ========== SILENT POLLING ==========
  const checkForNewMessages = async () => {
    try {
      const statsRes = await api.get('/user/messages/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (searchTerm) params.append('search', searchTerm);
      
      const convRes = await api.get(`/user/messages/conversations?${params}`);
      if (convRes.data.success) {
        setConversations(convRes.data.data.conversations || []);
      }
      
      if (selectedConversation) {
        const msgRes = await api.get(`/user/messages/conversations/${selectedConversation.id}`);
        if (msgRes.data.success) {
          const newMessages = msgRes.data.data.messages || [];
          if (newMessages.length > messages.length) {
            setMessages(newMessages);
            setNewMessageReceived(true);
            await api.put(`/user/messages/conversations/${selectedConversation.id}/read`);
            setTimeout(scrollToBottom, 100);
            setTimeout(() => setNewMessageReceived(false), 3000);
          }
        }
      }
    } catch (error) {
      // Silent fail
    }
  };

  // ========== PROPERTY SUGGESTIONS ==========
  const fetchPropertySuggestions = useCallback(async (query, conversationId) => {
    try {
      setFetchingSuggestions(true);
      
      const params = new URLSearchParams({
        query: query || '',
        ...(conversationId && { conversation_id: conversationId })
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
    } finally {
      setFetchingSuggestions(false);
    }
  }, []);

  const fetchTagSuggestions = useCallback(async (query) => {
    try {
      setFetchingSuggestions(true);
      
      const response = await api.get(`/user/messages/suggestions/tags?query=${encodeURIComponent(query || '')}`);
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions);
        setSuggestionType('tag');
        setSelectedSuggestionIndex(0);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    } finally {
      setFetchingSuggestions(false);
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
      if (showComposeView) {
        startNewConversation();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewMessage(value);
    setCursorPosition(position);

    if (suggestionFetchTimeoutRef.current) {
      clearTimeout(suggestionFetchTimeoutRef.current);
    }

    const textBeforeCursor = value.slice(0, position);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9-]*)$/);
    
    if (atMatch) {
      const query = atMatch[1];
      setSuggestionQuery(query);
      suggestionFetchTimeoutRef.current = setTimeout(() => {
        fetchPropertySuggestions(query, selectedConversation?.id);
      }, 300);
    } else {
      const hashMatch = textBeforeCursor.match(/#([a-zA-Z0-9-]*)$/);
      if (hashMatch) {
        const query = hashMatch[1];
        setSuggestionQuery(query);
        suggestionFetchTimeoutRef.current = setTimeout(() => {
          fetchTagSuggestions(query);
        }, 300);
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
        checkForNewMessages();
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
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

  // ========== GET USER TYPE BADGE ==========
  const getUserTypeBadge = (userType) => {
    switch(userType) {
      case 'landlord':
        return {
          icon: <Building className="h-3 w-3" />,
          text: 'Landlord',
          color: 'text-purple-600',
          bg: 'bg-purple-50'
        };
      case 'tenant':
        return {
          icon: <User className="h-3 w-3" />,
          text: 'Tenant',
          color: 'text-blue-600',
          bg: 'bg-blue-50'
        };
      case 'agent':
        return {
          icon: <Briefcase className="h-3 w-3" />,
          text: 'Agent',
          color: 'text-green-600',
          bg: 'bg-green-50'
        };
      default:
        return {
          icon: <User className="h-3 w-3" />,
          text: 'User',
          color: 'text-gray-600',
          bg: 'bg-gray-50'
        };
    }
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
                        Copy
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

  // ========== UTILITIES ==========
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
    const userTypeBadge = getUserTypeBadge(user?.user_type);
    
    if (user?.avatar) {
      return (
        <div className="relative">
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
          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${userTypeBadge.bg} border-2 border-white flex items-center justify-center`}>
            {userTypeBadge.icon}
          </span>
        </div>
      );
    }
    
    return (
      <div className="relative">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
          style={{ backgroundColor: colors.primary }}
        >
          {getInitials(user?.full_name || 'User')}
        </div>
        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${userTypeBadge.bg} border-2 border-white flex items-center justify-center`}>
          {userTypeBadge.icon}
        </span>
      </div>
    );
  };

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

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    fetchMessages(conversation.id);
    setShowMobileList(false);
    setShowComposeView(false);
    setShowSuggestions(false);
    setNewMessageReceived(false);
    
    // Clear URL parameters
    if (landlordUid || propertyUid || draftMessage) {
      navigate('/account/messages', { replace: true });
    }
  };

  const handleBackToList = () => {
    setShowMobileList(true);
    setSelectedConversation(null);
    setShowComposeView(false);
    setShowSuggestions(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleUidVisibility = () => {
    setShowUid(!showUid);
  };

  const handleManualRefresh = async () => {
    await checkForNewMessages();
  };

  const cancelCompose = () => {
    setShowComposeView(false);
    setShowMobileList(true);
    navigate('/account/messages', { replace: true });
  };

  // Loading state with Skeletons
  if (loading || initializing) {
    return (
      <div className="h-[calc(100vh-8rem)] bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header Skeleton */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List Skeleton */}
          <div className="w-80 border-r border-gray-200 bg-gray-50">
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="h-9 bg-gray-200 rounded-lg mb-3 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
              </div>
            </div>
            <div className="overflow-y-auto">
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
            </div>
          </div>

          {/* Messages Area Skeleton */}
          <div className="flex-1 flex flex-col bg-white">
            <MessagesAreaSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col relative">
      {/* Header */}
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
              {showComposeView && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  New conversation
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
            showMobileList && !showComposeView ? 'flex' : 'hidden'
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
              <>
                <ConversationSkeleton />
                <ConversationSkeleton />
                <ConversationSkeleton />
                <ConversationSkeleton />
                <ConversationSkeleton />
              </>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
                <p className="text-sm text-gray-600">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Start a conversation with landlords or tenants'}
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const isUnread = conv.unread_count > 0;
                const userTypeBadge = getUserTypeBadge(conv.other_user?.user_type);
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors text-left relative ${
                      isSelected ? 'bg-gray-100' : ''
                    } ${isUnread ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        {getConversationAvatar(conv)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium truncate ${
                              isUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'
                            }`}>
                              {conv.other_user?.full_name || 'User'}
                            </h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${userTypeBadge.bg} ${userTypeBadge.color} flex items-center gap-0.5`}>
                              {userTypeBadge.icon}
                              <span>{userTypeBadge.text}</span>
                            </span>
                          </div>
                          {conv.last_message && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatConversationTime(conv.last_message.created_at)}
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

        {/* Messages Area / Compose View */}
        <div 
          className={`${
            (!showMobileList || showComposeView) ? 'flex' : 'hidden'
          } md:flex flex-1 flex-col bg-white relative`}
        >
          {showComposeView && targetLandlord ? (
            // Compose View for New Conversation
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
                <button
                  onClick={cancelCompose}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    {targetLandlord.avatar ? (
                      <img 
                        src={targetLandlord.avatar} 
                        alt={targetLandlord.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-50 border-2 border-white flex items-center justify-center">
                      <Building className="h-2.5 w-2.5 text-purple-600" />
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {targetLandlord.full_name}
                    </h2>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      Landlord
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {targetProperty && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      {targetProperty.images?.[0]?.image_url ? (
                        <img 
                          src={targetProperty.images[0].image_url} 
                          alt={targetProperty.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Home className="h-8 w-8 text-purple-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{targetProperty.title}</h3>
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {targetProperty.district || targetProperty.sector || 'Rwanda'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/property/${targetProperty.property_uid}`)}
                        className="p-2 hover:bg-purple-200 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-purple-600" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-8 w-8 text-purple-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    New Conversation
                  </h3>
                  <p className="text-sm text-gray-600 max-w-sm mx-auto">
                    You're about to start a conversation with {targetLandlord.full_name}. 
                    Your message has been prepared below.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none resize-none"
                      style={{ focusRingColor: colors.primary }}
                    />
                  </div>
                  <button
                    onClick={startNewConversation}
                    disabled={!newMessage.trim() || sending}
                    className="p-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          ) : selectedConversation ? (
            // Existing Conversation View
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
                      {selectedConversation.other_user?.user_type && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          getUserTypeBadge(selectedConversation.other_user.user_type).bg
                        } ${
                          getUserTypeBadge(selectedConversation.other_user.user_type).color
                        } flex items-center gap-0.5`}>
                          {getUserTypeBadge(selectedConversation.other_user.user_type).icon}
                          <span>{getUserTypeBadge(selectedConversation.other_user.user_type).text}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      {selectedConversation.related_booking && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[100px] sm:max-w-[150px]">
                            Booking #{selectedConversation.related_booking.booking_uid?.slice(0, 8)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
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
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white relative">
                {showSuggestions && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto z-50"
                  >
                    <div className="p-3 border-b border-gray-100 bg-gray-50 sticky top-0">
                      <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        {suggestionType === 'property' ? (
                          <>
                            <AtSign className="h-3 w-3" />
                            Mention a property
                            {fetchingSuggestions && (
                              <Loader className="h-3 w-3 animate-spin ml-2" />
                            )}
                          </>
                        ) : (
                          <>
                            <Hash className="h-3 w-3" />
                            Add a topic tag
                            {fetchingSuggestions && (
                              <Loader className="h-3 w-3 animate-spin ml-2" />
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    
                    {suggestions.length === 0 && fetchingSuggestions ? (
                      <div className="p-8 text-center">
                        <Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-gray-600">Finding properties...</p>
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="p-8 text-center">
                        {suggestionType === 'property' ? (
                          <>
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Home className="h-8 w-8 text-purple-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {searchTerm ? `No properties matching "${searchTerm}"` : 'Start typing to search'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Try typing a property name or location
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Hash className="h-8 w-8 text-blue-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {searchTerm ? `No tags matching "${searchTerm}"` : 'Start typing to find tags'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Common tags: #checkin, #payment, #wifi
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      suggestions.map((suggestion, index) => (
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
                                {suggestion.sourceDescription && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full mt-1 inline-block">
                                    {suggestion.sourceDescription}
                                  </span>
                                )}
                              </div>
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
                      ))
                    )}
                  </div>
                )}
                
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message... Use @ to mention properties, # for tags"
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none resize-none pr-20"
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
                              fetchPropertySuggestions('', selectedConversation?.id);
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
                    disabled={!newMessage.trim() || sending}
                    className="p-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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

        /* Pulse animation for skeletons */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}