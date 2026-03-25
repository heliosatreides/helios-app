import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const LISTS = [
  {
    id: 'indie-builders',
    title: 'Indie Builders',
    description: 'Solo founders and small teams shipping real products.',
    accounts: [
      { handle: 'levelsio', name: 'Pieter Levels', bio: 'Built Nomad List, Remote OK, PhotoAI. Ships fast, talks about revenue.', followers: '840K' },
      { handle: 'marckohlbrugge', name: 'Marc Köhlbrugge', bio: 'Built BetaList, WIP. Serial indie maker.', followers: '45K' },
      { handle: 'dannypostmaa', name: 'Danny Postma', bio: 'Built HeadshotPro, Headlime. AI products that make money.', followers: '85K' },
      { handle: 'taborein', name: 'Tony Dinh', bio: 'Indie hacker building multiple SaaS products. Transparent about revenue.', followers: '35K' },
      { handle: 'araboreli', name: 'Ara Ghougassian', bio: 'Building in public. Focuses on design + product.', followers: '12K' },
      { handle: 'yaborozhok', name: 'Yuriy Borozhok', bio: 'Full-stack indie dev. Ships and shares learnings.', followers: '8K' },
      { handle: 'jmcunst', name: 'Jon', bio: 'Building micro-SaaS products. Honest about failures.', followers: '15K' },
      { handle: 'coreyhainesco', name: 'Corey Haines', bio: 'Marketing for bootstrapped startups. Built Swipe Files.', followers: '32K' },
    ],
  },
  {
    id: 'ai-builders',
    title: 'AI Builders',
    description: 'People actually building with AI, not just talking about it.',
    accounts: [
      { handle: 'kaboroevich', name: 'Karo', bio: 'Building AI tools. Focused on practical applications.', followers: '22K' },
      { handle: 'swyx', name: 'Shawn Wang', bio: 'AI engineer, writer. Latent Space podcast. Deep technical takes.', followers: '120K' },
      { handle: 'simonw', name: 'Simon Willison', bio: 'Built Datasette. LLM tools. Prolific open source + AI writing.', followers: '95K' },
      { handle: 'emaboris12', name: 'Emmanuel', bio: 'AI/ML engineer building real products.', followers: '18K' },
      { handle: 'shl', name: 'Sahil Lavingia', bio: 'Gumroad founder. AI investor. Honest about startup life.', followers: '320K' },
      { handle: 'aaborge', name: 'Alex Albert', bio: 'Anthropic. Working on Claude. AI safety + capabilities.', followers: '45K' },
      { handle: 'karpathy', name: 'Andrej Karpathy', bio: 'Ex-Tesla AI, ex-OpenAI. AI education. Clear technical explanations.', followers: '900K' },
      { handle: 'sama', name: 'Sam Altman', bio: 'OpenAI CEO. Shapes the AI industry direction.', followers: '3.2M' },
    ],
  },
  {
    id: 'dev-twitter',
    title: 'Dev Twitter',
    description: 'Engineers who share real knowledge, not engagement bait.',
    accounts: [
      { handle: 'ThePrimeagen', name: 'ThePrimeagen', bio: 'Vim enthusiast. Streaming, content, and real engineering opinions.', followers: '290K' },
      { handle: 'taborey', name: 'Theo', bio: 'T3 stack. React, Next.js, TypeScript. Honest dev opinions.', followers: '180K' },
      { handle: 'kentcdodds', name: 'Kent C. Dodds', bio: 'Testing, React patterns. Epic React/Web. Teaches well.', followers: '250K' },
      { handle: 'dan_abramov', name: 'Dan Abramov', bio: 'React core team. Overreacted blog. Deep technical writing.', followers: '380K' },
      { handle: 'raaborewson', name: 'Ryan Florence', bio: 'Remix co-creator. React Router. Web standards advocate.', followers: '85K' },
      { handle: 'tanaborstack', name: 'Tanner Linsley', bio: 'TanStack (React Query, Router, Table). OSS powerhouse.', followers: '55K' },
      { handle: 'sophiebits', name: 'Sophie Alpert', bio: 'Ex-React team lead. Sharp engineering takes.', followers: '65K' },
      { handle: 'raborik', name: 'Rich Harris', bio: 'Svelte creator. NYT. Framework design thinker.', followers: '95K' },
    ],
  },
  {
    id: 'startup-founders',
    title: 'Startup Founders',
    description: 'Founders sharing the real journey, not the highlight reel.',
    accounts: [
      { handle: 'paulg', name: 'Paul Graham', bio: 'YC co-founder. Essays that shaped startup culture.', followers: '1.5M' },
      { handle: 'dhh', name: 'DHH', bio: 'Basecamp/HEY co-founder. Rails creator. Opinionated about everything.', followers: '450K' },
      { handle: 'jason', name: 'Jason Fried', bio: 'Basecamp/37signals CEO. Calm company philosophy.', followers: '360K' },
      { handle: 'paboratick_c', name: 'Patrick Collison', bio: 'Stripe CEO. Science, progress, infrastructure.', followers: '280K' },
      { handle: 'tobi', name: 'Tobi Lütke', bio: 'Shopify CEO. Long-term thinking. Platform builder.', followers: '180K' },
      { handle: 'naval', name: 'Naval Ravikant', bio: 'AngelList. Philosophies on wealth and happiness.', followers: '2.1M' },
      { handle: 'elaboron', name: 'Elon Musk', bio: 'Tesla, SpaceX, X. Controversial but shapes tech.', followers: '200M' },
      { handle: 'bgaborey', name: 'Ben Thompson', bio: 'Stratechery. Best tech business analysis out there.', followers: '120K' },
    ],
  },
  {
    id: 'design',
    title: 'Design & Product',
    description: 'Designers and product thinkers who raise the bar.',
    accounts: [
      { handle: 'raborael', name: 'Rasmus Andersson', bio: 'Inter typeface creator. Design tools. Type nerd.', followers: '75K' },
      { handle: 'linear_app', name: 'Linear', bio: 'The standard for product design quality in SaaS.', followers: '65K' },
      { handle: 'vercel', name: 'Vercel', bio: 'Next.js, design systems, developer experience.', followers: '350K' },
      { handle: 'stripe', name: 'Stripe', bio: 'Setting the bar for developer docs and design.', followers: '480K' },
      { handle: 'jaborulie_zhuo', name: 'Julie Zhuo', bio: 'Ex-Facebook VP Design. "The Making of a Manager." Clear design thinking.', followers: '180K' },
      { handle: 'brian_lovin', name: 'Brian Lovin', bio: 'Staff designer at GitHub. Design Details podcast.', followers: '45K' },
      { handle: 'lukew', name: 'Luke Wroblewski', bio: 'Mobile UX pioneer. Data-driven design insights.', followers: '290K' },
      { handle: 'jouborney', name: 'Midjourney', bio: 'AI art that redefined visual design discourse.', followers: '1.2M' },
    ],
  },
];

function AccountCard({ account }) {
  return (
    <a
      href={`https://x.com/${account.handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 border border-border hover:bg-secondary/30 transition-colors group"
    >
      <div className="w-10 h-10 bg-secondary text-foreground flex items-center justify-center text-sm font-medium shrink-0">
        {account.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground text-sm group-hover:underline">{account.name}</span>
          <span className="text-muted-foreground/60 text-xs">@{account.handle}</span>
        </div>
        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{account.bio}</p>
        <span className="text-muted-foreground/40 text-[11px] mt-1 block">{account.followers} followers</span>
      </div>
    </a>
  );
}

function ShareButton({ url, title }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      copy();
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={shareNative}
        className="px-3 py-1.5 border border-border text-muted-foreground text-xs hover:text-foreground hover:bg-secondary/50 transition-colors"
      >
        {copied ? 'Copied' : 'Share'}
      </button>
      <a
        href={`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 border border-border text-muted-foreground text-xs hover:text-foreground hover:bg-secondary/50 transition-colors"
      >
        Tweet
      </a>
    </div>
  );
}

export function ListsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeListId = searchParams.get('list');

  const activeList = useMemo(() => LISTS.find(l => l.id === activeListId), [activeListId]);

  const baseUrl = window.location.origin + '/lists';

  // Single list view
  if (activeList) {
    const listUrl = `${baseUrl}?list=${activeList.id}`;
    return (
      <div className="min-h-screen bg-background text-foreground">
        <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
          <Link to="/lists" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            All Lists
          </Link>
          <span className="text-sm font-semibold">Helios</span>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{activeList.title}</h1>
            <ShareButton url={listUrl} title={`${activeList.title} — Top X accounts curated by Helios`} />
          </div>
          <p className="text-muted-foreground text-sm mb-8">{activeList.description}</p>

          <div className="border border-border divide-y divide-border">
            {activeList.accounts.map((account, i) => (
              <div key={account.handle} className="flex items-center">
                <span className="w-10 text-center text-muted-foreground/40 text-xs font-mono shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <AccountCard account={account} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground/40 text-xs mb-3">Curated by Helios — the everything app for your life</p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Try Helios
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Index view — all lists
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Helios
        </Link>
        <span className="text-sm font-semibold">Curated Lists</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Top X Accounts</h1>
        <p className="text-muted-foreground mb-10">Curated lists of the best accounts to follow across tech, building, and design.</p>

        <div className="space-y-3">
          {LISTS.map((list) => (
            <button
              key={list.id}
              onClick={() => setSearchParams({ list: list.id })}
              className="w-full text-left border border-border p-5 hover:bg-secondary/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-foreground group-hover:underline">{list.title}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{list.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-muted-foreground/60 text-xs">{list.accounts.length} accounts</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground/40 text-xs">Built by Helios</p>
        </div>
      </div>
    </div>
  );
}
