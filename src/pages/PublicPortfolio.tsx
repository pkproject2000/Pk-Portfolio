import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { User, MapPin, Link as LinkIcon, Download, Loader2, FileText, Image as ImageIcon, Share2, Check, Mail, Twitter, Linkedin, Facebook } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  university: string | null;
  contact_email?: string | null;
  matric_number?: string | null;
  phone?: string | null;
  faculty?: string | null;
  department?: string | null;
  resume_url?: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  link: string | null;
  thumbnail_url: string | null;
  assets: string[] | null;
  created_at: string;
}

export function PublicPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const resumeRef = useRef<HTMLDivElement>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.contact_email) {
      setSubmitError("This user hasn't provided a contact email.");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          toEmail: profile.contact_email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitSuccess(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownloadResume = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: profile?.full_name ? `${profile.full_name}_Resume` : 'Resume',
  });

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!username) return;
      setLoading(true);
      try {
        // Find user by full_name matching username (or we can assume username is ID for now, let's assume username is the full_name without spaces for simplicity, or we can just search by ID if username is a UUID)
        // Since we don't have a username field in profiles, let's assume the route is /u/:id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', username)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', username)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
      } catch (err: any) {
        console.error('Error fetching portfolio:', err);
        setError('Portfolio not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [username]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0B1120]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0B1120]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Portfolio Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400">The user you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-10 dark:opacity-20" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                {profile.full_name || 'Anonymous User'}
              </h1>
              
              {profile.university && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 dark:text-slate-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.university}</span>
                </div>
              )}

              {(profile.faculty || profile.department) && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 dark:text-slate-400 mb-2">
                  <span>{profile.faculty}{profile.faculty && profile.department ? ' - ' : ''}{profile.department}</span>
                </div>
              )}

              {profile.matric_number && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-600 dark:text-slate-400 mb-4">
                  <span className="font-medium">Matric No:</span>
                  <span>{profile.matric_number}</span>
                </div>
              )}
              
              <p className="text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-6">
                {profile.bio || 'No bio provided.'}
              </p>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-8">
                {profile.skills?.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-medium rounded-full ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-400/20">
                    {skill}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                {profile.contact_email && (
                  <a
                    href={`mailto:${profile.contact_email}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors shadow-md hover:shadow-lg"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Me
                  </a>
                )}
                {profile.resume_url ? (
                  <a
                    href={profile.resume_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download Resume
                  </a>
                ) : (
                  <button
                    onClick={() => handleDownloadResume()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md hover:shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download Resume
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Share Portfolio'}
                </button>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Share on:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${profile.full_name || 'this student'}'s portfolio on StudentFolio!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-[#1DA1F2] hover:text-white hover:border-transparent transition-all duration-300 hover:scale-110 border border-slate-200 dark:border-slate-700"
                    title="Share on Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-[#0A66C2] hover:text-white hover:border-transparent transition-all duration-300 hover:scale-110 border border-slate-200 dark:border-slate-700"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-[#1877F2] hover:text-white hover:border-transparent transition-all duration-300 hover:scale-110 border border-slate-200 dark:border-slate-700"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Check out ${profile.full_name || 'this student'}'s portfolio!`)}&body=${encodeURIComponent(`I thought you might be interested in seeing this portfolio:\n\n${window.location.href}`)}`}
                    className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-transparent transition-all duration-300 hover:scale-110 border border-slate-200 dark:border-slate-700"
                    title="Share via Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Portfolio Projects
          </h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
              <p className="text-slate-500 dark:text-slate-400">No projects to display yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map(project => (
                <div key={project.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                  <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    {project.thumbnail_url ? (
                      <img 
                        src={project.thumbnail_url} 
                        alt={project.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-12 h-12 opacity-30 transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}
                    {project.category && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm">
                          {project.category}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 flex-1 line-clamp-3">
                      {project.description}
                    </p>
                    
                    {project.link && (
                      <a 
                        href={project.link} 
                        className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700 mb-3"
                      >
                        <LinkIcon className="w-4 h-4" />
                        View Project
                      </a>
                    )}
                    
                    {project.assets && project.assets.length > 0 && (
                      <div className="space-y-2">
                        {project.assets.map((url, index) => (
                          <a 
                            key={index}
                            href={url} 
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-medium rounded-xl transition-colors border border-indigo-200 dark:border-indigo-500/30"
                          >
                            <Download className="w-4 h-4" />
                            Download Asset {project.assets!.length > 1 ? index + 1 : ''}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Form Section */}
        {profile.contact_email && (
          <div className="mt-16 bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Mail className="w-6 h-6 text-indigo-500" />
              Get in Touch
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Send a message directly to {profile.full_name || 'this student'}.
            </p>

            {submitSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Message Sent!</h3>
                <p className="text-emerald-600 dark:text-emerald-400">
                  Your message has been successfully sent to {profile.full_name || 'the portfolio owner'}.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                {submitError && (
                  <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {submitError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Email</label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Opportunity: Freelance Project"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="Hi there, I loved your portfolio and would like to..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Hidden Printable Resume */}
      <div style={{ display: 'none' }}>
        <div ref={resumeRef} className="p-12 bg-white text-black max-w-4xl mx-auto font-sans">
          <div className="border-b-2 border-slate-800 pb-6 mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">{profile.full_name || 'Anonymous User'}</h1>
            {profile.university && <p className="text-xl text-slate-600">{profile.university}</p>}
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold border-b border-slate-300 pb-2 mb-4 uppercase tracking-wider text-slate-800">Professional Summary</h2>
            <p className="text-slate-700 leading-relaxed">{profile.bio || 'No summary provided.'}</p>
          </div>
          
          {profile.skills && profile.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold border-b border-slate-300 pb-2 mb-4 uppercase tracking-wider text-slate-800">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-slate-100 border border-slate-300 rounded text-slate-800 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {projects.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold border-b border-slate-300 pb-2 mb-4 uppercase tracking-wider text-slate-800">Selected Projects</h2>
              <div className="space-y-6">
                {projects.map(project => (
                  <div key={project.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
                      <span className="text-sm font-medium text-slate-500">{project.category}</span>
                    </div>
                    {project.link && <p className="text-sm text-indigo-600 mb-2">{project.link}</p>}
                    <p className="text-slate-700">{project.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
