const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// ---------- USER ----------
// Roles: customer (default rider), mechanic (repair queue only),
// staff (shop attendant: inventory/orders/rentals/events), admin (super admin: everything)
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  regNumber: { type: DataTypes.STRING }, // optional student registration number, e.g. 25/01220
  role: { type: DataTypes.ENUM('customer', 'mechanic', 'staff', 'admin'), defaultValue: 'customer' },
  avatarUrl: { type: DataTypes.STRING },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  emailVerifyToken: { type: DataTypes.STRING },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpires: { type: DataTypes.DATE },
  failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockedUntil: { type: DataTypes.DATE },
  lastSeenAt: { type: DataTypes.DATE },
});

// ---------- CATEGORY ----------
const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
});

// ---------- BICYCLE (product / rental asset / customizer frame) ----------
const Bicycle = sequelize.define('Bicycle', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  brand: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  // 'bicycle' | 'accessory' | 'equipment' — lets the Shop sell more than just bikes
  productType: { type: DataTypes.ENUM('bicycle', 'accessory', 'equipment'), defaultValue: 'bicycle' },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  rentalPricePerHour: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  images: { type: DataTypes.JSONB, defaultValue: [] },
  frameSize: { type: DataTypes.STRING },
  wheelSize: { type: DataTypes.STRING },
  // Frame headtube inner diameter (mm) — used by the bike customizer's fork-compatibility rule
  headtubeDiameter: { type: DataTypes.DECIMAL(5, 2), defaultValue: 34.00 },
  condition: { type: DataTypes.ENUM('new', 'used'), defaultValue: 'new' },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5 },
  forSale: { type: DataTypes.BOOLEAN, defaultValue: true },
  forRent: { type: DataTypes.BOOLEAN, defaultValue: false },
  ratingAvg: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
  ratingCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
});

// ---------- REVIEW ----------
const Review = sequelize.define('Review', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT },
});

// ---------- WISHLIST ----------
const WishlistItem = sequelize.define('WishlistItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
});

// ---------- CART ----------
const CartItem = sequelize.define('CartItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
});

// ---------- ORDER ----------
const Order = sequelize.define('Order', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderNumber: { type: DataTypes.STRING, unique: true },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled'),
    defaultValue: 'pending_payment',
  },
  shippingAddress: { type: DataTypes.STRING },
  shippingCity: { type: DataTypes.STRING },
  shippingPhone: { type: DataTypes.STRING },
  paymentMethod: { type: DataTypes.ENUM('mpesa', 'cash_on_delivery'), defaultValue: 'mpesa' },
});

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
});

// ---------- RENTAL ----------
const Rental = sequelize.define('Rental', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  totalCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  paymentStatus: { type: DataTypes.ENUM('unpaid', 'paid'), defaultValue: 'unpaid' },
  // Populated when a shop attendant checks the bike back in — drives the late-fee ledger receipt
  actualReturnDate: { type: DataTypes.DATE },
  lateHours: { type: DataTypes.DECIMAL(5, 1), defaultValue: 0 },
  lateFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  lateFeeStatus: { type: DataTypes.ENUM('none', 'unpaid', 'paid'), defaultValue: 'none' },
});

// ---------- REPAIR ----------
const RepairService = sequelize.define('RepairService', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estimatedHours: { type: DataTypes.DECIMAL(4, 1), defaultValue: 1 },
});

const RepairBooking = sequelize.define('RepairBooking', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bicycleDescription: { type: DataTypes.STRING },
  scheduledDate: { type: DataTypes.DATE, allowNull: false },
  mechanicName: { type: DataTypes.STRING },
  status: {
    type: DataTypes.ENUM('booked', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'booked',
  },
  notes: { type: DataTypes.TEXT },
  totalCost: { type: DataTypes.DECIMAL(10, 2) },
});

// ---------- EVENTS ----------
const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true },
  description: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATE, allowNull: false },
  location: { type: DataTypes.STRING },
  capacity: { type: DataTypes.INTEGER, defaultValue: 50 },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  imageUrl: { type: DataTypes.STRING },
});

const EventRegistration = sequelize.define('EventRegistration', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ticketCode: { type: DataTypes.STRING, unique: true },
  status: { type: DataTypes.ENUM('registered', 'cancelled', 'attended'), defaultValue: 'registered' },
  paymentMethod: { type: DataTypes.ENUM('mpesa', 'cash', 'free'), defaultValue: 'free' },
  paymentStatus: { type: DataTypes.ENUM('paid', 'pending', 'due_at_event'), defaultValue: 'paid' },
});

// ---------- COMMUNITY ----------
const CommunityPost = sequelize.define('CommunityPost', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  imageUrl: { type: DataTypes.STRING },
  likesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false },
});

const Like = sequelize.define('Like', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
});

// ---------- PAYMENTS (M-Pesa) ----------
const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  purpose: { type: DataTypes.ENUM('order', 'rental', 'repair', 'event', 'rental_penalty'), allowNull: false },
  referenceId: { type: DataTypes.UUID },
  merchantRequestId: { type: DataTypes.STRING },
  checkoutRequestId: { type: DataTypes.STRING },
  mpesaReceiptNumber: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending', 'success', 'failed'), defaultValue: 'pending' },
  resultDesc: { type: DataTypes.STRING },
});

// ---------- CUSTOMIZER: COMPONENT (fork / wheel / handlebar / drivetrain) ----------
const Component = sequelize.define('Component', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  brand: { type: DataTypes.STRING },
  partType: { type: DataTypes.ENUM('fork', 'wheel', 'handlebar', 'drivetrain'), allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  image: { type: DataTypes.STRING },
  // Fork spec — compared against a frame's headtubeDiameter (tolerance 0.05mm, per SDS rule)
  steererDiameter: { type: DataTypes.DECIMAL(5, 2) },
  // Wheel spec — compared against a frame's wheelSize (exact match required)
  wheelSize: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
});

// ---------- CUSTOMIZER: SAVED BUILD ----------
const CustomBuild = sequelize.define('CustomBuild', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, defaultValue: 'My Custom Build' },
  totalCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  isCompatible: { type: DataTypes.BOOLEAN, allowNull: false },
  compatibilityNotes: { type: DataTypes.JSONB, defaultValue: [] },
});

// ===================== ASSOCIATIONS =====================
Category.hasMany(Bicycle, { foreignKey: 'categoryId', onDelete: 'SET NULL' });
Bicycle.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(Review, { foreignKey: 'userId' });
Bicycle.hasMany(Review, { foreignKey: 'bicycleId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId' });
Review.belongsTo(Bicycle, { foreignKey: 'bicycleId' });

User.hasMany(WishlistItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
Bicycle.hasMany(WishlistItem, { foreignKey: 'bicycleId', onDelete: 'CASCADE' });
WishlistItem.belongsTo(User, { foreignKey: 'userId' });
WishlistItem.belongsTo(Bicycle, { foreignKey: 'bicycleId' });

User.hasMany(CartItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
Bicycle.hasMany(CartItem, { foreignKey: 'bicycleId', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'userId' });
CartItem.belongsTo(Bicycle, { foreignKey: 'bicycleId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Bicycle, { foreignKey: 'bicycleId' });

User.hasMany(Rental, { foreignKey: 'userId' });
Rental.belongsTo(User, { foreignKey: 'userId' });
Bicycle.hasMany(Rental, { foreignKey: 'bicycleId' });
Rental.belongsTo(Bicycle, { foreignKey: 'bicycleId' });

RepairService.hasMany(RepairBooking, { foreignKey: 'serviceId' });
RepairBooking.belongsTo(RepairService, { foreignKey: 'serviceId' });
User.hasMany(RepairBooking, { foreignKey: 'userId' });
RepairBooking.belongsTo(User, { foreignKey: 'userId' });

Event.hasMany(EventRegistration, { foreignKey: 'eventId', onDelete: 'CASCADE' });
EventRegistration.belongsTo(Event, { foreignKey: 'eventId' });
User.hasMany(EventRegistration, { foreignKey: 'userId' });
EventRegistration.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CommunityPost, { foreignKey: 'userId', onDelete: 'CASCADE' });
CommunityPost.belongsTo(User, { foreignKey: 'userId' });
CommunityPost.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(CommunityPost, { foreignKey: 'postId' });
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });
CommunityPost.hasMany(Like, { foreignKey: 'postId', onDelete: 'CASCADE' });
Like.belongsTo(CommunityPost, { foreignKey: 'postId' });
User.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CustomBuild, { foreignKey: 'userId', onDelete: 'CASCADE' });
CustomBuild.belongsTo(User, { foreignKey: 'userId' });
Bicycle.hasMany(CustomBuild, { foreignKey: 'frameId' });
CustomBuild.belongsTo(Bicycle, { as: 'Frame', foreignKey: 'frameId' });
Component.hasMany(CustomBuild, { foreignKey: 'forkId' });
CustomBuild.belongsTo(Component, { as: 'Fork', foreignKey: 'forkId' });
Component.hasMany(CustomBuild, { foreignKey: 'wheelId' });
CustomBuild.belongsTo(Component, { as: 'Wheel', foreignKey: 'wheelId' });
Component.hasMany(CustomBuild, { foreignKey: 'handlebarId' });
CustomBuild.belongsTo(Component, { as: 'Handlebar', foreignKey: 'handlebarId' });
Component.hasMany(CustomBuild, { foreignKey: 'drivetrainId' });
CustomBuild.belongsTo(Component, { as: 'Drivetrain', foreignKey: 'drivetrainId' });

module.exports = {
  sequelize,
  User,
  Category,
  Bicycle,
  Review,
  WishlistItem,
  CartItem,
  Order,
  OrderItem,
  Rental,
  RepairService,
  RepairBooking,
  Event,
  EventRegistration,
  CommunityPost,
  Comment,
  Like,
  Payment,
  Component,
  CustomBuild,
};
