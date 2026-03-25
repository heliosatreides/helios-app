import { Link } from 'react-router-dom';
import { useState } from 'react';

const ALL_FEATURES = [
  { title: 'Trip Planning', category: 'Personal', desc: 'Day-by-day itineraries, activity logging, budget tracking, and AI-generated trip plans.' },
  { title: 'Personal Finance', category: 'Personal', desc: 'Track accounts, log transactions, set monthly budgets by category, and monitor net worth.' },
  { title: 'Investments', category: 'Personal', desc: 'Portfolio tracking with live prices, gain/loss, asset allocation chart, and AI risk assessment.' },
  { title: 'Sports Hub', category: 'Personal', desc: 'Live scores for NBA, NFL, MLB, NHL, MLS. Favorite teams filter. AI game previews.' },
  { title: 'Goals & OKRs', category: 'Personal', desc: 'Set objectives with key results. Track progress with color-coded bars. AI rates your progress.' },
  { title: 'Health & Wellness', category: 'Personal', desc: 'Water tracker, mood journal with 14-day history, sleep log, and AI weekly health digest.' },
  { title: 'Networking / CRM', category: 'Personal', desc: 'Track contacts, log interactions, follow-up reminders. AI drafts outreach messages.' },
  { title: 'Expense Splitter', category: 'Personal', desc: 'Split bills fairly with friends. Equal or itemized splits, settle-up view.' },
  { title: 'Meal Planner', category: 'Personal', desc: 'Weekly meal grid, grocery list generator, calorie tracker, and AI meal planning.' },
  { title: 'Subscription Tracker', category: 'Personal', desc: 'Track all subscriptions, monthly and annual totals, renewal alerts.' },
  { title: 'Music Picks', category: 'Personal', desc: 'Mood-based music suggestions powered by Gemini. Save favorites, open in Spotify.' },
  { title: 'Packing Lists', category: 'Personal', desc: 'Templates for beach, hiking, business travel. AI builds custom lists.' },
  { title: 'Daily Planner', category: 'Productivity', desc: 'Time-blocked schedule, task list with priorities, recurring tasks, monthly calendar view.' },
  { title: 'Focus Mode', category: 'Productivity', desc: 'Pomodoro timer, habit tracker with streaks, quick notes with AI summarization.' },
  { title: 'Knowledge Base', category: 'Productivity', desc: 'Reading list (books, articles, podcasts), TIL log with tags. AI connects the dots.' },
  { title: 'Resume Builder', category: 'Productivity', desc: 'Full resume editor, print-ready preview, multiple versions. AI rewrites bullets.' },
  { title: 'Dev Tools', category: 'Developer', desc: 'GitHub activity feed, code snippet manager, daily dev log, standup generator.' },
  { title: 'News Aggregator', category: 'Developer', desc: 'General, Tech, Startups, Finance, Crypto, AI, Sports feeds. AI briefings per topic.' },
  { title: 'Converter', category: 'Developer', desc: 'Live exchange rates, length, weight, temperature, data, and time conversions.' },
  { title: 'World Clock', category: 'Developer', desc: 'Live times across cities, business hours indicator, and timezone meeting planner.' },
  { title: 'Flashcards', category: 'Developer', desc: 'Decks with spaced repetition. AI generates flashcards from any text.' },
  { title: 'P2P Chat', category: 'Developer', desc: 'Peer-to-peer encrypted chat via WebRTC. No servers. Disappears when you leave.' },
  { title: 'API Playground', category: 'Developer', desc: 'Test endpoints with request/response viewer, history, and AI explanation.' },
  { title: 'Color Palette', category: 'Developer', desc: 'Generate complementary, analogous, triadic palettes. CSS vars output.' },
  { title: 'Personal Wiki', category: 'Developer', desc: 'Markdown wiki with folders, page links, search, and AI summarization.' },
  { title: 'Regex Tester', category: 'Developer', desc: 'Live testing with match highlighting, group capture, and AI explainer.' },
  { title: 'Calculator', category: 'Developer', desc: 'Loan, compound interest, retirement, savings goal, and tax estimator.' },
];

const CATEGORIES = ['Personal', 'Productivity', 'Developer'];

export function LandingPage() {
  const [activeCategory, setActiveCategory] = useState('Personal');

  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const filtered = ALL_FEATURES.filter(f => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <span className="text-sm font-semibold tracking-tight">Helios</span>
          <div className="flex items-center gap-6">
            <a href="#features" onClick={scrollToFeatures} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Features</a>
            <a href="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Privacy</a>
            <Link to="/lists" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Lists</Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/login" className="text-sm px-4 py-2 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-32">
        <p className="text-xs font-medium text-muted-foreground mb-6 tracking-wide uppercase">
          {ALL_FEATURES.length} features · 100% local · Zero tracking
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1]">
          Your entire life,<br />
          <span className="text-muted-foreground">one private dashboard.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          Finance, trips, goals, daily planner, investments, news, dev tools — everything runs in your browser. No cloud. No accounts. No tracking.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/login" className="px-6 py-3 bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-colors">
            Get Started — It's Free
          </Link>
          <a href="#features" onClick={scrollToFeatures} className="px-6 py-3 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 font-medium text-sm transition-colors">
            Explore Features
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need</h2>
          <p className="text-muted-foreground">{ALL_FEATURES.length} features across personal, productivity, and developer tools.</p>
        </div>

        <div className="flex justify-center gap-1 mb-10 border border-border p-1 w-fit mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {filtered.map((feature) => (
            <div key={feature.title} className="bg-background p-6">
              <h3 className="font-medium text-foreground text-sm mb-1.5">{feature.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="px-6 py-24 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Privacy is the architecture</h2>
            <p className="text-muted-foreground">Not a feature. Not a toggle. The foundation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
            {[
              { title: 'Browser-native storage', desc: 'Everything lives in IndexedDB — your browser\'s built-in database. Close the tab, reopen it, your data is still there.' },
              { title: 'Encrypted secrets', desc: 'API keys are encrypted with AES-256-GCM derived from your password. Not even DevTools can read them.' },
              { title: 'Zero data collection', desc: 'No accounts to create. No email to provide. No analytics. No telemetry. There is no server to breach.' },
            ].map((item) => (
              <div key={item.title} className="bg-background p-8">
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">AI that respects your data</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bring your own Gemini API key. Unlock AI across every feature — trip planning, spending insights, portfolio analysis, resume scoring, and more. Your key stays encrypted on your device.
          </p>
          <p className="text-sm text-muted-foreground/60">No subscription. No data sharing. No black box.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-border text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Ready to get started?</h2>
        <Link to="/login" className="inline-block px-8 py-3 bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors">
          Open Helios
        </Link>
        <p className="mt-4 text-sm text-muted-foreground/60">Works in any modern browser. No install required.</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Helios</span>
          <span className="text-xs text-muted-foreground/60">Your data stays yours.</span>
        </div>
      </footer>
    </div>
  );
}
