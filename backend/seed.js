const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Room = require('./models/Room');
const Guest = require('./models/Guest');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Task = require('./models/Task');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hotelpro';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected. Clearing old collections...');

    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      Guest.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Task.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const staffPassword = await bcrypt.hash('Staff@123', salt);
    const guestPassword = await bcrypt.hash('Guest@123', salt);

    const [admin, staff, guestUser] = await User.create([
      {
        name: 'Alexander Wright',
        email: 'admin@hotelpro.com',
        password: adminPassword,
        role: 'Admin',
        phone: '+1 (555) 019-2831',
      },
      {
        name: 'Sarah Jenkins',
        email: 'staff@hotelpro.com',
        password: staffPassword,
        role: 'Staff',
        phone: '+1 (555) 019-8472',
      },
      {
        name: 'David Miller',
        email: 'guest@hotelpro.com',
        password: guestPassword,
        role: 'Guest',
        phone: '+1 (555) 014-9921',
      },
    ]);

    console.log('[Seed] Seeding Rooms...');
    const rooms = await Room.create([
      {
        roomNumber: '101',
        type: 'Single',
        pricePerNight: 85,
        capacity: 1,
        floor: 1,
        status: 'available',
        amenities: ['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Coffee Maker'],
        description: 'Cozy single room with workstation, rainfall shower and city view.',
        imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      },
      {
        roomNumber: '102',
        type: 'Single',
        pricePerNight: 90,
        capacity: 1,
        floor: 1,
        status: 'available',
        amenities: ['Free High-Speed Wi-Fi', 'Air Conditioning', 'Flat-screen TV', 'Mini Fridge'],
        description: 'Quiet courtyard-facing single room ideal for solo business travelers.',
        imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
      },
      {
        roomNumber: '201',
        type: 'Double',
        pricePerNight: 140,
        capacity: 2,
        floor: 2,
        status: 'booked',
        amenities: ['King Size Bed', 'Balcony', 'Free High-Speed Wi-Fi', 'Air Conditioning', 'Safe Box'],
        description: 'Spacious double room featuring private balcony and plush king mattress.',
        imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      },
      {
        roomNumber: '202',
        type: 'Double',
        pricePerNight: 135,
        capacity: 2,
        floor: 2,
        status: 'available',
        amenities: ['Queen Bed', 'Free High-Speed Wi-Fi', 'Air Conditioning', 'Work Desk'],
        description: 'Modern double room with soundproof windows and ergonomic study table.',
        imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
      },
      {
        roomNumber: '301',
        type: 'Deluxe',
        pricePerNight: 220,
        capacity: 3,
        floor: 3,
        status: 'available',
        amenities: ['Ocean View', 'King Bed', 'Mini Bar', 'Bathtub', 'Balcony', 'Breakfast Included'],
        description: 'Luxury deluxe bedroom overlooking the scenic coastline with marble bath.',
        imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      },
      {
        roomNumber: '302',
        type: 'Deluxe',
        pricePerNight: 230,
        capacity: 3,
        floor: 3,
        status: 'maintenance',
        amenities: ['Ocean View', 'King Bed', 'Mini Bar', 'Smart TV', 'Balcony'],
        description: 'Deluxe suite undergoing seasonal HVAC upgrade and deep cleaning.',
        imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
      },
      {
        roomNumber: '401',
        type: 'Suite',
        pricePerNight: 350,
        capacity: 4,
        floor: 4,
        status: 'available',
        amenities: ['Penthouse Level', 'Private Jacuzzi', 'Living Lounge', 'Kitchenette', 'Free High-Speed Wi-Fi', '24/7 Butler'],
        description: 'Presidential suite with expansive skyline panorama and personal jacuzzi.',
        imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
      },
      {
        roomNumber: '402',
        type: 'Suite',
        pricePerNight: 320,
        capacity: 4,
        floor: 4,
        status: 'available',
        amenities: ['Executive Lounge Access', 'Separate Dining Area', 'King Bed', 'Espresso Machine'],
        description: 'Executive penthouse suite tailored for VIP guests and families.',
        imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      },
    ]);

    console.log('[Seed] Seeding Guests...');
    const [guest1, guest2, guest3] = await Guest.create([
      {
        user: guestUser._id,
        fullName: 'David Miller',
        email: 'guest@hotelpro.com',
        phone: '+1 (555) 014-9921',
        idType: 'Passport',
        idNumber: 'PA98471203',
        address: '742 Evergreen Terrace, Springfield, OR',
      },
      {
        fullName: 'Emily Watson',
        email: 'emily.watson@example.com',
        phone: '+1 (555) 329-9110',
        idType: 'Driving License',
        idNumber: 'DL-8839210',
        address: '124 Conch Street, Pacific Grove, CA',
      },
      {
        fullName: 'Marcus Vance',
        email: 'marcus.v@example.com',
        phone: '+1 (555) 441-2091',
        idType: 'National ID',
        idNumber: 'NID-9923847',
        address: '42 Wallaby Way, Sydney, AU',
      },
    ]);

    console.log('[Seed] Seeding Bookings & Payments...');
    const checkInDate1 = new Date();
    const checkOutDate1 = new Date();
    checkOutDate1.setDate(checkInDate1.getDate() + 3);

    const booking1 = await Booking.create({
      bookingNumber: 'BK-7892A1',
      guest: guest1._id,
      room: rooms[2]._id, // Room 201 Double
      user: guestUser._id,
      checkInDate: checkInDate1,
      checkOutDate: checkOutDate1,
      guestsCount: 2,
      totalNights: 3,
      pricePerNight: rooms[2].pricePerNight,
      totalAmount: 3 * rooms[2].pricePerNight,
      status: 'checked_in',
      paymentStatus: 'paid',
      specialRequests: 'High floor, late evening arrival.',
    });

    await Payment.create({
      paymentNumber: 'PAY-831991',
      booking: booking1._id,
      guest: guest1._id,
      amount: booking1.totalAmount,
      paymentMethod: 'Credit Card',
      paymentStatus: 'completed',
      transactionId: 'TXN-AMEX88190',
      notes: 'Fully paid via card during check-in',
    });

    const checkInDate2 = new Date();
    checkInDate2.setDate(checkInDate2.getDate() + 5);
    const checkOutDate2 = new Date();
    checkOutDate2.setDate(checkInDate2.getDate() + 2);

    const booking2 = await Booking.create({
      bookingNumber: 'BK-5521B4',
      guest: guest2._id,
      room: rooms[4]._id, // Room 301 Deluxe
      user: null,
      checkInDate: checkInDate2,
      checkOutDate: checkOutDate2,
      guestsCount: 2,
      totalNights: 2,
      pricePerNight: rooms[4].pricePerNight,
      totalAmount: 2 * rooms[4].pricePerNight,
      status: 'confirmed',
      paymentStatus: 'unpaid',
      specialRequests: 'Champagne bottle in room on arrival.',
    });

    console.log('[Seed] Seeding Tasks for Staff...');
    await Task.create([
      {
        title: 'Deep Sanitization & Inspection',
        description: 'Complete inspection and linen refresh for Deluxe Room 302 prior to re-opening.',
        assignedTo: staff._id,
        room: rooms[5]._id,
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        title: 'Welcome Amenities Preparation',
        description: 'Place fruit basket and welcome card in Room 201 for David Miller.',
        assignedTo: staff._id,
        room: rooms[2]._id,
        priority: 'medium',
        status: 'completed',
        dueDate: new Date(),
      },
      {
        title: 'Luggage Assistance on Arrival',
        description: 'Assist incoming VIP guest at main lobby entrance at 4 PM.',
        assignedTo: staff._id,
        room: rooms[4]._id,
        priority: 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    ]);

    console.log('--------------------------------------------------');
    console.log('Seeding completed successfully!');
    console.log('Demo Credentials:');
    console.log('  Admin : admin@hotelpro.com / Admin@123');
    console.log('  Staff : staff@hotelpro.com / Staff@123');
    console.log('  Guest : guest@hotelpro.com / Guest@123');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedData();
