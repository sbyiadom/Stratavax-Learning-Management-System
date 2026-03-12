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
  Check,
  LogIn,
  Trash2,
  Edit,
  Settings,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Search,
  Filter,
  MoreVertical,
  Send,
  Paperclip
} from 'lucide-react';

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
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
  topics: DiscussionTopic[];
  resources: Resource[];
  isJoined?: boolean;
}

interface GroupMember {
  userId: string;
  userName: string;
  joinedAt: string;
  role: 'admin' | 'member';
}

interface DiscussionTopic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  replies: Reply[];
  tags: string[];
}

interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Resource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link' | 'file';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'webinar' | 'workshop' | 'qna';
  attendees: number;
  maxAttendees?: number;
}

// ==================== MAIN COMPONENT ====================
export default function CommunityPage() {
  // ==================== STATE ====================
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'learner'
  });

  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([
    {
      id: '1',
      name: 'JavaScript Masters',
      description: 'Deep dive into advanced JavaScript concepts, closures, prototypes, and async patterns',
      course: 'Web Development',
      createdBy: 'Alice Johnson',
      createdAt: '2024-03-15',
      members: [
        { userId: 'alice', userName: 'Alice Johnson', joinedAt: '2024-03-15', role: 'admin' },
        { userId: 'user1', userName: 'John Doe', joinedAt: '2024-03-16', role: 'member' }
      ],
      topics: [
        {
          id: 't1',
          title: 'Understanding Closures',
          content: 'Can someone explain practical use cases for closures?',
          authorId: 'bob',
          authorName: 'Bob Smith',
          createdAt: '2024-03-20',
          replies: [
            {
              id: 'r1',
              content: 'Closures are great for data privacy and creating factory functions...',
              authorId: 'alice',
              authorName: 'Alice Johnson',
              createdAt: '2024-03-20'
            }
          ],
          tags: ['javascript', 'beginner']
        }
      ],
      resources: [
        {
          id: 'r1',
          title: 'JavaScript Closures Explained',
          type: 'video',
          url: '#',
          uploadedBy: 'Alice Johnson',
          uploadedAt: '2024-03-15',
          description: 'Comprehensive video tutorial on closures'
        }
      ],
      isJoined: true
    },
    {
      id: '2',
      name: 'Data Science Study Group',
      description: 'Machine learning, Python, and data analysis discussions',
      course: 'Data Science',
      createdBy: 'Bob Smith',
      createdAt: '2024-03-10',
      members: [
        { userId: 'bob', userName: 'Bob Smith', joinedAt: '2024-03-10', role: 'admin' }
      ],
      topics: [],
      resources: [],
      isJoined: false
    },
    {
      id: '3',
      name: 'UI/UX Design Critics',
      description: 'Get feedback on your designs and learn from peers',
      course: 'UI/UX Design',
      createdBy: 'Carol White',
      createdAt: '2024-03-12',
      members: [
        { userId: 'carol', userName: 'Carol White', joinedAt: '2024-03-12', role: 'admin' }
      ],
      topics: [],
      resources: [],
      isJoined: false
    }
  ]);

  const [events, setEvents] = useState<Event[]>([
    {
      id: 'e1',
      title: 'JavaScript Masterclass',
      date: '2024-03-25',
      time: '14:00 - 16:00',
      type: 'webinar',
      attendees: 24,
      maxAttendees: 50
    },
    {
      id: 'e2',
      title: 'Q&A with Industry Experts',
      date: '2024-03-28',
      time: '13:00 - 14:30',
      type: 'qna',
      attendees: 15
    }
  ]);

  // UI State
  const [activeView, setActiveView] = useState<'groups' | 'discussions' | 'resources'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
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

  // ==================== HELPER FUNCTIONS ====================
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // ==================== STUDY GROUP FUNCTIONS ====================
  const createStudyGroup = () => {
    if (!newGroup.name || !newGroup.description || !newGroup.course) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    const group: StudyGroup = {
      id: Date.now().toString(),
      name: newGroup.name,
      description: newGroup.description,
      course: newGroup.course,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      members: [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          joinedAt: new Date().toISOString().split('T')[0],
          role: 'admin'
        }
      ],
      topics: [],
      resources: [],
      isJoined: true
    };

    setStudyGroups([...studyGroups, group]);
    setShowCreateGroup(false);
    setNewGroup({ name: '', description: '', course: '' });
    showNotification(`✅ Study group "${group.name}" created successfully!`);
  };

  const joinGroup = (groupId: string) => {
    setStudyGroups(studyGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          members: [
            ...group.members,
            {
              userId: currentUser.id,
              userName: currentUser.name,
              joinedAt: new Date().toISOString().split('T')[0],
              role: 'member'
            }
          ],
          isJoined: true
        };
      }
      return group;
    }));
    setShowJoinModal(false);
    showNotification(`✅ You joined the study group!`);
  };

  const leaveGroup = (groupId: string) => {
    if (confirm('Are you sure you want to leave this group?')) {
      setStudyGroups(studyGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            members: group.members.filter(m => m.userId !== currentUser.id),
            isJoined: false
          };
        }
        return group;
      }));
      setSelectedGroup(null);
      showNotification('You left the group');
    }
  };

  // ==================== DISCUSSION FUNCTIONS ====================
  const createDiscussion = () => {
    if (!newDiscussion.title || !newDiscussion.content) {
      showNotification('Please add title and content', 'error');
      return;
    }

    if (!selectedGroup) return;

    const topic: DiscussionTopic = {
      id: Date.now().toString(),
      title: newDiscussion.title,
      content: newDiscussion.content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString(),
      replies: [],
      tags: newDiscussion.tags.split(',').map(t => t.trim()).filter(t => t)
    };

    setStudyGroups(studyGroups.map(group => {
      if (group.id === selectedGroup.id) {
        return {
          ...group,
          topics: [topic, ...group.topics]
        };
      }
      return group;
    }));

    setShowDiscussionModal(false);
    setNewDiscussion({ title: '', content: '', tags: '' });
    showNotification('✅ Discussion posted!');
  };

  const addReply = (groupId: string, topicId: string) => {
    if (!replyText.trim()) return;

    const reply: Reply = {
      id: Date.now().toString(),
      content: replyText,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    setStudyGroups(studyGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          topics: group.topics.map(topic => {
            if (topic.id === topicId) {
              return {
                ...topic,
                replies: [...topic.replies, reply]
              };
            }
            return topic;
          })
        };
      }
      return group;
    }));

    setReplyText('');
    showNotification('💬 Reply added');
  };

  // ==================== RESOURCE FUNCTIONS ====================
  const addResource = () => {
    if (!newResource.title || !newResource.url) {
      showNotification('Please add title and URL', 'error');
      return;
    }

    if (!selectedGroup) return;

    const resource: Resource = {
      id: Date.now().toString(),
      title: newResource.title,
      type: newResource.type,
      url: newResource.url,
      description: newResource.description,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    setStudyGroups(studyGroups.map(group => {
      if (group.id === selectedGroup.id) {
        return {
          ...group,
          resources: [...group.resources, resource]
        };
      }
      return group;
    }));

    setShowResourceModal(false);
    setNewResource({ title: '', type: 'link', url: '', description: '' });
    showNotification('📚 Resource added!');
  };

  // ==================== FILTERED GROUPS ====================
  const filteredGroups = studyGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==================== RENDER FUNCTIONS ====================
  const renderGroupsList = () => (
    <div className="space-y-6">
      {/* Header */}
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
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Groups Grid */}
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
                  {group.members.length} members
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Created by {group.createdBy}</span>
                <span>{group.createdAt}</span>
              </div>

              <div className="flex gap-2">
                {group.isJoined ? (
                  <>
                    <button
                      onClick={() => setSelectedGroup(group)}
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
                      setSelectedGroup(group);
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

            {/* Stats */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle size={16} />
                <span>{group.topics.length} discussions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText size={16} />
                <span>{group.resources.length} resources</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGroupDetail = () => {
    if (!selectedGroup) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedGroup(null)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Groups
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveView('discussions')}
              className={`pb-4 px-1 ${activeView === 'discussions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              Discussions
            </button>
            <button
              onClick={() => setActiveView('resources')}
              className={`pb-4 px-1 ${activeView === 'resources' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              Resources
            </button>
          </nav>
        </div>

        {/* Discussions View */}
        {activeView === 'discussions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">All Discussions</h3>
              <button
                onClick={() => setShowDiscussionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                New Discussion
              </button>
            </div>

            <div className="space-y-4">
              {selectedGroup.topics.map(topic => (
                <div key={topic.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{topic.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1"><User size={14} /> {topic.authorName}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(topic.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{topic.content}</p>

                  {/* Tags */}
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
                          <span className="font-medium text-sm">{reply.authorName}</span>
                          <span className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{reply.content}</p>
                      </div>
                    ))}

                    {/* Add Reply */}
                    <div className="flex gap-2 mt-4">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Add a reply..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => addReply(selectedGroup.id, topic.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {selectedGroup.topics.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No discussions yet. Start a new discussion!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources View */}
        {activeView === 'resources' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Resources</h3>
              <button
                onClick={() => setShowResourceModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} />
                Add Resource
              </button>
            </div>

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
                          <span>Added by {resource.uploadedBy}</span>
                          <span>{resource.uploadedAt}</span>
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
                  No resources yet. Add a resource!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (currentUser.role !== 'admin') return null;

    return (
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
          <Settings size={20} className="text-gray-600" />
          Admin Panel
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
            <FileText className="text-blue-600 mb-2" size={24} />
            <h3 className="font-semibold">Manage Resources</h3>
            <p className="text-sm text-gray-600 mt-1">Add/edit learning materials</p>
          </button>

          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left">
            <Users className="text-green-600 mb-2" size={24} />
            <h3 className="font-semibold">Manage Groups</h3>
            <p className="text-sm text-gray-600 mt-1">Monitor and moderate groups</p>
          </button>

          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left">
            <Calendar className="text-purple-600 mb-2" size={24} />
            <h3 className="font-semibold">Create Events</h3>
            <p className="text-sm text-gray-600 mt-1">Schedule webinars & workshops</p>
          </button>
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-600 mt-2">Connect with peers, join study groups, and learn together</p>
        </div>

        {/* Main Content */}
        {selectedGroup ? renderGroupDetail() : renderGroupsList()}

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
                    {event.attendees} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''} attending
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                
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

                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Register Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Panel */}
        {renderAdminPanel()}

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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
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
                    <li>• Connect with {selectedGroup.members.length} members</li>
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <LogIn size={16} />
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
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
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn">
            {notification}
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
