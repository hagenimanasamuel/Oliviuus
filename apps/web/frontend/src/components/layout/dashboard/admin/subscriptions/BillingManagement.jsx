import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertTriangle, CheckCircle, XCircle, DollarSign, FileText } from 'lucide-react';
import api from '../../../../../api/axios';

const BillingManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch billing stats
  const fetchBillingStats = async () => {
    try {
      const response = await api.get('/admin/subscriptions/admin/billing/stats');
      
      if (response.data.success) {
        setStats({
          totalRevenue: response.data.data.total_revenue || 0,
          totalInvoices: response.data.data.total_invoices || 0,
          paidInvoices: response.data.data.paid_invoices || 0,
          pendingInvoices: response.data.data.pending_invoices || 0
        });
      }
    } catch (error) {
      console.error('Error fetching billing stats:', error);
    }
  };

  // Fetch all invoices
  const fetchInvoices = async () => {
    try {
      const response = await api.get('/admin/subscriptions/admin/billing/invoices', {
        params: { 
          search: searchTerm, 
          limit: 100 
        }
      });
      if (response.data.success) {
        setInvoices(response.data.data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const formatCurrency = (amount, currency = 'RWF') => {
    if (!amount && amount !== 0) return 'RWF 0';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800 border border-green-200', icon: CheckCircle, label: 'Paid' },
      completed: { color: 'bg-green-100 text-green-800 border border-green-200', icon: CheckCircle, label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: AlertTriangle, label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800 border border-red-200', icon: XCircle, label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800 border border-gray-200', icon: XCircle, label: 'Refunded' },
      cancelled: { color: 'bg-red-100 text-red-800 border border-red-200', icon: XCircle, label: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={12} className="mr-1" />
        {config.label}
      </span>
    );
  };

  // Load data on component mount and when search term changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchBillingStats(),
        fetchInvoices()
      ]);
      setLoading(false);
    };

    loadData();
  }, [searchTerm]);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Billing & Invoices</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and monitor all subscription payments and invoices
          </p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 w-full sm:w-auto text-center sm:text-left">
          Total: <span className="font-semibold text-[#BC8BBC]">{stats.totalInvoices}</span> invoices
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                From completed payments
              </p>
            </div>
          </div>
        </div>

        {/* Total Invoices Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalInvoices}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All payment transactions
              </p>
            </div>
          </div>
        </div>

        {/* Paid Invoices Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Paid Invoices</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {stats.paidInvoices}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Successfully processed
              </p>
            </div>
          </div>
        </div>

        {/* Pending Invoices Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Pending Invoices</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                {stats.pendingInvoices}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Awaiting payment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Lookup Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with Search */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Invoice Lookup</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Search and filter through all invoices
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              </div>
              <input
                type="text"
                placeholder="Search by email or invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <RefreshCw className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-[#BC8BBC]" />
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden">
                {invoices.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No invoices</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
                      {searchTerm ? 'No invoices found matching your search.' : 'No invoices found in the system.'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                              {invoice.invoice_id || `TX-${invoice.id}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">
                              {invoice.transaction_type}
                            </div>
                          </div>
                          <div className="ml-2">
                            {getStatusBadge(invoice.status)}
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Customer:</span>
                            <span className="text-gray-900 dark:text-white font-medium text-right max-w-[120px] sm:max-w-none truncate">
                              {invoice.customer_email}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Date:</span>
                            <span className="text-gray-900 dark:text-white text-right max-w-[140px] sm:max-w-none">
                              {formatDate(invoice.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tablet and Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {invoice.invoice_id || `TX-${invoice.id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">
                            {invoice.transaction_type}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {invoice.customer_email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ID: {invoice.customer_id}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-900 dark:text-white">
                          {formatDate(invoice.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {invoices.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No invoices</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No invoices found matching your search.' : 'No invoices found in the system.'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingManagement;