require('dotenv').config();
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const {
  sequelize, User, Category, Bicycle, RepairService, Event, CommunityPost, Component,
} = require('../models');

// Deterministic, reliable "generated" product imagery — since a real product photo library
// isn't available in this environment, each item gets a distinct, on-brand placeholder that
// renders its own name as the image (so pictures always visually match their name tag, and
// every category/part-type gets its own recognizable color so items are easy to tell apart).
function genImage(label, bg, fg) {
  const text = encodeURIComponent(label.replace(/\s+/g, '\n'));
  return `https://placehold.co/640x480/${bg}/${fg}?text=${text}&font=montserrat`;
}

const CATEGORY_COLORS = {
  'Mountain Bikes': ['16382A', 'FAFAF8'],
  'Road Bikes': ['E8A33D', '16382A'],
  'Hybrid & Commuter Bikes': ['1F4D36', 'FAFAF8'],
  'Electric Bikes': ['0E271C', 'E8A33D'],
  'BMX Bikes': ['C97F1C', 'FFFFFF'],
  'Folding Bikes': ['3A6351', 'FAFAF8'],
  'Kids Bikes': ['F2C572', '16382A'],
  'Cruiser Bikes': ['274029', 'E8A33D'],
  'Accessories': ['2D2A5E', 'F1D9A3'],
  'Equipment & Tools': ['4A4235', 'F4EDE1'],
};

const COMPONENT_COLORS = {
  fork: ['1B2E4B', 'FAFAF8'],
  wheel: ['5C3D2E', 'F4EDE1'],
  handlebar: ['3E4C2E', 'E8A33D'],
  drivetrain: ['4A2E1F', 'FAFAF8'],
};

const CATEGORIES = [
  { name: 'Mountain Bikes', description: 'Rugged bikes built for trails and off-road terrain.' },
  { name: 'Road Bikes', description: 'Lightweight, aerodynamic bikes for speed on paved roads.' },
  { name: 'Hybrid & Commuter Bikes', description: 'Versatile bikes for daily campus and city commuting.' },
  { name: 'Electric Bikes', description: 'Pedal-assist e-bikes for longer, effortless rides.' },
  { name: 'BMX Bikes', description: 'Compact, durable bikes for tricks and stunts.' },
  { name: 'Folding Bikes', description: 'Compact bikes that fold for easy storage and transit.' },
  { name: 'Kids Bikes', description: 'Safe, right-sized bikes for young riders.' },
  { name: 'Cruiser Bikes', description: 'Comfortable, relaxed-position bikes for leisure rides.' },
  { name: 'Accessories', description: 'Helmets, locks, lights, and everyday riding gear.' },
  { name: 'Equipment & Tools', description: 'Maintenance tools, pumps, and workshop equipment.' },
];

// headtubeDiameter (mm) included per bike so the customizer's fork-compatibility rule has
// real, varied data to validate against (standard threaded ~30.0mm, tapered ~34.0-44.0mm)
const BIKES_BY_CATEGORY = {
  'Mountain Bikes': [
    { name: 'Trailblazer MTB Pro', brand: 'Trek', price: 45000, rentalPricePerHour: 150, frameSize: 'M', wheelSize: '29"', headtubeDiameter: 44.00, stock: 8, forRent: true, isFeatured: true },
    { name: 'Rockridge Enduro X1', brand: 'Giant', price: 52000, rentalPricePerHour: 180, frameSize: 'L', wheelSize: '27.5"', headtubeDiameter: 44.00, stock: 4, forRent: true },
  ],
  'Road Bikes': [
    { name: 'Velocity Aero Racer', brand: 'Specialized', price: 68000, rentalPricePerHour: 200, frameSize: 'M', wheelSize: '700c', headtubeDiameter: 34.00, stock: 6, forRent: true, isFeatured: true },
    { name: 'Sprintline Carbon SL', brand: 'Cannondale', price: 89000, rentalPricePerHour: 250, frameSize: 'S', wheelSize: '700c', headtubeDiameter: 34.00, stock: 3, forRent: false },
  ],
  'Hybrid & Commuter Bikes': [
    { name: 'Urban Tourer 9042', brand: 'Reid', price: 32000, rentalPricePerHour: 100, frameSize: 'M', wheelSize: '28"', headtubeDiameter: 30.00, stock: 15, forRent: true, isFeatured: true },
    { name: 'CampusGlide Commuter', brand: 'Marin', price: 29500, rentalPricePerHour: 90, frameSize: 'M', wheelSize: '28"', headtubeDiameter: 30.00, stock: 12, forRent: true },
  ],
  'Electric Bikes': [
    { name: 'VoltRide E-Commuter', brand: 'Rad Power', price: 145000, rentalPricePerHour: 350, frameSize: 'M', wheelSize: '27.5"', headtubeDiameter: 44.00, stock: 4, forRent: true, isFeatured: true },
    { name: 'ChargeStep E-Cruiser', brand: 'Aventon', price: 132000, rentalPricePerHour: 320, frameSize: 'M', wheelSize: '26"', headtubeDiameter: 34.00, stock: 2, forRent: true },
  ],
  'BMX Bikes': [
    { name: 'StreetFlip BMX Pro', brand: 'Mongoose', price: 24000, rentalPricePerHour: 80, frameSize: 'One Size', wheelSize: '20"', headtubeDiameter: 30.00, stock: 7, forRent: true },
  ],
  'Folding Bikes': [
    { name: 'FoldCity Compact 7', brand: 'Brompton', price: 58000, rentalPricePerHour: 130, frameSize: 'One Size', wheelSize: '16"', headtubeDiameter: 30.00, stock: 3, forRent: true },
  ],
  'Kids Bikes': [
    { name: 'JuniorRider Explorer', brand: 'Woom', price: 18500, rentalPricePerHour: 60, frameSize: 'XS', wheelSize: '20"', headtubeDiameter: 30.00, stock: 10, forRent: true },
  ],
  'Cruiser Bikes': [
    { name: 'Boardwalk Classic Cruiser', brand: 'Schwinn', price: 27000, rentalPricePerHour: 85, frameSize: 'M', wheelSize: '26"', headtubeDiameter: 34.00, stock: 9, forRent: true },
  ],
};

// Accessories & equipment — plain sellable items (productType drives Shop filtering)
const ACCESSORIES = [
  { name: 'AeroShell Cycling Helmet', brand: 'Giro', price: 4500, stock: 20 },
  { name: 'NightBeam LED Headlight', brand: 'Cateye', price: 1800, stock: 25 },
  { name: 'SecureLock Chain Lock', brand: 'Kryptonite', price: 3200, stock: 4 },
  { name: 'RideDry Pannier Bag', brand: 'Ortlieb', price: 6500, stock: 10 },
  { name: 'GripComfort Cycling Gloves', brand: 'Fox', price: 1500, stock: 18 },
  { name: 'HydroFlow Water Bottle Set', brand: 'Camelbak', price: 1200, stock: 30 },
];
const EQUIPMENT = [
  { name: 'MultiTool Repair Kit', brand: 'Topeak', price: 2200, stock: 15 },
  { name: 'TrackPump Floor Pump', brand: 'Blackburn', price: 3800, stock: 3 },
  { name: 'RepairStand Workshop Stand', brand: 'Park Tool', price: 12500, stock: 2 },
  { name: 'PatchKit Puncture Repair Set', brand: 'Park Tool', price: 650, stock: 40 },
];

// A mix of matching and mismatching parts so the customizer can genuinely demonstrate both
// pass and fail states, exactly like the SDS "Variance <= 0.05mm?" flow.
const COMPONENTS = [
  { name: 'TaperFit Suspension Fork', brand: 'RockShox', partType: 'fork', price: 18000, steererDiameter: 44.00 },
  { name: 'ClassicThread Road Fork', brand: 'FSA', partType: 'fork', price: 9500, steererDiameter: 34.00 },
  { name: 'UrbanStandard Rigid Fork', brand: 'Kinesis', partType: 'fork', price: 6500, steererDiameter: 30.00 },
  { name: 'OversizeDH Fork', brand: 'Fox', partType: 'fork', price: 24000, steererDiameter: 49.00 },

  { name: 'TrailGrip 29er Wheelset', brand: 'DT Swiss', partType: 'wheel', price: 22000, wheelSize: '29"' },
  { name: 'AeroRoad 700c Wheelset', brand: 'Mavic', partType: 'wheel', price: 26000, wheelSize: '700c' },
  { name: 'CityCruise 28in Wheelset', brand: 'Alex Rims', partType: 'wheel', price: 12000, wheelSize: '28"' },
  { name: 'Compact 20in Wheelset', brand: 'Sun Ringle', partType: 'wheel', price: 9000, wheelSize: '20"' },
  { name: 'Cruiser 26in Wheelset', brand: 'Weinmann', partType: 'wheel', price: 10500, wheelSize: '26"' },

  { name: 'FlatControl Riser Bar', brand: 'Deity', partType: 'handlebar', price: 3500 },
  { name: 'AeroDrop Race Bar', brand: 'Zipp', partType: 'handlebar', price: 6800 },
  { name: 'ComfortSweep City Bar', brand: 'Ergon', partType: 'handlebar', price: 2800 },

  { name: '1x12 Trail Drivetrain', brand: 'SRAM', partType: 'drivetrain', price: 21000 },
  { name: '2x11 Road Drivetrain', brand: 'Shimano', partType: 'drivetrain', price: 25000 },
  { name: 'SingleSpeed Commuter Kit', brand: 'Gates', partType: 'drivetrain', price: 8500 },
];

const REPAIR_SERVICES = [
  { name: 'Basic Tune-Up', description: 'Gear adjustment, brake check, tire pressure, chain lube.', price: 800, estimatedHours: 1 },
  { name: 'Brake System Overhaul', description: 'Full brake pad replacement and cable adjustment.', price: 1500, estimatedHours: 1.5 },
  { name: 'Drivetrain Deep Clean & Repair', description: 'Chain, cassette, derailleur cleaning and repair.', price: 2200, estimatedHours: 2 },
  { name: 'Wheel Truing & Spoke Repair', description: 'Correct wheel wobble and replace damaged spokes.', price: 1200, estimatedHours: 1 },
  { name: 'Full Service Overhaul', description: 'Complete strip-down service covering every component.', price: 4500, estimatedHours: 4 },
];

const EVENTS = [
  { title: 'KCA Campus Cycling Rally', description: 'A community fun ride around KCA University and Ruaraka.', location: 'KCA University Main Campus', capacity: 100, price: 0, daysFromNow: 14 },
  { title: 'Nairobi Night Ride', description: 'Group evening ride through Nairobi CBD with safety escorts.', location: 'Uhuru Park, Nairobi', capacity: 60, price: 500, daysFromNow: 28 },
  { title: 'Bike Maintenance Workshop', description: 'Hands-on workshop covering basic bike repair and maintenance.', location: 'VeloPortal Hub, Nairobi', capacity: 30, price: 300, daysFromNow: 7 },
  { title: 'Karura Forest Trail Ride', description: 'Guided off-road trail ride through Karura Forest for mountain bikers.', location: 'Karura Forest, Nairobi', capacity: 40, price: 800, daysFromNow: 21 },
  { title: 'Beginner Cycling Clinic', description: 'A friendly introduction to road safety and basic bike handling for new riders.', location: 'KCA University Sports Ground', capacity: 25, price: 0, daysFromNow: 10 },
  { title: 'VeloPortal Charity Ride for Schools', description: 'A charity fundraiser ride supporting bicycles for rural schoolchildren.', location: 'Nairobi CBD to Kikuyu', capacity: 150, price: 1000, daysFromNow: 45 },
  { title: 'Women in Cycling Meetup', description: 'A community meetup and short ride celebrating women cyclists in Nairobi.', location: 'Ngong Road Forest Sanctuary', capacity: 50, price: 200, daysFromNow: 18 },
  { title: 'E-Bike Demo Day', description: 'Try the latest electric bikes in the VeloPortal fleet with on-site experts.', location: 'VeloPortal Hub, Nairobi', capacity: 35, price: 0, daysFromNow: 5 },
  { title: 'Interschool Cycling Race', description: 'A competitive cycling race between Nairobi-area university teams.', location: 'KCA University Track', capacity: 80, price: 300, daysFromNow: 35 },
  { title: 'Sunset Coastal Cruise Ride', description: 'A relaxed cruiser-bike ride ending with a sunset viewing session.', location: 'Two Rivers Mall to Ruaka', capacity: 45, price: 400, daysFromNow: 25 },
];

async function seed() {
  await sequelize.sync({ force: true });
  console.log('Database reset.');

  const mkUser = async (name, email, password, role, regNumber, phone) => User.create({
    name, email, password: await bcrypt.hash(password, 10), phone: phone || '+254700000000',
    role, isEmailVerified: true, regNumber: regNumber || null,
    avatarUrl: genImage(name.split(' ')[0], '16382A', 'E8A33D'),
  });

  await mkUser('VeloPortal Admin', 'admin@veloportal.app', 'Admin@12345', 'admin');
  await mkUser('Grace the Mechanic', 'mechanic@veloportal.app', 'Mechanic@12345', 'mechanic');
  await mkUser('Kevin the Attendant', 'staff@veloportal.app', 'Staff@12345', 'staff');
  await mkUser('Elvis Muthomi', 'rider@veloportal.app', 'Rider@12345', 'customer', '25/01220', '+254713048056');
  const adminUser = await User.findOne({ where: { email: 'admin@veloportal.app' } });

  const categoryRecords = {};
  for (const cat of CATEGORIES) {
    categoryRecords[cat.name] = await Category.create({ ...cat, slug: slugify(cat.name, { lower: true }) });
  }
  console.log('Categories seeded (including Accessories and Equipment & Tools).');

  for (const [catName, bikes] of Object.entries(BIKES_BY_CATEGORY)) {
    const [bg, fg] = CATEGORY_COLORS[catName];
    for (const b of bikes) {
      await Bicycle.create({
        ...b,
        productType: 'bicycle',
        categoryId: categoryRecords[catName].id,
        slug: slugify(`${b.name}-${b.brand}`, { lower: true }) + '-' + Math.floor(Math.random() * 9000 + 1000),
        condition: 'new',
        forSale: true,
        images: [genImage(`${b.name}\n${b.brand}`, bg, fg)],
        description: `The ${b.name} by ${b.brand} is built for the ${catName.toLowerCase()} category, combining durability, comfort, and performance for Nairobi's roads and trails.`,
      });
    }
  }
  console.log('Bicycles seeded across all categories, each with a name-matched image.');

  const [accBg, accFg] = CATEGORY_COLORS['Accessories'];
  for (const a of ACCESSORIES) {
    await Bicycle.create({
      ...a, productType: 'accessory', categoryId: categoryRecords['Accessories'].id,
      slug: slugify(`${a.name}-${a.brand}`, { lower: true }) + '-' + Math.floor(Math.random() * 9000 + 1000),
      condition: 'new', forSale: true, forRent: false,
      images: [genImage(`${a.name}\n${a.brand}`, accBg, accFg)],
      description: `${a.brand} ${a.name} — a VeloPortal riding accessory.`,
    });
  }
  const [eqBg, eqFg] = CATEGORY_COLORS['Equipment & Tools'];
  for (const e of EQUIPMENT) {
    await Bicycle.create({
      ...e, productType: 'equipment', categoryId: categoryRecords['Equipment & Tools'].id,
      slug: slugify(`${e.name}-${e.brand}`, { lower: true }) + '-' + Math.floor(Math.random() * 9000 + 1000),
      condition: 'new', forSale: true, forRent: false,
      images: [genImage(`${e.name}\n${e.brand}`, eqBg, eqFg)],
      description: `${e.brand} ${e.name} — maintenance equipment sold on VeloPortal.`,
    });
  }
  console.log('Accessories and equipment seeded — the Shop now sells more than just bicycles.');

  for (const c of COMPONENTS) {
    const [bg, fg] = COMPONENT_COLORS[c.partType];
    await Component.create({
      ...c,
      image: genImage(`${c.name}\n${c.brand}`, bg, fg),
      description: `${c.brand} ${c.name} — ${c.partType} component for the VeloPortal bike customizer.`,
    });
  }
  console.log('Customizer components seeded (forks, wheels, handlebars, drivetrains), color-coded by part type.');

  for (const s of REPAIR_SERVICES) await RepairService.create(s);
  console.log('Repair services seeded.');

  for (const e of EVENTS) {
    const date = new Date();
    date.setDate(date.getDate() + e.daysFromNow);
    await Event.create({
      title: e.title, slug: slugify(e.title, { lower: true }), description: e.description,
      date, location: e.location, capacity: e.capacity, price: e.price,
      imageUrl: genImage(e.title, '16382A', 'E8A33D'),
    });
  }
  console.log(`${EVENTS.length} events seeded, each with a name-matched image.`);

  await CommunityPost.create({
    userId: adminUser.id,
    content: 'Welcome to the VeloPortal community! Share your rides, ask maintenance questions, and join our weekend group rides.',
    likesCount: 3,
  });
  console.log('Community seeded.');

  console.log('\nSeed complete. Demo accounts:');
  console.log('  Admin      -> admin@veloportal.app / Admin@12345      (super admin — full access)');
  console.log('  Mechanic   -> mechanic@veloportal.app / Mechanic@12345 (repair queue only)');
  console.log('  Staff      -> staff@veloportal.app / Staff@12345      (inventory, orders, rentals, events, community)');
  console.log('  Rider      -> rider@veloportal.app / Rider@12345      (customer, reg. no. 25/01220)');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
