import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { AiSuggestion } from '../../components/AiSuggestion';
import { AccountList } from './AccountList';
import { AddAccountModal } from './AddAccountModal';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { BudgetView } from './BudgetView';
import { BudgetForm } from './BudgetForm';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const TABS = ['Accounts', 'Transactions', 'Budget'];

export function FinancePage() {
  const [accounts, setAccounts] = useIDB('finance-accounts', []);
  const [transactions, setTransactions] = useIDB('finance-transactions', []);
  const [budgets, setBudgets] = useIDB('finance-budgets', []);
  const [activeTab, setActiveTab] = useState('Accounts');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  // Filters for transactions
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { generate, loading: aiLoading, error: aiError, hasKey } = useGemini();
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState(null);

  // Account operations
  function handleSaveAccount(data) {
    if (data.id) {
      setAccounts((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    } else {
      setAccounts((prev) => [...prev, { ...data, id: generateId() }]);
    }
    setShowAccountModal(false);
    setEditingAccount(null);
  }

  function handleDeleteAccount(id) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  function handleEditAccount(account) {
    setEditingAccount(account);
    setShowAccountModal(true);
  }

  // Transaction operations
  function handleSaveTransaction(data) {
    const tx = { ...data, id: generateId() };
    setTransactions((prev) => [...prev, tx]);
    // Update account balance
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== tx.accountId) return a;
        const delta = tx.type === 'income' ? tx.amount : -tx.amount;
        return { ...a, balance: a.balance + delta };
      })
    );
    setShowTxModal(false);
  }

  function handleDeleteTransaction(id) {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    // Reverse the balance change
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== tx.accountId) return a;
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...a, balance: a.balance + delta };
      })
    );
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  // Budget operations
  function handleSaveBudget(data) {
    setBudgets((prev) => {
      const existing = prev.findIndex((b) => b.category === data.category);
      if (existing >= 0) {
        return prev.map((b, i) => (i === existing ? data : b));
      }
      return [...prev, data];
    });
    setShowBudgetForm(false);
  }

  function handleDeleteBudget(category) {
    setBudgets((prev) => prev.filter((b) => b.category !== category));
  }

  async function handleAiInsights() {
    setAiInsightsLoading(true);
    setAiInsights(null);
    setAiInsightsError(null);
    try {
      // Aggregate category totals for current month only (no raw transactions)
      const monthTx = transactions.filter((t) => t.date?.startsWith(currentMonth));
      const categoryTotals = {};
      monthTx.forEach((t) => {
        const cat = t.category || 'Other';
        if (t.type === 'expense') {
          categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        }
      });
      const totalSpending = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
      const breakdown = Object.entries(categoryTotals)
        .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
        .join(', ');
      const prompt = `Here's my spending summary for this month: Total: $${totalSpending.toFixed(2)}. Breakdown: ${breakdown || 'No expenses yet'}. Give me 3 brief, actionable personal finance tips based on this spending pattern. Be specific and concise.`;
      const text = await generate(prompt);
      setAiInsights(text);
    } catch (err) {
      setAiInsightsError(err.message);
    } finally {
      setAiInsightsLoading(false);
    }
  }

  const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Salary', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4e7]">Finance</h1>
          <p className="text-[#71717a] text-sm mt-1">Track your accounts, transactions, and budgets</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'Accounts') { setEditingAccount(null); setShowAccountModal(true); }
            else if (activeTab === 'Transactions') setShowTxModal(true);
            else if (activeTab === 'Budget') setShowBudgetForm(true);
          }}
          className="px-4 py-2 bg-[#f59e0b] text-black rounded-lg font-semibold hover:bg-amber-400 transition-colors text-sm"
        >
          + Add {activeTab === 'Accounts' ? 'Account' : activeTab === 'Transactions' ? 'Transaction' : 'Budget'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111113] border border-[#27272a] rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#f59e0b] text-black'
                : 'text-[#71717a] hover:text-[#e4e4e7]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Accounts' && (
        <AccountList
          accounts={accounts}
          onEdit={handleEditAccount}
          onDelete={handleDeleteAccount}
        />
      )}

      {activeTab === 'Transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f59e0b]"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-[#e4e4e7] text-sm focus:outline-none focus:border-[#f59e0b]"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <TransactionList
            transactions={transactions}
            accounts={accounts}
            onDelete={handleDeleteTransaction}
            filterAccountId={filterAccountId || undefined}
            filterCategory={filterCategory || undefined}
          />
        </div>
      )}

      {activeTab === 'Budget' && (
        <div className="space-y-4">
          {hasKey && (
            <div>
              <button
                onClick={handleAiInsights}
                disabled={aiInsightsLoading}
                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 disabled:opacity-40 border border-amber-500/30 rounded-lg px-4 py-2 transition-colors"
              >
                {aiInsightsLoading ? '⏳ Analyzing…' : '✨ Monthly insights'}
              </button>
              <AiSuggestion loading={aiInsightsLoading} result={aiInsights} error={aiInsightsError} />
            </div>
          )}
          {budgets.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {budgets.map((b) => (
                <button
                  key={b.category}
                  onClick={() => handleDeleteBudget(b.category)}
                  className="text-xs text-[#71717a] hover:text-red-400 bg-[#111113] border border-[#27272a] rounded px-2 py-1 transition-colors"
                >
                  Remove {b.category}
                </button>
              ))}
            </div>
          )}
          <BudgetView
            budgets={budgets}
            transactions={transactions}
            month={currentMonth}
          />
        </div>
      )}

      {/* Modals */}
      {showAccountModal && (
        <AddAccountModal
          account={editingAccount}
          onSave={handleSaveAccount}
          onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
        />
      )}
      {showTxModal && (
        <AddTransactionModal
          accounts={accounts}
          onSave={handleSaveTransaction}
          onClose={() => setShowTxModal(false)}
        />
      )}
      {showBudgetForm && (
        <BudgetForm
          onSave={handleSaveBudget}
          onClose={() => setShowBudgetForm(false)}
        />
      )}
    </div>
  );
}
