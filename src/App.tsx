import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        if (window.electron && window.electron.onNavigate) {
            window.electron.onNavigate((path: string) => {
                navigate(path);
            });
        }
    }, [navigate]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#f5f5f7] font-sans text-slate-900">
            <Sidebar />
            <div className="flex-1 overflow-auto relative">
                <Outlet />
            </div>
        </div>
    );
}

export default App;
