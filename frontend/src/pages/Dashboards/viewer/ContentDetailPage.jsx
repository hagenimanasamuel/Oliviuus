// src/pages/ContentDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContentDetailModal from '../../../components/layout/dashboard/viewer/content/ContentDetailModal.jsx';
import api from '../../../api/axios';

const ContentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/viewer/content/${id}`);
        setContent(response.data.data);
      } catch (err) {
        setError('Content not found');
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContent();
    }
  }, [id]);

  const handleClose = () => {
    navigate(-1);
  };

  const handlePlay = (content) => {
    // Implement play functionality
    console.log('Play content:', content);
  };

  const handleAddToList = (content) => {
    // Implement add to list functionality
    console.log('Add to list:', content);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Content Not Found</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <ContentDetailModal
      content={content}
      isOpen={true}
      onClose={handleClose}
      onPlay={handlePlay}
      onAddToList={handleAddToList}
    />
  );
};

export default ContentDetailPage;