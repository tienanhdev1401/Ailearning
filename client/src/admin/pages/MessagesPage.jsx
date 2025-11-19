import { useEffect, useMemo, useRef, useState } from 'react';
import { EMOJIS, INITIAL_CONVERSATIONS, QUICK_RESPONSES } from '../data/messages';

const formatTimeLabel = (date) => date.toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
});

const createMessage = (text, sent) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  text,
  time: formatTimeLabel(new Date()),
  sent,
  read: sent
});

const MessagesPage = () => {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef(null);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 992 && INITIAL_CONVERSATIONS.length > 0) {
      setSelectedId(INITIAL_CONVERSATIONS[0].id);
    }
  }, []);

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.id === selectedId) || null,
    [conversations, selectedId]
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const haystack = `${conv.name} ${conv.lastMessage} ${conv.type}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [conversations, searchQuery]);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [selectedConversation?.id, selectedConversation?.messages.length]);

  const updateConversation = (conversationId, updater) => {
    setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? updater(conv) : conv)));
  };

  const handleSelectConversation = (conversation) => {
    setSelectedId(conversation.id);
    setSidebarVisible(false);
    updateConversation(conversation.id, (conv) => ({ ...conv, unread: 0 }));
  };

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;
    const trimmed = newMessage.trim();
    const outgoing = createMessage(trimmed, true);

    updateConversation(selectedConversation.id, (conv) => ({
      ...conv,
      messages: [...conv.messages, outgoing],
      lastMessage: trimmed,
      lastMessageTime: 'now',
      unread: 0
    }));

    setNewMessage('');
    setShowEmojiPicker(false);
    simulateResponse(selectedConversation.id);
  };

  const simulateResponse = (conversationId) => {
    setIsTyping(true);
    const responses = [
      'Thanks for the update!',
      "I'll look into that right away.",
      'Can you share a bit more context?',
      'Sounds good to me.'
    ];

    setTimeout(() => {
      setIsTyping(false);
      const incoming = createMessage(responses[Math.floor(Math.random() * responses.length)], false);
      updateConversation(conversationId, (conv) => ({
        ...conv,
        messages: [...conv.messages, incoming],
        lastMessage: incoming.text,
        lastMessageTime: 'now',
        unread: selectedIdRef.current === conversationId ? 0 : conv.unread + 1
      }));
    }, 1500 + Math.random() * 1200);
  };

  const handleTextareaKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickResponse = (text) => {
    setNewMessage((prev) => `${prev}${prev ? ' ' : ''}${text}`.trimStart());
    setShowEmojiPicker(false);
  };

  const notify = (message) => {
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
  };

  const handleMarkAllRead = () => {
    setConversations((prev) => prev.map((conv) => ({ ...conv, unread: 0 })));
  };

  const handleNewConversation = () => {
    const nextConversation = {
      id: `draft-${Date.now()}`,
      name: 'New Conversation',
      avatar: '/assets/images/avatar-placeholder.svg',
      type: 'Customer',
      online: true,
      lastMessage: 'Say hello to get started',
      lastMessageTime: 'now',
      lastSeen: 'just now',
      unread: 0,
      messages: []
    };
    setConversations((prev) => [nextConversation, ...prev]);
    setSelectedId(nextConversation.id);
    setSidebarVisible(false);
    setNewMessage('');
  };

  const handleDeleteConversation = () => {
    if (!selectedConversation) return;
    setConversations((prev) => prev.filter((conv) => conv.id !== selectedConversation.id));
    setSelectedId(null);
  };

  const handleArchiveConversation = () => {
    if (selectedConversation) notify(`${selectedConversation.name} archived`);
  };

  const handleMuteConversation = () => {
    if (selectedConversation) notify('Notifications muted for this conversation');
  };

  const handleAttachment = () => notify('File attachment action would open here');
  const handleVideoCall = () => notify('Video call would start here');
  const handleVoiceCall = () => notify('Voice call would start here');

  return (
    <div className="messages-page container-fluid p-4 p-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">Messages</h1>
          <p className="text-muted mb-0">Real-time communication center</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary d-lg-none" onClick={() => setSidebarVisible((value) => !value)}>
            <i className="bi bi-list me-2" />Conversations
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleMarkAllRead}>
            <i className="bi bi-check-all me-2" />Mark All Read
          </button>
          <button type="button" className="btn btn-primary" onClick={handleNewConversation}>
            <i className="bi bi-plus-lg me-2" />New Message
          </button>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-layout">
          <div className={`messages-sidebar${sidebarVisible ? ' mobile-show' : ''}`}>
            <div className="messages-header">
              <h5 className="header-title mb-0">Messages</h5>
              <div className="d-flex gap-2 mt-3">
                <div className="search-container flex-grow-1">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <i className="bi bi-search search-icon" />
                </div>
                <button type="button" className="btn btn-primary btn-sm" title="New Message" onClick={handleNewConversation}>
                  <i className="bi bi-plus-lg" />
                </button>
              </div>
            </div>

            <div className="conversations-list">
              {filteredConversations.map((conversation) => {
                const isActive = selectedConversation?.id === conversation.id;
                return (
                  <div
                    role="button"
                    tabIndex={0}
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    onKeyDown={(event) => event.key === 'Enter' && handleSelectConversation(conversation)}
                    className={`conversation-item${isActive ? ' active' : ''}${conversation.unread > 0 ? ' unread' : ''}`}
                  >
                    <div className="conversation-avatar">
                      <img src={conversation.avatar} alt={conversation.name} className={conversation.online ? 'online' : undefined} />
                      {conversation.online && <div className="online-indicator" />}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h6 className="conversation-name">{conversation.name}</h6>
                        <span className="conversation-time">{conversation.lastMessageTime}</span>
                      </div>
                      <p className="conversation-preview">{conversation.lastMessage}</p>
                      <div className="conversation-footer">
                        <span className="conversation-type">{conversation.type}</span>
                        {conversation.unread > 0 && <span className="unread-badge">{conversation.unread}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredConversations.length === 0 && (
                <div className="empty-conversations">
                  <i className="bi bi-chat-dots" />
                  <p>No conversations found</p>
                </div>
              )}
            </div>
          </div>

          <div className="chat-area">
            {selectedConversation ? (
              <div className="active-chat">
                <div className="chat-header">
                  <div className="chat-user-info">
                    <button type="button" className="btn btn-link d-lg-none me-2 p-0" onClick={() => setSidebarVisible((value) => !value)}>
                      <i className="bi bi-arrow-left fs-5" />
                    </button>
                    <div className="chat-avatar-container">
                      <img src={selectedConversation.avatar} className="chat-avatar" alt={selectedConversation.name} />
                      {selectedConversation.online && <div className="online-indicator" />}
                    </div>
                    <div className="chat-details">
                      <h6 className="chat-name">{selectedConversation.name}</h6>
                      <p className="chat-status">{selectedConversation.online ? '● Online' : `Last seen ${selectedConversation.lastSeen}`}</p>
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button type="button" className="btn" onClick={handleVideoCall} title="Video Call">
                      <i className="bi bi-camera-video" />
                    </button>
                    <button type="button" className="btn" onClick={handleVoiceCall} title="Voice Call">
                      <i className="bi bi-telephone" />
                    </button>
                    <div className="dropdown">
                      <button className="btn dropdown-toggle" data-bs-toggle="dropdown" title="More Options">
                        <i className="bi bi-three-dots-vertical" />
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button type="button" className="dropdown-item" onClick={handleMuteConversation}>
                            <i className="bi bi-bell-slash me-2" />Mute notifications
                          </button>
                        </li>
                        <li>
                          <button type="button" className="dropdown-item" onClick={handleArchiveConversation}>
                            <i className="bi bi-archive me-2" />Archive chat
                          </button>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <button type="button" className="dropdown-item text-danger" onClick={handleDeleteConversation}>
                            <i className="bi bi-trash me-2" />Delete chat
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="chat-messages" id="chatMessages" ref={chatRef}>
                  <div className="date-separator">
                    <span className="date-label">Today</span>
                  </div>
                  <div className="message-group">
                    {selectedConversation.messages.map((message) => (
                      <div key={message.id} className={`message${message.sent ? ' own-message' : ''}`}>
                        {!message.sent && (
                          <img src={selectedConversation.avatar} className="message-avatar" alt={selectedConversation.name} />
                        )}
                        <div className="message-bubble">
                          <div className="message-content">
                            <p>{message.text}</p>
                          </div>
                          <div className="message-info">
                            <span className="message-time">{message.time}</span>
                            {message.sent && (
                              <span className="message-status">
                                <i className={`bi ${message.read ? 'bi-check-all' : 'bi-check'}`} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {isTyping && (
                    <div className="typing-indicator">
                      <img src={selectedConversation.avatar} className="typing-avatar" alt={selectedConversation.name} />
                      <div className="typing-content">
                        <div className="typing-dots">
                          <div className="dot" />
                          <div className="dot" />
                          <div className="dot" />
                        </div>
                        <span className="typing-text">typing...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-input">
                  <div className="input-container">
                    <div className="input-actions">
                      <button type="button" className="btn" onClick={handleAttachment} title="Attach file">
                        <i className="bi bi-paperclip" />
                      </button>
                    </div>
                    <div className="message-input">
                      <textarea
                        className="form-control"
                        placeholder="Type a message..."
                        rows={1}
                        value={newMessage}
                        onChange={(event) => setNewMessage(event.target.value)}
                        onKeyDown={handleTextareaKeyDown}
                        style={{ resize: 'none' }}
                      />
                    </div>
                    <div className="input-actions">
                      <button type="button" className="btn" title="Add emoji" onClick={() => setShowEmojiPicker((value) => !value)}>
                        <i className="bi bi-emoji-smile" />
                      </button>
                      <button type="button" className="btn btn-primary" onClick={handleSendMessage} disabled={!newMessage.trim()} title="Send message">
                        <i className="bi bi-send" />
                      </button>
                    </div>
                  </div>
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      <div className="emoji-grid">
                        {EMOJIS.map((emoji) => (
                          <button type="button" key={emoji} className="emoji-btn" onClick={() => setNewMessage((prev) => `${prev}${emoji}`)}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {QUICK_RESPONSES.map((reply) => (
                      <button type="button" key={reply} className="btn btn-outline-secondary btn-sm" onClick={() => handleQuickResponse(reply)}>
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-chat">
                <div className="empty-icon">
                  <i className="bi bi-chat-dots" />
                </div>
                <h5 className="empty-text">Select a conversation to start messaging</h5>
                <p className="text-muted mb-4">Choose from your existing conversations or start a new one</p>
                <button type="button" className="btn btn-primary" onClick={handleNewConversation}>
                  <i className="bi bi-plus-lg me-2" />Start New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
