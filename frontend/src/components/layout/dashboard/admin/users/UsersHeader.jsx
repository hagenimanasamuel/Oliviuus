// src/components/layout/dashboard/admin/UsersHeader.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Filter,
  Download,
  Plus,
  X,
  ChevronDown,
  SlidersHorizontal,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../../../api/axios";

export default function UsersHeader({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  filteredCount = 0,
  onAddUser,
  onExport,
  selectedUsers = [],
  onBulkAction,
  dateRange,
  setDateRange,
  lastLogin,
  setLastLogin,
  onRefresh,
}) {
  const { t } = useTranslation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
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

  // Fetch total users every 5 seconds
  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const res = await api.get("/user/total");
        setTotalUsers(res.data.total);
      } catch (err) {
        console.error("Error fetching total users:", err);
      }
    };

    fetchTotal();
    const interval = setInterval(fetchTotal, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      const res = await api.get("/user/total");
      setTotalUsers(res.data.total);
    } catch (err) {
      console.error("Error refreshing users:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddUserClick = () => {
    if (onAddUser) {
      onAddUser();
    } else {
      console.warn("onAddUser prop is not provided");
    }
  };

  const lastLoginOptions = [
    { value: "today", label: t("usersHeader.lastLoginOptions.today") },
    { value: "week", label: t("usersHeader.lastLoginOptions.week") },
    { value: "month", label: t("usersHeader.lastLoginOptions.month") },
    { value: "quarter", label: t("usersHeader.lastLoginOptions.quarter") },
    { value: "year", label: t("usersHeader.lastLoginOptions.year") },
    { value: "never", label: t("usersHeader.lastLoginOptions.never") },
  ];

  const clearAllFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setSort("newest");
    setDateRange({ start: "", end: "" });
    setLastLogin("");
  };

  const hasActiveFilters =
    search ||
    roleFilter ||
    statusFilter ||
    dateRange.start ||
    dateRange.end ||
    lastLogin;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6">
      {/* Top Section - Stats, Search, and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        {/* Left Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#BC8BBC] to-purple-600 p-3 rounded-2xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("usersHeader.allUsers")}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalUsers}
                </p>
                {filteredCount !== totalUsers && (
                  <span className="text-sm text-[#BC8BBC] font-medium">
                    ({filteredCount} {t("usersHeader.filtered")})
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
                placeholder={t("usersHeader.searchPlaceholder")}
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
            title={t("usersHeader.refresh")}
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

          {selectedUsers.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#BC8BBC] bg-[#BC8BBC]/10 text-[#BC8BBC] font-medium hover:bg-[#BC8BBC]/20 transition"
              >
                <span>
                  {t("usersHeader.bulkActions", { count: selectedUsers.length })}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showAdvancedFilters && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <button
                    onClick={() => onBulkAction("activate")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {t("usersHeader.activateSelected")}
                  </button>
                  <button
                    onClick={() => onBulkAction("deactivate")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {t("usersHeader.deactivateSelected")}
                  </button>
                  <button
                    onClick={() => onBulkAction("delete")}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {t("usersHeader.deleteSelected")}
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
            <span className="hidden lg:inline">{t("usersHeader.export")}</span>
          </button>

          <button
            onClick={handleAddUserClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium hover:from-[#9b69b2] hover:to-purple-500 transition-transform transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("usersHeader.addUser")}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>{t("usersHeader.filters")}:</span>
            </div>

            {/* Roles */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t("usersHeader.allRoles")}</option>
              <option value="admin">{t("usersHeader.roles.admin")}</option>
              <option value="viewer">{t("usersHeader.roles.viewer")}</option>
              <option value="moderator">{t("usersHeader.roles.moderator")}</option>
              <option value="editor">{t("usersHeader.roles.editor")}</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t("usersHeader.allStatus")}</option>
              <option value="active">{t("usersHeader.status.active")}</option>
              <option value="inactive">{t("usersHeader.status.inactive")}</option>
              <option value="suspended">{t("usersHeader.status.suspended")}</option>
              <option value="pending">{t("usersHeader.status.pending")}</option>
            </select>

            {/* Last Login */}
            <select
              value={lastLogin}
              onChange={(e) => setLastLogin(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t("usersHeader.lastLogin")}</option>
              {lastLoginOptions.map((option) => (
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
              <span>{t("usersHeader.advanced")}</span>
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
                {t("usersHeader.clearAll")}
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("usersHeader.sortBy")}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="newest">{t("usersHeader.sort.newest")}</option>
              <option value="oldest">{t("usersHeader.sort.oldest")}</option>
              <option value="email_asc">{t("usersHeader.sort.emailAsc")}</option>
              <option value="email_desc">{t("usersHeader.sort.emailDesc")}</option>
              <option value="role">{t("usersHeader.sort.role")}</option>
              <option value="last_login">
                {t("usersHeader.sort.lastLogin")}
              </option>
            </select>
          </div>
        </div>

        {showAdvancedSection && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("usersHeader.registrationDate")}
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

              <div className="flex items-end">
                <button
                  onClick={() => setDateRange({ start: "", end: "" })}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >
                  {t("usersHeader.clearAdvanced")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
