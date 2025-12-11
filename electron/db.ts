import path from 'path';
import fs from 'fs';
import { app, dialog } from 'electron';

// Paths
const getDataPath = () => process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../data.json')
    : path.join(app.getPath('userData'), 'data.json');

const getLogoDir = () => process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../assets')
    : path.join(app.getPath('userData'), 'assets');

// Types
type Client = {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    created_at: string;
};

type InvoiceItem = {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
};

type Invoice = {
    id: number;
    invoice_number: string;
    client_id: number;
    type: 'invoice' | 'quotation';
    status: 'draft' | 'sent' | 'paid' | 'void';
    issue_date: string;
    due_date?: string;
    notes?: string;
    subtotal: number;
    tax_rate: number;
    tax_total: number;
    grand_total: number;
    items: InvoiceItem[];
    created_at: string;
};

type Settings = {
    company_name: string;
    company_email: string;
    company_address: string;
    company_phone: string;
    tax_rate: number;
    currency_symbol: string;
    bank_details: string;
    logo_path: string;
    invoice_prefix: string;
    next_invoice_number: number;
    next_quote_number: number;
    // Style settings
    primary_color: string;
    font_family: string;
    accent_color: string;
    // Design
    header_text: string;
    footer_text: string;
    background_image: string;
    background_opacity: number;
};

type Template = {
    id: number;
    name: string;
    description: string;
    items: {
        description: string;
        quantity: number;
        unit_price: number;
    }[];
    notes: string;
    created_at: string;
};

type Schema = {
    settings: Settings;
    clients: Client[];
    invoices: Invoice[];
    templates: Template[];
};

const defaultSettings: Settings = {
    company_name: '',
    company_email: '',
    company_address: '',
    company_phone: '',
    tax_rate: 15,
    currency_symbol: 'R',
    bank_details: '',
    logo_path: '',
    invoice_prefix: 'INV',
    next_invoice_number: 1,
    next_quote_number: 1,
    primary_color: '#0ea5e9',
    font_family: 'Inter',
    accent_color: '#0284c7',
    header_text: '',
    footer_text: '',
    background_image: '',
    background_opacity: 0.1
};

const defaultData: Schema = {
    settings: { ...defaultSettings },
    clients: [],
    invoices: [],
    templates: []
};

let data: Schema = JSON.parse(JSON.stringify(defaultData));

export function initDatabase() {
    try {
        const dbPath = getDataPath();
        if (fs.existsSync(dbPath)) {
            const raw = fs.readFileSync(dbPath, 'utf-8');
            const loaded = JSON.parse(raw);
            // Merge with defaults to handle missing fields
            data = {
                settings: { ...defaultSettings, ...loaded.settings },
                clients: loaded.clients || [],
                invoices: loaded.invoices || [],
                templates: loaded.templates || []
            };
        } else {
            saveDatabase();
        }
        // Ensure logo directory exists
        const logoDir = getLogoDir();
        if (!fs.existsSync(logoDir)) {
            fs.mkdirSync(logoDir, { recursive: true });
        }
    } catch (e) {
        console.error("Failed to load DB, using defaults", e);
        data = JSON.parse(JSON.stringify(defaultData));
    }
}

function saveDatabase() {
    try {
        const dbPath = getDataPath();
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error("Failed to save DB", e);
        return false;
    }
}

// Generate invoice number
function generateInvoiceNumber(type: 'invoice' | 'quotation'): string {
    const prefix = type === 'invoice' ? data.settings.invoice_prefix : 'QT';
    const num = type === 'invoice' ? data.settings.next_invoice_number : data.settings.next_quote_number;
    const paddedNum = String(num).padStart(4, '0');

    // Increment for next time
    if (type === 'invoice') {
        data.settings.next_invoice_number++;
    } else {
        data.settings.next_quote_number++;
    }

    return `${prefix}-${paddedNum}`;
}

// Service Layer
export const dbService = {
    // CLIENTS
    getClients: () => {
        return [...data.clients].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    },

    getClient: (id: number) => {
        return data.clients.find(c => c.id === id);
    },

    createClient: (client: Omit<Client, 'id' | 'created_at'>) => {
        const newClient: Client = {
            id: Date.now(),
            created_at: new Date().toISOString(),
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            tax_id: client.tax_id || ''
        };
        data.clients.push(newClient);
        saveDatabase();
        return newClient;
    },

    updateClient: (id: number, updates: Partial<Client>) => {
        const index = data.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            data.clients[index] = { ...data.clients[index], ...updates };
            saveDatabase();
            return data.clients[index];
        }
        return null;
    },

    deleteClient: (id: number) => {
        const index = data.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            data.clients.splice(index, 1);
            saveDatabase();
            return true;
        }
        return false;
    },

    // INVOICES
    getInvoices: () => {
        return data.invoices.map(inv => {
            const client = data.clients.find(c => c.id === inv.client_id);
            return {
                ...inv,
                client_name: client ? client.name : 'Unknown',
                client_email: client ? client.email : ''
            };
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    getInvoice: (id: number) => {
        const inv = data.invoices.find(i => i.id === id);
        if (inv) {
            const client = data.clients.find(c => c.id === inv.client_id);
            return { ...inv, client };
        }
        return null;
    },

    createInvoice: (invData: any) => {
        const invoiceNumber = generateInvoiceNumber(invData.type);

        const newInvoice: Invoice = {
            id: Date.now(),
            invoice_number: invoiceNumber,
            client_id: Number(invData.client_id),
            type: invData.type || 'invoice',
            status: 'draft',
            issue_date: invData.issue_date || new Date().toISOString().split('T')[0],
            due_date: invData.due_date || '',
            notes: invData.notes || '',
            subtotal: Number(invData.subtotal) || 0,
            tax_rate: Number(invData.tax_rate) || data.settings.tax_rate,
            tax_total: Number(invData.tax_total) || 0,
            grand_total: Number(invData.grand_total) || 0,
            items: (invData.items || []).map((item: any) => ({
                description: item.description || '',
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price) || 0,
                total_price: Number(item.quantity) * Number(item.unit_price)
            })),
            created_at: new Date().toISOString()
        };

        data.invoices.push(newInvoice);
        const saved = saveDatabase();

        if (saved) {
            return { success: true, id: newInvoice.id, invoice_number: invoiceNumber };
        }
        return { success: false, error: 'Failed to save' };
    },

    updateInvoiceStatus: (id: number, status: Invoice['status']) => {
        const index = data.invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            data.invoices[index].status = status;
            saveDatabase();
            return data.invoices[index];
        }
        return null;
    },

    deleteInvoice: (id: number) => {
        const index = data.invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            data.invoices.splice(index, 1);
            saveDatabase();
            return true;
        }
        return false;
    },

    updateInvoice: (id: number, updates: any) => {
        const index = data.invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            // Recalculate totals if items changed
            if (updates.items) {
                updates.subtotal = updates.items.reduce((sum: number, item: any) =>
                    sum + (Number(item.quantity) * Number(item.unit_price)), 0
                );
                const taxRate = (updates.tax_rate || data.invoices[index].tax_rate) / 100;
                updates.tax_total = updates.subtotal * taxRate;
                updates.grand_total = updates.subtotal + updates.tax_total;
            }
            data.invoices[index] = { ...data.invoices[index], ...updates };
            saveDatabase();
            return data.invoices[index];
        }
        return null;
    },



    // STATS
    getStats: () => {
        const paidInvoices = data.invoices.filter(i => i.status === 'paid');
        const revenue = paidInvoices.reduce((sum, i) => sum + i.grand_total, 0);
        const now = new Date();
        const overdue = data.invoices.filter(i =>
            i.status !== 'paid' && i.due_date && new Date(i.due_date) < now
        ).length;
        const drafts = data.invoices.filter(i => i.status === 'draft').length;

        return { revenue, overdueInvoices: overdue, drafts };
    },

    // SETTINGS
    getSettings: () => {
        return { ...data.settings };
    },

    updateSettings: (newSettings: Partial<Settings>) => {
        if (newSettings.tax_rate !== undefined) {
            newSettings.tax_rate = Number(newSettings.tax_rate);
        }
        data.settings = { ...data.settings, ...newSettings };
        const saved = saveDatabase();
        return saved ? data.settings : null;
    },

    // LOGO
    uploadLogo: async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const sourcePath = result.filePaths[0];
            const ext = path.extname(sourcePath).toLowerCase();
            const logoDir = getLogoDir();

            // Ensure logo directory exists
            if (!fs.existsSync(logoDir)) {
                fs.mkdirSync(logoDir, { recursive: true });
            }

            const destPath = path.join(logoDir, `company_logo${ext}`);

            try {
                // Read file and store as base64 directly in settings for reliability
                const buffer = fs.readFileSync(sourcePath);
                const mimeType = ext === '.svg' ? 'image/svg+xml' : `image/${ext.slice(1)}`;
                const base64Logo = `data:${mimeType};base64,${buffer.toString('base64')}`;

                // Also copy file as backup
                fs.copyFileSync(sourcePath, destPath);

                data.settings.logo_path = base64Logo; // Store base64 directly
                saveDatabase();
                return { success: true, path: destPath, base64: base64Logo };
            } catch (e) {
                console.error('Failed to save logo:', e);
                return { success: false, error: 'Failed to save logo' };
            }
        }
        return { success: false, error: 'No file selected' };
    },

    getLogoBase64: () => {
        // If logo_path is already base64, return it directly
        if (data.settings.logo_path && data.settings.logo_path.startsWith('data:')) {
            return data.settings.logo_path;
        }
        // Fallback to reading from file
        if (data.settings.logo_path && fs.existsSync(data.settings.logo_path)) {
            try {
                const buffer = fs.readFileSync(data.settings.logo_path);
                const ext = path.extname(data.settings.logo_path).slice(1).toLowerCase();
                const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
                return `data:${mimeType};base64,${buffer.toString('base64')}`;
            } catch (e) {
                console.error('Failed to read logo:', e);
            }
        }
        return null;
    },

    uploadBackgroundImage: async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const sourcePath = result.filePaths[0];
            const ext = path.extname(sourcePath).toLowerCase();

            try {
                const buffer = fs.readFileSync(sourcePath);
                const mimeType = `image/${ext.slice(1)}`;
                const base64Img = `data:${mimeType};base64,${buffer.toString('base64')}`;

                data.settings.background_image = base64Img;
                saveDatabase();
                return { success: true, base64: base64Img };
            } catch (e) {
                console.error('Failed to save background image:', e);
                return { success: false, error: 'Failed to save background image' };
            }
        }
        return { success: false, error: 'No file selected' };
    },

    // TEMPLATES
    getTemplates: () => {
        return [...data.templates].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    },

    getTemplate: (id: number) => {
        return data.templates.find(t => t.id === id);
    },

    createTemplate: (template: any) => {
        const newTemplate = {
            id: Date.now(),
            name: template.name || 'Untitled Template',
            description: template.description || '',
            items: template.items || [],
            notes: template.notes || '',
            created_at: new Date().toISOString()
        };
        data.templates.push(newTemplate);
        saveDatabase();
        return newTemplate;
    },

    updateTemplate: (id: number, updates: any) => {
        const index = data.templates.findIndex(t => t.id === id);
        if (index !== -1) {
            data.templates[index] = { ...data.templates[index], ...updates };
            saveDatabase();
            return data.templates[index];
        }
        return null;
    },

    deleteTemplate: (id: number) => {
        const index = data.templates.findIndex(t => t.id === id);
        if (index !== -1) {
            data.templates.splice(index, 1);
            saveDatabase();
            return true;
        }
        return false;
    }
};

