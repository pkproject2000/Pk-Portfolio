import { motion } from 'motion/react';
import { ExternalLink, MapPin, User, Image as ImageIcon, Mail, MessageSquare } from 'lucide-react';
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

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  user_id: string;
  profile?: Profile | null;
}

export function FeaturedPortfolios({ searchQuery = '', limit = 6 }: { searchQuery?: string, limit?: number }) {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectsAndProfiles = async () => {
      try {
        setLoading(true);
        // Fetch latest projects
        let query = supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
        }
        
        const { data: projectsData, error: projectsError } = await query;
        
        if (projectsError) throw projectsError;
        
        if (!projectsData || projectsData.length === 0) {
          setFeaturedProjects([]);
          return;
        }

        // Fetch corresponding profiles
        const userIds = [...new Set(projectsData.map(p => p.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;

        // Combine data
        const combinedData = projectsData.map(project => ({
          ...project,
          profile: profilesData?.find(p => p.id === project.user_id) || null
        }));

        setFeaturedProjects(combinedData);
      } catch (err) {
        console.error('Error fetching featured projects:', err);
      } finally {
        setLoading(false);
      }
    };

    // Add a small debounce for search
    const timeoutId = setTimeout(() => {
      fetchProjectsAndProfiles();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, limit]);

  if (loading) {
    return (
      <section className="py-24 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Featured Projects
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Loading amazing projects...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredProjects.length === 0) {
    if (searchQuery) {
      return (
        <section className="py-24 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              No projects found
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Try adjusting your search query.
            </p>
          </div>
        </section>
      );
    }
    return null; // Hide section if no projects exist yet and not searching
  }

  return (
    <section className="py-24 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Featured Projects
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Explore exceptional work from top students across various disciplines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-12 h-12 opacity-30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                {project.category && (
                  <div className="absolute top-4 right-4 z-20">
                    <span className="inline-flex items-center rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm">
                      {project.category}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="relative px-6 pb-6 pt-12 flex-1 flex flex-col">
                <div className="absolute -top-10 left-6 z-20">
                  {project.profile?.avatar_url ? (
                    <img
                      src={project.profile.avatar_url}
                      alt={project.profile.full_name || 'Student'}
                      className="w-16 h-16 rounded-xl border-4 border-white dark:border-slate-900 object-cover shadow-md bg-white dark:bg-slate-800"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-4 border-white dark:border-slate-900 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {project.profile?.full_name || 'Anonymous Student'}
                    </span>
                    {project.profile?.university && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-xs truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{project.profile.university}</span>
                        </span>
                      </>
                    )}
                    {project.profile?.department && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-xs truncate">
                          <span className="truncate">{project.profile.department}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 line-clamp-3">
                  {project.description || 'No description provided.'}
                </p>

                <div className="mt-auto flex flex-col gap-2">
                  {(project.profile?.contact_email || project.profile?.contact_phone) && (
                    <div className="flex gap-2">
                      {project.profile?.contact_email && (
                        <a
                          href={`mailto:${project.profile.contact_email}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all duration-300 hover:scale-105 border border-indigo-200 dark:border-indigo-500/20"
                          title="Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {project.profile?.contact_phone && (
                        <a
                          href={`https://wa.me/${project.profile.contact_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all duration-300 hover:scale-105 border border-emerald-200 dark:border-emerald-500/20"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                  <Link
                    to={`/u/${project.user_id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] border border-slate-200 dark:border-slate-700"
                  >
                    View Profile
                    <User className="w-4 h-4" />
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
