// hooks/useEpisodeManager.js
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useEpisodeManager = (content) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentEpisode, setCurrentEpisode] = useState(null);
  
  const episodeId = searchParams.get('ep');
  const isSeries = content?.media_assets?.some(asset => 
    asset.asset_type === 'episodeVideo'
  );

  const episodes = content?.media_assets?.filter(asset => 
    asset.asset_type === 'episodeVideo'
  ) || [];

  const getNextEpisode = useCallback((currentEp) => {
    if (!episodes.length) return null;
    const currentIndex = episodes.findIndex(ep => 
      ep.id === currentEp?.id || ep._id === currentEp?._id
    );
    return episodes[currentIndex + 1] || null;
  }, [episodes]);

  const getPreviousEpisode = useCallback((currentEp) => {
    if (!episodes.length) return null;
    const currentIndex = episodes.findIndex(ep => 
      ep.id === currentEp?.id || ep._id === currentEp?._id
    );
    return episodes[currentIndex - 1] || null;
  }, [episodes]);

  const getEpisodeProgress = useCallback((episode) => {
    const epId = episode.id || episode._id;
    const savedTime = localStorage.getItem(`video-player-time-${epId}`);
    if (!savedTime || !episode.duration) return 0;
    return (parseFloat(savedTime) / episode.duration) * 100;
  }, []);

  const getFirstUnwatchedEpisode = useCallback(() => {
    for (let episode of episodes) {
      const progress = getEpisodeProgress(episode);
      if (progress < 90) { // Consider <90% as unwatched
        return episode;
      }
    }
    return episodes[0] || null; // Return first episode if all watched
  }, [episodes, getEpisodeProgress]);

  // Auto-select episode based on URL or content
  useEffect(() => {
    if (!content || !isSeries) return;

    let targetEpisode = null;

    // 1. Priority: Episode from URL
    if (episodeId) {
      targetEpisode = episodes.find(ep => 
        ep.id === episodeId || ep._id === episodeId
      );
    }

    // 2. Fallback: First unwatched episode
    if (!targetEpisode) {
      targetEpisode = getFirstUnwatchedEpisode();
    }

    // 3. Final fallback: First episode
    if (!targetEpisode && episodes.length > 0) {
      targetEpisode = episodes[0];
    }

    if (targetEpisode && currentEpisode?.id !== targetEpisode.id) {
      setCurrentEpisode(targetEpisode);
      
      // Update URL if no episode parameter
      if (!episodeId) {
        const epId = targetEpisode.id || targetEpisode._id;
        setSearchParams({ ep: epId });
      }
    }
  }, [content, episodeId, episodes, isSeries, currentEpisode, setSearchParams, getFirstUnwatchedEpisode]);

  const selectEpisode = useCallback((episode) => {
    const episodeId = episode.id || episode._id;
    setCurrentEpisode(episode);
    setSearchParams({ ep: episodeId });
    return episode;
  }, [setSearchParams]);

  const selectNextEpisode = useCallback(() => {
    const nextEpisode = getNextEpisode(currentEpisode);
    if (nextEpisode) {
      return selectEpisode(nextEpisode);
    }
    return null;
  }, [currentEpisode, getNextEpisode, selectEpisode]);

  const selectPreviousEpisode = useCallback(() => {
    const prevEpisode = getPreviousEpisode(currentEpisode);
    if (prevEpisode) {
      return selectEpisode(prevEpisode);
    }
    return null;
  }, [currentEpisode, getPreviousEpisode, selectEpisode]);

  return {
    currentEpisode,
    episodes,
    isSeries,
    selectEpisode,
    selectNextEpisode,
    selectPreviousEpisode,
    getNextEpisode,
    getPreviousEpisode,
    getEpisodeProgress,
    getFirstUnwatchedEpisode
  };
};