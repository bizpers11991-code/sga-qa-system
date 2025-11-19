import React from 'react';
import { Check } from 'lucide-react';

export interface TabConfig {
  id: string;
  label: string;
  isComplete?: boolean;
  isVisible?: boolean;
}

interface QaPackTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isGuidedMode?: boolean;
}

export const QaPackTabs: React.FC<QaPackTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isGuidedMode = false,
}) => {
  const visibleTabs = tabs.filter((tab) => tab.isVisible !== false);
  const activeTabIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);

  if (isGuidedMode) {
    return (
      <div className="flex justify-center items-center py-2">
        <span className="text-lg font-semibold text-sga-700">
          Step {activeTabIndex + 1} of {visibleTabs.length}:{' '}
          {visibleTabs[activeTabIndex]?.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex space-x-2 overflow-x-auto border-b border-gray-200">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg focus:outline-none focus:ring-2 focus:ring-sga-500 transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-sga-700 text-sga-700 bg-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{tab.label}</span>
            {tab.isComplete && (
              <Check className="w-4 h-4 text-green-600" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default QaPackTabs;
