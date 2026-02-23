import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ShoppingCart, ArrowLeftRight,
  Users, ClipboardList, Settings, LogOut, Shield, ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
  { to: '/assignments', label: 'Assignments & Expenditures', icon: Users, roles: ['ADMIN', 'BASE_COMMANDER'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList, roles: ['ADMIN'] },
  { to: '/admin', label: 'Administration', icon: Settings, roles: ['ADMIN'] },
];

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-900 text-red-300 border-red-800',
  BASE_COMMANDER: 'bg-military-900 text-military-300 border-military-800',
  LOGISTICS_OFFICER: 'bg-olive-900 text-olive-300 border-olive-800',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  BASE_COMMANDER: 'Commander',
  LOGISTICS_OFFICER: 'Logistics',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allowedNav = navItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-30">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-military-700 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-military-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">MAMS</p>
              <p className="text-xs text-gray-500 leading-tight">Asset Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {allowedNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-military-800 text-military-300 border border-military-700'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-military-400' : ''}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-military-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 mb-2">
            <div className="w-8 h-8 bg-military-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-military-200">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.base?.name || 'All Bases'}</p>
            </div>
          </div>
          <div className="mb-2">
            <span className={`badge border text-xs w-full justify-center ${roleColors[user?.role || 'LOGISTICS_OFFICER']}`}>
              {roleLabels[user?.role || 'LOGISTICS_OFFICER']}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 
                       hover:bg-red-950 rounded-lg transition-all duration-200 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
