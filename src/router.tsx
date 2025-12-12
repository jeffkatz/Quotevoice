import { createHashRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceEditor from './components/InvoiceEditor';
import InvoiceView from './components/InvoiceView';
import Clients from './components/Clients';
import Settings from './components/Settings';
import Templates from './components/Templates';
import TemplateEditor from './components/TemplateEditor';
import TemplatePicker from './components/TemplatePicker';

export const router = createHashRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { path: "/", element: <Dashboard /> },
            { path: "/invoices", element: <InvoiceList /> },
            { path: "/create", element: <TemplatePicker /> },
            { path: "/invoices/new", element: <InvoiceEditor /> },
            { path: "/invoices/:id", element: <InvoiceView /> },
            { path: "/invoices/edit/:id", element: <InvoiceEditor /> },
            { path: "/clients", element: <Clients /> },
            { path: "/templates", element: <Templates /> },
            { path: "/templates/:id", element: <TemplateEditor /> },
            { path: "/settings", element: <Settings /> },
        ]
    }
]);
