import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Film, Calendar, Clock, Eye, Edit, Trash2, X,
  Play, Tv, Radio, Image as ImageIcon, AlertTriangle,
  CheckCircle, XCircle, PauseCircle, Download, Share,
  MoreHorizontal, RefreshCw, Ellipsis, BarChart3,
  Users, Globe, Lock, FileText, Tag, FolderOpen,
  ChevronRight, Settings, Archive, Send, Copy,
  UserCheck, UserCog, Award, Camera, Edit3, Plus
} from "lucide-react";
import clsx from "clsx";
import OverviewTab from "./ContentModalTabs/OverviewTab";
import MediaTab from "./ContentModalTabs/MediaTab";
import AnalyticsTab from "./ContentModalTabs/AnalyticsTab";
import RightsTab from "./ContentModalTabs/RightsTab";
import SettingsTab from "./ContentModalTabs/SettingsTab";
import CastingTab from "./ContentModalTabs/CastingTab"; // New import
import api from "../../../../../api/axios";

export default function ContentDetailModal({
  content,
  onClose,
  onEdit,
  onDelete,
  onPlay,
  onArchive,
  onDuplicate,
  onSettingsUpdate
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentContent, setCurrentContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);

  const containerRef = useRef(null);
  const moreButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  const tabContainerRef = useRef(null);
  const tabMoreButtonRef = useRef(null);
  const tabDropdownRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const isCalculatingRef = useRef(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "casting", label: "Casting", icon: Users }, // New tab
    { id: "media", label: "Media", icon: FolderOpen },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "rights", label: "Rights & Distribution", icon: Globe },
    { id: "settings", label: "Settings", icon: Settings }
  ];
  useEffect(() => {
    if (content) {
      setIsVisible(true);
      setIsClosing(false);
      setCurrentContent(content);
    }
  }, [content]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Close dropdowns when clicking outside
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

      if (
        showTabDropdown &&
        tabMoreButtonRef.current &&
        !tabMoreButtonRef.current.contains(event.target) &&
        tabDropdownRef.current &&
        !tabDropdownRef.current.contains(event.target)
      ) {
        setShowTabDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreActions, showTabDropdown]);

  // Responsive tabs handling
  const handleResize = useCallback(() => {
    if (!tabContainerRef.current || isCalculatingRef.current) return;

    isCalculatingRef.current = true;

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const container = tabContainerRef.current;
      const containerWidth = container.offsetWidth;
      let usedWidth = 0;
      const newVisible = [];
      const newOverflow = [];

      tabs.forEach(tab => {
        const tabElement = container.querySelector(`[data-tab="${tab.id}"]`);
        if (tabElement) {
          tabElement.style.display = 'flex';
          tabElement.style.visibility = 'hidden';
        }
      });

      container.offsetHeight;

      const moreButtonWidth = 80;

      tabs.forEach(tab => {
        const tabElement = container.querySelector(`[data-tab="${tab.id}"]`);
        if (!tabElement) return;

        const tabWidth = tabElement.offsetWidth + 8;
        if (usedWidth + tabWidth <= containerWidth - moreButtonWidth) {
          newVisible.push(tab);
          usedWidth += tabWidth;
          tabElement.style.visibility = 'visible';
        } else {
          newOverflow.push(tab);
          tabElement.style.display = 'none';
        }
      });

      setVisibleTabs(newVisible);
      setOverflowTabs(newOverflow);

      isCalculatingRef.current = false;
    }, 100);
  }, [tabs]);

  useEffect(() => {
    handleResize();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === tabContainerRef.current) {
          handleResize();
        }
      }
    });

    if (tabContainerRef.current) {
      resizeObserver.observe(tabContainerRef.current);
    }

    const handleWindowResize = () => {
      handleResize();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleAction = (action) => {
    handleClose();
    setTimeout(() => {
      action?.(currentContent);
    }, 300);
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await api.put(`/contents/${currentContent.id}/publish`);
      const updatedContent = { ...currentContent, status: 'published' };
      setCurrentContent(updatedContent);
    } catch (error) {
      console.error("Failed to publish content:", error);
      alert("Failed to publish content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm(`Are you sure you want to archive "${currentContent.title}"?`)) return;

    setIsLoading(true);
    try {
      await api.put(`/contents/${currentContent.id}/archive`);
      const updatedContent = { ...currentContent, status: 'archived' };
      setCurrentContent(updatedContent);
      onArchive?.(currentContent);
    } catch (error) {
      console.error("Failed to archive content:", error);
      alert("Failed to archive content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`/contents/${currentContent.id}/duplicate`);
      onDuplicate?.(currentContent);
      handleClose();
    } catch (error) {
      console.error("Failed to duplicate content:", error);
      alert("Failed to duplicate content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAssets = async () => {
    setIsLoading(true);
    try {
      // Implementation for downloading assets
      console.log("Download assets for content:", currentContent.id);
      // This would typically trigger a zip download of all media assets
      alert("Download functionality will be implemented soon");
    } catch (error) {
      console.error("Failed to download assets:", error);
      alert("Failed to download assets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsUpdate = async (settings) => {
    setIsLoading(true);
    try {
      await api.put(`/contents/${currentContent.id}/settings`, settings);
      const updatedContent = await api.get(`/contents/${currentContent.id}`);
      setCurrentContent(updatedContent.data);
      onSettingsUpdate?.(currentContent.id, settings);
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert("Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'draft': return <PauseCircle className="w-3.5 h-3.5 text-yellow-500" />;
      case 'archived': return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      default: return <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return "bg-green-500";
      case 'draft': return "bg-yellow-500";
      case 'archived': return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'published': return { label: "Published", icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10" };
      case 'draft': return { label: "Draft", icon: PauseCircle, color: "text-yellow-400", bg: "bg-yellow-400/10" };
      case 'archived': return { label: "Archived", icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" };
      default: return { label: "Unknown", icon: AlertTriangle, color: "text-gray-400", bg: "bg-gray-400/10" };
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />;
      case 'series': return <Tv className="w-4 h-4" />;
      case 'live_event': return <Radio className="w-4 h-4" />;
      default: return <Film className="w-4 h-4" />;
    }
  };

  const getContentTypeConfig = (type) => {
    switch (type) {
      case 'movie': return { label: "Movie", color: "text-blue-400", bg: "bg-blue-400/10" };
      case 'series': return { label: "Series", color: "text-purple-400", bg: "bg-purple-400/10" };
      case 'live_event': return { label: "Live Event", color: "text-orange-400", bg: "bg-orange-400/10" };
      default: return { label: "Content", color: "text-gray-400", bg: "bg-gray-400/10" };
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getPrimaryImage = () => {
    if (!currentContent.media_assets || currentContent.media_assets.length === 0) {
      return null;
    }

    const assetTypes = [
      { type: 'thumbnail', primary: true },
      { type: 'thumbnail', primary: false },
      { type: 'poster', primary: true },
      { type: 'poster', primary: false }
    ];

    for (const { type, primary } of assetTypes) {
      const asset = currentContent.media_assets.find(asset =>
        asset.asset_type === type &&
        asset.upload_status === 'completed' &&
        (primary ? asset.is_primary === 1 : true)
      );

      if (asset && asset.url) {
        return asset.url;
      }
    }

    return null;
  };

  if (!currentContent || !isVisible) return null;

  const statusConfig = getStatusConfig(currentContent.status);
  const typeConfig = getContentTypeConfig(currentContent.content_type);
  const imageUrl = getPrimaryImage();

  const actionButtons = [
    {
      id: "play",
      icon: Play,
      label: "Play Content",
      onClick: () => handleAction(onPlay),
      disabled: isLoading,
      priority: "high"
    },
    {
      id: "edit",
      icon: Edit,
      label: "Edit Content",
      onClick: () => handleAction(onEdit),
      disabled: isLoading,
      priority: "high"
    },
    {
      id: "publish",
      icon: Send,
      label: currentContent.status === 'published' ? "Unpublish" : "Publish",
      onClick: handlePublish,
      disabled: isLoading,
      priority: "medium"
    },
    {
      id: "duplicate",
      icon: Copy,
      label: "Duplicate",
      onClick: handleDuplicate,
      disabled: isLoading,
      priority: "medium"
    },
    {
      id: "download",
      icon: Download,
      label: "Download Assets",
      onClick: handleDownloadAssets,
      disabled: isLoading,
      priority: "medium"
    },
    {
      id: "archive",
      icon: Archive,
      label: currentContent.status === 'archived' ? "Unarchive" : "Archive",
      onClick: handleArchive,
      disabled: isLoading,
      priority: "low"
    },
    {
      id: "delete",
      icon: Trash2,
      label: "Delete",
      onClick: () => handleAction(onDelete),
      destructive: true,
      disabled: isLoading,
      priority: "low"
    }
  ];

  const highPriorityButtons = actionButtons.filter(btn => btn.priority === "high");
  const mediumPriorityButtons = actionButtons.filter(btn => btn.priority === "medium");
  const lowPriorityButtons = actionButtons.filter(btn => btn.priority === "low");


  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 transition-all duration-300",
        isVisible ? "bg-black/60" : "bg-transparent",
        isClosing ? "bg-black/0" : ""
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          "bg-gray-900 border border-gray-700 rounded-xl w-full max-w-6xl max-h-[95vh] sm:max-h-[85vh] shadow-2xl transform transition-all duration-300 overflow-hidden flex flex-col",
          isClosing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={currentContent.title}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                  />
                ) : (
                  <Film className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </div>
              <div className={clsx("absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-gray-900", getStatusColor(currentContent.status))} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                <h2 className="text-white text-base sm:text-lg font-bold truncate">
                  {currentContent.title}
                </h2>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={clsx(
                    "inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0",
                    typeConfig.bg,
                    typeConfig.color
                  )}>
                    {getContentTypeIcon(currentContent.content_type)}
                    <span className="hidden xs:inline text-xs">{typeConfig.label}</span>
                  </span>
                  <span className={clsx(
                    "inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0",
                    statusConfig.bg,
                    statusConfig.color
                  )}>
                    {getStatusIcon(currentContent.status)}
                    <span className="text-xs">{statusConfig.label}</span>
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-xs truncate mt-0.5">
                {currentContent.short_description || currentContent.description}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white flex-shrink-0 ml-1"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Responsive Tabs */}
        <div className="border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center relative px-3 sm:px-4" ref={tabContainerRef}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={isLoading}
                className={clsx(
                  "flex items-center space-x-1.5 px-2 sm:px-3 py-2 text-xs font-medium transition-all duration-200 capitalize flex-shrink-0",
                  activeTab === tab.id
                    ? "text-white border-b-2 border-purple-500"
                    : "text-gray-400 hover:text-gray-300",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline text-xs">{tab.label}</span>
              </button>
            ))}

            {overflowTabs.length > 0 && (
              <div className="relative ml-auto" ref={tabMoreButtonRef}>
                <button
                  onClick={() => setShowTabDropdown(!showTabDropdown)}
                  className="flex items-center px-2 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Ellipsis className="w-3.5 h-3.5" />
                </button>
                {showTabDropdown && (
                  <div
                    className="absolute right-0 top-full mt-1 w-40 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-40"
                    ref={tabDropdownRef}
                  >
                    {overflowTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowTabDropdown(false);
                        }}
                        className={clsx(
                          "flex items-center space-x-2 w-full text-left px-3 py-2 text-xs transition first:rounded-t-lg last:rounded-b-lg",
                          activeTab === tab.id
                            ? "bg-gray-800 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 sm:p-4">
            {activeTab === "overview" && (
              <OverviewTab content={currentContent} />
            )}
            {activeTab === "casting" && (
              <CastingTab content={currentContent} />
            )}
            {activeTab === "media" && (
              <MediaTab content={currentContent} />
            )}
            {activeTab === "analytics" && (
              <AnalyticsTab content={currentContent} />
            )}
            {activeTab === "rights" && (
              <RightsTab content={currentContent} />
            )}
            {activeTab === "settings" && (
              <SettingsTab
                content={currentContent}
                onSettingsUpdate={handleSettingsUpdate}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center p-3 sm:p-4 border-t border-gray-800 bg-gray-900/50 gap-2 flex-shrink-0" ref={containerRef}>
          <div className="flex flex-wrap gap-1.5 justify-center xs:justify-start">
            {highPriorityButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={btn.onClick}
                disabled={btn.disabled}
                className={clsx(
                  "flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded transition text-xs font-medium border min-w-0 flex-1 xs:flex-none justify-center",
                  btn.destructive
                    ? "text-red-400 hover:bg-red-400/10 border-red-400/20"
                    : "text-gray-300 hover:bg-gray-800 border-gray-700",
                  btn.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {btn.loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                ) : (
                  <btn.icon className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="whitespace-nowrap hidden sm:inline text-xs">{btn.label}</span>
                <span className="whitespace-nowrap sm:hidden text-xs">
                  {btn.id === "play" ? "Play" : btn.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center xs:justify-end">
            <div className="hidden sm:flex gap-1.5">
              {mediumPriorityButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  className={clsx(
                    "flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded transition text-xs font-medium border min-w-0",
                    "text-gray-300 hover:bg-gray-800 border-gray-700",
                    btn.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <btn.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap text-xs">{btn.label}</span>
                </button>
              ))}
            </div>

            {(mediumPriorityButtons.length > 0 || lowPriorityButtons.length > 0) && (
              <div className="relative" ref={moreButtonRef}>
                <button
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded transition text-xs font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 min-w-0"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap hidden xs:inline text-xs">More</span>
                </button>

                {showMoreActions && (
                  <div
                    className="absolute right-0 bottom-full mb-1.5 w-40 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-40"
                    ref={dropdownRef}
                  >
                    {mediumPriorityButtons.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => {
                          btn.onClick();
                          setShowMoreActions(false);
                        }}
                        disabled={btn.disabled}
                        className={clsx(
                          "flex items-center space-x-2 w-full text-left px-3 py-2 text-xs transition first:rounded-t-lg last:rounded-b-lg",
                          "text-gray-300 hover:bg-gray-800 hover:text-white",
                          btn.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <btn.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs">{btn.label}</span>
                      </button>
                    ))}

                    {lowPriorityButtons.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => {
                          btn.onClick();
                          setShowMoreActions(false);
                        }}
                        disabled={btn.disabled}
                        className={clsx(
                          "flex items-center space-x-2 w-full text-left px-3 py-2 text-xs transition first:rounded-t-lg last:rounded-b-lg",
                          btn.destructive
                            ? "text-red-400 hover:bg-red-400/10"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white",
                          btn.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <btn.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-50">
            <div className="flex items-center gap-2 text-white text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}