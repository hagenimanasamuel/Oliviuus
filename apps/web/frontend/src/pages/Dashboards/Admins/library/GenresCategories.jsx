import React, { useState, useEffect, useRef } from "react";
import { 
  Edit3, ToggleLeft, ToggleRight, Eye, EyeOff, Star, 
  X, CheckCircle, AlertCircle, Plus, Search, Filter,
  Trash2, Save, ArrowUp, ArrowDown, Hash, Tag,
  BookOpen, Grid, List, SortAsc, SortDesc, Folder,
  FolderOpen, Layers, ChevronRight, ChevronDown
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../api/axios";

// Lazy-loaded modal components
const GenreModal = React.lazy(() => import("../../../../components/layout/dashboard/admin/library/GenreModal.jsx"));
const CategoryModal = React.lazy(() => import("../../../../components/layout/dashboard/admin/library/CategoryModal.jsx"));

export default function GenresCategories() {
  const [activeTab, setActiveTab] = useState("genres"); // "genres" or "categories"
  const [genres, setGenres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterParent, setFilterParent] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortConfig, setSortConfig] = useState({ key: 'sort_order', direction: 'asc' });
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isReordering, setIsReordering] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "genres") {
        const response = await api.get("/genres");
        if (response.data.success) {
          setGenres(response.data.data);
        } else {
          setError("Failed to load genres");
        }
      } else {
        const [categoriesRes, treeRes, parentsRes] = await Promise.all([
          api.get("/categories"),
          api.get("/categories/tree"),
          api.get("/categories/parents")
        ]);
        
        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data);
        } else {
          setError("Failed to load categories");
        }
        
        if (treeRes.data.success) {
          setCategoryTree(treeRes.data.data);
        }
        
        if (parentsRes.data.success) {
          setParentCategories(parentsRes.data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle category expansion in tree view
  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Common handlers for both genres and categories
  const toggleItemStatus = async (itemId, currentStatus) => {
    try {
      const endpoint = activeTab === "genres" ? `/genres/${itemId}` : `/categories/${itemId}`;
      const response = await api.put(endpoint, {
        is_active: !currentStatus
      });
      
      if (response.data.success) {
        if (activeTab === "genres") {
          setGenres(genres.map(item => 
            item.id === itemId ? { ...item, is_active: !currentStatus } : item
          ));
        } else {
          setCategories(categories.map(item => 
            item.id === itemId ? { ...item, is_active: !currentStatus } : item
          ));
          // Refresh tree view if needed
          if (viewMode === "tree") {
            const treeResponse = await api.get("/categories/tree");
            if (treeResponse.data.success) {
              setCategoryTree(treeResponse.data.data);
            }
          }
        }
        setSuccess(`${activeTab.slice(0, -1)} ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating item:", err);
      setError(`Failed to update ${activeTab.slice(0, -1)} status`);
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleItemSaved = (savedItem) => {
    if (activeTab === "genres") {
      if (selectedItem) {
        setGenres(genres.map(item => item.id === savedItem.id ? savedItem : item));
      } else {
        setGenres([savedItem, ...genres]);
      }
    } else {
      if (selectedItem) {
        setCategories(categories.map(item => item.id === savedItem.id ? savedItem : item));
      } else {
        setCategories([savedItem, ...categories]);
      }
      // Refresh tree and parent categories
      fetchCategoriesData();
    }
    setSuccess(`${activeTab.slice(0, -1)} ${selectedItem ? 'updated' : 'created'} successfully`);
    setTimeout(() => setSuccess(""), 3000);
    handleCloseModal();
  };

  const fetchCategoriesData = async () => {
    try {
      const [categoriesRes, treeRes, parentsRes] = await Promise.all([
        api.get("/categories"),
        api.get("/categories/tree"),
        api.get("/categories/parents")
      ]);
      
      if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
      if (treeRes.data.success) setCategoryTree(treeRes.data.data);
      if (parentsRes.data.success) setParentCategories(parentsRes.data.data);
    } catch (err) {
      console.error("Error refreshing categories data:", err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      return;
    }

    try {
      const endpoint = activeTab === "genres" ? `/genres/${itemId}` : `/categories/${itemId}`;
      const response = await api.delete(endpoint);
      
      if (response.data.success) {
        if (activeTab === "genres") {
          setGenres(genres.filter(item => item.id !== itemId));
        } else {
          setCategories(categories.filter(item => item.id !== itemId));
          // Refresh tree and parent categories
          fetchCategoriesData();
        }
        setSuccess(`${activeTab.slice(0, -1)} deleted successfully`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting item:", err);
      if (err.response?.data?.has_children || err.response?.data?.used_in_content) {
        setError(err.response.data.message);
      } else {
        setError(`Failed to delete ${activeTab.slice(0, -1)}`);
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.size === 0) {
      setError("Please select at least one item");
      return;
    }

    try {
      if (action === 'activate') {
        await Promise.all(
          Array.from(selectedItems).map(itemId => {
            const endpoint = activeTab === "genres" ? `/genres/${itemId}` : `/categories/${itemId}`;
            return api.put(endpoint, { is_active: true });
          })
        );
        updateItemsStatus(true);
        setSuccess(`${selectedItems.size} ${activeTab.slice(0, -1)}(s) activated`);
      } else if (action === 'deactivate') {
        await Promise.all(
          Array.from(selectedItems).map(itemId => {
            const endpoint = activeTab === "genres" ? `/genres/${itemId}` : `/categories/${itemId}`;
            return api.put(endpoint, { is_active: false });
          })
        );
        updateItemsStatus(false);
        setSuccess(`${selectedItems.size} ${activeTab.slice(0, -1)}(s) deactivated`);
      } else if (action === 'delete') {
        if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} ${activeTab.slice(0, -1)}(s)?`)) {
          return;
        }
        await Promise.all(
          Array.from(selectedItems).map(itemId => {
            const endpoint = activeTab === "genres" ? `/genres/${itemId}` : `/categories/${itemId}`;
            return api.delete(endpoint);
          })
        );
        if (activeTab === "genres") {
          setGenres(genres.filter(item => !selectedItems.has(item.id)));
        } else {
          setCategories(categories.filter(item => !selectedItems.has(item.id)));
          fetchCategoriesData();
        }
        setSuccess(`${selectedItems.size} ${activeTab.slice(0, -1)}(s) deleted`);
      }
      
      setSelectedItems(new Set());
      setBulkEditMode(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error performing bulk action:", err);
      setError("Failed to perform bulk action");
    }
  };

  const updateItemsStatus = (status) => {
    if (activeTab === "genres") {
      setGenres(genres.map(item =>
        selectedItems.has(item.id) ? { ...item, is_active: status } : item
      ));
    } else {
      setCategories(categories.map(item =>
        selectedItems.has(item.id) ? { ...item, is_active: status } : item
      ));
      if (viewMode === "tree") {
        fetchCategoriesData();
      }
    }
  };

  const handleReorder = async (direction, itemId) => {
    const items = activeTab === "genres" ? genres : categories;
    const currentIndex = items.findIndex(item => item.id === itemId);
    if ((direction === 'up' && currentIndex === 0) || 
        (direction === 'down' && currentIndex === items.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(currentIndex, 1);
    updatedItems.splice(newIndex, 0, movedItem);

    // Update sort_order based on new position
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      sort_order: index
    }));

    if (activeTab === "genres") {
      setGenres(reorderedItems);
    } else {
      setCategories(reorderedItems);
    }

    try {
      const endpoint = activeTab === "genres" ? '/genres/bulk-update' : '/categories/bulk-update';
      await api.patch(endpoint, {
        updates: reorderedItems.map(item => ({
          id: item.id,
          sort_order: item.sort_order
        }))
      });
      setSuccess(`${activeTab} reordered successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving reorder:", err);
      setError("Failed to save new order");
      // Revert on error
      fetchData();
    }
  };

  const toggleItemSelection = (itemId) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAllItems = () => {
    const items = activeTab === "genres" ? filteredGenres : filteredCategories;
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort genres
  const filteredGenres = genres
    .filter(genre => {
      const matchesSearch = genre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           genre.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (genre.description && genre.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterStatus === "all" ||
                           (filterStatus === "active" && genre.is_active) ||
                           (filterStatus === "inactive" && !genre.is_active);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortConfig.key === 'sort_order') {
        return sortConfig.direction === 'asc' ? a.sort_order - b.sort_order : b.sort_order - a.sort_order;
      }
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'created_at') {
        return sortConfig.direction === 'asc' ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  // Filter and sort categories
  const filteredCategories = categories
    .filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterStatus === "all" ||
                           (filterStatus === "active" && category.is_active) ||
                           (filterStatus === "inactive" && !category.is_active);
      
      const matchesParent = filterParent === "all" ||
                           (filterParent === "parents" && !category.parent_id) ||
                           (filterParent === "children" && category.parent_id) ||
                           (filterParent !== "all" && filterParent !== "parents" && filterParent !== "children" && category.parent_id == filterParent);

      return matchesSearch && matchesFilter && matchesParent;
    })
    .sort((a, b) => {
      if (sortConfig.key === 'sort_order') {
        return sortConfig.direction === 'asc' ? a.sort_order - b.sort_order : b.sort_order - a.sort_order;
      }
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'created_at') {
        return sortConfig.direction === 'asc' ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />;
  };

  // Render category tree recursively
  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => (
      <div key={category.id} className="space-y-1">
        <div 
          className={clsx(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            selectedItems.has(category.id) 
              ? "bg-[#BC8BBC] bg-opacity-10 border-[#BC8BBC]" 
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          )}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {bulkEditMode && (
            <input
              type="checkbox"
              checked={selectedItems.has(category.id)}
              onChange={() => toggleItemSelection(category.id)}
              className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
            />
          )}
          
          {category.children && category.children.length > 0 ? (
            <button
              onClick={() => toggleCategoryExpansion(category.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              {expandedCategories.has(category.id) ? 
                <ChevronDown size={16} /> : <ChevronRight size={16} />
              }
            </button>
          ) : (
            <div className="w-6"></div>
          )}

          <FolderOpen size={18} className="text-blue-500 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {category.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                /{category.slug}
              </span>
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {category.description}
              </p>
            )}
            {category.parent_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Parent: {category.parent_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={clsx(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              category.is_active 
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            )}>
              {category.is_active ? 'Active' : 'Inactive'}
            </span>

            {isReordering && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleReorder('up', category.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => handleReorder('down', category.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleEditItem(category)}
                className="p-2 text-gray-400 hover:text-[#BC8BBC] hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => toggleItemStatus(category.id, category.is_active)}
                className={clsx(
                  "p-2 rounded transition-colors",
                  category.is_active
                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                )}
              >
                {category.is_active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
              </button>
              <button
                onClick={() => handleDeleteItem(category.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {category.children && category.children.length > 0 && expandedCategories.has(category.id) && (
          <div className="space-y-1">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderItemCard = (item, isCategory = false) => (
    <div
      key={item.id}
      className={clsx(
        "bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group",
        item.is_active 
          ? 'border-green-200 dark:border-green-800' 
          : 'border-red-200 dark:border-red-800',
        selectedItems.has(item.id) && 'ring-2 ring-[#BC8BBC] ring-offset-2'
      )}
    >
      {/* Header */}
      <div className={clsx(
        "p-6 rounded-t-xl text-white relative overflow-hidden",
        item.is_active 
          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
          : 'bg-gradient-to-r from-red-500 to-orange-600'
      )}>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                {isCategory ? <Folder size={24} /> : <BookOpen size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold">{item.name}</h3>
                <p className="text-white/80 text-sm">/{item.slug}</p>
                {isCategory && item.parent_name && (
                  <p className="text-white/60 text-xs">Parent: {item.parent_name}</p>
                )}
              </div>
            </div>
            {bulkEditMode ? (
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => toggleItemSelection(item.id)}
                className="rounded border-white bg-white/20 backdrop-blur-sm text-[#BC8BBC] focus:ring-[#BC8BBC]"
              />
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                <Hash size={12} />
                {item.sort_order}
              </span>
            )}
          </div>
        </div>
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {item.description || (
              <span className="text-gray-400 italic">No description provided</span>
            )}
          </p>
        </div>

        {/* Meta Information */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Created</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          {item.meta_title && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Meta Title</span>
              <span className="text-gray-900 dark:text-white truncate max-w-[120px]">
                {item.meta_title}
              </span>
            </div>
          )}
          {isCategory && item.children_count > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Subcategories</span>
              <span className="text-gray-900 dark:text-white">
                {item.children_count}
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <span className={clsx(
            "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
            item.is_active 
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          )}>
            {item.is_active ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {item.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Action Buttons */}
        {!bulkEditMode && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleEditItem(item)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-[#BC8BBC] text-white rounded-lg text-sm font-medium hover:bg-[#9b69b2] transition-all hover:scale-105"
            >
              <Edit3 size={16} />
              Edit
            </button>
            <button
              onClick={() => toggleItemStatus(item.id, item.is_active)}
              className={clsx(
                "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                item.is_active
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                  : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
              )}
            >
              {item.is_active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
              {item.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderListView = (items, isCategory = false) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            {bulkEditMode && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectedItems.size === items.length && items.length > 0}
                  onChange={selectAllItems}
                  className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                />
              </th>
            )}
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('sort_order')}
            >
              <div className="flex items-center gap-1">
                <Hash size={14} />
                Order
                {getSortIcon('sort_order')}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1">
                <Tag size={14} />
                {isCategory ? 'Category' : 'Genre'}
                {getSortIcon('name')}
              </div>
            </th>
            {isCategory && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Parent
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              {bulkEditMode && (
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                  />
                </td>
              )}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {isReordering && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorder('up', item.id)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => handleReorder('down', item.id)}
                        disabled={index === items.length - 1}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  )}
                  <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                    {item.sort_order}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">/{item.slug}</div>
                </div>
              </td>
              {isCategory && (
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {item.parent_name || <span className="text-gray-400 italic">None</span>}
                  </div>
                </td>
              )}
              <td className="px-6 py-4">
                <div className="text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                  {item.description || <span className="text-gray-400 italic">No description</span>}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={clsx(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  item.is_active 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                )}>
                  {item.is_active ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#BC8BBC] hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    title={`Edit ${isCategory ? 'category' : 'genre'}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => toggleItemStatus(item.id, item.is_active)}
                    className={clsx(
                      "p-2 rounded transition-colors",
                      item.is_active
                        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    )}
                    title={item.is_active ? "Deactivate" : "Activate"}
                  >
                    {item.is_active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title={`Delete ${isCategory ? 'category' : 'genre'}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading {activeTab}...</p>
        </div>
      </div>
    );
  }

  const currentItems = activeTab === "genres" ? filteredGenres : filteredCategories;
  const isCategory = activeTab === "categories";

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Genres & Categories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your content genres and categories for better organization
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsReordering(!isReordering)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all",
              isReordering 
                ? "bg-[#BC8BBC] text-white border-[#BC8BBC]" 
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            {isReordering ? <Save size={18} /> : <Hash size={18} />}
            {isReordering ? "Save Order" : "Reorder"}
          </button>
          <button 
            onClick={handleCreateItem}
            className="flex items-center gap-2 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors font-medium"
          >
            <Plus size={18} />
            Add {isCategory ? "Category" : "Genre"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("genres")}
          className={clsx(
            "flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors",
            activeTab === "genres"
              ? "border-[#BC8BBC] text-[#BC8BBC]"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <BookOpen size={18} />
          Genres
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
            {genres.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={clsx(
            "flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors",
            activeTab === "categories"
              ? "border-[#BC8BBC] text-[#BC8BBC]"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Layers size={18} />
          Categories
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
            {categories.length}
          </span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={`Search ${activeTab} by name, slug, or description...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          {isCategory && (
            <select
              value={filterParent}
              onChange={(e) => setFilterParent(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="parents">Parent Only</option>
              <option value="children">Subcategories</option>
              {parentCategories.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={clsx(
                "p-2 transition-colors",
                viewMode === "grid" 
                  ? "bg-[#BC8BBC] text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx(
                "p-2 transition-colors",
                viewMode === "list" 
                  ? "bg-[#BC8BBC] text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <List size={18} />
            </button>
            {isCategory && (
              <button
                onClick={() => setViewMode("tree")}
                className={clsx(
                  "p-2 transition-colors",
                  viewMode === "tree" 
                    ? "bg-[#BC8BBC] text-white" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <Folder size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkEditMode && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-blue-700 dark:text-blue-400 font-medium">
              {selectedItems.size} {activeTab.slice(0, -1)}(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setBulkEditMode(false);
              setSelectedItems(new Set());
            }}
            className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
          <p className="text-green-700 dark:text-green-400">{success}</p>
          <button 
            onClick={() => setSuccess("")}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content Area */}
      {isCategory && viewMode === "tree" ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-2">
            {renderCategoryTree(categoryTree)}
          </div>
        </div>
      ) : viewMode === "list" ? (
        renderListView(currentItems, isCategory)
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {currentItems.map((item) => renderItemCard(item, isCategory))}
        </div>
      )}

      {/* Empty State */}
      {currentItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            {isCategory ? <Folder className="w-12 h-12 text-gray-400" /> : <BookOpen className="w-12 h-12 text-gray-400" />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No {activeTab} found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            {searchTerm || filterStatus !== 'all' || (isCategory && filterParent !== 'all')
              ? 'Try adjusting your search or filter criteria.'
              : `No ${activeTab} have been created yet. Get started by creating your first ${activeTab.slice(0, -1)}!`
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (!isCategory || filterParent === 'all') && (
            <button 
              onClick={handleCreateItem}
              className="flex items-center gap-2 px-6 py-3 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors font-medium mx-auto"
            >
              <Plus size={18} />
              Create First {isCategory ? "Category" : "Genre"}
            </button>
          )}
        </div>
      )}

      {/* Bulk Edit Toggle */}
      {!isReordering && currentItems.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all",
              bulkEditMode
                ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            {bulkEditMode ? "Cancel Bulk Edit" : "Bulk Edit"}
          </button>
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <React.Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
          </div>
        }>
          {isCategory ? (
            <CategoryModal
              category={selectedItem}
              parentCategories={parentCategories}
              onClose={handleCloseModal}
              onSave={handleItemSaved}
            />
          ) : (
            <GenreModal
              genre={selectedItem}
              onClose={handleCloseModal}
              onSave={handleItemSaved}
            />
          )}
        </React.Suspense>
      )}
    </div>
  );
}