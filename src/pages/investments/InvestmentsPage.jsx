import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Portfolio } from './Portfolio';
import { Watchlist } from './Watchlist';
import { StrategyNotes } from './StrategyNotes';
import { useGemini } from '../../hooks/useGemini';
import { ActionButton, PageHeader, TabBar } from '../../components/ui';
import { useIDB } from '../../hooks/useIDB';
import { AiSuggestion } from '../../components/AiSuggestion';
import { calculateAssetAllocation } from './investments.utils';

const TABS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'strategy', label: 'Strategy' },
];

const VALID_TABS = TABS.map((t) => t.id);

export function InvestmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : 'portfolio';
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });
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
      <PageHeader title="Investments" subtitle="Track your portfolio, watchlist, and strategy" />

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

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
