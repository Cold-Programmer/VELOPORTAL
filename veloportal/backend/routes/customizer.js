const router = require('express').Router();
const { Bicycle, Component, CustomBuild } = require('../models');
const { protect } = require('../middleware/auth');
const { checkCompatibility } = require('../utils/compatibility');

router.use(protect);

// Frames (bicycles) available in the customizer, with just the specs the simulator needs
router.get('/frames', async (req, res, next) => {
  try {
    const frames = await Bicycle.findAll({
      attributes: ['id', 'name', 'slug', 'brand', 'price', 'images', 'frameSize', 'wheelSize', 'headtubeDiameter'],
      order: [['name', 'ASC']],
    });
    res.json({ frames });
  } catch (err) { next(err); }
});

router.get('/components', async (req, res, next) => {
  try {
    const where = req.query.type ? { partType: req.query.type } : {};
    const components = await Component.findAll({ where, order: [['price', 'ASC']] });
    res.json({ components });
  } catch (err) { next(err); }
});

// Server-side authoritative check (the frontend also runs this rule client-side for instant feedback)
router.post('/check-compatibility', async (req, res, next) => {
  try {
    const { frameId, forkId, wheelId } = req.body;
    const frame = await Bicycle.findByPk(frameId);
    if (!frame) return res.status(404).json({ message: 'Frame not found' });
    const fork = forkId ? await Component.findByPk(forkId) : null;
    const wheel = wheelId ? await Component.findByPk(wheelId) : null;
    res.json(checkCompatibility({ frame, fork, wheel }));
  } catch (err) { next(err); }
});

router.post('/builds', protect, async (req, res, next) => {
  try {
    const { name, frameId, forkId, wheelId, handlebarId, drivetrainId } = req.body;
    const frame = await Bicycle.findByPk(frameId);
    if (!frame) return res.status(404).json({ message: 'Frame not found' });
    const [fork, wheel, handlebar, drivetrain] = await Promise.all([
      forkId ? Component.findByPk(forkId) : null,
      wheelId ? Component.findByPk(wheelId) : null,
      handlebarId ? Component.findByPk(handlebarId) : null,
      drivetrainId ? Component.findByPk(drivetrainId) : null,
    ]);

    const { compatible, notes } = checkCompatibility({ frame, fork, wheel });
    if (!compatible) {
      return res.status(409).json({ message: 'This build has incompatible parts and cannot be saved', notes });
    }

    const totalCost = Number(frame.price)
      + Number(fork?.price || 0) + Number(wheel?.price || 0)
      + Number(handlebar?.price || 0) + Number(drivetrain?.price || 0);

    const build = await CustomBuild.create({
      userId: req.user.id, name: name || `${frame.name} Custom Build`,
      frameId, forkId, wheelId, handlebarId, drivetrainId,
      totalCost, isCompatible: true, compatibilityNotes: notes,
    });
    res.status(201).json({ build });
  } catch (err) { next(err); }
});

router.get('/builds/mine', protect, async (req, res, next) => {
  try {
    const builds = await CustomBuild.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Bicycle, as: 'Frame' }, { model: Component, as: 'Fork' },
        { model: Component, as: 'Wheel' }, { model: Component, as: 'Handlebar' },
        { model: Component, as: 'Drivetrain' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ builds });
  } catch (err) { next(err); }
});

router.delete('/builds/:id', protect, async (req, res, next) => {
  try {
    await CustomBuild.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Build removed' });
  } catch (err) { next(err); }
});

module.exports = router;
