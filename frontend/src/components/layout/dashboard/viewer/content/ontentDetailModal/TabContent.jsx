// src/pages/Dashboards/viewer/content/components/TabContent/TabContent.jsx
import React from 'react';
import OverviewTab from './TabContent/OverviewTab';
import CastTab from './TabContent/CastTab';
import DetailsTab from './TabContent/DetailsTab';
import MediaTab from './TabContent/MediaTab';
import SeasonsTab from './TabContent/SeasonsTab';
import AwardsTab from './TabContent/AwardsTab';
import SimilarTab from './TabContent/SimilarTab';

const TabContent = ({ activeTab, contentData, similarContent }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab contentData={contentData} />;
      case 'cast':
        return <CastTab contentData={contentData} />;
      case 'details':
        return <DetailsTab contentData={contentData} />;
      case 'media':
        return <MediaTab contentData={contentData} />;
      case 'seasons':
        return <SeasonsTab contentData={contentData} />;
      case 'awards':
        return <AwardsTab contentData={contentData} />;
      case 'similar':
        return <SimilarTab similarContent={similarContent} />;
      default:
        return <OverviewTab contentData={contentData} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderTabContent()}
    </div>
  );
};

export default TabContent;