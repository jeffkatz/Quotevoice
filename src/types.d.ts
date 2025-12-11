export interface IApi {
    // Clients
    getClients: () => Promise<any[]>;
    getClient: (id: number) => Promise<any>;
    createClient: (client: any) => Promise<any>;
    updateClient: (id: number, updates: any) => Promise<any>;
    deleteClient: (id: number) => Promise<boolean>;

    // Invoices
    getInvoices: () => Promise<any[]>;
    getInvoice: (id: number) => Promise<any>;
    createInvoice: (data: any) => Promise<{ success: boolean; id?: number; invoice_number?: string; error?: string }>;
    updateInvoice: (id: number, updates: any) => Promise<any>;
    updateInvoiceStatus: (id: number, status: string) => Promise<any>;
    deleteInvoice: (id: number) => Promise<boolean>;

    // Dashboard
    getDashboardStats: () => Promise<{ revenue: number; overdueInvoices: number; drafts: number }>;

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
        accent_color: string;
        // New Design Fields
        header_text?: string;
        footer_text?: string;
        background_image?: string;
        background_opacity?: number;
    }>;
    updateSettings: (settings: any) => Promise<any>;

    // Media
    uploadLogo: () => Promise<{ success: boolean; path?: string; base64?: string; error?: string }>;
    getLogo: () => Promise<string | null>;
    uploadBackgroundImage: () => Promise<{ success: boolean; base64?: string; error?: string }>;

    // Templates
    getTemplates: () => Promise<any[]>;
    getTemplate: (id: number) => Promise<any>;
    createTemplate: (template: any) => Promise<any>;
    updateTemplate: (id: number, updates: any) => Promise<any>;
    deleteTemplate: (id: number) => Promise<boolean>;
}

declare global {
    interface Window {
        api: IApi;
    }
}
