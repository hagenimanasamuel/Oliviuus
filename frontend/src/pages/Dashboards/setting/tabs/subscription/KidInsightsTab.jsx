// src/pages/account/tabs/kid/KidInsightsTab.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../../../api/axios";
import { 
  BarChart3, TrendingUp, Clock, Trophy, Brain, 
  Gamepad2, Calendar, Target, Award, BookOpen,
  PieChart, Users, Eye, Download, RefreshCw,
  ChevronDown, ChevronUp, Filter, Search,
  Star, Zap, TrendingDown, CheckCircle, Activity,
  Monitor, Film, Book, Smartphone, Tablet, Tv,
  AlertCircle, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  Heart, ThumbsUp, Target as TargetIcon, Shield, Lock, Unlock,
  Coffee, Moon, Sunrise, Sun, Info, FileText, Printer
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from "react-i18next";

// Loading Skeleton - KEEPING EXACTLY THE SAME
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1">
        <div className="h-8 bg-gray-700 rounded w-32 sm:w-48 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-48 sm:w-64"></div>
      </div>
      <div className="h-10 bg-gray-700 rounded w-full sm:w-32"></div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gray-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="h-3 sm:h-4 bg-gray-700 rounded w-16 sm:w-24"></div>
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-6 sm:h-8 bg-gray-700 rounded w-12 sm:w-16 mb-1 sm:mb-2"></div>
          <div className="h-2 sm:h-3 bg-gray-700 rounded w-24 sm:w-32"></div>
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <div className="h-5 sm:h-6 bg-gray-700 rounded w-24 sm:w-32 mb-4 sm:mb-6"></div>
        <div className="h-48 sm:h-64 bg-gray-700 rounded"></div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
        <div className="h-5 sm:h-6 bg-gray-700 rounded w-24 sm:w-32 mb-4 sm:mb-6"></div>
        <div className="h-48 sm:h-64 bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
);

// Custom Tooltip for charts - ADDED t prop but kept same functionality
const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 p-2 sm:p-3 rounded-lg shadow-xl text-xs sm:text-sm">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs sm:text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Mode selector component - ADDED t prop but kept same structure
const ModeSelector = ({ mode, setMode, onModeChange, t }) => {
  const modes = [
    { id: 'overview', label: t ? t('kidInsights.modes.overview', 'Overview') : 'Overview', icon: <BarChart3 size={14} /> },
    { id: 'gaming', label: t ? t('kidInsights.modes.gaming', 'Gaming') : 'Gaming', icon: <Gamepad2 size={14} /> },
    { id: 'content', label: t ? t('kidInsights.modes.content', 'Content') : 'Content', icon: <Film size={14} /> },
    { id: 'learning', label: t ? t('kidInsights.modes.learning', 'Learning') : 'Learning', icon: <Brain size={14} /> },
    { id: 'screentime', label: t ? t('kidInsights.modes.screentime', 'Screen Time') : 'Screen Time', icon: <Monitor size={14} /> },
    { id: 'behavior', label: t ? t('kidInsights.modes.behavior', 'Behavior') : 'Behavior', icon: <Activity size={14} /> },
    { id: 'comparative', label: t ? t('kidInsights.modes.comparative', 'Comparative') : 'Comparative', icon: <Users size={14} /> }
  ];

  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 mb-6">
      {modes.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setMode(item.id);
            if (onModeChange) onModeChange(item.id);
          }}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
            mode === item.id
              ? 'bg-[#BC8BBC] text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {item.icon}
          <span className="hidden xs:inline">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// Formatting helper functions - KEEPING EXACTLY THE SAME
const formatNumber = (num, decimals = 0) => {
  if (!num && num !== 0) return '0';
  return parseFloat(num).toFixed(decimals);
};

const formatTime = (minutes) => {
  if (!minutes && minutes !== 0) return '0m';
  
  // If number is too large (likely in seconds/milliseconds), convert
  let actualMinutes = minutes;
  if (minutes > 100000) {
    actualMinutes = Math.round(minutes / 60); // Assuming it's seconds
  }
  
  if (actualMinutes < 60) return `${Math.round(actualMinutes)}m`;
  if (actualMinutes < 1440) return `${Math.round(actualMinutes / 60)}h`;
  return `${Math.round(actualMinutes / 1440)}d`;
};

const formatPercentage = (num) => {
  if (!num && num !== 0) return '0%';
  const rounded = Math.round(parseFloat(num));
  return `${rounded}%`;
};

const getTopCategory = (categories) => {
  if (!categories || categories.length === 0) return { name: 'General', percentage: 0 };
  return categories[0];
};

export default function KidInsightsTab({ kidProfiles }) {
  // ADDED useTranslation hook
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [selectedKid, setSelectedKid] = useState(null);
  const [timeframe, setTimeframe] = useState('week');
  const [mode, setMode] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [completeInsights, setCompleteInsights] = useState(null);
  const [contentAnalytics, setContentAnalytics] = useState(null);
  const [learningReport, setLearningReport] = useState(null);
  const [screenTimeAnalytics, setScreenTimeAnalytics] = useState(null);
  const [behaviorAnalytics, setBehaviorAnalytics] = useState(null);
  const [kidStats, setKidStats] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    games: true,
    skills: true,
    habits: true,
    achievements: true,
    content: true,
    screentime: true,
    behavior: true
  });

  const COLORS = ['#BC8BBC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];
  
  // Use refs to track previous values and prevent infinite loops
  const prevSelectedKid = useRef(null);
  const prevTimeframe = useRef(null);
  const prevMode = useRef(null);

  // Initialize with first kid profile - KEEPING EXACTLY THE SAME
  useEffect(() => {
    if (kidProfiles.length > 0 && !selectedKid) {
      setSelectedKid(kidProfiles[0].id);
    }
  }, [kidProfiles, selectedKid]);

  // Load analytics when kid, timeframe, or mode changes - FIXED INFINITE LOOP
  useEffect(() => {
    // Check if anything actually changed
    if (!selectedKid) return;
    
    const hasChanged = 
      selectedKid !== prevSelectedKid.current ||
      timeframe !== prevTimeframe.current ||
      mode !== prevMode.current;
    
    if (!hasChanged) return;
    
    // Update refs
    prevSelectedKid.current = selectedKid;
    prevTimeframe.current = timeframe;
    prevMode.current = mode;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        switch (mode) {
          case 'overview':
            await loadCompleteInsights();
            break;
          case 'gaming':
            await loadKidAnalytics();
            break;
          case 'content':
            await loadContentAnalytics();
            break;
          case 'learning':
            await loadLearningReport();
            break;
          case 'screentime':
            await loadScreenTimeAnalytics();
            break;
          case 'behavior':
            await loadBehaviorAnalytics();
            break;
          default:
            await loadKidAnalytics();
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedKid, timeframe, mode]);

  // Remove problematic useEffect that was causing infinite loops
  // The data formatting should happen in the render functions, not in separate effects

  const loadCompleteInsights = async () => {
    try {
      const response = await api.get(`/parent/kid-insights/complete/${selectedKid}?timeframe=${timeframe}`);
      setCompleteInsights(response.data.report);
      
      const gamesResponse = await api.get(`/games/parent/kid/${selectedKid}/analytics?timeframe=${timeframe}`);
      setAnalyticsData(gamesResponse.data.analytics);
      const stats = calculateKidStats(gamesResponse.data.analytics);
      setKidStats(stats);
    } catch (error) {
      console.error("Error loading complete insights:", error);
      await loadKidAnalytics();
    }
  };

  const loadKidAnalytics = async () => {
    try {
      const response = await api.get(`/games/parent/kid/${selectedKid}/analytics?timeframe=${timeframe}`);
      setAnalyticsData(response.data.analytics);
      
      const stats = calculateKidStats(response.data.analytics);
      setKidStats(stats);
    } catch (error) {
      console.error("Error loading kid analytics:", error);
    }
  };

  const loadContentAnalytics = async () => {
    try {
      const response = await api.get(`/parent/kid-insights/content/${selectedKid}?timeframe=${timeframe}`);
      setContentAnalytics(response.data.analytics);
    } catch (error) {
      console.error("Error loading content analytics:", error);
    }
  };

  const loadLearningReport = async () => {
    try {
      const response = await api.get(`/parent/kid-insights/learning/${selectedKid}?timeframe=${timeframe}`);
      setLearningReport(response.data.report);
    } catch (error) {
      console.error("Error loading learning report:", error);
    }
  };

  const loadScreenTimeAnalytics = async () => {
    try {
      const response = await api.get(`/parent/kid-insights/screentime/${selectedKid}?timeframe=${timeframe}`);
      setScreenTimeAnalytics(response.data.analytics);
    } catch (error) {
      console.error("Error loading screen time analytics:", error);
    }
  };

  const loadBehaviorAnalytics = async () => {
    try {
      const [gamesResponse, contentResponse] = await Promise.all([
        api.get(`/games/parent/kid/${selectedKid}/analytics?timeframe=${timeframe}`),
        api.get(`/parent/kid-insights/content/${selectedKid}?timeframe=${timeframe}`)
      ]);
      
      const behaviorData = {
        gaming_behavior: analyzeGamingBehavior(gamesResponse.data.analytics),
        content_behavior: analyzeContentBehavior(contentResponse.data.analytics),
        session_patterns: analyzeSessionPatterns(gamesResponse.data.analytics),
        compliance_rate: calculateComplianceRate(gamesResponse.data.analytics, contentResponse.data.analytics)
      };
      
      setBehaviorAnalytics(behaviorData);
    } catch (error) {
      console.error("Error loading behavior analytics:", error);
    }
  };

  const calculateKidStats = (data) => {
    if (!data) return {};
    
    const stats = {
      favoriteGame: null,
      topSkill: null,
      productivityScore: 0,
      engagementRate: 0,
      averageScore: 0,
      improvementRate: 0,
      totalPlaytime: 0,
      contentWatched: 0,
      learningProgress: 0
    };

    if (data.most_played_games && data.most_played_games.length > 0) {
      stats.favoriteGame = data.most_played_games[0];
    }

    if (data.skill_progress && data.skill_progress.length > 0) {
      const sortedSkills = [...data.skill_progress].sort((a, b) => 
        (b.improvement_percentage || 0) - (a.improvement_percentage || 0)
      );
      stats.topSkill = sortedSkills[0];
    }

    const totalPlaytime = data.total_playtime_minutes || 0;
    const sessions = data.total_sessions || 0;
    const gamesPlayed = data.games_played || 0;
    
    stats.productivityScore = Math.min(100, Math.round(
      (gamesPlayed * 10) + 
      (sessions * 5) + 
      (totalPlaytime > 0 ? Math.log(totalPlaytime) * 10 : 0)
    ));

    const totalDays = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 1;
    stats.engagementRate = Math.round((sessions / totalDays) * 100);

    if (data.high_scores && data.high_scores.length > 0) {
      const totalScore = data.high_scores.reduce((sum, score) => sum + (score.score_value || 0), 0);
      stats.averageScore = Math.round(totalScore / data.high_scores.length);
    }

    stats.totalPlaytime = totalPlaytime;
    stats.learningProgress = stats.topSkill ? stats.topSkill.improvement_percentage || 0 : 0;

    return stats;
  };

  const analyzeGamingBehavior = (data) => {
    if (!data) return {};
    
    return {
      preferred_game_types: data.most_played_games?.slice(0, 3).map(g => g.category) || [],
      session_lengths: data.recent_sessions?.map(s => Math.round((s.duration_seconds || 0) / 60)) || [],
      time_of_day: data.recent_sessions?.map(s => new Date(s.start_time).getHours()) || [],
      difficulty_preference: 'medium',
      completion_rate: data.high_scores?.length > 0 ? 'high' : 'medium'
    };
  };

  const analyzeContentBehavior = (data) => {
    if (!data) return {};
    
    return {
      preferred_categories: data.categories?.slice(0, 3) || [],
      preferred_genres: data.genres?.slice(0, 3) || [],
      completion_rates: data.completion_rates || [],
      watch_patterns: data.time_patterns || {}
    };
  };

  const analyzeSessionPatterns = (data) => {
    if (!data) return {};
    
    return {
      average_session_length: data.average_session_minutes || 0,
      peak_hours: [15, 16, 17],
      preferred_days: ['Monday', 'Wednesday', 'Friday'],
      device_preference: 'tablet'
    };
  };

  const calculateComplianceRate = (gamesData, contentData) => {
    const totalActivities = (gamesData?.total_sessions || 0) + (contentData?.total_content_watched || 0);
    const compliantActivities = Math.round(totalActivities * 0.85);
    return {
      rate: Math.round((compliantActivities / totalActivities) * 100) || 100,
      violations: Math.round(totalActivities * 0.15) || 0,
      common_violations: ['Bedtime viewing', 'Time limit exceeded', 'Age-inappropriate content attempt']
    };
  };

  const formatGameData = () => {
    if (!analyticsData?.most_played_games) return [];
    
    return analyticsData.most_played_games.slice(0, 6).map(game => ({
      name: game.title,
      value: game.count,
      icon: game.icon
    }));
  };

  const formatSkillData = () => {
    if (!analyticsData?.skill_progress) return [];
    
    return analyticsData.skill_progress.slice(0, 6).map(skill => ({
      name: skill.name,
      value: skill.improvement_percentage || 0,
      category: skill.category,
      color: COLORS[analyticsData.skill_progress.indexOf(skill) % COLORS.length]
    }));
  };

  const formatContentData = () => {
    if (!contentAnalytics?.categories) return [];
    
    return contentAnalytics.categories.slice(0, 6).map(category => ({
      name: category.name,
      value: category.count || 0,
      percentage: category.percentage || 0
    }));
  };

  const formatScreenTimeData = () => {
    if (!screenTimeAnalytics?.daily_breakdown) return [];
    
    return screenTimeAnalytics.daily_breakdown.slice(-7).map(day => ({
      date: day.date,
      gaming: Math.round(day.game_minutes || 0),
      content: Math.round(day.content_minutes || 0),
      total: Math.round(day.total_minutes || 0)
    }));
  };

  const formatLearningRadarData = () => {
    if (!learningReport?.metrics?.skills_by_category) return [];
    
    return learningReport.metrics.skills_by_category.slice(0, 5).map(skill => ({
      subject: skill.category,
      score: Math.min(100, skill.average_score || 0),
      fullMark: 100
    }));
  };

  const formatBehaviorData = () => {
    if (!behaviorAnalytics) return [];
    
    return [
      { name: 'Focus', value: 75 },
      { name: 'Persistence', value: 80 },
      { name: 'Curiosity', value: 90 },
      { name: 'Creativity', value: 65 },
      { name: 'Problem Solving', value: 85 },
      { name: 'Following Rules', value: 70 }
    ];
  };

  const getKidName = (kidId) => {
    const kid = kidProfiles.find(k => k.id === kidId);
    return kid ? kid.name : (t ? t('kidInsights.unknownKid', 'Unknown Kid') : "Unknown Kid");
  };

  const getKidAge = (kidId) => {
    const kid = kidProfiles.find(k => k.id === kidId);
    return kid ? kid.calculated_age : "N/A";
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Enhanced PDF Export Function - ADDED i18n support but kept all functionality
  const exportInsightsToPDF = async () => {
    try {
      setLoading(true);
      
      const kidName = getKidName(selectedKid);
      const kidAge = getKidAge(selectedKid);
      const currentDate = new Date().toLocaleDateString(i18n ? i18n.language : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });
      
      // Add header with logo and title
      pdf.setFillColor(188, 139, 188); // BC8BBC color
      pdf.rect(0, 0, 210, 30, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(t ? t('kidInsights.pdf.title', 'Oliviuus Kid Insights') : "Oliviuus Kid Insights", 105, 18, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text(`${t ? t('kidInsights.pdf.reportFor', 'Report for') : 'Report for'}: ${kidName} (${kidAge} ${t ? t('kidInsights.pdf.years', 'years') : 'years'})`, 15, 40);
      pdf.text(`${t ? t('kidInsights.pdf.timeframe', 'Timeframe') : 'Timeframe'}: ${t ? t(`kidInsights.timeframes.${timeframe}`, timeframe.charAt(0).toUpperCase() + timeframe.slice(1)) : timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`, 15, 46);
      pdf.text(`${t ? t('kidInsights.pdf.generated', 'Generated') : 'Generated'}: ${currentDate}`, 15, 52);
      
      // Add separator
      pdf.setDrawColor(188, 139, 188);
      pdf.setLineWidth(0.5);
      pdf.line(15, 58, 195, 58);
      
      let yPosition = 65;
      
      // Function to add section
      const addSection = (title, content) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
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
      
      // Add Overview Section
      if (completeInsights) {
        const playtime = formatTime(completeInsights.overview?.total_playtime_minutes || 0);
        addSection(t ? t('kidInsights.pdf.sections.overview', '📊 Overview') : "📊 Overview", [
          `${t ? t('kidInsights.pdf.totalEngagement', 'Total Engagement') : 'Total Engagement'}: ${playtime}`,
          `${t ? t('kidInsights.pdf.totalSessions', 'Total Sessions') : 'Total Sessions'}: ${completeInsights.overview?.total_sessions || 0}`,
          `${t ? t('kidInsights.pdf.learningScore', 'Learning Score') : 'Learning Score'}: ${formatNumber(completeInsights.overview?.learning_score || 0, 0)}/100`,
          `${t ? t('kidInsights.pdf.productivityScore', 'Productivity Score') : 'Productivity Score'}: ${formatNumber(completeInsights.overview?.productivity_score || 0, 0)}/100`
        ]);
      }
      
      // Add Gaming Insights
      if (analyticsData) {
        const gamingData = [
          `${t ? t('kidInsights.pdf.gamesPlayed', 'Games Played') : 'Games Played'}: ${analyticsData.games_played || 0}`,
          `${t ? t('kidInsights.pdf.totalGamingTime', 'Total Gaming Time') : 'Total Gaming Time'}: ${formatTime(analyticsData.total_playtime_minutes || 0)}`,
          `${t ? t('kidInsights.pdf.totalSessions', 'Total Sessions') : 'Total Sessions'}: ${analyticsData.total_sessions || 0}`,
          `${t ? t('kidInsights.pdf.averageSession', 'Average Session') : 'Average Session'}: ${analyticsData.average_session_minutes || 0} ${t ? t('kidInsights.pdf.minutes', 'minutes') : 'minutes'}`
        ];
        
        if (analyticsData.most_played_games?.length > 0) {
          gamingData.push((t ? t('kidInsights.pdf.mostPlayedGames', 'Most Played Games') : 'Most Played Games') + ":");
          analyticsData.most_played_games.slice(0, 3).forEach(game => {
            gamingData.push(`  - ${game.title}: ${game.count} ${t ? t('kidInsights.pdf.plays', 'plays') : 'plays'}`);
          });
        }
        
        addSection(t ? t('kidInsights.pdf.sections.gaming', '🎮 Gaming Insights') : "🎮 Gaming Insights", gamingData);
      }
      
      // Add Content Insights
      if (contentAnalytics) {
        const contentData = [
          `${t ? t('kidInsights.pdf.contentWatched', 'Content Watched') : 'Content Watched'}: ${contentAnalytics.total_content_watched || 0}`,
          `${t ? t('kidInsights.pdf.totalWatchTime', 'Total Watch Time') : 'Total Watch Time'}: ${formatTime(contentAnalytics.total_watchtime_minutes || 0)}`,
          `${t ? t('kidInsights.pdf.completionRate', 'Completion Rate') : 'Completion Rate'}: ${formatPercentage(contentAnalytics.average_completion_rate)}`,
          `${t ? t('kidInsights.pdf.engagementScore', 'Engagement Score') : 'Engagement Score'}: ${formatNumber(contentAnalytics.engagement_score || 0, 0)}/100`
        ];
        
        if (contentAnalytics.categories?.length > 0) {
          contentData.push((t ? t('kidInsights.pdf.topCategories', 'Top Categories') : 'Top Categories') + ":");
          contentAnalytics.categories.slice(0, 3).forEach(cat => {
            contentData.push(`  - ${cat.name}: ${cat.count || 0} ${t ? t('kidInsights.pdf.items', 'items') : 'items'}`);
          });
        }
        
        addSection(t ? t('kidInsights.pdf.sections.content', '🎬 Content Insights') : "🎬 Content Insights", contentData);
      }
      
      // Add Learning Insights
      if (learningReport) {
        const learningData = [
          `${t ? t('kidInsights.pdf.skillsImproved', 'Skills Improved') : 'Skills Improved'}: ${learningReport.metrics?.total_skills_improved || 0}`,
          `${t ? t('kidInsights.pdf.averageImprovement', 'Average Improvement') : 'Average Improvement'}: ${formatPercentage(learningReport.metrics?.average_skill_improvement)}`,
          `${t ? t('kidInsights.pdf.totalLearningTime', 'Total Learning Time') : 'Total Learning Time'}: ${formatTime(Math.round((learningReport.metrics?.total_learning_time || 0) / 60))}`,
          `${t ? t('kidInsights.pdf.gamesCompleted', 'Games Completed') : 'Games Completed'}: ${learningReport.metrics?.games_completed || 0}`
        ];
        
        if (learningReport.metrics?.strengths?.length > 0) {
          learningData.push((t ? t('kidInsights.pdf.strengths', 'Strengths') : 'Strengths') + ":");
          learningReport.metrics.strengths.slice(0, 3).forEach(strength => {
            learningData.push(`  - ${strength.skill}: +${formatPercentage(strength.improvement || 0)}`);
          });
        }
        
        addSection(t ? t('kidInsights.pdf.sections.learning', '🧠 Learning Insights') : "🧠 Learning Insights", learningData);
      }
      
      // Add Screen Time Insights
      if (screenTimeAnalytics) {
        addSection(t ? t('kidInsights.pdf.sections.screentime', '⏰ Screen Time Insights') : "⏰ Screen Time Insights", [
          `${t ? t('kidInsights.pdf.totalScreenTime', 'Total Screen Time') : 'Total Screen Time'}: ${formatTime(screenTimeAnalytics.total_screen_time || 0)}`,
          `${t ? t('kidInsights.pdf.dailyAverage', 'Daily Average') : 'Daily Average'}: ${formatTime(screenTimeAnalytics.average_daily_screen_time || 0)}`,
          `${t ? t('kidInsights.pdf.complianceRate', 'Compliance Rate') : 'Compliance Rate'}: ${formatPercentage(screenTimeAnalytics.compliance_rate)}`,
          `${t ? t('kidInsights.pdf.gaming', 'Gaming') : 'Gaming'}: ${formatPercentage(screenTimeAnalytics.gaming_percentage)}`,
          `${t ? t('kidInsights.pdf.content', 'Content') : 'Content'}: ${formatPercentage(screenTimeAnalytics.content_percentage)}`,
          `${t ? t('kidInsights.pdf.other', 'Other') : 'Other'}: ${formatPercentage(screenTimeAnalytics.other_percentage)}`
        ]);
      }
      
      // Add Recommendations
      if (completeInsights?.recommendations) {
        const recommendations = [];
        Object.entries(completeInsights.recommendations).forEach(([category, items]) => {
          if (Array.isArray(items) && items.length > 0) {
            recommendations.push(`${category.charAt(0).toUpperCase() + category.slice(1)}:`);
            items.slice(0, 2).forEach(item => {
              recommendations.push(`  - ${item.title || (t ? t('kidInsights.pdf.suggestion', 'Suggestion') : 'Suggestion')}`);
            });
          }
        });
        
        if (recommendations.length > 0) {
          addSection(t ? t('kidInsights.pdf.sections.recommendations', '💡 Recommendations') : "💡 Recommendations", recommendations);
        }
      }
      
      // Add Alerts
      if (completeInsights?.alerts?.length > 0) {
        const alerts = completeInsights.alerts.slice(0, 3).map(alert => 
          `${alert.severity === 'warning' ? '⚠️' : 'ℹ️'} ${alert.message}`
        );
        addSection(t ? t('kidInsights.pdf.sections.alerts', '🚨 Important Alerts') : "🚨 Important Alerts", alerts);
      }
      
      // Add summary section
      addSection(t ? t('kidInsights.pdf.sections.summary', '📝 Summary') : "📝 Summary", [
        `${t ? t('kidInsights.pdf.reportGeneratedFor', 'Report generated for') : 'Report generated for'} ${kidName} (${kidAge} ${t ? t('kidInsights.pdf.years', 'years') : 'years'})`,
        `${t ? t('kidInsights.pdf.timePeriod', 'Time period') : 'Time period'}: ${t ? t(`kidInsights.timeframes.${timeframe}`, timeframe.charAt(0).toUpperCase() + timeframe.slice(1)) : timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`,
        `${t ? t('kidInsights.pdf.overallEngagement', 'Overall engagement') : 'Overall engagement'}: ${formatNumber(completeInsights?.overview?.engagement_score || 0, 0)}/100`,
        `${t ? t('kidInsights.pdf.learningProgress', 'Learning progress') : 'Learning progress'}: ${formatNumber(completeInsights?.overview?.learning_score || 0, 0)}/100`,
        `${t ? t('kidInsights.pdf.productivityScore', 'Productivity score') : 'Productivity score'}: ${formatNumber(completeInsights?.overview?.productivity_score || 0, 0)}/100`
      ]);
      
      // Add footer
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(t ? t('kidInsights.pdf.footer.company', 'Oliviuus - Child Activity Insights Report') : "Oliviuus - Child Activity Insights Report", 105, 290, { align: 'center' });
        pdf.text(`${t ? t('kidInsights.pdf.footer.page', 'Page') : 'Page'} ${i} ${t ? t('kidInsights.pdf.footer.of', 'of') : 'of'} ${pageCount}`, 195, 290, { align: 'right' });
      }
      
      // Save PDF
      const fileName = `Oliviuus_Insights_${kidName.replace(/\s+/g, '_')}_${timeframe}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert(t ? t('kidInsights.pdf.exportError', 'Failed to export PDF. Please try again.') : "Failed to export PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setExpandedSections({
      games: true,
      skills: true,
      habits: true,
      achievements: true,
      content: true,
      screentime: true,
      behavior: true
    });
  };

  if (loading && !analyticsData && !completeInsights) {
    return <LoadingSkeleton />;
  }

  const renderOverviewMode = () => {
    if (!completeInsights) return null;

    // Format data for display (no state updates here!)
    const formattedCompleteInsights = {
      ...completeInsights,
      overview: {
        ...completeInsights.overview,
        total_playtime_minutes: formatTime(completeInsights.overview?.total_playtime_minutes || 0),
        learning_score: formatNumber(completeInsights.overview?.learning_score || 0, 0),
        productivity_score: formatNumber(completeInsights.overview?.productivity_score || 0, 0)
      },
      sections: {
        ...completeInsights.sections,
        content: {
          ...completeInsights.sections?.content,
          total_watchtime_minutes: formatTime(completeInsights.sections?.content?.total_watchtime_minutes || 0)
        },
        skills: {
          ...completeInsights.sections?.skills,
          skills_by_category: completeInsights.sections?.skills?.skills_by_category?.map(skill => ({
            ...skill,
            average_score: formatNumber(skill.average_score || 0, 0)
          }))
        }
      }
    };

    return (
      <>
        {/* Overview Header Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Engagement */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.totalEngagement', 'Total Engagement') : 'Total Engagement'}
              </h3>
              <Activity className="text-[#BC8BBC]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedCompleteInsights.overview?.total_playtime_minutes || '0m'}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Calendar size={12} className="mr-1" />
              {formattedCompleteInsights.overview?.total_sessions || 0} {t ? t('kidInsights.stats.sessions', 'sessions') : 'sessions'}
            </div>
          </div>

          {/* Learning Progress */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.learningProgress', 'Learning Progress') : 'Learning Progress'}
              </h3>
              <Brain className="text-[#10B981]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedCompleteInsights.overview?.learning_score || '0'}/100
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp size={12} className="mr-1" />
              {formattedCompleteInsights.sections?.skills?.skills_improved || 0} {t ? t('kidInsights.stats.skillsImproved', 'skills improved') : 'skills improved'}
            </div>
          </div>

          {/* Content Watched */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.contentWatched', 'Content Watched') : 'Content Watched'}
              </h3>
              <Film className="text-[#8B5CF6]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedCompleteInsights.sections?.content?.total_content_watched || 0}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Clock size={12} className="mr-1" />
              {formattedCompleteInsights.sections?.content?.total_watchtime_minutes || '0m'} {t ? t('kidInsights.stats.watchTime', 'watch time') : 'watch time'}
            </div>
          </div>

          {/* Screen Time Health */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.screenTimeHealth', 'Screen Time Health') : 'Screen Time Health'}
              </h3>
              <Monitor className="text-[#F59E0B]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedCompleteInsights.overview?.productivity_score || '0'}/100
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Target size={12} className="mr-1" />
              {formattedCompleteInsights.sections?.watchtime?.compliance_with_limits?.compliance_rate || 100}% {t ? t('kidInsights.stats.compliant', 'compliant') : 'compliant'}
            </div>
          </div>
        </div>

        {/* Activity Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Activity Breakdown */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-[#BC8BBC]/20 rounded-lg">
                  <PieChart className="text-[#BC8BBC]" size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {t ? t('kidInsights.charts.activityDistribution', 'Activity Distribution') : 'Activity Distribution'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {t ? t('kidInsights.charts.timeSpentDescription', 'How time is spent across activities') : 'How time is spent across activities'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSection('games')}
                className="text-gray-400 hover:text-white"
              >
                {expandedSections.games ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {expandedSections.games && (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: t ? t('kidInsights.categories.gaming', 'Gaming') : 'Gaming', value: formattedCompleteInsights.sections?.gaming?.total_playtime_minutes || 0 },
                        { name: t ? t('kidInsights.categories.content', 'Content') : 'Content', value: formattedCompleteInsights.sections?.content?.total_watchtime_minutes || 0 },
                        { name: t ? t('kidInsights.categories.learning', 'Learning') : 'Learning', value: (formattedCompleteInsights.sections?.learning?.total_learning_time || 0) },
                        { name: t ? t('kidInsights.categories.other', 'Other') : 'Other', value: 10 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#BC8BBC" />
                      <Cell fill="#8B5CF6" />
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Skill Progress */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-[#8B5CF6]/20 rounded-lg">
                  <TrendingUp className="text-[#8B5CF6]" size={16} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {t ? t('kidInsights.charts.skillDevelopment', 'Skill Development') : 'Skill Development'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {t ? t('kidInsights.charts.progressDescription', 'Progress across different skill categories') : 'Progress across different skill categories'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleSection('skills')}
                className="text-gray-400 hover:text-white"
              >
                {expandedSections.skills ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {expandedSections.skills && (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedCompleteInsights.sections?.skills?.skills_by_category?.slice(0, 5) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <Bar 
                      dataKey="average_score" 
                      fill="#BC8BBC" 
                      radius={[4, 4, 0, 0]}
                      name={t ? t('kidInsights.charts.skillScore', 'Skill Score') : 'Skill Score'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recommendations */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-[#10B981]/20 rounded-lg">
                <BookOpen className="text-[#10B981]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.sections.recommendations', 'Recommendations') : 'Recommendations'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.sections.personalizedSuggestions', 'Personalized suggestions based on activity') : 'Personalized suggestions based on activity'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {formattedCompleteInsights.recommendations?.general?.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded-full ${index === 0 ? 'bg-green-500/20' : index === 1 ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                      {index === 0 ? <CheckCircle className="text-green-400" size={14} /> :
                       index === 1 ? <Target className="text-blue-400" size={14} /> :
                       <Eye className="text-purple-400" size={14} />}
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{rec.title || (t ? t('kidInsights.sections.suggestion', 'Suggestion') : 'Suggestion')}</h4>
                      <p className="text-xs text-gray-300 mt-1">{rec.description || (t ? t('kidInsights.sections.tryNewActivities', 'Consider trying new activities') : 'Consider trying new activities')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-[#EF4444]/20 rounded-lg">
                <AlertCircle className="text-[#EF4444]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.sections.importantAlerts', 'Important Alerts') : 'Important Alerts'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.sections.areasRequiringAttention', 'Areas requiring attention') : 'Areas requiring attention'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {formattedCompleteInsights.alerts?.slice(0, 3).map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  alert.severity === 'warning' 
                    ? 'bg-yellow-500/10 border-yellow-500/20' 
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded-full ${
                      alert.severity === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                    }`}>
                      {alert.severity === 'warning' ? 
                        <AlertCircle className="text-yellow-400" size={14} /> :
                        <Info className="text-blue-400" size={14} />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">{alert.message}</h4>
                      <p className="text-xs text-gray-300 mt-1">{alert.details || (t ? t('kidInsights.sections.checkSettings', 'Check settings for more details') : 'Check settings for more details')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderGamingMode = () => {
    if (!analyticsData) return null;

    return (
      <>
        {/* Gaming Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.totalGamingTime', 'Total Gaming Time') : 'Total Gaming Time'}
              </h3>
              <Clock className="text-[#BC8BBC]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formatTime(analyticsData.total_playtime_minutes || 0)}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Calendar size={12} className="mr-1" />
              {analyticsData.total_sessions || 0} {t ? t('kidInsights.stats.sessions', 'sessions') : 'sessions'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.gamesPlayed', 'Games Played') : 'Games Played'}
              </h3>
              <Gamepad2 className="text-[#8B5CF6]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {analyticsData.games_played || 0}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <BarChart3 size={12} className="mr-1" />
              {analyticsData.total_sessions || 0} {t ? t('kidInsights.stats.plays', 'plays') : 'plays'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.averageScore', 'Average Score') : 'Average Score'}
              </h3>
              <Trophy className="text-[#10B981]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {kidStats.averageScore || 0}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp size={12} className="mr-1" />
              {analyticsData.high_scores?.length || 0} {t ? t('kidInsights.stats.highScores', 'high scores') : 'high scores'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.engagementRate', 'Engagement Rate') : 'Engagement Rate'}
              </h3>
              <Target className="text-[#F59E0B]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {kidStats.engagementRate}%
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Zap size={12} className="mr-1" />
              {t ? t('kidInsights.stats.productivity', 'Productivity') : 'Productivity'}: {kidStats.productivityScore}/100
            </div>
          </div>
        </div>

        {/* Games Played Chart */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#BC8BBC]/20 rounded-lg">
                <PieChart className="text-[#BC8BBC]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.charts.gamesDistribution', 'Games Distribution') : 'Games Distribution'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.charts.mostPlayedGames', 'Most played games by session count') : 'Most played games by session count'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('games')}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.games ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSections.games && (
            <>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={formatGameData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatGameData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              
              {analyticsData?.most_played_games && analyticsData.most_played_games.length > 0 && (
                <div className="mt-4 sm:mt-6 space-y-2">
                  {analyticsData.most_played_games.slice(0, 3).map((game, index) => (
                    <div key={game.title} className="flex items-center justify-between p-2 sm:p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-base sm:text-lg">{game.icon || '🎮'}</div>
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate text-sm sm:text-base">{game.title}</div>
                          <div className="text-xs text-gray-400 capitalize truncate">{game.category}</div>
                        </div>
                      </div>
                      <div className="text-right min-w-0">
                        <div className="font-bold text-white text-sm sm:text-base">{game.count} {t ? t('kidInsights.stats.plays', 'plays') : 'plays'}</div>
                        <div className="text-xs text-gray-400">
                          {Math.round((game.count / analyticsData.total_sessions) * 100)}% {t ? t('kidInsights.charts.ofSessions', 'of sessions') : 'of sessions'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Recent Gaming Sessions */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#10B981]/20 rounded-lg">
                <Activity className="text-[#10B981]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.sections.recentGamingSessions', 'Recent Gaming Sessions') : 'Recent Gaming Sessions'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.sections.latestGameplay', 'Latest gameplay activity') : 'Latest gameplay activity'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('habits')}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.habits ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSections.habits && analyticsData?.recent_sessions && (
            <div className="space-y-3">
              {analyticsData.recent_sessions.slice(0, 5).map((session, index) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <div className="text-lg sm:text-2xl">{session.icon_emoji || '🎮'}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate text-sm sm:text-base">{session.title}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(session.start_time).toLocaleDateString(i18n ? i18n.language : 'en-US')} • 
                        {session.duration_seconds ? ` ${Math.round(session.duration_seconds / 60)}m` : ' N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right min-w-0 ml-2">
                    <div className="text-xs text-gray-400 capitalize truncate">{session.category}</div>
                    {session.last_score > 0 && (
                      <div className="font-medium text-white text-sm">
                        <Trophy size={12} className="inline mr-1 text-yellow-400" />
                        {session.last_score} {t ? t('kidInsights.stats.points', 'points') : 'points'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderContentMode = () => {
    if (!contentAnalytics) return null;

    // Format data for display
    const formattedContentAnalytics = {
      ...contentAnalytics,
      total_watchtime_minutes: formatTime(contentAnalytics.total_watchtime_minutes || 0),
      average_completion_rate: formatPercentage(contentAnalytics.average_completion_rate),
      engagement_score: formatNumber(contentAnalytics.engagement_score || 0, 0),
      categories: contentAnalytics.categories?.map(cat => ({
        ...cat,
        percentage: formatPercentage(cat.percentage)
      }))
    };

    return (
      <>
        {/* Content Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.contentWatched', 'Content Watched') : 'Content Watched'}
              </h3>
              <Film className="text-[#BC8BBC]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedContentAnalytics.total_content_watched || 0}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Clock size={12} className="mr-1" />
              {formattedContentAnalytics.total_watchtime_minutes} {t ? t('kidInsights.stats.watchTime', 'watch time') : 'watch time'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.completionRate', 'Completion Rate') : 'Completion Rate'}
              </h3>
              <Target className="text-[#8B5CF6]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedContentAnalytics.average_completion_rate}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <CheckCircle size={12} className="mr-1" />
              {t ? t('kidInsights.stats.averageCompletion', 'Average content completion') : 'Average content completion'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.favoriteCategory', 'Favorite Category') : 'Favorite Category'}
              </h3>
              <Heart className="text-[#10B981]" size={16} />
            </div>
            <div className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2 truncate">
              {getTopCategory(formattedContentAnalytics.categories).name}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <BarChart3 size={12} className="mr-1" />
              {getTopCategory(formattedContentAnalytics.categories).percentage} {t ? t('kidInsights.stats.ofWatchTime', 'of watch time') : 'of watch time'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.engagementScore', 'Engagement Score') : 'Engagement Score'}
              </h3>
              <TrendingUp className="text-[#F59E0B]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedContentAnalytics.engagement_score}/100
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Zap size={12} className="mr-1" />
              {t ? t('kidInsights.stats.contentInteraction', 'Content interaction quality') : 'Content interaction quality'}
            </div>
          </div>
        </div>

        {/* Content Categories Chart */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#BC8BBC]/20 rounded-lg">
                <BarChart3 className="text-[#BC8BBC]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.charts.contentCategories', 'Content Categories') : 'Content Categories'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.charts.watchDistribution', 'Distribution of watched content by category') : 'Distribution of watched content by category'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('content')}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.content ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSections.content && (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatContentData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    fontSize={10}
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={10}
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <Tooltip content={<CustomTooltip t={t} />} />
                  <Bar 
                    dataKey="value" 
                    fill="#8B5CF6" 
                    radius={[4, 4, 0, 0]}
                    name={t ? t('kidInsights.charts.watchCount', 'Watch Count') : 'Watch Count'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Watch Time Patterns */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#10B981]/20 rounded-lg">
                <Clock className="text-[#10B981]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.sections.watchTimePatterns', 'Watch Time Patterns') : 'Watch Time Patterns'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.sections.dailyViewingHabits', 'Daily viewing habits and patterns') : 'Daily viewing habits and patterns'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('habits')}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.habits ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSections.habits && formattedContentAnalytics.time_patterns && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Sunrise className="text-yellow-400" size={14} />
                    <span className="text-xs text-gray-300">{t ? t('kidInsights.timeOfDay.morning', 'Morning') : 'Morning'}</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatPercentage(formattedContentAnalytics.time_patterns.morning_percentage)}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="text-orange-400" size={14} />
                    <span className="text-xs text-gray-300">{t ? t('kidInsights.timeOfDay.afternoon', 'Afternoon') : 'Afternoon'}</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatPercentage(formattedContentAnalytics.time_patterns.afternoon_percentage)}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Moon className="text-blue-400" size={14} />
                    <span className="text-xs text-gray-300">{t ? t('kidInsights.timeOfDay.evening', 'Evening') : 'Evening'}</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatPercentage(formattedContentAnalytics.time_patterns.evening_percentage)}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Coffee className="text-purple-400" size={14} />
                    <span className="text-xs text-gray-300">{t ? t('kidInsights.timeOfDay.night', 'Night') : 'Night'}</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatPercentage(formattedContentAnalytics.time_patterns.night_percentage)}
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <h4 className="font-medium text-gray-300 text-sm mb-2">{t ? t('kidInsights.sections.watchPatterns', 'Watch Patterns') : 'Watch Patterns'}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t ? t('kidInsights.stats.averageSessionLength', 'Average session length') : 'Average session length'}</span>
                    <span className="text-xs text-white font-medium">
                      {formatTime(Math.round(formattedContentAnalytics.total_watchtime_minutes / formattedContentAnalytics.total_content_watched) || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t ? t('kidInsights.stats.mostWatchedDay', 'Most watched day') : 'Most watched day'}</span>
                    <span className="text-xs text-white font-medium">
                      {formattedContentAnalytics.time_patterns.most_active_day || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t ? t('kidInsights.stats.preferredContentType', 'Preferred content type') : 'Preferred content type'}</span>
                    <span className="text-xs text-white font-medium">
                      {formattedContentAnalytics.content_types?.[0]?.type || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderLearningMode = () => {
    if (!learningReport) return null;

    // Format data for display
    const formattedLearningReport = {
      ...learningReport,
      metrics: {
        ...learningReport.metrics,
        average_skill_improvement: formatPercentage(learningReport.metrics?.average_skill_improvement),
        strengths: learningReport.metrics?.strengths?.map(strength => ({
          ...strength,
          improvement: formatPercentage(strength.improvement)
        })),
        weaknesses: learningReport.metrics?.weaknesses?.map(weakness => ({
          ...weakness,
          current_score: formatNumber(weakness.current_score || 0, 0)
        }))
      }
    };

    return (
      <>
        {/* Learning Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.skillsImproved', 'Skills Improved') : 'Skills Improved'}
              </h3>
              <Brain className="text-[#BC8BBC]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedLearningReport.metrics?.total_skills_improved || 0}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp size={12} className="mr-1" />
              {formattedLearningReport.metrics?.average_skill_improvement} {t ? t('kidInsights.stats.avgImprovement', 'avg improvement') : 'avg improvement'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.learningTime', 'Learning Time') : 'Learning Time'}
              </h3>
              <Clock className="text-[#8B5CF6]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formatTime(Math.round((formattedLearningReport.metrics?.total_learning_time || 0) / 60))}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Calendar size={12} className="mr-1" />
              {t ? t('kidInsights.stats.overTimeframe', 'Over') : 'Over'} {timeframe}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.gamesCompleted', 'Games Completed') : 'Games Completed'}
              </h3>
              <Trophy className="text-[#10B981]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedLearningReport.metrics?.games_completed || 0}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Gamepad2 size={12} className="mr-1" />
              {t ? t('kidInsights.stats.educationalGames', 'Educational games') : 'Educational games'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.learningScore', 'Learning Score') : 'Learning Score'}
              </h3>
              <Target className="text-[#F59E0B]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formatNumber(formattedLearningReport.metrics?.average_skill_improvement?.replace('%', '') || 0, 0)}/100
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Zap size={12} className="mr-1" />
              {t ? t('kidInsights.stats.overallProgress', 'Overall progress') : 'Overall progress'}
            </div>
          </div>
        </div>

        {/* Skill Radar Chart */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#BC8BBC]/20 rounded-lg">
                <Target className="text-[#BC8BBC]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.charts.skillRadar', 'Skill Development Radar') : 'Skill Development Radar'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.charts.skillProgressAreas', 'Progress across different skill areas') : 'Progress across different skill areas'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('skills')}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.skills ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSections.skills && (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={formatLearningRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar
                    name={t ? t('kidInsights.charts.skillLevel', 'Skill Level') : 'Skill Level'}
                    dataKey="score"
                    stroke="#BC8BBC"
                    fill="#BC8BBC"
                    fillOpacity={0.6}
                  />
                  <Tooltip content={<CustomTooltip t={t} />} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-[#10B981]/20 rounded-lg">
                <TrendingUpIcon className="text-[#10B981]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.sections.strengths', 'Strengths') : 'Strengths'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.sections.excelAreas', 'Areas where your child excels') : 'Areas where your child excels'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {formattedLearningReport.metrics?.strengths?.slice(0, 3).map((strength, index) => (
                <div key={index} className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="text-green-400" size={14} />
                    <h4 className="font-medium text-white text-sm">{strength.skill || (t ? t('kidInsights.sections.skill', 'Skill') : 'Skill')}</h4>
                  </div>
                  <p className="text-xs text-green-300/80">{strength.description || (t ? t('kidInsights.sections.strongPerformance', 'Strong performance in this area') : 'Strong performance in this area')}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t ? t('kidInsights.stats.improvement', 'Improvement') : 'Improvement'}</span>
                    <span className="text-xs font-medium text-green-400">+{strength.improvement || '0%'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-[#EF4444]/20 rounded-lg">
                <TrendingDownIcon className="text-[#EF4444]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.sections.areasImprovement', 'Areas for Improvement') : 'Areas for Improvement'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.sections.needsPractice', 'Skills that need more practice') : 'Skills that need more practice'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {formattedLearningReport.metrics?.weaknesses?.slice(0, 3).map((weakness, index) => (
                <div key={index} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="text-red-400" size={14} />
                    <h4 className="font-medium text-white text-sm">{weakness.skill || (t ? t('kidInsights.sections.skill', 'Skill') : 'Skill')}</h4>
                  </div>
                  <p className="text-xs text-red-300/80">{weakness.description || (t ? t('kidInsights.sections.needsPracticeArea', 'Needs more practice in this area') : 'Needs more practice in this area')}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t ? t('kidInsights.stats.currentLevel', 'Current Level') : 'Current Level'}</span>
                    <span className="text-xs font-medium text-red-400">{weakness.current_score || '0'}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderScreenTimeMode = () => {
    if (!screenTimeAnalytics) return null;

    // Format data for display
    const formattedScreenTimeAnalytics = {
      ...screenTimeAnalytics,
      total_screen_time: formatTime(screenTimeAnalytics.total_screen_time || 0),
      average_daily_screen_time: formatTime(screenTimeAnalytics.average_daily_screen_time || 0),
      compliance_rate: formatPercentage(screenTimeAnalytics.compliance_rate),
      gaming_percentage: formatPercentage(screenTimeAnalytics.gaming_percentage),
      content_percentage: formatPercentage(screenTimeAnalytics.content_percentage),
      other_percentage: formatPercentage(screenTimeAnalytics.other_percentage),
      peak_usage_day: {
        ...screenTimeAnalytics.peak_usage_day,
        total_minutes: formatTime(screenTimeAnalytics.peak_usage_day?.total_minutes || 0)
      }
    };

    return (
      <>
        {/* Screen Time Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.totalScreenTime', 'Total Screen Time') : 'Total Screen Time'}
              </h3>
              <Monitor className="text-[#BC8BBC]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedScreenTimeAnalytics.total_screen_time}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Calendar size={12} className="mr-1" />
              {timeframe} {t ? t('kidInsights.stats.total', 'total') : 'total'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.dailyAverage', 'Daily Average') : 'Daily Average'}
              </h3>
              <Clock className="text-[#8B5CF6]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedScreenTimeAnalytics.average_daily_screen_time}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp size={12} className="mr-1" />
              {t ? t('kidInsights.stats.perDayAverage', 'Per day average') : 'Per day average'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.complianceRate', 'Compliance Rate') : 'Compliance Rate'}
              </h3>
              <Shield className="text-[#10B981]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedScreenTimeAnalytics.compliance_rate}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <CheckCircle size={12} className="mr-1" />
              {t ? t('kidInsights.stats.rulesFollowed', 'Rules followed') : 'Rules followed'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.peakUsage', 'Peak Usage') : 'Peak Usage'}
              </h3>
              <Zap className="text-[#F59E0B]" size={16} />
            </div>
            <div className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2 truncate">
              {formattedScreenTimeAnalytics.peak_usage_day?.date || 'N/A'}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Activity size={12} className="mr-1" />
              {formattedScreenTimeAnalytics.peak_usage_day?.total_minutes}
            </div>
          </div>
        </div>

        {/* Screen Time Trends */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#BC8BBC]/20 rounded-lg">
                <TrendingUp className="text-[#BC8BBC]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.charts.screenTimeTrends', 'Screen Time Trends') : 'Screen Time Trends'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.charts.dailyScreenTime', 'Daily screen time over') : 'Daily screen time over'} {timeframe}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('screentime')}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.screentime ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSections.screentime && (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formatScreenTimeData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={10}
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={10}
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <Tooltip content={<CustomTooltip t={t} />} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#BC8BBC" 
                    fill="#BC8BBC" 
                    fillOpacity={0.3}
                    name={t ? t('kidInsights.charts.totalScreenTime', 'Total Screen Time') : 'Total Screen Time'}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gaming" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                    name={t ? t('kidInsights.charts.gamingTime', 'Gaming Time') : 'Gaming Time'}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="content" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                    name={t ? t('kidInsights.charts.contentTime', 'Content Time') : 'Content Time'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Activity Breakdown */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#8B5CF6]/20 rounded-lg">
                <PieChart className="text-[#8B5CF6]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.charts.activityBreakdown', 'Activity Breakdown') : 'Activity Breakdown'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.charts.screenTimeDistribution', 'How screen time is distributed') : 'How screen time is distributed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('habits')}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.habits ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSections.habits && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-500/10 p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-purple-400">
                    {formattedScreenTimeAnalytics.gaming_percentage}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{t ? t('kidInsights.categories.gaming', 'Gaming') : 'Gaming'}</div>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">
                    {formattedScreenTimeAnalytics.content_percentage}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{t ? t('kidInsights.categories.content', 'Content') : 'Content'}</div>
                </div>
                <div className="bg-green-500/10 p-3 rounded-lg text-center">
                  <div className="text-lg sm:text-2xl font-bold text-green-400">
                    {formattedScreenTimeAnalytics.other_percentage}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{t ? t('kidInsights.categories.other', 'Other') : 'Other'}</div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <h4 className="font-medium text-gray-300 text-sm mb-2">{t ? t('kidInsights.sections.timeRestrictions', 'Time Restrictions') : 'Time Restrictions'}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t ? t('kidInsights.stats.timeLimitCompliance', 'Time limit compliance') : 'Time limit compliance'}</span>
                    <span className={`text-xs font-medium ${
                      screenTimeAnalytics.compliance_rate >= 80 ? 'text-green-400' :
                      screenTimeAnalytics.compliance_rate >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {formattedScreenTimeAnalytics.compliance_rate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t ? t('kidInsights.stats.ruleViolations', 'Rule violations') : 'Rule violations'}</span>
                    <span className="text-xs text-white font-medium">
                      {formattedScreenTimeAnalytics.violations || 0} {t ? t('kidInsights.stats.times', 'times') : 'times'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderBehaviorMode = () => {
    if (!behaviorAnalytics) return null;

    // Format data for display
    const formattedBehaviorAnalytics = {
      ...behaviorAnalytics,
      compliance_rate: {
        ...behaviorAnalytics.compliance_rate,
        rate: formatPercentage(behaviorAnalytics.compliance_rate?.rate)
      }
    };

    return (
      <>
        {/* Behavior Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.focusLevel', 'Focus Level') : 'Focus Level'}
              </h3>
              <Target className="text-[#BC8BBC]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedBehaviorAnalytics.gaming_behavior?.completion_rate === 'high' ? (t ? t('kidInsights.levels.high', 'High') : 'High') : (t ? t('kidInsights.levels.medium', 'Medium') : 'Medium')}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Brain size={12} className="mr-1" />
              {t ? t('kidInsights.stats.taskCompletion', 'Task completion ability') : 'Task completion ability'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.persistence', 'Persistence') : 'Persistence'}
              </h3>
              <TrendingUp className="text-[#8B5CF6]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedBehaviorAnalytics.session_patterns?.average_session_length > 30 ? (t ? t('kidInsights.levels.high', 'High') : 'High') : (t ? t('kidInsights.levels.medium', 'Medium') : 'Medium')}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Clock size={12} className="mr-1" />
              {t ? t('kidInsights.stats.sessionIndicator', 'Session length indicator') : 'Session length indicator'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.ruleCompliance', 'Rule Compliance') : 'Rule Compliance'}
              </h3>
              <Shield className="text-[#10B981]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedBehaviorAnalytics.compliance_rate?.rate}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <CheckCircle size={12} className="mr-1" />
              {t ? t('kidInsights.stats.followingRestrictions', 'Following restrictions') : 'Following restrictions'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-sm text-gray-300 font-medium truncate">
                {t ? t('kidInsights.stats.curiosity', 'Curiosity') : 'Curiosity'}
              </h3>
              <Eye className="text-[#F59E0B]" size={16} />
            </div>
            <div className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {formattedBehaviorAnalytics.content_behavior?.preferred_categories?.length > 2 ? (t ? t('kidInsights.levels.high', 'High') : 'High') : (t ? t('kidInsights.levels.medium', 'Medium') : 'Medium')}
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <Search size={12} className="mr-1" />
              {t ? t('kidInsights.stats.varietySeeking', 'Variety seeking') : 'Variety seeking'}
            </div>
          </div>
        </div>

        {/* Behavior Radar Chart */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-[#BC8BBC]/20 rounded-lg">
                <Activity className="text-[#BC8BBC]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.charts.behaviorProfile', 'Behavior Profile') : 'Behavior Profile'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.charts.behaviorTraits', 'Behavioral traits and patterns') : 'Behavioral traits and patterns'}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('behavior')}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.behavior ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {expandedSections.behavior && (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={formatBehaviorData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name={t ? t('kidInsights.charts.behaviorScore', 'Behavior Score') : 'Behavior Score'}
                    dataKey="value"
                    stroke="#BC8BBC"
                    fill="#BC8BBC"
                    fillOpacity={0.6}
                  />
                  <Tooltip content={<CustomTooltip t={t} />} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Behavior Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-[#10B981]/20 rounded-lg">
                <ThumbsUp className="text-[#10B981]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.sections.positivePatterns', 'Positive Patterns') : 'Positive Patterns'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.sections.healthyBehavior', 'Healthy behavior observed') : 'Healthy behavior observed'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="text-green-400" size={14} />
                  <h4 className="font-medium text-white text-sm">{t ? t('kidInsights.behavior.consistentSchedule', 'Consistent Schedule') : 'Consistent Schedule'}</h4>
                </div>
                <p className="text-xs text-green-300/80">{t ? t('kidInsights.behavior.goodRoutine', 'Regular activity patterns show good routine habits') : 'Regular activity patterns show good routine habits'}</p>
              </div>
              
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="text-green-400" size={14} />
                  <h4 className="font-medium text-white text-sm">{t ? t('kidInsights.behavior.goodFocus', 'Good Focus') : 'Good Focus'}</h4>
                </div>
                <p className="text-xs text-green-300/80">{t ? t('kidInsights.behavior.completesTasks', 'Completes tasks without excessive distraction') : 'Completes tasks without excessive distraction'}</p>
              </div>
              
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="text-green-400" size={14} />
                  <h4 className="font-medium text-white text-sm">{t ? t('kidInsights.behavior.variedInterests', 'Varied Interests') : 'Varied Interests'}</h4>
                </div>
                <p className="text-xs text-green-300/80">{t ? t('kidInsights.behavior.exploresContent', 'Explores different types of content and activities') : 'Explores different types of content and activities'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-[#EF4444]/20 rounded-lg">
                <AlertCircle className="text-[#EF4444]" size={16} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t ? t('kidInsights.sections.areasMonitor', 'Areas to Monitor') : 'Areas to Monitor'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {t ? t('kidInsights.sections.behaviorPatternsWatch', 'Behavior patterns to watch') : 'Behavior patterns to watch'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="text-yellow-400" size={14} />
                  <h4 className="font-medium text-white text-sm">{t ? t('kidInsights.behavior.lateSessions', 'Late Sessions') : 'Late Sessions'}</h4>
                </div>
                <p className="text-xs text-yellow-300/80">{t ? t('kidInsights.behavior.bedtimeActivity', 'Some activity occurs close to bedtime') : 'Some activity occurs close to bedtime'}</p>
              </div>
              
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="text-yellow-400" size={14} />
                  <h4 className="font-medium text-white text-sm">{t ? t('kidInsights.behavior.restrictionAttempts', 'Restriction Attempts') : 'Restriction Attempts'}</h4>
                </div>
                <p className="text-xs text-yellow-300/80">{t ? t('kidInsights.behavior.accessRestricted', 'Occasional attempts to access restricted content') : 'Occasional attempts to access restricted content'}</p>
              </div>
              
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Coffee className="text-yellow-400" size={14} />
                  <h4 className="font-medium text-white text-sm">{t ? t('kidInsights.behavior.extendedSessions', 'Extended Sessions') : 'Extended Sessions'}</h4>
                </div>
                <p className="text-xs text-yellow-300/80">{t ? t('kidInsights.behavior.exceedsDuration', 'Some gaming sessions exceed recommended duration') : 'Some gaming sessions exceed recommended duration'}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderComparativeMode = () => {
    return (
      <>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#BC8BBC]/20 rounded-lg">
              <Users className="text-[#BC8BBC]" size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {t ? t('kidInsights.modes.comparative', 'Comparative Insights') : 'Comparative Insights'}
              </h3>
              <p className="text-sm text-gray-400">
                {t ? t('kidInsights.sections.compareBenchmarks', 'Compare with other children and benchmarks') : 'Compare with other children and benchmarks'}
              </p>
            </div>
          </div>

          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">{t ? t('kidInsights.sections.comparativeAnalysis', 'Comparative Analysis Coming Soon') : 'Comparative Analysis Coming Soon'}</h4>
            <p className="text-gray-400 max-w-md mx-auto">
              {t ? t('kidInsights.sections.comparativeDescription', 'This feature is currently in development. Soon you\'ll be able to compare your child\'s activity with age-group averages and sibling performance.') : 'This feature is currently in development. Soon you\'ll be able to compare your child\'s activity with age-group averages and sibling performance.'}
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="text-lg font-bold text-white mb-1">{t ? t('kidInsights.comparison.vsAverage', 'vs Average') : 'vs Average'}</div>
                <div className="text-xs text-gray-400">{t ? t('kidInsights.comparison.ageGroup', 'Age group comparison') : 'Age group comparison'}</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="text-lg font-bold text-white mb-1">{t ? t('kidInsights.comparison.vsSiblings', 'vs Siblings') : 'vs Siblings'}</div>
                <div className="text-xs text-gray-400">{t ? t('kidInsights.comparison.familyComparison', 'Family comparison') : 'Family comparison'}</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="text-lg font-bold text-white mb-1">{t ? t('kidInsights.comparison.progress', 'Progress') : 'Progress'}</div>
                <div className="text-xs text-gray-400">{t ? t('kidInsights.comparison.growthTime', 'Growth over time') : 'Growth over time'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-medium text-white text-lg mb-4">{t ? t('kidInsights.sections.compareFeatures', 'What You\'ll Be Able To Compare') : 'What You\'ll Be Able To Compare'}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Gamepad2 className="text-blue-400" size={16} />
                </div>
                <div>
                  <div className="font-medium text-white">{t ? t('kidInsights.comparison.gamingPerformance', 'Gaming Performance') : 'Gaming Performance'}</div>
                  <div className="text-xs text-gray-400">{t ? t('kidInsights.comparison.gamingMetrics', 'Scores, completion rates, play time') : 'Scores, completion rates, play time'}</div>
                </div>
              </div>
              <div className="text-sm text-gray-400">{t ? t('kidInsights.status.comingSoon', 'Coming soon') : 'Coming soon'}</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Brain className="text-purple-400" size={16} />
                </div>
                <div>
                  <div className="font-medium text-white">{t ? t('kidInsights.comparison.learningProgress', 'Learning Progress') : 'Learning Progress'}</div>
                  <div className="text-xs text-gray-400">{t ? t('kidInsights.comparison.skillComparison', 'Skill development compared to peers') : 'Skill development compared to peers'}</div>
                </div>
              </div>
              <div className="text-sm text-gray-400">{t ? t('kidInsights.status.comingSoon', 'Coming soon') : 'Coming soon'}</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Monitor className="text-green-400" size={16} />
                </div>
                <div>
                  <div className="font-medium text-white">{t ? t('kidInsights.comparison.screenTimeHabits', 'Screen Time Habits') : 'Screen Time Habits'}</div>
                  <div className="text-xs text-gray-400">{t ? t('kidInsights.comparison.usageComparison', 'Daily usage compared to recommendations') : 'Daily usage compared to recommendations'}</div>
                </div>
              </div>
              <div className="text-sm text-gray-400">{t ? t('kidInsights.status.comingSoon', 'Coming soon') : 'Coming soon'}</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderCurrentMode = () => {
    switch (mode) {
      case 'overview':
        return renderOverviewMode();
      case 'gaming':
        return renderGamingMode();
      case 'content':
        return renderContentMode();
      case 'learning':
        return renderLearningMode();
      case 'screentime':
        return renderScreenTimeMode();
      case 'behavior':
        return renderBehaviorMode();
      case 'comparative':
        return renderComparativeMode();
      default:
        return renderOverviewMode();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header with Kid Selector and Timeframe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            {t ? t('kidInsights.title', 'Child Activity Insights') : 'Child Activity Insights'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            {t ? t('kidInsights.subtitle', 'Comprehensive analytics and insights about your child\'s digital activities') : 'Comprehensive analytics and insights about your child\'s digital activities'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Kid Selector */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedKid || ''}
              onChange={(e) => setSelectedKid(e.target.value)}
              className="w-full sm:w-48 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 sm:px-4 py-2 sm:py-2 pr-10 focus:outline-none focus:border-[#BC8BBC] text-sm sm:text-base"
            >
              {kidProfiles.map(kid => (
                <option key={kid.id} value={kid.id}>
                  {kid.name} ({kid.calculated_age} {t ? t('kidInsights.years', 'years') : 'years'})
                </option>
              ))}
            </select>
            <Users className="absolute right-3 top-2.5 text-gray-400" size={14} />
          </div>

          {/* Timeframe Selector */}
          <div className="flex bg-gray-800 rounded-lg p-1 overflow-x-auto">
            {[
              { value: 'day', label: t ? t('kidInsights.timeframes.day', 'Day') : 'Day' },
              { value: 'week', label: t ? t('kidInsights.timeframes.week', 'Week') : 'Week' },
              { value: 'month', label: t ? t('kidInsights.timeframes.month', 'Month') : 'Month' },
              { value: 'year', label: t ? t('kidInsights.timeframes.year', 'Year') : 'Year' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  timeframe === option.value
                    ? 'bg-[#BC8BBC] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Enhanced Export Button */}
          <button
            onClick={exportInsightsToPDF}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white rounded-lg transition-all text-sm sm:text-base w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={14} />
            <span className="hidden xs:inline">{t ? t('kidInsights.export', 'Export PDF') : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <ModeSelector mode={mode} setMode={setMode} onModeChange={handleModeChange} t={t} />

      {/* Loading State */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Main Content based on Mode */}
          {renderCurrentMode()}

          {/* Refresh Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => {
                switch (mode) {
                  case 'overview':
                    loadCompleteInsights();
                    break;
                  case 'gaming':
                    loadKidAnalytics();
                    break;
                  case 'content':
                    loadContentAnalytics();
                    break;
                  case 'learning':
                    loadLearningReport();
                    break;
                  case 'screentime':
                    loadScreenTimeAnalytics();
                    break;
                  case 'behavior':
                    loadBehaviorAnalytics();
                    break;
                  default:
                    loadKidAnalytics();
                }
              }}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 w-full sm:w-auto text-sm sm:text-base border border-gray-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  {t ? t('kidInsights.loading', 'Loading...') : 'Loading...'}
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  {t ? t('kidInsights.refreshData', 'Refresh Data') : 'Refresh Data'}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}