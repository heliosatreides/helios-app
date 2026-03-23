import { useState } from 'react';
import { Portfolio } from './Portfolio';
import { Watchlist } from './Watchlist';
import { StrategyNotes } from './StrategyNotes';

const TABS = [
  { id: 'portfolio', label: '📊 Portfolio' },
  { id: 'watchlist', label: '👀 Watchlist' },
  { id: 'strategy', label: '📝 Strategy' },
];

export function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState('portfolio');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4e7]">Investments</h1>
        <p className="text-[#71717a] text-sm mt-1">Track your portfolio, watchlist, and strategy</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111113] border border-[#27272a] rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#f59e0b] text-black'
                : 'text-[#71717a] hover:text-[#e4e4e7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'portfolio' && <Portfolio />}
      {activeTab === 'watchlist' && <Watchlist />}
      {activeTab === 'strategy' && <StrategyNotes />}
    </div>
  );
}
