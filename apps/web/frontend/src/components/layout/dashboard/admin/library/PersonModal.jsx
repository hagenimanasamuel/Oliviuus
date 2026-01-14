import React, { useState, useEffect } from 'react';
import { X, Save, Users, Calendar, MapPin, Globe, Mail, Link, Award, Camera, Plus, Trash2 } from 'lucide-react';
import api from '../../../../../api/axios';

const PersonModal = ({ person, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    bio: '',
    date_of_birth: '',
    place_of_birth: '',
    nationality: '',
    gender: 'other',
    primary_role: 'actor',
    other_roles: [],
    agent_name: '',
    agent_contact: '',
    profile_image_url: '',
    website_url: '',
    imdb_url: '',
    wikipedia_url: '',
    social_links: [{ platform: '', url: '' }],
    search_keywords: [],
    slug: '',
    is_active: true,
    is_verified: false,
    popularity_score: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newKeyword, setNewKeyword] = useState('');

  const roles = [
    { value: 'actor', label: 'Actor', icon: Users },
    { value: 'director', label: 'Director', icon: Users },
    { value: 'producer', label: 'Producer', icon: Users },
    { value: 'writer', label: 'Writer', icon: Users },
    { value: 'cinematographer', label: 'Cinematographer', icon: Camera },
    { value: 'composer', label: 'Composer', icon: Award },
    { value: 'editor', label: 'Editor', icon: Users },
    { value: 'other', label: 'Other', icon: Users }
  ];

  const socialPlatforms = [
    'twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'linkedin'
  ];

  useEffect(() => {
    if (person) {
      // Safely parse and initialize the form data
      const personData = {
        full_name: person.full_name || '',
        display_name: person.display_name || '',
        bio: person.bio || '',
        date_of_birth: person.date_of_birth || '',
        place_of_birth: person.place_of_birth || '',
        nationality: person.nationality || '',
        gender: person.gender || 'other',
        primary_role: person.primary_role || 'actor',
        other_roles: Array.isArray(person.other_roles) ? person.other_roles : [],
        agent_name: person.agent_name || '',
        agent_contact: person.agent_contact || '',
        profile_image_url: person.profile_image_url || '',
        website_url: person.website_url || '',
        imdb_url: person.imdb_url || '',
        wikipedia_url: person.wikipedia_url || '',
        // Safely handle social_links - ensure it's always an array
        social_links: Array.isArray(person.social_links) && person.social_links.length > 0 
          ? person.social_links 
          : [{ platform: '', url: '' }],
        // Safely handle search_keywords - ensure it's always an array
        search_keywords: Array.isArray(person.search_keywords) ? person.search_keywords : [],
        slug: person.slug || '',
        is_active: person.is_active !== undefined ? person.is_active : true,
        is_verified: person.is_verified || false,
        popularity_score: person.popularity_score || 0
      };
      setFormData(personData);
    }
  }, [person]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSocialLinkChange = (index, field, value) => {
    const updatedLinks = [...(formData.social_links || [])];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setFormData(prev => ({ ...prev, social_links: updatedLinks }));
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social_links: [...(prev.social_links || []), { platform: '', url: '' }]
    }));
  };

  const removeSocialLink = (index) => {
    const currentLinks = formData.social_links || [];
    if (currentLinks.length > 1) {
      const updatedLinks = currentLinks.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, social_links: updatedLinks }));
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const currentKeywords = formData.search_keywords || [];
      if (!currentKeywords.includes(newKeyword.trim())) {
        setFormData(prev => ({
          ...prev,
          search_keywords: [...currentKeywords, newKeyword.trim()]
        }));
        setNewKeyword('');
      }
    }
  };

  const removeKeyword = (keyword) => {
    const currentKeywords = formData.search_keywords || [];
    setFormData(prev => ({
      ...prev,
      search_keywords: currentKeywords.filter(k => k !== keyword)
    }));
  };

  const handleKeywordKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      full_name: name,
      slug: !prev.slug || prev.slug === generateSlug(prev.full_name) ? generateSlug(name) : prev.slug
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.bio && formData.bio.length < 10) {
      newErrors.bio = 'Bio must be at least 10 characters long';
    }

    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    // Validate social links - safely handle array
    const socialLinks = formData.social_links || [];
    socialLinks.forEach((link, index) => {
      if (link.platform && !link.url) {
        newErrors[`social_links_${index}`] = 'URL is required when platform is selected';
      }
      if (link.url && !link.platform) {
        newErrors[`social_links_${index}`] = 'Platform is required when URL is provided';
      }
      if (link.url && !isValidUrl(link.url)) {
        newErrors[`social_links_${index}`] = 'Please enter a valid URL';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let response;

      // Prepare data for submission with safe array handling
      const submitData = {
        ...formData,
        other_roles: Array.isArray(formData.other_roles) ? formData.other_roles.filter(role => role !== formData.primary_role) : [],
        social_links: Array.isArray(formData.social_links) ? formData.social_links.filter(link => link.platform && link.url) : [],
        search_keywords: Array.isArray(formData.search_keywords) ? formData.search_keywords : []
      };

      if (person) {
        response = await api.put(`/people/${person.id}`, submitData);
      } else {
        response = await api.post('/people', submitData);
      }

      if (response.data.success) {
        onSave(response.data.data);
      }
    } catch (err) {
      console.error('Error saving person:', err);
      if (err.response?.data?.message) {
        setErrors({ submit: err.response.data.message });
      } else {
        setErrors({ submit: 'Failed to save person' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleValue) => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.icon : Users;
  };

  // Safely get social links for rendering
  const socialLinks = Array.isArray(formData.social_links) ? formData.social_links : [{ platform: '', url: '' }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#BC8BBC] text-white rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {person ? 'Edit Person' : 'Add New Person'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {person ? 'Update person details' : 'Add a new actor, director, or crew member'}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Basic Information
              </h3>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Users size={16} />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="Enter full name"
                />
                {errors.full_name && <p className="text-red-600 dark:text-red-400 text-sm">{errors.full_name}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Users size={16} />
                  Display Name
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="Optional display name"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Globe size={16} />
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent font-mono text-sm"
                  placeholder="url-slug"
                />
                {errors.slug && <p className="text-red-600 dark:text-red-400 text-sm">{errors.slug}</p>}
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Used in URLs. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Primary Role *
                </label>
                <select
                  name="primary_role"
                  value={formData.primary_role}
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
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Gender
                </label>
                <div className="flex gap-4">
                  {['male', 'female', 'other'].map(gender => (
                    <label key={gender} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={formData.gender === gender}
                        onChange={handleChange}
                        className="text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Personal Details
              </h3>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar size={16} />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                />
                {errors.date_of_birth && <p className="text-red-600 dark:text-red-400 text-sm">{errors.date_of_birth}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <MapPin size={16} />
                  Place of Birth
                </label>
                <input
                  type="text"
                  name="place_of_birth"
                  value={formData.place_of_birth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Globe size={16} />
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="Nationality"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Camera size={16} />
                  Profile Image URL
                </label>
                <input
                  type="url"
                  name="profile_image_url"
                  value={formData.profile_image_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Biography
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent resize-none"
              placeholder="Write a detailed biography about this person..."
            />
            {errors.bio && <p className="text-red-600 dark:text-red-400 text-sm">{errors.bio}</p>}
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {formData.bio.length}/1000 characters (minimum 10 required)
            </p>
          </div>

          {/* Professional Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Professional Links
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Link size={16} />
                  Website
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Award size={16} />
                  IMDb URL
                </label>
                <input
                  type="url"
                  name="imdb_url"
                  value={formData.imdb_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="https://www.imdb.com/name/nm..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Globe size={16} />
                  Wikipedia URL
                </label>
                <input
                  type="url"
                  name="wikipedia_url"
                  value={formData.wikipedia_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="https://en.wikipedia.org/wiki/..."
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Social Media Links
              </h3>
              <button
                type="button"
                onClick={addSocialLink}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={14} />
                Add Link
              </button>
            </div>

            {socialLinks.map((link, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                <div className="md:col-span-4">
                  <select
                    value={link.platform || ''}
                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  >
                    <option value="">Select Platform</option>
                    {socialPlatforms.map(platform => (
                      <option key={platform} value={platform}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-7">
                  <input
                    type="url"
                    value={link.url || ''}
                    onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    placeholder="https://platform.com/username"
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeSocialLink(index)}
                    className="w-full p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    disabled={socialLinks.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {errors[`social_links_${index}`] && (
                  <div className="md:col-span-12">
                    <p className="text-red-600 dark:text-red-400 text-sm">{errors[`social_links_${index}`]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search Keywords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Search Keywords
            </h3>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={handleKeywordKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="Add search keyword"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Array.isArray(formData.search_keywords) && formData.search_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Status and Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status & Settings
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_verified"
                    checked={formData.is_verified}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Verified Profile</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Professional Details
              </h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agent Name
                </label>
                <input
                  type="text"
                  name="agent_name"
                  value={formData.agent_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="Agent or management name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agent Contact
                </label>
                <input
                  type="text"
                  name="agent_contact"
                  value={formData.agent_contact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="Email or phone number"
                />
              </div>
            </div>
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
                  {person ? 'Update Person' : 'Create Person'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonModal;