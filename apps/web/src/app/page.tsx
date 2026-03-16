/**
 * ExitStorm Dashboard — Landing Page
 */

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            ⚡ ExitStorm
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Community-powered micro-SaaS exit machine. Ideas → financial models → build → exit.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Active Builders', value: '—', icon: '👥' },
            { label: 'Projects in Pipeline', value: '—', icon: '📋' },
            { label: 'Total Exits', value: '0', icon: '🎯' },
            { label: 'Points Distributed', value: '—', icon: '⭐' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/leaderboard"
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-teal-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">🏆 Leaderboard</h2>
            <p className="text-gray-400">Top contributors ranked by points</p>
          </a>

          <a
            href="/projects"
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-teal-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">📊 Projects</h2>
            <p className="text-gray-400">Active projects and pipeline</p>
          </a>

          <a
            href="/analytics"
            className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-teal-500 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">📈 Analytics</h2>
            <p className="text-gray-400">Financial models and exit tracking</p>
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600 text-sm">
          <p>ExitStorm · Built on the OpenClaw Discord · MIT License</p>
        </footer>
      </div>
    </main>
  );
}
