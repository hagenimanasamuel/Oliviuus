import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Brain,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  BookOpen,
  TrendingUp,
  Target,
  MoreVertical,
  X,
  Save,
} from "lucide-react";
import api from "../../../../api/axios";

export default function SkillsManagement() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    skill_key: "",
    description: "",
    category: "",
    icon_emoji: "🧠",
    difficulty_level: "beginner",
    is_active: true,
  });

  const categories = [
    "cognitive",
    "motor",
    "language",
    "social",
    "emotional",
    "mathematical",
    "creative",
    "memory",
  ];

  const difficultyLevels = [
    { value: "beginner", label: t("skillsManagement.levels.beginner") },
    { value: "intermediate", label: t("skillsManagement.levels.intermediate") },
    { value: "advanced", label: t("skillsManagement.levels.advanced") },
    { value: "expert", label: t("skillsManagement.levels.expert") },
  ];

const fetchSkills = async () => {
  setLoading(true);
  try {
    const res = await api.get("/games/educational-skills", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setSkills(res.data.skills || res.data || []);
  } catch (error) {
    console.error("Error fetching skills:", error);
  } finally {
    setLoading(false);
  }
};


const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (editingSkill) {
      await api.put(`/games/educational-skills/${editingSkill.id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } else {
      await api.post('/games/educational-skills', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    }
    fetchSkills();
    resetForm();
  } catch (error) {
    console.error("Error saving skill:", error);
    alert(error.response?.data?.error || "Failed to save skill");
  }
};

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      skill_key: skill.skill_key,
      description: skill.description || "",
      category: skill.category || "",
      icon_emoji: skill.icon_emoji || "🧠",
      difficulty_level: skill.difficulty_level || "beginner",
      is_active: skill.is_active !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (skillId) => {
    if (!window.confirm(t("skillsManagement.confirmDelete"))) return;
    try {
      await api.delete(`/educational-skills/${skillId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchSkills();
    } catch (error) {
      console.error("Error deleting skill:", error);
      alert(error.response?.data?.error || "Failed to delete skill");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      skill_key: "",
      description: "",
      category: "",
      icon_emoji: "🧠",
      difficulty_level: "beginner",
      is_active: true,
    });
    setEditingSkill(null);
    setShowForm(false);
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = skill.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || skill.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      advanced: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      expert: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[level] || colors.beginner;
  };

  const getCategoryColor = (category) => {
    const colors = {
      cognitive: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      motor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      language: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      social: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      emotional: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      mathematical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      creative: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      memory: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
    };
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("skillsManagement.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("skillsManagement.description")}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium hover:from-[#9b69b2] hover:to-purple-500 transition"
        >
          <Plus className="w-4 h-4" />
          {t("skillsManagement.addSkill")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("skillsManagement.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
          >
            <option value="">{t("skillsManagement.allCategories")}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("skillsManagement.noSkills")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t("skillsManagement.noSkillsDescription")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center text-white text-2xl">
                    {skill.icon_emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {skill.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {skill.skill_key}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => {}}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {skill.description || t("skillsManagement.noDescription")}
              </p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      skill.category
                    )}`}
                  >
                    {skill.category || "uncategorized"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                      skill.difficulty_level
                    )}`}
                  >
                    {skill.difficulty_level}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-4 h-4" />
                    <span>{skill.game_count || 0} games</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>{skill.avg_improvement || 0}% improvement</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span
                  className={`text-sm font-medium ${
                    skill.is_active
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {skill.is_active
                    ? t("skillsManagement.active")
                    : t("skillsManagement.inactive")}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(skill)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#BC8BBC] to-purple-600">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingSkill
                      ? t("skillsManagement.editSkill")
                      : t("skillsManagement.addSkill")}
                  </h2>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("skillsManagement.form.name")} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("skillsManagement.form.skillKey")} *
                  </label>
                  <input
                    type="text"
                    value={formData.skill_key}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skill_key: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      })
                    }
                    required
                    placeholder="memory_recall"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("skillsManagement.form.description")} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("skillsManagement.form.category")}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                  >
                    <option value="">{t("skillsManagement.form.selectCategory")}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("skillsManagement.form.difficulty")}
                  </label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty_level: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                  >
                    {difficultyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("skillsManagement.form.iconEmoji")}
                  </label>
                  <input
                    type="text"
                    value={formData.icon_emoji}
                    onChange={(e) =>
                      setFormData({ ...formData, icon_emoji: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("skillsManagement.form.active")}
                </label>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  {t("skillsManagement.form.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium hover:from-[#9b69b2] hover:to-purple-500 transition"
                >
                  <Save className="w-4 h-4" />
                  {editingSkill
                    ? t("skillsManagement.form.update")
                    : t("skillsManagement.form.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}