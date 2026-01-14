import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../../api/axios";
import ContentHeader from "../../../../components/layout/dashboard/admin/library/ContentHeader";
import ContentList from "../../../../components/layout/dashboard/admin/library/ContentList";
import ContentCreationModal from "../../../../components/layout/dashboard/admin/library/ContentCreationModal";
import ContentDetailModal from "../../../../components/layout/dashboard/admin/library/ContentDetailModal";

export default function AllContent() {
  // State management
  const [contents, setContents] = useState([]);
  const [allContentsCount, setAllContentsCount] = useState(0); // Total count from DB
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedContents, setSelectedContents] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  // Filter states - DEFAULT to empty string to show ALL content
  const [filters, setFilters] = useState({
    search: '',
    statusFilter: '', // Empty string = ALL statuses
    typeFilter: '',
    sort: 'newest'
  });

  // Fetch total content count from backend (all statuses)
  const fetchTotalContentCount = useCallback(async () => {
    try {
      const response = await axios.get('/contents?limit=1&status='); // Empty status = all
      setAllContentsCount(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching total content count:', err);
      setAllContentsCount(0);
    }
  }, []);

  // Fetch contents from backend API
  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Add filters - empty status means ALL content
      if (filters.search) params.append('search', filters.search);
      if (filters.statusFilter) params.append('status', filters.statusFilter);
      // If statusFilter is empty, don't send status param = get ALL
      if (filters.typeFilter) params.append('content_type', filters.typeFilter);
      if (filters.sort) params.append('sort', filters.sort);

      // Get more content to handle filtering client-side if needed
      params.append('limit', '100');

      const response = await axios.get(`/contents?${params}`);

      if (response.data.success) {
        setContents(response.data.contents || []);

        // Update total count from pagination if available
        if (response.data.pagination?.total) {
          setAllContentsCount(response.data.pagination.total);
        }
      } else {
        throw new Error(response.data.error || 'Failed to fetch contents');
      }
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load contents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial data loading
  useEffect(() => {
    fetchTotalContentCount();
    fetchContents();
  }, []);

  // Refresh content when filters change
  useEffect(() => {
    fetchContents();
  }, [filters, fetchContents]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setSelectedContents([]);
  }, []);

  // Handle content selection for detail view
  const handleContentSelect = (content) => {
    setSelectedContent(content);
  };

  // Handle content selection for bulk actions
  const handleContentCheckboxSelect = (contentId, isSelected) => {
    setSelectedContents(prev =>
      isSelected
        ? [...prev, contentId]
        : prev.filter(id => id !== contentId)
    );
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedContents.length === 0) return;

    try {
      const actions = {
        publish: (id) => axios.put(`/contents/${id}/publish`),
        draft: (id) => axios.put(`/contents/${id}`, { status: 'draft' }),
        archive: (id) => axios.put(`/contents/${id}`, { status: 'archived' }),
        delete: (id) => axios.delete(`/contents/${id}`)
      };

      if (action === 'delete') {
        if (!window.confirm(`Are you sure you want to delete ${selectedContents.length} content items?`)) {
          return;
        }
      }

      await Promise.all(selectedContents.map(actions[action]));

      // Refresh content after bulk action
      await fetchContents();
      await fetchTotalContentCount();
      setSelectedContents([]);

    } catch (err) {
      console.error('Error performing bulk action:', err);
      alert(`Failed to ${action} content: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle content creation
  const handleAddContent = () => {
    setShowCreateModal(true);
  };

  const handleCloseContentCreation = () => {
    setShowCreateModal(false);
  };

  const handleContentCreated = async (newContent) => {
    await fetchContents();
    await fetchTotalContentCount();
    handleCloseContentCreation();
  };

  // Handle content deletion
  const handleContentDelete = async (content) => {
    if (window.confirm(`Are you sure you want to delete "${content.title}"?`)) {
      try {
        await axios.delete(`/contents/${content.id}`);
        setContents(prev => prev.filter(item => item.id !== content.id));
        setAllContentsCount(prev => prev - 1);
        setSelectedContent(null); // Close modal if open
      } catch (err) {
        console.error('Error deleting content:', err);
        alert(`Failed to delete content: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  // Handle content editing
  const handleContentEdit = (content) => {
    setSelectedContent(content);
    // You might want to open an edit modal here instead
    console.log('Edit content:', content);
    // TODO: Implement edit functionality
  };

  // Handle content play
  const handleContentPlay = (content) => {
    console.log('Play content:', content);
    // TODO: Implement play functionality
  };

  // Handle refresh
  const handleRefresh = async () => {
    await fetchContents();
    await fetchTotalContentCount();
  };

  // Handle content archive
  const handleContentArchive = async (content) => {
    if (window.confirm(`Are you sure you want to archive "${content.title}"?`)) {
      try {
        await axios.put(`/contents/${content.id}/archive`);
        await fetchContents();
        await fetchTotalContentCount();
        setSelectedContent(null); // Close modal if open
      } catch (err) {
        console.error('Error archiving content:', err);
        alert(`Failed to archive content: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  // Handle content duplicate
  const handleContentDuplicate = async (content) => {
    try {
      const response = await axios.post(`/contents/${content.id}/duplicate`);
      await fetchContents();
      await fetchTotalContentCount();
      alert('Content duplicated successfully!');
    } catch (err) {
      console.error('Error duplicating content:', err);
      alert(`Failed to duplicate content: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle content settings update
  const handleContentSettingsUpdate = async (updatedContent) => {
    try {

      // Safety check
      if (!updatedContent?.id || typeof updatedContent.id !== 'number') {
        console.error('❌ Invalid content ID:', updatedContent?.id);
        return;
      }

      // Update local state - NO API CALL NEEDED (SettingsTab already made it)
      setContents(prevContents =>
        prevContents.map(content =>
          content.id === updatedContent.id ? updatedContent : content
        )
      );

    } catch (err) {
      console.error('Error handling content settings update:', err);
      alert(`Failed to update content: ${err.response?.data?.error || err.message}`);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Content Header - Pass total count and filtered count separately */}
        <ContentHeader
          search={filters.search}
          setSearch={(value) => handleFilterChange({ search: value })}
          statusFilter={filters.statusFilter}
          setStatusFilter={(value) => handleFilterChange({ statusFilter: value })}
          typeFilter={filters.typeFilter}
          setTypeFilter={(value) => handleFilterChange({ typeFilter: value })}
          sort={filters.sort}
          setSort={(value) => handleFilterChange({ sort: value })}
          totalContent={allContentsCount} // Total count from DB (all statuses)
          filteredCount={contents.length} // Currently displayed count
          onAddContent={handleAddContent}
          selectedContent={selectedContents}
          onBulkAction={handleBulkAction}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* Content List */}
        <ContentList
          contents={contents}
          loading={loading}
          error={error}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onContentEdit={handleContentEdit}
          onContentDelete={handleContentDelete}
          onContentView={handleContentSelect}
          onContentPlay={handleContentPlay}
          selectedContents={selectedContents}
          onContentSelect={handleContentCheckboxSelect}
          showSelection={selectedContents.length > 0}
          emptyMessage={filters.search ? "No content matches your search" : "No content available"}
          onRetry={fetchContents}
        />

        {/* Content Creation Modal */}
        {showCreateModal && (
          <ContentCreationModal
            onClose={handleCloseContentCreation}
            onContentCreated={handleContentCreated}
            categories={[]}
            genres={[]}
            tags={[]}
          />
        )}

        {/* Content Detail Modal */}
        {selectedContent && (
          <ContentDetailModal
            content={selectedContent}
            onClose={() => setSelectedContent(null)}
            onEdit={handleContentEdit}
            onDelete={handleContentDelete}
            onPlay={handleContentPlay}
            onArchive={handleContentArchive}
            onDuplicate={handleContentDuplicate}
            onSettingsUpdate={handleContentSettingsUpdate}
          />
        )}
      </div>
    </div>
  );
}