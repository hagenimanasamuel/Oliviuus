import React, { useState } from 'react';

const AnalyticsExport = ({ onExport, exporting }) => {
  const [exportType, setExportType] = useState('comprehensive');
  const [exportFormat, setExportFormat] = useState('csv');

  const exportOptions = [
    { 
      value: 'comprehensive', 
      label: 'Comprehensive Report', 
      description: 'Complete analytics dataset with all metrics',
      icon: '📊',
      fileSize: '~2.3 MB'
    },
    { 
      value: 'users', 
      label: 'User Analytics', 
      description: 'User growth, engagement, and demographic data',
      icon: '👥',
      fileSize: '~1.1 MB'
    },
    { 
      value: 'revenue', 
      label: 'Revenue Data', 
      description: 'Transaction history and subscription metrics',
      icon: '💰',
      fileSize: '~0.8 MB'
    },
    { 
      value: 'content', 
      label: 'Content Performance', 
      description: 'Content views, ratings, and engagement metrics',
      icon: '🎬',
      fileSize: '~1.5 MB'
    },
    { 
      value: 'engagement', 
      label: 'Engagement Metrics', 
      description: 'User behavior and platform usage patterns',
      icon: '📈',
      fileSize: '~0.9 MB'
    }
  ];

  const formatOptions = [
    { value: 'csv', label: 'CSV Format', description: 'Spreadsheet compatible', icon: '📋' },
    { value: 'json', label: 'JSON Format', description: 'Developer friendly', icon: '🔧' }
  ];

  const selectedOption = exportOptions.find(opt => opt.value === exportType);
  const selectedFormat = formatOptions.find(opt => opt.value === exportFormat);

  const handleExport = () => {
    onExport(exportFormat, exportType);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export Analytics Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Download detailed reports for analysis and reporting
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Data Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Select Data Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exportOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setExportType(option.value)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  exportType === option.value
                    ? 'border-[#BC8BBC] bg-[#BC8BBC]/5 dark:bg-[#BC8BBC]/10 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{option.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.fileSize}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    exportType === option.value
                      ? 'bg-[#BC8BBC] border-[#BC8BBC]'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}></div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {option.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formatOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => setExportFormat(option.value)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  exportFormat === option.value
                    ? 'border-[#BC8BBC] bg-[#BC8BBC]/5 dark:bg-[#BC8BBC]/10'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl">{option.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    exportFormat === option.value
                      ? 'bg-[#BC8BBC] border-[#BC8BBC]'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {exportFormat === option.value && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Preview */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Export Preview
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedOption?.fileSize}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedOption?.label} • {selectedFormat?.label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Includes all relevant metrics and timestamps for the selected period
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#a573a5] hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BC8BBC] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {exporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Preparing Download...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download {selectedOption?.label}
            </>
          )}
        </button>

        {/* Export Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Export Tips
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                <li>• CSV files are compatible with Excel, Google Sheets, and data analysis tools</li>
                <li>• JSON format is ideal for developers and custom applications</li>
                <li>• Exports include data for the currently selected date range and filters</li>
                <li>• Large exports may take a few moments to process</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsExport;