import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import AuthImage from '../../components/AuthImage';
import { getUser } from '../../utils/auth';
import config from '../../config/config';

const API_URL = config.API_URL;
const BASE_URL = API_URL.replace('/api', '');

function userAvatar(user, size = 36) {
  const initials = (user?.nickname || user?.email || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = [...(user?.nickname || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const pic = user?.links?.find(l => l.description?.toLowerCase() === 'profile picture');
  if (pic) return <AuthImage src={pic.url.startsWith('http') ? pic.url : `${BASE_URL}${pic.url}`} alt={user.nickname} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} fallback={<AvatarInitials initials={initials} hue={hue} size={size} />} />;
  return <AvatarInitials initials={initials} hue={hue} size={size} />;
}

function AvatarInitials({ initials, hue, size }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},50%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, color: '#fff', fontWeight: 700, flexShrink: 0 }}>{initials}</div>;
}

function formatTime(dateStr) {
  const d = new Date(dateStr); const now = new Date(); const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function getOther(chat, myId) {
  return chat.participants?.find(p => (p._id || p) !== myId) || chat.participants?.[0];
}

function ChatsPage() {
  const navigate = useNavigate();
  const { theme } = useContext(SettingsContext);
  const [params] = useSearchParams();
  const currentUser = getUser();
  const myId = currentUser?._id;
  const token = localStorage.getItem('token');
  const ah = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const msgPollRef = useRef(null);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    (async () => { setLoading(true); await fetchChats(); setLoading(false); })();
    pollRef.current = setInterval(fetchChats, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    const chatId = params.get('chat');
    if (chatId && chats.length) { const found = chats.find(c => c._id === chatId); if (found) openChat(found); }
  }, [params, chats]);

  const fetchChats = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/chats`, { headers: ah });
      if (r.ok) { const d = await r.json(); setChats(d.data || []); }
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (chatId) => {
    try {
      const r = await fetch(`${API_URL}/chats/${chatId}/messages?limit=50`, { headers: ah });
      if (r.ok) { const d = await r.json(); setMessages(d.data || []); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50); }
    } catch {}
  }, []);

  const openChat = useCallback(async (chat) => {
    setActiveChat(chat); setMsgLoading(true);
    await fetchMessages(chat._id);
    setMsgLoading(false); fetchChats();
    clearInterval(msgPollRef.current);
    msgPollRef.current = setInterval(() => fetchMessages(chat._id), 3000);
  }, [fetchMessages, fetchChats]);

  useEffect(() => () => clearInterval(msgPollRef.current), []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      const r = await fetch(`${API_URL}/chats/${activeChat._id}/messages`, { method: 'POST', headers: ah, body: JSON.stringify({ text: text.trim() }) });
      if (r.ok) { setText(''); await fetchMessages(activeChat._id); fetchChats(); }
    } catch {}
    setSending(false);
  };

  const deleteMessage = async (msgId) => {
    try {
      await fetch(`${API_URL}/chats/${activeChat._id}/messages/${msgId}`, { method: 'DELETE', headers: ah });
      setMessages(p => p.filter(m => m._id !== msgId)); fetchChats();
    } catch {}
  };

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!userSearch.trim()) { setUserResults([]); return; }
      setSearching(true);
      try {
        const r = await fetch(`${API_URL}/users?search=${encodeURIComponent(userSearch)}&limit=10`, { headers: ah });
        if (r.ok) { const d = await r.json(); setUserResults((d.data || d.users || []).filter(u => u._id !== myId).slice(0, 10)); }
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const startChat = async (userId) => {
    try {
      const r = await fetch(`${API_URL}/chats`, { method: 'POST', headers: ah, body: JSON.stringify({ userId }) });
      if (r.ok) { const d = await r.json(); setShowNewChat(false); setUserSearch(''); setUserResults([]); await fetchChats(); openChat(d.data); }
    } catch {}
  };

  const deleteChat = async (chatId) => {
    if (!window.confirm('Delete this chat and all messages?')) return;
    try {
      await fetch(`${API_URL}/chats/${chatId}`, { method: 'DELETE', headers: ah });
      if (activeChat?._id === chatId) { setActiveChat(null); setMessages([]); clearInterval(msgPollRef.current); }
      fetchChats();
    } catch {}
  };

  const isDark = theme === 'dark';
  const surface = isDark ? '#1e1e2e' : '#ffffff';
  const surface2 = isDark ? '#16162a' : '#f8f9fa';
  const border = isDark ? '#2d2d44' : '#e9ecef';
  const textColor = isDark ? '#e2e8f0' : '#1a1b2e';
  const textMuted = isDark ? '#94a3b8' : '#6b7280';
  const accent = '#2563eb';
  const accentLight = isDark ? '#1e3a5f' : '#eff4ff';

  return (
    <div className="container-fluid py-3">
      <div style={{ display: 'flex', height: 'calc(100vh - 100px)', background: surface, overflow: 'hidden', borderRadius: 12, border: `1px solid ${border}`, boxShadow: '0 2px 16px rgba(0,0,0,.08)' }}>
        {/* Sidebar */}
        <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', background: surface }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: textColor, fontSize: '1rem' }}>
                <i className="bi bi-chat-dots-fill" style={{ color: accent, marginRight: 8 }} />Messages
              </h5>
              <button onClick={() => setShowNewChat(true)} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-pencil-square" /> New
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <div style={{ padding: 24, textAlign: 'center', color: textMuted }}><div className="spinner-border spinner-border-sm" /></div>
              : chats.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: textMuted, fontSize: '.85rem' }}>No chats yet.<br /><button onClick={() => setShowNewChat(true)} style={{ marginTop: 8, background: 'none', border: 'none', color: accent, cursor: 'pointer', textDecoration: 'underline' }}>Start a conversation</button></div>
              : chats.map(chat => {
                const other = getOther(chat, myId);
                const isActive = activeChat?._id === chat._id;
                return (
                  <div key={chat._id} onClick={() => openChat(chat)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${border}`, background: isActive ? accentLight : 'transparent', transition: 'background .15s', position: 'relative' }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background = surface2)} onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}>
                    {userAvatar(other, 40)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '.9rem', color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.nickname || other?.email || 'Unknown'}</span>
                        <span style={{ fontSize: '.72rem', color: textMuted, flexShrink: 0, marginLeft: 6 }}>{chat.lastActivity ? formatTime(chat.lastActivity) : ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span style={{ fontSize: '.78rem', color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {chat.lastMessage?.text ? chat.lastMessage.text.slice(0, 40) + (chat.lastMessage.text.length > 40 ? '…' : '') : 'No messages yet'}
                        </span>
                        {chat.unread > 0 && <span style={{ background: accent, color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: '.7rem', fontWeight: 700, flexShrink: 0 }}>{chat.unread}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Chat area */}
        {activeChat ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: surface2 }}>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: surface }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {userAvatar(getOther(activeChat, myId), 38)}
                <div>
                  <div style={{ fontWeight: 700, color: textColor, fontSize: '.95rem' }}>{getOther(activeChat, myId)?.nickname || 'Unknown'}</div>
                  <div style={{ fontSize: '.75rem', color: textMuted }}>{getOther(activeChat, myId)?.email || ''}</div>
                </div>
              </div>
              <button onClick={() => deleteChat(activeChat._id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px' }} title="Delete chat"><i className="bi bi-trash3" /></button>
            </div>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {msgLoading ? <div style={{ textAlign: 'center', color: textMuted, marginTop: 40 }}><div className="spinner-border spinner-border-sm" /></div>
                : messages.length === 0 ? <div style={{ textAlign: 'center', color: textMuted, marginTop: 40, fontSize: '.9rem' }}>No messages yet. Say hello! 👋</div>
                : messages.map((msg, i) => {
                  const isMine = (msg.sender?._id || msg.sender) === myId;
                  const showAvatar = !isMine && (i === 0 || (messages[i-1]?.sender?._id || messages[i-1]?.sender) !== (msg.sender?._id || msg.sender));
                  return (
                    <div key={msg._id} style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                      {!isMine && <div style={{ width: 28, flexShrink: 0 }}>{showAvatar && userAvatar(msg.sender, 28)}</div>}
                      <div style={{ maxWidth: '60%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ background: isMine ? accent : surface, color: isMine ? '#fff' : textColor, borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '8px 14px', fontSize: '.88rem', lineHeight: 1.5, wordBreak: 'break-word', boxShadow: '0 1px 4px rgba(0,0,0,.08)', border: isMine ? 'none' : `1px solid ${border}`, cursor: isMine ? 'context-menu' : 'default' }}
                          onDoubleClick={() => isMine && deleteMessage(msg._id)} title={isMine ? 'Double-click to delete' : ''}>
                          {msg.text}
                        </div>
                        <span style={{ fontSize: '.68rem', color: textMuted, marginTop: 2, marginLeft: 4, marginRight: 4 }}>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              <div ref={bottomRef} />
            </div>
            {/* Input */}
            <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, background: surface, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                placeholder="Type a message… (Enter to send)" rows={1}
                style={{ flex: 1, resize: 'none', background: isDark ? '#2d2d44' : '#f8f9fa', border: `1px solid ${border}`, borderRadius: 8, padding: '8px 12px', color: textColor, fontSize: '.88rem', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }} />
              <button type="submit" disabled={!text.trim() || sending}
                style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '.9rem', opacity: (!text.trim() || sending) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {sending ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill" />}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: surface2, color: textMuted }}>
            <i className="bi bi-chat-square-dots" style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>Select a chat to start messaging</div>
            <div style={{ fontSize: '.85rem', marginTop: 6 }}>
              or{' '}<button onClick={() => setShowNewChat(true)} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', textDecoration: 'underline', fontSize: '.85rem' }}>start a new conversation</button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowNewChat(false)}>
          <div style={{ background: surface, borderRadius: 12, padding: 24, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,.2)', border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: textColor }}>New Conversation</h5>
              <button onClick={() => setShowNewChat(false)} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '1.2rem' }}><i className="bi bi-x-lg" /></button>
            </div>
            <input autoFocus value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users by nickname or email…"
              style={{ width: '100%', background: isDark ? '#2d2d44' : '#f8f9fa', border: `1px solid ${border}`, borderRadius: 8, padding: '8px 12px', color: textColor, fontSize: '.88rem', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ marginTop: 12, maxHeight: 280, overflowY: 'auto' }}>
              {searching && <div style={{ textAlign: 'center', padding: 12, color: textMuted }}><div className="spinner-border spinner-border-sm" /></div>}
              {!searching && userSearch && !userResults.length && <div style={{ textAlign: 'center', padding: 12, color: textMuted, fontSize: '.85rem' }}>No users found</div>}
              {userResults.map(user => (
                <div key={user._id} onClick={() => startChat(user._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${border}`, marginBottom: 6 }}
                  onMouseEnter={e => e.currentTarget.style.background = surface2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {userAvatar(user, 36)}
                  <div>
                    <div style={{ fontWeight: 600, color: textColor, fontSize: '.88rem' }}>{user.nickname}</div>
                    <div style={{ fontSize: '.75rem', color: textMuted }}>{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatsPage;