import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    { label: 'Discover', path: '/discover', icon: '◈' },
    { label: 'Browse', path: '/songs', icon: '♪' },
    { label: 'My Songs', path: '/my-songs', icon: '◎' },
    { label: 'Profile', path: '/profile', icon: '◉' },
];

function ResizeHandle({ onResize }) {
    const dragging = useRef(false);
    const onMouseDown = (e) => {
        dragging.current = true;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    };
    const onMouseMove = (e) => { if (dragging.current) onResize(e.movementX); };
    const onMouseUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    return (
        <div onMouseDown={onMouseDown} style={{
            width: '6px', cursor: 'col-resize', flexShrink: 0,
            background: 'transparent',
        }} />
    );
}

export default function Layout({ children, rightPane }) {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [leftWidth, setLeftWidth] = useState(240);
    const [rightWidth, setRightWidth] = useState(280);
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const [mySongs, setMySongs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!token) return;
        axios.get('http://localhost:5001/api/songs/my', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setMySongs(res.data)).catch(() => { });
    }, [token, location.pathname]);

    const handleLogout = () => { logout(); navigate('/login'); };
    const isActive = (path) => location.pathname === path;

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/songs?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: '#080808' }}>

            {/* ── TOP HEADER ── */}
            <header style={{
                height: '56px', flexShrink: 0,
                display: 'flex', alignItems: 'center',
                padding: '0 16px', gap: '24px',
                background: 'transparent',
                zIndex: 100,
            }}>
                {/* Logo */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.3px', flexShrink: 0 }}>
                    fretboard
                </div>

                {/* Nav links */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {NAV_ITEMS.map(item => (
                        <button key={item.path} onClick={() => navigate(item.path)} style={{
                            padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                            border: 'none', cursor: 'pointer', background: isActive(item.path) ? 'var(--bg-active)' : 'transparent',
                            color: isActive(item.path) ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: isActive(item.path) ? '500' : '400',
                            transition: 'all var(--transition)',
                        }}
                            onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                            onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Search */}
                <div style={{ flex: 1, maxWidth: '320px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', pointerEvents: 'none' }}>⌕</span>
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder="Search songs, artists, users..."
                        style={{
                            width: '100%', padding: '7px 12px 7px 28px',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                            fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none',
                            transition: 'border-color var(--transition)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                </div>

                <div style={{ flex: 1 }} />

                {/* New song */}
                <button onClick={() => navigate('/create-song')} style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-accent)', background: 'transparent',
                    color: 'var(--accent)', cursor: 'pointer', fontSize: '13px',
                    fontFamily: 'var(--font-body)', fontWeight: '500', flexShrink: 0,
                    transition: 'all var(--transition)',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    + New Song
                </button>

                {/* User + logout */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingLeft: '12px', borderLeft: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {user?.username}
                    </span>
                    <button onClick={() => navigate('/profile')} style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'var(--bg-active)',
                        border: '1px solid var(--border-mid)',
                        cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', padding: 0,
                        transition: 'border-color var(--transition)',
                    }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
                        title={user?.username}
                    >
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: '700', userSelect: 'none' }}>
                                {user?.username?.[0]?.toUpperCase()}
                            </span>
                        )}
                    </button>
                    <button onClick={handleLogout} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '15px', padding: '2px',
                        transition: 'color var(--transition)',
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Logout"
                    >⏻</button>
                </div>
            </header>

            {/* ── BODY (three panes) ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, padding: '0 8px 8px 8px', gap: '6px' }}>

                {/* LEFT PANE */}
                <div style={{
                    width: leftCollapsed ? '48px' : `${leftWidth}px`,
                    minWidth: leftCollapsed ? '48px' : '180px',
                    maxWidth: '380px',
                    flexShrink: 0,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '10px',
                    display: 'flex', flexDirection: 'column',
                    transition: leftCollapsed ? 'width 0.22s ease' : 'none',
                    overflow: 'hidden',
                }}>

                    {/* Pane header */}
                    <div style={{
                        height: '40px', flexShrink: 0,
                        display: 'flex', alignItems: 'center',
                        justifyContent: leftCollapsed ? 'center' : 'space-between',
                        padding: leftCollapsed ? '0' : '0 14px',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        {!leftCollapsed && (
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Library
                            </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {!leftCollapsed && (
                                <button onClick={() => navigate('/create-song')} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: '2px 4px',
                                    transition: 'color var(--transition)',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                    title="New song"
                                >+</button>
                            )}
                            <button onClick={() => setLeftCollapsed(c => !c)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', fontSize: '14px', padding: '2px 4px',
                                transition: 'color var(--transition)',
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                {leftCollapsed ? '›' : '‹'}
                            </button>
                        </div>
                    </div>

                    {/* Song list */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                        {mySongs.length === 0 ? (
                            !leftCollapsed && (
                                <div style={{ padding: '16px 8px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.6 }}>
                                        No songs yet
                                    </p>
                                    <button onClick={() => navigate('/create-song')} style={{
                                        fontSize: '12px', padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-accent)', background: 'transparent',
                                        color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                                    }}>+ Create one</button>
                                </div>
                            )
                        ) : (
                            mySongs.map(song => (
                                <button key={song._id} onClick={() => navigate(`/songs/${song._id}`)} style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    gap: leftCollapsed ? '0' : '10px',
                                    justifyContent: leftCollapsed ? 'center' : 'flex-start',
                                    padding: leftCollapsed ? '6px 0' : '7px 8px',
                                    borderRadius: 'var(--radius-sm)', border: 'none',
                                    background: 'transparent', cursor: 'pointer', textAlign: 'left', marginBottom: '1px',
                                    transition: 'background var(--transition)',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    title={leftCollapsed ? `${song.title} — ${song.artist}` : ''}
                                >
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-active)', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                        backgroundImage: song.coverUrl ? `url(${song.coverUrl})` : 'none',
                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                    }}>
                                        {!song.coverUrl && '♩'}
                                    </div>
                                    {!leftCollapsed && (
                                        <div style={{ overflow: 'hidden', flex: 1 }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {song.title}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '0px 4px', borderRadius: '2px', fontSize: '10px',
                                                    background: song.published ? 'rgba(200,169,110,0.08)' : 'rgba(240,235,224,0.04)',
                                                    color: song.published ? 'var(--accent)' : 'var(--text-muted)',
                                                    border: `1px solid ${song.published ? 'var(--border-accent)' : 'var(--border)'}`,
                                                }}>
                                                    {song.published ? 'pub' : 'draft'}
                                                </span>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</span>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* User row at bottom */}
                    {!leftCollapsed && (
                        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{user?.username}</span>
                            <button onClick={handleLogout} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', fontSize: '14px', padding: '2px',
                                transition: 'color var(--transition)',
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >⏻</button>
                        </div>
                    )}
                </div>

                {/* LEFT RESIZE */}
                {!leftCollapsed && <ResizeHandle onResize={dx => setLeftWidth(w => Math.max(180, Math.min(380, w + dx)))} />}

                {/* CENTER PANE */}
                <div style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '10px',
                }}>
                    {/* Back/forward */}
                    <div style={{
                        height: '40px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-base)',
                    }}>
                        <button onClick={() => navigate(-1)} style={navBtnStyle}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >‹</button>
                        <button onClick={() => navigate(1)} style={navBtnStyle}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >›</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                        {children}
                    </div>
                </div>

                {/* RIGHT RESIZE */}
                {!rightCollapsed && <ResizeHandle onResize={dx => setRightWidth(w => Math.max(200, Math.min(460, w - dx)))} />}

                {/* RIGHT PANE */}
                <div style={{
                    width: rightCollapsed ? '48px' : `${rightWidth}px`,
                    minWidth: rightCollapsed ? '48px' : '200px',
                    maxWidth: '460px',
                    flexShrink: 0,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '10px',
                    display: 'flex', flexDirection: 'column',
                    transition: rightCollapsed ? 'width 0.22s ease' : 'none',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        height: '40px', flexShrink: 0,
                        display: 'flex', alignItems: 'center',
                        justifyContent: rightCollapsed ? 'center' : 'space-between',
                        padding: rightCollapsed ? '0' : '0 14px',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        {!rightCollapsed && (
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Details
                            </span>
                        )}
                        <button onClick={() => setRightCollapsed(c => !c)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '14px', padding: '2px 4px',
                            transition: 'color var(--transition)',
                        }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            {rightCollapsed ? '‹' : '›'}
                        </button>
                    </div>
                    {!rightCollapsed && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                            {rightPane || (
                                <div style={{ textAlign: 'center', paddingTop: '48px' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--text-muted)' }}>♪</div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                                        Select a song<br />to see details
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const navBtnStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1,
    display: 'flex', alignItems: 'center', padding: '0 2px',
    transition: 'color var(--transition)',
};