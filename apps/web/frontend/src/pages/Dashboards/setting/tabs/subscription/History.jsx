import React, { useState, useEffect, useRef } from "react";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  FileText,
  Calendar,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Printer,
  Copy,
  Shield,
  Users,
  Crown,
  Zap,
  MoreHorizontal
} from "lucide-react";

export default function History({ subscription, t }) {
  const { t: translate } = useTranslation();
  const tFunc = t || translate;
  
  const [activeTab, setActiveTab] = useState('billing'); // 'billing' or 'subscription'
  const [billingHistory, setBillingHistory] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Responsive tabs state
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);
  const [showMore, setShowMore] = useState(false);

  const containerRef = useRef(null);
  const moreButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  // History sub-tabs
  const historySubTabs = [
    { id: 'billing', label: tFunc('history.tabs.billing'), icon: CreditCard, count: billingHistory.length },
    { id: 'subscription', label: tFunc('history.tabs.subscription'), icon: Users, count: subscriptionHistory.length }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    // Update tab counts when data changes
    const updatedTabs = historySubTabs.map(tab => ({
      ...tab,
      count: tab.id === 'billing' ? billingHistory.length : subscriptionHistory.length
    }));
  }, [billingHistory.length, subscriptionHistory.length]);

  // Handle responsive overflow for tabs
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      let usedWidth = 0;
      const newVisible = [];
      const newOverflow = [];

      // Reset to measure all buttons
      historySubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab.id}"]`);
        if (!btn) return;
        btn.style.display = "block";
      });

      // Calculate visible tabs with space for "More" button
      historySubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab.id}"]`);
        if (!btn) return;
        const btnWidth = btn.offsetWidth + 8; // spacing
        if (usedWidth + btnWidth < containerWidth - 80) {
          newVisible.push(tab);
          usedWidth += btnWidth;
        } else {
          newOverflow.push(tab);
        }
      });

      // Hide overflowed tabs
      historySubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab.id}"]`);
        if (!btn) return;
        const isVisible = newVisible.find(t => t.id === tab.id);
        btn.style.display = isVisible ? "block" : "none";
      });

      setVisibleTabs(newVisible);
      setOverflowTabs(newOverflow);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [historySubTabs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMore &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMore(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMore]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'billing') {
        const response = await api.get('/user-subscriptions/billing-history');
        if (response.data.success) {
          setBillingHistory(response.data.data);
        }
      } else {
        const response = await api.get('/user-subscriptions/history');
        if (response.data.success) {
          setSubscriptionHistory(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleViewSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setShowSubscriptionModal(true);
  };

  const handleCloseModal = () => {
    setShowInvoiceModal(false);
    setShowSubscriptionModal(false);
    setSelectedInvoice(null);
    setSelectedSubscription(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const statusConfigs = {
      active: { 
        icon: CheckCircle, 
        text: tFunc('history.status.active'),
        badgeColor: 'text-green-400 bg-green-500/20 border-green-500/30'
      },
      cancelled: { 
        icon: XCircle, 
        text: tFunc('history.status.cancelled'),
        badgeColor: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      },
      expired: { 
        icon: Clock, 
        text: tFunc('history.status.expired'),
        badgeColor: 'text-red-400 bg-red-500/20 border-red-500/30'
      },
      completed: { 
        icon: CheckCircle, 
        text: tFunc('history.status.completed'),
        badgeColor: 'text-green-400 bg-green-500/20 border-green-500/30'
      },
      failed: { 
        icon: XCircle, 
        text: tFunc('history.status.failed'),
        badgeColor: 'text-red-400 bg-red-500/20 border-red-500/30'
      },
      pending: { 
        icon: Clock, 
        text: tFunc('history.status.pending'),
        badgeColor: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      },
      refunded: { 
        icon: RefreshCw, 
        text: tFunc('history.status.refunded'),
        badgeColor: 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      }
    };

    return statusConfigs[status] || statusConfigs.pending;
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.badgeColor}`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'family': return <Users className="w-4 h-4 text-purple-400" />;
      case 'standard': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'basic': return <Zap className="w-4 h-4 text-blue-400" />;
      case 'mobile': return <CreditCard className="w-4 h-4 text-green-400" />;
      default: return <Crown className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionType = (type) => {
    const types = {
      subscription: tFunc('history.transactionTypes.subscription'),
      one_time: tFunc('history.transactionTypes.one_time'),
      refund: tFunc('history.transactionTypes.refund')
    };
    return types[type] || type;
  };

  const renderBillingHistory = () => {
    if (billingHistory.length === 0) {
      return (
        <div className="text-center py-16 bg-gray-800 rounded-2xl border border-gray-700">
          <FileText className="w-20 h-20 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {tFunc('history.noBillingHistory')}
          </h3>
          <p className="text-gray-400 mb-6">
            {tFunc('history.noBillingDescription')}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-750">
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.dateTime')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.description')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.type')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.amount')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.status')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {billingHistory.map((invoice) => (
                <tr 
                  key={invoice.id} 
                  className="hover:bg-gray-750/50 transition-colors cursor-pointer"
                  onClick={() => handleViewInvoice(invoice)}
                >
                  <td className="p-6">
                    <div className="text-white font-medium">{formatDate(invoice.created_at)}</div>
                    <div className="text-gray-400 text-sm">
                      {new Date(invoice.created_at).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-white font-medium">{invoice.description}</div>
                    {invoice.invoice_id && (
                      <div className="text-gray-400 text-sm">
                        {tFunc('history.invoiceNumber', { id: invoice.invoice_id })}
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    <span className="text-gray-300 capitalize">
                      {getTransactionType(invoice.transaction_type)}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className={`text-lg font-semibold ${
                      invoice.transaction_type === 'refund' ? 'text-red-400' : 'text-white'
                    }`}>
                      {invoice.transaction_type === 'refund' ? '-' : ''}{formatCurrency(invoice.amount)}
                    </div>
                  </td>
                  <td className="p-6">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewInvoice(invoice);
                      }}
                      className="flex items-center gap-2 text-[#BC8BBC] hover:text-[#9b69b2] transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      {tFunc('history.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-700">
          {billingHistory.map((invoice) => (
            <div 
              key={invoice.id}
              className="p-6 hover:bg-gray-750/30 transition-colors cursor-pointer"
              onClick={() => handleViewInvoice(invoice)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold text-lg">{invoice.description}</h4>
                  <p className="text-gray-400 text-sm">{formatDateTime(invoice.created_at)}</p>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">{tFunc('history.table.amount')}</p>
                  <p className={`text-lg font-semibold ${
                    invoice.transaction_type === 'refund' ? 'text-red-400' : 'text-white'
                  }`}>
                    {invoice.transaction_type === 'refund' ? '-' : ''}{formatCurrency(invoice.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{tFunc('history.table.type')}</p>
                  <p className="text-white font-medium capitalize">
                    {getTransactionType(invoice.transaction_type)}
                  </p>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewInvoice(invoice);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                {tFunc('history.viewDetails')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSubscriptionHistory = () => {
    if (subscriptionHistory.length === 0) {
      return (
        <div className="text-center py-16 bg-gray-800 rounded-2xl border border-gray-700">
          <Users className="w-20 h-20 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {tFunc('history.noSubscriptionHistory')}
          </h3>
          <p className="text-gray-400 mb-6">
            {tFunc('history.noSubscriptionDescription')}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-750">
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.plan')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.period')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.amount')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.status')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.autoRenew')}
                </th>
                <th className="text-left p-6 text-gray-400 font-semibold text-sm uppercase tracking-wider">
                  {tFunc('history.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {subscriptionHistory.map((sub) => (
                <tr 
                  key={sub.id} 
                  className="hover:bg-gray-750/50 transition-colors cursor-pointer"
                  onClick={() => handleViewSubscription(sub)}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      {getPlanIcon(sub.plan_type)}
                      <div>
                        <div className="text-white font-medium">{sub.subscription_name}</div>
                        <div className="text-gray-400 text-sm capitalize">{sub.plan_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-white font-medium">
                      {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {tFunc('history.daysCount', { 
                        days: Math.ceil((new Date(sub.end_date) - new Date(sub.start_date)) / (1000 * 60 * 60 * 24))
                      })}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(sub.subscription_price)}
                    </div>
                    <div className="text-gray-400 text-sm">{sub.subscription_currency}</div>
                  </td>
                  <td className="p-6">
                    {getStatusBadge(sub.status)}
                  </td>
                  <td className="p-6">
                    <span className={`font-medium ${sub.auto_renew ? 'text-green-400' : 'text-yellow-400'}`}>
                      {sub.auto_renew ? tFunc('common.yes') : tFunc('common.no')}
                    </span>
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSubscription(sub);
                      }}
                      className="flex items-center gap-2 text-[#BC8BBC] hover:text-[#9b69b2] transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      {tFunc('history.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-700">
          {subscriptionHistory.map((sub) => (
            <div 
              key={sub.id}
              className="p-6 hover:bg-gray-750/30 transition-colors cursor-pointer"
              onClick={() => handleViewSubscription(sub)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getPlanIcon(sub.plan_type)}
                  <div>
                    <h4 className="text-white font-semibold text-lg">{sub.subscription_name}</h4>
                    <p className="text-gray-400 text-sm capitalize">{sub.plan_type}</p>
                  </div>
                </div>
                {getStatusBadge(sub.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">{tFunc('history.table.amount')}</p>
                  <p className="text-lg font-semibold text-white">
                    {formatCurrency(sub.subscription_price)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{tFunc('history.table.autoRenew')}</p>
                  <p className={`font-medium ${sub.auto_renew ? 'text-green-400' : 'text-yellow-400'}`}>
                    {sub.auto_renew ? tFunc('common.yes') : tFunc('common.no')}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-sm">{tFunc('history.table.period')}</p>
                <p className="text-white text-sm">
                  {formatDate(sub.start_date)} {tFunc('history.to')} {formatDate(sub.end_date)}
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewSubscription(sub);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                {tFunc('history.viewDetails')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            {tFunc('history.loadingHistory')}
          </h3>
          <p className="text-gray-400">{tFunc('history.fetchingRecords')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{tFunc('history.title')}</h3>
          <p className="text-gray-400 mt-1">
            {tFunc('history.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? tFunc('history.refreshing') : tFunc('history.refresh')}
          </button>
        </div>
      </div>

      {/* Responsive Sub Tabs */}
      <div className="flex items-center relative border-b border-gray-700" ref={containerRef}>
        {historySubTabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? "border-b-2 border-[#BC8BBC] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
              {tab.id === 'billing' ? billingHistory.length : subscriptionHistory.length}
            </span>
          </button>
        ))}

        {/* Overflow "More" button */}
        {overflowTabs.length > 0 && (
          <div className="ml-auto relative" ref={moreButtonRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 rounded-full hover:bg-gray-800 transition flex items-center gap-1"
            >
              <MoreHorizontal size={20} />
              {tFunc('subscription.more')}
            </button>
            {showMore && (
              <div
                className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-30"
                ref={dropdownRef}
              >
                {overflowTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMore(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition ${
                      activeTab === tab.id
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full ml-auto">
                      {tab.id === 'billing' ? billingHistory.length : subscriptionHistory.length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'billing' ? renderBillingHistory() : renderSubscriptionHistory()}

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal 
          invoice={selectedInvoice} 
          onClose={handleCloseModal}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
          getStatusBadge={getStatusBadge}
          getTransactionType={getTransactionType}
          t={tFunc}
        />
      )}

      {/* Subscription Detail Modal */}
      {showSubscriptionModal && selectedSubscription && (
        <SubscriptionModal 
          subscription={selectedSubscription} 
          onClose={handleCloseModal}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
          getPlanIcon={getPlanIcon}
          t={tFunc}
        />
      )}
    </div>
  );
}

// Invoice Modal Component
const InvoiceModal = ({ invoice, onClose, formatCurrency, formatDate, formatDateTime, getStatusBadge, getTransactionType, t }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#BC8BBC]" />
          <div>
            <h3 className="text-xl font-bold text-white">{t('history.invoiceDetails.title')}</h3>
            <p className="text-gray-400 text-sm">
              {invoice.invoice_id ? t('history.invoiceDetails.invoiceNumber', { id: invoice.invoice_id }) : t('history.invoiceDetails.paymentDetails')}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-gray-750 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-white text-lg">{invoice.description}</p>
              <p className="text-gray-400 text-sm">{formatDateTime(invoice.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {invoice.transaction_type === 'refund' ? '-' : ''}{formatCurrency(invoice.amount)}
              </p>
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">{t('history.invoiceDetails.transactionInfo')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.table.type')}</span>
                <span className="text-white font-medium">{getTransactionType(invoice.transaction_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.table.date')}</span>
                <span className="text-white font-medium">{formatDateTime(invoice.created_at)}</span>
              </div>
              {invoice.provider && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('history.invoiceDetails.provider')}</span>
                  <span className="text-white font-medium capitalize">{invoice.provider}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">{t('history.invoiceDetails.amountDetails')}</h4>
            <div className="space-y-3 bg-gray-750 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.table.amount')}</span>
                <span className="text-white font-medium">{formatCurrency(invoice.amount)}</span>
              </div>
              {invoice.fee_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('history.invoiceDetails.fee')}</span>
                  <span className="text-white font-medium">{formatCurrency(invoice.fee_amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-6 border-t border-gray-700">
        <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-semibold">
          {t('common.close')}
        </button>
      </div>
    </div>
  </div>
);

// Subscription Modal Component
const SubscriptionModal = ({ subscription, onClose, formatCurrency, formatDate, getStatusBadge, getPlanIcon, t }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 rounded-t-2xl">
        <div className="flex items-center gap-3">
          {getPlanIcon(subscription.plan_type)}
          <div>
            <h3 className="text-xl font-bold text-white">{subscription.subscription_name}</h3>
            <p className="text-gray-400 text-sm capitalize">{subscription.plan_type} {t('history.subscriptionModal.plan')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">{t('history.subscriptionModal.details')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.table.status')}</span>
                {getStatusBadge(subscription.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.subscriptionModal.startDate')}</span>
                <span className="text-white font-medium">{formatDate(subscription.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.subscriptionModal.endDate')}</span>
                <span className="text-white font-medium">{formatDate(subscription.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.table.autoRenew')}</span>
                <span className={`font-medium ${subscription.auto_renew ? 'text-green-400' : 'text-yellow-400'}`}>
                  {subscription.auto_renew ? t('history.subscriptionModal.enabled') : t('history.subscriptionModal.disabled')}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">{t('history.subscriptionModal.billingInfo')}</h4>
            <div className="space-y-3 bg-gray-750 rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.table.amount')}</span>
                <span className="text-white font-medium">{formatCurrency(subscription.subscription_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.subscriptionModal.currency')}</span>
                <span className="text-white font-medium">{subscription.subscription_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('history.subscriptionModal.billingCycle')}</span>
                <span className="text-white font-medium">{t('history.subscriptionModal.monthly')}</span>
              </div>
            </div>
          </div>
        </div>

        {subscription.cancelled_at && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">{t('history.subscriptionModal.cancelled')}</span>
            </div>
            <p className="text-yellow-300 text-sm mt-1">
              {t('history.subscriptionModal.cancelledOn', { date: formatDate(subscription.cancelled_at) })}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 p-6 border-t border-gray-700">
        <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-semibold">
          {t('common.close')}
        </button>
      </div>
    </div>
  </div>
);