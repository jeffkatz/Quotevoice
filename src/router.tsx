import { createHashRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './features/dashboard/components/Dashboard';
import InvoiceList from './features/invoices/components/InvoiceList';
import InvoiceEditor from './features/invoices/components/InvoiceEditor';
import InvoiceView from './features/invoices/components/InvoiceView';
import Clients from './features/clients/components/Clients';
import Settings from './features/settings/components/Settings';

export const router = createHashRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { path: "/", element: <Dashboard /> },
            { path: "/invoices", element: <InvoiceList /> },
            { path: "/invoices/new", element: <InvoiceEditor /> },
            { path: "/invoices/:id", element: <InvoiceView /> },
            { path: "/invoices/edit/:id", element: <InvoiceEditor /> },
            { path: "/clients", element: <Clients /> },
            { path: "/settings", element: <Settings /> },
        ]
    }
]);
