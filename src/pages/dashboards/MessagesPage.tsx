import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Search,
  Send,
  Check,
  CheckCheck,
  ChevronLeft,
  Wand2,
  X,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  hasMessages: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at?: string;
}

export function MessagesPage() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSubscription = useRef<ReturnType<
    typeof supabase.channel
  > | null>(null);

  // --- Beautify chat state ---
  const [beautifying, setBeautifying] = useState(false);
  const [showBeautifyConfirm, setShowBeautifyConfirm] = useState(false);
  const [beautifiedChat, setBeautifiedChat] = useState<{
    original: string;
    improved: string;
  } | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---------- Data fetchers ----------
  const fetchContacts = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .neq('id', profile.id)
        .order('full_name');

      if (error) throw error;

      const { data: allMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      const contactsList: Contact[] = (profiles || []).map((user) => {
        const userMessages = (allMessages || []).filter(
          (msg) =>
            (msg.sender_id === profile.id && msg.receiver_id === user.id) ||
            (msg.sender_id === user.id && msg.receiver_id === profile.id)
        );

        const lastMsg = userMessages[0];
        const unreadCount = userMessages.filter(
          (msg) => msg.receiver_id === profile.id && !msg.is_read
        ).length;

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          lastMessage: lastMsg?.content,
          lastMessageTime: lastMsg ? new Date(lastMsg.created_at) : undefined,
          unreadCount,
          hasMessages: userMessages.length > 0,
        };
      });

      const withMessages = contactsList
        .filter((c) => c.hasMessages)
        .sort(
          (a, b) =>
            (b.lastMessageTime?.getTime() || 0) -
            (a.lastMessageTime?.getTime() || 0)
        );

      const withoutMessages = contactsList
        .filter((c) => !c.hasMessages)
        .sort((a, b) => a.name.localeCompare(b.name));

      setContacts([...withMessages, ...withoutMessages]);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  }, [profile?.id]);

  const fetchMessages = useCallback(
    async (contactId: string) => {
      if (!profile?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${profile.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${profile.id})`
          )
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [profile?.id]
  );

  const markMessagesAsRead = useCallback(
    async (contactId: string) => {
      if (!profile?.id) return;

      try {
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('receiver_id', profile.id)
          .eq('sender_id', contactId)
          .eq('is_read', false);

        if (error) throw error;
        fetchContacts(); // update unread badges
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    },
    [profile?.id, fetchContacts]
  );

  // ---------- Realtime subscription ----------
  const subscribeToMessages = useCallback(
    (contactId: string) => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
        messageSubscription.current = null;
      }

      const channel = supabase
        .channel(`messages-${profile?.id}-${contactId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            const row = (payload.new || payload.old) as Message;

            const isForThisThread =
              (row.sender_id === profile?.id &&
                row.receiver_id === contactId) ||
              (row.sender_id === contactId && row.receiver_id === profile?.id);

            if (!isForThisThread) return;

            if (payload.eventType === 'INSERT') {
              setMessages((prev) => {
                const next = [...prev, payload.new as Message];
                return next.sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime()
                );
              });

              if ((payload.new as Message).receiver_id === profile?.id) {
                markMessagesAsRead(contactId);
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === (payload.new as Message).id
                    ? (payload.new as Message)
                    : m
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setMessages((prev) =>
                prev.filter((m) => m.id !== (payload.old as Message).id)
              );
            }

            fetchContacts();
          }
        )
        .subscribe();

      messageSubscription.current = channel;
    },
    [profile?.id, fetchContacts, markMessagesAsRead]
  );

  // ---------- Effects ----------
  useEffect(() => {
    if (profile?.id) {
      fetchContacts();
    }
  }, [profile?.id, fetchContacts]);

  useEffect(() => {
    if (selectedContact?.id) {
      fetchMessages(selectedContact.id);
      markMessagesAsRead(selectedContact.id);
      subscribeToMessages(selectedContact.id);
    }

    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
        messageSubscription.current = null;
      }
    };
  }, [
    selectedContact?.id,
    fetchMessages,
    markMessagesAsRead,
    subscribeToMessages,
  ]);

  // ---------- Actions ----------
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !profile?.id) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: profile.id,
        receiver_id: selectedContact.id,
        content: newMessage.trim(),
        is_read: false,
      });

      if (error) throw error;

      setNewMessage('');
      // Realtime will append the message
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // ---------- Beautify chat handlers ----------
  // ---------- Beautify chat handlers (fetch -> supabase function, like AnnouncementsPage) ----------
  const handleBeautifyChat = async () => {
    if (!newMessage.trim()) return;
    setBeautifying(true);

    try {
      const apiUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/functions/v1/beautify-announcement`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '',
          content: newMessage,
          tone: 'friendly',
        }),
      });

      // parse body (attempt to parse JSON even on error for clearer messages)
      let data: any = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        // non-json body
        data = null;
      }

      if (!response.ok) {
        // server provided an error structure
        const serverMessage =
          data?.error ||
          data?.message ||
          `Beautify failed (${response.status})`;
        throw new Error(serverMessage);
      }

      // Expect { beautifiedTitle, beautifiedContent }
      const improved = (data?.beautifiedContent as string) || newMessage;
      setBeautifiedChat({ original: newMessage, improved });
      setShowBeautifyConfirm(true);
    } catch (err) {
      console.error('Error beautifying chat message:', err);
      // Minimal user feedback - replace with Notification if you add it
      try {
        // eslint-disable-next-line no-alert
        alert(
          err instanceof Error
            ? err.message
            : 'Failed to beautify message. Please try again.'
        );
      } catch {}
    } finally {
      setBeautifying(false);
    }
  };

  const handleAcceptBeautifiedChat = () => {
    if (!beautifiedChat) return;
    setNewMessage(beautifiedChat.improved);
    setShowBeautifyConfirm(false);
    setBeautifiedChat(null);
  };

  const handleRejectBeautifiedChat = () => {
    setShowBeautifyConfirm(false);
    setBeautifiedChat(null);
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (hours < 48) {
      return 'Yesterday';
    } else if (hours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <DashboardLayout>
      {/* Wrapper: prevent horizontal scroll on mobile, keep desktop layout intact */}
      <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden w-full min-w-0">
        {/* Sidebar (Contacts) */}
        <div
          className={`w-full md:w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col ${
            selectedContact ? 'hidden md:flex' : ''
          }`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Message
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No contacts found
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedContact?.id === contact.id
                      ? 'bg-blue-50 dark:bg-gray-700'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold">
                          {contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {contact.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-semibold">
                            {contact.unreadCount > 9
                              ? '9+'
                              : contact.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-semibold truncate ${
                            contact.unreadCount > 0
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {contact.name}
                        </h3>
                        {contact.lastMessageTime && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(contact.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm truncate ${
                            contact.unreadCount > 0
                              ? 'text-gray-900 dark:text-white font-medium'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {contact.lastMessage || 'Start a conversation'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Pane */}
        <div
          className={`flex-1 flex flex-col ${
            !selectedContact ? 'hidden md:flex' : ''
          }`}
        >
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a contact to start messaging
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile back button */}
                    <button
                      onClick={() => setSelectedContact(null)}
                      className="md:hidden mr-1 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="Back to contacts"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {selectedContact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="truncate">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {selectedContact.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                        {selectedContact.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* reserved for future actions */}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isSent = message.sender_id === profile?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isSent ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-2xl break-words ${
                              isSent
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <p className="text-sm break-words whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <p
                                className={`text-xs ${
                                  isSent
                                    ? 'text-blue-100'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {new Date(
                                  message.created_at
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {isSent && (
                                <span className="text-blue-100">
                                  {message.is_read ? (
                                    <CheckCheck className="h-4 w-4" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.shiftKey) return; // allow manual line breaks
                        e.preventDefault();
                        // check for double enter
                        if (newMessage.trim().endsWith('\n')) {
                          sendMessage();
                        } else {
                          setNewMessage((prev) => prev + '\n');
                        }
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />

                  {/* Beautify button */}
                  <button
                    onClick={handleBeautifyChat}
                    disabled={!newMessage.trim() || beautifying}
                    className="p-2.5 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full transition-colors flex items-center justify-center"
                    title="Improve message with AI"
                  >
                    <Wand2
                      className={`h-5 w-5 ${beautifying ? 'animate-spin' : ''}`}
                    />
                  </button>

                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Beautify confirm modal */}
      {showBeautifyConfirm && beautifiedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[34rem] bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Improved Message
              </h3>
              <button
                onClick={handleRejectBeautifiedChat}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Original
                </label>
                <div className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {beautifiedChat.original}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Improved
                </label>
                <div className="w-full px-4 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {beautifiedChat.improved}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleRejectBeautifiedChat}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Keep Original
                </button>
                <button
                  onClick={handleAcceptBeautifiedChat}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Use Improved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
