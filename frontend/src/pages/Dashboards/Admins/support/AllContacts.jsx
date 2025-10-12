import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Mail, Clock, AlertCircle, CheckCircle, MessageSquare, MoreHorizontal, Eye, Reply } from "lucide-react";
import api from "../../../../api/axios";
import ContactsHeader from "../../../../components/layout/dashboard/admin/support/ContactsHeader";
import ContactsList from "./ContactsList";
import ContactModal from "./ContactModal";
import { useTranslation } from "react-i18next";

export default function AllContacts() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    category: "",
    sortBy: "created_at",
    sortOrder: "DESC",
    page: 1,
    limit: 20,
    date_start: "",
    date_end: "",
    response_count: "",
    source: ""
  });

  const LIMIT = 20;

  // Fetch contacts function
  const fetchContacts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      
      // Add all filter parameters including advanced filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.append(key, value);
        }
      });

      const response = await api.get(`/contact/admin/contacts?${params}`);
      
      if (response.data.success) {
        const fetchedContacts = response.data.data.contacts || [];
        const total = response.data.data.pagination?.totalContacts || fetchedContacts.length;

        if (reset) {
          setContacts(fetchedContacts);
        } else {
          setContacts(prev => [...prev, ...fetchedContacts]);
        }
        
        setTotalContacts(total);
        setHasMore(fetchedContacts.length === LIMIT);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, loading]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value,
      page: key === 'page' ? value : 1
    }));
  };

  // Handle contact click to open modal
  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setIsContactModalOpen(true);
  };

  // Handle modal close
  const handleCloseContactModal = () => {
    setIsContactModalOpen(false);
    setSelectedContact(null);
  };

  // Handle contact update (status change, reply, etc.)
  const handleContactUpdated = (updatedContact) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.id === updatedContact.id ? updatedContact : contact
      )
    );
    
    if (selectedContact && selectedContact.id === updatedContact.id) {
      setSelectedContact(updatedContact);
    }
  };

  // Export contacts as CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "" && key !== 'page' && key !== 'limit') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/api/contact/admin/contacts/export?${params}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contacts_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting contacts:", err);
      alert(t('contacts.exportError', "Failed to export contacts."));
    }
  };

  // Refresh contacts
  const handleRefresh = () => {
    fetchContacts(true);
  };

  // Load more contacts
  const loadMore = () => {
    if (!loading && hasMore) {
      handleFilterChange('page', filters.page + 1);
    }
  };

  // Fetch contacts when filters change
  useEffect(() => {
    fetchContacts(true);
  }, [
    filters.search,
    filters.status, 
    filters.priority, 
    filters.category, 
    filters.sortBy, 
    filters.sortOrder,
    filters.date_start,
    filters.date_end,
    filters.response_count,
    filters.source
  ]);

  // Also fetch when page changes (for load more)
  useEffect(() => {
    if (filters.page > 1) {
      fetchContacts(false);
    }
  }, [filters.page]);

  // Refresh total contacts every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/api/contact/admin/contacts/stats');
        if (response.data.success) {
          setTotalContacts(response.data.data.overview?.total || response.data.data.total || totalContacts);
        }
      } catch (err) {
        console.error("Error fetching total contacts:", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [totalContacts]);

  return (
    <div className="w-full">
      <ContactsHeader
        filters={filters}
        onFilterChange={handleFilterChange}
        totalContacts={totalContacts}
        filteredCount={contacts.length}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />

      <ContactsList
        contacts={contacts}
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMore}
        onContactClick={handleContactClick}
      />

      {/* Contact Modal */}
      {isContactModalOpen && selectedContact && (
        <ContactModal
          contact={selectedContact}
          onClose={handleCloseContactModal}
          onContactUpdated={handleContactUpdated}
        />
      )}
    </div>
  );
}