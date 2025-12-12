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

type Payment = {
    id: number;
    invoice_id: number;
    amount: number;
    date: string;
    method: string;
    reference?: string;
    notes?: string;
};

type Invoice = {
    id: number;
    invoice_number: string;
    invoice_name: string; // New field
    client_id: number;
    type: 'invoice' | 'quotation';
    status: 'draft' | 'sent' | 'paid' | 'void' | 'partially_paid';
    issue_date: string;
    due_date?: string;
    notes?: string;
    subtotal: number;
    tax_rate: number;
    tax_total: number;
    grand_total: number;
    amount_paid: number; // New field (calculated)
    balance_due: number; // New field (calculated)
    items: InvoiceItem[];
    payments: Payment[]; // Embedded payments check
    created_at: string;
    design?: DesignConfig;
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
    // Removed old style settings, kept minimal
    primary_color: string;
    font_family: string;
    background_image: string;
    background_opacity: number;
    default_template_id?: number;
};

type DesignConfig = {
    logo_path?: string;
    primary_color?: string;
    font_family?: string;
    header_text?: string;
    footer_text?: string;
    background_image?: string;
    background_opacity?: number;
    orientation?: 'portrait' | 'landscape';
    logo_size?: number;
    header_height?: number;
    footer_height?: number;
    content_spacing?: 'compact' | 'normal' | 'relaxed';
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
    design?: DesignConfig;
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
            // Merge with defaults
            data = {
                settings: { ...defaultSettings, ...loaded.settings },
                clients: loaded.clients || [],
                invoices: (loaded.invoices || []).map((inv: any) => ({
                    ...inv,
                    invoice_name: inv.invoice_name || 'Standard Invoice',
                    amount_paid: inv.amount_paid || 0,
                    balance_due: inv.balance_due || inv.grand_total,
                    payments: inv.payments || []
                })),
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

        // Ensure Default Template exists
        if (data.templates.length === 0) {
            dbService.createTemplate({
                name: 'Default Template',
                description: 'Standard A4 Portrait Template',
                items: [],
                notes: '',
                design: {
                    orientation: 'portrait',
                    primary_color: '#0ea5e9',
                    font_family: 'Inter',
                    background_opacity: 0.1
                }
            });
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

function generateInvoiceNumber(type: 'invoice' | 'quotation'): string {
    const prefix = type === 'invoice' ? data.settings.invoice_prefix : 'QT';
    const num = type === 'invoice' ? data.settings.next_invoice_number : data.settings.next_quote_number;
    const paddedNum = String(num).padStart(4, '0');
    // Increment
    if (type === 'invoice') data.settings.next_invoice_number++;
    else data.settings.next_quote_number++;
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
    getClient: (id: number) => data.clients.find(c => c.id === id),
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

    // INVOICES & PAYMENTS
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
        const grandTotal = Number(invData.grand_total) || 0;

        const newInvoice: Invoice = {
            id: Date.now(),
            invoice_number: invoiceNumber,
            invoice_name: invData.invoice_name || 'Standard Invoice',
            client_id: Number(invData.client_id),
            type: invData.type || 'invoice',
            status: 'draft',
            issue_date: invData.issue_date || new Date().toISOString().split('T')[0],
            due_date: invData.due_date || '',
            notes: invData.notes || '',
            subtotal: Number(invData.subtotal) || 0,
            tax_rate: Number(invData.tax_rate) || data.settings.tax_rate,
            tax_total: Number(invData.tax_total) || 0,
            grand_total: grandTotal,
            amount_paid: 0,
            balance_due: grandTotal,
            items: (invData.items || []).map((item: any) => ({
                description: item.description || '',
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price) || 0,
                total_price: Number(item.quantity) * Number(item.unit_price)
            })),
            payments: [],
            created_at: new Date().toISOString(),
            design: invData.design || {}
        };
        data.invoices.push(newInvoice);
        saveDatabase();
        return { success: true, id: newInvoice.id, invoice_number: invoiceNumber };
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

            // Merge updates
            const updatedInvoice = { ...data.invoices[index], ...updates };

            // Recalculate Balance
            updatedInvoice.balance_due = updatedInvoice.grand_total - updatedInvoice.amount_paid;

            // Update Status based on balance if invoice
            if (updatedInvoice.type === 'invoice') {
                if (updatedInvoice.balance_due <= 0 && updatedInvoice.grand_total > 0) updatedInvoice.status = 'paid';
                else if (updatedInvoice.balance_due < updatedInvoice.grand_total && updatedInvoice.balance_due > 0) updatedInvoice.status = 'partially_paid';
                else if (updatedInvoice.status === 'paid' && updatedInvoice.balance_due > 0) updatedInvoice.status = 'sent'; // revert to sent if balance re-opens
            }

            data.invoices[index] = updatedInvoice;
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
    updateInvoiceStatus: (id: number, status: Invoice['status']) => {
        const index = data.invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            data.invoices[index].status = status;
            saveDatabase();
            return data.invoices[index];
        }
        return null;
    },

    // PAYMENTS
    addPayment: (invoiceId: number, payment: { amount: number; date: string; method: string; reference?: string; notes?: string }) => {
        const index = data.invoices.findIndex(i => i.id === invoiceId);
        if (index !== -1) {
            const inv = data.invoices[index];
            const newPayment: Payment = {
                id: Date.now(),
                invoice_id: invoiceId,
                amount: Number(payment.amount),
                date: payment.date,
                method: payment.method,
                reference: payment.reference,
                notes: payment.notes
            };

            // If payments array doesn't exist (old data migration), init it
            if (!inv.payments) inv.payments = [];
            inv.payments.push(newPayment);

            // Update Totals
            inv.amount_paid += newPayment.amount;
            inv.balance_due = inv.grand_total - inv.amount_paid;

            // Update Status
            if (inv.balance_due <= 0.01) { // Floating point tolerance
                inv.status = 'paid';
                inv.balance_due = 0;
            } else {
                inv.status = 'partially_paid';
            }

            data.invoices[index] = inv;
            saveDatabase();
            return { success: true, payment: newPayment, invoice: inv };
        }
        return { success: false, error: 'Invoice not found' };
    },

    // STATS
    getStats: () => {
        const paidInvoices = data.invoices.filter(i => i.status === 'paid');
        const revenue = paidInvoices.reduce((sum, i) => sum + i.grand_total, 0);
        // Include partial payments in revenue
        const partialRevenue = data.invoices.filter(i => i.status === 'partially_paid').reduce((sum, i) => sum + i.amount_paid, 0);

        const now = new Date();
        const overdue = data.invoices.filter(i =>
            (i.status !== 'paid' && i.status !== 'void') && i.due_date && new Date(i.due_date) < now
        ).length;
        const drafts = data.invoices.filter(i => i.status === 'draft').length;

        return { revenue: revenue + partialRevenue, overdueInvoices: overdue, drafts };
    },

    // SETTINGS
    getSettings: () => ({ ...data.settings }),
    updateSettings: (newSettings: Partial<Settings>) => {
        if (newSettings.tax_rate !== undefined) newSettings.tax_rate = Number(newSettings.tax_rate);
        data.settings = { ...data.settings, ...newSettings };
        const saved = saveDatabase();
        return saved ? data.settings : null;
    },

    // BACKUP & RESTORE
    createBackup: () => {
        const backupPath = path.join(app.getPath('userData'), `backup-${Date.now()}.json`);
        try {
            fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
            return { success: true, path: backupPath };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    },

    // LOGO & IMAGES
    uploadLogo: async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const sourcePath = result.filePaths[0];
            const ext = path.extname(sourcePath).toLowerCase();
            try {
                const buffer = fs.readFileSync(sourcePath);
                const mimeType = ext === '.svg' ? 'image/svg+xml' : `image/${ext.slice(1)}`;
                const base64Logo = `data:${mimeType};base64,${buffer.toString('base64')}`;
                data.settings.logo_path = base64Logo;
                saveDatabase();
                return { success: true, base64: base64Logo };
            } catch (e) { return { success: false, error: 'Failed' }; }
        }
        return { success: false, error: 'No file' };
    },
    getLogoBase64: () => data.settings.logo_path || null,
    uploadBackgroundImage: async () => {
        const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }] });
        if (!result.canceled && result.filePaths[0]) {
            try {
                const buffer = fs.readFileSync(result.filePaths[0]);
                const base64Img = `data:image/jpeg;base64,${buffer.toString('base64')}`;
                data.settings.background_image = base64Img;
                saveDatabase();
                return { success: true, base64: base64Img };
            } catch (e) { return { success: false }; }
        }
        return { success: false };
    },

    // TEMPLATES
    getTemplates: () => [...data.templates].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    getTemplate: (id: number) => data.templates.find(t => t.id === id),
    createTemplate: (template: any) => {
        const newTemplate = {
            id: Date.now(),
            name: template.name || 'Untitled',
            description: template.description || '',
            items: template.items || [],
            notes: template.notes || '',
            created_at: new Date().toISOString(),
            design: template.design || {}
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

