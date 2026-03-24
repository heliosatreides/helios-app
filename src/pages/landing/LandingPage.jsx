import { Link } from 'react-router-dom';

const ALL_FEATURES = [
  // Personal
  { icon: '✈️', title: 'Trip Planning', category: 'Personal', desc: 'Day-by-day itineraries, activity logging, budget tracking, and AI-generated trip plans.' },
  { icon: '💰', title: 'Personal Finance', category: 'Personal', desc: 'Track accounts, log transactions, set monthly budgets by category, and monitor net worth.' },
  { icon: '📈', title: 'Investments', category: 'Personal', desc: 'Portfolio tracking with live prices, gain/loss, asset allocation chart, and AI risk assessment.' },
  { icon: '🏆', title: 'Sports Hub', category: 'Personal', desc: 'Live scores for NBA, NFL, MLB, NHL, MLS. Favorite teams filter. AI game previews.' },
  { icon: '🎯', title: 'Goals & OKRs', category: 'Personal', desc: 'Set objectives with key results. Track progress with color-coded bars. AI rates your progress.' },
  { icon: '🏥', title: 'Health & Wellness', category: 'Personal', desc: 'Water tracker, mood journal with 14-day history, sleep log, and AI weekly health digest.' },
  { icon: '🤝', title: 'Networking / CRM', category: 'Personal', desc: 'Track contacts, log interactions, follow-up reminders. AI drafts outreach messages.' },
  // Productivity
  { icon: '🗓️', title: 'Daily Planner', category: 'Productivity', desc: 'Time-blocked schedule, task list with priorities, recurring tasks, monthly calendar view.' },
  { icon: '🔥', title: 'Focus Mode', category: 'Productivity', desc: 'Pomodoro timer, habit tracker with streaks, quick notes with AI summarization.' },
  { icon: '📚', title: 'Knowledge Base', category: 'Productivity', desc: 'Reading list (books, articles, podcasts), TIL log with tags. AI connects the dots.' },
  { icon: '📄', title: 'Resume Builder', category: 'Productivity', desc: 'Full resume editor, print-ready preview, multiple named versions. AI rewrites bullets and tailors for jobs.' },
  // Developer Tools
  { icon: '💻', title: 'Dev Tools', category: 'Developer', desc: 'GitHub activity feed, code snippet manager, daily dev log, standup generator, password generator.' },
  { icon: '📰', title: 'News Aggregator', category: 'Developer', desc: 'General, Tech, Startups, Finance, Crypto, AI, Sports feeds. AI briefings per topic.' },
  { icon: '🔄', title: 'Currency & Unit Converter', category: 'Developer', desc: 'Live exchange rates, length, weight, temperature, data, and time unit conversions.' },
  { icon: '🕐', title: 'World Clock', category: 'Developer', desc: 'Add cities, see live times, business hours indicator, and meeting planner across timezones.' },
  { icon: '🃏', title: 'Flashcards', category: 'Developer', desc: 'Decks with spaced repetition (Easy/Good/Hard). AI generates flashcards from any text.' },
  { icon: '💬', title: 'P2P Ephemeral Chat', category: 'Tools', desc: 'Share a link, connect peer-to-peer via WebRTC. Messages never touch a server. Chat ends when either party leaves.' },
  { icon: '🔐', title: 'Password Generator', category: 'Developer', desc: 'Cryptographically secure passwords with strength meter. Adjustable length, character sets, clipboard copy.' },
  // New features
  { icon: '💸', title: 'Expense Splitter', category: 'Personal', desc: 'Split bills fairly with friends. Equal or itemized splits, settle-up view, AI recommends fairest split.' },
  { icon: '🍽️', title: 'Meal Planner', category: 'Personal', desc: 'Weekly 7-day meal grid, grocery list generator, calorie tracker, and AI meal planning by diet preferences.' },
  { icon: '📋', title: 'Subscription Tracker', category: 'Personal', desc: 'Track all subscriptions, monthly & annual totals, renewal alerts, and AI suggests which to cancel.' },
  { icon: '🎵', title: 'Music Recommendations', category: 'Personal', desc: 'Mood-based music suggestions powered by Gemini. Energetic, Focused, Relaxed — save favorites, open in Spotify.' },
  { icon: '🧳', title: 'Travel Packing Lists', category: 'Personal', desc: 'Pre-built templates for beach, hiking, business travel. AI builds custom packing list from destination + duration.' },
  { icon: '🔌', title: 'API Playground', category: 'Developer', desc: 'Test API endpoints with full request/response viewer, history, favorites, and AI response explanation.' },
  { icon: '🎨', title: 'Color Palette Generator', category: 'Developer', desc: 'Generate complementary, analogous, triadic palettes. CSS vars output. AI names palettes and generates from mood.' },
  { icon: '📝', title: 'Personal Wiki', category: 'Developer', desc: 'A personal knowledge wiki with markdown, folders, [[page links]], search, and AI summarization.' },
  { icon: '🔤', title: 'Regex Tester', category: 'Developer', desc: 'Live regex testing with match highlighting, group capture, common patterns library, and AI regex explainer.' },
  { icon: '🧮', title: 'Financial Calculator', category: 'Developer', desc: 'Loan, compound interest, retirement, savings goal, and tax estimator with AI result interpretation.' },
];

const CATEGORIES = ['Personal', 'Productivity', 'Developer'];

export function LandingPage() {
  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <style>{`html { scroll-behavior: smooth; }`}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-[#18181b]">
        <span className="text-xl font-bold text-[#e4e4e7]">Helios ☀️</span>
        <div className="flex items-center gap-6">
          <a href="#features" onClick={scrollToFeatures} className="text-sm text-[#71717a] hover:text-[#e4e4e7] transition-colors hidden sm:block">Features</a>
          <Link to="/login" className="text-sm text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors">Sign In</Link>
          <Link to="/login" className="text-sm px-4 py-2 rounded-lg font-semibold text-black transition-opacity hover:opacity-90" style={{ backgroundColor: '#f59e0b' }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-28 overflow-hidden">
        <div aria-hidden="true" style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="relative inline-flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-900/40 px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Built in public · {ALL_FEATURES.length} features and growing
        </div>
        <h1 className="relative text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Your life, organized.<br />No cloud required.
        </h1>
        <p className="relative mt-6 text-lg text-[#a1a1aa] max-w-2xl leading-relaxed">
          Helios is a personal everything app that lives entirely in your browser. Trip planning, finance, investments, daily planning, resume builder, news, developer tools — all in one place, all private.
        </p>
        <div className="relative mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="px-6 py-3 rounded-xl font-semibold text-[#0a0a0b] transition-opacity hover:opacity-90" style={{ backgroundColor: '#f59e0b' }}>
            Get Started — It's Free
          </Link>
          <a href="#features" onClick={scrollToFeatures} className="px-6 py-3 rounded-xl font-semibold border border-[#27272a] text-[#e4e4e7] hover:border-[#3f3f46] transition-colors">
            See All {ALL_FEATURES.length} Features ↓
          </a>
        </div>
      </section>

      {/* Privacy callout banner */}
      <div className="bg-amber-950/30 border-y border-amber-900/40 px-6 py-4 text-center text-sm sm:text-base">
        🔒 <strong className="text-[#fcd34d]">100% local. Zero servers. Zero tracking.</strong>{' '}
        <span className="text-[#a1a1aa]">Your data never leaves your device. Not even to us.</span>
      </div>

      {/* Features by category */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Everything in one place</h2>
        <p className="text-center text-[#a1a1aa] mb-16">{ALL_FEATURES.length} features across personal, productivity, and developer tools.</p>

        {CATEGORIES.map((cat) => (
          <div key={cat} className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#52525b]">{cat}</span>
              <div className="flex-1 h-px bg-[#1c1c1f]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_FEATURES.filter(f => f.category === cat).map((feature) => (
                <div key={feature.title} className="bg-[#111113] border border-[#27272a] rounded-2xl p-6 flex flex-col gap-3 hover:border-[#3f3f46] transition-colors">
                  <span className="text-3xl">{feature.icon}</span>
                  <h3 className="font-bold text-[#e4e4e7]">{feature.title}</h3>
                  <p className="text-sm text-[#71717a] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Privacy deep-dive */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Privacy isn't a feature. It's the foundation.</h2>
        <p className="text-center text-[#a1a1aa] mb-12">Built from the ground up to keep your data yours.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: '🗄️', title: 'Stored in your browser', desc: 'Everything lives in IndexedDB — your browser\'s built-in database. Close the tab, reopen it, your data is still there.' },
            { icon: '🔐', title: 'Encrypted at rest', desc: 'API keys are encrypted with AES-256-GCM using your password. Not even DevTools can read them.' },
            { icon: '🚫', title: 'No accounts, no tracking', desc: 'There\'s no server to breach. No email to harvest. No analytics to sell. Just you and your data.' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col gap-3 text-center items-center">
              <span className="text-4xl">{item.icon}</span>
              <h3 className="font-bold text-[#e4e4e7] text-lg">{item.title}</h3>
              <p className="text-[#71717a] text-sm leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI section */}
      <section className="px-6 py-24 bg-[#0d0d0f] border-y border-[#1c1c1f]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">AI that works for you —<br className="hidden sm:block" /> not the other way around.</h2>
          <p className="text-[#a1a1aa] leading-relaxed mb-4">
            Bring your own Gemini API key and unlock AI across every feature: trip itineraries, spending insights, portfolio analysis, standup generation, resume scoring, news briefings, and more. Your key is encrypted locally and only used when you ask.
          </p>
          <p className="text-sm text-[#52525b] font-medium">No subscription. No data sharing. No black box.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8">Ready to get started?</h2>
        <Link to="/login" className="inline-block px-8 py-4 rounded-xl font-semibold text-[#0a0a0b] text-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: '#f59e0b' }}>
          Open Helios →
        </Link>
        <p className="mt-4 text-sm text-[#52525b]">Works in any modern browser. No install required.</p>
      </section>
    </div>
  );
}
