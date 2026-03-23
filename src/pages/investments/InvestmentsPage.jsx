import { useState } from 'react';
import { Portfolio } from './Portfolio';
import { Watchlist } from './Watchlist';
import { StrategyNotes } from './StrategyNotes';
import { useGemini } from '../../hooks/useGemini';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AiSuggestion } from '../../components/AiSuggestion';
import { calculateAssetAllocation } from './investments.utils';

const TABS = [
  { id: 'portfolio', label: '📊 Portfolio' },
  { id: 'watchlist', label: '👀 Watchlist' },
  { id: 'strategy', label: '📝 Strategy' },
];

export function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [holdings] = useLocalStorage('investments-portfolio', []);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  const handleAiAnalysis = async () => {
    setAiAnalysisLoading(true);
    setAiAnalysis(null);
    setAiError(null);
    try {
      const allocations = calculateAssetAllocation(holdings);
      const tickerList = holdings.map((h) => `${h.ticker} (${h.assetClass})`).join(', ');
      const allocationSummary = allocations.map((a) => `${a.assetClass}: ${a.percent.toFixed(1)}%`).join(', ');
      const prompt = `My investment portfolio contains: ${tickerList || 'no holdings yet'}. Asset allocation: ${allocationSummary || 'N/A'}. Give me a brief 3-point analysis of this portfolio's diversification and risk. Be concise, no financial advice disclaimers needed.`;
      const text = await generate(prompt);
      setAiAnalysis(text);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

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

      {/* AI Analyze Portfolio — shown in portfolio tab when key is set */}
      {activeTab === 'portfolio' && hasKey && (
        <div>
          <button
            onClick={handleAiAnalysis}
            disabled={aiAnalysisLoading}
            className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 disabled:opacity-40 border border-amber-500/30 rounded-lg px-4 py-2 transition-colors"
          >
            {aiAnalysisLoading ? '⏳ Analyzing…' : '✨ Analyze portfolio'}
          </button>
          <AiSuggestion loading={aiAnalysisLoading} result={aiAnalysis} error={aiError} />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'portfolio' && <Portfolio />}
      {activeTab === 'watchlist' && <Watchlist />}
      {activeTab === 'strategy' && <StrategyNotes />}
    </div>
  );
}
