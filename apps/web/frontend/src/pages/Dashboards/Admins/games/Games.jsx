import React from "react";
import { useTranslation } from "react-i18next";
import GamesNavTabs from "../../../../components/layout/dashboard/admin/games/GamesNavTabs";

export default function Games() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("games.pageTitle")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("games.pageDescription")}
          </p>
        </div>
        <GamesNavTabs />
      </div>
    </div>
  );
}