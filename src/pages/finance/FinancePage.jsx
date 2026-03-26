import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { AiSuggestion } from '../../components/AiSuggestion';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ActionButton, TabBar, PageHeader } from '../../components/ui';
import { AccountList } from './AccountList';
import { AddAccountModal } from './AddAccountModal';
import { TransactionList } from './TransactionList';
import { AddTransactionModal } from './AddTransactionModal';
import { BudgetView } from './BudgetView';
import { BudgetForm } from './BudgetForm';
import { SpendingChart } from './SpendingChart';
import { ImportButton } from '../../components/ImportButton';
import { mergeById, csvRowToTransaction } from '../../utils/importData';
import { useToast } from '../../components/Toast';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const TABS = ['Accounts', 'Transactions', 'Budget'];

export function FinancePage() {
  const toast = useToast();
  const [accounts, setAccounts] = useIDB('finance-accounts', []);
  const [transactions, setTransactions] = useIDB('finance-transactions', []);
  const [budgets, setBudgets] = useIDB('finance-budgets', []);
  const [activeTab, setActiveTab] = useState('Accounts');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState(null);
  const [deleteTxTarget, setDeleteTxTarget] = useState(null);
  const [deleteBudgetTarget, setDeleteBudgetTarget] = useState(null);

  // Filters for transactions
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { generate, loading: aiLoading, error: aiError, hasKey } = useGemini();
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState(null);

  // Import state
  const [importMsg, setImportMsg] = useState('');

  function showImportMsg(msg) {
    setImportMsg(msg);
    setTimeout(() => setImportMsg(''), 4000);
  }

  // Import handlers
  function handleImportTransactionsCSV(rows) {
    const incoming = rows.map(csvRowToTransaction);
    setTransactions((prev) => {
      const { merged, imported, skipped } = mergeById(prev, incoming);
      showImportMsg(`Imported ${imported} transaction${imported !== 1 ? 's' : ''} (${skipped} skipped as duplicates)`);
      return merged;
    });
  }

  function handleImportAccountsJSON(data) {
    const incoming = Array.isArray(data) ? data : (data.finance?.accounts || data.accounts || []);
    setAccounts((prev) => {
      const { merged, imported, skipped } = mergeById(prev, incoming);
      showImportMsg(`Imported ${imported} account${imported !== 1 ? 's' : ''} (${skipped} skipped as duplicates)`);
      return merged;
    });
  }

  // Account operations
  function handleSaveAccount(data) {
    if (data.id) {
      setAccounts((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    } else {
      setAccounts((prev) => [...prev, { ...data, id: generateId() }]);
    }
    setShowAccountModal(false);
    setEditingAccount(null);
    toast.success(data.id ? 'Account updated' : 'Account added');
  }

  function handleDeleteAccount(id) {
    setDeleteAccountTarget(id);
  }
  function confirmDeleteAccount() {
    setAccounts((prev) => prev.filter((a) => a.id !== deleteAccountTarget));
    setDeleteAccountTarget(null);
    toast.info('Account deleted');
  }

  function handleEditAccount(account) {
    setEditingAccount(account);
    setShowAccountModal(true);
  }

  // Transaction operations
  function handleSaveTransaction(data) {
    if (data.id) {
      // Editing existing transaction — reverse old balance, apply new
      const oldTx = transactions.find((t) => t.id === data.id);
      if (oldTx) {
        setAccounts((prev) =>
          prev.map((a) => {
            let balance = a.balance;
            // Reverse old transaction's effect
            if (a.id === oldTx.accountId) {
              balance += oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            }
            // Apply new transaction's effect
            if (a.id === data.accountId) {
              balance += data.type === 'income' ? data.amount : -data.amount;
            }
            return { ...a, balance };
          })
        );
      }
      setTransactions((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } else {
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
    }
    setShowTxModal(false);
    setEditingTransaction(null);
    toast.success(data.id ? 'Transaction updated' : 'Transaction added');
  }

  function handleEditTransaction(tx) {
    setEditingTransaction(tx);
    setShowTxModal(true);
  }

  function handleDeleteTransaction(id) {
    setDeleteTxTarget(id);
  }
  function confirmDeleteTransaction() {
    const tx = transactions.find((t) => t.id === deleteTxTarget);
    if (!tx) { setDeleteTxTarget(null); return; }
    // Reverse the balance change
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== tx.accountId) return a;
        const delta = tx.type === 'income' ? -tx.amount : tx.amount;
        return { ...a, balance: a.balance + delta };
      })
    );
    setTransactions((prev) => prev.filter((t) => t.id !== deleteTxTarget));
    setDeleteTxTarget(null);
    toast.info('Transaction deleted');
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
    toast.success('Budget saved');
  }

  function handleDeleteBudget(category) {
    setDeleteBudgetTarget(category);
  }
  function confirmDeleteBudget() {
    setBudgets((prev) => prev.filter((b) => b.category !== deleteBudgetTarget));
    setDeleteBudgetTarget(null);
    toast.info('Budget removed');
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

  // Net worth and monthly summary
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthlyIncome = transactions
    .filter((t) => t.type === 'income' && t.date?.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpensesTotal = transactions
    .filter((t) => t.type === 'expense' && t.date?.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);
  const maxBar = Math.max(monthlyIncome, monthlyExpensesTotal, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Finance" subtitle="Track your accounts, transactions, and budgets" />

      {/* Net Worth Banner */}
      {accounts.length > 0 && (
        <div className="bg-background border border-border p-6" data-testid="net-worth-banner">
          <p className="text-muted-foreground text-sm mb-1">Net Worth</p>
          <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="net-worth-value">
            {netWorth < 0 ? '-' : ''}${Math.abs(netWorth).toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {/* Monthly Summary */}
      {(monthlyIncome > 0 || monthlyExpensesTotal > 0) && (
        <div className="bg-background border border-border p-6" data-testid="monthly-summary-card">
          <p className="text-foreground font-semibold mb-3">
            Monthly Summary <span className="text-muted-foreground/80 text-sm font-normal">({currentMonth})</span>
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-400">Income</span>
                <span className="text-green-400 font-medium">${monthlyIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(monthlyIncome / maxBar) * 100}%` }}
                  data-testid="income-bar"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400">Expenses</span>
                <span className="text-red-400 font-medium">${monthlyExpensesTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(monthlyExpensesTotal / maxBar) * 100}%` }}
                  data-testid="expenses-bar"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-border">
              <span className="text-muted-foreground">Net</span>
              <span className={`font-semibold ${monthlyIncome - monthlyExpensesTotal >= 0 ? 'text-green-400' : 'text-red-400'}`} data-testid="monthly-net">
                {monthlyIncome - monthlyExpensesTotal >= 0 ? '+' : ''}${(monthlyIncome - monthlyExpensesTotal).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Import flash */}
      {importMsg && (
        <div className="text-xs px-3 py-2 border text-green-400 bg-green-400/10 border-green-400/20">
          ✅ {importMsg}
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'Accounts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <ImportButton
              mode="json"
              label="📥 Import Accounts (JSON)"
              onImport={handleImportAccountsJSON}
            />
            <button
              onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
              className="px-4 py-2 bg-foreground hover:bg-foreground/90 text-background font-semibold transition-all text-sm min-h-[44px]"
            >
              + Add Account
            </button>
          </div>
          <AccountList
            accounts={accounts}
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
          />
        </div>
      )}

      {activeTab === 'Transactions' && (
        <div className="space-y-4">
          {/* Import */}
          <div className="flex flex-wrap gap-2">
            <ImportButton
              mode="csv"
              label="📥 Import Transactions (CSV)"
              onImport={handleImportTransactionsCSV}
            />
            <button
              onClick={() => { setEditingTransaction(null); setShowTxModal(true); }}
              className="px-4 py-2 bg-foreground hover:bg-foreground/90 text-background font-semibold transition-all text-sm min-h-[44px]"
            >
              + Add Transaction
            </button>
          </div>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="bg-background border border-border px-3 py-2 min-h-[44px] text-foreground text-sm focus:outline-none focus:border-foreground"
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-background border border-border px-3 py-2 min-h-[44px] text-foreground text-sm focus:outline-none focus:border-foreground"
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
            onEdit={handleEditTransaction}
            filterAccountId={filterAccountId || undefined}
            filterCategory={filterCategory || undefined}
          />
        </div>
      )}

      {activeTab === 'Budget' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowBudgetForm(true)}
              className="px-4 py-2 bg-foreground hover:bg-foreground/90 text-background font-semibold transition-all text-sm min-h-[44px]"
            >
              + Add Budget
            </button>
          </div>
          {hasKey && (
            <div>
              <ActionButton variant="ai" onClick={handleAiInsights} disabled={aiInsightsLoading}>
                {aiInsightsLoading ? '⏳ Analyzing…' : '✨ Monthly insights'}
              </ActionButton>
              <AiSuggestion loading={aiInsightsLoading} result={aiInsights} error={aiInsightsError} />
            </div>
          )}
          {budgets.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {budgets.map((b) => (
                <button
                  key={b.category}
                  onClick={() => handleDeleteBudget(b.category)}
                  className="text-xs text-muted-foreground hover:text-red-400 bg-background border border-border rounded px-2 py-1 transition-colors"
                >
                  Remove {b.category}
                </button>
              ))}
            </div>
          )}
          {/* Spending breakdown chart */}
          <div className="bg-secondary/30 border border-border p-5" data-testid="spending-chart-section">
            <SpendingChart
              transactions={transactions}
              month={currentMonth}
              budgets={budgets}
            />
          </div>

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
          onClose={() => { setShowTxModal(false); setEditingTransaction(null); }}
          transaction={editingTransaction}
        />
      )}
      {showBudgetForm && (
        <BudgetForm
          onSave={handleSaveBudget}
          onClose={() => setShowBudgetForm(false)}
        />
      )}

      <ConfirmDialog
        open={deleteAccountTarget !== null}
        onClose={() => setDeleteAccountTarget(null)}
        onConfirm={confirmDeleteAccount}
        title="Delete account?"
        message="This will permanently delete this account. Transactions linked to it will remain."
      />
      <ConfirmDialog
        open={deleteTxTarget !== null}
        onClose={() => setDeleteTxTarget(null)}
        onConfirm={confirmDeleteTransaction}
        title="Delete transaction?"
        message="This will permanently delete this transaction and reverse the balance change."
      />
      <ConfirmDialog
        open={deleteBudgetTarget !== null}
        onClose={() => setDeleteBudgetTarget(null)}
        onConfirm={confirmDeleteBudget}
        title="Delete budget?"
        message="This will remove this budget category."
      />
    </div>
  );
}
