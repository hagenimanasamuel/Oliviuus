import React from "react";
import SupportNavTabs from "../../../../components/layout/dashboard/admin/support/SupportNavTabs";
import { useTranslation } from "react-i18next";

export default function Support() {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-6">
          {t('contact.title')}
        </h1>
        <SupportNavTabs />
      </div>
    </div>
  );
}