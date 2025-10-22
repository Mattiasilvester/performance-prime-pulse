import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  FileText,
  LogOut
} from 'lucide-react';
import { useAdminAuthBypass } from '@/hooks/useAdminAuthBypass';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, admin } = useAdminAuthBypass();

  const handleLogout = async () => {
    await logout();
    navigate('/nexus-prime-control');
  };

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/nexus-prime-control/dashboard' 
    },
    { 
      icon: Users, 
      label: 'Utenti', 
      path: '/nexus-prime-control/users'
    },
    { 
      icon: BarChart3, 
      label: 'Analytics', 
      path: '/nexus-prime-control/analytics' 
    },
    { 
      icon: Settings, 
      label: 'Sistema', 
      path: '/nexus-prime-control/system' 
    },
    { 
      icon: FileText, 
      label: 'Audit Logs', 
      path: '/nexus-prime-control/audit-logs' 
    },
  ];

  useEffect(() => {
    // Fix scroll e overflow
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="min-h-screen w-screen flex bg-gray-900">
      {/* Sidebar Fixed */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col min-h-screen">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white">Nexus Control</h1>
          <p className="text-gray-400 text-sm mt-1">Benvenuto, Super Admin</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  isActive 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer con User Info */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium truncate">Super Admin</p>
              <p className="text-gray-400 text-sm truncate">
                {admin?.email || 'Super Admin'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}