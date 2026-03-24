import { Link } from 'react-router-dom';
import { useState } from 'react';

const ALL_FEATURES = [
  // Personal
  { icon: '✈️', title: 'Trip Planning', category: 'Personal', desc: 'Day-by-day itineraries, activity logging, budget tracking, and AI-generated trip plans.' },
  { icon: '💰', title: 'Personal Finance', category: 'Personal', desc: 'Track accounts, log transactions, set monthly budgets by category, and monitor net worth.' },
  { icon: '📈', title: 'Investments', category: 'Personal', desc: 'Portfolio tracking with live prices, gain/loss, asset allocation chart, and AI risk assessment.' },
  { icon: '🏆', title: 'Sports Hub', category: 'Personal', desc: 'Live scores for NBA, NFL, MLB, NHL, MLS. Favorite teams filter. AI game previews.' },
  { icon: '🎯', title: 'Goals & OKRs', category: 'Personal', desc: 'Set objectives with key results. Track progress with color-coded bars. AI rates your progress.' },
  { icon: '🏥', title: 'Health & Wellness', category: 'Personal', desc: 'Water tracker, mood journal with 14-day history, sleep log, and AI weekly health digest.' },
  { icon: '🤝', title: 'Networking / CRM', category: 'Personal', desc: 'Track contacts, log interactions, follow-up reminders. AI drafts outreach messages.' },
  { icon: '💸', title: 'Expense Splitter', category: 'Personal', desc: 'Split bills fairly with friends. Equal or itemized splits, settle-up view, AI recommends fairest split.' },
  { icon: '🍽️', title: 'Meal Planner', category: 'Personal', desc: 'Weekly 7-day meal grid, grocery list generator, calorie tracker, and AI meal planning.' },
  { icon: '📋', title: 'Subscription Tracker', category: 'Personal', desc: 'Track all subscriptions, monthly & annual totals, renewal alerts, and AI cancellation suggestions.' },
  { icon: '🎵', title: 'Music Picks', category: 'Personal', desc: 'Mood-based music suggestions powered by Gemini. Save favorites, open in Spotify.' },
  { icon: '🧳', title: 'Packing Lists', category: 'Personal', desc: 'Templates for beach, hiking, business travel. AI builds custom lists from destination + duration.' },
  // Productivity
  { icon: '🗓️', title: 'Daily Planner', category: 'Productivity', desc: 'Time-blocked schedule, task list with priorities, recurring tasks, monthly calendar view.' },
  { icon: '🔥', title: 'Focus Mode', category: 'Productivity', desc: 'Pomodoro timer, habit tracker with streaks, quick notes with AI summarization.' },
  { icon: '📚', title: 'Knowledge Base', category: 'Productivity', desc: 'Reading list (books, articles, podcasts), TIL log with tags. AI connects the dots.' },
  { icon: '📄', title: 'Resume Builder', category: 'Productivity', desc: 'Full resume editor, print-ready preview, multiple versions. AI rewrites bullets and tailors for jobs.' },
  // Developer
  { icon: '💻', title: 'Dev Tools', category: 'Developer', desc: 'GitHub activity feed, code snippet manager, daily dev log, standup generator.' },
  { icon: '📰', title: 'News Aggregator', category: 'Developer', desc: 'General, Tech, Startups, Finance, Crypto, AI, Sports feeds. AI briefings per topic.' },
  { icon: '🔄', title: 'Converter', category: 'Developer', desc: 'Live exchange rates, length, weight, temperature, data, and time unit conversions.' },
  { icon: '🕐', title: 'World Clock', category: 'Developer', desc: 'Live times across cities, business hours indicator, and timezone meeting planner.' },
  { icon: '🃏', title: 'Flashcards', category: 'Developer', desc: 'Decks with spaced repetition. AI generates flashcards from any text.' },
  { icon: '💬', title: 'P2P Chat', category: 'Tools', desc: 'Peer-to-peer encrypted chat via WebRTC. No servers. No history. Disappears when you leave.' },
  { icon: '🔐', title: 'Password Gen', category: 'Developer', desc: 'Cryptographically secure passwords with strength meter and clipboard copy.' },
  { icon: '🔌', title: 'API Playground', category: 'Developer', desc: 'Test endpoints with request/response viewer, history, favorites, and AI explanation.' },
  { icon: '🎨', title: 'Color Palette', category: 'Developer', desc: 'Generate complementary, analogous, triadic palettes. CSS vars output. AI naming.' },
  { icon: '📝', title: 'Personal Wiki', category: 'Developer', desc: 'Markdown wiki with folders, [[page links]], search, and AI summarization.' },
  { icon: '🔤', title: 'Regex Tester', category: 'Developer', desc: 'Live testing with match highlighting, group capture, and AI regex explainer.' },
  { icon: '🧮', title: 'Calculator', category: 'Developer', desc: 'Loan, compound interest, retirement, savings goal, and tax estimator with AI.' },
];

const CATEGORIES = [
  { id: 'Personal', label: 'Personal', icon: '👤' },
  { id: 'Productivity', label: 'Productivity', icon: '⚡' },
  { id: 'Developer', label: 'Developer', icon: '🛠' },
];

function FeatureCard({ feature }) {
  return (
    <div className="group relative bg-[#111113] border border-[#1c1c20] rounded-2xl p-5 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
      <div className="flex items-start gap-4">
        <span className="text-2xl shrink-0 mt-0.5">{feature.icon}</span>
        <div className="min-w-0">
          <h3 className="font-semibold text-[#e4e4e7] text-sm mb-1 group-hover:text-amber-400 transition-colors">{feature.title}</h3>
          <p className="text-[#52525b] text-xs leading-relaxed">{feature.desc}</p>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ value, label }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-[#e4e4e7]">{value}</div>
      <div className="text-xs text-[#52525b] mt-1">{label}</div>
    </div>
  );
}

export function LandingPage() {
  const [activeCategory, setActiveCategory] = useState('Personal');

  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredFeatures = ALL_FEATURES.filter(f =>
    f.category === activeCategory || f.category === 'Tools'
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style>{`html { scroll-behavior: smooth; }`}</style>

      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0b]/80 border-b border-[#18181b]/80">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-black">H</div>
            <span className="text-lg font-bold text-[#e4e4e7]">Helios</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" onClick={scrollToFeatures} className="text-sm text-[#71717a] hover:text-[#e4e4e7] transition-colors hidden sm:block">Features</a>
            <a href="#privacy" className="text-sm text-[#71717a] hover:text-[#e4e4e7] transition-colors hidden sm:block">Privacy</a>
            <Link to="/login" className="text-sm text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors">Sign In</Link>
            <Link
              to="/login"
              className="text-sm px-4 py-2 rounded-xl font-semibold text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-32 overflow-hidden">
        {/* Background glow */}
        <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.06) 0%, rgba(249,115,22,0.03) 30%, transparent 70%)',
        }} />
        {/* Grid pattern */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative inline-flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-900/40 px-4 py-2 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Built in public · {ALL_FEATURES.length} tools and growing
        </div>

        <h1 className="relative text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1]">
          <span style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Your entire life,
          </span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            one private dashboard.
          </span>
        </h1>

        <p className="relative mt-8 text-lg sm:text-xl text-[#71717a] max-w-2xl leading-relaxed">
          Finance, trips, goals, daily planner, investments, news, dev tools — {ALL_FEATURES.length} features in one app.
          Everything runs in your browser. No cloud. No accounts. No tracking.
        </p>

        <div className="relative mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="group px-8 py-4 rounded-2xl font-semibold text-[#0a0a0b] text-base bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started — It's Free
            <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <a
            href="#features"
            onClick={scrollToFeatures}
            className="px-8 py-4 rounded-2xl font-semibold border border-[#27272a] text-[#a1a1aa] hover:text-[#e4e4e7] hover:border-[#3f3f46] hover:bg-[#111113] transition-all"
          >
            Explore Features
          </a>
        </div>

        {/* Stats row */}
        <div className="relative mt-20 flex items-center gap-12 sm:gap-20">
          <StatBadge value={ALL_FEATURES.length} label="Features" />
          <div className="w-px h-10 bg-[#27272a]" />
          <StatBadge value="0" label="Servers" />
          <div className="w-px h-10 bg-[#27272a]" />
          <StatBadge value="100%" label="Private" />
        </div>
      </section>

      {/* ─── Marquee-style callout ─── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border-y border-amber-900/20 py-4">
        <div className="flex items-center justify-center gap-3 text-sm sm:text-base">
          <span className="text-amber-400">🔒</span>
          <span className="font-semibold text-[#fcd34d]">100% local. Zero servers. Zero tracking.</span>
          <span className="text-[#71717a] hidden sm:inline">—</span>
          <span className="text-[#71717a] hidden sm:inline">Your data never leaves your device.</span>
        </div>
      </div>

      {/* ─── Features ─── */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Everything you need, nothing you don't</span>
          </h2>
          <p className="text-[#52525b] text-lg max-w-xl mx-auto">
            {ALL_FEATURES.length} features across personal, productivity, and developer tools. All running locally.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-[#111113] text-[#71717a] border border-[#1c1c20] hover:text-[#e4e4e7] hover:border-[#27272a]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                activeCategory === cat.id ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1c1c20] text-[#52525b]'
              }`}>
                {ALL_FEATURES.filter(f => f.category === cat.id || (cat.id === activeCategory && f.category === 'Tools')).length}
              </span>
            </button>
          ))}
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* ─── Privacy ─── */}
      <section id="privacy" className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Privacy isn't a feature. It's the architecture.</span>
          </h2>
          <p className="text-[#52525b] text-lg max-w-xl mx-auto">
            Built from the ground up to keep your data yours. No exceptions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: '🗄️',
              title: 'Browser-native storage',
              desc: 'Everything lives in IndexedDB — your browser\'s built-in database. Close the tab, reopen it, your data is still there. No cloud sync, no servers.',
            },
            {
              icon: '🔐',
              title: 'Encrypted secrets',
              desc: 'API keys are encrypted with AES-256-GCM derived from your password. Not even browser DevTools can read them in plaintext.',
            },
            {
              icon: '🚫',
              title: 'Zero data collection',
              desc: 'No accounts to create. No email to provide. No analytics. No telemetry. There\'s literally no server to breach.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#111113] border border-[#1c1c20] rounded-2xl p-8 text-center hover:border-[#27272a] transition-colors">
              <span className="text-4xl mb-4 block">{item.icon}</span>
              <h3 className="font-bold text-[#e4e4e7] text-lg mb-3">{item.title}</h3>
              <p className="text-[#52525b] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── AI section ─── */}
      <section className="px-6 py-24 border-y border-[#1c1c20]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-400 bg-violet-950/40 border border-violet-900/40 px-3 py-1.5 rounded-full mb-6">
                <span>✨</span> AI-Powered
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                AI that works for you,<br />
                <span className="text-[#71717a]">not the other way around.</span>
              </h2>
              <p className="text-[#71717a] leading-relaxed mb-6 text-lg">
                Bring your own Gemini API key and unlock AI across every feature — trip planning,
                spending insights, portfolio analysis, standup generation, resume scoring, and more.
              </p>
              <div className="space-y-3">
                {['Your key, encrypted locally', 'Only called when you ask', 'Free tier is generous', 'Works across all features'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs">✓</span>
                    <span className="text-[#a1a1aa]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-[#111113] border border-[#1c1c20] rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#52525b]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  AI responding
                </div>
                <div className="space-y-3">
                  <div className="bg-[#0a0a0b] rounded-xl p-4 border border-[#1c1c20]">
                    <p className="text-amber-400 text-xs font-medium mb-1">✨ Trip Suggestion</p>
                    <p className="text-[#a1a1aa] text-sm leading-relaxed">"For your 5-day Tokyo trip, I'd recommend starting in Shibuya, hitting Akihabara on day 2, then Hakone for a day trip…"</p>
                  </div>
                  <div className="bg-[#0a0a0b] rounded-xl p-4 border border-[#1c1c20]">
                    <p className="text-violet-400 text-xs font-medium mb-1">📊 Spending Insight</p>
                    <p className="text-[#a1a1aa] text-sm leading-relaxed">"Your food spending is 34% above budget this month. Consider meal prepping to save ~$120."</p>
                  </div>
                </div>
              </div>
              {/* Decorative glow */}
              <div aria-hidden="true" className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-500/5 to-violet-500/5 -z-10 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 py-32 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Ready to take control?</span>
          </h2>
          <p className="text-[#71717a] text-lg mb-10">
            No signup. No download. Just open and start organizing your life.
          </p>
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 px-10 py-5 rounded-2xl font-semibold text-[#0a0a0b] text-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Open Helios
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <p className="mt-6 text-sm text-[#3f3f46]">Works in any modern browser. No install required.</p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#18181b] px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">H</div>
            <span className="text-sm text-[#52525b]">Helios</span>
          </div>
          <p className="text-xs text-[#3f3f46]">
            Built with privacy in mind. Your data stays yours.
          </p>
        </div>
      </footer>
    </div>
  );
}
