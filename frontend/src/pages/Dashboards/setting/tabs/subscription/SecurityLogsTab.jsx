// src/pages/account/tabs/subscription/SecurityLogsTab.jsx
import React, { useState, useEffect } from "react";
import { 
  Download, 
  Filter, 
  Calendar, 
  BarChart, 
  PieChart, 
  AlertTriangle, 
  ShieldAlert,
  Users,
  Activity,
  Clock,
  Eye,
  EyeOff,
  Search,
  Lock,
  RefreshCw,
  FileText, // PDF icon
  FileJson, // JSON icon
  FileSpreadsheet // CSV icon
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../../../api/axios";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SecurityLogsTab({ user, isFamilyOwner, kidProfiles }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [activitySummary, setActivitySummary] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedKid, setSelectedKid] = useState(null);
  const [dateRange, setDateRange] = useState('7days');
  const [exportLoading, setExportLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, [dateRange, selectedKid]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSecurityLogs(),
        loadActivitySummary(),
        loadDashboardStats()
      ]);
    } catch (error) {
      console.error("Error loading security logs data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        period: dateRange
      });
      
      if (selectedKid) {
        params.append('kid_profile_id', selectedKid);
      }
      
      const response = await api.get(`/kids/security-logs?${params}`);
      setSecurityLogs(response.data.data?.logs || []);
    } catch (error) {
      console.error("Error loading security logs:", error);
    }
  };

  const loadActivitySummary = async () => {
    try {
      const response = await api.get(`/kids/activity-summary?period=${dateRange}`);
      setActivitySummary(response.data.data);
    } catch (error) {
      console.error("Error loading activity summary:", error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await api.get("/kids/dashboard-stats");
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  };

  // Enhanced PDF Export with Professional Branding
  const generatePDFReport = async () => {
    try {
      setExportLoading(true);
      
      // Create PDF with professional styling
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });
      
      // Add Professional Header with Oliviuus Branding
      pdf.setFillColor(188, 139, 188); // #BC8BBC brand color
      pdf.rect(0, 0, 210, 35, 'F');
      
      // Logo/Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text(t('securityLogs.pdf.title', 'Oliviuus Security Report'), 105, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(t('securityLogs.pdf.subtitle', 'Professional Child Activity & Security Analysis'), 105, 28, { align: 'center' });
      
      // Report Info Section
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(`${t('securityLogs.pdf.reportGenerated', 'Report Generated')}: ${new Date().toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 15, 45);
      
      const selectedKidName = selectedKid ? kidProfiles.find(k => k.id === selectedKid)?.name : t('securityLogs.allKids', 'All Kids');
      pdf.text(`${t('securityLogs.pdf.reportFor', 'Report For')}: ${selectedKidName}`, 15, 52);
      pdf.text(`${t('securityLogs.pdf.timePeriod', 'Time Period')}: ${t(`securityLogs.timeRanges.${dateRange}`, getDefaultTimeRange(dateRange))}`, 15, 59);
      
      // Add decorative line
      pdf.setDrawColor(188, 139, 188);
      pdf.setLineWidth(0.5);
      pdf.line(15, 65, 195, 65);
      
      let yPosition = 75;
      
      // Function to add section
      const addSection = (title, content) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
          // Add header to new page
          pdf.setFillColor(188, 139, 188);
          pdf.rect(0, 0, 210, 35, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(28);
          pdf.setFont("helvetica", "bold");
          pdf.text(t('securityLogs.pdf.title', 'Oliviuus Security Report'), 105, 20, { align: 'center' });
          pdf.setFontSize(10);
          pdf.text(t('securityLogs.pdf.subtitle', 'Professional Child Activity & Security Analysis'), 105, 28, { align: 'center' });
          yPosition = 40;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(188, 139, 188);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, 15, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        
        if (typeof content === 'string') {
          const lines = pdf.splitTextToSize(content, 180);
          pdf.text(lines, 15, yPosition);
          yPosition += (lines.length * 6) + 10;
        } else if (Array.isArray(content)) {
          content.forEach((item, index) => {
            pdf.text(`• ${item}`, 20, yPosition);
            yPosition += 6;
          });
          yPosition += 5;
        }
        
        yPosition += 10;
      };
      
      // Executive Summary Section
      if (dashboardStats) {
        addSection(t('securityLogs.pdf.sections.executiveSummary', '📊 Executive Summary'), [
          `${t('securityLogs.pdf.totalKidsMonitored', 'Total Kids Monitored')}: ${dashboardStats.total_kids}`,
          `${t('securityLogs.pdf.todaysActivities', "Today's Activities")}: ${dashboardStats.today_activity?.total || 0}`,
          `${t('securityLogs.pdf.activitiesBlocked', 'Activities Blocked')}: ${dashboardStats.today_activity?.blocked || 0}`,
          `${t('securityLogs.pdf.pendingAlerts', 'Pending Alerts')}: ${dashboardStats.alerts?.pending_notifications || 0}`,
          `${t('securityLogs.pdf.timeLimitWarnings', 'Time Limit Warnings')}: ${dashboardStats.alerts?.time_limit_warnings || 0}`
        ]);
      }
      
      // Activity Summary Section
      if (activitySummary) {
        const blockRate = activitySummary.summary?.total_activities > 0 
          ? ((activitySummary.summary.blocked_activities / activitySummary.summary.total_activities) * 100).toFixed(1)
          : 0;
          
        addSection(t('securityLogs.pdf.sections.activitySummary', '📈 Activity Summary'), [
          `${t('securityLogs.pdf.totalActivities', 'Total Activities')}: ${activitySummary.summary?.total_activities || 0}`,
          `${t('securityLogs.pdf.allowedActivities', 'Allowed Activities')}: ${activitySummary.summary?.allowed_activities || 0}`,
          `${t('securityLogs.pdf.blockedActivities', 'Blocked Activities')}: ${activitySummary.summary?.blocked_activities || 0}`,
          `${t('securityLogs.pdf.blockRate', 'Block Rate')}: ${blockRate}%`,
          `${t('securityLogs.pdf.peakActivityHour', 'Peak Activity Hour')}: ${activitySummary.peak_hours?.[0]?.hour || t('securityLogs.pdf.noData', 'No data')}:00`
        ]);
      }
      
      // Most Active Kid
      if (dashboardStats?.most_active_kid) {
        addSection(t('securityLogs.pdf.sections.mostActiveKid', '👑 Most Active Kid'), [
          `${t('securityLogs.pdf.kidName', 'Kid Name')}: ${dashboardStats.most_active_kid.kid_name}`,
          `${t('securityLogs.pdf.activityCount', 'Activity Count')}: ${dashboardStats.most_active_kid.activity_count}`,
          `${t('securityLogs.pdf.averageDaily', 'Average Daily Activities')}: ${Math.round(dashboardStats.most_active_kid.activity_count / 7)}`
        ]);
      }
      
      // Activity Logs Table
      if (securityLogs.length > 0) {
        addSection(t('securityLogs.pdf.sections.detailedLogs', '📋 Detailed Activity Logs'), []);
        
        // Prepare table data
        const tableData = securityLogs.map(log => [
          log.kid_name || t('securityLogs.pdf.unknownKid', 'Unknown Kid'),
          formatActivityType(log.activity_type),
          log.was_allowed ? t('securityLogs.pdf.allowed', 'Allowed') : t('securityLogs.pdf.blocked', 'Blocked'),
          log.activity_details ? JSON.stringify(log.activity_details).substring(0, 50) + '...' : '-',
          new Date(log.created_at).toLocaleDateString(i18n.language)
        ]);
        
        autoTable(pdf, {
          startY: yPosition,
          head: [[
            t('securityLogs.pdf.tableHeaders.kid', 'Kid'),
            t('securityLogs.pdf.tableHeaders.activity', 'Activity'),
            t('securityLogs.pdf.tableHeaders.status', 'Status'),
            t('securityLogs.pdf.tableHeaders.details', 'Details'),
            t('securityLogs.pdf.tableHeaders.date', 'Date')
          ]],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [188, 139, 188],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 15, right: 15 },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 20 },
            3: { cellWidth: 50 },
            4: { cellWidth: 25 }
          }
        });
        
        yPosition = pdf.lastAutoTable.finalY + 20;
      }
      
      // Recommendations Section
      addSection(t('securityLogs.pdf.sections.recommendations', '💡 Security Recommendations'), [
        t('securityLogs.pdf.recommendations.reviewLogs', 'Regularly review activity logs for unusual patterns'),
        t('securityLogs.pdf.recommendations.updateRestrictions', 'Update content restrictions based on blocked activities'),
        t('securityLogs.pdf.recommendations.monitorPeakHours', 'Monitor peak activity hours for time management'),
        t('securityLogs.pdf.recommendations.educateKids', 'Educate children about digital safety based on blocked attempts'),
        t('securityLogs.pdf.recommendations.adjustSettings', 'Adjust parental controls based on activity patterns')
      ]);
      
      // Footer on all pages
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        
        // Footer line
        pdf.setDrawColor(188, 139, 188);
        pdf.setLineWidth(0.3);
        pdf.line(15, 285, 195, 285);
        
        // Footer text
        pdf.text(t('securityLogs.pdf.footer.confidential', 'CONFIDENTIAL - For authorized use only'), 15, 290);
        pdf.text(t('securityLogs.pdf.footer.oliviuus', 'Oliviuus Child Security Platform'), 105, 290, { align: 'center' });
        pdf.text(`${t('securityLogs.pdf.footer.page', 'Page')} ${i} ${t('securityLogs.pdf.footer.of', 'of')} ${pageCount}`, 195, 290, { align: 'right' });
      }
      
      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Oliviuus_Security_Report_${timestamp}_${selectedKidName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(filename);
      
      return true;
    } catch (error) {
      console.error("Error generating PDF report:", error);
      throw error;
    }
  };

  const getDefaultTimeRange = (range) => {
    switch(range) {
      case '7days': return 'Last 7 days';
      case '30days': return 'Last 30 days';
      case '90days': return 'Last 90 days';
      default: return 'Last 7 days';
    }
  };

  const exportLogs = async () => {
    try {
      setExportLoading(true);
      
      if (exportFormat === 'pdf') {
        await generatePDFReport();
        alert(t('securityLogs.exportSuccess.pdf', 'PDF report generated successfully!'));
      } else {
        const response = await api.get(`/kids/export-logs?format=${exportFormat}`, {
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        
        // Set filename based on format
        const timestamp = new Date().toISOString().split('T')[0];
        let filename = '';
        let extension = '';
        
        switch(exportFormat) {
          case 'pdf':
            filename = `oliviuus-security-report-${timestamp}.pdf`;
            extension = 'application/pdf';
            break;
          case 'json':
            filename = `oliviuus-activity-logs-${timestamp}.json`;
            extension = 'application/json';
            break;
          case 'csv':
            filename = `oliviuus-activity-logs-${timestamp}.csv`;
            extension = 'text/csv';
            break;
        }
        
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error("Error exporting logs:", error);
      alert(t('securityLogs.exportError', 'Failed to export activity logs. Please try again.'));
    } finally {
      setExportLoading(false);
    }
  };

  const refreshData = () => {
    loadAllData();
  };

  const getActivityTypeIcon = (type) => {
    switch(type) {
      case 'content_view':
      case 'content_attempt':
        return <Eye size={14} className="text-blue-400" />;
      case 'search':
        return <Search size={14} className="text-green-400" />;
      case 'time_limit':
        return <Clock size={14} className="text-yellow-400" />;
      case 'pin_entry':
        return <Lock size={14} className="text-purple-400" />;
      case 'mode_switch':
        return <RefreshCw size={14} className="text-orange-400" />;
      default:
        return <Activity size={14} className="text-gray-400" />;
    }
  };

  const formatActivityType = (type) => {
    return type ? type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1) : 'Unknown';
  };

  if (loading && !securityLogs.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-400">
                {t('securityLogs.stats.totalKids', 'Total Kids')}
              </h4>
              <Users size={16} className="text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.total_kids}</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-400">
                {t('securityLogs.stats.todayActivities', "Today's Activities")}
              </h4>
              <Activity size={16} className="text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.today_activity.total}</p>
            <p className="text-xs text-gray-400 mt-1">
              {dashboardStats.today_activity.blocked} {t('securityLogs.stats.blocked', 'blocked')}
            </p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-400">
                {t('securityLogs.stats.pendingAlerts', 'Pending Alerts')}
              </h4>
              <AlertTriangle size={16} className="text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.alerts.pending_notifications}</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-400">
                {t('securityLogs.stats.timeLimitWarnings', 'Time Limit Warnings')}
              </h4>
              <ShieldAlert size={16} className="text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white">{dashboardStats.alerts.time_limit_warnings}</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-900 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            <Filter size={16} />
            {t('securityLogs.filters', 'Filters')}
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="7days">{t('securityLogs.timeRanges.7days', 'Last 7 days')}</option>
              <option value="30days">{t('securityLogs.timeRanges.30days', 'Last 30 days')}</option>
              <option value="90days">{t('securityLogs.timeRanges.90days', 'Last 90 days')}</option>
            </select>
          </div>
          
          {kidProfiles.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedKid || ''}
                onChange={(e) => setSelectedKid(e.target.value || null)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">{t('securityLogs.allKids', 'All Kids')}</option>
                {kidProfiles.map(kid => (
                  <option key={kid.id} value={kid.id}>{kid.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            <RefreshCw size={16} />
            {t('securityLogs.refresh', 'Refresh')}
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Export Format Selection */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-400 mr-2">
              {t('securityLogs.export.format', 'Format:')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-1 rounded ${exportFormat === 'pdf' ? 'bg-[#BC8BBC] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                title={t('securityLogs.export.pdfTooltip', 'PDF Professional Report')}
              >
                <FileText size={16} />
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-1 rounded ${exportFormat === 'csv' ? 'bg-[#BC8BBC] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                title={t('securityLogs.export.csvTooltip', 'CSV Data File')}
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`p-1 rounded ${exportFormat === 'json' ? 'bg-[#BC8BBC] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                title={t('securityLogs.export.jsonTooltip', 'JSON Data File')}
              >
                <FileJson size={16} />
              </button>
            </div>
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportLogs}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
          >
            <Download size={16} />
            {exportLoading 
              ? t('securityLogs.export.exporting', 'Exporting...')
              : `${t('securityLogs.export.export', 'Export')} ${exportFormat.toUpperCase()}`
            }
          </button>
        </div>
      </div>

      {/* Export Format Info */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${exportFormat === 'pdf' ? 'border-[#BC8BBC] bg-[#BC8BBC]/10' : 'border-gray-700 bg-gray-800'}`}>
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} className="text-red-400" />
              <h4 className="font-medium text-white">
                {t('securityLogs.exportFormats.pdf.title', 'PDF Professional Report')}
              </h4>
            </div>
            <p className="text-sm text-gray-400">
              {t('securityLogs.exportFormats.pdf.description', 'Professional report with Oliviuus branding, summary, charts, and detailed logs. Best for presentations and reports.')}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg border ${exportFormat === 'csv' ? 'border-[#BC8BBC] bg-[#BC8BBC]/10' : 'border-gray-700 bg-gray-800'}`}>
            <div className="flex items-center gap-3 mb-2">
              <FileSpreadsheet size={24} className="text-green-400" />
              <h4 className="font-medium text-white">
                {t('securityLogs.exportFormats.csv.title', 'CSV Data File')}
              </h4>
            </div>
            <p className="text-sm text-gray-400">
              {t('securityLogs.exportFormats.csv.description', 'Spreadsheet format for data analysis in Excel, Google Sheets, or data processing tools.')}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg border ${exportFormat === 'json' ? 'border-[#BC8BBC] bg-[#BC8BBC]/10' : 'border-gray-700 bg-gray-800'}`}>
            <div className="flex items-center gap-3 mb-2">
              <FileJson size={24} className="text-yellow-400" />
              <h4 className="font-medium text-white">
                {t('securityLogs.exportFormats.json.title', 'JSON Data File')}
              </h4>
            </div>
            <p className="text-sm text-gray-400">
              {t('securityLogs.exportFormats.json.description', 'Structured data format for developers and programmers. Includes metadata and organized data.')}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('securityLogs.filterLabels.activityType', 'Activity Type')}
              </label>
              <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">{t('securityLogs.filterOptions.allTypes', 'All Types')}</option>
                <option value="content_view">{t('securityLogs.activityTypes.contentView', 'Content View')}</option>
                <option value="content_attempt">{t('securityLogs.activityTypes.contentAttempt', 'Content Attempt')}</option>
                <option value="search">{t('securityLogs.activityTypes.search', 'Search')}</option>
                <option value="time_limit">{t('securityLogs.activityTypes.timeLimit', 'Time Limit')}</option>
                <option value="pin_entry">{t('securityLogs.activityTypes.pinEntry', 'PIN Entry')}</option>
                <option value="mode_switch">{t('securityLogs.activityTypes.modeSwitch', 'Mode Switch')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('securityLogs.filterLabels.status', 'Status')}
              </label>
              <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">{t('securityLogs.filterOptions.allStatus', 'All Status')}</option>
                <option value="allowed">{t('securityLogs.status.allowed', 'Allowed')}</option>
                <option value="blocked">{t('securityLogs.status.blocked', 'Blocked')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('securityLogs.filterLabels.deviceType', 'Device Type')}
              </label>
              <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">{t('securityLogs.filterOptions.allDevices', 'All Devices')}</option>
                <option value="web">{t('securityLogs.deviceTypes.web', 'Web')}</option>
                <option value="mobile">{t('securityLogs.deviceTypes.mobile', 'Mobile')}</option>
                <option value="tablet">{t('securityLogs.deviceTypes.tablet', 'Tablet')}</option>
                <option value="smarttv">{t('securityLogs.deviceTypes.smarttv', 'Smart TV')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      {activitySummary && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {t('securityLogs.sections.activitySummary', 'Activity Summary')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-white mb-2">{activitySummary.summary.total_activities || 0}</div>
              <div className="text-sm text-gray-400">
                {t('securityLogs.summary.totalActivities', 'Total Activities')}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-2">{activitySummary.summary.allowed_activities || 0}</div>
              <div className="text-sm text-gray-400">
                {t('securityLogs.summary.allowedActivities', 'Allowed Activities')}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-red-400 mb-2">{activitySummary.summary.blocked_activities || 0}</div>
              <div className="text-sm text-gray-400">
                {t('securityLogs.summary.blockedActivities', 'Blocked Activities')}
              </div>
            </div>
          </div>
          
          {/* Activity by Type */}
          {activitySummary.by_type && activitySummary.by_type.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-3">
                {t('securityLogs.sections.activityByType', 'Activity by Type')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activitySummary.by_type.map((type, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300 capitalize">
                        {t(`securityLogs.activityTypes.${type.activity_type}`, type.activity_type.replace(/_/g, ' '))}
                      </span>
                      <span className="text-sm font-semibold text-white">{type.count}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>
                        {t('securityLogs.summary.allowed', 'Allowed')}: {type.allowed || 0}
                      </span>
                      <span>
                        {t('securityLogs.summary.blocked', 'Blocked')}: {type.blocked || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Logs */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {t('securityLogs.sections.detailedLogs', 'Detailed Activity Logs')}
              </h3>
              <p className="text-sm text-gray-400">
                {t('securityLogs.sections.logsDescription', 'All activities by your kids')}
              </p>
            </div>
            <div className="text-sm text-gray-400">
              {t('securityLogs.totalLogs', 'Total')}: {securityLogs.length} {t('securityLogs.logs', 'logs')}
            </div>
          </div>
        </div>
        
        {securityLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t('securityLogs.tableHeaders.kid', 'Kid')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t('securityLogs.tableHeaders.activity', 'Activity')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t('securityLogs.tableHeaders.status', 'Status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t('securityLogs.tableHeaders.details', 'Details')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t('securityLogs.tableHeaders.time', 'Time')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {securityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {log.kid_name?.charAt(0) || t('securityLogs.kidInitial', 'K')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {log.kid_name || t('securityLogs.unknownKid', 'Unknown Kid')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {t(`securityLogs.deviceTypes.${log.device_type}`, log.device_type)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActivityTypeIcon(log.activity_type)}
                        <div className="text-sm text-white capitalize">
                          {t(`securityLogs.activityTypes.${log.activity_type}`, formatActivityType(log.activity_type))}
                        </div>
                      </div>
                      {log.search_query && (
                        <div className="text-xs text-gray-400 truncate max-w-xs mt-1">
                          🔍 {log.search_query}
                        </div>
                      )}
                      {log.content_title && (
                        <div className="text-xs text-gray-400 truncate max-w-xs mt-1">
                          📺 {log.content_title}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.was_allowed 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {log.was_allowed 
                          ? t('securityLogs.status.allowed', 'Allowed') 
                          : t('securityLogs.status.blocked', 'Blocked')
                        }
                      </span>
                      {log.restriction_reason && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                          {log.restriction_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {log.activity_details && (
                          <div className="text-xs text-gray-300">
                            {JSON.stringify(log.activity_details)}
                          </div>
                        )}
                        {log.ip_address && (
                          <div className="text-xs text-gray-400">
                            IP: {log.ip_address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {new Date(log.created_at).toLocaleDateString(i18n.language)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {t('securityLogs.noLogs.title', 'No activity logs found')}
            </h3>
            <p className="text-gray-500 text-sm">
              {t('securityLogs.noLogs.description', 'Activities will appear here when your kids use the platform')}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {securityLogs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              {t('securityLogs.stats.blockRate', 'Block Rate')}
            </h4>
            <div className="text-2xl font-bold text-white">
              {activitySummary ? (
                <>
                  {((activitySummary.summary.blocked_activities / activitySummary.summary.total_activities) * 100).toFixed(1)}%
                </>
              ) : '0%'}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {activitySummary?.summary.blocked_activities || 0} {t('securityLogs.stats.outOf', 'out of')} {activitySummary?.summary.total_activities || 0} {t('securityLogs.stats.activities', 'activities')}
            </p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              {t('securityLogs.stats.mostActiveTime', 'Most Active Time')}
            </h4>
            <div className="text-2xl font-bold text-white">
              {activitySummary?.peak_hours?.[0] ? 
                `${activitySummary.peak_hours[0].hour}:00` : 
                t('securityLogs.stats.noData', 'No data')
              }
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t('securityLogs.stats.peakActivityHour', 'Peak activity hour')}
            </p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              {t('securityLogs.stats.mostActiveKid', 'Most Active Kid')}
            </h4>
            <div className="text-2xl font-bold text-white truncate">
              {dashboardStats?.most_active_kid?.kid_name || t('securityLogs.stats.noData', 'No data')}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {dashboardStats?.most_active_kid?.activity_count || 0} {t('securityLogs.stats.activities', 'activities')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}