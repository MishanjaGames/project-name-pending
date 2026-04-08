import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { getUser } from '../../utils/auth';
import config from '../../config/config';
import io from 'socket.io-client';

const API_URL = config.API_URL;
const RTC_URL = config.RTC_URL;

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, opts = {}) {
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...authHeader(), 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
}

export default function StudentSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  const currentUser = getUser();

  const [session,  setSession]  = useState(null);
  const [myGroup,  setMyGroup]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Chat
  const [chatTab,          setChatTab]          = useState('general');
  const [chatMessages,     setChatMessages]     = useState([]);
  const [chatInput,        setChatInput]        = useState('');
  const [chatPeers,        setChatPeers]        = useState([]);
  const [chatPrivateWith,  setChatPrivateWith]  = useState(null); // { userId, nickname }
  const chatBottomRef = useRef(null);
  const socketRef     = useRef(null);

  // ── Load session + my group ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, groupsRes] = await Promise.all([
          apiFetch(`/groups/my`),
          apiFetch(`/groups/my`),
        ]);

        // Fetch session details using groups/my → get sessionId
        const groupsData = await groupsRes.json();
        const groups = groupsData.data || [];
        const myGrp = groups.find(g => String(g.sessionId) === String(id) || String(g.sessionId?._id) === String(id));
        setMyGroup(myGrp || null);

        // Try to get session info (may fail if student has no direct route)
        try {
          const sRes = await apiFetch(`/sessions/${id}`);
          if (sRes.ok) {
            const sData = await sRes.json();
            setSession(sData.data || sData);
          }
        } catch (_) {}
      } catch (e) {
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Socket chat ──────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const nickname = currentUser?.name || currentUser?.email || 'Student';
    const socket = io(RTC_URL, { auth: { token } });
    socketRef.current = socket;

    socket.emit('join', { roomId: id, nickname });

    socket.on('joined', ({ peers = [], chatHistory = [] }) => {
      setChatMessages(chatHistory);
      setChatPeers(peers);
    });

    socket.on('peer-joined', ({ peer }) => {
      setChatPeers(prev => [...prev.filter(p => p.socketId !== peer.socketId), peer]);
    });

    socket.on('peer-left', ({ socketId }) => {
      setChatPeers(prev => prev.filter(p => p.socketId !== socketId));
    });

    socket.on('chat-message', (msg) => {
      setChatMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.emit('leave', { roomId: id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    const payload = { roomId: id, text: chatInput.trim() };
    if (chatTab === 'private' && chatPrivateWith?.userId) {
      const peer = chatPeers.find(p => p.userId === chatPrivateWith.userId);
      if (!peer) {
        alert(`${chatPrivateWith.nickname} is not online right now.`);
        return;
      }
      payload.to = peer.socketId;
    }
    socketRef.current.emit('chat-message', payload);
    setChatInput('');
  };

  // ── Render ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner-border text-primary" />
    </div>
  );

  if (error || !myGroup) return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
      <i className="bi bi-exclamation-circle" style={{ fontSize: 48, color: 'var(--muted)' }} />
      <p style={{ color: 'var(--muted)', marginTop: 12 }}>
        {error || "You don't have access to this session."}
      </p>
      <button className="btn btn-outline-secondary mt-2" onClick={() => navigate('/account')}>
        ← Back to Account
      </button>
    </div>
  );

  const courseTitle = session?.courseId?.trans?.[0]?.title || session?.courseId?.title || 'Session';
  const myUserId    = String(currentUser?._id || currentUser?.id);
  const mySocketId  = socketRef.current?.id;

  // All members except self for private chat
  const allMembers = [];
  const seen = new Set();
  (myGroup.members || []).forEach(m => {
    const userObj = m.userId;
    const uid = String(userObj?._id || userObj);
    const nick = userObj?.nickname || userObj?.email || uid;
    if (uid !== myUserId && !seen.has(uid)) {
      seen.add(uid);
      allMembers.push({ userId: uid, nickname: nick });
    }
  });

  // Filter visible messages
  const recipientPeer = chatPrivateWith?.userId
    ? chatPeers.find(p => p.userId === chatPrivateWith.userId)
    : null;

  const visibleMessages = chatTab === 'general'
    ? chatMessages.filter(m => !m.to)
    : chatMessages.filter(m => {
        if (!m.to) return false;
        if (!recipientPeer) return false;
        return (
          (m.from === mySocketId && m.to === recipientPeer.socketId) ||
          (m.from === recipientPeer.socketId && m.to === mySocketId)
        );
      });

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-outline-secondary btn-sm" style={{ borderRadius: 20 }} onClick={() => navigate('/account')}>
          <i className="bi bi-arrow-left" />
        </button>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700 }}>{courseTitle}</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Group: {myGroup.name} · {myGroup.members?.length || 0} members
          </span>
        </div>
        <span style={{
          marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600,
          padding: '4px 12px', borderRadius: 20,
          background: 'rgba(16,185,129,.15)', color: '#10b981',
          border: '1px solid rgba(16,185,129,.3)',
        }}>
          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#10b981', marginRight: 5 }} />
          Connected
        </span>
      </div>

      {/* Chat card */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16, overflow: 'hidden', height: 540, display: 'flex', flexDirection: 'column' }}>
        {/* Sub-tabs */}
        <div className="card-header border-0 pt-3 pb-0 px-4" style={{ background: 'transparent' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="nav nav-pills gap-1">
              <button
                className={`nav-link px-3 py-1 ${chatTab === 'general' ? 'active' : ''}`}
                style={{ fontSize: '0.85rem', borderRadius: 20 }}
                onClick={() => { setChatTab('general'); setChatPrivateWith(null); }}
              >
                <i className="bi bi-chat-dots me-1" /> General
              </button>
              <button
                className={`nav-link px-3 py-1 ${chatTab === 'private' ? 'active' : ''}`}
                style={{ fontSize: '0.85rem', borderRadius: 20 }}
                onClick={() => setChatTab('private')}
              >
                <i className="bi bi-lock me-1" /> Private
              </button>
            </div>

            {chatTab === 'private' && (
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: 260, borderRadius: 12 }}
                value={chatPrivateWith?.userId || ''}
                onChange={e => {
                  if (!e.target.value) { setChatPrivateWith(null); return; }
                  const opt = e.target.options[e.target.selectedIndex];
                  setChatPrivateWith({ userId: e.target.value, nickname: opt.dataset.nickname || opt.text.replace(' 🟢','').replace(' ⚫','') });
                }}
              >
                <option value="">— Select recipient —</option>
                {allMembers.map(m => {
                  const isOnline = chatPeers.some(p => p.userId === m.userId);
                  return (
                    <option key={m.userId} value={m.userId} data-nickname={m.nickname}>
                      {m.nickname} {isOnline ? '🟢' : '⚫'}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleMessages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--muted)' }}>
              <i className="bi bi-chat-square-dots" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
              <span style={{ fontSize: '0.85rem' }}>
                {chatTab === 'private' && !chatPrivateWith
                  ? 'Select a recipient above to start a private conversation'
                  : 'No messages yet. Start the conversation!'}
              </span>
            </div>
          ) : (
            visibleMessages.map((msg, i) => {
              const isMe = msg.from === mySocketId;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 2, paddingLeft: 4 }}>
                      {msg.fromNickname || 'User'}
                    </span>
                  )}
                  <div style={{
                    maxWidth: '70%', padding: '8px 14px',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMe ? 'var(--primary-color, #3b82f6)' : 'var(--input-bg, rgba(255,255,255,0.07))',
                    color: isMe ? '#fff' : 'var(--text)',
                    fontSize: '0.88rem', lineHeight: 1.45, wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <div className="card-footer border-0 px-4 pb-4 pt-2" style={{ background: 'transparent' }}>
          {chatTab === 'private' && !chatPrivateWith ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', padding: '8px 0' }}>
              <i className="bi bi-person-check me-1" /> Select a recipient above
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-control"
                style={{ borderRadius: 22, padding: '8px 16px' }}
                placeholder={chatTab === 'private' ? `Message ${chatPrivateWith?.nickname || ''}…` : 'Message everyone…'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button
                className="btn btn-primary"
                style={{ borderRadius: 22, padding: '8px 18px' }}
                onClick={sendMessage}
                disabled={!chatInput.trim()}
              >
                <i className="bi bi-send-fill" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Online peers */}
      {chatPeers.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Online now:</span>
          {chatPeers.map(p => (
            <span key={p.socketId} style={{
              fontSize: '0.75rem', padding: '2px 10px', borderRadius: 20,
              background: 'rgba(16,185,129,.12)', color: '#10b981',
              border: '1px solid rgba(16,185,129,.25)',
            }}>
              🟢 {p.nickname}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
