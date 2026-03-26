'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, MessageCircle, Calendar, Plus, Search, Settings,
  LogIn, LogOut, Download, Github, Loader2, X, Send,
  BookOpen, Video, FileText, Link as LinkIcon, Clock,
  CheckCircle, AlertCircle, Star, Award, TrendingUp,
  Home, Compass, BarChart, Certificate, User,
  Edit, Trash2, Flag, Share2, Bookmark, Bell,
  GraduationCap
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// ==================== PROFESSIONAL TYPES ====================
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'learner' | 'instructor' | 'admin';
  joinedAt: string;
  lastActive: string;
  stats: {
    groupsJoined: number;
    discussionsCreated: number;
    resourcesShared: number;
    eventsAttended: number;
  };
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  course: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  stats: {
    members: number;
    discussions: number;
    resources: number;
    weeklyActive: number;
  };
  isJoined: boolean;
  isFavorite: boolean;
  tags: string[];
  lastActivity: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'webinar' | 'workshop' | 'hackathon' | 'meetup' | 'qna';
  date: string;
  time: string;
  duration: string;
  location: 'online' | 'in-person';
  link?: string;
  host: {
    id: string;
    name: string;
    avatar?: string;
    title: string;
  };
  stats: {
    attendees: number;
    maxAttendees?: number;
    waitlist: number;
  };
  isRegistered: boolean;
  isSaved: boolean;
  tags: string[];
}

// ==================== MAIN COMPONENT ====================
export default function CommunityPage() {
  // Initialize Supabase with correct environment variables
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_NEW!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_NEW!
  );

  // ==================== STATE MANAGEMENT ====================
  const [user, setUser] = useState<UserProfile | null>(null);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState({
    initial: true,
    groups: true,
    events: true,
    action: false
  });
  
  // UI State
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups' | 'saved'>('discover');
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'active'>('recent');
  
  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // Forms
  const [newGroup, setNewGroup] = useState({ name: '', description: '', course: '', tags: '' });
  
  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // ==================== AVAILABLE TAGS ====================
  const availableTags = [
    'Web Development', 'Data Science', 'UI/UX Design', 'Mobile Development',
    'DevOps', 'Machine Learning', 'Cloud Computing', 'Cybersecurity',
    'Blockchain', 'IoT', 'Python', 'JavaScript', 'React', 'Node.js'
  ];

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    loadUser();
  }, []);

  // ==================== USER FUNCTIONS ====================
  const loadUser = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        setLoading(prev => ({ ...prev, initial: false }));
        return;
      }
      
      if (authUser) {
        console.log('User loaded:', authUser.email);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
        }

        // Get user stats
        const { count: groupsJoined } = await supabase
          .from('study_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);

        const { count: discussionsCreated } = await supabase
          .from('discussion_topics')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', authUser.id);

        const { count: resourcesShared } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('uploaded_by', authUser.id);

        const { count: eventsAttended } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);

        setUser({
          id: authUser.id,
          name: profile?.first_name || profile?.full_name || authUser.email?.split('@')[0] || 'Learner',
          email: authUser.email || '',
          role: profile?.role || 'learner',
          joinedAt: profile?.created_at || new Date().toISOString(),
          lastActive: new Date().toISOString(),
          stats: {
            groupsJoined: groupsJoined || 0,
            discussionsCreated: discussionsCreated || 0,
            resourcesShared: resourcesShared || 0,
            eventsAttended: eventsAttended || 0
          }
        });

        await Promise.all([loadStudyGroups(), loadEvents()]);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(prev => ({ ...prev, initial: false }));
    }
  };

  // ==================== STUDY GROUPS ====================
  const loadStudyGroups = async () => {
    if (!user) return;

    try {
      setLoading(prev => ({ ...prev, groups: true }));

      const { data: groups, error } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching study groups:', error);
        setStudyGroups([]);
        setLoading(prev => ({ ...prev, groups: false }));
        return;
      }

      if (!groups || groups.length === 0) {
        setStudyGroups([]);
        setLoading(prev => ({ ...prev, groups: false }));
        return;
      }

      // Get user's joined groups
      const { data: userGroups } = await supabase
        .from('study_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      // Get user's favorites
      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'group');

      const joinedIds = new Set(userGroups?.map(ug => ug.group_id) || []);
      const favoriteIds = new Set(favorites?.map(f => f.item_id) || []);

      const groupsWithDetails = await Promise.all(groups.map(async (group: any) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from('study_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Get discussion count
        const { count: discussionCount } = await supabase
          .from('discussion_topics')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Get resource count
        const { count: resourceCount } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Get weekly active count
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count: weeklyActive } = await supabase
          .from('study_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .gte('joined_at', weekAgo.toISOString());

        // Get last activity
        const { data: lastDiscussion } = await supabase
          .from('discussion_topics')
          .select('created_at')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: lastResource } = await supabase
          .from('resources')
          .select('uploaded_at')
          .eq('group_id', group.id)
          .order('uploaded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastActivity = lastDiscussion?.created_at || lastResource?.uploaded_at || group.created_at;

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          course: group.course,
          createdBy: {
            id: group.created_by,
            name: group.created_by_name || 'Instructor'
          },
          createdAt: new Date(group.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          stats: {
            members: memberCount || 0,
            discussions: discussionCount || 0,
            resources: resourceCount || 0,
            weeklyActive: weeklyActive || 0
          },
          isJoined: joinedIds.has(group.id),
          isFavorite: favoriteIds.has(group.id),
          tags: group.tags || [group.course],
          lastActivity: new Date(lastActivity).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        };
      }));

      setStudyGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error in loadStudyGroups:', error);
      showNotification('Failed to load study groups', 'error');
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  // ==================== EVENTS ====================
  const loadEvents = async () => {
    try {
      setLoading(prev => ({ ...prev, events: true }));

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        setEvents([]);
        setLoading(prev => ({ ...prev, events: false }));
        return;
      }

      if (!data || data.length === 0) {
        setEvents([]);
        setLoading(prev => ({ ...prev, events: false }));
        return;
      }

      if (user) {
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id);

        const { data: saved } = await supabase
          .from('user_favorites')
          .select('item_id')
          .eq('user_id', user.id)
          .eq('item_type', 'event');

        const registeredIds = new Set(registrations?.map(r => r.event_id) || []);
        const savedIds = new Set(saved?.map(s => s.item_id) || []);

        const eventsWithStatus = data.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          date: event.date,
          time: event.time,
          duration: event.duration || '1 hour',
          location: event.location || 'online',
          link: event.link,
          host: {
            id: event.host_id,
            name: event.host_name || 'Stratavax',
            title: event.host_title || 'Instructor'
          },
          stats: {
            attendees: event.attendees || 0,
            maxAttendees: event.max_attendees,
            waitlist: event.waitlist || 0
          },
          isRegistered: registeredIds.has(event.id),
          isSaved: savedIds.has(event.id),
          tags: event.tags || []
        }));

        setEvents(eventsWithStatus);
      } else {
        setEvents(data);
      }
    } catch (error) {
      console.error('Error in loadEvents:', error);
      setEvents([]);
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  };

  // ==================== FILTERS AND SORT ====================
  const filteredGroups = studyGroups
    .filter(group => {
      if (activeTab === 'my-groups' && !group.isJoined) return false;
      if (activeTab === 'saved' && !group.isFavorite) return false;
      if (searchQuery && !group.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !group.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedTags.length > 0 && !selectedTags.some(tag => group.tags.includes(tag))) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      } else if (sortBy === 'popular') {
        return b.stats.members - a.stats.members;
      } else {
        return b.stats.weeklyActive - a.stats.weeklyActive;
      }
    });

  // ==================== NOTIFICATION ====================
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ==================== EXPORT FUNCTION ====================
  const handleExport = () => {
    if (studyGroups.length === 0) return;
    
    const data = studyGroups.map(g => ({
      'Group Name': g.name,
      'Course': g.course,
      'Members': g.stats.members,
      'Discussions': g.stats.discussions,
      'Resources': g.stats.resources,
      'Weekly Active': g.stats.weeklyActive,
      'Created At': g.createdAt,
      'Last Activity': g.lastActivity
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratavax-groups-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ==================== LOADING STATE ====================
  if (loading.initial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <GraduationCap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" size={32} />
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading Stratavax Community...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Professional Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <GraduationCap className="text-white" size={24} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Stratavax
                </h1>
                <p className="text-xs text-slate-500">Learning Management System</p>
              </div>
            </div>

            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-3">
                  <div className="flex items-center space-x-1 px-3 py-1 bg-blue-50 rounded-full">
                    <Users size={14} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">{user.stats.groupsJoined}</span>
                  </div>
                  <div className="flex items-center space-x-1 px-3 py-1 bg-purple-50 rounded-full">
                    <MessageCircle size={14} className="text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">{user.stats.discussionsCreated}</span>
                  </div>
                  <div className="flex items-center space-x-1 px-3 py-1 bg-emerald-50 rounded-full">
                    <Award size={14} className="text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">{user.stats.eventsAttended}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Community Hub</h1>
          <p className="text-slate-600 mt-2">
            {user ? `Welcome back, ${user.name}!` : 'Connect with peers, join study groups, and grow together'}
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Study Groups</p>
                <p className="text-2xl font-bold text-slate-900">{studyGroups.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Discussions</p>
                <p className="text-2xl font-bold text-slate-900">
                  {studyGroups.reduce((acc, g) => acc + g.stats.discussions, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Resources Shared</p>
                <p className="text-2xl font-bold text-slate-900">
                  {studyGroups.reduce((acc, g) => acc + g.stats.resources, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <FileText className="text-emerald-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-slate-900">{events.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                disabled={studyGroups.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Export Data
              </button>
              <button
                onClick={() => window.open('https://github.com/settings/connections/applications', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <Github size={18} />
                Connect GitHub
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveView('grid')}
                className={`p-2 rounded-lg transition-all ${activeView === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`p-2 rounded-lg transition-all ${activeView === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Filters</h3>
              
              <div className="space-y-2 mb-6">
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'discover' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Users size={18} className="inline mr-2" />
                  Discover
                </button>
                <button
                  onClick={() => setActiveTab('my-groups')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'my-groups' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <BookOpen size={18} className="inline mr-2" />
                  My Groups ({studyGroups.filter(g => g.isJoined).length})
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                    activeTab === 'saved' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Star size={18} className="inline mr-2" />
                  Saved ({studyGroups.filter(g => g.isFavorite).length})
                </button>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="active">Most Active</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Topics</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, tag]);
                          } else {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                      />
                      <span className="text-sm text-slate-600">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {user && (
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all font-medium"
                >
                  <Plus size={18} />
                  Create New Group
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search groups by name, description, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Groups Display */}
            {loading.groups ? (
              <div className="text-center py-12">
                <Loader2 size={40} className="animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-slate-600">Loading study groups...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Groups Found</h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery || selectedTags.length > 0
                    ? 'Try adjusting your filters'
                    : activeTab === 'my-groups'
                    ? "You haven't joined any groups yet"
                    : activeTab === 'saved'
                    ? "You haven't saved any groups yet"
                    : 'Be the first to create a study group!'}
                </p>
                {user && !searchQuery && selectedTags.length === 0 && activeTab === 'discover' && (
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                  >
                    <Plus size={18} />
                    Create Your First Group
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid ${activeView === 'grid' ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1 gap-4'}`}>
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all ${
                      activeView === 'list' ? 'flex' : ''
                    }`}
                  >
                    {activeView === 'grid' ? (
                      // Grid View
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
                              {group.isJoined && (
                                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  Joined
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-blue-600 font-medium">{group.course}</p>
                          </div>
                          <button
                            className={`p-2 rounded-lg transition-all ${
                              group.isFavorite ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-500'
                            }`}
                          >
                            <Star size={18} fill={group.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{group.description}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {group.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                          {group.tags.length > 3 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                              +{group.tags.length - 3}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-slate-900">{group.stats.members}</p>
                            <p className="text-xs text-slate-500">Members</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-slate-900">{group.stats.discussions}</p>
                            <p className="text-xs text-slate-500">Discussions</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-slate-900">{group.stats.resources}</p>
                            <p className="text-xs text-slate-500">Resources</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock size={14} />
                            <span>Active {group.lastActivity}</span>
                          </div>
                          <div className="flex gap-2">
                            {group.isJoined ? (
                              <button
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all"
                              >
                                View Group
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setShowJoinModal(true);
                                }}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                              >
                                <LogIn size={16} />
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List View
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
                              {group.isJoined && (
                                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                                  Joined
                                </span>
                              )}
                              <span className="text-sm text-blue-600">{group.course}</span>
                            </div>
                            <p className="text-slate-600 text-sm mb-3">{group.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1"><Users size={14} /> {group.stats.members}</span>
                              <span className="flex items-center gap-1"><MessageCircle size={14} /> {group.stats.discussions}</span>
                              <span className="flex items-center gap-1"><FileText size={14} /> {group.stats.resources}</span>
                              <span className="flex items-center gap-1"><Clock size={14} /> {group.lastActivity}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button className="p-2 text-slate-400 hover:text-yellow-500">
                              <Star size={18} />
                            </button>
                            {group.isJoined ? (
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                                View
                              </button>
                            ) : (
                              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Events Section */}
            {events.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Upcoming Events</h2>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View All →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <div className={`h-2 ${
                        event.type === 'webinar' ? 'bg-blue-600' :
                        event.type === 'workshop' ? 'bg-purple-600' :
                        event.type === 'hackathon' ? 'bg-purple-500' :
                        event.type === 'meetup' ? 'bg-emerald-500' : 'bg-orange-500'
                      }`}></div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                              event.type === 'webinar' ? 'bg-blue-100 text-blue-600' :
                              event.type === 'workshop' ? 'bg-purple-100 text-purple-600' :
                              event.type === 'hackathon' ? 'bg-purple-100 text-purple-600' :
                              event.type === 'meetup' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </span>
                            <h3 className="text-lg font-semibold text-slate-900 mt-2">{event.title}</h3>
                          </div>
                          <button className={`p-2 rounded-lg transition-all ${
                            event.isSaved ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-500'
                          }`}>
                            <Bookmark size={18} fill={event.isSaved ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{event.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar size={16} className="text-slate-400" />
                            <span>{new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock size={16} className="text-slate-400" />
                            <span>{event.time} ({event.duration})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users size={16} className="text-slate-400" />
                            <span>{event.stats.attendees} attending</span>
                            {event.stats.maxAttendees && (
                              <span className="text-xs text-slate-500">
                                · {event.stats.maxAttendees - event.stats.attendees} spots left
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {event.host.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{event.host.name}</p>
                            <p className="text-xs text-slate-500">{event.host.title}</p>
                          </div>
                        </div>

                        <button
                          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            event.isRegistered
                              ? 'bg-green-100 text-green-600 cursor-default'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {event.isRegistered ? 'Registered' : 'Register'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Panel */}
            {user?.role === 'admin' && (
              <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                  <Settings size={20} className="text-blue-600" />
                  Admin Dashboard
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
                    <FileText className="text-blue-600 mb-3" size={24} />
                    <h3 className="font-semibold text-slate-900 mb-1">Manage Resources</h3>
                    <p className="text-sm text-slate-600">Review and moderate shared resources</p>
                  </button>
                  <button className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group">
                    <Users className="text-purple-600 mb-3" size={24} />
                    <h3 className="font-semibold text-slate-900 mb-1">Manage Groups</h3>
                    <p className="text-sm text-slate-600">Monitor and moderate study groups</p>
                  </button>
                  <button className="p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group">
                    <Calendar className="text-emerald-600 mb-3" size={24} />
                    <h3 className="font-semibold text-slate-900 mb-1">Create Events</h3>
                    <p className="text-sm text-slate-600">Schedule webinars and workshops</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Create Study Group</h3>
                <button onClick={() => setShowCreateGroup(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Group Name *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g., Advanced JavaScript Study Group"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Course *</label>
                <select
                  value={newGroup.course}
                  onChange={(e) => setNewGroup({ ...newGroup, course: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select a course</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Machine Learning">Machine Learning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="What will this group study? Goals? Prerequisites?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newGroup.tags}
                  onChange={(e) => setNewGroup({ ...newGroup, tags: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g., javascript, react, beginners"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Join Group</h3>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-2">{selectedGroup.name}</h4>
              <p className="text-slate-600 mb-4">{selectedGroup.description}</p>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium mb-2">By joining, you'll get:</p>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    Access to all discussions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    Share and access resources
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    Connect with {selectedGroup.stats?.members} members
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <LogIn size={18} />
                Join Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slideIn ${
            notification.type === 'success' ? 'bg-green-600' :
            notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          } text-white`}
        >
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'error' && <AlertCircle size={20} />}
          {notification.type === 'info' && <Bell size={20} />}
          <p>{notification.message}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
