import { useState } from 'react';
import { FeaturedPortfolios } from '../components/FeaturedPortfolios';
import { PortfoliosList } from '../components/PortfoliosList';
import { Search, LayoutGrid, Users } from 'lucide-react';

export function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'portfolios'>('portfolios');

  return (
    <main className="flex-1 bg-white dark:bg-[#0F172A] transition-colors duration-300">
      <div className="pt-16 pb-8 text-center px-4">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Explore
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 mb-8">
          Discover amazing portfolios and projects from students around the world.
        </p>
        
        <div className="max-w-2xl mx-auto relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={activeTab === 'portfolios' ? "Search by name, bio, or university..." : "Search by title, description, or category..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
          />
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setActiveTab('portfolios')}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeTab === 'portfolios'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Portfolios
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Projects
          </button>
        </div>
      </div>
      
      {activeTab === 'portfolios' ? (
        <PortfoliosList searchQuery={searchQuery} limit={20} />
      ) : (
        <FeaturedPortfolios searchQuery={searchQuery} limit={20} />
      )}
    </main>
  );
}
