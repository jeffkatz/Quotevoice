# Quotevoice

**Professional Invoice & Quotation Generator for Freelancers**

Quotevoice is a desktop application built for freelance professionals in South Africa to create, manage, and export professional invoices and quotations. Built with Electron, React, and TypeScript.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start Guide](#-quick-start-guide)
- [User Guide](#-user-guide)
- [Technical Documentation](#-technical-documentation)
- [Development](#-development)
- [Building for Production](#-building-for-production)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### Core Features
- **Invoice Generation** - Create professional invoices with automatic numbering
- **Quotation Generation** - Generate quotes that can be converted to invoices
- **PDF Export** - Download publication-ready PDF documents
- **Print Support** - Direct printing from the application

### Business Management
- **Client Database** - Store and manage client information
- **Dashboard Analytics** - Track revenue, overdue invoices, and drafts
- **Settings Persistence** - All data saved locally for offline use

### Customization
- **Company Logo Upload** - Brand your documents with your logo
- **Banking Details** - Include payment information on invoices
- **Configurable Tax Rate** - Set your VAT/tax percentage
- **Custom Invoice Prefix** - Use your preferred numbering format

### South African Focus
- **ZAR Currency** - Default Rand (R) currency symbol
- **15% VAT** - Pre-configured for SA tax rates
- **Local Banking Format** - Designed for SA bank details

---

## 💿 Installation

### Option 1: Windows Installer (Recommended)
1. Download `Quotevoice Setup 1.0.0.exe` from the `release` folder
2. Double-click to run the installer
3. Follow the installation wizard
4. Launch Quotevoice from your Start Menu or Desktop

### Option 2: Portable Version
1. Navigate to `release/win-unpacked/`
2. Run `Quotevoice.exe` directly
3. No installation required

---

## 🚀 Quick Start Guide

### Step 1: Configure Your Business
1. Open Quotevoice
2. Click **Settings** in the sidebar
3. Fill in your company details:
   - Company Name
   - Email & Phone
   - Physical Address
4. Add your **Banking Details** for client payments
5. Upload your **Company Logo**
6. Click **Save Settings**

### Step 2: Add Your First Client
1. Click **Clients** in the sidebar
2. Click **+ Add Client**
3. Enter client details:
   - Company/Client Name
   - Email & Phone
   - Address
   - VAT Number (if applicable)
4. Click **Create Client**

### Step 3: Create Your First Invoice
1. Click **Documents** in the sidebar
2. Select **Quotation** or **Invoice**
3. Choose your client from the dropdown
4. Add line items:
   - Description (e.g., "Website Design - Home Page")
   - Quantity
   - Rate
5. Add any notes or payment terms
6. Click **Save & Preview**
7. Download as PDF or Print

---

## 📖 User Guide

### Dashboard

The Dashboard provides an overview of your business:

| Metric | Description |
|--------|-------------|
| **Total Revenue** | Sum of all paid invoices |
| **Overdue Invoices** | Unpaid invoices past due date |
| **Active Drafts** | Unsent documents |
| **Recent Invoices** | Last 5 documents created |

### Documents (Invoices & Quotations)

#### Creating a Document
1. Navigate to **Documents**
2. Toggle between **Quotation** and **Invoice**
3. Select a client
4. Set issue and due dates
5. Add line items with descriptions, quantities, and rates
6. Add notes/payment terms (optional)
7. Click **Save & Preview**

#### Document Types
- **Quotation** - Numbered as `QT-0001`, `QT-0002`, etc.
- **Invoice** - Numbered as `INV-0001`, `INV-0002`, etc.

#### Line Items
- **Description**: What you're billing for
- **Quantity**: Number of units/hours
- **Rate**: Price per unit in your currency
- **Amount**: Auto-calculated (Qty × Rate)

#### Totals
- **Subtotal**: Sum of all line items
- **VAT**: Calculated using your settings tax rate
- **Total**: Grand total including VAT

### PDF Preview & Export

After saving a document:
1. View the professional PDF preview
2. Click **Download PDF** to save to your computer
3. Click **Print** for direct printing
4. Click **Back to Editor** to make changes

### Clients

#### Adding a Client
1. Go to **Clients**
2. Click **+ Add Client**
3. Fill in the form:
   - **Company/Name**: Required
   - **Email**: For correspondence
   - **Phone**: Contact number
   - **Address**: Billing address
   - **VAT Number**: For tax invoices

#### Searching Clients
Use the search bar to filter clients by name or email.

### Settings

#### Company Profile
- **Company Name**: Appears on all documents
- **Email**: Contact email on invoices
- **Phone**: Contact number on invoices
- **Address**: Physical/postal address

#### Company Logo
- Click **Upload Logo** to select an image
- Supported formats: PNG, JPG, SVG
- Recommended size: 200×100 pixels
- Logo appears on all PDF exports

#### Banking Details
Enter your bank account information:
```
Bank: FNB
Account Name: Your Business Name
Account Number: 1234567890
Branch Code: 250655
Account Type: Business Cheque
```
This appears on invoice PDFs for client payments.

#### Invoice Settings
- **Invoice Prefix**: Default is "INV"
- **Currency Symbol**: Default is "R" (Rand)
- **VAT Rate**: Default is 15%

---

## 🔧 Technical Documentation

### Architecture

```
Quotevoice/
├── electron/           # Main process (Electron/Node.js)
│   ├── main.ts        # Application entry point
│   ├── preload.ts     # Context bridge for IPC
│   ├── db.ts          # Database service layer
│   └── ipcHandlers.ts # IPC communication handlers
├── src/               # Renderer process (React)
│   ├── App.tsx        # Main React component
│   ├── main.tsx       # React entry point
│   ├── components/    # UI components
│   │   ├── InvoiceEditor.tsx
│   │   ├── Clients.tsx
│   │   └── Settings.tsx
│   ├── types.d.ts     # TypeScript declarations
│   └── index.css      # Tailwind CSS styles
├── dist/              # Built React app
├── dist-electron/     # Built Electron main process
└── release/           # Packaged installers
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Desktop Framework** | Electron 33.x |
| **Frontend** | React 18.x with TypeScript |
| **Styling** | Tailwind CSS 3.x |
| **State Management** | React Hooks |
| **Forms** | React Hook Form |
| **Charts** | Recharts |
| **PDF Generation** | jsPDF + html2canvas |
| **Build Tool** | Vite 5.x |
| **Packaging** | electron-builder |

### Data Storage

Data is stored in a JSON file at:
- **Development**: `{project}/data.json`
- **Production**: `%APPDATA%/quotevoice/data.json`

#### Schema
```typescript
{
  settings: {
    company_name: string,
    company_email: string,
    company_address: string,
    company_phone: string,
    tax_rate: number,        // e.g., 15 for 15%
    currency_symbol: string, // e.g., "R"
    bank_details: string,
    logo_path: string,
    invoice_prefix: string,
    next_invoice_number: number,
    next_quote_number: number
  },
  clients: [
    {
      id: number,
      name: string,
      email: string,
      phone: string,
      address: string,
      tax_id: string,
      created_at: string
    }
  ],
  invoices: [
    {
      id: number,
      invoice_number: string,
      client_id: number,
      type: "invoice" | "quotation",
      status: "draft" | "sent" | "paid" | "void",
      issue_date: string,
      due_date: string,
      notes: string,
      subtotal: number,
      tax_rate: number,
      tax_total: number,
      grand_total: number,
      items: [...],
      created_at: string
    }
  ]
}
```

### IPC API

The renderer process communicates with the main process via these APIs:

#### Clients
```typescript
window.api.getClients()                    // Get all clients
window.api.getClient(id)                   // Get single client
window.api.createClient(client)            // Create new client
window.api.updateClient(id, updates)       // Update client
window.api.deleteClient(id)                // Delete client
```

#### Invoices
```typescript
window.api.getInvoices()                   // Get all invoices
window.api.getInvoice(id)                  // Get single invoice
window.api.createInvoice(data)             // Create invoice
window.api.updateInvoiceStatus(id, status) // Update status
window.api.deleteInvoice(id)               // Delete invoice
```

#### Settings
```typescript
window.api.getSettings()                   // Get settings
window.api.updateSettings(settings)        // Update settings
window.api.uploadLogo()                    // Upload logo dialog
window.api.getLogo()                       // Get logo as base64
```

#### Dashboard
```typescript
window.api.getDashboardStats()             // Get revenue stats
```

---

## 🛠 Development

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Windows 10/11 (for building)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd Quotevoice

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### Development Mode

Running `npm run dev`:
1. Starts Vite dev server for React
2. Compiles Electron TypeScript
3. Launches Electron with DevTools open
4. Hot reloads on file changes

---

## 📦 Building for Production

### Full Build
```bash
npm run build
```

This will:
1. Compile TypeScript
2. Bundle React with Vite
3. Package with electron-builder
4. Create installer in `release/` folder

### Build Output
```
release/
├── Quotevoice Setup 1.0.0.exe  # Windows installer
├── win-unpacked/                # Portable version
└── *.blockmap                   # Update metadata
```

### Custom Icon
To add a custom app icon:
1. Create `resources/icon.ico` (256×256 minimum)
2. Update `electron-builder.yml`:
   ```yaml
   win:
     icon: resources/icon.ico
   ```
3. Rebuild the application

---

## ❓ Troubleshooting

### Application Won't Start
1. Ensure no other Electron processes are running
2. Delete `dist-electron/` and run `npm run dev` again
3. Check for antivirus blocking

### Data Not Saving
1. Check write permissions to app data folder
2. Look for `data.json` in the correct location
3. Restart the application

### PDF Generation Fails
1. Ensure the preview is fully rendered
2. Wait a moment before downloading
3. Check browser console for errors

### Logo Not Appearing
1. Use PNG, JPG, or SVG format
2. Keep file size under 2MB
3. Re-upload if issues persist

### Build Errors
1. Delete `node_modules/` and reinstall
2. Clear `dist/` and `dist-electron/` folders
3. Ensure Node.js version compatibility

---

## 📄 License

MIT License

Copyright (c) 2024 Quotevoice

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🤝 Support

For issues and feature requests, please create an issue in the repository.

---

**Built with ❤️ for South African Freelancers**
