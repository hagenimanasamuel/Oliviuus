import React, { useState, useRef, useEffect } from "react";
import {
  Film,
  Filter,
  Plus,
  X,
  ChevronDown,
  SlidersHorizontal,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

export default function ContentHeader({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  sort,
  setSort,
  totalContent = 0,
  filteredCount = 0,
  onAddContent,
  selectedContent = [],
  onBulkAction,
  onRefresh,
  loading = false,
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAdvancedFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Error refreshing content:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddContentClick = () => {
    if (onAddContent) {
      onAddContent();
    } else {
      console.warn("onAddContent prop is not provided");
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setSort("newest");
  };

  const hasActiveFilters = search || statusFilter || typeFilter;

  // Calculate display numbers
  const displayTotal = loading ? "..." : totalContent.toLocaleString();
  const displayFiltered = loading ? "..." : filteredCount.toLocaleString();
  const showFilteredCount = hasActiveFilters && filteredCount !== totalContent;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6">
      {/* Top Section - Stats, Search, and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        {/* Left Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#BC8BBC] to-purple-600 p-3 rounded-2xl">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                All Content
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayTotal}
                </p>
                {showFilteredCount && (
                  <span className="text-sm text-[#BC8BBC] font-medium">
                    ({displayFiltered} shown)
                  </span>
                )}
                {!showFilteredCount && hasActiveFilters && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ All content shown
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div
              className={`relative transition-all duration-200 ${
                isSearchFocused ? "ring-2 ring-[#BC8BBC] rounded-lg" : ""
              }`}
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search by title or description..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {selectedContent.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#BC8BBC] bg-[#BC8BBC]/10 text-[#BC8BBC] font-medium hover:bg-[#BC8BBC]/20 transition"
              >
                <span>
                  Bulk Actions ({selectedContent.length})
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showAdvancedFilters && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <button
                    onClick={() => onBulkAction("publish")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Publish Selected
                  </button>
                  <button
                    onClick={() => onBulkAction("draft")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Draft Selected
                  </button>
                  <button
                    onClick={() => onBulkAction("archive")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Archive Selected
                  </button>
                  <button
                    onClick={() => onBulkAction("delete")}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleAddContentClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium hover:from-[#9b69b2] hover:to-purple-700 transition-transform transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Content</span>
          </button>
        </div>
      </div>

      {/* Filters - SIMPLIFIED */}
      <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>

            {/* Status - Default to empty (All) */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {/* Content Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">All Types</option>
              <option value="movie">Movie</option>
              <option value="series">TV Series</option>
              <option value="documentary">Documentary</option>
              <option value="short_film">Short Film</option>
              <option value="live_event">Live Event</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Sort By
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title_asc">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}