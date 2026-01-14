import React, { useState, useRef, useEffect } from "react";
import {
  Gamepad2,
  Filter,
  Download,
  Plus,
  X,
  ChevronDown,
  SlidersHorizontal,
  ChevronUp,
  RefreshCw,
  BarChart3,
  Puzzle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../../../api/axios";

export default function GamesHeader({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  ageFilter,
  setAgeFilter,
  sort,
  setSort,
  totalGames = 0,
  filteredCount = 0,
  onAddGame,
  onExport,
  selectedGames = [],
  onBulkAction,
  dateRange,
  setDateRange,
  onRefresh,
}) {
  const { t } = useTranslation();
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
      console.error("Error refreshing games:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddGameClick = () => {
    if (onAddGame) {
      onAddGame();
    } else {
      console.warn("onAddGame prop is not provided");
    }
  };

  const ageOptions = [
    { value: "3-5", label: "3-5 years" },
    { value: "6-8", label: "6-8 years" },
    { value: "9-12", label: "9-12 years" },
    { value: "all", label: "All ages" },
  ];

  const categoryOptions = [
    { value: "puzzle", label: "Puzzle" },
    { value: "educational", label: "Educational" },
    { value: "memory", label: "Memory" },
    { value: "math", label: "Math" },
    { value: "language", label: "Language" },
    { value: "creative", label: "Creative" },
    { value: "adventure", label: "Adventure" },
    { value: "arcade", label: "Arcade" },
  ];

  const clearAllFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setAgeFilter("");
    setSort("newest");
    setDateRange({ start: "", end: "" });
  };

  const hasActiveFilters =
    search ||
    categoryFilter ||
    statusFilter ||
    ageFilter ||
    dateRange.start ||
    dateRange.end;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6">
      {/* Top Section - Stats, Search, and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        {/* Left Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#BC8BBC] to-purple-600 p-3 rounded-2xl">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("gamesHeader.allGames")}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalGames}
                </p>
                {filteredCount !== totalGames && (
                  <span className="text-sm text-[#BC8BBC] font-medium">
                    ({filteredCount} {t("gamesHeader.filtered")})
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
                placeholder={t("gamesHeader.searchPlaceholder")}
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
            disabled={refreshing}
            title={t("gamesHeader.refresh")}
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

          {selectedGames.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#BC8BBC] bg-[#BC8BBC]/10 text-[#BC8BBC] font-medium hover:bg-[#BC8BBC]/20 transition"
              >
                <span>
                  {t("gamesHeader.bulkActions", { count: selectedGames.length })}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showAdvancedFilters && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <button
                    onClick={() => onBulkAction("activate")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {t("gamesHeader.activateSelected")}
                  </button>
                  <button
                    onClick={() => onBulkAction("deactivate")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {t("gamesHeader.deactivateSelected")}
                  </button>
                  <button
                    onClick={() => onBulkAction("feature")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {t("gamesHeader.featureSelected")}
                  </button>
                  <button
                    onClick={() => onBulkAction("delete")}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {t("gamesHeader.deleteSelected")}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">{t("gamesHeader.export")}</span>
          </button>

          <button
            onClick={handleAddGameClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium hover:from-[#9b69b2] hover:to-purple-500 transition-transform transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("gamesHeader.addGame")}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>{t("gamesHeader.filters")}:</span>
            </div>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t("gamesHeader.allCategories")}</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t("gamesHeader.allStatus")}</option>
              <option value="active">{t("gamesHeader.status.active")}</option>
              <option value="inactive">{t("gamesHeader.status.inactive")}</option>
              <option value="draft">{t("gamesHeader.status.draft")}</option>
              <option value="maintenance">{t("gamesHeader.status.maintenance")}</option>
            </select>

            {/* Age Range */}
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t("gamesHeader.allAges")}</option>
              {ageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Advanced */}
            <button
              onClick={() => setShowAdvancedSection(!showAdvancedSection)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition text-sm"
            >
              <span>{t("gamesHeader.advanced")}</span>
              {showAdvancedSection ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                <X className="w-3 h-3" />
                {t("gamesHeader.clearAll")}
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("gamesHeader.sortBy")}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="newest">{t("gamesHeader.sort.newest")}</option>
              <option value="oldest">{t("gamesHeader.sort.oldest")}</option>
              <option value="title_asc">{t("gamesHeader.sort.titleAsc")}</option>
              <option value="title_desc">{t("gamesHeader.sort.titleDesc")}</option>
              <option value="popular">{t("gamesHeader.sort.popular")}</option>
              <option value="rating">{t("gamesHeader.sort.rating")}</option>
              <option value="age_asc">{t("gamesHeader.sort.ageAsc")}</option>
              <option value="age_desc">{t("gamesHeader.sort.ageDesc")}</option>
            </select>
          </div>
        </div>

        {showAdvancedSection && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gamesHeader.createdDate")}
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, start: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gamesHeader.minPlayers")}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >
                  {t("gamesHeader.clearAdvanced")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}