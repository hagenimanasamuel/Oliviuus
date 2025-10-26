const generateFilePath = (contentType, contentId, fileType, options = {}) => {
  const timestamp = Date.now();
  const { seasonNumber, episodeNumber, language, quality } = options;
  
  const basePaths = {
    thumbnail: `thumbnails/${contentId}/thumbnail-${timestamp}.jpg`,
    poster: `posters/${contentId}/poster-${timestamp}.jpg`,
    mainVideo: `videos/${contentType}s/${contentId}/main-${timestamp}.mp4`,
    trailer: `videos/${contentType}s/${contentId}/trailer-${timestamp}.mp4`,
    episode: `episodes/${contentId}/season_${seasonNumber}/episode_${episodeNumber}-${timestamp}.mp4`,
    subtitle: `subtitles/${contentId}/${language}-${timestamp}.vtt`,
    screenshot: `videos/${contentType}s/${contentId}/screenshots/screenshot-${timestamp}.jpg`
  };
  
  return basePaths[fileType];
};

module.exports = { generateFilePath };