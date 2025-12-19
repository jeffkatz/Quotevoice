export enum InvoiceType {
    Invoice = 'invoice',
    Quotation = 'quotation'
}

export enum InvoiceStatus {
    Draft = 'draft',
    Sent = 'sent',
    Paid = 'paid',
    PartiallyPaid = 'partially_paid',
    Overdue = 'overdue',
    Void = 'void',
    // Quotation specific
    Approved = 'approved',
    Rejected = 'rejected',
    // Converted
    Invoiced = 'invoiced'
}

export interface InvoiceItemDto {
    description: string;
    quantity: number;
    unit_price: number;
}

export interface CreateInvoiceDto {
    client_id: number;
    type: InvoiceType;
    invoice_name?: string;
    issue_date: string;
    due_date?: string;
    items: InvoiceItemDto[];
    notes?: string;
    tax_rate?: number;
    design_config?: any;
}

export interface UpdateInvoiceDto {
    status?: InvoiceStatus;
    items?: InvoiceItemDto[];
    notes?: string;
    due_date?: string;
    tax_rate?: number;
    design_config?: any;
    // For manual edits only allowed in Draft
    issue_date?: string;
    invoice_name?: string;
}
