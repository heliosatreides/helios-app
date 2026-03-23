import { Link } from 'react-router-dom';

export function LandingPage() {
  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Smooth scroll */}
      <style>{`html { scroll-behavior: smooth; }`}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <span className="text-xl font-bold text-[#e4e4e7]">Helios ☀️</span>
        <Link
          to="/login"
          className="text-sm text-[#a1a1aa] hover:text-[#e4e4e7] transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-28 overflow-hidden">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <h1
          className="relative text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Your life, organized.<br />No cloud required.
        </h1>

        <p className="relative mt-6 text-lg text-[#a1a1aa] max-w-2xl leading-relaxed">
          Helios is a personal everything app that lives entirely in your browser.
          Trip planning, personal finance, investments, live sports — all in one place, all yours.
        </p>

        <div className="relative mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl font-semibold text-[#0a0a0b] transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#f59e0b' }}
          >
            Get Started — It's Free
          </Link>
          <a
            href="#features"
            onClick={scrollToFeatures}
            className="px-6 py-3 rounded-xl font-semibold border border-[#27272a] text-[#e4e4e7] hover:border-[#3f3f46] transition-colors"
          >
            See What's Inside ↓
          </a>
        </div>
      </section>

      {/* Privacy callout banner */}
      <div className="bg-amber-950/30 border-y border-amber-900/40 px-6 py-4 text-center text-sm sm:text-base">
        🔒 <strong className="text-[#fcd34d]">100% local. Zero servers. Zero tracking.</strong>{' '}
        <span className="text-[#a1a1aa]">Your data never leaves your device. Not even to us.</span>
      </div>

      {/* Features grid */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Everything you need, nothing you don't</h2>
        <p className="text-center text-[#a1a1aa] mb-12">Four powerful tools. One private app.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: '✈️',
              title: 'Trip Planning',
              desc: 'Build day-by-day itineraries, track your budget, and log activities. From weekend getaways to month-long adventures.',
            },
            {
              icon: '💰',
              title: 'Personal Finance',
              desc: 'Track accounts, log transactions, and set monthly budgets by category. Know exactly where your money goes.',
            },
            {
              icon: '📈',
              title: 'Investments',
              desc: 'Monitor your portfolio with live prices, track gain/loss, and document your investment strategy. Bring your own AI key for analysis.',
            },
            {
              icon: '🏆',
              title: 'Sports Hub',
              desc: 'Live scores across NBA, NFL, MLB, NHL, and MLS. Favorite your teams and see only the games you care about.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-[#111113] border border-[#27272a] rounded-2xl p-6 flex flex-col gap-3"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="font-bold text-[#e4e4e7]">{feature.title}</h3>
              <p className="text-sm text-[#71717a] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy deep-dive */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Privacy isn't a feature. It's the foundation.</h2>
        <p className="text-center text-[#a1a1aa] mb-12">Built from the ground up to keep your data yours.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: '🗄️',
              title: 'Stored in your browser',
              desc: 'Everything is saved in IndexedDB — your browser\'s built-in database. Close the tab, reopen it, your data is still there.',
            },
            {
              icon: '🔐',
              title: 'Encrypted at rest',
              desc: 'Sensitive data like API keys are encrypted with AES-256-GCM using your password. Not even DevTools can read them.',
            },
            {
              icon: '🚫',
              title: 'No accounts, no tracking',
              desc: 'There\'s no server to breach. No email to harvest. No analytics to sell. Just you and your data.',
            },
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            AI that works for you —<br className="hidden sm:block" /> not the other way around.
          </h2>
          <p className="text-[#a1a1aa] leading-relaxed mb-4">
            Bring your own Gemini API key and unlock AI-powered suggestions across the app:
            trip activity ideas, spending insights, portfolio analysis.
            Your key is encrypted locally and only used when you ask.
          </p>
          <p className="text-sm text-[#52525b] font-medium">
            No subscription. No data sharing. No black box.
          </p>
        </div>
      </section>

      {/* CTA footer strip */}
      <section className="px-6 py-24 text-center max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8">Ready to get started?</h2>
        <Link
          to="/login"
          className="inline-block px-8 py-4 rounded-xl font-semibold text-[#0a0a0b] text-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#f59e0b' }}
        >
          Open Helios →
        </Link>
        <p className="mt-4 text-sm text-[#52525b]">Works in any modern browser. No install required.</p>
      </section>
    </div>
  );
}
