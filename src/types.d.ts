// Types
export interface Payment {
    id: number;
    invoice_id: number;
    amount: number;
    date: string;
    method: string;
    reference?: string;
    notes?: string;
}

export interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    tax_id: string;
    created_at?: string;
}

export interface Invoice {
    id: number;
    invoice_number: string;
    invoice_name: string;
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
    amount_paid: number;
    balance_due: number;
    items: {
        description: string;
        quantity: number;
        unit_price: number;
        total_price: number;
    }[];
    payments: Payment[];
    created_at: string;
    design?: DesignConfig;
}

export interface IApi {
    // Clients
    getClients: () => Promise<Client[]>;
    getClient: (id: number) => Promise<Client>;
    createClient: (client: Partial<Client>) => Promise<Client>;
    updateClient: (id: number, updates: any) => Promise<any>;
    deleteClient: (id: number) => Promise<boolean>;

    // Invoices
    getInvoices: () => Promise<Invoice[]>; // Use stronger type
    getInvoice: (id: number) => Promise<Invoice & { client?: any }>;
    createInvoice: (data: any) => Promise<{ success: boolean; id?: number; invoice_number?: string; error?: string }>;
    updateInvoice: (id: number, updates: any) => Promise<any>;
    updateInvoiceStatus: (id: number, status: string) => Promise<any>;
    deleteInvoice: (id: number) => Promise<boolean>;
    addPayment: (invoiceId: number, payment: Partial<Payment>) => Promise<{ success: boolean; payment?: Payment; error?: string }>;

    // Dashboard
    getDashboardStats: () => Promise<{ revenue: number; overdueInvoices: number; drafts: number; revenueTrend: { month: string; amount: number }[] }>;

    // Settings
    getSettings: () => Promise<{
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
        primary_color: string;
        font_family: string;
        header_text?: string;
        footer_text?: string;
        background_image?: string;
        background_opacity?: number;
    }>;
    updateSettings: (settings: any) => Promise<any>;
    createBackup: () => Promise<{ success: boolean; path?: string; error?: string }>;

    // Media
    uploadLogo: () => Promise<{ success: boolean; path?: string; base64?: string; error?: string }>;
    getLogo: () => Promise<string | null>;
    uploadBackgroundImage: () => Promise<{ success: boolean; base64?: string; error?: string }>;


}

export type DesignConfig = {
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



declare global {
    interface Window {
        api: IApi;
        electron?: {
            onNavigate: (callback: (path: string) => void) => void;
        };
    }
}
