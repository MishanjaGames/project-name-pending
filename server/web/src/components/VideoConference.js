import { useState, useEffect, useRef, useCallback } from 'react';

const RTC_URL = 'http://localhost:5050';

// ── Tiny socket.io client loader ─────────────────────────────────────────────
let _io = null;
async function getIO() {
    if (_io) return _io;
    if (window.io) { _io = window.io; return _io; }
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
        s.onload = () => { _io = window.io; resolve(_io); };
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ── Peer connection factory ───────────────────────────────────────────────────
function createPeerConnection(iceServers, onIceCandidate, onTrack) {
    const pc = new RTCPeerConnection({ iceServers });
    pc.onicecandidate = e => { if (e.candidate) onIceCandidate(e.candidate); };
    pc.ontrack = e => { if (e.streams?.[0]) onTrack(e.streams[0]); };
    return pc;
}

// ── VideoTile component ───────────────────────────────────────────────────────
function VideoTile({ stream, label, muted = false, noVideo = false, small = false }) {
    const ref = useRef();
    useEffect(() => {
        if (ref.current && stream) ref.current.srcObject = stream;
    }, [stream]);

    return (
        <div style={{
            position: 'relative', background: '#1a1d23',
            borderRadius: 12, overflow: 'hidden',
            aspectRatio: '16/9',
            width: small ? 140 : '100%',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,.1)'
        }}>
            {!noVideo
                ? <video ref={ref} autoPlay playsInline muted={muted}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#3b5bdb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>
                        {(label || '?')[0].toUpperCase()}
                    </div>
                </div>
            }
            <div style={{
                position: 'absolute', bottom: 6, left: 8, right: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <span style={{ background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: '.7rem', padding: '2px 8px', borderRadius: 999 }}>
                    {label}
                </span>
            </div>
        </div>
    );
}

// ── Copy-to-clipboard helper ──────────────────────────────────────────────────
function useCopyLink(roomId) {
    const [copied, setCopied] = useState(false);
    const copy = useCallback(() => {
        const url = `${window.location.origin}/room/${roomId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [roomId]);
    return { copied, copy };
}

// ── Main component ────────────────────────────────────────────────────────────
/**
 * Props:
 *   sessionId      — used to build roomId as `session:<sessionId>`
 *   roomId         — override: use an explicit roomId instead (for link-based joins)
 *   nickname       — display name
 *   onClose        — called when user leaves
 *   initialCamOn   — start with camera enabled (from lobby settings)
 *   initialMicOn   — start with mic enabled (from lobby settings)
 *   preferredCamId — deviceId to use for camera
 *   preferredMicId — deviceId to use for mic
 */
export function VideoConference({
    sessionId, roomId: roomIdProp, nickname, onClose,
    initialCamOn = false, initialMicOn = false,
    preferredCamId, preferredMicId,
}) {
    // roomId: explicit prop wins, otherwise derive from sessionId
    const roomId = roomIdProp || `session:${sessionId}`;

    const socketRef     = useRef(null);
    const pcRefs        = useRef({});       // { [socketId]: RTCPeerConnection }
    const localRef      = useRef(null);     // local MediaStream (may be null)
    const iceServersRef = useRef([]);

    const [localStream, setLocalStream]   = useState(null);
    const [peers, setPeers]               = useState([]);
    // Use lobby-chosen initial states
    const [video, setVideo]               = useState(initialCamOn);
    const [audio, setAudio]               = useState(initialMicOn);
    const [status, setStatus]             = useState('connecting'); // 'connecting'|'joined'|'error'
    const [errorMsg, setErrorMsg]         = useState('');
    const [permBanner, setPermBanner]     = useState(null); // null | 'denied' | 'prompted'

    const { copied, copy: copyLink } = useCopyLink(roomId);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        if (localRef.current) { localRef.current.getTracks().forEach(t => t.stop()); localRef.current = null; }
        Object.values(pcRefs.current).forEach(pc => pc.close());
        pcRefs.current = {};
        if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
        setPeers([]);
        setLocalStream(null);
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    // ── Create or get PC for a peer ───────────────────────────────────────────
    const getPC = useCallback((peerId) => {
        if (pcRefs.current[peerId]) return pcRefs.current[peerId];
        const pc = createPeerConnection(
            iceServersRef.current,
            (candidate) => socketRef.current?.emit('ice-candidate', { to: peerId, candidate }),
            (remoteStream) => {
                setPeers(prev => prev.map(p => p.socketId === peerId ? { ...p, stream: remoteStream } : p));
            }
        );
        pcRefs.current[peerId] = pc;
        return pc;
    }, []);

    // ── Add local tracks to a PC ──────────────────────────────────────────────
    const addLocalTracks = useCallback((pc) => {
        if (!localRef.current) return;
        localRef.current.getTracks().forEach(track => {
            if (!pc.getSenders().find(s => s.track === track)) {
                pc.addTrack(track, localRef.current);
            }
        });
    }, []);

    // ── Renegotiate when local stream changes ─────────────────────────────────
    const renegotiateAll = useCallback(async () => {
        const socket = socketRef.current;
        if (!socket || !localRef.current) return;
        for (const [peerId, pc] of Object.entries(pcRefs.current)) {
            // Add new tracks
            localRef.current.getTracks().forEach(track => {
                if (!pc.getSenders().find(s => s.track === track)) {
                    pc.addTrack(track, localRef.current);
                }
            });
            // Create new offer
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { to: peerId, sdp: offer });
            } catch {}
        }
    }, []);

    // ── Connect to signaling server (NO media requested here) ─────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const io = await getIO();
                if (cancelled) return;

                // Always read fresh from storage so we never capture a stale closure value
                const stored = localStorage.getItem('token');
                if (!stored) {
                    setStatus('error');
                    setErrorMsg('Not logged in — please log in and try again.');
                    return;
                }
                // Strip any existing "Bearer " prefix, then send the raw JWT.
                // The RTC server accepts both "Bearer <jwt>" and a plain JWT,
                // but sending the raw JWT avoids any double-prefix edge cases.
                const raw = stored.startsWith('Bearer ') ? stored.slice(7) : stored;
                console.debug('[RTC] connecting, token prefix:', raw.slice(0, 20) + '…');
                const socket = io(RTC_URL, {
                    auth: { token: raw },
                    transports: ['websocket', 'polling']
                });
                socketRef.current = socket;

                socket.on('connect_error', (err) => {
                    if (cancelled) return;
                    setStatus('error');
                    setErrorMsg(
                        err.message === 'UNAUTHORIZED'
                            ? 'Authentication failed — check your session.'
                            : err.message
                    );
                });

                // joined — get existing peers and ICE config
                socket.on('joined', async ({ peers: existingPeers, iceServers }) => {
                    if (cancelled) return;
                    iceServersRef.current = iceServers;
                    setStatus('joined');
                    setPeers(existingPeers.map(p => ({ ...p, stream: null, video: true, audio: true })));

                    // Initiate offer to each existing peer (even without local stream)
                    for (const peer of existingPeers) {
                        const pc = getPC(peer.socketId);
                        addLocalTracks(pc);
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socket.emit('offer', { to: peer.socketId, sdp: offer });
                    }
                });

                socket.on('peer-joined', async ({ peer }) => {
                    if (cancelled) return;
                    setPeers(prev => [...prev, { ...peer, stream: null, video: true, audio: true }]);
                });

                socket.on('peer-left', ({ socketId }) => {
                    pcRefs.current[socketId]?.close();
                    delete pcRefs.current[socketId];
                    setPeers(prev => prev.filter(p => p.socketId !== socketId));
                });

                socket.on('offer', async ({ from, sdp }) => {
                    if (cancelled) return;
                    const pc = getPC(from);
                    addLocalTracks(pc);
                    await pc.setRemoteDescription(sdp);
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('answer', { to: from, sdp: answer });
                });

                socket.on('answer', async ({ from, sdp }) => {
                    const pc = pcRefs.current[from];
                    if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(sdp);
                });

                socket.on('ice-candidate', async ({ from, candidate }) => {
                    const pc = pcRefs.current[from];
                    if (pc) { try { await pc.addIceCandidate(candidate); } catch {} }
                });

                socket.on('media-state', ({ socketId, video: v, audio: a }) => {
                    setPeers(prev => prev.map(p => p.socketId === socketId ? { ...p, video: v, audio: a } : p));
                });

                // If lobby already granted permission with cam/mic on, acquire media now
                // so peers receive tracks as soon as we join.
                if (initialCamOn || initialMicOn) {
                    try {
                        const constraints = {
                            video: initialCamOn
                                ? (preferredCamId ? { deviceId: { exact: preferredCamId } } : true)
                                : false,
                            audio: initialMicOn
                                ? (preferredMicId ? { deviceId: { exact: preferredMicId } } : true)
                                : false,
                        };
                        const s = await navigator.mediaDevices.getUserMedia(constraints);
                        if (!cancelled) {
                            localRef.current = s;
                            setLocalStream(s);
                        } else {
                            s.getTracks().forEach(t => t.stop());
                        }
                    } catch { /* permission lost between lobby and join — proceed without */ }
                }

                // Join the room
                socket.emit('join', { roomId, nickname });

            } catch (e) {
                if (!cancelled) {
                    setStatus('error');
                    const msg = e.message || '';
                    if (msg.includes('UNAUTHORIZED')) setErrorMsg('Authentication failed — please re-login.');
                    else if (msg.includes('connect') || msg.includes('network') || msg.includes('Network'))
                        setErrorMsg('Could not reach the signaling server. Is rtc-server running on port 5050?');
                    else setErrorMsg(msg || 'Connection failed');
                }
            }
        })();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // ── Request media permission lazily (only when user enables mic/cam) ───────
    /**
     * Tries to get the specified media kinds.
     * Returns the stream on success, null on denial.
     * Merges new tracks into the existing local stream when possible.
     */
    const requestMedia = useCallback(async ({ wantVideo, wantAudio }) => {
        setPermBanner('prompted');
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: wantVideo,
                audio: wantAudio
            });
            setPermBanner(null);

            // Merge into existing stream or use new stream directly
            if (!localRef.current) {
                localRef.current = newStream;
                setLocalStream(newStream);
            } else {
                newStream.getTracks().forEach(track => {
                    localRef.current.addTrack(track);
                });
                // Force react update with same ref value by creating a synthetic clone
                setLocalStream(new MediaStream(localRef.current.getTracks()));
            }
            return newStream;
        } catch (e) {
            setPermBanner('denied');
            setTimeout(() => setPermBanner(null), 4000);
            return null;
        }
    }, []);

    // ── Toggle video ──────────────────────────────────────────────────────────
    const toggleVideo = useCallback(async () => {
        const newVal = !video;

        if (newVal) {
            // Turning ON: check if we already have a video track
            const existing = localRef.current?.getVideoTracks() || [];
            if (existing.length === 0) {
                // Need to request permission
                const stream = await requestMedia({ wantVideo: true, wantAudio: false });
                if (!stream) return; // denied
                await renegotiateAll();
            } else {
                existing.forEach(t => { t.enabled = true; });
                setLocalStream(localRef.current ? new MediaStream(localRef.current.getTracks()) : null);
            }
        } else {
            // Turning OFF: just disable tracks (keep stream, don't revoke permission)
            localRef.current?.getVideoTracks().forEach(t => { t.enabled = false; });
            setLocalStream(localRef.current ? new MediaStream(localRef.current.getTracks()) : null);
        }

        setVideo(newVal);
        socketRef.current?.emit('toggle-media', { roomId, video: newVal, audio });
    }, [video, audio, roomId, requestMedia, renegotiateAll]);

    // ── Toggle audio ──────────────────────────────────────────────────────────
    const toggleAudio = useCallback(async () => {
        const newVal = !audio;

        if (newVal) {
            const existing = localRef.current?.getAudioTracks() || [];
            if (existing.length === 0) {
                const stream = await requestMedia({ wantVideo: false, wantAudio: true });
                if (!stream) return;
                await renegotiateAll();
            } else {
                existing.forEach(t => { t.enabled = true; });
                setLocalStream(localRef.current ? new MediaStream(localRef.current.getTracks()) : null);
            }
        } else {
            localRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
            setLocalStream(localRef.current ? new MediaStream(localRef.current.getTracks()) : null);
        }

        setAudio(newVal);
        socketRef.current?.emit('toggle-media', { roomId, video, audio: newVal });
    }, [audio, video, roomId, requestMedia, renegotiateAll]);

    // ── Leave ─────────────────────────────────────────────────────────────────
    const handleLeave = () => {
        socketRef.current?.emit('leave', { roomId });
        cleanup();
        onClose?.();
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(10,12,18,.97)',
            display: 'flex', flexDirection: 'column',
            fontFamily: 'system-ui, sans-serif'
        }}>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="bi bi-camera-video-fill" style={{ color: '#748ffc', fontSize: '1.2rem' }}></i>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '.95rem' }}>Video Conference</span>
                <span style={{ color: '#868e96', fontSize: '.78rem' }}>Room: {roomId}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Copy invite link */}
                    <button
                        onClick={copyLink}
                        title="Copy invite link"
                        style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: 6, color: copied ? '#69db7c' : '#adb5bd', fontSize: '.78rem', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`bi ${copied ? 'bi-check-lg' : 'bi-link-45deg'}`}></i>
                        {copied ? 'Copied!' : 'Invite link'}
                    </button>
                    <span style={{ color: '#868e96', fontSize: '.78rem' }}>
                        {peers.length + 1} participant{peers.length !== 0 ? 's' : ''}
                    </span>
                </span>
            </div>

            {/* Permission banner */}
            {permBanner === 'prompted' && (
                <div style={{ background: '#1c2a3a', color: '#74c0fc', fontSize: '.8rem', padding: '6px 16px', borderBottom: '1px solid rgba(100,180,255,.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-shield-lock-fill"></i>
                    Chrome is asking for permission — allow camera/microphone access in the browser prompt above.
                </div>
            )}
            {permBanner === 'denied' && (
                <div style={{ background: '#2c1f1f', color: '#ffa8a8', fontSize: '.8rem', padding: '6px 16px', borderBottom: '1px solid rgba(255,100,100,.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-mic-mute-fill"></i>
                    Permission denied. To allow camera/mic, click the lock icon in your browser's address bar and grant access.
                </div>
            )}

            {/* Status overlay */}
            {status === 'connecting' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#adb5bd' }}>
                    <div className="spinner-border text-primary" />
                    <span>Joining room…</span>
                </div>
            )}

            {status === 'error' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#fa5252' }}>
                    <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem' }}></i>
                    <span>{errorMsg || 'Connection failed'}</span>
                    <button className="btn btn-sm btn-outline-light mt-2" onClick={onClose}>Close</button>
                </div>
            )}

            {status === 'joined' && (
                <>
                    {/* Muted-by-default notice (shows once) */}
                    {!video && !audio && !localStream && (
                        <div style={{ background: '#1a2535', color: '#a5d8ff', fontSize: '.78rem', padding: '6px 16px', borderBottom: '1px solid rgba(100,180,255,.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="bi bi-info-circle-fill"></i>
                            You joined with camera and mic <strong>off</strong>. Click the buttons below to enable them — Chrome will ask for permission.
                        </div>
                    )}

                    {/* Video grid */}
                    <div style={{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden', flexWrap: 'wrap' }}>
                        {/* Local tile */}
                        <VideoTile
                            stream={localStream}
                            label={`${nickname || 'You'} (you)`}
                            muted={true}
                            noVideo={!video || !localStream?.getVideoTracks().some(t => t.enabled)}
                            small={peers.length > 0}
                        />
                        {/* Remote tiles */}
                        {peers.map(p => (
                            <VideoTile
                                key={p.socketId}
                                stream={p.stream}
                                label={p.nickname || p.userId}
                                noVideo={!p.video || !p.stream}
                                small={peers.length > 1}
                            />
                        ))}
                        {peers.length === 0 && (
                            <div style={{ color: '#868e96', fontSize: '.875rem', textAlign: 'center', marginTop: 24 }}>
                                <i className="bi bi-people" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>
                                Waiting for others to join…
                                <div style={{ marginTop: 8, fontSize: '.75rem' }}>
                                    Share the invite link (top right) to invite others.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <button
                            onClick={toggleAudio}
                            style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', background: audio ? 'rgba(255,255,255,.12)' : '#e03131', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
                            title={audio ? 'Mute microphone' : 'Enable microphone (Chrome will ask permission)'}>
                            <i className={`bi ${audio ? 'bi-mic-fill' : 'bi-mic-mute-fill'}`}></i>
                        </button>
                        <button
                            onClick={toggleVideo}
                            style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', background: video ? 'rgba(255,255,255,.12)' : '#e03131', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
                            title={video ? 'Turn off camera' : 'Enable camera (Chrome will ask permission)'}>
                            <i className={`bi ${video ? 'bi-camera-video-fill' : 'bi-camera-video-off-fill'}`}></i>
                        </button>
                        <button
                            onClick={handleLeave}
                            style={{ width: 56, height: 48, borderRadius: 24, border: 'none', cursor: 'pointer', background: '#e03131', color: '#fff', fontSize: '.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background .15s' }}>
                            <i className="bi bi-telephone-x-fill"></i> Leave
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
