import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabBar, PageHeader } from '../../components/ui';
import { CalculatorPage } from '../calculator/CalculatorPage';
import { ConverterPage } from '../converter/ConverterPage';
import { WorldClockPage } from '../worldclock/WorldClockPage';
import { RegexPage } from '../regex/RegexPage';
import { PasswordGenerator } from '../password/PasswordGenerator';

const TABS = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'converter', label: 'Converter' },
  { id: 'worldclock', label: 'World Clock' },
  { id: 'regex', label: 'Regex' },
  { id: 'passwords', label: 'Passwords' },
];

const TAB_IDS = TABS.map((t) => t.id);
const DEFAULT_TAB = 'calculator';

export function UtilitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    TAB_IDS.includes(tabParam) ? tabParam : DEFAULT_TAB
  );

  // Sync URL → state
  useEffect(() => {
    if (tabParam && TAB_IDS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state → URL
  function handleTabChange(tab) {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  }

  return (
    <div>
      <PageHeader title="Utilities" subtitle="Calculator, converter, world clock, and more" />
      <TabBar tabs={TABS} active={activeTab} onChange={handleTabChange} />

      {activeTab === 'calculator' && <CalculatorPage embedded />}
      {activeTab === 'converter' && <ConverterPage embedded />}
      {activeTab === 'worldclock' && <WorldClockPage embedded />}
      {activeTab === 'regex' && <RegexPage embedded />}
      {activeTab === 'passwords' && <PasswordGenerator />}
    </div>
  );
}
