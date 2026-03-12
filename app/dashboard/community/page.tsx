'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, MessageCircle, Calendar, Plus, Rocket, Clock,
  BookOpen, User, Reply, Sparkles, X, LogIn, Settings,
  FileText, Video, Link as LinkIcon, Search, Send,
  Loader2, Github, Download
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function CommunityPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [user, setUser] = useState<any>(null);
  const [studyGroups, setStudyGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    user: true, groups: true, events: true, action: false
  });
  const [activeView, setActiveView] = useState('discussions');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [replyTopicId, setReplyTopicId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', course: '' });
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '', tags: '' });
  const [newResource, setNewResource] = useState({ title: '', type: 'link', url: '', description: '' });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
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
        
        await loadStudyGroups();
        await loadEvents();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  };

  const loadStudyGroups = async () => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, groups: true }));
      
      const { data: groups } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (!groups) return;

      const groupsWithDetails = await Promise.all(groups.map(async (group) => {
        const { count: memberCount } = await supabase
          .from('study_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        const { count: topicCount } = await supabase
          .from('discussion_topics')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        const { count: resourceCount } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

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
      showNotification('Failed to load study groups', 'error');
    } finally {
      setLoading(prev => ({ ...prev, groups: false }));
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    if (!user) return;
    
    try {
      setLoading(prev => ({ ...prev, action: true }));

      const { data: group } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (!group) return;

      const { data: members } = await supabase
        .from('study_group_members')
        .select('user_id, joined_at, role')
        .eq('group_id', groupId);

      const membersWithNames = await Promise.all((members || []).map(async (member) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', member.user_id)
          .single();
          
        return {
          user_id: member.user_id,
          user_name: profile?.name || 'Unknown',
          joined_at: new Date(member.joined_at).toLocaleDateString(),
          role: member.role
        };
      }));

      const { data: topics } = await supabase
        .from('discussion_topics')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      const topicsWithReplies = await Promise.all((topics || []).map(async (topic) => {
        const { data: topicAuthor } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', topic.author_id)
          .single();

        const { data: replies } = await supabase
          .from('discussion_replies')
          .select('*')
          .eq('topic_id', topic.id)
          .order('created_at', { ascending: true });

        const repliesWithNames = await Promise.all((replies || []).map(async (reply) => {
          const { data: replyAuthor } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', reply.author_id)
            .single();
            
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

      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('group_id', groupId)
        .order('uploaded_at', { ascending: false });

      const resourcesWithNames = await Promise.all((resources || []).map(async (resource) => {
        const { data: uploader } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', resource.uploaded_by)
          .single();
          
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

      const { data } = await supabase
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

      if (data) {
        await supabase
          .from('study_group_members')
          .insert({
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

      await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

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

      await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

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

  const createDiscussion = async () => {
    if (!user || !selectedGroup || !newDiscussion.title || !newDiscussion.content) {
      showNotification('Please add title and content', 'error');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, action: true }));

      await supabase
        .from('discussion_topics')
        .insert({
          group_id: selectedGroup.id,
          title: newDiscussion.title,
          content: newDiscussion.content,
          author_id: user.id,
          tags: newDiscussion.tags.split(',').map(t => t.trim()).filter(t => t)
        });

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
      await supabase
        .from('discussion_replies')
        .insert({
          topic_id: topicId,
          content: replyText,
          author_id: user.id
        });

      setReplyText('');
      setReplyTopicId(null);
      await loadGroupDetails(selectedGroup.id);
      showNotification('Reply added!');
    } catch (error) {
      console.error('Error adding reply:', error);
      showNotification('Failed to add reply', 'error');
    }
  };

  const addResource = async () => {
    if (!user || !selectedGroup || !newResource.title || !newResource.url) {
      showNotification('Please add title and URL', 'error');
      return;
    }

    try {
      await supabase
        .from('resources')
        .insert({
          group_id: selectedGroup.id,
          title: newResource.title,
          type: newResource.type,
          url: newResource.url,
          description: newResource.description,
          uploaded_by: user.id
        });

      showNotification('Resource added!');
      setShowResourceModal(false);
      setNewResource({ title: '', type: 'link', url: '', description: '' });
      await loadGroupDetails(selectedGroup.id);
    } catch (error) {
      console.error('Error adding resource:', error);
      showNotification('Failed to add resource', 'error');
    }
  };

  const loadEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (user && data) {
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
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
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
      await supabase
        .from('event_registrations')
        .insert({ event_id: eventId, user_id: user.id });

      await supabase.rpc('increment_event_attendees', { event_id: eventId });
      showNotification('Registered for event!');
      await loadEvents();
    } catch (error) {
      console.error('Error registering for event:', error);
      showNotification('Failed to register for event', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExport = () => {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-600 mt-2">{user ? `Welcome back, ${user.name}!` : 'Please login to participate'}</p>
        </div>

        <div className="flex gap-4 mb-8">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={18} /> Export Excel
          </button>
          <button onClick={() => window.open('https://github.com/settings/connections/applications', '_blank')} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            <Github size={18} /> Connect GitHub
          </button>
        </div>

        {!selectedGroup ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Study Groups</h2>
              {user && (
                <button onClick={() => setShowCreateGroup(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus size={18} /> Create Group
                </button>
              )}
            </div>

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

            {loading.groups ? (
              <div className="text-center py-12">
                <Loader2 size={40} className="animate-spin mx-auto text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => (
                  <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{group.name}</h3>
                        <p className="text-sm text-blue-600">{group.course}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                        {group.member_count} members
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{group.description}</p>
                    
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <span>By {group.created_by_name}</span>
                      <span>{group.created_at}</span>
                    </div>

                    <div className="flex gap-2">
                      {group.is_joined ? (
                        <>
                          <button onClick={() => loadGroupDetails(group.id)} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                            View
                          </button>
                          <button onClick={() => leaveGroup(group.id)} className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                            Leave
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (!user) { showNotification('Please login to join', 'error'); return; }
                            setSelectedGroup(group);
                            setShowJoinModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <LogIn size={16} /> Join
                        </button>
                      )}
                    </div>

                    <div className="border-t mt-4 pt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2"><MessageCircle size={16} /> {group.topic_count}</span>
                      <span className="flex items-center gap-2"><FileText size={16} /> {group.resource_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
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

            <div className="border-b border-gray-200">
              <nav className="flex gap-8">
                <button onClick={() => setActiveView('discussions')} className={`pb-4 px-1 ${activeView === 'discussions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                  Discussions ({selectedGroup.topic_count})
                </button>
                <button onClick={() => setActiveView('resources')} className={`pb-4 px-1 ${activeView === 'resources' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                  Resources ({selectedGroup.resource_count})
                </button>
              </nav>
            </div>

            {activeView === 'discussions' && (
              <div className="space-y-6">
                {selectedGroup.is_joined && (
                  <div className="flex justify-end">
                    <button onClick={() => setShowDiscussionModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus size={18} /> New Discussion
                    </button>
                  </div>
                )}

                {selectedGroup.topics.map((topic: any) => (
                  <div key={topic.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold">{topic.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                      <span>{topic.author_name}</span>
                      <span>•</span>
                      <span>{topic.created_at}</span>
                    </div>
                    <p className="text-gray-700 mt-4">{topic.content}</p>

                    {topic.replies.map((reply: any) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-4 ml-8 mt-4">
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
                          value={replyTopicId === topic.id ? replyText : ''}
                          onChange={(e) => { setReplyTopicId(topic.id); setReplyText(e.target.value); }}
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
                ))}
              </div>
            )}

            {activeView === 'resources' && (
              <div className="space-y-6">
                {selectedGroup.is_joined && (
                  <div className="flex justify-end">
                    <button onClick={() => setShowResourceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Plus size={18} /> Add Resource
                    </button>
                  </div>
                )}

                {selectedGroup.resources.map((resource: any) => (
                  <div key={resource.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {resource.type === 'video' && <Video className="text-red-500" size={24} />}
                        {resource.type === 'document' && <FileText className="text-blue-500" size={24} />}
                        {resource.type === 'link' && <LinkIcon className="text-green-500" size={24} />}
                        <div>
                          <h4 className="font-semibold">{resource.title}</h4>
                          <p className="text-sm text-gray-600">{resource.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Added by {resource.uploaded_by_name}</span>
                            <span>{resource.uploaded_at}</span>
                          </div>
                        </div>
                      </div>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-xl p-6 border border-gray-200">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  event.type === 'webinar' ? 'bg-blue-100 text-blue-600' :
                  event.type === 'workshop' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                }`}>
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
                    event.is_registered ? 'bg-green-100 text-green-600' :
                    user ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {!user ? 'Login to Register' : event.is_registered ? 'Registered' : 'Register Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Create Study Group</h3>
                <button onClick={() => setShowCreateGroup(false)}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Group Name" value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})} className="w-full p-2 border rounded-lg" />
                <select value={newGroup.course} onChange={(e) => setNewGroup({...newGroup, course: e.target.value})} className="w-full p-2 border rounded-lg">
                  <option value="">Select Course</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                </select>
                <textarea placeholder="Description" value={newGroup.description} onChange={(e) => setNewGroup({...newGroup, description: e.target.value})} rows={4} className="w-full p-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={createStudyGroup} disabled={loading.action} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {loading.action ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showJoinModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Join Group</h3>
              <p className="mb-4">Are you sure you want to join {selectedGroup.name}?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowJoinModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={() => joinGroup(selectedGroup.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Join</button>
              </div>
            </div>
          </div>
        )}

        {showDiscussionModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">New Discussion</h3>
                <button onClick={() => setShowDiscussionModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Title" value={newDiscussion.title} onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})} className="w-full p-2 border rounded-lg" />
                <textarea placeholder="Content" value={newDiscussion.content} onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})} rows={4} className="w-full p-2 border rounded-lg" />
                <input type="text" placeholder="Tags (comma separated)" value={newDiscussion.tags} onChange={(e) => setNewDiscussion({...newDiscussion, tags: e.target.value})} className="w-full p-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowDiscussionModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={createDiscussion} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Post</button>
              </div>
            </div>
          </div>
        )}

        {showResourceModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add Resource</h3>
                <button onClick={() => setShowResourceModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="Title" value={newResource.title} onChange={(e) => setNewResource({...newResource, title: e.target.value})} className="w-full p-2 border rounded-lg" />
                <select value={newResource.type} onChange={(e) => setNewResource({...newResource, type: e.target.value as any})} className="w-full p-2 border rounded-lg">
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
                <input type="url" placeholder="URL" value={newResource.url} onChange={(e) => setNewResource({...newResource, url: e.target.value})} className="w-full p-2 border rounded-lg" />
                <textarea placeholder="Description" value={newResource.description} onChange={(e) => setNewResource({...newResource, description: e.target.value})} rows={3} className="w-full p-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowResourceModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={addResource} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add</button>
              </div>
            </div>
          </div>
        )}

        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
}
