// app/dashboard/community/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, MessageCircle, Calendar, Plus, Rocket, Clock,
  BookOpen, User, Reply, Sparkles, X, LogIn, Settings,
  FileText, Video, Link as LinkIcon, Search, Send,
  Loader2, Github, Download
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// Types (simplified for build)
type StudyGroup = {
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
};

type GroupDetail = StudyGroup & {
  members: any[];
  topics: any[];
  resources: any[];
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  type: string;
  attendees: number;
  max_attendees: number | null;
  is_registered?: boolean;
};

export default function CommunityPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // State
  const [user, setUser] = useState<any>(null);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState({
    user: true,
    groups: true,
    events: true,
    action: false
  });
  const [activeView, setActiveView] = useState('discussions');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyTopicId, setReplyTopicId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', course: '' });
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '', tags: '' });
  const [newResource, setNewResource] = useState({ title: '', type: 'link', url: '', description: '' });

  // Initial load
  useEffect(() => {
    loadUser();
  }, []);

  // ==================== USER ====================
  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        setUser({
          id: authUser.id,
          name: profile?.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: profile?.role || 'learner'
        });

        // Load data after user is set
        await Promise.all([loadStudyGroups(), loadEvents()]);
      } else {
        setUser(null);
        setLoading(prev => ({ ...prev, groups: false, events: false }));
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  };

  // ==================== STUDY GROUPS ====================
  const loadStudyGroups = async () => {
    if (!user) {
      setLoading(prev => ({ ...prev, groups: false }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, groups: true }));

      const { data: groups, error } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If no groups, set empty array and stop loading
      if (!groups || groups.length === 0) {
        setStudyGroups([]);
        setLoading(prev => ({ ...prev, groups: false }));
        return;
      }

      const groupsWithDetails = await Promise.all(groups.map(async (group: any) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from('study_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Get topic count
        const { count: topicCount } = await supabase
          .from('discussion_topics')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Get resource count
        const { count: resourceCount } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Check if current user is a member
        const { data: memberData } = await supabase
          .from('study_group_members')
          .select('*')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .maybeSingle();

        return {
          id: group.id,
          name: group.name,
          description: group.description,
          course: group.course,
          created_by: group.created_by,
          created_by_name: group.created_by_name,
          created_at: new Date(group.created_at).toLocaleDateString(),
          member_count: memberCount || 0,
          topic_count: topicCount || 0,
          resource_count: resourceCount || 0,
          is_joined: !!memberData
        };
      }));

      setStudyGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error loading study groups:', error);
      setStudyGroups([]);
      showNotification('Failed to load study groups', 'error');
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    if (!user) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));

      // Get group details
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        throw new Error('Group not found');
      }

      // Get members
      const { data: members } = await supabase
        .from('study_group_members')
        .select('user_id, joined_at, role')
        .eq('group_id', groupId);

      const membersWithNames = await Promise.all((members || []).map(async (member: any) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', member.user_id)
          .maybeSingle();

        return {
          user_id: member.user_id,
          user_name: profile?.name || 'Unknown',
          joined_at: new Date(member.joined_at).toLocaleDateString(),
          role: member.role
        };
      }));

      // Get discussions
      const { data: topics } = await supabase
        .from('discussion_topics')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      const topicsWithReplies = await Promise.all((topics || []).map(async (topic: any) => {
        const { data: topicAuthor } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', topic.author_id)
          .maybeSingle();

        const { data: replies } = await supabase
          .from('discussion_replies')
          .select('*')
          .eq('topic_id', topic.id)
          .order('created_at', { ascending: true });

        const repliesWithNames = await Promise.all((replies || []).map(async (reply: any) => {
          const { data: replyAuthor } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', reply.author_id)
            .maybeSingle();

          return {
            id: reply.id,
            content: reply.content,
            author_id: reply.author_id,
            author_name: replyAuthor?.name || 'Unknown',
            created_at: new Date(reply.created_at).toLocaleString()
          };
        }));

        return {
          id: topic.id,
          title: topic.title,
          content: topic.content,
          author_id: topic.author_id,
          author_name: topicAuthor?.name || 'Unknown',
          created_at: new Date(topic.created_at).toLocaleString(),
          tags: topic.tags || [],
          replies: repliesWithNames
        };
      }));

      // Get resources
      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('group_id', groupId)
        .order('uploaded_at', { ascending: false });

      const resourcesWithNames = await Promise.all((resources || []).map(async (resource: any) => {
        const { data: uploader } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', resource.uploaded_by)
          .maybeSingle();

        return {
          id: resource.id,
          title: resource.title,
          type: resource.type,
          url: resource.url,
          uploaded_by: resource.uploaded_by,
          uploaded_by_name: uploader?.name || 'Unknown',
          uploaded_at: new Date(resource.uploaded_at).toLocaleDateString(),
          description: resource.description
        };
      }));

      setSelectedGroup({
        id: group.id,
        name: group.name,
        description: group.description,
        course: group.course,
        created_by: group.created_by,
        created_by_name: group.created_by_name,
        created_at: new Date(group.created_at).toLocaleDateString(),
        member_count: membersWithNames.length,
        topic_count: topicsWithReplies.length,
        resource_count: resourcesWithNames.length,
        is_joined: membersWithNames.some(m => m.user_id === user.id),
        members: membersWithNames,
        topics: topicsWithReplies,
        resources: resourcesWithNames
      });
    } catch (error) {
      console.error('Error loading group details:', error);
      showNotification('Failed to load group details', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const createStudyGroup = async () => {
    if (!user || !newGroup.name || !newGroup.description || !newGroup.course) {
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
          created_by: user.id,
          created_by_name: user.name
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await supabase.from('study_group_members').insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin'
        });

        showNotification('Study group created successfully!');
        setShowCreateGroup(false);
        setNewGroup({ name: '', description: '', course: '' });
        await loadStudyGroups();
      }
    } catch (error) {
      console.error('Error creating study group:', error);
      showNotification('Failed to create study group', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { error } = await supabase.from('study_group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member'
      });

      if (error) throw error;

      showNotification('You joined the group!');
      setShowJoinModal(false);
      await loadStudyGroups();

      if (selectedGroup?.id === groupId) {
        await loadGroupDetails(groupId);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      showNotification('Failed to join group', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user || !confirm('Are you sure you want to leave this group?')) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      showNotification('You left the group');
      await loadStudyGroups();
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error leaving group:', error);
      showNotification('Failed to leave group', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // ==================== DISCUSSIONS ====================
  const createDiscussion = async () => {
    if (!user || !selectedGroup || !newDiscussion.title || !newDiscussion.content) {
      showNotification('Please add title and content', 'error');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { error } = await supabase.from('discussion_topics').insert({
        group_id: selectedGroup.id,
        title: newDiscussion.title,
        content: newDiscussion.content,
        author_id: user.id,
        tags: newDiscussion.tags.split(',').map(t => t.trim()).filter(t => t)
      });

      if (error) throw error;

      showNotification('Discussion posted!');
      setShowDiscussionModal(false);
      setNewDiscussion({ title: '', content: '', tags: '' });
      await loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('Error creating discussion:', error);
      showNotification('Failed to create discussion', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const addReply = async (topicId: string) => {
    if (!user || !selectedGroup || !replyText.trim()) return;

    try {
      const { error } = await supabase.from('discussion_replies').insert({
        topic_id: topicId,
        content: replyText,
        author_id: user.id
      });

      if (error) throw error;

      setReplyText('');
      setReplyTopicId(null);
      await loadGroupDetails(selectedGroup.id);
      showNotification('Reply added!');
    } catch (error) {
      console.error('Error adding reply:', error);
      showNotification('Failed to add reply', 'error');
    }
  };

  // ==================== RESOURCES ====================
  const addResource = async () => {
    if (!user || !selectedGroup || !newResource.title || !newResource.url) {
      showNotification('Please add title and URL', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('resources').insert({
        group_id: selectedGroup.id,
        title: newResource.title,
        type: newResource.type,
        url: newResource.url,
        description: newResource.description,
        uploaded_by: user.id
      });

      if (error) throw error;

      showNotification('Resource added!');
      setShowResourceModal(false);
      setNewResource({ title: '', type: 'link', url: '', description: '' });
      await loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('Error adding resource:', error);
      showNotification('Failed to add resource', 'error');
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

      if (error) throw error;

      // If no events, set empty array and stop loading
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

        const registeredIds = new Set(registrations?.map(r => r.event_id) || []);
        setEvents(data.map(event => ({
          ...event,
          is_registered: registeredIds.has(event.id)
        })));
      } else {
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  };

  const registerForEvent = async (eventId: string) => {
    if (!user) {
      showNotification('Please login to register', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('event_registrations').insert({
        event_id: eventId,
        user_id: user.id
      });

      if (error) throw error;

      await supabase.rpc('increment_event_attendees', { event_id: eventId });
      showNotification('Registered for event!');
      await loadEvents();
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
    if (studyGroups.length === 0) {
      showNotification('No data to export', 'error');
      return;
    }

    const csv = [
      ['Group Name', 'Course', 'Members', 'Discussions', 'Resources', 'Created By', 'Created At'],
      ...studyGroups.map(g => [g.name, g.course, g.member_count, g.topic_count, g.resource_count, g.created_by_name, g.created_at])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-groups.csv';
    a.click();
  };

  const filteredGroups = studyGroups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.course.toLowerCase().includes(searchTerm.toLowerCase())
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
          <p className="text-gray-600 mt-2">
            {user ? `Welcome back, ${user.name}!` : 'Please login to participate'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download size={18} /> Export Excel
          </button>
          <button
            onClick={() => window.open('https://github.com/settings/connections/applications', '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Github size={18} /> Connect GitHub
          </button>
        </div>

        {/* Main Content: Study Groups List or Group Detail */}
        {!selectedGroup ? (
          <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Study Groups</h2>
              {user && (
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={18} /> Create Group
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Groups Grid with Loading/Empty States */}
            {loading.groups ? (
              <div className="text-center py-12">
                <Loader2 size={40} className="animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600">Loading study groups...</p>
              </div>
            ) : (
              <>
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Study Groups Yet</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? 'No groups match your search.' : 'Be the first to create a study group!'}
                    </p>
                    {user && !searchTerm && (
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus size={18} />
                        Create Your First Group
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{group.name}</h3>
                            <p className="text-sm text-blue-600">{group.course}</p>
                          </div>
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                            {group.member_count} members
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>

                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                          <span>By {group.created_by_name}</span>
                          <span>{group.created_at}</span>
                        </div>

                        <div className="flex gap-2">
                          {group.is_joined ? (
                            <>
                              <button
                                onClick={() => loadGroupDetails(group.id)}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                              >
                                View
                              </button>
                              <button
                                onClick={() => leaveGroup(group.id)}
                                className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                              >
                                Leave
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                if (!user) {
                                  showNotification('Please login to join', 'error');
                                  return;
                                }
                                // Set a minimal group object for the join modal
                                setSelectedGroup({
                                  ...group,
                                  members: [],
                                  topics: [],
                                  resources: []
                                } as GroupDetail);
                                setShowJoinModal(true);
                              }}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                              <LogIn size={16} /> Join
                            </button>
                          )}
                        </div>

                        <div className="border-t mt-4 pt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <MessageCircle size={16} /> {group.topic_count}
                          </span>
                          <span className="flex items-center gap-2">
                            <FileText size={16} /> {group.resource_count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Group Detail View */
          <div className="space-y-6">
            <button onClick={() => setSelectedGroup(null)} className="text-gray-600 hover:text-gray-900">
              ← Back to Groups
            </button>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold mb-2">{selectedGroup.name}</h2>
              <p className="text-gray-700 mb-4">{selectedGroup.description}</p>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>📚 {selectedGroup.course}</span>
                <span>👥 {selectedGroup.member_count} members</span>
                <span>📅 {selectedGroup.created_at}</span>
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

            {/* Discussions Tab */}
            {activeView === 'discussions' && (
              <div className="space-y-6">
                {selectedGroup.is_joined && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDiscussionModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={18} /> New Discussion
                    </button>
                  </div>
                )}

                {selectedGroup.topics.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Discussions Yet</h3>
                    <p className="text-gray-600">
                      {selectedGroup.is_joined
                        ? 'Start the first discussion!'
                        : 'Join this group to view and participate in discussions.'}
                    </p>
                  </div>
                ) : (
                  selectedGroup.topics.map((topic: any) => (
                    <div key={topic.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold">{topic.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                        <span>{topic.author_name}</span>
                        <span>•</span>
                        <span>{topic.created_at}</span>
                      </div>
                      <p className="text-gray-700 mt-4">{topic.content}</p>

                      {topic.tags.length > 0 && (
                        <div className="flex gap-2 mt-4">
                          {topic.tags.map((tag: string) => (
                            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Replies */}
                      {topic.replies.map((reply: any) => (
                        <div key={reply.id} className="bg-gray-50 rounded-lg p-4 ml-8 mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">{reply.author_name}</span>
                            <span className="text-xs text-gray-500">{reply.created_at}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{reply.content}</p>
                        </div>
                      ))}

                      {/* Reply Input */}
                      {selectedGroup.is_joined && (
                        <div className="flex gap-2 mt-4">
                          <input
                            type="text"
                            value={replyTopicId === topic.id ? replyText : ''}
                            onChange={(e) => {
                              setReplyTopicId(topic.id);
                              setReplyText(e.target.value);
                            }}
                            onFocus={() => setReplyTopicId(topic.id)}
                            placeholder="Add a reply..."
                            className="flex-1 p-2 border border-gray-300 rounded-lg"
                          />
                          <button
                            onClick={() => addReply(topic.id)}
                            disabled={replyTopicId !== topic.id || !replyText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Resources Tab */}
            {activeView === 'resources' && (
              <div className="space-y-6">
                {selectedGroup.is_joined && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowResourceModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Plus size={18} /> Add Resource
                    </button>
                  </div>
                )}

                {selectedGroup.resources.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resources Yet</h3>
                    <p className="text-gray-600">
                      {selectedGroup.is_joined
                        ? 'Share the first resource!'
                        : 'Join this group to access and share resources.'}
                    </p>
                  </div>
                ) : (
                  selectedGroup.resources.map((resource: any) => (
                    <div key={resource.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {resource.type === 'video' && <Video className="text-red-500" size={24} />}
                          {resource.type === 'document' && <FileText className="text-blue-500" size={24} />}
                          {resource.type === 'link' && <LinkIcon className="text-green-500" size={24} />}
                          <div>
                            <h4 className="font-semibold">{resource.title}</h4>
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
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Events Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>

          {loading.events ? (
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin mx-auto text-blue-600" />
            </div>
          ) : (
            <>
              {events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Events</h3>
                  <p className="text-gray-600">Check back later for webinars and workshops!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white rounded-xl p-6 border border-gray-200">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                          event.type === 'webinar'
                            ? 'bg-blue-100 text-blue-600'
                            : event.type === 'workshop'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        {event.type.toUpperCase()}
                      </span>
                      <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                      <p className="text-sm text-gray-600 mb-1">📅 {new Date(event.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600 mb-4">⏰ {event.time}</p>
                      <button
                        onClick={() => registerForEvent(event.id)}
                        disabled={event.is_registered || !user}
                        className={`w-full px-4 py-2 rounded-lg ${
                          event.is_registered
                            ? 'bg-green-100 text-green-600 cursor-default'
                            : user
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {!user ? 'Login to Register' : event.is_registered ? 'Registered' : 'Register Now'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Admin Panel (visible only to admin users) */}
        {user?.role === 'admin' && (
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Settings size={20} /> Admin Panel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left">
                <FileText className="text-blue-600 mb-2" size={24} />
                <h3 className="font-semibold">Manage Resources</h3>
                <p className="text-sm text-gray-600 mt-1">Review and moderate resources</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 text-left">
                <Users className="text-green-600 mb-2" size={24} />
                <h3 className="font-semibold">Manage Groups</h3>
                <p className="text-sm text-gray-600 mt-1">Monitor all study groups</p>
              </button>
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-left">
                <Calendar className="text-purple-600 mb-2" size={24} />
                <h3 className="font-semibold">Create Events</h3>
                <p className="text-sm text-gray-600 mt-1">Schedule new events</p>
              </button>
            </div>
          </div>
        )}

        {/* ========== MODALS ========== */}

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
                <input
                  type="text"
                  placeholder="Group Name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
                <select
                  value={newGroup.course}
                  onChange={(e) => setNewGroup({ ...newGroup, course: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Course</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                </select>
                <textarea
                  placeholder="Description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  rows={4}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={createStudyGroup}
                  disabled={loading.action}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading.action && <Loader2 size={16} className="animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Join Group</h3>
              <p className="mb-4">Are you sure you want to join {selectedGroup.name}?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowJoinModal(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={() => joinGroup(selectedGroup.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Join
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
                <h3 className="text-xl font-bold">New Discussion</h3>
                <button onClick={() => setShowDiscussionModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
                <textarea
                  placeholder="Content"
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  rows={4}
                  className="w-full p-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={newDiscussion.tags}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, tags: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowDiscussionModal(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={createDiscussion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Post
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
                <input
                  type="text"
                  placeholder="Title"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
                <input
                  type="url"
                  placeholder="URL"
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
                <textarea
                  placeholder="Description"
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowResourceModal(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button onClick={addResource} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white ${
              notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {notification.message}
          </div>
        )}
      </div>

      <style jsx>{`
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
