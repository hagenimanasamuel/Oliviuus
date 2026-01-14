import React, { useState, useEffect, useCallback } from "react";
import { 
  Filter, Download, RefreshCw, AlertTriangle, 
  CheckCircle, XCircle, Info, Shield, Lock, Eye, Ban,
  Calendar, Clock, ChevronLeft, ChevronRight
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

const SecurityLogsTab = ({ userDetails, userId }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    severity: "",
    date_start: "",
    date_end: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  const logTypes = [
    { value: "login", label: "Login Attempt", icon: Lock },
    { value: "password_change", label: "Password Change", icon: Shield },
    { value: "email_change", label: "Email Change", icon: Eye },
    { value: "suspicious_activity", label: "Suspicious Activity", icon: AlertTriangle },
    { value: "account_lockout", label: "Account Lockout", icon: Ban }
  ];

  const severityLevels = [
    { value: "low", label: "Low", color: "text-blue-400", bg: "bg-blue-400/10" },
    { value: "medium", label: "Medium", color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { value: "high", label: "High", color: "text-orange-400", bg: "bg-orange-400/10" },
    { value: "critical", label: "Critical", color: "text-red-400", bg: "bg-red-400/10" }
  ];

  const fetchSecurityLogs = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get(`/user/${userId}/security-logs`, { params });
      
      setLogs(response.data.logs || []);
      setTotalLogs(response.data.total || 0);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error("❌ Failed to fetch security logs:", error);
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchSecurityLogs();
  }, [fetchSecurityLogs]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSecurityLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      type: "",
      severity: "",
      date_start: "",
      date_end: ""
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getLogTypeConfig = (type) => {
    const logType = logTypes.find(t => t.value === type);
    if (!logType) return { label: type, icon: Info };
    return logType;
  };

  const getSeverityConfig = (severity) => {
    const severityConfig = severityLevels.find(s => s.value === severity);
    if (!severityConfig) return { label: severity, color: "text-gray-400", bg: "bg-gray-400/10" };
    return severityConfig;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-400" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const exportLogs = async () => {
    try {
      const response = await api.get(`/user/${userId}/security-logs/export`, {
        params: filters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `security-logs-${userId}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Failed to export logs:", error);
      alert("Failed to export security logs");
    }
  };

  const totalPages = Math.ceil(totalLogs / pagination.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security Logs</span>
          </h3>
          <p className="text-gray-400 text-sm">
            Monitor security events and activities for this user
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportLogs}
            disabled={isLoading || logs.length === 0}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchSecurityLogs}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </div>

          {/* Log Type */}
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-400 mb-1">Log Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
            >
              <option value="">All Types</option>
              {logTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="sm:w-32">
            <label className="block text-sm font-medium text-gray-400 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange("severity", e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
            >
              <option value="">All Levels</option>
              {severityLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 sm:flex-none">
            <label className="block text-sm font-medium text-gray-400 mb-1">From Date</label>
            <input
              type="date"
              value={filters.date_start}
              onChange={(e) => handleFilterChange("date_start", e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>
          <div className="flex-1 sm:flex-none">
            <label className="block text-sm font-medium text-gray-400 mb-1">To Date</label>
            <input
              type="date"
              value={filters.date_end}
              onChange={(e) => handleFilterChange("date_end", e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              Apply
            </button>
            <button
              onClick={handleClearFilters}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h4 className="text-gray-400 font-medium text-lg mb-2">No security logs found</h4>
            <p className="text-gray-500 text-sm">
              {filters.search || filters.type || filters.severity ? 
                "Try adjusting your filters to see more results" : 
                "No security events have been recorded for this user yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Event</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Severity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP Address</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {logs.map((log) => {
                    const typeConfig = getLogTypeConfig(log.event_type);
                    const severityConfig = getSeverityConfig(log.severity);
                    const IconComponent = typeConfig.icon;
                    
                    return (
                      <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <IconComponent className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-white text-sm font-medium truncate">
                                {log.description || log.event_type}
                              </div>
                              {log.details && (
                                <div className="text-gray-400 text-xs truncate">
                                  {log.details}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300 text-sm capitalize">
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={clsx(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                            severityConfig.bg,
                            severityConfig.color
                          )}>
                            {severityConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(log.status)}
                            <span className={clsx(
                              "text-sm capitalize",
                              log.status === "success" && "text-green-400",
                              log.status === "failed" && "text-red-400",
                              log.status === "warning" && "text-yellow-400"
                            )}>
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300 text-sm font-mono">
                            {log.ip_address || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>{formatDateTime(log.created_at)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700/50">
                <div className="text-gray-400 text-sm">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalLogs)} of {totalLogs} logs
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={clsx(
                            "px-3 py-1 rounded-lg text-sm font-medium",
                            pagination.page === pageNum
                              ? "bg-purple-600 text-white"
                              : "text-gray-400 hover:bg-gray-700"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityLogsTab;