import React, { useState, useEffect } from 'react';
import { X, Save, Users, Film, Search, Plus, Trash2, UserCheck, UserCog, Award, Camera, Edit3 } from 'lucide-react';
import api from '../../../../../api/axios';

const CastingModal = ({ casting, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    content_id: '',
    person_id: '',
    role_type: 'actor',
    character_name: '',
    role_description: '',
    billing_order: 0,
    is_featured: false,
    credit_type: 'supporting',
    season_number: '',
    episode_number: ''
  });

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});

  // Data states - initialize as empty arrays
  const [contents, setContents] = useState([]);
  const [people, setPeople] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showPersonSearch, setShowPersonSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roles = [
    { value: 'actor', label: 'Actor', icon: UserCheck, color: 'from-blue-500 to-cyan-500' },
    { value: 'director', label: 'Director', icon: UserCog, color: 'from-purple-500 to-pink-500' },
    { value: 'producer', label: 'Producer', icon: Users, color: 'from-green-500 to-emerald-500' },
    { value: 'writer', label: 'Writer', icon: Edit3, color: 'from-orange-500 to-red-500' },
    { value: 'cinematographer', label: 'Cinematographer', icon: Camera, color: 'from-yellow-500 to-orange-500' },
    { value: 'composer', label: 'Composer', icon: Award, color: 'from-indigo-500 to-purple-500' },
    { value: 'editor', label: 'Editor', icon: Edit3, color: 'from-gray-500 to-gray-700' },
    { value: 'crew', label: 'Crew', icon: Users, color: 'from-gray-400 to-gray-600' }
  ];

  const creditTypes = [
    { value: 'starring', label: 'Starring' },
    { value: 'supporting', label: 'Supporting' },
    { value: 'guest', label: 'Guest' },
    { value: 'cameo', label: 'Cameo' },
    { value: 'voice', label: 'Voice' }
  ];

  useEffect(() => {
    fetchInitialData();
    if (casting) {
      setFormData(casting);
      // If editing existing casting, we might want to pre-load the selected person/content
    }
  }, [casting]);

  const fetchInitialData = async () => {
    try {
      // Fetch recent contents for dropdown - increased limit to ensure movies are included
      const contentsResponse = await api.get('/contents');
      if (contentsResponse.data.success) {
        setContents(contentsResponse.data.data || []);
      } else {
        setContents([]);
      }

      // Fetch recent people for dropdown
      const peopleResponse = await api.get('/people?limit=50&is_active=true');
      if (peopleResponse.data.success) {
        setPeople(peopleResponse.data.data || []);
      } else {
        setPeople([]);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setContents([]);
      setPeople([]);
    }
  };

  const searchPeople = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/people/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching people:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // If content changes, clear episode-specific fields if not a series
    if (name === 'content_id') {
      const content = contents.find(c => c.id == value);
      setSelectedContent(content);
      if (content && content.content_type !== 'series') {
        setFormData(prev => ({
          ...prev,
          season_number: '',
          episode_number: ''
        }));
      }
    }
  };

  const handlePersonSelect = (person) => {
    setFormData(prev => ({ ...prev, person_id: person.id }));
    setSelectedPerson(person);
    setShowPersonSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      searchPeople(query);
    } else {
      setSearchResults([]);
    }
  };

  const clearPersonSelection = () => {
    setFormData(prev => ({ ...prev, person_id: '' }));
    setSelectedPerson(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.content_id) {
      newErrors.content_id = 'Please select content';
    }

    if (!formData.person_id) {
      newErrors.person_id = 'Please select a person';
    }

    if (!formData.role_type) {
      newErrors.role_type = 'Please select a role type';
    }

    if (formData.role_type === 'actor' && !formData.character_name) {
      newErrors.character_name = 'Character name is required for actors';
    }

    if (formData.billing_order < 0) {
      newErrors.billing_order = 'Billing order cannot be negative';
    }

    // Validate episode numbers for series
    if (selectedContent && selectedContent.content_type === 'series') {
      if (formData.season_number && formData.season_number < 1) {
        newErrors.season_number = 'Season number must be at least 1';
      }
      if (formData.episode_number && formData.episode_number < 1) {
        newErrors.episode_number = 'Episode number must be at least 1';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let response;

      const submitData = {
        ...formData,
        content_id: parseInt(formData.content_id),
        person_id: parseInt(formData.person_id),
        billing_order: parseInt(formData.billing_order) || 0,
        season_number: formData.season_number ? parseInt(formData.season_number) : null,
        episode_number: formData.episode_number ? parseInt(formData.episode_number) : null
      };

      if (casting) {
        response = await api.put(`/people/content/${casting.id}`, submitData);
      } else {
        response = await api.post('/people/content/add', submitData);
      }

      if (response.data.success) {
        onSave(response.data.data);
      }
    } catch (err) {
      console.error('Error saving casting:', err);
      if (err.response?.data?.message) {
        setErrors({ submit: err.response.data.message });
      } else {
        setErrors({ submit: 'Failed to save casting information' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleConfig = (roleValue) => {
    return roles.find(r => r.value === roleValue) || roles.find(r => r.value === 'crew');
  };

  const isSeriesContent = selectedContent && selectedContent.content_type === 'series';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#BC8BBC] text-white rounded-lg">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {casting ? 'Edit Casting' : 'Add Casting'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {casting ? 'Update casting information' : 'Assign a person to content'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Content Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Content Selection
            </h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Film size={16} />
                Content *
              </label>
              <select
                name="content_id"
                value={formData.content_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
              >
                <option value="">Select Content</option>
                {contents && contents.map(content => (
                  <option key={content.id} value={content.id}>
                    {content.title} ({content.content_type})
                  </option>
                ))}
              </select>
              {errors.content_id && <p className="text-red-600 dark:text-red-400 text-sm">{errors.content_id}</p>}
              {(!contents || contents.length === 0) && (
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  No content available. Please add content first.
                </p>
              )}
            </div>

            {selectedContent && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {selectedContent.thumbnail_url ? (
                    <img
                      src={selectedContent.thumbnail_url}
                      alt={selectedContent.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded flex items-center justify-center">
                      <Film size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{selectedContent.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {selectedContent.content_type.replace('_', ' ')} • {selectedContent.primary_language}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Person Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Person Selection
            </h3>

            {selectedPerson ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedPerson.profile_image_url ? (
                        <img
                          src={selectedPerson.profile_image_url}
                          alt={selectedPerson.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{selectedPerson.full_name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {selectedPerson.primary_role}
                          {selectedPerson.nationality && ` • ${selectedPerson.nationality}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearPersonSelection}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Users size={16} />
                  Search Person *
                </label>

                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setShowPersonSearch(true)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                        placeholder="Search by name..."
                      />
                    </div>
                    <select
                      value={formData.person_id}
                      onChange={handleChange}
                      name="person_id"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    >
                      <option value="">Recent People</option>
                      {people && people.map(person => (
                        <option key={person.id} value={person.id}>
                          {person.full_name} ({person.primary_role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Results Dropdown */}
                  {showPersonSearch && searchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searching ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#BC8BBC] mx-auto"></div>
                          <p className="mt-2 text-sm">Searching...</p>
                        </div>
                      ) : (
                        searchResults.map(person => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => handlePersonSelect(person)}
                            className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {person.profile_image_url ? (
                                <img
                                  src={person.profile_image_url}
                                  alt={person.full_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <Users size={16} className="text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                  {person.full_name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                  {person.primary_role}
                                  {person.nationality && ` • ${person.nationality}`}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.person_id && <p className="text-red-600 dark:text-red-400 text-sm">{errors.person_id}</p>}
                {(!people || people.length === 0) && (
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                    No people available. Please add people first.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Role Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Role Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role Type *
                </label>
                <select
                  name="role_type"
                  value={formData.role_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                >
                  {roles.map(role => {
                    const Icon = role.icon;
                    return (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    );
                  })}
                </select>
                {errors.role_type && <p className="text-red-600 dark:text-red-400 text-sm">{errors.role_type}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Credit Type
                </label>
                <select
                  name="credit_type"
                  value={formData.credit_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                >
                  {creditTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.role_type === 'actor' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Character Name *
                </label>
                <input
                  type="text"
                  name="character_name"
                  value={formData.character_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="Enter character name"
                />
                {errors.character_name && <p className="text-red-600 dark:text-red-400 text-sm">{errors.character_name}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role Description
              </label>
              <textarea
                name="role_description"
                value={formData.role_description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent resize-none"
                placeholder="Describe the role or responsibilities..."
              />
            </div>
          </div>

          {/* Billing and Episode Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Billing
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Billing Order
                </label>
                <input
                  type="number"
                  name="billing_order"
                  value={formData.billing_order}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="0"
                />
                {errors.billing_order && <p className="text-red-600 dark:text-red-400 text-sm">{errors.billing_order}</p>}
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Lower numbers appear first in credits
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Featured Role</span>
              </label>
            </div>

            {/* Episode Information (for series) */}
            {isSeriesContent && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Episode Specific
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Season
                    </label>
                    <input
                      type="number"
                      name="season_number"
                      value={formData.season_number}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      placeholder="1"
                    />
                    {errors.season_number && <p className="text-red-600 dark:text-red-400 text-sm">{errors.season_number}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Episode
                    </label>
                    <input
                      type="number"
                      name="episode_number"
                      value={formData.episode_number}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      placeholder="1"
                    />
                    {errors.episode_number && <p className="text-red-600 dark:text-red-400 text-sm">{errors.episode_number}</p>}
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Leave empty for all episodes in the series
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {casting ? 'Update Casting' : 'Add Casting'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CastingModal;