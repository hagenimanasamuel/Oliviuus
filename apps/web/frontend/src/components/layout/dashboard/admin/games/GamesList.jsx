import React, { useState } from "react";
import {
  Gamepad2,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  Star,
  TrendingUp,
  Users,
  Clock,
  Puzzle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

export default function GamesList({ games, loading, hasMore, loadMore, onEdit, onDelete, onView }) {
  const { t } = useTranslation();
  const [expandedGame, setExpandedGame] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icon: CheckCircle,
        label: t("gamesList.status.active"),
      },
      inactive: {
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        icon: XCircle,
        label: t("gamesList.status.inactive"),
      },
      draft: {
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        icon: AlertCircle,
        label: t("gamesList.status.draft"),
      },
      maintenance: {
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        icon: AlertCircle,
        label: t("gamesList.status.maintenance"),
      },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      puzzle: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      educational: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      memory: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      math: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      language: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      creative: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      adventure: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      arcade: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
        {category}
      </span>
    );
  };

  const toggleExpand = (gameId) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
    setActionMenuOpen(null);
  };

  const toggleActionMenu = (gameId) => {
    setActionMenuOpen(actionMenuOpen === gameId ? null : gameId);
    setExpandedGame(null);
  };

  const handleAction = (gameId, action) => {
    setActionMenuOpen(null);
    switch (action) {
      case "edit":
        onEdit && onEdit(gameId);
        break;
      case "delete":
        onDelete && onDelete(gameId);
        break;
      case "view":
        onView && onView(gameId);
        break;
    }
  };

  if (loading && games.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <Gamepad2 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t("gamesList.noGames")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t("gamesList.noGamesDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid View for Games */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Game Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${game.color_gradient || "bg-gradient-to-br from-[#BC8BBC] to-purple-600"}`}>
                    {game.icon_emoji || "🎮"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {game.title}
                      </h3>
                      {game.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getCategoryBadge(game.category)}
                      {getStatusBadge(game.is_active ? "active" : "inactive")}
                    </div>
                  </div>
                </div>

                {/* Action Menu */}
                <div className="relative">
                  <button
                    onClick={() => toggleActionMenu(game.id)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>

                  {actionMenuOpen === game.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <button
                        onClick={() => handleAction(game.id, "view")}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <Eye className="w-4 h-4" />
                        {t("gamesList.actions.view")}
                      </button>
                      <button
                        onClick={() => handleAction(game.id, "edit")}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                        {t("gamesList.actions.edit")}
                      </button>
                      <button
                        onClick={() => handleAction(game.id, "delete")}
                        className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t("gamesList.actions.delete")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Game Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                {game.description}
              </p>

              {/* Game Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {game.total_players || 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("gamesList.players")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {Math.round(game.average_score || 0)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("gamesList.avgScore")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {game.total_sessions || 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("gamesList.sessions")}
                  </div>
                </div>
              </div>

              {/* Expand Button */}
              <button
                onClick={() => toggleExpand(game.id)}
                className="w-full mt-4 text-center text-sm text-[#BC8BBC] hover:text-purple-600 font-medium"
              >
                {expandedGame === game.id ? t("gamesList.seeLess") : t("gamesList.seeMore")}
              </button>
            </div>

            {/* Expanded Details */}
            {expandedGame === game.id && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("gamesList.gameDetails")}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t("gamesList.ageRange")}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {game.age_minimum || 3}-{game.age_maximum || 12} years
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t("gamesList.skills")}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {game.skills_count || 0} skills
                        </div>
                      </div>
                    </div>
                  </div>

                  {game.skill_names && game.skill_names.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("gamesList.skillsDeveloped")}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {game.skill_names.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("gamesList.lastUpdated")}
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(game.updated_at || game.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium rounded-lg hover:from-[#9b69b2] hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? t("gamesList.loading") : t("gamesList.loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}