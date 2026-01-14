// Utility functions for video player
export const getBufferedPercentage = (buffered, currentTime, duration) => {
  if (!buffered || buffered.length === 0 || !duration) return 0;
  
  let bufferedEnd = 0;
  for (let i = 0; i < buffered.length; i++) {
    if (currentTime >= buffered[i].start && currentTime <= buffered[i].end) {
      bufferedEnd = buffered[i].end;
      break;
    }
  }
  
  if (bufferedEnd === 0 && buffered.length > 0) {
    bufferedEnd = Math.max(...buffered.map(b => b.end));
  }
  
  return Math.min((bufferedEnd / duration) * 100, 100);
};