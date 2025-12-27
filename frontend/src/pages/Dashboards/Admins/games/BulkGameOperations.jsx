import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Filter,
  ChevronDown,
  AlertTriangle,
  Users,
} from "lucide-react";

export default function BulkGameOperations() {
  const { t } = useTranslation();
  const [selectedOperation, setSelectedOperation] = useState("activate");
  const [file, setFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [processing, setProcessing] = useState(false);

  const operations = [
    {
      id: "activate",
      title: t("bulkOperations.activate.title"),
      description: t("bulkOperations.activate.description"),
      icon: CheckCircle,
      color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
    },
    {
      id: "deactivate",
      title: t("bulkOperations.deactivate.title"),
      description: t("bulkOperations.deactivate.description"),
      icon: XCircle,
      color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
    },
    {
      id: "feature",
      title: t("bulkOperations.feature.title"),
      description: t("bulkOperations.feature.description"),
      icon: Star,
      color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
    },
    {
      id: "delete",
      title: t("bulkOperations.delete.title"),
      description: t("bulkOperations.delete.description"),
      icon: Trash2,
      color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
    },
  ];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      if (
        uploadedFile.type === "text/csv" ||
        uploadedFile.name.endsWith(".csv")
      ) {
        setFile(uploadedFile);
        // Simulate processing
        simulateImport(uploadedFile);
      } else {
        alert(t("bulkOperations.errors.invalidFileType"));
      }
    }
  };

  const simulateImport = (uploadedFile) => {
    setProcessing(true);
    setImportResults(null);

    // Simulate API call delay
    setTimeout(() => {
      const results = {
        total: 50,
        success: 45,
        failed: 5,
        errors: [
          { row: 3, error: "Invalid game key" },
          { row: 12, error: "Duplicate entry" },
          { row: 25, error: "Missing required field" },
          { row: 38, error: "Invalid category" },
          { row: 42, error: "Game not found" },
        ],
      };
      setImportResults(results);
      setProcessing(false);
    }, 2000);
  };

  const handleDownloadTemplate = () => {
    const template = `game_key,title,description,category,age_minimum,age_maximum,icon_emoji,color_gradient,is_active,is_featured,sort_order\nmemory_match,Memory Match,Match pairs of cards,puzzle,3,8,🧠,from-[#BC8BBC] to-purple-600,true,false,1\nmath_adventure,Math Adventure,Learn math through adventure,math,6,12,➕,from-blue-400 to-purple-500,true,true,2`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "games_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleBulkAction = () => {
    if (!selectedOperation) {
      alert(t("bulkOperations.errors.selectOperation"));
      return;
    }

    if (window.confirm(t("bulkOperations.confirmAction"))) {
      // Implement bulk action logic here
      console.log("Performing bulk action:", selectedOperation);
      alert(t("bulkOperations.actionSuccess"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("bulkOperations.title")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t("bulkOperations.description")}
        </p>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {operations.map((op) => {
          const Icon = op.icon;
          return (
            <button
              key={op.id}
              onClick={() => setSelectedOperation(op.id)}
              className={`p-6 rounded-xl border-2 transition-all ${
                selectedOperation === op.id
                  ? "border-[#BC8BBC] bg-[#BC8BBC]/5 dark:bg-[#BC8BBC]/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${op.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {op.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                {op.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Bulk Import Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("bulkOperations.import.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("bulkOperations.import.description")}
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
          >
            <Download className="w-4 h-4" />
            {t("bulkOperations.import.downloadTemplate")}
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <div className="max-w-md mx-auto">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t("bulkOperations.import.dropText")}
            </p>
            <input
              type="file"
              id="file-upload"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium hover:from-[#9b69b2] hover:to-purple-500 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {t("bulkOperations.import.chooseFile")}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              {t("bulkOperations.import.fileTypes")}
            </p>
          </div>
        </div>

        {file && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {processing && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-[#BC8BBC] border-t-transparent rounded-full animate-spin"></div>
                  {t("bulkOperations.import.processing")}
                </div>
              </div>
            )}
          </div>
        )}

        {importResults && (
          <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t("bulkOperations.import.results")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {importResults.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("bulkOperations.import.total")}
                </div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {importResults.success}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("bulkOperations.import.successful")}
                </div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {importResults.failed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("bulkOperations.import.failed")}
                </div>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  {t("bulkOperations.import.errors")}
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {importResults.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="text-sm text-red-700 dark:text-red-400">
                        <span className="font-medium">Row {error.row}:</span>{" "}
                        {error.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Bulk Action */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-gradient-to-br from-[#BC8BBC] to-purple-600">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("bulkOperations.manual.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("bulkOperations.manual.description")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("bulkOperations.manual.selectGames")}
            </label>
            <div className="relative">
              <select className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition appearance-none">
                <option value="">{t("bulkOperations.manual.selectGamesPlaceholder")}</option>
                <option value="all">All Games</option>
                <option value="active">Active Games</option>
                <option value="inactive">Inactive Games</option>
                <option value="category">By Category</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("bulkOperations.manual.action")}
            </label>
            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition"
            >
              {operations.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.title}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <button
              onClick={handleBulkAction}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white font-medium hover:from-[#9b69b2] hover:to-purple-500 transition"
            >
              {t("bulkOperations.manual.execute")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}