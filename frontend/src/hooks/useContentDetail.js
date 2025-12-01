import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useContentDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPathRef = useRef('/');
  
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    content: null,
    position: null
  });

  const openDetailModal = useCallback((content, position = null) => {
    // Save current path before opening modal
    previousPathRef.current = location.pathname;
    
    // Update URL for sharing/deep linking
    navigate(`/title/${content.id}`, { 
      state: { 
        modal: true,
        previousPath: location.pathname,
        scrollPosition: window.scrollY
      }
    });
    
    setDetailModal({
      isOpen: true,
      content,
      position
    });
  }, [navigate, location.pathname]);

  const closeDetailModal = useCallback(() => {
    const navigationState = window.history.state;
    
    // PRO: Smart navigation logic
    if (navigationState?.usr?.modal) {
      // User came via modal - go back to previous page
      navigate(-1);
    } else if (previousPathRef.current && previousPathRef.current !== '/title/' + detailModal.content?.id) {
      // User navigated within our app - go to previous path
      navigate(previousPathRef.current, { 
        replace: true,
        state: { restoreScroll: true }
      });
    } else {
      // User came via direct link or external source - go to homepage
      navigate('/', { replace: true });
    }
    
    setDetailModal({
      isOpen: false,
      content: null,
      position: null
    });
  }, [navigate, detailModal.content?.id]);

  return {
    detailModal,
    openDetailModal,
    closeDetailModal
  };
};