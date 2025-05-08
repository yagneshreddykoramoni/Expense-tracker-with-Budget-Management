import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar/Sidebar';
import { useSidebar } from './sidebar/SidebarContext';

const Layout = () => {
  const { isOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
        </main>
    </div>
  );
};

export default Layout;
