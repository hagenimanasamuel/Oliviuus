import React, { useState, useEffect } from "react";
import { 
  Grid, 
  List, 
  Loader, 
  AlertCircle,
  Search,
  FilterX,
  Image as ImageIcon
} from "lucide-react";
import ContentCard from "./ContentCard";

const ContentList = ({
  contents = [],
  loading = false,
  error = null,
  viewMode = 'grid',
  onViewModeChange,
  onContentEdit,
  onContentDelete,
  onContentView,
  onContentPlay,
  selectedContents = [],
  onContentSelect,
  showSelection = false,
  emptyMessage = "No content found",
  onRetry,
  onLoadMore,
  hasMore = false
}) => {
  const [localViewMode, setLocalViewMode] = useState(viewMode);

  useEffect(() => {
    if (viewMode) {
      setLocalViewMode(viewMode);
    }
  }, [viewMode]);

  const handleViewModeChange = (mode) => {
    setLocalViewMode(mode);
    onViewModeChange?.(mode);
  };

  // Count content with images
  const contentWithImages = contents.filter(content => 
    content.media_assets?.some(asset => 
      ['thumbnail', 'poster'].includes(asset.asset_type) && 
      asset.upload_status === 'completed'
    )
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-[#BC8BBC] animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load content
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
          {typeof error === 'string' ? error : 'An error occurred while loading content.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {contents.length} content item{contents.length !== 1 ? 's' : ''}
          </div>
          {contentWithImages > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
              <ImageIcon className="w-3 h-3" />
              <span>{contentWithImages} with images</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                localViewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-700 text-[#BC8BBC] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                localViewMode === 'list' 
                  ? 'bg-white dark:bg-gray-700 text-[#BC8BBC] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid/List */}
      <div className={
        localViewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
      }>
        {contents.map((content) => (
          <ContentCard
            key={content.id}
            content={content}
            onEdit={onContentEdit}
            onDelete={onContentDelete}
            onView={onContentView}
            onPlay={onContentPlay}
            isSelected={selectedContents.includes(content.id)}
            onSelect={onContentSelect}
            showCheckbox={showSelection}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 border border-[#BC8BBC] text-[#BC8BBC] rounded-lg hover:bg-[#BC8BBC] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentList;