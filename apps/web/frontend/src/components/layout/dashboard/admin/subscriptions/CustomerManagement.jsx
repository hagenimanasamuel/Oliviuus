import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, RefreshCw, User, Mail, Calendar, DollarSign } from 'lucide-react';
import api from '../../../../../api/axios';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({});

  // Fetch customers from API
  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/admin/subscriptions/admin/customers', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : ''
        }
      });

      if (response.data.success) {
        setCustomers(response.data.data.customers);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [searchTerm, statusFilter]);

  const handleUpdateStatus = async (customerId, currentStatus) => {
    const newStatus = prompt('Enter new status (active, cancelled, past_due, expired, trialing):', currentStatus);
    
    if (!newStatus) return;

    const validStatuses = ['active', 'cancelled', 'past_due', 'expired', 'trialing'];
    if (!validStatuses.includes(newStatus.toLowerCase())) {
      alert('Invalid status. Please use: active, cancelled, past_due, expired, or trialing');
      return;
    }

    try {
      await api.put(`/admin/subscriptions/admin/customers/${customerId}/subscription`, {
        status: newStatus.toLowerCase()
      });
      
      fetchCustomers(pagination.current_page);
    } catch (error) {
      console.error('Error updating subscription status:', error);
      alert('Failed to update subscription status');
    }
  };

  const formatCurrency = (amount, currency = 'RWF') => {
    if (!amount && amount !== 0) return 'Free';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border border-green-200', label: 'Active' },
      past_due: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', label: 'Past Due' },
      cancelled: { color: 'bg-red-100 text-red-800 border border-red-200', label: 'Cancelled' },
      expired: { color: 'bg-gray-100 text-gray-800 border border-gray-200', label: 'Expired' },
      trialing: { color: 'bg-blue-100 text-blue-800 border border-blue-200', label: 'Trialing' }
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border border-gray-200', label: status };
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-[#BC8BBC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Subscriptions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage customer subscription status and details
          </p>
        </div>
        <div className="text-sm text-gray-500 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
          Total: <span className="font-semibold text-[#BC8BBC]">{pagination.total_customers || 0}</span> subscriptions
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by email or customer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all duration-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="trialing">Trialing</option>
        </select>
      </div>

      {/* Customers Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Mobile Cards View */}
        <div className="block sm:hidden">
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subscriptions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' ? 'No subscriptions found matching your criteria.' : 'No customer subscriptions found.'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {customers.map((customer) => (
                <div key={customer.user_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                        <User className="h-4 w-4 mr-2 text-[#BC8BBC]" />
                        {customer.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {customer.email}
                      </div>
                    </div>
                    {getStatusBadge(customer.subscription_status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {customer.subscription_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Price:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatCurrency(customer.subscription_price, customer.subscription_currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Renewal:</span>
                      <span className="text-gray-900 dark:text-white">
                        {customer.end_date ? formatDate(customer.end_date) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Customer ID:</span>
                      <span className="text-gray-900 dark:text-white font-mono text-xs">
                        {customer.user_id}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => handleUpdateStatus(customer.user_id, customer.subscription_status)}
                      className="flex items-center px-3 py-1.5 bg-[#BC8BBC] text-white rounded-lg text-sm font-medium hover:bg-[#9b69b2] transition-colors"
                      title="Update Status"
                    >
                      <Edit size={14} className="mr-1" />
                      Update Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Renewal Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {customers.map((customer) => (
                  <tr key={customer.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#BC8BBC] rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">ID: {customer.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.subscription_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {customer.plan_type}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(customer.subscription_status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(customer.subscription_price, customer.subscription_currency)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {customer.end_date ? formatDate(customer.end_date) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleUpdateStatus(customer.user_id, customer.subscription_status)}
                        className="inline-flex items-center px-3 py-1.5 bg-[#BC8BBC] text-white rounded-lg text-sm font-medium hover:bg-[#9b69b2] transition-colors"
                        title="Update Subscription Status"
                      >
                        <Edit size={14} className="mr-1" />
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length === 0 && !loading && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subscriptions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' ? 'No subscriptions found matching your criteria.' : 'No customer subscriptions found.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Showing page {pagination.current_page} of {pagination.total_pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchCustomers(pagination.current_page - 1)}
                  disabled={!pagination.has_prev}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchCustomers(pagination.current_page + 1)}
                  disabled={!pagination.has_next}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;