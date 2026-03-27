import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIDB } from '../../hooks/useIDB';
import { PageHeader, ActionButton, EmptyState } from '../../components/ui';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const STARTER_LISTS = [
  {
    id: 'starter-indie-builders',
    title: 'Indie Builders',
    description: 'Solo founders and small teams shipping real products.',
    accounts: [
      { id: 'a1', handle: 'levelsio', name: 'Pieter Levels', bio: 'Built Nomad List, Remote OK, PhotoAI. Ships fast, talks about revenue.' },
      { id: 'a2', handle: 'marckohlbrugge', name: 'Marc Kohlbrugge', bio: 'Built BetaList, WIP. Serial indie maker.' },
      { id: 'a3', handle: 'dannypostmaa', name: 'Danny Postma', bio: 'Built HeadshotPro, Headlime. AI products that make money.' },
      { id: 'a4', handle: 'taborein', name: 'Tony Dinh', bio: 'Indie hacker building multiple SaaS products. Transparent about revenue.' },
      { id: 'a5', handle: 'coreyhainesco', name: 'Corey Haines', bio: 'Marketing for bootstrapped startups. Built Swipe Files.' },
    ],
  },
  {
    id: 'starter-ai-builders',
    title: 'AI Builders',
    description: 'People actually building with AI, not just talking about it.',
    accounts: [
      { id: 'b1', handle: 'swyx', name: 'Shawn Wang', bio: 'AI engineer, writer. Latent Space podcast. Deep technical takes.' },
      { id: 'b2', handle: 'simonw', name: 'Simon Willison', bio: 'Built Datasette. LLM tools. Prolific open source + AI writing.' },
      { id: 'b3', handle: 'karpathy', name: 'Andrej Karpathy', bio: 'Ex-Tesla AI, ex-OpenAI. AI education. Clear technical explanations.' },
      { id: 'b4', handle: 'shl', name: 'Sahil Lavingia', bio: 'Gumroad founder. AI investor. Honest about startup life.' },
    ],
  },
  {
    id: 'starter-dev-twitter',
    title: 'Dev Twitter',
    description: 'Engineers who share real knowledge, not engagement bait.',
    accounts: [
      { id: 'c1', handle: 'ThePrimeagen', name: 'ThePrimeagen', bio: 'Vim enthusiast. Streaming, content, and real engineering opinions.' },
      { id: 'c2', handle: 'kentcdodds', name: 'Kent C. Dodds', bio: 'Testing, React patterns. Epic React/Web. Teaches well.' },
      { id: 'c3', handle: 'dan_abramov', name: 'Dan Abramov', bio: 'React core team. Overreacted blog. Deep technical writing.' },
      { id: 'c4', handle: 'tannerlinsley', name: 'Tanner Linsley', bio: 'TanStack (React Query, Router, Table). OSS powerhouse.' },
    ],
  },
];

/* ── Account Card ── */
function AccountCard({ account, onRemove }) {
  return (
    <div className="flex items-start gap-3 p-4 border border-border group">
      <a
        href={`https://x.com/${account.handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 flex-1 min-w-0"
      >
        <div className="w-10 h-10 bg-secondary text-foreground flex items-center justify-center text-sm font-medium shrink-0">
          {account.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground text-sm group-hover:underline">{account.name}</span>
            <span className="text-muted-foreground/60 text-xs">@{account.handle}</span>
          </div>
          {account.bio && <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{account.bio}</p>}
        </div>
      </a>
      {onRemove && (
        <button
          onClick={onRemove}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-colors shrink-0"
          aria-label={`Remove ${account.name}`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Add/Edit List Modal ── */
function ListFormModal({ open, onClose, onSave, initial }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit List' : 'New List'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-secondary border border-border px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:border-foreground"
            placeholder="e.g. AI Researchers"
            autoFocus
            data-testid="list-title-input"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-secondary border border-border px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:border-foreground"
            placeholder="What this list is about"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <ActionButton type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="submit" variant="primary" className="flex-1" disabled={!title.trim()}>{initial ? 'Save' : 'Create'}</ActionButton>
        </div>
      </form>
    </Modal>
  );
}

/* ── Add Account Modal ── */
function AddAccountModal({ open, onClose, onSave }) {
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!handle.trim() || !name.trim()) return;
    onSave({
      id: generateId(),
      handle: handle.trim().replace(/^@/, ''),
      name: name.trim(),
      bio: bio.trim(),
    });
    setHandle('');
    setName('');
    setBio('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Handle</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full bg-secondary border border-border px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:border-foreground"
            placeholder="@username"
            autoFocus
            data-testid="account-handle-input"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-secondary border border-border px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:border-foreground"
            placeholder="Display name"
            data-testid="account-name-input"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Bio (optional)</label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-secondary border border-border px-3 py-2 min-h-[44px] text-sm text-foreground focus:outline-none focus:border-foreground"
            placeholder="Short description"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <ActionButton type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</ActionButton>
          <ActionButton type="submit" variant="primary" className="flex-1" disabled={!handle.trim() || !name.trim()}>Add</ActionButton>
        </div>
      </form>
    </Modal>
  );
}

/* ── Main Page ── */
export function ListsPage() {
  const [lists, setLists, ready] = useIDB('helios-lists', []);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [showNewList, setShowNewList] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [addAccountTo, setAddAccountTo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'list'|'account', listId, accountId? }
  const [showStarters, setShowStarters] = useState(false);

  const activeListId = searchParams.get('list');
  const activeList = useMemo(() => lists.find((l) => l.id === activeListId), [lists, activeListId]);

  // Determine which starter lists haven't been added yet
  const availableStarters = useMemo(
    () => STARTER_LISTS.filter((s) => !lists.some((l) => l.id === s.id)),
    [lists]
  );

  const handleCreateList = useCallback(
    ({ title, description }) => {
      const newList = { id: generateId(), title, description, accounts: [] };
      setLists((prev) => [...prev, newList]);
      setShowNewList(false);
      toast.success(`Created "${title}"`);
    },
    [setLists, toast]
  );

  const handleEditList = useCallback(
    ({ title, description }) => {
      setLists((prev) =>
        prev.map((l) => (l.id === editingList.id ? { ...l, title, description } : l))
      );
      setEditingList(null);
      toast.success('List updated');
    },
    [editingList, setLists, toast]
  );

  const handleDeleteList = useCallback(() => {
    if (!deleteTarget || deleteTarget.type !== 'list') return;
    setLists((prev) => prev.filter((l) => l.id !== deleteTarget.listId));
    setDeleteTarget(null);
    if (activeListId === deleteTarget.listId) {
      setSearchParams({});
    }
    toast.success('List deleted');
  }, [deleteTarget, setLists, activeListId, setSearchParams, toast]);

  const handleAddAccount = useCallback(
    (account) => {
      setLists((prev) =>
        prev.map((l) =>
          l.id === addAccountTo ? { ...l, accounts: [...l.accounts, account] } : l
        )
      );
      setAddAccountTo(null);
      toast.success(`Added @${account.handle}`);
    },
    [addAccountTo, setLists, toast]
  );

  const handleRemoveAccount = useCallback(() => {
    if (!deleteTarget || deleteTarget.type !== 'account') return;
    setLists((prev) =>
      prev.map((l) =>
        l.id === deleteTarget.listId
          ? { ...l, accounts: l.accounts.filter((a) => a.id !== deleteTarget.accountId) }
          : l
      )
    );
    setDeleteTarget(null);
  }, [deleteTarget, setLists]);

  const handleAddStarter = useCallback(
    (starter) => {
      setLists((prev) => [...prev, { ...starter }]);
      toast.success(`Added "${starter.title}" starter list`);
    },
    [setLists, toast]
  );

  const handleAddAllStarters = useCallback(() => {
    setLists((prev) => [...prev, ...availableStarters.map((s) => ({ ...s }))]);
    setShowStarters(false);
    toast.success(`Added ${availableStarters.length} starter lists`);
  }, [availableStarters, setLists, toast]);

  // Loading skeleton
  if (!ready) {
    return (
      <div>
        <PageHeader title="Lists" subtitle="Curate accounts you follow across topics" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border p-5">
              <div className="h-4 bg-secondary animate-pulse w-1/3 mb-2" />
              <div className="h-3 bg-secondary animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detail view — single list
  if (activeList) {
    return (
      <div>
        <PageHeader title={activeList.title} subtitle={activeList.description}>
          <ActionButton variant="secondary" onClick={() => setSearchParams({})}>
            All Lists
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => setEditingList(activeList)}>
            Edit
          </ActionButton>
          <ActionButton variant="primary" onClick={() => setAddAccountTo(activeList.id)}>
            + Add Account
          </ActionButton>
        </PageHeader>

        {activeList.accounts.length === 0 ? (
          <EmptyState
            title="No accounts yet"
            description="Add X/Twitter accounts to this list to keep track of people worth following."
            action={
              <ActionButton variant="primary" onClick={() => setAddAccountTo(activeList.id)}>
                Add First Account
              </ActionButton>
            }
          />
        ) : (
          <div className="border border-border divide-y divide-border">
            {activeList.accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onRemove={() =>
                  setDeleteTarget({ type: 'account', listId: activeList.id, accountId: account.id })
                }
              />
            ))}
          </div>
        )}

        <p className="text-muted-foreground/40 text-xs mt-6">
          {activeList.accounts.length} account{activeList.accounts.length !== 1 ? 's' : ''}
        </p>

        {/* Edit List Modal */}
        {editingList && (
          <ListFormModal
            open={!!editingList}
            onClose={() => setEditingList(null)}
            onSave={handleEditList}
            initial={editingList}
          />
        )}

        {/* Add Account Modal */}
        <AddAccountModal
          open={!!addAccountTo}
          onClose={() => setAddAccountTo(null)}
          onSave={handleAddAccount}
        />

        {/* Confirm Remove Account */}
        <ConfirmDialog
          open={!!deleteTarget && deleteTarget.type === 'account'}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleRemoveAccount}
          title="Remove Account"
          message="Remove this account from the list?"
          confirmLabel="Remove"
        />
      </div>
    );
  }

  // Index view — all lists
  return (
    <div>
      <PageHeader title="Lists" subtitle="Curate accounts you follow across topics">
        {availableStarters.length > 0 && (
          <ActionButton variant="secondary" onClick={() => setShowStarters(true)}>
            Starter Lists
          </ActionButton>
        )}
        <ActionButton variant="primary" onClick={() => setShowNewList(true)}>
          + New List
        </ActionButton>
      </PageHeader>

      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Create a list to curate X/Twitter accounts by topic. Or start with our curated starter lists."
          action={
            <div className="flex gap-3 justify-center">
              {availableStarters.length > 0 && (
                <ActionButton variant="secondary" onClick={handleAddAllStarters}>
                  Add Starter Lists
                </ActionButton>
              )}
              <ActionButton variant="primary" onClick={() => setShowNewList(true)}>
                Create List
              </ActionButton>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <div key={list.id} className="border border-border p-5 flex items-center gap-4">
              <button
                onClick={() => setSearchParams({ list: list.id })}
                className="flex-1 text-left min-w-0 group min-h-[44px] flex flex-col justify-center"
              >
                <h2 className="font-medium text-foreground group-hover:underline">{list.title}</h2>
                {list.description && (
                  <p className="text-muted-foreground text-sm mt-0.5">{list.description}</p>
                )}
                <span className="text-muted-foreground/50 text-xs mt-1">
                  {list.accounts.length} account{list.accounts.length !== 1 ? 's' : ''}
                </span>
              </button>
              <button
                onClick={() => setDeleteTarget({ type: 'list', listId: list.id })}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-colors shrink-0"
                aria-label={`Delete ${list.title}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New List Modal */}
      <ListFormModal
        open={showNewList}
        onClose={() => setShowNewList(false)}
        onSave={handleCreateList}
      />

      {/* Starter Lists Modal */}
      <Modal open={showStarters} onClose={() => setShowStarters(false)} title="Starter Lists">
        <p className="text-muted-foreground text-sm mb-4">
          Pre-curated lists to get you started. Add individual lists or all at once.
        </p>
        <div className="space-y-3 mb-4">
          {availableStarters.map((starter) => (
            <div key={starter.id} className="border border-border p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground">{starter.title}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{starter.description}</p>
                <span className="text-muted-foreground/50 text-xs">{starter.accounts.length} accounts</span>
              </div>
              <ActionButton variant="secondary" onClick={() => handleAddStarter(starter)}>
                Add
              </ActionButton>
            </div>
          ))}
        </div>
        {availableStarters.length > 1 && (
          <ActionButton variant="primary" className="w-full" onClick={handleAddAllStarters}>
            Add All ({availableStarters.length} lists)
          </ActionButton>
        )}
      </Modal>

      {/* Confirm Delete List */}
      <ConfirmDialog
        open={!!deleteTarget && deleteTarget.type === 'list'}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteList}
        title="Delete List"
        message="This will permanently delete this list and all its accounts."
        confirmLabel="Delete"
      />
    </div>
  );
}
