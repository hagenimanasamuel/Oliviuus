// src/pages/Dashboards/viewer/content/components/TabContent/OverviewTab.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Languages, Star, Clock, Film, Users, Calendar, Award, Globe } from 'lucide-react';

const OverviewTab = ({ contentData }) => {
  const { t } = useTranslation();

  const getGenres = () => {
    if (contentData?.genres && Array.isArray(contentData.genres)) {
      return contentData.genres.map(genre => genre.name).join(' • ');
    }
    return contentData?.genre || t('contentdetail.metadata.movie', 'Movie');
  };

  const getRating = () => {
    const rating = contentData?.current_rating || contentData?.average_rating || contentData?.rating;
    return typeof rating === 'number' ? rating.toFixed(1) : t('contentdetail.metadata.notAvailable', 'N/A');
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return t('contentdetail.metadata.durationHours', '{{hours}}h {{mins}}m', { hours, mins });
    }
    return t('contentdetail.metadata.durationMinutes', '{{mins}}m', { mins });
  };

  const getContentWarnings = () => {
    return contentData?.content_warnings || [];
  };

  const getAvailableLanguages = () => {
    return contentData?.available_languages?.map(lang => ({
      ...lang,
      is_default: lang.default || lang.is_default
    })) || [];
  };

  const getAgeRating = () => {
    const rating = contentData?.age_rating || "13+";
    const ratingMap = {
      'G': t('contentdetail.ratings.G', 'All Ages'),
      'PG': t('contentdetail.ratings.PG', 'Parental Guidance'),
      'PG-13': t('contentdetail.ratings.PG13', '13+'),
      'R': t('contentdetail.ratings.R', '18+'),
      'NC-17': t('contentdetail.ratings.NC17', 'Adults Only')
    };
    return ratingMap[rating] || `${rating}`;
  };

  const getContentTypeDisplay = () => {
    const contentType = contentData?.content_type || 'movie';
    const typeMap = {
      'movie': t('contentdetail.metadata.movie', 'Movie'),
      'series': t('contentdetail.metadata.series', 'TV Series'),
      'documentary': t('contentdetail.metadata.documentary', 'Documentary')
    };
    return typeMap[contentType] || contentType.charAt(0).toUpperCase() + contentType.slice(1);
  };

  return (
    <div className="space-y-8">
      {/* Synopsis Section */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
          <Film className="w-6 h-6 text-[#BC8BBC]" />
          {t('contentdetail.sections.synopsis', 'Synopsis')}
        </h3>
        <p className="text-gray-300 leading-relaxed text-lg">
          {contentData?.description || contentData?.short_description || t('contentdetail.messages.noDescription', 'No description available.')}
        </p>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rating */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl border border-yellow-500/20 p-4 text-center">
          <div className="flex justify-center mb-2">
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <h4 className="text-sm font-semibold text-yellow-400 mb-1">
            {t('contentdetail.metadata.rating', 'Rating')}
          </h4>
          <p className="text-white font-bold text-xl">{getRating()}<span className="text-yellow-400 text-lg">/5</span></p>
        </div>

        {/* Duration */}
        {contentData?.duration_minutes && (
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20 p-4 text-center">
            <div className="flex justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-blue-400 mb-1">
              {t('contentdetail.metadata.duration', 'Duration')}
            </h4>
            <p className="text-white font-bold text-xl">{formatDuration(contentData.duration_minutes)}</p>
          </div>
        )}

        {/* Age Rating */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20 p-4 text-center">
          <div className="flex justify-center mb-2">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <h4 className="text-sm font-semibold text-green-400 mb-1">
            {t('contentdetail.metadata.ageRating', 'Age Rating')}
          </h4>
          <p className="text-white font-bold text-xl">{getAgeRating()}</p>
        </div>

        {/* Content Type */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20 p-4 text-center">
          <div className="flex justify-center mb-2">
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <h4 className="text-sm font-semibold text-purple-400 mb-1">
            {t('contentdetail.metadata.contentType', 'Type')}
          </h4>
          <p className="text-white font-bold text-xl">{getContentTypeDisplay()}</p>
        </div>
      </div>

      {/* Genres Section */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Film className="w-5 h-5 text-[#BC8BBC]" />
          {t('contentdetail.metadata.genres', 'Genres')}
        </h4>
        <div className="flex flex-wrap gap-3">
          {contentData?.genres?.map((genre, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-[#BC8BBC]/20 text-[#BC8BBC] rounded-lg font-medium border border-[#BC8BBC]/30 hover:bg-[#BC8BBC]/30 transition-colors duration-200"
            >
              {genre.name}
            </span>
          ))}
        </div>
      </div>

      {/* Content Warnings */}
      {getContentWarnings().length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h4 className="text-xl font-bold text-yellow-400">
              {t('contentdetail.metadata.contentWarnings', 'Content Warnings')}
            </h4>
          </div>
          <div className="flex flex-wrap gap-3">
            {getContentWarnings().map((warning, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/30"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">{warning.warning_type}</span>
                {warning.description && (
                  <span className="text-yellow-200 text-sm ml-2">({warning.description})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Languages */}
      {getAvailableLanguages().length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Languages className="w-6 h-6 text-blue-400" />
            <h4 className="text-xl font-bold text-blue-400">
              {t('contentdetail.metadata.availableLanguages', 'Available Languages')}
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getAvailableLanguages().map((lang, index) => (
              <div
                key={index}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${
                  lang.is_default 
                    ? 'bg-blue-500/30 border-blue-400 text-blue-300' 
                    : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{lang.language_code.toUpperCase()}</span>
                {lang.is_default && (
                  <span className="text-xs bg-blue-400 text-white px-2 py-1 rounded-full ml-2">
                    {t('contentdetail.metadata.default', 'Default')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Release Date (if available) */}
      {contentData?.release_date && (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#BC8BBC]" />
            <div>
              <h4 className="text-lg font-semibold text-white mb-1">
                {t('contentdetail.metadata.releaseDate', 'Release Date')}
              </h4>
              <p className="text-gray-300">
                {new Date(contentData.release_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;