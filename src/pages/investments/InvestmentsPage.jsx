import { useState } from 'react';
import { Portfolio } from './Portfolio';
import { Watchlist } from './Watchlist';
import { StrategyNotes } from './StrategyNotes';
import { useGemini } from '../../hooks/useGemini';
import { ActionButton } from '../../components/ui';
import { useIDB } from '../../hooks/useIDB';
import { AiSuggestion } from '../../components/AiSuggestion';
import { calculateAssetAllocation } from './investments.utils';

const TABS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'strategy', label: 'Strategy' },
];

export function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const { generate, loading: aiLoading, hasKey } = useGemini();
  const [holdings] = useIDB('investments-portfolio', []);
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
        <h1 className="text-lg font-semibold text-foreground">Investments</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your portfolio, watchlist, and strategy</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border border-border p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Analyze Portfolio — shown in portfolio tab when key is set */}
      {activeTab === 'portfolio' && hasKey && (
        <div>
          <ActionButton variant="ai" onClick={handleAiAnalysis} disabled={aiAnalysisLoading}>
            {aiAnalysisLoading ? '⏳ Analyzing…' : '✨ Analyze portfolio'}
          </ActionButton>
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
