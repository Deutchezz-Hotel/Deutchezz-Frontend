import { useMemo, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowRight, Bell, BedDouble, Building2, CalendarDays, Check, ChevronDown, CircleDollarSign,
  ClipboardList, CreditCard, DoorOpen, Download, Filter, Hotel, LayoutDashboard, LogOut,
  Menu, MoreHorizontal, Phone, Plus, Search, Settings, ShieldCheck, Sparkles, UserRound,
  Users, WalletCards, X, CheckCircle2, Clock3, Wrench, Moon, Receipt, SlidersHorizontal
} from 'lucide-react';
import './App.css';

type Role = 'guest' | 'customer' | 'receptionist' | 'administrator';
type Status = 'Confirmed' | 'Pending' | 'Checked In' | 'Checked Out' | 'Cancelled';

type RoomType = { id: string; name: string; price: number; image: string; description: string; capacity: number; bed: string; amenities: string[] };
type Booking = { id: string; guest: string; email: string; dates: string; rooms: string; total: number; status: Status; payment: string; guests: number };

const queryClient = new QueryClient();
const money = (value: number) => `₦${value.toLocaleString('en-NG')}`;
const roomTypes: RoomType[] = [
  { id: 'deluxe', name: 'Deluxe Room', price: 30000, image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200', description: 'A serene retreat with warm textures, ambient lighting, and the quiet indulgence of considered comfort — designed for guests who appreciate the finer details.', capacity: 2, bed: 'King bed', amenities: ['Smart TV', 'Wi-Fi', 'Breakfast included', 'Rain shower'] },
  { id: 'executive', name: 'Executive Room', price: 55000, image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200', description: 'Where productivity meets tranquility. Generous proportions and elevated amenities create a sanctuary for the discerning business traveller.', capacity: 3, bed: 'King bed', amenities: ['Lounge area', 'Wi-Fi', 'Breakfast included', 'City view'] },
  { id: 'standard', name: 'Standard Room', price: 22000, image: 'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1200', description: 'Thoughtfully appointed for effortless stays — everything you need for a restful night in Jos, nothing superfluous.', capacity: 2, bed: 'Queen bed', amenities: ['Smart TV', 'Wi-Fi', 'Work desk', 'Air conditioning'] },
  { id: 'suite', name: 'Ispahan Suite', price: 85000, image: 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=1200', description: 'Our signature residence — a private living room, curated art, and an unhurried rhythm that transforms your stay into an experience.', capacity: 4, bed: 'King bed', amenities: ['Living room', 'Wi-Fi', 'Breakfast included', 'Butler service'] },
];
const bookings: Booking[] = [
  { id: 'DHI-2026-8F42K9', guest: 'Grace Ibrahim', email: 'grace@example.com', dates: 'Oct 10 — Oct 15, 2026', rooms: '2 Deluxe, 1 Executive', total: 575000, status: 'Confirmed', payment: 'Pending', guests: 4 },
  { id: 'DHI-2026-7D19PL', guest: 'David Musa', email: 'david@example.com', dates: 'Oct 08 — Oct 10, 2026', rooms: '1 Executive', total: 110000, status: 'Checked In', payment: 'Partially Paid', guests: 2 },
  { id: 'DHI-2026-51XQ8A', guest: 'Esther Samuel', email: 'esther@example.com', dates: 'Oct 14 — Oct 16, 2026', rooms: '1 Standard', total: 44000, status: 'Pending', payment: 'Pending', guests: 1 },
  { id: 'DHI-2026-2N4K6C', guest: 'Peter James', email: 'peter@example.com', dates: 'Oct 18 — Oct 22, 2026', rooms: '1 Suite', total: 340000, status: 'Confirmed', payment: 'Paid', guests: 2 },
];

function App() {
  return <QueryClientProvider client={queryClient}><BrowserRouter><Routes><Route path="*" element={<AppShell />} /></Routes></BrowserRouter></QueryClientProvider>;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(location.pathname.startsWith('/admin') ? 'administrator' : location.pathname.startsWith('/reception') ? 'receptionist' : location.pathname.startsWith('/dashboard') ? 'customer' : 'guest');
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPortal = role !== 'guest' && !['/', '/rooms', '/about', '/contact', '/book', '/my-booking', '/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/admin') || location.pathname.startsWith('/reception') || location.pathname.startsWith('/dashboard');

  const switchRole = (next: Role) => { setRole(next); navigate(next === 'administrator' ? '/admin' : next === 'receptionist' ? '/reception' : next === 'customer' ? '/dashboard' : '/'); setMobileOpen(false); };
  if (isPortal) return <PortalLayout role={role} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onRoleChange={switchRole} />;
  return <PublicLayout onRoleChange={switchRole} />;
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link to="/" className={`brand ${inverse ? 'brand-inverse' : ''}`}><img src="/images/logoh.png" alt="Deutchezz Hotel Ispahan" /><span><strong>DEUTCHEZZ</strong><small>HOTEL ISPAHAN</small></span></Link>;
}

function PublicLayout({ onRoleChange }: { onRoleChange: (role: Role) => void }) {
  const [menu, setMenu] = useState(false);
  return <div className="public-shell"><header className="public-header"><Brand /><nav className={menu ? 'mobile-menu open' : 'mobile-menu'}><NavLink to="/rooms">Rooms</NavLink><NavLink to="/about">The Hotel</NavLink><NavLink to="/contact">Contact</NavLink><NavLink to="/my-booking">My Booking</NavLink><button className="button button-dark" onClick={() => onRoleChange('customer')}>Sign In <ArrowRight size={15} /></button></nav><button className="icon-button menu-toggle" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></header><Routes><Route path="/" element={<Home />} /><Route path="/rooms" element={<Rooms />} /><Route path="/rooms/:id" element={<RoomDetail />} /><Route path="/book" element={<Book />} /><Route path="/booking/guest-details" element={<GuestDetails />} /><Route path="/booking/review" element={<Review />} /><Route path="/booking/confirmation/:reference" element={<Confirmation />} /><Route path="/my-booking" element={<Lookup />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /><Route path="/login" element={<Login onRoleChange={onRoleChange} />} /><Route path="/register" element={<Login onRoleChange={onRoleChange} />} /></Routes><Footer /></div>;
}

function Home() {
  const navigate = useNavigate();
  return <main>
    <section className="hero">
      <div className="hero-image" />
      <div className="hero-content">
        <p className="eyebrow light">A considered stay in the heart of Jos</p>
        <h1>Arrive as you are.<br /><em>Stay beautifully.</em></h1>
        <p className="hero-copy">A quietly confident hotel shaped by local warmth, thoughtful design, and the unhurried pleasure of being well looked after.</p>
        <button className="button button-gold" onClick={() => navigate('/book')}>Reserve Your Stay <ArrowRight size={16} /></button>
      </div>
      <div className="hero-stamp"><Sparkles size={17} /><span>Luxury<br />Comfort<br />Hospitality</span></div>
    </section>
    <BookingSearch />
    <section className="intro section">
      <div>
        <p className="eyebrow">Welcome to Deutchezz</p>
        <h2>A more thoughtful<br /><em>kind of hotel.</em></h2>
      </div>
      <div className="intro-copy">
        <p>From the first welcome to the last goodbye, every moment of your stay is designed to feel effortless. Discover a quiet room, a generous breakfast, and a team who understands when to be there — and when to let you be.</p>
        <Link className="text-link" to="/about">Discover Our Story <ArrowRight size={16} /></Link>
      </div>
    </section>
    <section className="rooms-preview section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Stay your way</p>
          <h2>Rooms with room<br /><em>to breathe.</em></h2>
        </div>
        <Link className="text-link" to="/rooms">Explore All Rooms <ArrowRight size={16} /></Link>
      </div>
      <div className="room-grid">{roomTypes.slice(0, 3).map(room => <RoomCard key={room.id} room={room} />)}</div>
    </section>
    <section className="quote-section">
      <div className="quote-mark">"</div>
      <p>There is a particular ease to a hotel that understands you came to rest.</p>
      <span>— Deutchezz Hotel Ispahan</span>
    </section>
  </main>;
}

function BookingSearch() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState('1');
  return <section className="booking-bar">
    <div className="booking-intro"><CalendarDays size={20} /><span><strong>Plan your stay</strong><small>Best available rates, guaranteed</small></span></div>
    <label>CHECK IN<input type="date" defaultValue="2026-10-10" /></label>
    <label>CHECK OUT<input type="date" defaultValue="2026-10-15" /></label>
    <label>GUESTS<select defaultValue="2"><option>1 guest</option><option>2 guests</option><option>3 guests</option><option>4 guests</option></select></label>
    <label>ROOMS<select value={rooms} onChange={e => setRooms(e.target.value)}><option>1 room</option><option>2 rooms</option><option>3 rooms</option><option>4 rooms</option></select></label>
    <button className="button button-dark" onClick={() => navigate('/book')}>Check Availability <ArrowRight size={15} /></button>
  </section>;
}

function RoomCard({ room }: { room: RoomType }) {
  return <Link to={`/rooms/${room.id}`} className="room-card">
    <div className="room-image" style={{ backgroundImage: `url(${room.image})` }}>
      <span className="room-tag">From {money(room.price)} / night</span>
    </div>
    <div className="room-info">
      <div>
        <h3>{room.name}</h3>
        <p>{room.bed} · Up to {room.capacity} guests</p>
      </div>
      <ArrowRight size={18} />
    </div>
  </Link>;
}

function Rooms() {
  return <main>
    <PageHero eyebrow="The collection" title={<>Rooms that make<br /><em>staying in</em> feel good.</>} copy="Four distinctive ways to settle into the city, each with the same promise of ease, warmth, and thoughtful attention to detail." />
    <section className="section"><div className="room-grid room-grid-wide">{roomTypes.map(room => <RoomCard key={room.id} room={room} />)}</div></section>
  </main>;
}

function RoomDetail() {
  const room = roomTypes[0];
  return <main>
    <section className="detail-hero">
      <div className="detail-image" style={{ backgroundImage: `url(${room.image})` }} />
      <div className="detail-panel">
        <p className="eyebrow">{room.name}</p>
        <h1>Space to <em>unwind.</em></h1>
        <p>{room.description}</p>
        <div className="detail-meta">
          <span><BedDouble size={17} />{room.bed}</span>
          <span><Users size={17} />Up to {room.capacity} guests</span>
        </div>
        <button className="button button-gold" onClick={() => window.location.href = '/book'}>Select This Room <ArrowRight size={15} /></button>
      </div>
    </section>
    <section className="section detail-lower">
      <div>
        <p className="eyebrow">Included in your stay</p>
        <h2>Everything you need,<br /><em>nothing you don't.</em></h2>
      </div>
      <div className="amenity-grid">{room.amenities.map(a => <div key={a}><Check size={16} />{a}</div>)}</div>
    </section>
  </main>;
}

function PageHero({ eyebrow, title, copy }: { eyebrow: string; title: React.ReactNode; copy: string }) {
  return <section className="page-hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p></section>;
}

function Book() {
  const [selected, setSelected] = useState<Record<string, number>>({ deluxe: 2, executive: 1 });
  const nights = 5;
  const total = Object.entries(selected).reduce((sum, [id, qty]) => sum + (roomTypes.find(r => r.id === id)?.price || 0) * qty * nights, 0);
  return <main>
    <PageHero eyebrow="Reserve your stay" title={<>Make space for<br /><em>something good.</em></>} copy="Choose as many rooms as you need. Your reservation can include multiple room types, all under one booking reference." />
    <section className="booking-layout section">
      <div className="room-selection">
        <div className="booking-note"><CheckCircle2 size={18} /><span><strong>Flexible booking guarantee</strong><br />Pay at hotel · Free cancellation up to 48 hours before arrival</span></div>
        {roomTypes.map(room => <div className="selection-row" key={room.id}>
          <div className="selection-thumb" style={{ backgroundImage: `url(${room.image})` }} />
          <div className="selection-copy"><strong>{room.name}</strong><span>{room.bed} · {money(room.price)} / night</span></div>
          <div className="quantity">
            <button onClick={() => setSelected(s => ({ ...s, [room.id]: Math.max(0, (s[room.id] || 0) - 1) }))}>−</button>
            <b>{selected[room.id] || 0}</b>
            <button onClick={() => setSelected(s => ({ ...s, [room.id]: (s[room.id] || 0) + 1 }))}>+</button>
          </div>
        </div>)}
      </div>
      <BookingSummary selected={selected} total={total} nights={nights} />
    </section>
  </main>;
}

function BookingSummary({ selected, total, nights }: { selected: Record<string, number>; total: number; nights: number }) {
  const navigate = useNavigate();
  return <aside className="summary-card">
    <p className="eyebrow">Your reservation</p>
    <h3>Oct 10 — Oct 15, 2026</h3>
    <p className="summary-muted">{nights} nights · Jos, Nigeria</p>
    <div className="summary-lines">
      {Object.entries(selected).filter(([, qty]) => qty > 0).map(([id, qty]) => {
        const room = roomTypes.find(r => r.id === id)!;
        return <div key={id}><span>{qty} × {room.name}<small>{money(room.price)} × {qty} × {nights}</small></span><b>{money(room.price * qty * nights)}</b></div>;
      })}
    </div>
    <div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>
    <button className="button button-dark button-full" onClick={() => navigate('/booking/guest-details')}>Continue <ArrowRight size={15} /></button>
    <small className="center-note">No payment required today</small>
  </aside>;
}

function GuestDetails() {
  const navigate = useNavigate();
  return <main>
    <PageHero eyebrow="Almost there" title={<>Tell us a little<br /><em>about yourself.</em></>} copy="We'll use these details to prepare your arrival and send your confirmation." />
    <section className="form-layout section">
      <form className="form-card" onSubmit={e => { e.preventDefault(); navigate('/booking/review'); }}>
        <div className="form-grid">
          <label>First name<input required placeholder="Grace" /></label>
          <label>Last name<input required placeholder="Ibrahim" /></label>
          <label>Email address<input required type="email" placeholder="grace@example.com" /></label>
          <label>Phone number<input required placeholder="+234 XXX XXX XXXX" /></label>
        </div>
        <label>Special requests<textarea placeholder="Let us know if there's anything we can prepare for your arrival…" /></label>
        <div className="account-prompt">
          <UserRound size={20} />
          <div><strong>Want to manage your booking online?</strong><p>Create a free account to track reservations from your personal dashboard.</p></div>
          <button type="button" className="button button-outline" onClick={() => navigate('/register')}>Create Account</button>
        </div>
        <button className="button button-dark" type="submit">Review Reservation <ArrowRight size={15} /></button>
      </form>
      <BookingSummary selected={{ deluxe: 2, executive: 1 }} total={575000} nights={5} />
    </section>
  </main>;
}

function Review() {
  const navigate = useNavigate();
  return <main>
    <PageHero eyebrow="Review & confirm" title={<>One last look<br /><em>before you arrive.</em></>} copy="Your reservation is held for you. Please confirm the details below to complete your booking." />
    <section className="review-layout section">
      <div className="review-card">
        <div className="review-top"><span className="status status-green">Ready to confirm</span><span>Pay at Hotel</span></div>
        <h3>Deutchezz Hotel Ispahan</h3>
        <div className="review-details">
          <div><small>GUEST</small><strong>Grace Ibrahim</strong><span>grace@example.com</span></div>
          <div><small>STAY</small><strong>Oct 10 — Oct 15, 2026</strong><span>5 nights · 4 guests</span></div>
          <div><small>ROOMS</small><strong>2 Deluxe, 1 Executive</strong><span>Breakfast included</span></div>
        </div>
        <div className="review-total"><span>Total payable at hotel</span><strong>{money(575000)}</strong></div>
        <button className="button button-gold" onClick={() => navigate('/booking/confirmation/DHI-2026-8F42K9')}>Confirm Booking <Check size={16} /></button>
      </div>
    </section>
  </main>;
}

function Confirmation() {
  return <main>
    <section className="confirmation">
      <div className="success-icon"><Check size={28} /></div>
      <p className="eyebrow">Reservation confirmed</p>
      <h1>Your stay is<br /><em>waiting for you.</em></h1>
      <p>We've sent your confirmation to grace@example.com. Please keep this reference handy — it's your key to a seamless arrival experience.</p>
      <div className="reference">DHI-2026-8F42K9 <button onClick={() => navigator.clipboard?.writeText('DHI-2026-8F42K9')}><ClipboardList size={15} />Copy</button></div>
      <div className="confirmation-grid">
        <span><small>CHECK IN</small><b>10 Oct 2026</b></span>
        <span><small>CHECK OUT</small><b>15 Oct 2026</b></span>
        <span><small>ROOMS</small><b>2 Deluxe · 1 Executive</b></span>
        <span><small>PAYMENT</small><b>Pay at Hotel</b></span>
      </div>
      <button className="button button-dark" onClick={() => window.print()}><Download size={15} /> Download Confirmation</button>
    </section>
  </main>;
}

function Lookup() {
  const [found, setFound] = useState(false);
  return <main>
    <PageHero eyebrow="Your stay, close at hand" title={<>Find your<br /><em>booking.</em></>} copy="Enter the reference from your confirmation email along with the email address used to make the reservation." />
    <section className="lookup section">
      <div className="lookup-card">
        <label>Booking reference<input placeholder="DHI-2026-XXXXXX" /></label>
        <label>Email address<input type="email" placeholder="you@example.com" /></label>
        <button className="button button-dark button-full" onClick={() => setFound(true)}>Find My Booking <Search size={15} /></button>
        {found && <div className="found-booking"><CheckCircle2 size={18} /><div><strong>DHI-2026-8F42K9</strong><p>Grace Ibrahim · Oct 10 — Oct 15, 2026</p></div><span className="status status-green">Confirmed</span></div>}
      </div>
    </section>
  </main>;
}

function About() {
  return <main>
    <PageHero eyebrow="The hotel" title={<>A sense of place,<br /><em>beautifully held.</em></>} copy="Deutchezz Hotel Ispahan is a warm, modern retreat for experiencing Jos differently — with room to slow down, focus, and feel genuinely at home." />
    <section className="about-feature section">
      <div className="about-image" />
      <div>
        <p className="eyebrow">Our philosophy</p>
        <h2>Hospitality that<br /><em>feels human.</em></h2>
        <p>Our address on Ahmadu Bello Way places you at the pulse of the city, while our interiors offer a calm sanctuary to return to. Every room, plate, and greeting is shaped around the belief that true comfort lives in the details.</p>
        <Link className="text-link" to="/contact">Plan Your Visit <ArrowRight size={15} /></Link>
      </div>
    </section>
  </main>;
}

function Contact() {
  return <main>
    <PageHero eyebrow="Get in touch" title={<>Come find<br /><em>your way in.</em></>} copy="Questions about a stay, a private event, or a longer visit? Our concierge team would be delighted to assist." />
    <section className="contact-grid section">
      <div>
        <p className="eyebrow">Visit us</p>
        <h2>Deutchezz Hotel<br /><em>Ispahan</em></h2>
        <p>Ahmadu Bello Way<br />Jos, Plateau State<br />Nigeria</p>
        <div className="contact-line"><Phone size={17} /><span>+234 XXX XXX XXXX</span></div>
        <div className="contact-line"><span>@</span><span>info@example.com</span></div>
      </div>
      <form className="form-card">
        <label>Your name<input placeholder="Full name" /></label>
        <label>Your email<input type="email" placeholder="you@example.com" /></label>
        <label>How can we help?<textarea placeholder="Tell us about your inquiry…" /></label>
        <button className="button button-dark" type="button">Send Message <ArrowRight size={15} /></button>
      </form>
    </section>
  </main>;
}

function Login({ onRoleChange }: { onRoleChange: (role: Role) => void }) {
  return <main className="auth-page">
    <div className="auth-card">
      <Brand />
      <p className="eyebrow">Platform access</p>
      <h1>Welcome back.</h1>
      <p>Select a workspace to explore the hotel management platform.</p>
      <div className="role-buttons">
        <button onClick={() => onRoleChange('customer')}><UserRound size={18} /><span><b>Guest Dashboard</b><small>customer@demo.com</small></span><ArrowRight size={15} /></button>
        <button onClick={() => onRoleChange('receptionist')}><DoorOpen size={18} /><span><b>Front Desk Console</b><small>reception@demo.com</small></span><ArrowRight size={15} /></button>
        <button onClick={() => onRoleChange('administrator')}><ShieldCheck size={18} /><span><b>Administration Panel</b><small>admin@demo.com</small></span><ArrowRight size={15} /></button>
      </div>
      <small className="demo-note">Interactive demonstration · No credentials required</small>
    </div>
  </main>;
}

function PortalLayout({ role, mobileOpen, setMobileOpen, onRoleChange }: { role: Role; mobileOpen: boolean; setMobileOpen: (value: boolean) => void; onRoleChange: (role: Role) => void }) {
  const isAdmin = role === 'administrator';
  const isReception = role === 'receptionist';

  const nav = isAdmin
    ? [
        { label: 'Overview', icon: LayoutDashboard, to: '/admin' },
        { label: 'Reservations', icon: CalendarDays, to: '/admin/bookings' },
        { label: 'Rooms Inventory', icon: BedDouble, to: '/admin/rooms' },
        { label: 'Room Types', icon: Hotel, to: '/admin/room-types' },
        { label: 'Guest Directory', icon: Users, to: '/admin/guests' },
        { label: 'Staff Management', icon: ShieldCheck, to: '/admin/staff' },
        { label: 'Payment Ledger', icon: WalletCards, to: '/admin/payments' },
        { label: 'Reports & Analytics', icon: SlidersHorizontal, to: '/admin/reports' },
        { label: 'Activity Log', icon: ClipboardList, to: '/admin/activity' }
      ]
    : isReception
    ? [
        { label: 'Front Desk Overview', icon: LayoutDashboard, to: '/reception' },
        { label: 'All Reservations', icon: CalendarDays, to: '/reception/bookings' },
        { label: 'New Walk-In', icon: Plus, to: '/reception/bookings/new' },
        { label: 'Fast Check-In', icon: DoorOpen, to: '/reception/check-in' },
        { label: 'Guest Departure', icon: LogOut, to: '/reception/check-out' },
        { label: 'Room Status', icon: BedDouble, to: '/reception/rooms' },
        { label: 'Guests in-House', icon: Users, to: '/reception/guests' },
        { label: 'Folio Payments', icon: WalletCards, to: '/reception/payments' }
      ]
    : [
        { label: 'Dashboard Overview', icon: LayoutDashboard, to: '/dashboard' },
        { label: 'My Bookings', icon: CalendarDays, to: '/dashboard/bookings' },
        { label: 'Guest Profile', icon: UserRound, to: '/dashboard/profile' },
        { label: 'Notifications', icon: Bell, to: '/dashboard/notifications' }
      ];

  const userProfile = isAdmin
    ? { name: 'General Manager', role: 'Executive Admin', initials: 'GM' }
    : isReception
    ? { name: 'Front Desk Team', role: 'Duty Receptionist', initials: 'FD' }
    : { name: 'Grace Ibrahim', role: 'Gold Tier Member', initials: 'GI' };

  return (
    <div className="portal-shell">
      <aside className={mobileOpen ? 'sidebar mobile-visible' : 'sidebar'}>
        <div className="sidebar-top">
          <Brand inverse />
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />
          {isAdmin ? 'Management Console' : isReception ? 'Front Desk System' : 'Guest Sanctuary'}
        </div>

        <div className="sidebar-section-title">Navigation</div>
        <nav className="side-nav">
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin' || item.to === '/reception' || item.to === '/dashboard'}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user-card">
            <div className="avatar">{userProfile.initials}</div>
            <div className="sidebar-user-info">
              <strong>{userProfile.name}</strong>
              <small>{userProfile.role}</small>
            </div>
          </div>
          <button onClick={() => onRoleChange('guest')}>
            <LogOut size={16} />
            Return to Public Website
          </button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-header">
          <button className="icon-button portal-menu" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
          
          <div className="portal-header-left">
            <div>
              <span className="portal-kicker">{isAdmin ? 'Administration Suite' : isReception ? 'Front Desk Live Shift' : 'Deutchezz Guest Lounge'}</span>
              <h2>{isAdmin ? 'Hotel Executive Overview' : isReception ? "Today's Operational Console" : 'Your Stay & Reservations'}</h2>
            </div>
            <span className="portal-live-chip"><i />{isAdmin ? 'All Systems Active' : isReception ? 'Shift Online' : 'Active Reservation'}</span>
          </div>

          <div className="header-actions">
            <div className="date-pill">
              <CalendarDays size={15} />
              <span>Tue, Oct 3, 2026</span>
            </div>
            <button className="icon-button" title="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <div className="avatar" title={userProfile.name}>{userProfile.initials}</div>
            <ChevronDown size={15} />
          </div>
        </header>

        <div className="portal-content">
          <Routes>
            <Route path="/dashboard/*" element={<CustomerDashboard />} />
            <Route path="/reception/*" element={<ReceptionPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, tone = 'brown', positive = true }: { label: string; value: string; change?: string; icon: React.ElementType; tone?: string; positive?: boolean }) {
  return (
    <div className="stat-card">
      <div className="stat-top-row">
        <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
        {change && <span className={`stat-trend ${positive ? 'positive' : 'neutral'}`}>{change}</span>}
      </div>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PortalTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="portal-title">
      <div>
        <span className="portal-kicker">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action && <div className="portal-actions">{action}</div>}
    </div>
  );
}

function CustomerDashboard() {
  return (
    <section>
      {/* Luxury Guest Banner */}
      <div className="luxury-banner">
        <div className="luxury-banner-content">
          <span className="eyebrow">DEUTCHEZZ ISPAHAN CLUB · PRIVILEGED MEMBER</span>
          <h2>Welcome back, Grace.</h2>
          <p>Your upcoming retreat in Jos is confirmed for October 10. Our hospitality team is preparing your arrival with attentive care.</p>
          <div className="luxury-badge-pill">
            <Sparkles size={14} />
            <span>Gold Tier Member · 1,250 Reward Points · 1 Complimentary Night Available</span>
          </div>
        </div>
        <Link to="/book" className="button button-gold">
          <Plus size={16} />
          Reserve Another Room
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <StatCard label="Upcoming Stay" value="Oct 10" change="In 7 days" icon={CalendarDays} tone="gold" />
        <StatCard label="Total Stays" value="06" change="+2 this year" icon={ClipboardList} tone="blue" />
        <StatCard label="Nights Completed" value="14" change="All 5-Star" icon={CheckCircle2} tone="green" />
        <StatCard label="Reward Balance" value="12 Nights" change="Gold Tier" icon={Sparkles} tone="brown" />
      </div>

      {/* Luxury Stay Pass Card */}
      <div className="stay-pass-card">
        <div className="stay-pass-header">
          <div>
            <span className="portal-kicker">Next Destination</span>
            <h3>Confirmed Reservation</h3>
          </div>
          <span className="status status-green"><Check size={14} /> Ready for Arrival</span>
        </div>
        <div className="stay-pass-body">
          <div className="stay-pass-thumb" style={{ backgroundImage: `url(${roomTypes[0].image})` }} />
          <div className="stay-pass-details">
            <span className="reference" style={{ padding: '4px 10px', fontSize: '12px', marginBottom: '8px' }}>
              DHI-2026-8F42K9
            </span>
            <h4>Deutchezz Hotel Ispahan</h4>
            <p>2 Deluxe Rooms · 1 Executive Room</p>
            <div className="stay-meta-chips">
              <span className="meta-chip"><CalendarDays size={14} /> Oct 10 — Oct 15, 2026 (5 nights)</span>
              <span className="meta-chip"><Users size={14} /> 4 Guests</span>
              <span className="meta-chip"><BedDouble size={14} /> King Beds</span>
              <span className="meta-chip"><Sparkles size={14} /> Breakfast & Butler Included</span>
            </div>
          </div>
          <div className="stay-pass-aside">
            <div className="stay-pass-price">
              <small>Total Balance</small>
              <strong>{money(575000)}</strong>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Check-in: <strong>2:00 PM</strong><br />
              Wi-Fi Key: <strong>DEUTCHEZZ-VIP</strong>
            </div>
            <Link to="/booking/confirmation/DHI-2026-8F42K9" className="button button-dark button-sm">
              View Confirmation <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div className="portal-columns">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="portal-kicker">VIP Privileges</span>
              <h3>Included Stay Perks</h3>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#fcfaf6', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--navy)', display: 'block', fontSize: '14px', marginBottom: '4px' }}>🍳 Terrace Breakfast</strong>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>Complimentary artisan breakfast buffet every morning (7:00 AM – 10:30 AM).</p>
            </div>
            <div style={{ padding: '16px', background: '#fcfaf6', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <strong style={{ color: 'var(--navy)', display: 'block', fontSize: '14px', marginBottom: '4px' }}>🛎️ Concierge On-Call</strong>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>Dedicated 24/7 butler service and private airport transfer coordination.</p>
            </div>
          </div>
        </div>
        <Notifications />
      </div>

      <BookingsTable title="Booking History" customer />
    </section>
  );
}

function Notifications() {
  return (
    <div className="panel notifications">
      <div className="panel-heading">
        <div>
          <span className="portal-kicker">Communication Feed</span>
          <h3>Notifications</h3>
        </div>
        <Link className="text-link small" to="/dashboard/notifications">View All</Link>
      </div>
      {['Your October stay is confirmed and held', 'Welcome to Deutchezz Ispahan Gold Tier', 'Payment receipt generated for reservation'].map((n, i) => (
        <div className="notification" key={n}>
          <span className={`notification-icon n-${i}`}><Bell size={16} /></span>
          <div>
            <strong>{n}</strong>
            <small>{i === 0 ? 'Just now' : i === 1 ? '2 days ago' : 'Last week'}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingsTable({ title, customer = false }: { title: string; customer?: boolean }) {
  const [filter, setFilter] = useState<'All' | 'Confirmed' | 'Checked In' | 'Pending'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesFilter = filter === 'All' ? true : b.status === filter;
      const matchesSearch =
        b.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.rooms.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchTerm]);

  return (
    <div className="table-panel">
      <div className="table-panel-header">
        <div>
          <span className="portal-kicker">{customer ? 'Your Stay History' : 'Front Desk Reservations'}</span>
          <h3 style={{ margin: 0, font: "500 23px 'Playfair Display', serif", color: 'var(--navy)' }}>{title}</h3>
        </div>

        <div className="table-toolbar">
          <div className="table-tabs">
            {(['All', 'Confirmed', 'Checked In', 'Pending'] as const).map(tab => {
              const count = tab === 'All' ? bookings.length : bookings.filter(b => b.status === tab).length;
              return (
                <button
                  key={tab}
                  className={`table-tab ${filter === tab ? 'active' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                  <span className="table-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="table-search">
            <Search size={16} />
            <input
              placeholder="Search reference, guest..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Guest Name</th>
              <th>Stay Dates</th>
              <th>Rooms Booked</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  No reservations matching your filter.
                </td>
              </tr>
            ) : (
              filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <strong style={{ fontFamily: 'monospace', letterSpacing: '.05em', color: 'var(--navy)' }}>
                      {booking.id}
                    </strong>
                  </td>
                  <td>
                    <div className="td-guest">
                      <div className="guest-avatar">
                        {booking.guest.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="guest-info">
                        <strong>{booking.guest}</strong>
                        <small>{booking.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500, color: 'var(--navy)' }}>{booking.dates}</span>
                      <small style={{ color: 'var(--muted)', fontSize: '11px' }}>{booking.guests} Guests</small>
                    </div>
                  </td>
                  <td>
                    <span className="meta-chip" style={{ fontSize: '12px' }}>
                      <BedDouble size={13} /> {booking.rooms}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--navy)', fontSize: '14.5px' }}>
                      {money(booking.total)}
                    </strong>
                  </td>
                  <td>
                    <span
                      className={`payment-badge ${
                        booking.payment === 'Paid'
                          ? 'payment-paid'
                          : booking.payment === 'Partially Paid'
                          ? 'payment-partial'
                          : 'payment-pending'
                      }`}
                    >
                      {booking.payment}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status ${
                        booking.status === 'Checked In'
                          ? 'status-blue'
                          : booking.status === 'Pending'
                          ? 'status-amber'
                          : 'status-green'
                      }`}
                    >
                      {booking.status === 'Checked In' && <DoorOpen size={13} />}
                      {booking.status === 'Confirmed' && <Check size={13} />}
                      {booking.status === 'Pending' && <Clock3 size={13} />}
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <button className="row-action" title="View details">
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> total bookings</span>
        <button className="text-link small" onClick={() => window.print()}><Download size={13} /> Export view</button>
      </div>
    </div>
  );
}

function ReceptionPage() {
  const location = useLocation();
  const sub = location.pathname.split('/')[2];

  if (sub === 'bookings' || sub === 'bookings/new') return <ReceptionBookings newBooking={sub === 'bookings/new'} />;
  if (sub === 'check-in') return <Workflow title="Check-in Guest" eyebrow="Arrival Desk" action="Confirm Check-in" icon={DoorOpen} />;
  if (sub === 'check-out') return <Workflow title="Complete Check-out" eyebrow="Departure Desk" action="Complete Check-out" icon={LogOut} />;

  return (
    <section>
      <PortalTitle
        eyebrow="Front Desk Live Operations"
        title="Today's Operational Console"
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/reception/bookings/new" className="button button-dark">
              <Plus size={16} /> New Walk-In
            </Link>
            <Link to="/reception/check-in" className="button button-gold">
              <DoorOpen size={16} /> Fast Check-In
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="stat-grid">
        <StatCard label="Today's Arrivals" value="08" change="3 Pending" icon={DoorOpen} tone="gold" />
        <StatCard label="Today's Departures" value="05" change="1 Balance Due" icon={LogOut} tone="brown" />
        <StatCard label="Currently In-House" value="17" change="85% Occupancy" icon={Users} tone="green" />
        <StatCard label="Available Rooms" value="08 / 20" change="Clean & Ready" icon={BedDouble} tone="blue" />
      </div>

      <div className="portal-columns">
        {/* Arrivals Deck */}
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="portal-kicker">Arrivals Queue</span>
              <h3>Expected Check-Ins Today</h3>
            </div>
            <Link className="text-link small" to="/reception/check-in">Manage All</Link>
          </div>
          <div className="arrivals-list">
            {bookings.slice(0, 3).map((b, i) => (
              <div className="arrival-card" key={b.id}>
                <div className="arrival-time-badge">
                  {i === 0 ? '09:30' : i === 1 ? '11:00' : '14:30'}
                  <small>AM</small>
                </div>
                <div className="guest-avatar">
                  {b.guest.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="arrival-info">
                  <strong>{b.guest}</strong>
                  <span>{b.rooms} · Assigned Room {201 + i}</span>
                </div>
                <span className={`payment-badge ${b.payment === 'Paid' ? 'payment-paid' : 'payment-pending'}`}>
                  {b.payment}
                </span>
                <Link to="/reception/check-in" className="button button-outline button-sm">
                  <Check size={14} /> Check In
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Room Matrix Status */}
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="portal-kicker">Live Inventory</span>
              <h3>Room Status Matrix</h3>
            </div>
            <Link className="text-link small" to="/reception/rooms">Full View</Link>
          </div>
          <div className="room-matrix-grid">
            <div className="room-matrix-cell status-avail"><strong>101</strong><small>Deluxe · Clean</small></div>
            <div className="room-matrix-cell status-occ"><strong>102</strong><small>Deluxe · Occ</small></div>
            <div className="room-matrix-cell status-avail"><strong>103</strong><small>Standard · Clean</small></div>
            <div className="room-matrix-cell status-occ"><strong>104</strong><small>Standard · Occ</small></div>
            <div className="room-matrix-cell status-res"><strong>201</strong><small>Exec · Res</small></div>
            <div className="room-matrix-cell status-occ"><strong>202</strong><small>Exec · Occ</small></div>
            <div className="room-matrix-cell status-avail"><strong>203</strong><small>Suite · Clean</small></div>
            <div className="room-matrix-cell status-maint"><strong>204</strong><small>Suite · Maint</small></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', fontSize: '11px', color: 'var(--muted)' }}>
            <span><i className="dot green-dot" /> Available (8)</span>
            <span><i className="dot blue-dot" /> Occupied (9)</span>
            <span><i className="dot amber-dot" /> Reserved (2)</span>
            <span><i className="dot gray-dot" /> Maint (1)</span>
          </div>
        </div>
      </div>

      <BookingsTable title="Today's Reservations" />
    </section>
  );
}

function ReceptionBookings({ newBooking }: { newBooking: boolean }) {
  if (newBooking) return <Workflow title="Create New Walk-In" eyebrow="Walk-in Reservation" action="Confirm Reservation" icon={Plus} />;
  return (
    <section>
      <PortalTitle
        eyebrow="Front Desk Directory"
        title="Reservations Management"
        action={
          <Link to="/reception/bookings/new" className="button button-dark">
            <Plus size={16} /> New Booking
          </Link>
        }
      />
      <BookingsTable title="All Active Bookings" />
    </section>
  );
}

function Workflow({ title, eyebrow, action, icon: Icon }: { title: string; eyebrow: string; action: string; icon: React.ElementType }) {
  const [done, setDone] = useState(false);
  return (
    <section>
      <PortalTitle eyebrow={eyebrow} title={title} />
      <div className="workflow-layout">
        <div className="workflow-search">
          <Search size={19} />
          <input placeholder="Search by booking reference, guest name, or phone number…" />
        </div>
        <div className="workflow-card">
          {done ? (
            <div className="workflow-success">
              <CheckCircle2 size={40} />
              <h2>Transaction Complete</h2>
              <p>The reservation records have been updated and synchronized with the front desk ledger.</p>
              <button className="button button-dark" onClick={() => setDone(false)}>Process Another Guest</button>
            </div>
          ) : (
            <>
              <div className="workflow-head">
                <div className="arrival-avatar large">GI</div>
                <div>
                  <span className="portal-kicker">DHI-2026-8F42K9</span>
                  <h3>Grace Ibrahim</h3>
                  <p>grace@example.com · +234 803 123 4567</p>
                </div>
                <span className="status status-green"><Check size={14} /> Confirmed</span>
              </div>
              <div className="workflow-details">
                <div><small>STAY DATES</small><strong>Oct 10 — Oct 15, 2026 (5 nights)</strong></div>
                <div><small>ROOM ALLOCATION</small><strong>2 Deluxe · 1 Executive</strong></div>
                <div><small>AMOUNT DUE AT CHECK-IN</small><strong>{money(575000)}</strong></div>
                <div><small>PAYMENT METHOD</small><strong>Pay at Hotel · POS / Cash / Transfer</strong></div>
              </div>
              <button className="button button-gold" onClick={() => setDone(true)}>
                <Icon size={16} /> {action}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminPage() {
  const location = useLocation();
  const sub = location.pathname.split('/')[2];

  if (sub === 'rooms' || sub === 'room-types') return <AdminRooms typePage={sub === 'room-types'} />;
  if (sub === 'bookings') return (
    <section>
      <PortalTitle
        eyebrow="Operations"
        title="All Reservations"
        action={
          <button className="button button-dark" onClick={() => window.print()}>
            <Download size={15} /> Export Ledger
          </button>
        }
      />
      <BookingsTable title="Reservation Management" />
    </section>
  );
  if (sub && ['guests', 'staff', 'payments', 'reports', 'activity', 'notifications', 'settings'].includes(sub)) {
    return <AdminGeneric type={sub} />;
  }
  return <AdminOverview />;
}

function AdminOverview() {
  return (
    <section>
      <PortalTitle
        eyebrow="Executive Hotel Management"
        title="Executive Performance Overview"
        action={
          <button className="button button-dark" onClick={() => window.print()}>
            <Download size={15} /> Export Monthly Report
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="stat-grid">
        <StatCard label="Total Rooms" value="20" change="+2 this quarter" icon={BedDouble} tone="brown" />
        <StatCard label="Occupancy Rate" value="62%" change="+8.4% vs last month" icon={Building2} tone="gold" />
        <StatCard label="Active Bookings" value="34" change="+5 this week" icon={CalendarDays} tone="green" />
        <StatCard label="Monthly Revenue" value="₦4.85M" change="+12.6% vs Sept" icon={CircleDollarSign} tone="blue" />
      </div>

      {/* Analytics Chart & Occupancy */}
      <div className="analytics-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="portal-kicker">Revenue & Occupancy Metrics</span>
              <h3>Performance Trajectory</h3>
            </div>
            <select defaultValue="30">
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Year to Date</option>
            </select>
          </div>

          <div className="analytics-metrics-bar">
            <div className="metric-box">
              <small>Gross Revenue</small>
              <strong>₦4,850,000</strong>
            </div>
            <div className="metric-box">
              <small>Avg Daily Rate (ADR)</small>
              <strong>₦38,500</strong>
            </div>
            <div className="metric-box">
              <small>RevPAR</small>
              <strong>₦23,870</strong>
            </div>
            <div className="metric-box">
              <small>Avg Stay Duration</small>
              <strong>3.8 Nights</strong>
            </div>
          </div>

          <div className="chart">
            <div className="chart-y">
              <span>₦5.0m</span>
              <span>₦3.5m</span>
              <span>₦2.0m</span>
              <span>₦1.0m</span>
              <span>₦0</span>
            </div>
            <div className="chart-area">
              <div className="grid-lines" />
              <svg viewBox="0 0 600 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c49a3c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#c49a3c" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,180 C50,165 68,170 100,125 S160,150 190,105 S235,116 270,88 S315,130 350,78 S405,90 440,60 S495,74 530,38 S570,54 600,28 L600,220 L0,220 Z"
                  fill="url(#goldGrad)"
                />
                <path
                  d="M0,180 C50,165 68,170 100,125 S160,150 190,105 S235,116 270,88 S315,130 350,78 S405,90 440,60 S495,74 530,38 S570,54 600,28"
                  fill="none"
                  stroke="#c49a3c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="chart-x">
                <span>Sep 1</span>
                <span>Sep 8</span>
                <span>Sep 15</span>
                <span>Sep 22</span>
                <span>Sep 29</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel occupancy-panel">
          <div className="panel-heading">
            <div>
              <span className="portal-kicker">Live Inventory Health</span>
              <h3>Room Occupancy</h3>
            </div>
          </div>
          <div className="big-number">62<span>%</span></div>
          <div className="progress">
            <span style={{ width: '62%' }} />
          </div>
          <div className="occupancy-legend">
            <span><i className="dot blue-dot" /> Occupied Rooms <b>09</b></span>
            <span><i className="dot green-dot" /> Available / Ready <b>08</b></span>
            <span><i className="dot amber-dot" /> Reserved for Arrival <b>02</b></span>
            <span><i className="dot gray-dot" /> Out of Order / Maint <b>01</b></span>
          </div>
        </div>
      </div>

      <BookingsTable title="Latest Reservations Ledger" />

      {/* Operational Stream */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <div className="panel-heading">
          <div>
            <span className="portal-kicker">Audit Trail</span>
            <h3>Live Operational Stream</h3>
          </div>
          <button className="text-link small">View Audit Log</button>
        </div>
        <div className="activity-list">
          {[
            { text: 'Reception desk checked in David Musa (Room 202 - Executive)', time: '10:32 AM', icon: DoorOpen },
            { text: 'Admin added Room 211 (Deluxe) to live inventory', time: '09:47 AM', icon: Plus },
            { text: 'Payment of ₦110,000 received for DHI-2026-7D19PL via Card POS', time: '09:30 AM', icon: CreditCard },
            { text: 'Housekeeping marked Room 101 as Clean & Available', time: '08:55 AM', icon: CheckCircle2 }
          ].map((act, i) => {
            const Icon = act.icon;
            return (
              <div key={i}>
                <span className="activity-time-chip">{act.time}</span>
                <div className="activity-icon-pill"><Icon size={16} /></div>
                <div>
                  <strong>{act.text}</strong>
                  <small>Today · Deutchezz Operational System</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AdminRooms({ typePage }: { typePage: boolean }) {
  const [showAdd, setShowAdd] = useState(false);
  const data = typePage ? roomTypes : Array.from({ length: 10 }, (_, i) => ({ ...roomTypes[i % 3], name: `Room ${101 + i}` }));

  return (
    <section>
      <PortalTitle
        eyebrow="Inventory Management"
        title={typePage ? 'Room Types Configuration' : 'Room Inventory'}
        action={
          <button className="button button-dark" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} /> {typePage ? 'Add Room Type' : 'Add Room'}
          </button>
        }
      />

      {showAdd && (
        <div className="inline-form panel">
          <div>
            <span className="portal-kicker">New Inventory Unit</span>
            <h3>{typePage ? 'Configure New Room Type' : 'Register New Room'}</h3>
          </div>
          <div className="form-grid">
            <label>{typePage ? 'Room Type Name' : 'Room Number'}<input placeholder={typePage ? 'Presidential Penthouse' : '301'} /></label>
            <label>Rate Per Night<input placeholder="₦65,000" /></label>
            <label>Maximum Guests<select><option>2 guests</option><option>3 guests</option><option>4 guests</option></select></label>
          </div>
          <button className="button button-gold" onClick={() => setShowAdd(false)}>
            <Check size={16} /> Save {typePage ? 'Room Type' : 'Room'}
          </button>
        </div>
      )}

      <div className="table-panel">
        <div className="table-panel-header">
          <div>
            <span className="portal-kicker">Live Inventory</span>
            <h3>{typePage ? 'Active Room Categories' : 'All Rooms · 20 Total'}</h3>
          </div>
          <div className="table-search">
            <Search size={16} />
            <input placeholder="Search rooms..." />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{typePage ? 'Room Type' : 'Room Unit'}</th>
                <th>{typePage ? 'Capacity & Bed' : 'Category'}</th>
                <th>Price / Night</th>
                <th>{typePage ? 'Included Amenities' : 'Current Status'}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={`${r.id}-${i}`}>
                  <td>
                    <div className="room-table-name">
                      <div className="mini-room" style={{ backgroundImage: `url(${r.image})` }} />
                      <strong style={{ fontSize: '14.5px', color: 'var(--navy)' }}>{r.name}</strong>
                    </div>
                  </td>
                  <td>{typePage ? `${r.capacity} Guests · ${r.bed}` : ['Deluxe', 'Executive', 'Standard'][i % 3]}</td>
                  <td><strong style={{ color: 'var(--navy)' }}>{money(r.price)}</strong></td>
                  <td>
                    {typePage ? (
                      <span className="muted">{r.amenities.slice(0, 3).join(' · ')}</span>
                    ) : (
                      <span className={`status ${i % 4 === 0 ? 'status-amber' : i % 3 === 0 ? 'status-blue' : 'status-green'}`}>
                        {i % 4 === 0 ? 'Reserved' : i % 3 === 0 ? 'Occupied' : 'Available'}
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="row-action" title="Options">
                      <MoreHorizontal size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AdminGeneric({ type }: { type: string }) {
  const labels: Record<string, [string, string]> = {
    guests: ['Guest Directory', 'Comprehensive guest profiles, loyalty tiers, preferences, and booking history'],
    staff: ['Staff & Team Management', 'Oversee team access credentials, shift assignments, and operational permissions'],
    payments: ['Payment Ledger & Folios', 'Consolidated ledger of POS, cash, bank transfer, and room charge settlements'],
    reports: ['Executive Analytics & Reports', 'Key hotel metrics including ADR, RevPAR, channel distribution, and occupancy trends'],
    activity: ['System Audit Log', 'Real-time transparent audit log of all front desk and management events'],
    notifications: ['Team Notification Centre', 'Direct communication broadcast for shift handovers and urgent requests'],
    settings: ['Platform Settings', 'Configure hotel policies, check-in timings, tax rates, and billing preferences']
  };
  const [title, copy] = labels[type] || ['Administration', 'Manage hotel operations'];

  return (
    <section>
      <PortalTitle
        eyebrow="Administration Suite"
        title={title}
        action={
          type === 'reports' ? (
            <button className="button button-dark" onClick={() => window.print()}>
              <Download size={15} /> Export Audit Report
            </button>
          ) : undefined
        }
      />
      <div className="empty-state panel">
        <div className="empty-icon"><Settings size={26} /></div>
        <h2>{copy}</h2>
        <p>This workspace is active for your management team. Review, analyze, and manage your property operations from this unified console.</p>
        <button className="button button-gold">
          Open {title} <ArrowRight size={15} />
        </button>
      </div>
      {type === 'activity' && (
        <div className="panel activity-list" style={{ marginTop: '24px' }}>
          {[
            'Reception desk checked in David Musa (Room 202 - Executive)',
            'Administrator added Room 211 (Deluxe) to live inventory',
            'Payment of ₦110,000 received for DHI-2026-7D19PL via Card POS',
            'Housekeeping marked Room 101 as Clean & Available'
          ].map((text, i) => (
            <div key={text}>
              <span className="activity-time-chip">{['10:32 AM', '09:47 AM', '09:30 AM', '08:55 AM'][i]}</span>
              <div className="activity-icon-pill"><CheckCircle2 size={16} /></div>
              <div>
                <strong>{text}</strong>
                <small>Today · Deutchezz Operational System</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Footer() {
  return <footer>
    <div><Brand /><p>A considered stay in the heart of Jos.</p></div>
    <div><span>Explore</span><Link to="/rooms">Rooms</Link><Link to="/about">The Hotel</Link><Link to="/contact">Contact</Link></div>
    <div><span>Find Us</span><p>Ahmadu Bello Way<br />Jos, Plateau State<br />Nigeria</p></div>
    <div><span>Reservations</span><p>+234 XXX XXX XXXX<br />info@example.com</p></div>
    <div className="footer-bottom">© 2026 Deutchezz Hotel Ispahan <span>Luxury · Comfort · Hospitality</span></div>
  </footer>;
}

export default App;
