import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { AuthProvider } from './admin/AuthContext';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/AdminLogin';
import Dashboard from './admin/Dashboard';
import Bookings from './admin/Bookings';
import Schedule from './admin/Schedule';
import Vehicles from './admin/Vehicles';
import Trips from './admin/Trips';
import Feedback from './admin/Feedback';
import Packages from './admin/Packages';
import NewBooking from './admin/NewBooking';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="booking" element={<Booking />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="admin" element={<AuthProvider />}>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings/new" element={<NewBooking />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="trips" element={<Trips />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="packages" element={<Packages />} />
        </Route>
      </Route>
    </Routes>
  );
}
