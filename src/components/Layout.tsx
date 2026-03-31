import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#0F172A] transition-colors duration-300">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
