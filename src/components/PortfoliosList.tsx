import { motion } from 'motion/react';
import { MapPin, User, Mail, MessageSquare, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  university: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  matric_number?: string | null;
  phone?: string | null;
  faculty?: string | null;
  department?: string | null;
}

export function PortfoliosList({ searchQuery = '', limit = 20 }: { searchQuery?: string, limit?: number }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(limit);
          
        if (searchQuery) {
          query = query.or(`full_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%,university.ilike.%${searchQuery}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setProfiles(data || []);
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchProfiles();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, limit]);

  if (loading) {
    return (
      <section className="py-12 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (profiles.length === 0) {
    return (
      <section className="py-24 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No portfolios found</h3>
          <p className="text-slate-600 dark:text-slate-400">Try adjusting your search terms.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative px-6 pt-8 pb-6 flex-1 flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 rounded-full border-4 border-slate-50 dark:border-slate-800 object-cover shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Student'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-10 h-10" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {profile.full_name || 'Anonymous Student'}
                </h3>
                
                {profile.university && (
                  <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{profile.university}</span>
                  </div>
                )}

                {profile.department && (
                  <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <span className="truncate">{profile.department}</span>
                  </div>
                )}

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 line-clamp-3">
                  {profile.bio || 'No bio provided.'}
                </p>

                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                    {profile.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg">
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 3 && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg">
                        +{profile.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto w-full flex flex-col gap-2">
                  {(profile.contact_email || profile.contact_phone) && (
                    <div className="flex gap-2">
                      {profile.contact_email && (
                        <a
                          href={`mailto:${profile.contact_email}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-300 hover:scale-105 border border-indigo-200 dark:border-indigo-500/20"
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {profile.contact_phone && (
                        <a
                          href={`https://wa.me/${profile.contact_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all duration-300 hover:scale-105 border border-emerald-200 dark:border-emerald-500/20"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                  <Link
                    to={`/u/${profile.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300 hover:scale-[1.02] shadow-sm"
                  >
                    View Portfolio
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
