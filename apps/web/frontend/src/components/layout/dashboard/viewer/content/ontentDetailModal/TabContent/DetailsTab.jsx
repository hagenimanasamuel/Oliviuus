// src/pages/Dashboards/viewer/content/components/TabContent/DetailsTab.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock, Film, Globe, Users, Award, Download, Share2 } from 'lucide-react';

const DetailsTab = ({ contentData }) => {
  const { t } = useTranslation();

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return t('contentdetail.metadata.durationHours', '{{hours}}h {{mins}}m', { hours, mins });
    }
    return t('contentdetail.metadata.durationMinutes', '{{mins}}m', { mins });
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
    if (contentData?.content_type === 'series') {
      return t('contentdetail.metadata.tvSeries', 'TV Series');
    } else if (contentData?.content_type === 'movie') {
      return t('contentdetail.metadata.movie', 'Movie');
    } else {
      return contentData?.content_type || t('contentdetail.metadata.content', 'Content');
    }
  };

  const getSeasonInfo = () => {
    if (contentData?.content_type === 'series' && contentData?.total_seasons) {
      const seasonsText = contentData.total_seasons > 1 
        ? t('contentdetail.metadata.seasonsPlural', '{{count}} Seasons', { count: contentData.total_seasons })
        : t('contentdetail.metadata.seasonsSingular', '{{count}} Season', { count: contentData.total_seasons });
      
      if (contentData.episodes_per_season) {
        const episodesText = t('contentdetail.metadata.episodesPerSeason', '{{count}} episodes per season', { count: contentData.episodes_per_season });
        return `${seasonsText} • ${episodesText}`;
      }
      return seasonsText;
    }
    return '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Movie Details */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Film className="w-5 h-5" />
          {t('contentdetail.sections.movieDetails', 'Movie Details')}
        </h3>
        <div className="space-y-4">
          {/* Release Date */}
          {contentData?.release_date && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-[#BC8BBC] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">
                    {t('contentdetail.metadata.releaseDate', 'Release Date')}
                  </h4>
                  <p className="text-white font-medium">
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

          {/* Duration */}
          {contentData?.duration_minutes && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#BC8BBC] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">
                    {t('contentdetail.metadata.duration', 'Duration')}
                  </h4>
                  <p className="text-white font-medium">{formatDuration(contentData.duration_minutes)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content Type */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <Film className="w-4 h-4 text-[#BC8BBC] flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-1">
                  {t('contentdetail.metadata.contentType', 'Type')}
                </h4>
                <p className="text-white font-medium">
                  {getContentTypeDisplay()}
                </p>
              </div>
            </div>
          </div>

          {/* Age Rating */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#BC8BBC] flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-1">
                  {t('contentdetail.metadata.ageRating', 'Age Rating')}
                </h4>
                <p className="text-white font-medium">{getAgeRating()}</p>
              </div>
            </div>
          </div>

          {/* Primary Language */}
          {contentData?.primary_language && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#BC8BBC] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">
                    {t('contentdetail.metadata.originalLanguage', 'Original Language')}
                  </h4>
                  <p className="text-white font-medium uppercase">{contentData.primary_language}</p>
                </div>
              </div>
            </div>
          )}

          {/* Director */}
          {contentData?.director && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-[#BC8BBC] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">
                    {t('contentdetail.metadata.director', 'Director')}
                  </h4>
                  <p className="text-white font-medium">{contentData.director}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features & Categories */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Award className="w-5 h-5" />
          {t('contentdetail.sections.featuresCategories', 'Features & Categories')}
        </h3>
        <div className="space-y-4">
          {/* Categories */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">
              {t('contentdetail.metadata.categories', 'Categories')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {contentData?.categories?.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-[#BC8BBC]/20 text-[#BC8BBC] rounded-lg text-sm font-medium border border-[#BC8BBC]/30"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>

          {/* For Series - Season Info */}
          {contentData?.content_type === 'series' && contentData?.total_seasons && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Film className="w-4 h-4 text-[#BC8BBC] flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">
                    {t('contentdetail.metadata.seasons', 'Seasons')}
                  </h4>
                  <p className="text-white font-medium">
                    {getSeasonInfo()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;