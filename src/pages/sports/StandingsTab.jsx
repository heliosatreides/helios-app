import { useStandings } from '../../hooks/useStandings';

function NBAStandings({ standings, loading, error }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-[#27272a] rounded w-32 mb-3" />
            {[...Array(5)].map((_, j) => (
              <div key={j} className="flex gap-3 py-2 border-t border-[#1c1c20] first:border-0">
                <div className="h-3 bg-[#27272a] rounded flex-1" />
                <div className="h-3 bg-[#27272a] rounded w-12" />
                <div className="h-3 bg-[#27272a] rounded w-10" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl p-6 text-center">
        <p className="text-red-400 mb-1">Failed to load standings</p>
        <p className="text-[#71717a] text-sm">{error}</p>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return <p className="text-[#71717a] text-sm text-center py-8">No standings data available.</p>;
  }

  return (
    <div className="space-y-4">
      {standings.map((conf) => (
        <div key={conf.name} className="bg-[#0c0c0e] border border-[#1c1c20] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1c1c20]">
            <h3 className="text-[#e4e4e7] font-semibold text-sm">{conf.name}</h3>
          </div>
          <div>
            {/* Header */}
            <div className="flex items-center px-4 py-2 text-xs text-[#71717a] border-b border-[#1c1c20]">
              <span className="flex-1">Team</span>
              <span className="w-8 text-right">W</span>
              <span className="w-8 text-right">L</span>
              <span className="w-14 text-right">PCT</span>
            </div>
            {conf.teams.map((team, idx) => (
              <div
                key={team.teamId ?? idx}
                className="flex items-center px-4 py-2.5 border-t border-[#1c1c20] first:border-0 hover:bg-[#0a0a0b] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {team.logo && (
                    <img src={team.logo} alt={team.teamName} className="w-5 h-5 object-contain shrink-0" />
                  )}
                  <span className="text-sm text-[#e4e4e7] truncate">{team.teamName}</span>
                </div>
                <span className="w-8 text-right text-sm text-[#e4e4e7]">{team.wins}</span>
                <span className="w-8 text-right text-sm text-[#71717a]">{team.losses}</span>
                <span className="w-14 text-right text-sm text-[#71717a]">{team.winPctDisplay}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StandingsTab({ sport }) {
  const { standings, loading, error } = useStandings(sport);

  if (sport !== 'NBA') {
    return (
      <div className="text-center py-16 text-[#71717a]">
        <p className="text-3xl mb-3">🚧</p>
        <p className="font-medium text-[#e4e4e7]">{sport} Standings</p>
        <p className="text-sm mt-2">Coming soon — check back later!</p>
      </div>
    );
  }

  return <NBAStandings standings={standings} loading={loading} error={error} />;
}
