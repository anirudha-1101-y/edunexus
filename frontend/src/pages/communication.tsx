import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SearchFilterBar } from '../components/ui/SearchFilterBar';
import { erpService } from '../services/erpService';
import { Announcement, DirectMessage } from '../types/erp';
import { useToast } from '../context/ToastContext';
import { useRole } from '../context/RoleContext';
import {
  MessageSquare,
  Bell,
  Send,
  Plus,
  Mail,
  User,
  Clock,
  Paperclip,
  CheckCheck,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function CommunicationPage() {
  const { success, error } = useToast();
  const { currentUser } = useRole();

  const [activeTab, setActiveTab] = useState<'announcements' | 'messages'>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<DirectMessage | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');

  // Modals
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  // New Announcement Form State
  const [newAnn, setNewAnn] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL' as Announcement['targetAudience'],
    priority: 'MEDIUM' as Announcement['priority'],
    attachmentName: '',
  });

  // Compose Message State
  const [newMsg, setNewMsg] = useState({
    recipientName: 'Dr. Arthur Vance (Principal)',
    subject: '',
    fullBody: '',
    priority: 'NORMAL' as const,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [anns, msgs] = await Promise.all([
        erpService.getAnnouncements(),
        erpService.getMessages(),
      ]);
      setAnnouncements(anns);
      setMessages(msgs);
      if (msgs.length > 0) setSelectedMessage(msgs[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.content) {
      error('Title and Content Required', 'Please provide an announcement headline and body text.');
      return;
    }
    const created = await erpService.createAnnouncement({
      ...newAnn,
      authorName: currentUser.name,
      authorRole: currentUser.role,
    });
    setAnnouncements([created, ...announcements]);
    setAnnouncementModalOpen(false);
    success('Announcement Broadcasted', `"${created.title}" published to ${created.targetAudience}.`);
    setNewAnn({ title: '', content: '', targetAudience: 'ALL', priority: 'MEDIUM', attachmentName: '' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.subject || !newMsg.fullBody) {
      error('Subject & Message Required', 'Please fill in both message subject and message body.');
      return;
    }
    const created = await erpService.sendMessage({
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientName: newMsg.recipientName,
      subject: newMsg.subject,
      preview: newMsg.fullBody.slice(0, 80) + '...',
      fullBody: newMsg.fullBody,
      priority: newMsg.priority,
    });
    setMessages([created, ...messages]);
    setSelectedMessage(created);
    setComposeModalOpen(false);
    success('Message Dispatched', `Direct message sent to ${created.recipientName}.`);
    setNewMsg({ recipientName: 'Dr. Arthur Vance (Principal)', subject: '', fullBody: '', priority: 'NORMAL' });
  };

  // Filtered Announcements
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    const matchesAudience = audienceFilter === 'ALL' || a.targetAudience === audienceFilter;
    return matchesSearch && matchesAudience;
  });

  return (
    <MainLayout>
      <PageHeader
        title="Communication & Announcements Center"
        subtitle="Campus broadcast announcements, audience targeting, emergency alerts, and direct messaging threads."
        breadcrumbs={[{ label: 'Communication' }]}
        actions={
          <div className="flex items-center space-x-2.5">
            {activeTab === 'announcements' ? (
              <button
                onClick={() => setAnnouncementModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Announcement
              </button>
            ) : (
              <button
                onClick={() => setComposeModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Compose Message
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'announcements' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Campus Announcements ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'messages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Direct Messages ({messages.length})
        </button>
      </div>

      {/* Tab 1: Campus Announcements */}
      {activeTab === 'announcements' && (
        <div>
          <SearchFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search announcement titles, text keywords..."
            filters={[
              {
                id: 'audience',
                label: 'Audience Target',
                value: audienceFilter,
                onChange: setAudienceFilter,
                options: [
                  { label: 'All Audiences', value: 'ALL' },
                  { label: 'Students', value: 'STUDENTS' },
                  { label: 'Parents', value: 'PARENTS' },
                  { label: 'Teachers', value: 'TEACHERS' },
                  { label: 'Staff Personnel', value: 'STAFF' },
                ],
              },
            ]}
            onReset={() => {
              setSearch('');
              setAudienceFilter('ALL');
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                      Target: {ann.targetAudience}
                    </span>
                    <StatusBadge status={ann.priority} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{ann.title}</h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{ann.content}</p>

                  {ann.attachmentName && (
                    <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center text-xs text-slate-700">
                      <Paperclip className="w-4 h-4 text-slate-400 mr-2" />
                      <span className="font-medium truncate">{ann.attachmentName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Published by <strong className="text-slate-700">{ann.authorName}</strong> ({ann.authorRole})</span>
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {ann.publishDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Direct Messages (Split View) */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
          {/* Thread List */}
          <div className="border-r border-slate-200 divide-y divide-slate-100 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedMessage?.id === msg.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 truncate">{msg.senderName}</span>
                  <span className="text-[10px] text-slate-400">{msg.sentAt}</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-1">{msg.subject}</div>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{msg.preview}</p>
              </div>
            ))}
          </div>

          {/* Message Reader */}
          <div className="md:col-span-2 p-6 flex flex-col justify-between">
            {selectedMessage ? (
              <div>
                <div className="pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {selectedMessage.senderRole}
                    </span>
                    <span className="text-xs text-slate-400">{selectedMessage.sentAt}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedMessage.subject}</h3>
                  <div className="mt-1 text-xs text-slate-500">
                    From: <span className="font-medium text-slate-800">{selectedMessage.senderName}</span> • To: {selectedMessage.recipientName}
                  </div>
                </div>

                <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedMessage.fullBody}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                Select a message thread from the left to read conversation.
              </div>
            )}

            {selectedMessage && (
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center">
                  <CheckCheck className="w-4 h-4 text-blue-600 mr-1.5" />
                  Delivered via Internal Campus Mailbox
                </span>
                <button
                  onClick={() => setComposeModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Announcement */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Bell className="w-4 h-4 text-blue-600 mr-2" />
                Broadcast Campus Announcement
              </h3>
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Headline / Subject *</label>
                <input
                  type="text"
                  required
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Schedule for Final Exam Preparations"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={newAnn.targetAudience}
                    onChange={(e) => setNewAnn({ ...newAnn, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                  >
                    <option value="ALL">Entire Campus (All)</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="PARENTS">Parents Only</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="STAFF">Staff & Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={newAnn.priority}
                    onChange={(e) => setNewAnn({ ...newAnn, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                  >
                    <option value="LOW">Low Notice</option>
                    <option value="MEDIUM">Standard Notice</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Announcement Body *</label>
                <textarea
                  rows={4}
                  required
                  value={newAnn.content}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  placeholder="Detailed information regarding dates, policies, or event instructions..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attachment (Optional)</label>
                <input
                  type="text"
                  value={newAnn.attachmentName}
                  onChange={(e) => setNewAnn({ ...newAnn, attachmentName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                  placeholder="e.g. ExamDatesheet_Fall2025.pdf"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Compose Direct Message */}
      {composeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Mail className="w-4 h-4 text-blue-600 mr-2" />
                Compose Direct Message
              </h3>
              <button
                onClick={() => setComposeModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient</label>
                <select
                  value={newMsg.recipientName}
                  onChange={(e) => setNewMsg({ ...newMsg, recipientName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="Dr. Arthur Vance (Principal)">Dr. Arthur Vance (Principal)</option>
                  <option value="Sarah Jenkins (Homeroom Teacher)">Sarah Jenkins (Homeroom Teacher)</option>
                  <option value="Harold Finch (Chief Bursar)">Harold Finch (Chief Bursar)</option>
                  <option value="Rachel Zane (HR Lead)">Rachel Zane (HR Lead)</option>
                  <option value="John Doe (Student)">John Doe (Student)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={newMsg.subject}
                  onChange={(e) => setNewMsg({ ...newMsg, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white"
                  placeholder="Subject matter..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  rows={4}
                  required
                  value={newMsg.fullBody}
                  onChange={(e) => setNewMsg({ ...newMsg, fullBody: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white leading-relaxed"
                  placeholder="Type your message here..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setComposeModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
