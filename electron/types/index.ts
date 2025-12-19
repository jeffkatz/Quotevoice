export interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    tax_id: string;
    created_at: string;
}

export interface Invoice {
    id: number;
    client_id: number;
    invoice_number: string;
    invoice_name: string;
    type: 'invoice' | 'quotation';
    status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'void' | 'overdue';
    issue_date: string;
    due_date?: string;
    subtotal: number;
    tax_rate: number;
    tax_total: number;
    grand_total: number;
    amount_paid: number;
    balance_due: number;
    notes?: string;
    created_at: string;
    design_config?: string; // JSON string in DB, parsed in Service

    // Relations
    client_name?: string;
    client_email?: string;
    items?: InvoiceItem[];
    payments?: Payment[];
}

export interface InvoiceItem {
    id?: number;
    invoice_id?: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface Payment {
    id?: number;
    invoice_id: number;
    amount: number;
    date: string;
    method: string;
    reference?: string;
    notes?: string;
}

export interface Settings {
    // We will type the known keys for safer access in the app
    company_name?: string;
    company_email?: string;
    company_address?: string;
    company_phone?: string;
    tax_rate?: number;
    currency_symbol?: string;
    bank_details?: string;
    logo_path?: string;
    invoice_prefix?: string;
    next_invoice_number?: number;
    next_quote_number?: number;
    primary_color?: string;
    font_family?: string;
    background_image?: string;
    background_opacity?: number;

}


