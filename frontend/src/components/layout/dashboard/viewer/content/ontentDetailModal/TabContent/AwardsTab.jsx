// src/pages/Dashboards/viewer/content/components/TabContent/AwardsTab.jsx
import React from 'react';
import { Award } from 'lucide-react';

const AwardsTab = ({ contentData }) => {
  const getAwards = () => {
    return contentData?.awards || [];
  };

  const awards = getAwards();
  if (awards.length === 0) return null;

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Award className="w-5 h-5" />
        Awards & Nominations
      </h3>
      <div className="grid gap-4">
        {awards.map((award, index) => (
          <div key={index} className={`p-4 rounded-xl border ${
            award.result === 'won' 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold">{award.award_name}</h4>
                <p className="text-gray-300 text-sm">
                  {award.category} • {award.award_year}
                </p>
                {award.person_name && (
                  <p className="text-gray-400 text-sm mt-1">
                    {award.person_display_name || award.person_name}
                  </p>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                award.result === 'won' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {award.result === 'won' ? 'Winner' : 'Nominee'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AwardsTab;