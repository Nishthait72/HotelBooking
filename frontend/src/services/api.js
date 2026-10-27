import { getInitialMockData } from './mockData';

const BASE_URL = '/api';

// Initialize Local Demo State
const getDemoStore = () => {
  const stored = localStorage.getItem('hotelpro_demo_data');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
  }
  const initial = getInitialMockData();
  localStorage.setItem('hotelpro_demo_data', JSON.stringify(initial));
  return initial;
};

const saveDemoStore = (data) => {
  localStorage.setItem('hotelpro_demo_data', JSON.stringify(data));
};

// Handle Demo Requests in static client environments
const handleDemoRequest = (endpoint, method = 'GET', body = null) => {
  const store = getDemoStore();
  const url = endpoint.split('?')[0];
  const params = new URLSearchParams(endpoint.includes('?') ? endpoint.split('?')[1] : '');

  // Auth endpoints
  if (url === '/auth/login' && method === 'POST') {
    const { email } = body || {};
    const user = store.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase()) || {
      id: 'usr_guest',
      name: 'Guest User',
      email: email || 'guest@hotelpro.com',
      role: 'Guest',
      phone: '+1 555-0100',
    };
    return { success: true, token: 'demo_token_' + user.id, user };
  }

  if (url === '/auth/register' && method === 'POST') {
    const newUser = {
      id: 'usr_' + Date.now(),
      name: body.name,
      email: body.email,
      role: body.role || 'Guest',
      phone: body.phone || '',
    };
    store.users.push(newUser);
    saveDemoStore(store);
    return { success: true, token: 'demo_token_' + newUser.id, user: newUser };
  }

  if (url === '/auth/me') {
    const token = localStorage.getItem('hotelpro_token') || '';
    const userId = token.replace('demo_token_', '');
    const user = store.users.find((u) => u.id === userId) || store.users[0];
    return { success: true, user };
  }

  if (url === '/auth/staff') {
    return { success: true, data: store.users.filter((u) => u.role !== 'Guest') };
  }

  // Stats Dashboard
  if (url === '/stats/dashboard') {
    const token = localStorage.getItem('hotelpro_token') || '';
    const userId = token.replace('demo_token_', '');
    const user = store.users.find((u) => u.id === userId) || store.users[0];

    if (user.role === 'Guest') {
      const activeBookings = store.bookings.filter(
        (b) => b.user?.id === user.id || b.guest?.email === user.email
      );
      return {
        success: true,
        data: {
          role: 'Guest',
          myBookingsCount: activeBookings.length,
          activeBookings,
        },
      };
    }

    const totalRooms = store.rooms.length;
    const availableRooms = store.rooms.filter((r) => r.status === 'available').length;
    const bookedRooms = store.rooms.filter((r) => r.status === 'booked').length;
    const maintenanceRooms = store.rooms.filter((r) => r.status === 'maintenance').length;
    const totalRev = store.payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      success: true,
      data: {
        role: user.role,
        rooms: {
          total: totalRooms,
          available: availableRooms,
          booked: bookedRooms,
          maintenance: maintenanceRooms,
          occupancyRate: totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0,
        },
        bookings: {
          total: store.bookings.length,
          active: store.bookings.filter((b) => ['confirmed', 'checked_in'].includes(b.status)).length,
          todayCheckIns: 1,
          todayCheckOuts: 0,
        },
        finance: {
          totalRevenue: totalRev,
          paymentsCount: store.payments.length,
        },
        operations: {
          totalGuests: store.guests.length,
          pendingTasks: store.tasks.filter((t) => t.status !== 'completed').length,
        },
        recentBookings: store.bookings.slice(0, 5),
      },
    };
  }

  // Rooms
  if (url === '/rooms') {
    if (method === 'GET') {
      let result = [...store.rooms];
      const type = params.get('type');
      const status = params.get('status');
      const search = params.get('search');
      if (type && type !== 'all') result = result.filter((r) => r.type === type);
      if (status && status !== 'all') result = result.filter((r) => r.status === status);
      if (search) result = result.filter((r) => r.roomNumber.toLowerCase().includes(search.toLowerCase()));
      return { success: true, count: result.length, data: result };
    }
    if (method === 'POST') {
      const newRoom = {
        _id: 'rm_' + Date.now(),
        ...body,
      };
      store.rooms.push(newRoom);
      saveDemoStore(store);
      return { success: true, data: newRoom };
    }
  }

  if (url.startsWith('/rooms/') && method === 'PUT') {
    const id = url.replace('/rooms/', '');
    const idx = store.rooms.findIndex((r) => r._id === id);
    if (idx !== -1) {
      store.rooms[idx] = { ...store.rooms[idx], ...body };
      saveDemoStore(store);
      return { success: true, data: store.rooms[idx] };
    }
  }

  if (url.startsWith('/rooms/') && method === 'DELETE') {
    const id = url.replace('/rooms/', '');
    store.rooms = store.rooms.filter((r) => r._id !== id);
    saveDemoStore(store);
    return { success: true, message: 'Deleted' };
  }

  // Bookings
  if (url === '/bookings/check-availability') {
    const type = params.get('type');
    let avail = store.rooms.filter((r) => r.status !== 'maintenance');
    if (type && type !== 'all') avail = avail.filter((r) => r.type === type);
    return { success: true, count: avail.length, data: avail };
  }

  if (url === '/bookings') {
    if (method === 'GET') {
      let list = [...store.bookings];
      const status = params.get('status');
      const search = params.get('search');
      if (status && status !== 'all') list = list.filter((b) => b.status === status);
      if (search) list = list.filter((b) => b.bookingNumber.toLowerCase().includes(search.toLowerCase()));
      return { success: true, count: list.length, data: list };
    }
    if (method === 'POST') {
      const targetRoom = store.rooms.find((r) => r._id === body.roomId) || store.rooms[0];
      const d1 = new Date(body.checkInDate);
      const d2 = new Date(body.checkOutDate);
      const nights = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
      const total = nights * targetRoom.pricePerNight;

      const newBooking = {
        _id: 'bk_' + Date.now(),
        bookingNumber: 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        room: targetRoom,
        guest: {
          fullName: body.guestInfo?.fullName || 'Demo Guest',
          email: body.guestInfo?.email || 'guest@example.com',
          phone: body.guestInfo?.phone || '+1 555-0100',
        },
        checkInDate: body.checkInDate,
        checkOutDate: body.checkOutDate,
        guestsCount: body.guestsCount || 1,
        totalNights: nights,
        totalAmount: total,
        status: 'confirmed',
        paymentStatus: body.paymentMethod ? 'paid' : 'unpaid',
        specialRequests: body.specialRequests || '',
        createdAt: new Date().toISOString(),
      };
      store.bookings.unshift(newBooking);

      if (body.paymentMethod) {
        store.payments.unshift({
          _id: 'pay_' + Date.now(),
          paymentNumber: 'PAY-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          booking: newBooking,
          guest: newBooking.guest,
          amount: total,
          paymentMethod: body.paymentMethod,
          paymentStatus: 'completed',
          transactionId: 'TXN-ONLINE-' + Date.now(),
          createdAt: new Date().toISOString(),
        });
      }

      saveDemoStore(store);
      return { success: true, data: newBooking };
    }
  }

  if (url.includes('/bookings/') && url.endsWith('/status')) {
    const id = url.split('/')[2];
    const b = store.bookings.find((item) => item._id === id);
    if (b) {
      b.status = body.status;
      if (body.status === 'checked_in') {
        const rm = store.rooms.find((r) => r._id === (b.room._id || b.room));
        if (rm) rm.status = 'booked';
      } else if (body.status === 'checked_out' || body.status === 'cancelled') {
        const rm = store.rooms.find((r) => r._id === (b.room._id || b.room));
        if (rm) rm.status = 'available';
      }
      saveDemoStore(store);
      return { success: true, data: b };
    }
  }

  if (url.includes('/bookings/') && url.endsWith('/cancel')) {
    const id = url.split('/')[2];
    const b = store.bookings.find((item) => item._id === id);
    if (b) {
      b.status = 'cancelled';
      const rm = store.rooms.find((r) => r._id === (b.room._id || b.room));
      if (rm) rm.status = 'available';
      saveDemoStore(store);
      return { success: true, data: b };
    }
  }

  // Guests
  if (url === '/guests') {
    if (method === 'GET') {
      let list = [...store.guests];
      const search = params.get('search');
      if (search) {
        list = list.filter((g) =>
          g.fullName.toLowerCase().includes(search.toLowerCase()) ||
          g.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      return { success: true, count: list.length, data: list };
    }
    if (method === 'POST') {
      const newGuest = {
        _id: 'gst_' + Date.now(),
        ...body,
        createdAt: new Date().toISOString(),
      };
      store.guests.push(newGuest);
      saveDemoStore(store);
      return { success: true, data: newGuest };
    }
  }

  if (url.startsWith('/guests/') && method === 'GET') {
    const id = url.replace('/guests/', '');
    const g = store.guests.find((item) => item._id === id) || store.guests[0];
    return { success: true, data: { ...g, bookings: store.bookings.slice(0, 2) } };
  }

  // Payments
  if (url === '/payments') {
    if (method === 'GET') {
      return { success: true, count: store.payments.length, data: store.payments };
    }
    if (method === 'POST') {
      const b = store.bookings.find((item) => item._id === body.bookingId) || store.bookings[0];
      const newPay = {
        _id: 'pay_' + Date.now(),
        paymentNumber: 'PAY-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        booking: b,
        guest: b.guest,
        amount: Number(body.amount),
        paymentMethod: body.paymentMethod,
        paymentStatus: 'completed',
        transactionId: 'TXN-SLIP-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        createdAt: new Date().toISOString(),
      };
      b.paymentStatus = 'paid';
      store.payments.unshift(newPay);
      saveDemoStore(store);
      return { success: true, data: newPay };
    }
  }

  // Tasks
  if (url === '/tasks') {
    if (method === 'GET') {
      let list = [...store.tasks];
      const status = params.get('status');
      if (status && status !== 'all') list = list.filter((t) => t.status === status);
      return { success: true, count: list.length, data: list };
    }
    if (method === 'POST') {
      const newTask = {
        _id: 'tsk_' + Date.now(),
        ...body,
        assignedTo: store.users.find((u) => u.id === body.assignedTo) || store.users[1],
        room: store.rooms.find((r) => r._id === body.room) || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      store.tasks.unshift(newTask);
      saveDemoStore(store);
      return { success: true, data: newTask };
    }
  }

  if (url.startsWith('/tasks/') && method === 'PUT') {
    const id = url.replace('/tasks/', '');
    const t = store.tasks.find((item) => item._id === id);
    if (t) {
      Object.assign(t, body);
      saveDemoStore(store);
      return { success: true, data: t };
    }
  }

  if (url.startsWith('/tasks/') && method === 'DELETE') {
    const id = url.replace('/tasks/', '');
    store.tasks = store.tasks.filter((item) => item._id !== id);
    saveDemoStore(store);
    return { success: true, message: 'Deleted' };
  }

  return { success: true, data: [] };
};

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('hotelpro_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.ok) {
      return await response.json();
    }

    // If 404 or server not running (e.g. static hosting on GitHub Pages / Surge), fallback to interactive demo
    if (response.status === 404 || response.status === 502 || response.status === 504) {
      console.warn(`[HotelPro API] Endpoint ${endpoint} returned ${response.status}, serving via interactive demo mode.`);
      const body = options.body ? JSON.parse(options.body) : null;
      return handleDemoRequest(endpoint, options.method || 'GET', body);
    }

    const data = await response.json().catch(() => ({}));
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  } catch (err) {
    // If fetch failed completely (Failed to fetch, network error, or static deploy), transparently fallback to demo mode
    if (err.name === 'TypeError' || err.message.includes('fetch')) {
      console.warn(`[HotelPro API] Network unreachable, activating live interactive demo mode.`);
      const body = options.body ? JSON.parse(options.body) : null;
      return handleDemoRequest(endpoint, options.method || 'GET', body);
    }
    throw err;
  }
};

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
