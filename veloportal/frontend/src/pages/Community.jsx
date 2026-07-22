import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';

function Post({ post, onRefresh }) {
  const { user } = useAuth();
  const [comments,    setComments]    = useState([]);
  const [showComments,setShowComments]= useState(false);
  const [comment,     setComment]     = useState('');
  const [likeCount,   setLikeCount]   = useState(post.likesCount);
  const [liked,       setLiked]       = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const loadComments = async () => {
    const { data } = await api.get(`/community/posts/${post.id}/comments`);
    setComments(data.comments);
    setShowComments(true);
  };

  const like = async () => {
    if (!user) return;
    const { data } = await api.post(`/community/posts/${post.id}/like`);
    setLiked(data.liked);
    setLikeCount(c => data.liked ? c + 1 : c - 1);
  };

  const addComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    await api.post(`/community/posts/${post.id}/comments`, { content: comment });
    setComment('');
    loadComments();
    setSubmitting(false);
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/10 font-display text-sm font-bold text-forest dark:bg-forest/30 dark:text-amber">
          {post.User?.avatarUrl
            ? <img src={post.User.avatarUrl} className="h-10 w-10 rounded-full object-cover" alt="" />
            : post.User?.name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-sm font-semibold">{post.User?.name}</p>
            <p className="text-2xs text-ink-400 dark:text-white/40">{new Date(post.createdAt).toLocaleString()}</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-white/70">{post.content}</p>
          {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-3 max-h-64 w-full rounded-xl object-cover" />}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-4 border-t border-ink-100 pt-4 dark:border-white/10">
        <button onClick={like} disabled={!user}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${liked ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'text-ink-400 hover:bg-ink-100 dark:text-white/50 dark:hover:bg-white/10'}`}>
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button onClick={showComments ? () => setShowComments(false) : loadComments}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-400 hover:bg-ink-100 dark:text-white/50 dark:hover:bg-white/10">
          💬 {showComments ? 'Hide' : 'Comments'}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 space-y-3 border-t border-ink-100 pt-4 dark:border-white/10 animate-rise">
          {comments.length === 0 && <p className="text-xs text-ink-400 dark:text-white/40">No comments yet — be the first!</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-bold dark:bg-white/10">{c.User?.name?.[0]}</div>
              <div className="rounded-xl bg-sand-100 px-3 py-2 text-xs dark:bg-white/5">
                <p className="font-semibold">{c.User?.name}</p>
                <p className="text-ink-400 dark:text-white/60">{c.content}</p>
              </div>
            </div>
          ))}
          {user && (
            <form onSubmit={addComment} className="flex gap-2 pt-1">
              <input className="input text-xs" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment…" required />
              <button type="submit" disabled={submitting} className="btn-primary !px-4 !py-2 text-xs shrink-0">Post</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function Community() {
  const { user }            = useAuth();
  const [posts,  setPosts]  = useState([]);
  const [content,setContent]= useState('');
  const [loading,setLoading]= useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page,   setPage]   = useState(1);

  const load = () => {
    setLoadError('');
    api.get('/community/posts')
      .then(r => setPosts(r.data.posts))
      .catch(err => setLoadError(err.response?.data?.message || 'Could not load the community feed. Please refresh.'))
      .finally(() => setPageLoading(false));
  };
  useEffect(load, []);

  const submit = async e => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await api.post('/community/posts', { content });
    setContent('');
    load();
    setLoading(false);
  };

  const LIMIT = 10;
  const shown = posts.slice(0, page * LIMIT);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest-light to-forest py-16 text-white">
        <div className="section-sm">
          <Reveal>
            <p className="eyebrow text-amber">Community</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Rider discussions</h1>
            <p className="mt-3 max-w-xl text-white/65">Share rides, ask questions, post tips, and connect with Nairobi's cycling community.</p>
          </Reveal>
        </div>
      </div>

      <div className="section-tight">
        {/* New post */}
        {user ? (
          <Reveal>
            <form onSubmit={submit} className="card p-5 mb-8">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/10 font-display text-sm font-bold text-forest dark:bg-forest/30 dark:text-amber">
                  {user.name[0]}
                </div>
                <textarea className="input resize-none" rows="3" value={content}
                  onChange={e => setContent(e.target.value)} required
                  placeholder="Share a ride, ask a question, post an update…" />
              </div>
              <div className="mt-3 flex justify-end">
                <button type="submit" disabled={loading || !content.trim()} className="btn-primary !px-5 !py-2.5 text-sm">
                  {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Post to community'}
                </button>
              </div>
            </form>
          </Reveal>
        ) : (
          <div className="mb-8 rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center dark:border-white/15">
            <p className="text-2xl">🌍</p>
            <p className="mt-3 text-sm font-semibold">Sign in to post, comment, and like</p>
            <a href="/login" className="btn-primary mt-4 inline-flex text-sm">Sign in</a>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-5">
          {pageLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card animate-pulse p-6">
                  <div className="h-4 w-1/3 rounded bg-ink-100 dark:bg-white/5" />
                  <div className="mt-3 h-3 w-full rounded bg-ink-100 dark:bg-white/5" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-ink-100 dark:bg-white/5" />
                </div>
              ))}
            </div>
          )}
          {!pageLoading && loadError && (
            <div className="rounded-2xl bg-red-50 p-6 text-center text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {loadError} <button onClick={load} className="ml-2 underline">Try again</button>
            </div>
          )}
          {!pageLoading && !loadError && posts.length === 0 && (
            <p className="py-16 text-center text-ink-400 dark:text-white/40">No posts yet — be the first to share something!</p>
          )}
          {shown.map(p => <Post key={p.id} post={p} onRefresh={load} />)}
        </div>

        {posts.length > shown.length && (
          <div className="mt-8 text-center">
            <button onClick={() => setPage(p => p + 1)} className="btn-secondary">Load more posts</button>
          </div>
        )}
      </div>
    </div>
  );
}
