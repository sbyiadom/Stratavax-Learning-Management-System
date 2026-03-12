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
  Loader2,
  Github,
  FileSpreadsheet
} from 'lucide-react';

interface Discussion {
  id: number;
  title: string;
  author: string;
  authorInitials: string;
  course: string;
  replies: number;
  lastActive: string;
}

interface StudyGroup {
  id: number;
  name: string;
  members: number;
  course: string;
  color: string;
}

interface Event {
  id: number;
  month: string;
  day: string;
  title: string;
  time: string;
  attendees: number;
}

export default function CommunityPage() {
  // State for data
  const [discussions, setDiscussions] = useState<Discussion[]>([
    {
      id: 1,
      title: "Understanding JavaScript Closures",
      author: "Alice Johnson",
      authorInitials: "AJ",
      course: "Web Development",
      replies: 12,
      lastActive: "2 hours ago"
    },
    {
      id: 2,
      title: "Machine Learning Project Help",
      author: "Bob Smith",
      authorInitials: "BS",
      course: "Data Science",
      replies: 8,
      lastActive: "5 hours ago"
    },
    {
      id: 3,
      title: "UI Design Feedback Request",
      author: "Carol White",
      authorInitials: "CW",
      course: "UI/UX Design",
      replies: 15,
      lastActive: "1 day ago"
    }
  ]);

  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([
    { id: 1, name: 'Web Development Masters', members: 12, course: 'Web Development', color: '#4CAF50' },
    { id: 2, name: 'Data Science Study Group', members: 8, course: 'Data Science', color: '#2196F3' },
    { id: 3, name: 'UI/UX Design Critics', members: 6, course: 'UI/UX Design', color: '#FF9800' }
  ]);

  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      month: 'MAR',
      day: '25',
      title: 'Web Development Workshop',
      time: '2:00 PM - 4:00 PM EST',
      attendees: 24
    },
    {
      id: 2,
      month: 'MAR',
      day: '28',
      title: 'Q&A with Instructors',
      time: '1:00 PM - 2:30 PM EST',
      attendees: 15
    },
    {
      id: 3,
      month: 'APR',
      day: '02',
      title: 'Study Group Kickoff',
      time: '3:00 PM - 4:00 PM EST',
      attendees: 32
    }
  ]);

  // Modal states
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [newTopic, setNewTopic] = useState({ title: '', course: '', message: '' });
  const [newGroup, setNewGroup] = useState({ name: '', course: '', description: '' });
  const [attendeeEmail, setAttendeeEmail] = useState('john.doe@example.com');

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Create new discussion topic
  const createTopic = () => {
    if (!newTopic.title || !newTopic.message) {
      showNotification('Please fill in all fields');
      return;
    }

    const newDiscussion: Discussion = {
      id: discussions.length + 1,
      title: newTopic.title,
      author: "You",
      authorInitials: "YO",
      course: newTopic.course || "General",
      replies: 0,
      lastActive: "Just now"
    };

    setDiscussions([newDiscussion, ...discussions]);
    setShowTopicModal(false);
    showNotification('✅ Discussion posted successfully!');
    setNewTopic({ title: '', course: '', message: '' });
  };

  // Create new study group
  const createStudyGroup = () => {
    if (!newGroup.name || !newGroup.description) {
      showNotification('Please fill in all fields');
      return;
    }

    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newStudyGroup: StudyGroup = {
      id: studyGroups.length + 1,
      name: newGroup.name,
      members: 1,
      course: newGroup.course || "General",
      color: randomColor
    };

    setStudyGroups([...studyGroups, newStudyGroup]);
    setShowGroupModal(false);
    showNotification(`✅ Study group "${newGroup.name}" created!`);
    setNewGroup({ name: '', course: '', description: '' });
  };

  // Register for event
  const registerForEvent = () => {
    if (!attendeeEmail) {
      showNotification('Please enter your email');
      return;
    }

    if (currentEvent) {
      setEvents(events.map(e => 
        e.id === currentEvent.id 
          ? { ...e, attendees: e.attendees + 1 }
          : e
      ));
      showNotification(`✅ Registered for ${currentEvent.title}!`);
    }

    setShowEventModal(false);
    setCurrentEvent(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
        <p className="text-gray-600">Connect with peers, join discussions, and grow together</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Study Groups Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Users className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Study Groups</h2>
          <p className="text-gray-600 mb-4">Join study groups to learn with peers. Connect with fellow students taking the same courses.</p>
          <div className="flex justify-between text-sm text-blue-600 border-t pt-4">
            <span><Users size={16} className="inline mr-1" /> {studyGroups.length} Active Groups</span>
            <span className="font-medium">Join Now →</span>
          </div>
        </div>

        {/* Discussions Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
            <MessageCircle className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Discussions</h2>
          <p className="text-gray-600 mb-4">Participate in course discussions. Ask questions and share knowledge with the community.</p>
          <div className="flex justify-between text-sm text-green-600 border-t pt-4">
            <span><MessageCircle size={16} className="inline mr-1" /> {discussions.length} Active Topics</span>
            <span className="font-medium">Join Discussion →</span>
          </div>
        </div>

        {/* Events Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Events</h2>
          <p className="text-gray-600 mb-4">Upcoming webinars, workshops, and live sessions. Stay tuned for community events.</p>
          <div className="flex justify-between text-sm text-orange-600 border-t pt-4">
            <span><Calendar size={16} className="inline mr-1" /> {events.length} Upcoming</span>
            <span className="font-medium">View All →</span>
          </div>
        </div>
      </div>

      {/* Features Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 text-white mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Rocket size={24} />
          Community Features Coming Soon
        </h2>
        <p className="text-blue-100 mb-6">We're building a vibrant community for learners. Soon you'll be able to:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
            <MessageCircle size={20} />
            <span>Join discussion forums for each course</span>
          </div>
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
            <Users size={20} />
            <span>Create and join study groups</span>
          </div>
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
            <Sparkles size={20} />
            <span>Live Q&A sessions with instructors</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setShowTopicModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileSpreadsheet size={18} />
          Export Excel
        </button>
        <button 
          onClick={() => showNotification('🔗 Connecting to GitHub...')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Github size={18} />
          Connect GitHub
        </button>
      </div>

      {/* Active Discussions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="text-blue-600" size={20} />
            Active Discussions
          </h3>
          <button 
            onClick={() => setShowTopicModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            New Topic
          </button>
        </div>

        <div className="space-y-4">
          {discussions.map(discussion => (
            <div 
              key={discussion.id}
              className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                {discussion.authorInitials}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{discussion.title}</h4>
                <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><User size={14} /> {discussion.author}</span>
                  <span className="flex items-center gap-1"><BookOpen size={14} /> {discussion.course}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {discussion.lastActive}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Reply size={14} /> {discussion.replies}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Groups */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="text-blue-600" size={20} />
            Your Study Groups
          </h3>
          <button 
            onClick={() => setShowGroupModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={18} />
            Create New Group
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studyGroups.map(group => (
            <div 
              key={group.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg mb-3" style={{ backgroundColor: group.color }}></div>
              <h4 className="font-semibold text-gray-900">{group.name}</h4>
              <div className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                <Users size={14} /> {group.members} members
              </div>
              <div className="text-xs text-blue-600 mt-2">{group.course}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <Calendar className="text-blue-600" size={20} />
          Upcoming Events
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map(event => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600">{event.month}</div>
                  <div className="text-2xl font-bold text-gray-900">{event.day}</div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{event.title}</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Clock size={14} /> {event.time}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">
                      <Users size={12} className="inline mr-1" /> {event.attendees} attending
                    </span>
                    <button 
                      onClick={() => {
                        setCurrentEvent(event);
                        setShowEventModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Start New Discussion</h3>
              <button onClick={() => setShowTopicModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                  placeholder="e.g., Question about JavaScript"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select 
                  value={newTopic.course}
                  onChange={(e) => setNewTopic({...newTopic, course: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option>Web Development</option>
                  <option>Data Science</option>
                  <option>UI/UX Design</option>
                  <option>Python Programming</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea 
                  value={newTopic.message}
                  onChange={(e) => setNewTopic({...newTopic, message: e.target.value})}
                  placeholder="What would you like to discuss?"
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowTopicModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={createTopic}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Post Discussion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create Study Group</h3>
              <button onClick={() => setShowGroupModal(false)}>
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
                  placeholder="e.g., JavaScript Study Group"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select 
                  value={newGroup.course}
                  onChange={(e) => setNewGroup({...newGroup, course: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option>Web Development</option>
                  <option>Data Science</option>
                  <option>UI/UX Design</option>
                  <option>Python Programming</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="What will this group study?"
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={createStudyGroup}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Registration Modal */}
      {showEventModal && currentEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Register for Event</h3>
              <button onClick={() => setShowEventModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-2">{currentEvent.title}</h4>
              <p className="text-gray-600 flex items-center gap-2"><Calendar size={16} /> {currentEvent.month} {currentEvent.day}</p>
              <p className="text-gray-600 flex items-center gap-2"><Clock size={16} /> {currentEvent.time}</p>
              <p className="text-gray-600 flex items-center gap-2"><Users size={16} /> {currentEvent.attendees} already registered</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Email</label>
              <input 
                type="email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={registerForEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn">
          {notification}
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
      `}</style>
    </div>
  );
}
