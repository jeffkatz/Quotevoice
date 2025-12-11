# Quotevoice API Reference

This document provides detailed documentation for all IPC APIs available in Quotevoice.

---

## Overview

Quotevoice uses Electron's IPC (Inter-Process Communication) to communicate between the React frontend (renderer process) and the Node.js backend (main process).

All APIs are exposed via `window.api` and return Promises.

```typescript
// Example usage
const clients = await window.api.getClients();
```

---

## Clients API

### `getClients()`
Retrieves all clients sorted by creation date (newest first).

**Returns:** `Promise<Client[]>`

```typescript
interface Client {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    created_at: string;
}
```

**Example:**
```typescript
const clients = await window.api.getClients();
console.log(clients);
// [{ id: 1702234567890, name: "Acme Corp", email: "billing@acme.com", ... }]
```

---

### `getClient(id)`
Retrieves a single client by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `number` | The client's unique ID |

**Returns:** `Promise<Client | undefined>`

**Example:**
```typescript
const client = await window.api.getClient(1702234567890);
```

---

### `createClient(client)`
Creates a new client.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `client` | `object` | Client data (without id/created_at) |

**Client Object:**
```typescript
{
    name: string;      // Required
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
}
```

**Returns:** `Promise<Client>` - The created client with ID

**Example:**
```typescript
const newClient = await window.api.createClient({
    name: "New Company",
    email: "info@newcompany.co.za",
    phone: "+27 11 123 4567",
    address: "123 Main Rd\nSandton\n2196",
    tax_id: "4123456789"
});
```

---

### `updateClient(id, updates)`
Updates an existing client.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `number` | The client's ID |
| `updates` | `object` | Fields to update |

**Returns:** `Promise<Client | null>`

**Example:**
```typescript
const updated = await window.api.updateClient(1702234567890, {
    email: "new-email@company.com"
});
```

---

### `deleteClient(id)`
Deletes a client.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `number` | The client's ID |

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const success = await window.api.deleteClient(1702234567890);
```

---

## Invoices API

### `getInvoices()`
Retrieves all invoices with client names, sorted by creation date.

**Returns:** `Promise<Invoice[]>`

```typescript
interface Invoice {
    id: number;
    invoice_number: string;      // e.g., "INV-0001"
    client_id: number;
    client_name: string;         // Joined from clients
    client_email?: string;
    type: "invoice" | "quotation";
    status: "draft" | "sent" | "paid" | "void";
    issue_date: string;
    due_date?: string;
    notes?: string;
    subtotal: number;
    tax_rate: number;
    tax_total: number;
    grand_total: number;
    items: InvoiceItem[];
    created_at: string;
}

interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}
```

**Example:**
```typescript
const invoices = await window.api.getInvoices();
```

---

### `getInvoice(id)`
Retrieves a single invoice with full client details.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `number` | The invoice's ID |

**Returns:** `Promise<Invoice & { client: Client } | null>`

---

### `createInvoice(data)`
Creates a new invoice or quotation.

**Parameters:**
```typescript
{
    client_id: number;
    type: "invoice" | "quotation";
    issue_date: string;          // "YYYY-MM-DD"
    due_date?: string;
    notes?: string;
    subtotal: number;
    tax_rate: number;            // e.g., 15 for 15%
    tax_total: number;
    grand_total: number;
    items: {
        description: string;
        quantity: number;
        unit_price: number;
    }[];
}
```

**Returns:**
```typescript
Promise<{
    success: boolean;
    id?: number;
    invoice_number?: string;
    error?: string;
}>
```

**Example:**
```typescript
const result = await window.api.createInvoice({
    client_id: 1702234567890,
    type: "invoice",
    issue_date: "2024-12-10",
    due_date: "2025-01-10",
    notes: "Payment due within 30 days",
    subtotal: 5000,
    tax_rate: 15,
    tax_total: 750,
    grand_total: 5750,
    items: [
        { description: "Website Design", quantity: 1, unit_price: 5000 }
    ]
});

if (result.success) {
    console.log(`Created ${result.invoice_number}`);
}
```

---

### `updateInvoiceStatus(id, status)`
Updates the status of an invoice.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `number` | The invoice's ID |
| `status` | `string` | "draft", "sent", "paid", or "void" |

**Returns:** `Promise<Invoice | null>`

**Example:**
```typescript
await window.api.updateInvoiceStatus(1702234567890, "paid");
```

---

### `deleteInvoice(id)`
Deletes an invoice.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | `number` | The invoice's ID |

**Returns:** `Promise<boolean>`

---

## Dashboard API

### `getDashboardStats()`
Retrieves dashboard statistics.

**Returns:**
```typescript
Promise<{
    revenue: number;          // Sum of paid invoices
    overdueInvoices: number;  // Count of overdue
    drafts: number;           // Count of drafts
}>
```

**Example:**
```typescript
const stats = await window.api.getDashboardStats();
console.log(`Total Revenue: R${stats.revenue}`);
```

---

## Settings API

### `getSettings()`
Retrieves all application settings.

**Returns:**
```typescript
Promise<{
    company_name: string;
    company_email: string;
    company_address: string;
    company_phone: string;
    tax_rate: number;           // e.g., 15
    currency_symbol: string;    // e.g., "R"
    bank_details: string;
    logo_path: string;
    invoice_prefix: string;     // e.g., "INV"
    next_invoice_number: number;
    next_quote_number: number;
}>
```

---

### `updateSettings(settings)`
Updates application settings.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `settings` | `object` | Partial settings to update |

**Returns:** `Promise<Settings | null>`

**Example:**
```typescript
await window.api.updateSettings({
    company_name: "My New Company",
    tax_rate: 15,
    currency_symbol: "R"
});
```

---

## Logo API

### `uploadLogo()`
Opens a file dialog to select and save a company logo.

**Returns:**
```typescript
Promise<{
    success: boolean;
    path?: string;
    error?: string;
}>
```

**Example:**
```typescript
const result = await window.api.uploadLogo();
if (result.success) {
    console.log(`Logo saved to: ${result.path}`);
}
```

---

### `getLogo()`
Retrieves the company logo as a base64 data URL.

**Returns:** `Promise<string | null>`

**Example:**
```typescript
const logoBase64 = await window.api.getLogo();
if (logoBase64) {
    // Use in img tag
    <img src={logoBase64} alt="Company Logo" />
}
```

---

## Error Handling

All API calls should be wrapped in try-catch:

```typescript
try {
    const result = await window.api.createInvoice(data);
    if (!result.success) {
        console.error(result.error);
    }
} catch (error) {
    console.error("IPC call failed:", error);
}
```

---

## Type Definitions

Full TypeScript definitions are available in `src/types.d.ts`:

```typescript
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
    updateInvoiceStatus: (id: number, status: string) => Promise<any>;
    deleteInvoice: (id: number) => Promise<boolean>;
    
    // Dashboard
    getDashboardStats: () => Promise<{ revenue: number; overdueInvoices: number; drafts: number }>;
    
    // Settings
    getSettings: () => Promise<Settings>;
    updateSettings: (settings: any) => Promise<any>;
    
    // Logo
    uploadLogo: () => Promise<{ success: boolean; path?: string; error?: string }>;
    getLogo: () => Promise<string | null>;
}

declare global {
    interface Window {
        api: IApi;
    }
}
```
