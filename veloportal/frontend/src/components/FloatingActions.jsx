import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import Modal from './Modal';

export default function FloatingActions() {
  const navigate      = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showTop,     setShowTop]     = useState(false);
  const [feedbackOpen,setFeedbackOpen]= useState(false);
  const [feedback,    setFeedback]    = useState('');
  const [sent,        setSent]        = useState(false);
  const [shareMsg,    setShareMsg]    = useState('');
  const [expanded,    setExpanded]    = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const share = async () => {
    const d = { title: 'VeloPortal', text: 'Check out VeloPortal — bicycles, rentals, repairs and more in Nairobi!', url: window.location.href };
    if (navigator.share) { try { await navigator.share(d); } catch (_) {} }
    else { await navigator.clipboard.writeText(window.location.href); setShareMsg('Link copied!'); setTimeout(() => setShareMsg(''), 2000); }
  };

  const surprise = async () => {
    try {
      const { data } = await api.get('/products', { params: { limit: 50 } });
      const items = data.items || [];
      if (items.length) navigate(`/shop/${items[Math.floor(Math.random() * items.length)].slug}`);
    } catch (_) {}
  };

  const sendFeedback = async e => {
    e.preventDefault();
    try { await api.post('/community/posts', { content: `📢 App feedback: ${feedback}` }); } catch (_) {}
    setSent(true);
    setTimeout(() => { setSent(false); setFeedbackOpen(false); setFeedback(''); }, 2000);
  };

  const ACTIONS = [
    { icon: theme === 'dark' ? '☀️' : '🌙', title: theme === 'dark' ? 'Light mode' : 'Dark mode', action: toggleTheme },
    { icon: '🔗', title: 'Share this page', action: share },
    { icon: '🎲', title: 'Surprise me!', action: surprise },
    { icon: '💬', title: 'Chat on WhatsApp', action: () => window.open('https://wa.me/254700000000', '_blank') },
    { icon: '📝', title: 'Send feedback', action: () => setFeedbackOpen(true) },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-4 z-30 flex flex-col items-end gap-2 sm:right-6">
        {/* Scroll to top */}
        {showTop && (
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fab animate-pop" title="Back to top" aria-label="Back to top">⬆️</button>
        )}

        {/* Expanded actions */}
        {expanded && ACTIONS.map((a, i) => (
          <button key={i} onClick={() => { a.action(); setExpanded(false); }}
            className="fab animate-pop"
            title={a.title} aria-label={a.title}
            style={{ animationDelay: `${i * 0.04}s` }}>
            {a.icon}
          </button>
        ))}

        {/* Share message */}
        {shareMsg && (
          <span className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white animate-rise shadow-forest">{shareMsg}</span>
        )}

        {/* Main toggle */}
        <button onClick={() => setExpanded(v => !v)}
          className={`fab !h-14 !w-14 text-2xl shadow-forest transition-transform duration-300 ${expanded ? 'rotate-45 bg-forest text-white' : 'bg-forest text-white'}`}
          aria-label="Open quick actions" title="Quick actions">
          {expanded ? '✕' : '⚡'}
        </button>
      </div>

      {/* Feedback modal */}
      <Modal open={feedbackOpen} onClose={() => { setFeedbackOpen(false); setSent(false); }}>
        {sent ? (
          <div className="py-8 text-center animate-pop">
            <span className="text-5xl">🙌</span>
            <p className="mt-4 font-display text-xl font-bold">Thanks for the feedback!</p>
          </div>
        ) : (
          <form onSubmit={sendFeedback}>
            <h2 className="font-display text-xl font-bold">Quick feedback</h2>
            <p className="mt-1 text-sm text-ink-400 dark:text-white/50">Tell us what's working or what needs improving.</p>
            <textarea required rows="4" className="input mt-4" value={feedback}
              onChange={e => setFeedback(e.target.value)} placeholder="Your thoughts about VeloPortal…" />
            <button className="btn-primary mt-4 w-full">Send feedback</button>
          </form>
        )}
      </Modal>
    </>
  );
}
