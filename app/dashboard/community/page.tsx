// app/dashboard/community/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  Plus, 
  Rocket, 
  Clock,
  BookOpen,
  User,
  Reply,
  Sparkles,
  X,
  LogIn,
  Settings,
  FileText,
  Video,
  Link as LinkIcon,
  Search,
  Send,
  Loader2,
  Github,
  Download
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ==================== TYPES ====================
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'learner' | 'admin';
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  course: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  member_count: number;
  topic_count: number;
  resource_count: number;
  is_joined: boolean;
}

interface GroupDetail extends StudyGroup {
  members: GroupMember[];
  topics: DiscussionTopic[];
  resources: Resource[];
}

interface GroupMember {
  user_id: string;
  user_name: string;
  joined_at: string;
  role: 'admin' | 'member';
}

interface DiscussionTopic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  replies: Reply[];
  tags: string[];
}

interface Reply {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

interface Resource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: string;
  description?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'webinar' | 'workshop' | 'qna';
  attendees: number;
  max_attendees?: number;
  description?: string;
  is_registered?: boolean;
}

// ==================== MAIN COMPONENT ====================
export default function CommunityPage() {
  const supabase = createClientComponentClient();
  
  // ==================== STATE ====================
  const [user, setUser] = useState<User | null>(null);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState({
    user: true,
    groups: true,
    events: true,
    action: false
  });
  
  // UI State
  const [activeView, setActiveView] = useState<'discussions' | 'resources'>('discussions');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [replyText, setReplyText] = useState('');

  // Form states
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    course: ''
  });

  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    tags: ''
  });

  const [newResource, setNewResource] = useState({
    title: '',
    type: 'link' as 'video' | 'document' | 'link',
    url: '',
    description: ''
  });

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Get user profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          name: profile?.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: profile?.role || 'learner'
        });

        // Load data after user is loaded
        loadStudyGroups();
        loadEvents();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      showNotification('Failed to load user', 'error');
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  };

  // ==================== STUDY GROUPS ====================
  const loadStudyGroups = async () => {
    try {
      setLoading(prev => ({ ...prev, groups: true }));
      
      // Get all study groups
      const { data: groups, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          profiles:created_by (name),
          study_group_members (count),
          discussion_topics (count),
          resources (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user's joined groups
      const { data: userGroups } = await supabase
        .from('study_group_members')
        .select('group_id')
        .eq('user_id', user?.id);

      const joinedGroupIds = new Set(userGroups?.map(ug => ug.group_id) || []);

      // Transform data
      const transformedGroups: StudyGroup[] = groups.map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        course: group.course,
        created_by: group.created_by,
        created_by_name: group.profiles?.name || 'Unknown',
        created_at: new Date(group.created_at).toLocaleDateString(),
        member_count: group.study_group_members?.[0]?.count || 0,
        topic_count: group.discussion_topics?.[0]?.count || 0,
        resource_count: group.resources?.[0]?.count || 0,
        is_joined: joinedGroupIds.has(group.id)
      }));

      setStudyGroups(transformedGroups);
    } catch (error) {
      console.error('Error loading study groups:', error);
      showNotification('Failed to load study groups', 'error');
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));

      // Get group details
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Get members
      const { data: members } = await supabase
        .from('study_group_members')
        .select(`
          user_id,
          joined_at,
          role,
          profiles:user_id (name)
        `)
        .eq('group_id', groupId);

      // Get discussions with replies
      const { data: topics } = await supabase
        .from('discussion_topics')
        .select(`
          *,
          profiles:author_id (name),
          discussion_replies (
            *,
            profiles:author_id (name)
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      // Get resources
      const { data: resources } = await supabase
        .from('resources')
        .select(`
          *,
          profiles:uploaded_by (name)
        `)
        .eq('group_id', groupId)
        .order('uploaded_at', { ascending: false });

      // Transform data
      const transformedGroup: GroupDetail = {
        id: group.id,
        name: group.name,
        description: group.description,
        course: group.course,
        created_by: group.created_by,
        created_by_name: group.created_by_name,
        created_at: new Date(group.created_at).toLocaleDateString(),
        member_count: members?.length || 0,
        topic_count: topics?.length || 0,
        resource_count: resources?.length || 0,
        is_joined: members?.some(m => m.user_id === user?.id) || false,
        members: members?.map(m => ({
          user_id: m.user_id,
          user_name: m.profiles?.name || 'Unknown',
          joined_at: new Date(m.joined_at).toLocaleDateString(),
          role: m.role
        })) || [],
        topics: topics?.map(t => ({
          id: t.id,
          title: t.title,
          content: t.content,
          author_id: t.author_id,
          author_name: t.profiles?.name || 'Unknown',
          created_at: new Date(t.created_at).toLocaleString(),
          tags: t.tags || [],
          replies: t.discussion_replies?.map((r: any) => ({
            id: r.id,
            content: r.content,
            author_id: r.author_id,
            author_name: r.profiles?.name || 'Unknown',
            created_at: new Date(r.created_at).toLocaleString()
          })) || []
        })) || [],
        resources: resources?.map(r => ({
          id: r.id,
          title: r.title,
          type: r.type,
          url: r.url,
          uploaded_by: r.uploaded_by,
          uploaded_by_name: r.profiles?.name || 'Unknown',
          uploaded_at: new Date(r.uploaded_at).toLocaleDateString(),
          description: r.description
        })) || []
      };

      setSelectedGroup(transformedGroup);
    } catch (error) {
      console.error('Error loading group details:', error);
      showNotification('Failed to load group details', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const createStudyGroup = async () => {
    if (!newGroup.name || !newGroup.description || !newGroup.course) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { data, error } = await supabase
        .from('study_groups')
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          course: newGroup.course,
          created_by: user?.id,
          created_by_name: user?.name
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase
        .from('study_group_members')
        .insert({
          group_id: data.id,
          user_id: user?.id,
          role: 'admin'
        });

      showNotification('Study group created successfully!');
      setShowCreateGroup(false);
      setNewGroup({ name: '', description: '', course: '' });
      loadStudyGroups();
    } catch (error) {
      console.error('Error creating study group:', error);
      showNotification('Failed to create study group', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user?.id,
          role: 'member'
        });

      if (error) throw error;

      showNotification('You joined the group!');
      setShowJoinModal(false);
      loadStudyGroups();
      
      if (selectedGroup?.id === groupId) {
        loadGroupDetails(groupId);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      showNotification('Failed to join group', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user?.id);

      if (error) throw error;

      showNotification('You left the group');
      loadStudyGroups();
      
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      showNotification('Failed to leave group', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // ==================== DISCUSSIONS ====================
  const createDiscussion = async () => {
    if (!newDiscussion.title || !newDiscussion.content || !selectedGroup) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { error } = await supabase
        .from('discussion_topics')
        .insert({
          group_id: selectedGroup.id,
          title: newDiscussion.title,
          content: newDiscussion.content,
          author_id: user?.id,
          tags: newDiscussion.tags.split(',').map(t => t.trim()).filter(t => t)
        });

      if (error) throw error;

      showNotification('Discussion posted!');
      setShowDiscussionModal(false);
      setNewDiscussion({ title: '', content: '', tags: '' });
      loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('Error creating discussion:', error);
      showNotification('Failed to create discussion', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const addReply = async (topicId: string) => {
    if (!replyText.trim() || !selectedGroup) return;

    try {
      const { error } = await supabase
        .from('discussion_replies')
        .insert({
          topic_id: topicId,
          content: replyText,
          author_id: user?.id
        });

      if (error) throw error;

      setReplyText('');
      loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('Error adding reply:', error);
      showNotification('Failed to add reply', 'error');
    }
  };

  // ==================== RESOURCES ====================
  const addResource = async () => {
    if (!newResource.title || !newResource.url || !selectedGroup) return;

    try {
      const { error } = await supabase
        .from('resources')
        .insert({
          group_id: selectedGroup.id,
          title: newResource.title,
          type: newResource.type,
          url: newResource.url,
          description: newResource.description,
          uploaded_by: user?.id
        });

      if (error) throw error;

      showNotification('Resource added!');
      setShowResourceModal(false);
      setNewResource({ title: '', type: 'link', url: '', description: '' });
      loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('Error adding resource:', error);
      showNotification('Failed to add resource', 'error');
    }
  };

  // ==================== EVENTS ====================
  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Check which events user is registered for
      if (user) {
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('event_id')
          .eq('user_id', user.id);

        const registeredIds = new Set(registrations?.map(r => r.event_id) || []);

        const eventsWithStatus = data.map(event => ({
          ...event,
          is_registered: registeredIds.has(event.id)
        }));

        setEvents(eventsWithStatus);
      } else {
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user?.id
        });

      if (error) throw error;

      // Update event attendees count
      await supabase.rpc('increment_event_attendees', { event_id: eventId });

      showNotification('Registered for event!');
      loadEvents();
    } catch (error) {
      console.error('Error registering for event:', error);
      showNotification('Failed to register for event', 'error');
    }
  };

  // ==================== UTILITIES ====================
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExport = () => {
    const data = studyGroups.map(g => ({
      'Group Name': g.name,
      Course: g.course,
      Members: g.member_count,
      Discussions: g.topic_count,
      Resources: g.resource_count,
      'Created By': g.created_by_name,
      'Created At': g.created_at
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-groups.csv';
    a.click();
  };

  const handleGitHubConnect = () => {
    window.open('https://github.com/settings/connections/applications', '_blank');
    showNotification('Redirecting to GitHub...');
  };

  // ==================== FILTERED GROUPS ====================
  const filteredGroups = studyGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==================== RENDER ====================
  if (loading.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Users className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Study Groups</h2>
            <p className="text-gray-600 mb-4">Join groups to learn with peers</p>
            <div className="text-sm text-blue-600">
              {studyGroups.length} Active Groups
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Discussions</h2>
            <p className="text-gray-600 mb-4">Ask questions and share knowledge</p>
            <div className="text-sm text-green-600">
              Join the conversation
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Events</h2>
            <p className="text-gray-600 mb-4">Webinars, workshops & live sessions</p>
            <div className="text-sm text-orange-600">
              {events.length} Upcoming Events
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download size={18} />
            Export Excel
          </button>
          <button
            onClick={handleGitHubConnect}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Github size={18} />
            Connect GitHub
          </button>
        </div>

        {/* Main Content - Study Groups */}
        {!selectedGroup ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Study Groups</h2>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Create Group
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search groups by name, course, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Groups Grid */}
            {loading.groups ? (
              <div className="text-center py-12">
                <Loader2 size={40} className="animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600">Loading study groups...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => (
                  <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-blue-600 mt-1">{group.course}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                          {group.member_count} members
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>Created by {group.created_by_name}</span>
                        <span>{group.created_at}</span>
                      </div>

                      <div className="flex gap-2">
                        {group.is_joined ? (
                          <>
                            <button
                              onClick={() => loadGroupDetails(group.id)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              View Group
                            </button>
                            <button
                              onClick={() => leaveGroup(group.id)}
                              className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                            >
                              Leave
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedGroup({
                                ...group,
                                members: [],
                                topics: [],
                                resources: []
                              } as GroupDetail);
                              setShowJoinModal(true);
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                          >
                            <LogIn size={16} />
                            Join Group
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MessageCircle size={16} />
                        <span>{group.topic_count} discussions</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText size={16} />
                        <span>{group.resource_count} resources</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Group Detail View */
          <div className="space-y-6">
            {/* Back button and header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Groups
              </button>
              <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
              {selectedGroup.is_joined && (
                <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                  Joined
                </span>
              )}
            </div>

            {/* Group Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-gray-700 mb-4">{selectedGroup.description}</p>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>📚 {selectedGroup.course}</span>
                <span>👥 {selectedGroup.member_count} members</span>
                <span>📅 Created {selectedGroup.created_at}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-8">
                <button
                  onClick={() => setActiveView('discussions')}
                  className={`pb-4 px-1 ${activeView === 'discussions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                >
                  Discussions ({selectedGroup.topic_count})
                </button>
                <button
                  onClick={() => setActiveView('resources')}
                  className={`pb-4 px-1 ${activeView === 'resources' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                >
                  Resources ({selectedGroup.resource_count})
                </button>
              </nav>
            </div>

            {/* Discussions View */}
            {activeView === 'discussions' && (
              <div className="space-y-6">
                {selectedGroup.is_joined && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDiscussionModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={18} />
                      New Discussion
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {selectedGroup.topics.map(topic => (
                    <div key={topic.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{topic.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                          <span>{topic.author_name}</span>
                          <span>•</span>
                          <span>{topic.created_at}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{topic.content}</p>

                      {topic.tags.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {topic.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Replies */}
                      <div className="mt-6 space-y-4">
                        {topic.replies.map(reply => (
                          <div key={reply.id} className="bg-gray-50 rounded-lg p-4 ml-8">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">{reply.author_name}</span>
                              <span className="text-xs text-gray-500">{reply.created_at}</span>
                            </div>
                            <p className="text-gray-700 text-sm">{reply.content}</p>
                          </div>
                        ))}

                        {selectedGroup.is_joined && (
                          <div className="flex gap-2 mt-4">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Add a reply..."
                              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => addReply(topic.id)}
                              disabled={!replyText.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Send size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedGroup.topics.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      {selectedGroup.is_joined
                        ? 'No discussions yet. Start a new discussion!'
                        : 'Join this group to view and participate in discussions.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resources View */}
            {activeView === 'resources' && (
              <div className="space-y-6">
                {selectedGroup.is_joined && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowResourceModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus size={18} />
                      Add Resource
                    </button>
                  </div>
                )}

                <div className="grid gap-4">
                  {selectedGroup.resources.map(resource => (
                    <div key={resource.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {resource.type === 'video' && <Video className="text-red-500" size={24} />}
                          {resource.type === 'document' && <FileText className="text-blue-500" size={24} />}
                          {resource.type === 'link' && <LinkIcon className="text-green-500" size={24} />}
                          
                          <div>
                            <h4 className="font-semibold text-gray-900">{resource.title}</h4>
                            {resource.description && (
                              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Added by {resource.uploaded_by_name}</span>
                              <span>{resource.uploaded_at}</span>
                            </div>
                          </div>
                        </div>
                        
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}

                  {selectedGroup.resources.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      {selectedGroup.is_joined
                        ? 'No resources yet. Share a resource!'
                        : 'Join this group to access and share resources.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium
                    ${event.type === 'webinar' ? 'bg-blue-100 text-blue-600' : ''}
                    ${event.type === 'workshop' ? 'bg-green-100 text-green-600' : ''}
                    ${event.type === 'qna' ? 'bg-purple-100 text-purple-600' : ''}
                  `}>
                    {event.type.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {event.attendees} {event.max_attendees ? `/ ${event.max_attendees}` : ''} attending
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                )}
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={16} />
                    {event.time}
                  </p>
                </div>

                <button
                  onClick={() => registerForEvent(event.id)}
                  disabled={event.is_registered}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                    event.is_registered
                      ? 'bg-green-100 text-green-600 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {event.is_registered ? 'Registered' : 'Register Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Panel */}
        {user?.role === 'admin' && (
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Settings size={20} />
              Admin Panel
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                <FileText className="text-blue-600 mb-2" size={24} />
                <h3 className="font-semibold">Manage Resources</h3>
                <p className="text-sm text-gray-600 mt-1">Review and moderate resources</p>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left">
                <Users className="text-green-600 mb-2" size={24} />
                <h3 className="font-semibold">Manage Groups</h3>
                <p className="text-sm text-gray-600 mt-1">Monitor all study groups</p>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left">
                <Calendar className="text-purple-600 mb-2" size={24} />
                <h3 className="font-semibold">Create Events</h3>
                <p className="text-sm text-gray-600 mt-1">Schedule new events</p>
              </button>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Create Study Group</h3>
                <button onClick={() => setShowCreateGroup(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Group Name</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., JavaScript Study Group"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Course</label>
                  <select
                    value={newGroup.course}
                    onChange={(e) => setNewGroup({...newGroup, course: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select a course</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Python Programming">Python Programming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="What will this group study? Goals? Prerequisites?"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createStudyGroup}
                  disabled={loading.action}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading.action && <Loader2 size={16} className="animate-spin" />}
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Join Group</h3>
                <button onClick={() => setShowJoinModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-2">{selectedGroup.name}</h4>
                <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    By joining this group, you'll be able to:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Participate in discussions</li>
                    <li>• Share resources</li>
                    <li>• Connect with {selectedGroup.member_count} members</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => joinGroup(selectedGroup.id)}
                  disabled={loading.action}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading.action ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  Join Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Discussion Modal */}
        {showDiscussionModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Start Discussion</h3>
                <button onClick={() => setShowDiscussionModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="What's your question or topic?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="Provide details about your discussion topic..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newDiscussion.tags}
                    onChange={(e) => setNewDiscussion({...newDiscussion, tags: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., javascript, help, question"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDiscussionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createDiscussion}
                  disabled={loading.action}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading.action && <Loader2 size={16} className="animate-spin" />}
                  Post Discussion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Resource Modal */}
        {showResourceModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add Resource</h3>
                <button onClick={() => setShowResourceModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., JavaScript Closures Tutorial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newResource.type}
                    onChange={(e) => setNewResource({...newResource, type: e.target.value as 'video' | 'document' | 'link'})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                    type="url"
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Brief description of this resource..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addResource}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Resource
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            {notification.message}
          </div>
        )}
      </div>

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
