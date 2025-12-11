# Quotevoice User Manual

**Version 1.0.0**

A complete guide to using Quotevoice for creating professional invoices and quotations.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Setting Up Your Business](#2-setting-up-your-business)
3. [Managing Clients](#3-managing-clients)
4. [Creating Documents](#4-creating-documents)
5. [Exporting & Printing](#5-exporting--printing)
6. [Understanding the Dashboard](#6-understanding-the-dashboard)
7. [Tips & Best Practices](#7-tips--best-practices)
8. [FAQ](#8-faq)

---

## 1. Getting Started

### First Launch

When you first open Quotevoice, you'll see the Dashboard. Before creating invoices, you should:

1. ✅ Configure your company settings
2. ✅ Upload your company logo
3. ✅ Add your banking details
4. ✅ Add at least one client

### Navigation

The sidebar on the left provides access to all features:

| Icon | Page | Purpose |
|------|------|---------|
| 📊 | Dashboard | Overview of your business |
| 📄 | Documents | Create invoices & quotations |
| 👥 | Clients | Manage your client database |
| ⚙️ | Settings | Configure your business details |

---

## 2. Setting Up Your Business

### Accessing Settings

1. Click **Settings** in the sidebar
2. You'll see four sections:
   - Company Logo
   - Company Profile
   - Banking Details
   - Invoice Settings

### Uploading Your Logo

1. Click the **Upload Logo** button
2. Select a PNG, JPG, or SVG file
3. Your logo will appear in the preview box
4. The logo displays on all PDF exports

**Recommended:** Use a landscape logo (wider than tall) for best results.

### Company Profile

Fill in your business information:

| Field | Example | Notes |
|-------|---------|-------|
| **Company Name** | Design Studio ZA | Appears on all documents |
| **Email** | billing@designstudio.co.za | Contact email |
| **Phone** | +27 11 123 4567 | Including area code |
| **Address** | 123 Main Road<br>Sandton<br>Johannesburg<br>2196 | Multi-line supported |

### Banking Details

Enter your payment information for client invoices:

```
Bank: First National Bank
Account Name: Design Studio ZA (Pty) Ltd
Account Number: 62000000000
Branch Code: 250655
Account Type: Business Cheque
Reference: Invoice Number
```

This appears at the bottom of every invoice PDF.

### Invoice Settings

| Setting | Default | Purpose |
|---------|---------|---------|
| **Invoice Prefix** | INV | Creates numbers like INV-0001 |
| **Currency Symbol** | R | South African Rand |
| **VAT Rate** | 15 | Percentage for tax calculation |

### Saving Settings

Click **Save Settings** at the bottom. A green confirmation message appears when saved successfully.

---

## 3. Managing Clients

### Viewing Clients

1. Click **Clients** in the sidebar
2. See all your clients in a table
3. Use the search bar to filter by name or email

### Adding a New Client

1. Click **+ Add Client** button
2. Fill in the form:
   - **Company/Name**: Required field
   - **Email**: For sending invoices
   - **Phone**: Contact number
   - **Address**: Billing address (multi-line)
   - **VAT Number**: Their tax registration number
3. Click **Create Client**

### Client Information on Invoices

When you select a client for an invoice, their details appear in the "Bill To" section:
- Company name
- Address
- Email
- VAT number (if provided)

---

## 4. Creating Documents

### Quotation vs Invoice

| Quotation | Invoice |
|-----------|---------|
| Numbered QT-0001, QT-0002... | Numbered INV-0001, INV-0002... |
| Used for estimates/proposals | Used for billing after work completed |
| Not legally binding | Legally binding payment request |

### Creating a Document

1. Click **Documents** in the sidebar
2. Choose document type:
   - Click **Quotation** or **Invoice** toggle
3. Select your client from the dropdown
4. Set dates:
   - **Issue Date**: When the document is created
   - **Due Date**: When payment is expected
5. Add line items (see below)
6. Add notes/terms (optional)
7. Click **Save & Preview**

### Adding Line Items

Each line item represents a service or product:

| Field | Example | Notes |
|-------|---------|-------|
| **Description** | Website Design - Home Page | Be specific |
| **Qty** | 1 | Number of units/hours |
| **Rate** | 5000.00 | Price per unit in Rands |

**Tips:**
- Click **+ Add Line Item** for more rows
- Hover over a row to see the delete button
- Amounts calculate automatically

### Line Item Examples

For a UI/UX Designer:

```
Description: UX Research & User Interviews    | Qty: 8  | Rate: 450
Description: Wireframe Design (10 screens)    | Qty: 1  | Rate: 3500
Description: High-Fidelity UI Design          | Qty: 10 | Rate: 600
Description: Design System Documentation      | Qty: 1  | Rate: 2000
```

### Notes / Payment Terms

Add custom terms for each document:

```
Payment due within 30 days of invoice date.
Late payments subject to 2% monthly interest.
Bank details provided below.
```

### Understanding Totals

| Line | Calculation |
|------|-------------|
| **Subtotal** | Sum of all line items |
| **VAT (15%)** | Subtotal × Tax Rate |
| **Total** | Subtotal + VAT |

---

## 5. Exporting & Printing

### PDF Preview

After clicking **Save & Preview**, you see:
- Professional PDF layout
- Your logo at the top
- All document details
- Banking information at the bottom

### Download PDF

1. Click **Download PDF** in the sidebar
2. File saves as `INV-0001.pdf` (using the invoice number)
3. Find it in your Downloads folder

### Printing

1. Click **Print** in the sidebar
2. Your system print dialog opens
3. Select your printer and print

### PDF Contents

Your exported PDF includes:

1. **Header**
   - Your logo
   - Company name
   - Address, email, phone

2. **Document Details**
   - Invoice/Quotation label
   - Document number
   - Issue and due dates

3. **Client Details**
   - Bill To section
   - Client name, address, VAT

4. **Line Items Table**
   - Description, Qty, Rate, Amount
   - Professional formatting

5. **Totals**
   - Subtotal, VAT, Total

6. **Notes**
   - Your payment terms

7. **Banking Details**
   - Payment information

8. **Footer**
   - Thank you message

---

## 6. Understanding the Dashboard

### Overview Cards

| Card | Meaning |
|------|---------|
| **Total Revenue** | Sum of all invoices marked as "Paid" |
| **Overdue Invoices** | Count of unpaid invoices past due date |
| **Active Drafts** | Count of unsent draft documents |

### Revenue Chart

Shows monthly revenue trends (placeholder data in v1.0).

### Recent Invoices

Table showing your last 5 documents:
- Client name
- Amount
- Status (Draft/Sent/Paid/Void)
- Date

---

## 7. Tips & Best Practices

### Professional Invoicing

✅ **Do:**
- Use clear, descriptive line items
- Include payment terms
- Send invoices promptly
- Follow up on overdue payments

❌ **Don't:**
- Use vague descriptions like "Services"
- Forget to include due date
- Wait weeks to invoice clients

### Logo Guidelines

- **Format:** PNG with transparent background works best
- **Size:** At least 200px wide
- **Style:** Simple, clean logos reproduce better

### Backup Your Data

Your data is stored in:
```
%APPDATA%\quotevoice\data.json
```

Copy this file periodically to back up your:
- Client information
- Invoice records
- Settings

### Invoice Numbering

- Numbers auto-increment: INV-0001, INV-0002, etc.
- Never reuse invoice numbers
- Keep sequence consistent for accounting

---

## 8. FAQ

### General

**Q: Where is my data stored?**
A: In `%APPDATA%\quotevoice\data.json` on Windows.

**Q: Can I use this offline?**
A: Yes, Quotevoice works completely offline.

**Q: Is my data secure?**
A: Data is stored locally on your computer. No cloud sync.

### Documents

**Q: Can I edit a saved invoice?**
A: Not in v1.0. Create a new invoice if needed.

**Q: How do I mark an invoice as paid?**
A: Coming in a future update.

**Q: Can I email invoices directly?**
A: Not yet. Download the PDF and attach to your email.

### Technical

**Q: The app won't start, what do I do?**
A: Try deleting `%APPDATA%\quotevoice` folder and restarting.

**Q: PDF download fails, why?**
A: Ensure the invoice preview fully loads before downloading.

**Q: How do I reset all settings?**
A: Delete the `data.json` file and restart the app.

---

## Need Help?

For additional support:
- Check the README.md for technical documentation
- Review the CHANGELOG.md for version updates
- See CONTRIBUTING.md if you want to contribute

---

**Quotevoice v1.0.0**
*Built for South African Freelancers*
