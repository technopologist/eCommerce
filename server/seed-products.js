// Seed catalog. Inserted into the products table the first time the
// server starts against an empty database (see server/db.js).
export const products = [
  {
    id: 'p1', name: 'Wireless Noise-Cancelling Headphones', category: 'Electronics',
    price: 149.99, rating: 4.6, reviews: 1284, stock: 12, emoji: '🎧', color: '#e0e7ff',
    description: 'Immersive sound with adaptive noise cancellation and 30-hour battery life. Soft memory-foam ear cushions keep you comfortable all day.',
    features: ['Active noise cancellation', '30-hour battery', 'USB-C fast charging', 'Bluetooth 5.3'],
  },
  {
    id: 'p2', name: 'Smart Fitness Watch', category: 'Electronics',
    price: 89.0, rating: 4.3, reviews: 842, stock: 20, emoji: '⌚', color: '#dbeafe',
    description: 'Track steps, heart rate, sleep and workouts. Water resistant to 50m with a bright always-on display.',
    features: ['Heart-rate & SpO2 tracking', '7-day battery', 'Water resistant 5 ATM', 'Sleep insights'],
  },
  {
    id: 'p3', name: 'Portable Bluetooth Speaker', category: 'Electronics',
    price: 45.5, rating: 4.4, reviews: 563, stock: 3, emoji: '🔊', color: '#ede9fe',
    description: 'Big, room-filling sound in a pocket-sized, rugged design. Pair two for stereo.',
    features: ['IP67 waterproof', '12-hour playtime', 'Stereo pairing', 'Built-in mic'],
  },
  {
    id: 'p4', name: '4K Action Camera', category: 'Electronics',
    price: 199.0, rating: 4.1, reviews: 210, stock: 0, emoji: '📷', color: '#e0f2fe',
    description: 'Capture every adventure in crisp 4K at 60fps with electronic image stabilisation.',
    features: ['4K60 video', 'Image stabilisation', 'Waterproof case included', 'Wi-Fi sharing'],
  },
  {
    id: 'p5', name: 'Pour-Over Coffee Set', category: 'Home & Kitchen',
    price: 34.99, rating: 4.7, reviews: 391, stock: 15, emoji: '☕', color: '#fef3c7',
    description: 'Glass dripper, carafe and reusable stainless filter for a clean, bright cup every morning.',
    features: ['Borosilicate glass', 'Reusable filter', '600ml carafe', 'Dishwasher safe'],
  },
  {
    id: 'p6', name: 'Non-Stick Frying Pan 28cm', category: 'Home & Kitchen',
    price: 29.95, rating: 4.2, reviews: 1022, stock: 30, emoji: '🍳', color: '#fde68a',
    description: 'PFOA-free ceramic coating, induction-ready base and a cool-touch handle.',
    features: ['Ceramic non-stick', 'Induction compatible', 'Oven safe to 200°C', 'Cool-touch handle'],
  },
  {
    id: 'p7', name: 'Scented Soy Candle Trio', category: 'Home & Kitchen',
    price: 24.0, rating: 4.8, reviews: 178, stock: 25, emoji: '🕯️', color: '#ffedd5',
    description: 'Hand-poured soy wax candles in lavender, vanilla and cedar. 40-hour burn time each.',
    features: ['100% soy wax', 'Cotton wicks', '3 × 40-hour burn', 'Recyclable jars'],
  },
  {
    id: 'p8', name: 'Classic Denim Jacket', category: 'Fashion',
    price: 64.99, rating: 4.5, reviews: 455, stock: 9, emoji: '🧥', color: '#dbeafe',
    description: 'A timeless, slightly relaxed denim jacket in a mid-wash that goes with everything.',
    features: ['100% cotton denim', 'Relaxed fit', 'Button front', 'Two chest pockets'],
  },
  {
    id: 'p9', name: 'Everyday Running Sneakers', category: 'Fashion',
    price: 79.0, rating: 4.4, reviews: 987, stock: 18, emoji: '👟', color: '#dcfce7',
    description: 'Lightweight, breathable knit upper with responsive cushioning for daily miles.',
    features: ['Breathable knit', 'Responsive foam', 'Rubber outsole', 'Machine washable'],
  },
  {
    id: 'p10', name: 'Leather Crossbody Bag', category: 'Fashion',
    price: 58.0, rating: 4.6, reviews: 302, stock: 7, emoji: '👜', color: '#fce7f3',
    description: 'Compact genuine-leather bag with an adjustable strap and RFID-blocking card slot.',
    features: ['Genuine leather', 'Adjustable strap', 'RFID card slot', '3 compartments'],
  },
  {
    id: 'p11', name: 'Yoga Mat with Carry Strap', category: 'Sports',
    price: 32.5, rating: 4.5, reviews: 640, stock: 22, emoji: '🧘', color: '#d1fae5',
    description: '6mm thick, non-slip mat that cushions joints and rolls up neatly with the included strap.',
    features: ['6mm cushioning', 'Non-slip texture', 'Carry strap', 'Phthalate-free'],
  },
  {
    id: 'p12', name: 'Adjustable Dumbbell Set', category: 'Sports',
    price: 129.0, rating: 4.3, reviews: 233, stock: 5, emoji: '🏋️', color: '#e5e7eb',
    description: 'Swap between 2.5kg and 12kg in seconds — a whole rack of weights in one compact pair.',
    features: ['2.5–12kg per hand', 'Quick-change dial', 'Storage tray', 'Anti-roll design'],
  },
  {
    id: 'p13', name: 'Insulated Water Bottle 1L', category: 'Sports',
    price: 22.0, rating: 4.7, reviews: 1530, stock: 40, emoji: '🥤', color: '#cffafe',
    description: 'Keeps drinks cold for 24 hours or hot for 12. Leak-proof lid and powder-coated grip.',
    features: ['Double-wall vacuum', '24h cold / 12h hot', 'Leak-proof', 'BPA-free'],
  },
  {
    id: 'p14', name: 'The Art of Simple Cooking', category: 'Books',
    price: 18.99, rating: 4.8, reviews: 412, stock: 14, emoji: '📕', color: '#fee2e2',
    description: '120 approachable recipes built from pantry staples, with weeknight meal plans.',
    features: ['Hardcover, 288 pages', '120 recipes', 'Weekly meal plans', 'Full-colour photos'],
  },
  {
    id: 'p15', name: 'Mindful Habits: A Guide', category: 'Books',
    price: 14.5, rating: 4.4, reviews: 267, stock: 11, emoji: '📗', color: '#dcfce7',
    description: 'Practical, science-backed techniques for building routines that actually stick.',
    features: ['Paperback, 224 pages', 'Exercises in every chapter', 'Habit tracker templates'],
  },
  {
    id: 'p16', name: 'Hydrating Skincare Kit', category: 'Beauty',
    price: 39.0, rating: 4.5, reviews: 519, stock: 16, emoji: '🧴', color: '#fae8ff',
    description: 'Cleanser, serum and moisturiser with hyaluronic acid for soft, hydrated skin.',
    features: ['3-step routine', 'Hyaluronic acid', 'Fragrance-free', 'Cruelty-free'],
  },
  {
    id: 'p17', name: 'Botanical Perfume 50ml', category: 'Beauty',
    price: 68.0, rating: 4.2, reviews: 144, stock: 8, emoji: '🌸', color: '#ffe4e6',
    description: 'A fresh floral scent with notes of jasmine, bergamot and soft musk.',
    features: ['Eau de parfum', 'Long-lasting', 'Vegan formula', 'Refillable bottle'],
  },
  {
    id: 'p18', name: 'Desk Plant – Snake Plant', category: 'Home & Kitchen',
    price: 27.0, rating: 4.6, reviews: 356, stock: 10, emoji: '🪴', color: '#ecfccb',
    description: 'Low-maintenance, air-purifying plant in a matte ceramic pot. Thrives on neglect.',
    features: ['Ceramic pot included', 'Low light tolerant', 'Water every 2–3 weeks', '30–40cm tall'],
  },
];
