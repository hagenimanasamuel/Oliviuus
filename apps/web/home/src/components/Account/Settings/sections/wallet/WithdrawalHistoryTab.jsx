// src/components/Account/Settings/sections/WithdrawalHistoryTab.jsx
import React, { useState } from 'react';
import { 
  History, DollarSign, AlertCircle, Clock, 
  CheckCircle, XCircle, Loader2, Building, 
  Smartphone, CreditCard, Shield, User, 
  FileText, Download, X, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../../../../../../public/iSanzure_Homes_Logo(Text).png';

export default function WithdrawalHistoryTab({ 
  withdrawals, 
  loading, 
  onCancel, 
  formatCurrency, 
  formatDate,
  userName,
  userEmail,
  userPhone,
  showBalance,
  pendingWithdrawalsCount,
  pendingWithdrawalsAmount
}) {
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Filter withdrawals by status
  const filteredWithdrawals = selectedStatus === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === selectedStatus);

  // Get status counts
  const getStatusCount = (status) => {
    if (status === 'all') return withdrawals.length;
    return withdrawals.filter(w => w.status === status).length;
  };

  // Status tabs for filtering
  const statusTabs = [
    { status: 'all', label: 'All', color: 'gray' },
    { status: 'pending', label: 'Pending', color: 'yellow' },
    { status: 'processing', label: 'Processing', color: 'blue' },
    { status: 'completed', label: 'Completed', color: 'green' },
    { status: 'failed', label: 'Failed', color: 'red' },
    { status: 'rejected', label: 'Rejected', color: 'red' }
  ];

  const getMethodInfo = (method) => {
    switch(method) {
      case 'bk':
        return { 
          icon: <Building className="h-4 w-4" />, 
          name: 'Bank of Kigali',
          bg: 'bg-blue-100 text-blue-700',
          lightBg: 'bg-blue-50'
        };
      case 'equity':
        return { 
          icon: <Building className="h-4 w-4" />, 
          name: 'Equity Bank',
          bg: 'bg-purple-100 text-purple-700',
          lightBg: 'bg-purple-50'
        };
      case 'mtn':
        return { 
          icon: <Smartphone className="h-4 w-4" />, 
          name: 'MTN Mobile Money',
          bg: 'bg-yellow-100 text-yellow-700',
          lightBg: 'bg-yellow-50'
        };
      case 'airtel':
        return { 
          icon: <Smartphone className="h-4 w-4" />, 
          name: 'Airtel Money',
          bg: 'bg-red-100 text-red-700',
          lightBg: 'bg-red-50'
        };
      default:
        return { 
          icon: <CreditCard className="h-4 w-4" />, 
          name: method,
          bg: 'bg-gray-100 text-gray-700',
          lightBg: 'bg-gray-50'
        };
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={14} />, label: 'Pending' },
      'processing': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Loader2 size={14} />, label: 'Processing' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={14} />, label: 'Completed' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', icon: <X size={14} />, label: 'Failed' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertTriangle size={14} />, label: 'Rejected' }
    };
    return statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: null, label: status };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <History size={18} className="text-[#BC8BBC]" />
          Withdrawal History
        </h4>
      </div>
      
      <div className="p-4">
        {/* Pending Withdrawals Warning */}
        {pendingWithdrawalsCount > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  You have {pendingWithdrawalsCount} pending withdrawal request(s)
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Total amount: {showBalance
                    ? formatCurrency(pendingWithdrawalsAmount)
                    : 'RWF •••••'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        {withdrawals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
            {statusTabs.map(({ status, label }) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                  selectedStatus === status
                    ? 'text-[#BC8BBC] border-b-2 border-[#BC8BBC]'
                    : 'text-gray-600 hover:text-[#BC8BBC]'
                }`}
              >
                {label}
                {getStatusCount(status) > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedStatus === status ? 'bg-[#BC8BBC] text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {getStatusCount(status)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Withdrawals List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#BC8BBC]" size={24} />
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600">
              {withdrawals.length === 0 ? 'No withdrawals yet' : `No withdrawals with status "${selectedStatus}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWithdrawals.map((withdrawal) => (
              <WithdrawalCard
                key={withdrawal.uid}
                withdrawal={withdrawal}
                onCancel={onCancel}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                userName={userName}
                userEmail={userEmail}
                userPhone={userPhone}
                getMethodInfo={getMethodInfo}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WithdrawalCard({ 
  withdrawal, 
  onCancel, 
  formatCurrency, 
  formatDate,
  userName,
  userEmail,
  userPhone,
  getMethodInfo,
  getStatusBadge
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCancel = async (e) => {
    e.stopPropagation();
    setCancelling(true);
    try {
      await onCancel(withdrawal.uid);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = ['pending', 'processing'].includes(withdrawal.status);
  const methodInfo = getMethodInfo(withdrawal.method);
  const StatusBadge = getStatusBadge(withdrawal.status);
  const StatusIcon = StatusBadge.icon;
  
  const finalAmount = withdrawal.fee_amount 
    ? withdrawal.amount - withdrawal.fee_amount 
    : withdrawal.amount;

  // Get the actual user name - FIXED: use withdrawal.user?.full_name or fallback to props
  const displayName = withdrawal.user?.full_name || withdrawal.user_full_name || userName;

  // Generate PDF receipt - EXACTLY AS IT WAS, only changing the name
  const generatePDF = async (e) => {
    e.stopPropagation();
    setDownloading(true);

    try {
      const doc = new jsPDF();
      
      // Add autoTable plugin to the doc instance
      autoTable(doc, {});
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const currentDate = new Date();
      const formattedPrintDate = formatDate(currentDate.toISOString());

      // ===== HEADER WITH LOGO =====
      const logo = new Image();
      logo.src = logoImg;
      
      let logoHeight = 0;
      
      await new Promise((resolve) => {
        logo.onload = () => {
          // Logo at top left - REDUCED SIZE (smaller width and proportional height)
          const logoWidth = 35;
          logoHeight = (logo.height * logoWidth) / logo.width;
          doc.addImage(logo, 'PNG', margin, 15, logoWidth, logoHeight);
          resolve();
        };
        
        logo.onerror = () => {
          console.warn('Logo failed to load, continuing without logo');
          logoHeight = 15; // Default height if logo fails
          resolve();
        };
      });

      // Printed date at top right (above the line)
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Printed: ${formattedPrintDate}`, pageWidth - margin, 20, { align: 'right' });

      // Separator line - placed WELL BELOW logo (minimum 40px from top, or below logo + 10px padding)
      let yPos = Math.max(40, 15 + logoHeight + 10);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      
      yPos += 15;

      // ===== ACCOUNT HOLDER =====
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Account Holder:', margin, yPos);
      
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(displayName, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 8;

      // ===== PAYMENT METHOD =====
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Payment Method:', margin, yPos);
      
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(methodInfo.name, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 8;

      // ===== ACCOUNT TYPE =====
      const accountType = (withdrawal.method === 'bk' || withdrawal.method === 'equity') 
        ? 'Bank Account' 
        : 'Mobile Money Wallet';
      
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Account Type:', margin, yPos);
      
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(accountType, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 8;

      // Separator line
      yPos += 5;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // ===== WITHDRAWAL AMOUNT =====
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Withdrawal amount:', margin, yPos);
      
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`RWF ${withdrawal.amount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 8;

      // ===== FEE =====
      if (withdrawal.fee_amount > 0) {
        doc.setFont('times', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Fee:', margin, yPos);
        
        doc.setFont('times', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`- RWF ${withdrawal.fee_amount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
        
        yPos += 8;
        
        // Light separator line
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
        
        yPos += 5;
        
        // ===== FINAL AMOUNT =====
        doc.setFont('times', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Final amount:', margin, yPos);
        
        doc.setFont('times', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`RWF ${finalAmount.toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });
        
        yPos += 8;
      }

      // Separator line
      yPos += 2;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // ===== DESCRIPTION =====
      if (withdrawal.notes) {
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Description:', margin, yPos);
        
        doc.setFont('times', 'normal');
        doc.setTextColor(0, 0, 0);
        const splitNotes = doc.splitTextToSize(withdrawal.notes, pageWidth - margin - 70);
        doc.text(splitNotes, pageWidth - margin, yPos, { align: 'right' });
        
        yPos += 8 + ((splitNotes.length - 1) * 5);
        
        // Separator line
        yPos += 2;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
      }

      // ===== REFERENCE =====
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Reference:', margin, yPos);
      
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      const fullRef = withdrawal.uid || 'N/A';
      doc.text(fullRef, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 8;

      // ===== REQUESTED DATE =====
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Requested:', margin, yPos);
      
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(formatDate(withdrawal.requested_at), pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 8;

      // ===== PROCESSED DATE =====
      if (withdrawal.processed_at) {
        doc.setFont('times', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Processed:', margin, yPos);
        
        doc.setFont('times', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(formatDate(withdrawal.processed_at), pageWidth - margin, yPos, { align: 'right' });
        
        yPos += 8;
      }

      // Separator line before status
      yPos += 2;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // ===== STATUS =====
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Status:', margin, yPos);
      
      // Status value with soft background color - PROPERLY FITTED
      const statusText = withdrawal.status.toUpperCase();
      
      // Calculate proper width for the background
      doc.setFont('times', 'normal'); // Ensure font is set before measuring
      const statusTextWidth = doc.getTextWidth(statusText);
      const paddingX = 4; // Horizontal padding
      const paddingY = 2.5; // Vertical padding
      const bgWidth = statusTextWidth + (paddingX * 2);
      const bgHeight = 7;
      
      // Position background from the right edge
      const statusX = pageWidth - margin - statusTextWidth;
      const bgX = statusX - paddingX;
      const bgY = yPos - 5;
      
      // Brand colors for status backgrounds
      const statusColors = {
        'pending': [248, 243, 248],    // Light purple (brand color)
        'processing': [248, 243, 248], // Light purple (brand color)
        'completed': [248, 243, 248],  // Light purple (brand color)
        'failed': [248, 243, 248],     // Light purple (brand color)
        'rejected': [248, 243, 248]    // Light purple (brand color)
      };
      const bgColor = statusColors[withdrawal.status] || [248, 243, 248];
      
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.roundedRect(bgX, bgY, bgWidth, bgHeight, 1.5, 1.5, 'F');
      
      doc.setFont('times', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(statusText, pageWidth - margin, yPos, { align: 'right' });

      yPos += 15;

      // ===== FOOTER =====
      const footerY = Math.max(yPos + 10, pageHeight - 30);
      
      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      // Legal text
      doc.setFontSize(8);
      doc.setFont('times', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text(
        'This is a computer-generated receipt by iSanzure. No signature required.',
        pageWidth / 2,
        footerY + 8,
        { align: 'center' }
      );

      // Contact info
      doc.setFontSize(8);
      doc.setFont('times', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        '+250 788 880 266  •  contact@isanzure.com  •  www.isanzure.com',
        pageWidth / 2,
        footerY + 15,
        { align: 'center' }
      );

      // Save PDF with correct filename format: iSanzure-referencenumber
      const referenceNumber = withdrawal.uid || 'receipt';
      const filename = `iSanzure-${referenceNumber}.pdf`;
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#BC8BBC] transition-all hover:shadow-md">
      {/* Main row - clickable */}
      <div
        className="p-4 cursor-pointer bg-white"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Left side - Icon and amount */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${methodInfo.lightBg} flex items-center justify-center`}>
              <div className={`p-2 rounded-full ${methodInfo.bg}`}>
                {methodInfo.icon}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-lg">
                  {formatCurrency(withdrawal.amount)}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {methodInfo.name}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">
                  {formatDate(withdrawal.requested_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Status and expand */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${StatusBadge.bg} ${StatusBadge.text}`}>
              {StatusIcon}
              {StatusBadge.label}
            </span>
            {showDetails ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="space-y-4">
            
            {/* Method and Account Holder - with REAL user name */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-[#BC8BBC]" />
                Withdrawal Information
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`p-1.5 rounded-full ${methodInfo.bg}`}>
                      {methodInfo.icon}
                    </span>
                    <span className="font-medium text-gray-900">
                      {methodInfo.name}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Account Holder</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {displayName}
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Account Type</p>
                  <p className="font-medium text-gray-900">
                    {(withdrawal.method === 'bk' || withdrawal.method === 'equity') 
                      ? 'Bank Account' 
                      : 'Mobile Money Wallet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Amount Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Withdrawal amount</span>
                  <span className="font-medium text-gray-900">{formatCurrency(withdrawal.amount)}</span>
                </div>
                {withdrawal.fee_amount > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fee (5%)</span>
                      <span className="font-medium text-red-600">-{formatCurrency(withdrawal.fee_amount)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Final amount</span>
                        <span className="font-bold text-green-600 text-lg">{formatCurrency(finalAmount)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {withdrawal.notes && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Description
                </p>
                <p className="text-sm text-gray-700">{withdrawal.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Download Button */}
              <button
                onClick={generatePDF}
                disabled={downloading}
                className="flex-1 py-3 border border-[#BC8BBC] text-[#BC8BBC] rounded-xl hover:bg-[#f4eaf4] transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download Receipt
                  </>
                )}
              </button>

              {/* Cancel Button - Only if can cancel */}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      Cancel Request
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}