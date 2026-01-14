import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Star,
  Gamepad2,
  Download,
  Calendar,
  Filter,
} from "lucide-react";
import api from "../../../../api/axios";

export default function GameAnalytics() {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState("week");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalGames: 0,
      activeGames: 0,
      totalSessions: 0,
      avgPlaytime: 0,
      totalPlayers: 0,
    },
    topGames: [],
    engagement: {
      dailySessions: [],
      playerRetention: 0,
      avgSessionDuration: 0,
    },
    categories: [],
  });

  const [selectedGame, setSelectedGame] = useState(null);

const fetchAnalytics = async () => {
  setLoading(true);
  try {
    const res = await api.get("/games/admin/analytics", {
      params: { timeframe },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setAnalytics(res.data.analytics || res.data);
  } catch (error) {
    console.error("Error fetching analytics:", error);
  } finally {
    setLoading(false);
  }
};

const exportAnalytics = async () => {
  try {
    const res = await api.get("/games/admin/analytics/export", {
      params: { timeframe },
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `game_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error exporting analytics:", error);
  }
};

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const timeframes = [
    { value: "day", label: t("gameAnalytics.timeframes.day") },
    { value: "week", label: t("gameAnalytics.timeframes.week") },
    { value: "month", label: t("gameAnalytics.timeframes.month") },
    { value: "quarter", label: t("gameAnalytics.timeframes.quarter") },
    { value: "year", label: t("gameAnalytics.timeframes.year") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("gameAnalytics.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("gameAnalytics.description")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              {timeframes.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={exportAnalytics}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
          >
            <Download className="w-4 h-4" />
            {t("gameAnalytics.export")}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Gamepad2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              +12%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {analytics.overview.totalGames}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("gameAnalytics.totalGames")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              +24%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {analytics.overview.totalPlayers}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("gameAnalytics.totalPlayers")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              +8%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {analytics.overview.totalSessions}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("gameAnalytics.totalSessions")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              +5%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {Math.round(analytics.overview.avgPlaytime)} min
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("gameAnalytics.avgPlaytime")}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Games */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("gameAnalytics.topGames")}
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {analytics.topGames.slice(0, 5).map((game, index) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center text-white">
                    {game.icon_emoji || "🎮"}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {game.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {game.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {game.sessions}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t("gameAnalytics.sessions")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("gameAnalytics.categories")}
            </h3>
            <TrendingUp className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {analytics.categories.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.count} ({category.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 h-2 rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t("gameAnalytics.engagementMetrics")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {analytics.engagement.playerRetention}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("gameAnalytics.playerRetention")}
            </p>
          </div>
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {Math.round(analytics.engagement.avgSessionDuration)} min
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("gameAnalytics.avgSessionDuration")}
            </p>
          </div>
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {analytics.overview.activeGames}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("gameAnalytics.activeGames")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}