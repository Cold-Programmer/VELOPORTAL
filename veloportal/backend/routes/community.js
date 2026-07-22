const router = require('express').Router();
const { CommunityPost, Comment, Like, User } = require('../models');
const { protect } = require('../middleware/auth');

// Data browsing requires a signed-in account — VeloPortal does not expose
// catalog/listing data to anonymous visitors.
router.use(protect);

router.get('/posts', async (req, res, next) => {
  try {
    const posts = await CommunityPost.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'avatarUrl'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ posts });
  } catch (err) { next(err); }
});

router.post('/posts', protect, async (req, res, next) => {
  try {
    const { content, imageUrl } = req.body;
    const post = await CommunityPost.create({ content, imageUrl, userId: req.user.id });
    res.status(201).json({ post });
  } catch (err) { next(err); }
});

router.get('/posts/:id/comments', async (req, res, next) => {
  try {
    const comments = await Comment.findAll({
      where: { postId: req.params.id },
      include: [{ model: User, attributes: ['id', 'name', 'avatarUrl'] }],
      order: [['createdAt', 'ASC']],
    });
    res.json({ comments });
  } catch (err) { next(err); }
});

router.post('/posts/:id/comments', protect, async (req, res, next) => {
  try {
    const comment = await Comment.create({ content: req.body.content, postId: req.params.id, userId: req.user.id });
    res.status(201).json({ comment });
  } catch (err) { next(err); }
});

router.post('/posts/:id/like', protect, async (req, res, next) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const [like, created] = await Like.findOrCreate({ where: { postId: post.id, userId: req.user.id } });
    if (!created) {
      await like.destroy();
      await post.decrement('likesCount');
      return res.json({ liked: false });
    }
    await post.increment('likesCount');
    res.json({ liked: true });
  } catch (err) { next(err); }
});

module.exports = router;
