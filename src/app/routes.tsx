import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RequireAuth, withSuspense } from './guards';
import { PublicShell } from './shells';
import { CustomerLayout, ReceptionLayout, AdminLayout } from '@/layouts/console-layout';

const Home = withSuspense(lazy(() => import('@/pages/home')));
const Rooms = withSuspense(lazy(() => import('@/pages/rooms')));
const RoomDetail = withSuspense(lazy(() => import('@/pages/room-detail')));
const Book = withSuspense(lazy(() => import('@/pages/book')));
const GuestDetails = withSuspense(lazy(() => import('@/pages/guest-details')));
const Review = withSuspense(lazy(() => import('@/pages/review')));
const Confirmation = withSuspense(lazy(() => import('@/pages/confirmation')));
const Lookup = withSuspense(lazy(() => import('@/pages/lookup')));
const About = withSuspense(lazy(() => import('@/pages/about')));
const Contact = withSuspense(lazy(() => import('@/pages/contact')));
const Login = withSuspense(lazy(() => import('@/pages/login')));
const Register = withSuspense(lazy(() => import('@/pages/register')));
const ForgotPassword = withSuspense(lazy(() => import('@/pages/forgot-password')));
const ResetPassword = withSuspense(lazy(() => import('@/pages/reset-password')));
const VerifyEmail = withSuspense(lazy(() => import('@/pages/verify-email')));
const Forbidden = withSuspense(lazy(() => import('@/pages/forbidden')));
const NotFound = withSuspense(lazy(() => import('@/pages/not-found')));

const CustomerDashboard = withSuspense(lazy(() => import('@/pages/customer/dashboard')));
const CustomerBookings = withSuspense(lazy(() => import('@/pages/customer/bookings')));
const CustomerBookingDetail = withSuspense(lazy(() => import('@/pages/customer/booking-detail')));
const CustomerProfile = withSuspense(lazy(() => import('@/pages/customer/profile')));

const ReceptionDashboard = withSuspense(lazy(() => import('@/pages/reception/dashboard')));
const ReceptionBookings = withSuspense(lazy(() => import('@/pages/reception/bookings')));
const ReceptionCreateBooking = withSuspense(lazy(() => import('@/pages/reception/create-booking')));
const ReceptionBookingDetail = withSuspense(lazy(() => import('@/pages/reception/booking-detail')));
const ReceptionRooms = withSuspense(lazy(() => import('@/pages/reception/rooms')));
const ReceptionGuests = withSuspense(lazy(() => import('@/pages/reception/guests')));
const ReceptionPayments = withSuspense(lazy(() => import('@/pages/reception/payments')));

const AdminDashboard = withSuspense(lazy(() => import('@/pages/admin/dashboard')));
const AdminRooms = withSuspense(lazy(() => import('@/pages/admin/rooms')));
const AdminRoomTypes = withSuspense(lazy(() => import('@/pages/admin/room-types')));
const AdminBookings = withSuspense(lazy(() => import('@/pages/admin/bookings')));
const AdminBookingDetail = withSuspense(lazy(() => import('@/pages/admin/booking-detail')));
const AdminGuests = withSuspense(lazy(() => import('@/pages/admin/guests')));
const AdminUsers = withSuspense(lazy(() => import('@/pages/admin/users')));
const AdminStaff = withSuspense(lazy(() => import('@/pages/admin/staff')));
const AdminPayments = withSuspense(lazy(() => import('@/pages/admin/payments')));
const AdminReports = withSuspense(lazy(() => import('@/pages/admin/reports')));
const AdminActivity = withSuspense(lazy(() => import('@/pages/admin/activity')));
const AdminNotifications = withSuspense(lazy(() => import('@/pages/admin/notifications')));
const AdminSettings = withSuspense(lazy(() => import('@/pages/admin/settings')));
const MyProfile = withSuspense(lazy(() => import('@/pages/shared/my-profile')));

export const appRoutes: RouteObject[] = [
  {
    element: <PublicShell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/rooms', element: <Rooms /> },
      { path: '/rooms/:id', element: <RoomDetail /> },
      { path: '/book', element: <Book /> },
      { path: '/booking/guest-details', element: <GuestDetails /> },
      { path: '/booking/review', element: <Review /> },
      { path: '/booking/confirmation/:bookingReference', element: <Confirmation /> },
      { path: '/my-booking', element: <Lookup /> },
      { path: '/about', element: <About /> },
      { path: '/contact', element: <Contact /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/verify-email', element: <VerifyEmail /> },
      { path: '/forbidden', element: <Forbidden /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <RequireAuth allowedRoles={['Customer']} />,
    children: [
      {
        element: <CustomerLayout />,
        children: [
          { path: '/dashboard', element: <CustomerDashboard /> },
          { path: '/dashboard/bookings', element: <CustomerBookings /> },
          { path: '/dashboard/bookings/:id', element: <CustomerBookingDetail /> },
          { path: '/dashboard/profile', element: <CustomerProfile /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth allowedRoles={['Receptionist', 'Administrator']} />,
    children: [
      {
        element: <ReceptionLayout />,
        children: [
          { path: '/reception', element: <ReceptionDashboard /> },
          { path: '/reception/bookings', element: <ReceptionBookings /> },
          { path: '/reception/bookings/new', element: <ReceptionCreateBooking /> },
          { path: '/reception/bookings/:id', element: <ReceptionBookingDetail /> },
          { path: '/reception/rooms', element: <ReceptionRooms /> },
          { path: '/reception/guests', element: <ReceptionGuests /> },
          { path: '/reception/payments', element: <ReceptionPayments /> },
          { path: '/reception/profile', element: <MyProfile /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth allowedRoles={['Administrator']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/rooms', element: <AdminRooms /> },
          { path: '/admin/room-types', element: <AdminRoomTypes /> },
          { path: '/admin/bookings', element: <AdminBookings /> },
          { path: '/admin/bookings/new', element: <ReceptionCreateBooking /> },
          { path: '/admin/bookings/:id', element: <AdminBookingDetail /> },
          { path: '/admin/guests', element: <AdminGuests /> },
          { path: '/admin/users', element: <AdminUsers /> },
          { path: '/admin/staff', element: <AdminStaff /> },
          { path: '/admin/payments', element: <AdminPayments /> },
          { path: '/admin/reports', element: <AdminReports /> },
          { path: '/admin/activity', element: <AdminActivity /> },
          { path: '/admin/notifications', element: <AdminNotifications /> },
          { path: '/admin/settings', element: <AdminSettings /> },
          { path: '/admin/profile', element: <MyProfile /> },
        ],
      },
    ],
  },
];
