import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings as SettingsIcon, FileText, FolderOpen, Layout } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/invoices', icon: FolderOpen, label: 'Documents' },
        { path: '/clients', icon: Users, label: 'Clients' },
        { path: '/templates', icon: Layout, label: 'Templates' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
        <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl z-20 transition-all duration-300">
            {/* Logo Section */}
            <div className="p-6">
                <div className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                        <FileText size={18} className="text-white" />
                    </div>
                    <span className="tracking-tight text-white font-display">Quotevoice</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1.5 mt-4">
                <p className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Main Menu</p>

                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium group",
                            isActive(item.path)
                                ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/20"
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                        )}
                    >
                        <item.icon
                            size={20}
                            className={clsx(
                                "transition-colors",
                                isActive(item.path) ? "text-white" : "text-slate-500 group-hover:text-white"
                            )}
                        />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-800/50 m-2">
                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-2.5 rounded-xl transition-all group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-md ring-2 ring-slate-900 group-hover:ring-slate-700 transition-all">
                        A
                    </div>
                    <div className="overflow-hidden">
                        <div className="font-medium text-white truncate text-sm">Admin User</div>
                        <div className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">admin@quotevoice.com</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
