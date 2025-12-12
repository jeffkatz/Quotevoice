import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings as SettingsIcon, FileText, FolderOpen, Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/invoices', icon: FolderOpen, label: 'Invoices' },
        { path: '/clients', icon: Users, label: 'Clients' },
        { path: '/templates', icon: Layout, label: 'Templates' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
        <div
            className={clsx(
                "bg-white/80 backdrop-blur-2xl border-r border-slate-200/60 min-h-screen flex flex-col z-20 transition-all duration-300 relative",
                isCollapsed ? "w-[80px]" : "w-[280px]"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-12 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-400 hover:text-slate-600 z-50"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo Section */}
            <div className={clsx("p-8 pt-10 pb-6 transition-all", isCollapsed ? "px-4 flex justify-center" : "")}>
                <div className="text-xl font-bold flex items-center gap-3 text-slate-900">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
                        <FileText size={16} className="text-white" />
                    </div>
                    {!isCollapsed && <span className="tracking-tight font-display whitespace-nowrap overflow-hidden transition-all duration-300">Quotevoice</span>}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {!isCollapsed && <p className="px-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-4 whitespace-nowrap overflow-hidden">Menu</p>}

                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium group text-[14px]",
                                active
                                    ? "bg-slate-100/80 text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon
                                size={20}
                                className={clsx(
                                    "transition-colors duration-200 shrink-0",
                                    active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
                                )}
                            />
                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className={clsx("p-4 border-t border-slate-100 m-4", isCollapsed ? "mx-2 px-0" : "")}>
                <div className={clsx("flex items-center gap-3 p-2 rounded-xl transition-all", isCollapsed && "justify-center")}>
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                        A
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap">
                            <div className="font-semibold text-slate-900 truncate text-sm">Admin</div>
                            <div className="text-xs text-slate-400 truncate">admin@quotevoice.com</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
