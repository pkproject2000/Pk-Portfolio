import { useState, useEffect, FormEvent, KeyboardEvent } from 'react';
import { User, FileText, Plus, LayoutGrid, List as ListIcon, X, CircleCheck, Loader2, Link as LinkIcon, Image as ImageIcon, ExternalLink, Copy, Check, Download, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence } from 'motion/react';
import { UploadManager } from '../components/UploadManager';
import { MultiUploadManager } from '../components/MultiUploadManager';

const parseFileUrls = (fileUrl: string | null): string[] => {
  if (!fileUrl) return [];
  try {
    const parsed = JSON.parse(fileUrl);
    return Array.isArray(parsed) ? parsed : [fileUrl];
  } catch (e) {
    return [fileUrl];
  }
};

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
  collaborator_emails: string[] | null;
  created_at: string;
  updated_at?: string;
}

export function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  
  // Profile State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [university, setUniversity] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // UI State
  const [isFetching, setIsFetching] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc'>('created_desc');
  
  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortBy) {
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      case 'created_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'created_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'updated_asc':
        return new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime();
      case 'updated_desc':
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
      default:
        return 0;
    }
  });
  
  // New/Edit Project Form State
  const [newProject, setNewProject] = useState({ title: '', description: '', category: '', link: '', thumbnail_url: '', assets: [] as string[], collaborator_emails: [] as string[] });
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isResetProfileModalOpen, setIsResetProfileModalOpen] = useState(false);
  const [isDeleteProfileModalOpen, setIsDeleteProfileModalOpen] = useState(false);

  const COMMON_CATEGORIES = [
    'Web Development',
    'Mobile App',
    'UI/UX Design',
    'Data Science',
    'Machine Learning',
    'Game Development',
    'DevOps',
    'Cybersecurity'
  ];

  // Debounced values for auto-save
  const debouncedFullName = useDebounce(fullName, 500);
  const debouncedBio = useDebounce(bio, 500);
  const debouncedSkills = useDebounce(skills, 500);
  const debouncedUniversity = useDebounce(university, 500);
  const debouncedContactEmail = useDebounce(contactEmail, 500);
  const debouncedMatricNumber = useDebounce(matricNumber, 500);
  const debouncedPhone = useDebounce(phone, 500);
  const debouncedFaculty = useDebounce(faculty, 500);
  const debouncedDepartment = useDebounce(department, 500);
  const debouncedResumeUrl = useDebounce(resumeUrl, 500);

  const handleCopyLink = async () => {
    if (!user) return;
    const url = `${window.location.origin}/u/${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsFetching(true);
      try {
        // Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        
        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.full_name || '');
          setBio(profileData.bio || '');
          setSkills(profileData.skills || []);
          setAvatarUrl(profileData.avatar_url || '');
          setUniversity(profileData.university || '');
          setContactEmail(profileData.contact_email || '');
          setMatricNumber(profileData.matric_number || '');
          setPhone(profileData.phone || '');
          setFaculty(profileData.faculty || '');
          setDepartment(profileData.department || '');
          setResumeUrl(profileData.resume_url || '');
        } else {
          // Fallback to user metadata if profile hasn't been created yet (race condition)
          const metadata = user.user_metadata || {};
          setProfile({
            id: user.id,
            full_name: metadata.full_name || metadata.name || '',
            avatar_url: metadata.avatar_url || metadata.picture || '',
            bio: '',
            university: '',
            contact_email: user.email || '',
            matric_number: metadata.matric_number || '',
            phone: metadata.phone || '',
            faculty: metadata.faculty || '',
            department: metadata.department || '',
            resume_url: '',
            skills: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setFullName(metadata.full_name || metadata.name || '');
          setAvatarUrl(metadata.avatar_url || metadata.picture || '');
          setContactEmail(user.email || '');
          setMatricNumber(metadata.matric_number || '');
          setPhone(metadata.phone || '');
          setFaculty(metadata.faculty || '');
          setDepartment(metadata.department || '');
          setResumeUrl('');
        }

        // Fetch Projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        if (projectsData) setProjects(projectsData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Auto-save effect
  useEffect(() => {
    if (!user || isFetching || !profile) return;

    // Check if values actually changed from the original profile
    const hasChanged = 
      debouncedFullName !== (profile.full_name || '') ||
      debouncedBio !== (profile.bio || '') ||
      JSON.stringify(debouncedSkills) !== JSON.stringify(profile.skills || []) ||
      avatarUrl !== (profile.avatar_url || '') ||
      debouncedUniversity !== (profile.university || '') ||
      debouncedContactEmail !== (profile.contact_email || '') ||
      debouncedMatricNumber !== (profile.matric_number || '') ||
      debouncedPhone !== (profile.phone || '') ||
      debouncedFaculty !== (profile.faculty || '') ||
      debouncedDepartment !== (profile.department || '') ||
      debouncedResumeUrl !== (profile.resume_url || '');

    if (!hasChanged) return;

    const saveProfile = async () => {
      setSaveStatus('saving');
      try {
        const updatePromise = supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: debouncedFullName,
            bio: debouncedBio,
            skills: debouncedSkills,
            avatar_url: avatarUrl,
            university: debouncedUniversity,
            contact_email: debouncedContactEmail,
            matric_number: debouncedMatricNumber,
            phone: debouncedPhone,
            faculty: debouncedFaculty,
            department: debouncedDepartment,
            resume_url: debouncedResumeUrl,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        let timeoutId: any;
        const timeoutPromise = new Promise<{ error: any }>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Save timed out')), 15000);
        });

        try {
          const { error } = await Promise.race([updatePromise, timeoutPromise]);
          if (error) throw error;
        } finally {
          clearTimeout(timeoutId);
        }
        
        setProfile(prev => prev ? {
          ...prev,
          full_name: debouncedFullName,
          bio: debouncedBio,
          skills: debouncedSkills,
          avatar_url: avatarUrl,
          university: debouncedUniversity,
          contact_email: debouncedContactEmail,
          matric_number: debouncedMatricNumber,
          phone: debouncedPhone,
          faculty: debouncedFaculty,
          department: debouncedDepartment,
          resume_url: debouncedResumeUrl
        } : {
          id: user.id,
          full_name: debouncedFullName,
          bio: debouncedBio,
          skills: debouncedSkills,
          avatar_url: avatarUrl,
          university: debouncedUniversity,
          contact_email: debouncedContactEmail,
          matric_number: debouncedMatricNumber,
          phone: debouncedPhone,
          faculty: debouncedFaculty,
          department: debouncedDepartment,
          resume_url: debouncedResumeUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        console.error('Error saving profile:', error);
        setSaveStatus('error');
      }
    };

    saveProfile();
  }, [debouncedFullName, debouncedBio, debouncedSkills, avatarUrl, debouncedUniversity, debouncedContactEmail, debouncedMatricNumber, debouncedPhone, debouncedFaculty, debouncedDepartment, debouncedResumeUrl, user?.id, isFetching, profile]);

  const handleAddSkill = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleAddCollaborator = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && collaboratorInput.trim()) {
      e.preventDefault();
      const email = collaboratorInput.trim();
      // Basic email validation
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !newProject.collaborator_emails.includes(email)) {
        setNewProject({ ...newProject, collaborator_emails: [...newProject.collaborator_emails, email] });
      }
      setCollaboratorInput('');
    }
  };

  const handleRemoveCollaborator = (emailToRemove: string) => {
    setNewProject({
      ...newProject,
      collaborator_emails: newProject.collaborator_emails.filter(email => email !== emailToRemove)
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const updatePromise = supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          bio: bio,
          skills: skills,
          avatar_url: avatarUrl,
          university: university,
          contact_email: contactEmail,
          matric_number: matricNumber,
          phone: phone,
          faculty: faculty,
          department: department,
          resume_url: resumeUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      let timeoutId: any;
      const timeoutPromise = new Promise<{ error: any }>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Save timed out')), 15000);
      });

      try {
        const { error } = await Promise.race([updatePromise, timeoutPromise]);
        if (error) throw error;
      } finally {
        clearTimeout(timeoutId);
      }
      
      setProfile(prev => prev ? {
        ...prev,
        full_name: fullName,
        bio: bio,
        skills: skills,
        avatar_url: avatarUrl,
        university: university,
        contact_email: contactEmail,
        matric_number: matricNumber,
        phone: phone,
        faculty: faculty,
        department: department,
        resume_url: resumeUrl
      } : {
        id: user.id,
        full_name: fullName,
        bio: bio,
        skills: skills,
        avatar_url: avatarUrl,
        university: university,
        contact_email: contactEmail,
        matric_number: matricNumber,
        phone: phone,
        faculty: faculty,
        department: department,
        resume_url: resumeUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
    }
  };

  const handleSubmitProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmittingProject(true);
    try {
      if (editingProject) {
        const { data, error } = await supabase
          .from('projects')
          .update({
            ...newProject,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProject.id)
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setProjects(projects.map(p => p.id === editingProject.id ? data : p));
          setIsProjectModalOpen(false);
          setEditingProject(null);
          setNewProject({ title: '', description: '', category: '', link: '', thumbnail_url: '', assets: [], collaborator_emails: [] });
        }
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert([
            {
              user_id: user.id,
              ...newProject,
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setProjects([data, ...projects]);
          setIsProjectModalOpen(false);
          setNewProject({ title: '', description: '', category: '', link: '', thumbnail_url: '', assets: [], collaborator_emails: [] });
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;
      
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleResetProfile = async () => {
    if (!user) return;
    try {
      setSaveStatus('saving');
      const resetData = {
        full_name: '',
        bio: '',
        skills: [],
        avatar_url: '',
        university: '',
        contact_email: '',
        matric_number: '',
        phone: '',
        faculty: '',
        department: '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(resetData)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...resetData } : null);
      setFullName('');
      setBio('');
      setSkills([]);
      setAvatarUrl('');
      setUniversity('');
      setContactEmail('');
      setMatricNumber('');
      setPhone('');
      setFaculty('');
      setDepartment('');
      setResumeUrl('');
      
      setIsResetProfileModalOpen(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error resetting profile:', error);
      setSaveStatus('error');
      alert('Failed to reset profile.');
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    try {
      // Delete all projects first
      const { error: projectsError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', user.id);

      if (projectsError) throw projectsError;

      // Delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Note: We can't delete the user from auth.users directly from the client side 
      // due to Supabase security restrictions. We would need an Edge Function or 
      // server-side code for that. For now, we just delete their data and sign them out.

      setIsDeleteProfileModalOpen(false);
      await signOut(); // Use the signOut function from AuthContext
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete profile. Please try again.');
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      title: project.title,
      description: project.description || '',
      category: project.category || '',
      link: project.link || '',
      thumbnail_url: project.thumbnail_url || '',
      assets: project.assets || [],
      collaborator_emails: project.collaborator_emails || []
    });
    
    if (project.category && !COMMON_CATEGORIES.includes(project.category)) {
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
    }
    
    setIsProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
    setNewProject({ title: '', description: '', category: '', link: '', thumbnail_url: '', assets: [], collaborator_emails: [] });
    setCollaboratorInput('');
    setIsCustomCategory(false);
  };

  if (authLoading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="flex-1 bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your profile and portfolio projects.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Copy Portfolio Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <Link 
              to={`/u/${user.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <User className="w-4 h-4" />
              View Public Page
            </Link>
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Auto-Save Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <div className="p-6 pt-0 relative">
                <div className="flex items-center justify-between mb-6 pt-4">
                  <div className="flex items-end gap-4 -mt-12 relative z-10">
                    <div className="shrink-0">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-900 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm">
                          <User className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="mb-1">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        Your Profile
                      </h2>
                    </div>
                  </div>
                  
                  {/* Save Status Indicator */}
                <AnimatePresence mode="wait">
                  {saveStatus === 'saving' && (
                    <motion.div 
                      key="saving"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </motion.div>
                  )}
                  {saveStatus === 'saved' && (
                    <motion.div 
                      key="saved"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <CircleCheck className="w-3.5 h-3.5" />
                      Changes saved
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isFetching ? (
                <div className="space-y-4">
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Profile Picture
                    </label>
                    <div className="flex-1">
                      <UploadManager 
                        onUploadStart={() => setIsUploadingAvatar(true)}
                        onUploadError={() => setIsUploadingAvatar(false)}
                        onClear={() => {
                          setAvatarUrl('');
                          setIsUploadingAvatar(false);
                        }}
                        onUploadComplete={(url) => {
                          setAvatarUrl(url);
                          setIsUploadingAvatar(false);
                        }}
                        bucketName="portfolios"
                        folderPath={`avatars/${user?.id}`}
                        acceptedFormats={{
                          'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif']
                        }}
                      />
                      {avatarUrl && (
                        <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CircleCheck className="w-4 h-4" /> Profile picture uploaded successfully
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={handleSaveProfile}
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                    />
                  </div>

                  <div>
                    <label htmlFor="university" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      University/Institution
                    </label>
                    <input
                      type="text"
                      id="university"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      onBlur={handleSaveProfile}
                      placeholder="e.g. Stanford University"
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                    />
                  </div>

                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Email (Public)
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      onBlur={handleSaveProfile}
                      placeholder="e.g. hello@example.com"
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                    />
                  </div>

                  <div>
                    <label htmlFor="matricNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Matric Number
                    </label>
                    <input
                      type="text"
                      id="matricNumber"
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      onBlur={handleSaveProfile}
                      placeholder="e.g. CSC/2020/001"
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={handleSaveProfile}
                      placeholder="e.g. +234..."
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                    />
                  </div>

                  <div>
                    <label htmlFor="faculty" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Faculty
                    </label>
                    <select
                      id="faculty"
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      onBlur={handleSaveProfile}
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                    >
                      <option value="" disabled>Select faculty</option>
                      <option value="Science">Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Arts">Arts</option>
                      <option value="Social Sciences">Social Sciences</option>
                      <option value="Business">Business</option>
                      <option value="Law">Law</option>
                      <option value="Medicine">Medicine</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      onBlur={handleSaveProfile}
                      placeholder="e.g. Computer Science"
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Resume / CV (PDF)
                    </label>
                    <UploadManager
                      bucketName="portfolios"
                      folderPath={`resumes/${user.id}`}
                      onUploadComplete={(url) => {
                        setResumeUrl(url);
                        // We need to save the profile immediately after upload
                        supabase.from('profiles').update({ resume_url: url }).eq('id', user.id).then(() => {
                          setSaveStatus('saved');
                          setTimeout(() => setSaveStatus('idle'), 3000);
                        });
                      }}
                      acceptedFormats={{
                        'application/pdf': ['.pdf']
                      }}
                    />
                    {resumeUrl && (
                      <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CircleCheck className="w-4 h-4" /> Resume uploaded successfully
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      onBlur={handleSaveProfile}
                      placeholder="Tell us about yourself..."
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <AnimatePresence>
                        {skills.map((skill) => (
                          <motion.span
                            key={skill}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-400/20"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="group relative -mr-1 h-4 w-4 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-500/20 transition-colors"
                            >
                              <span className="sr-only">Remove {skill}</span>
                              <X className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-700 dark:text-indigo-400" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <input
                      type="text"
                      id="skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Type a skill and press Enter..."
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                    />
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200 dark:border-slate-800 mt-6">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsResetProfileModalOpen(true)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeleteProfileModalOpen(true)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saveStatus === 'saving'}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveStatus === 'saving' ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : (
                        'Save Profile'
                      )}
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Right Column: Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Your Projects
              </h2>
              
              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="block rounded-lg border-0 px-3 py-1.5 pr-8 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-900"
                >
                  <option value="created_desc">Newest First</option>
                  <option value="created_asc">Oldest First</option>
                  <option value="updated_desc">Recently Updated</option>
                  <option value="updated_asc">Least Recently Updated</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="title_desc">Title (Z-A)</option>
                </select>

                {/* Layout Toggle */}
                <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    aria-label="List view"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {isFetching ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 h-64 animate-pulse">
                    <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
                    <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center border-dashed">
                <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No projects yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">Get started by adding your first project to showcase your skills and experience.</p>
                <button 
                  onClick={() => setIsProjectModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add First Project
                </button>
              </div>
            ) : (
              <motion.div 
                layout
                className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
              >
                <AnimatePresence>
                  {sortedProjects.map((project) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={project.id}
                      className={`group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all duration-300 ${viewMode === 'list' ? 'flex flex-row items-center p-3 gap-4' : 'flex flex-col'}`}
                    >
                      {/* Project Thumbnail */}
                      <div className={`${viewMode === 'list' ? 'w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-xl' : 'w-full aspect-video'} bg-slate-100 dark:bg-slate-800 relative overflow-hidden`}>
                        {project.thumbnail_url ? (
                          <img 
                            src={project.thumbnail_url} 
                            alt={project.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                          </div>
                        )}
                        {project.category && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-200/50 dark:ring-slate-700/50">
                              {project.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Project Info */}
                      <div className={`${viewMode === 'list' ? 'py-2 pr-2' : 'p-5'} flex-1 flex flex-col`}>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                          {project.description || 'No description provided.'}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-400">
                              {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </span>
                            {project.collaborator_emails && project.collaborator_emails.length > 0 && (
                              <div className="flex -space-x-2 overflow-hidden" title={project.collaborator_emails.join(', ')}>
                                {project.collaborator_emails.slice(0, 3).map((email, i) => (
                                  <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-medium text-indigo-600 dark:text-indigo-300">
                                    {email.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {project.collaborator_emails.length > 3 && (
                                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                    +{project.collaborator_emails.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditModal(project)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                              title="Edit Project"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setProjectToDelete(project)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                            {(project.assets || []).map((url, index) => (
                              <a 
                                key={index}
                                href={url} 
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Asset {(project.assets || []).length > 1 ? index + 1 : ''}
                              </a>
                            ))}
                            {project.link && (
                              <a 
                                href={project.link} 
                                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Project Modal */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProjectModal}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          />
        )}
        {isProjectModalOpen && (
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>
              <button 
                onClick={closeProjectModal}
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitProject} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Title *</label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={newProject.title}
                    onChange={e => setNewProject({...newProject, title: e.target.value})}
                    className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                  {!isCustomCategory ? (
                    <select
                      id="category"
                      value={newProject.category}
                      onChange={e => {
                        if (e.target.value === 'Other (Custom)') {
                          setIsCustomCategory(true);
                          setNewProject({...newProject, category: ''});
                        } else {
                          setNewProject({...newProject, category: e.target.value});
                        }
                      }}
                      className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950"
                    >
                      <option value="">Select a category...</option>
                      {COMMON_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Other (Custom)">Other (Custom)...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="category"
                        placeholder="Type custom category..."
                        value={newProject.category}
                        onChange={e => setNewProject({...newProject, category: e.target.value})}
                        autoFocus
                        className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setNewProject({...newProject, category: ''});
                        }}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea
                    id="desc"
                    rows={3}
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="link" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Link (URL)</label>
                  <input
                    type="url"
                    id="link"
                    placeholder="https://"
                    value={newProject.link}
                    onChange={e => setNewProject({...newProject, link: e.target.value})}
                    className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label htmlFor="collaborators" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Collaborators (Emails)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <AnimatePresence>
                      {newProject.collaborator_emails.map((email) => (
                        <motion.span
                          key={email}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-400/20"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => handleRemoveCollaborator(email)}
                            className="group relative -mr-1 h-4 w-4 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-500/20 transition-colors"
                          >
                            <span className="sr-only">Remove {email}</span>
                            <X className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-700 dark:text-indigo-400" />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                  <input
                    type="email"
                    id="collaborators"
                    value={collaboratorInput}
                    onChange={(e) => setCollaboratorInput(e.target.value)}
                    onKeyDown={handleAddCollaborator}
                    placeholder="Type an email and press Enter..."
                    className="block w-full rounded-lg border-0 px-3 py-2 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white dark:bg-slate-950 transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Thumbnail</label>
                  {!newProject.thumbnail_url ? (
                    <UploadManager 
                      onUploadStart={() => setIsUploadingThumbnail(true)}
                      onUploadError={() => setIsUploadingThumbnail(false)}
                      onClear={() => {
                        setNewProject({...newProject, thumbnail_url: ''});
                        setIsUploadingThumbnail(false);
                      }}
                      onUploadComplete={(url) => {
                        setNewProject({...newProject, thumbnail_url: url});
                        setIsUploadingThumbnail(false);
                      }} 
                    />
                  ) : (
                    <div className="relative w-full max-w-md mx-auto aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={newProject.thumbnail_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setNewProject({...newProject, thumbnail_url: ''})}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Thumbnail
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Assets (Code, Demo, etc.)</label>
                  
                  {newProject.assets && newProject.assets.length > 0 && (
                    <div className="w-full max-w-md mx-auto space-y-3 mb-4">
                      {newProject.assets.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                              Asset {index + 1}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newUrls = newProject.assets.filter((_, i) => i !== index);
                              setNewProject({...newProject, assets: newUrls});
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <MultiUploadManager 
                    onUploadStart={() => setIsUploadingAsset(true)}
                    onUploadError={() => setIsUploadingAsset(false)}
                    onClear={() => {
                      // Don't clear existing URLs, just the currently uploading ones
                      setIsUploadingAsset(false);
                    }}
                    onUploadComplete={(urls) => {
                      const combinedUrls = [...newProject.assets, ...urls];
                      setNewProject({...newProject, assets: combinedUrls});
                      setIsUploadingAsset(false);
                    }}
                    acceptedFormats={{
                      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                      'application/pdf': ['.pdf'],
                      'application/zip': ['.zip'],
                      'application/x-zip-compressed': ['.zip'],
                      'text/plain': ['.txt'],
                      'text/markdown': ['.md'],
                      'application/json': ['.json'],
                      'text/csv': ['.csv'],
                      'video/mp4': ['.mp4']
                    }}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject || !newProject.title || isUploadingThumbnail || isUploadingAsset}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingProject || isUploadingThumbnail || isUploadingAsset ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {(isUploadingThumbnail || isUploadingAsset) ? 'Uploading...' : 'Saving...'}</>
                  ) : (
                    'Save Project'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <motion.div
            key="delete-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProjectToDelete(null)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              key="delete-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-500/10 rounded-full mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-center text-slate-900 dark:text-white mb-2">Delete Project?</h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
                  Are you sure you want to delete "{projectToDelete.title}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setProjectToDelete(null)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Profile Confirmation Modal */}
      <AnimatePresence>
        {isResetProfileModalOpen && (
          <motion.div
            key="reset-profile-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsResetProfileModalOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              key="reset-profile-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-500/10 rounded-full mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-center text-slate-900 dark:text-white mb-2">Reset Profile?</h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
                  Are you sure you want to clear all your profile information? Your projects will not be affected. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsResetProfileModalOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetProfile}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-sm"
                  >
                    Reset Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Profile Confirmation Modal */}
      <AnimatePresence>
        {isDeleteProfileModalOpen && (
          <motion.div
            key="delete-profile-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDeleteProfileModalOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              key="delete-profile-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-500/10 rounded-full mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-center text-slate-900 dark:text-white mb-2">Delete Account & Data?</h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
                  Are you absolutely sure? This will permanently delete your profile and <strong>ALL of your projects</strong>. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteProfileModalOpen(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProfile}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm"
                  >
                    Delete Everything
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
