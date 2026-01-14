import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Gamepad2,
  Plus,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  Puzzle,
  Users,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../../../api/axios";

export default function GameForm({ game = null, onClose, onSave, categories = [], skills = [] }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    game_key: "",
    title: "",
    description: "",
    icon_emoji: "🎮",
    color_gradient: "from-[#BC8BBC] to-purple-600",
    category: "puzzle",
    age_minimum: 3,
    age_maximum: 12,
    game_component: "",
    is_active: true,
    is_featured: false,
    metadata: {},
    skills: [],
    sort_order: 0,
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];
  
  // Ensure skills is always an array
  const safeSkills = Array.isArray(skills) ? skills : [];

  // Default categories if none provided
  const defaultCategories = [
    { value: "Math", label: "Math" },
    { value: "Puzzles", label: "Puzzles" },
    { value: "Colors", label: "Colors" },
    { value: "Memory", label: "Memory" },
    { value: "Science", label: "Science" },
    { value: "Language", label: "Language" },
    { value: "Racing", label: "Racing" },
    { value: "Logic", label: "Logic" },
    { value: "Action", label: "Action" }
  ];

  // Use provided categories or default categories
  const gameCategories = safeCategories.length > 0 ? safeCategories : defaultCategories;

  // Initialize form if editing existing game
  useEffect(() => {
    if (game) {
      setFormData({
        game_key: game.game_key || "",
        title: game.title || "",
        description: game.description || "",
        icon_emoji: game.icon_emoji || "🎮",
        color_gradient: game.color_gradient || "from-[#BC8BBC] to-purple-600",
        category: game.category || "puzzle",
        age_minimum: game.age_minimum || 3,
        age_maximum: game.age_maximum || 12,
        game_component: game.game_component || "",
        is_active: game.is_active !== false,
        is_featured: game.is_featured || false,
        metadata: game.metadata || {},
        skills: game.skills || [],
        sort_order: game.sort_order || 0,
      });

      if (game.skills && Array.isArray(game.skills)) {
        setSelectedSkills(game.skills.map(skill => skill.id || skill));
      }
    }
  }, [game]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      } else {
        return [...prev, skillId];
      }
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleMetadataChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        skills: selectedSkills
      };

      let response;
      if (game) {
        // Update existing game
        response = await api.put(`/games/admin/${game.id}`, data, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      } else {
        // Create new game
        response = await api.post('/games/admin', data, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }

      // Upload image if present
      if (imageFile) {
        const formDataImg = new FormData();
        formDataImg.append('image', imageFile);
        await api.post(`/games/admin/${response.data.game.id}/image`, formDataImg, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        });
      }

      onSave(response.data.game);
    } catch (error) {
      console.error('Error saving game:', error);
      alert(error.response?.data?.error || 'Failed to save game');
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = safeSkills.filter(skill => {
    if (!skill || typeof skill !== 'object') return false;
    const name = skill.name || '';
    const description = skill.description || '';
    return name.toLowerCase().includes(skillSearch.toLowerCase()) ||
           description.toLowerCase().includes(skillSearch.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#BC8BBC] to-purple-600">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {game ? t("gameForm.editGame") : t("gameForm.createGame")}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {game ? t("gameForm.editGameDescription") : t("gameForm.createGameDescription")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gameForm.gameKey")} *
                </label>
                <input
                  type="text"
                  name="game_key"
                  value={formData.game_key}
                  onChange={handleChange}
                  required
                  placeholder="e.g., memory-match"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("gameForm.gameKeyDescription")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gameForm.title")} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Memory Match Game"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("gameForm.description")} *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="3"
                placeholder="Describe the game..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition resize-none"
              />
            </div>

            {/* Category and Age */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gameForm.category")} *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                >
                  {gameCategories.map((cat, index) => {
                    // Handle different category formats
                    const value = cat.value || cat.id || cat.name || cat;
                    const label = cat.label || cat.name || cat.value || cat;
                    
                    return (
                      <option key={value || index} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gameForm.minAge")} *
                </label>
                <input
                  type="number"
                  name="age_minimum"
                  value={formData.age_minimum}
                  onChange={handleNumberChange}
                  min="1"
                  max="18"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gameForm.maxAge")} *
                </label>
                <input
                  type="number"
                  name="age_maximum"
                  value={formData.age_maximum}
                  onChange={handleNumberChange}
                  min="1"
                  max="18"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                />
              </div>
            </div>

            {/* Visual Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gameForm.iconEmoji")}
                </label>
                <input
                  type="text"
                  name="icon_emoji"
                  value={formData.icon_emoji}
                  onChange={handleChange}
                  placeholder="🎮"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gameForm.colorGradient")}
                </label>
                <input
                  type="text"
                  name="color_gradient"
                  value={formData.color_gradient}
                  onChange={handleChange}
                  placeholder="from-[#BC8BBC] to-purple-600"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("gameForm.gameImage")}
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : game?.image_url ? (
                      <img
                        src={game.image_url}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  {(imagePreview || game?.image_url) && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="game-image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="game-image"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {t("gameForm.uploadImage")}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t("gameForm.imageDescription")}
                  </p>
                </div>
              </div>
            </div>

            {/* Skills Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("gameForm.skills")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder={t("gameForm.searchSkills")}
                    className="w-48 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                {filteredSkills.map((skill, index) => {
                  const skillId = skill.id || index;
                  const skillName = skill.name || skill.title || `Skill ${index + 1}`;
                  const skillDescription = skill.description || '';
                  
                  return (
                    <div
                      key={skillId}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        selectedSkills.includes(skillId)
                          ? 'border-[#BC8BBC] bg-[#BC8BBC]/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleSkillToggle(skillId)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedSkills.includes(skillId)
                          ? 'bg-[#BC8BBC] text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        <Puzzle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {skillName}
                        </div>
                        {skillDescription && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {skillDescription}
                          </div>
                        )}
                      </div>
                      {selectedSkills.includes(skillId) && (
                        <div className="w-5 h-5 rounded-full bg-[#BC8BBC] flex items-center justify-center">
                          <span className="text-xs text-white">✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {filteredSkills.length === 0 && (
                  <div className="col-span-full text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {skillSearch ? t("gameForm.noSkillsFound") : t("gameForm.noSkillsAvailable")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Game Component */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("gameForm.gameComponent")} *
              </label>
              <input
                type="text"
                name="game_component"
                value={formData.game_component}
                onChange={handleChange}
                required
                placeholder="MemoryMatchGame"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("gameForm.componentDescription")}
              </p>
            </div>

            {/* Metadata (JSON Editor) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("gameForm.metadata")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      {t("gameForm.hidePreview")}
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      {t("gameForm.showPreview")}
                    </>
                  )}
                </button>
              </div>
              
              {showPreview ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(formData.metadata, null, 2)}
                  </pre>
                </div>
              ) : (
                <textarea
                  name="metadata"
                  value={JSON.stringify(formData.metadata, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, metadata: parsed }));
                    } catch (error) {
                      // Invalid JSON, keep as string
                    }
                  }}
                  rows="4"
                  placeholder='{"difficulty": "easy", "duration": 5}'
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition font-mono text-sm"
                />
              )}
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("gameForm.active")}
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                />
                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("gameForm.featured")}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("gameForm.sortOrder")}
                </label>
                <input
                  type="number"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleNumberChange}
                  min="0"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
              >
                {t("gameForm.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium hover:from-[#9b69b2] hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t("gameForm.saving")}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {game ? t("gameForm.updateGame") : t("gameForm.createGame")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}