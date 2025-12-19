import { DatabaseManager } from '../../database';
import { Money } from '../shared/money';
import { InvoiceType, InvoiceStatus, CreateInvoiceDto, UpdateInvoiceDto, InvoiceItemDto } from './invoice.types';
import { settingsService } from '../../services/settings.service'; // Reuse existing for now

export class InvoiceService {
    private db = DatabaseManager.getInstance();

    // --- Queries ---

    getAll() {
        const sql = `
            SELECT i.*, c.name as client_name 
            FROM invoices i
            LEFT JOIN clients c ON i.client_id = c.id
            ORDER BY i.created_at DESC
        `;
        return this.db.query(sql);
    }

    getById(id: number) {
        const invoice: any = this.db.get('SELECT * FROM invoices WHERE id = ?', [id]);
        if (!invoice) return undefined;
        invoice.items = this.db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);
        invoice.payments = this.db.query('SELECT * FROM payments WHERE invoice_id = ?', [id]);
        return invoice;
    }

    // --- Actions ---

    create(dto: CreateInvoiceDto) {
        return this.db.transaction(() => {
            const number = settingsService.incrementInvoiceNumber(dto.type);
            const totals = this.calculateTotals(dto.items, dto.tax_rate || 0);

            const result = this.db.run(
                `INSERT INTO invoices (
                    client_id, invoice_number, invoice_name, type, status, 
                    issue_date, due_date, notes, 
                    subtotal, tax_rate, tax_total, grand_total, balance_due, 
                    design_config, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    dto.client_id, number, dto.invoice_name || (dto.type === InvoiceType.Quotation ? 'New Quote' : 'New Invoice'),
                    dto.type, InvoiceStatus.Draft,
                    dto.issue_date, dto.due_date, dto.notes,
                    totals.subtotal, dto.tax_rate || 0, totals.tax_total, totals.grand_total, totals.grand_total,
                    JSON.stringify(dto.design_config || {}), new Date().toISOString()
                ]
            );

            const id = Number(result.lastInsertRowid);
            this.insertItems(id, dto.items);
            return this.getById(id);
        });
    }

    update(id: number, dto: UpdateInvoiceDto) {
        return this.db.transaction(() => {
            const current = this.getById(id);
            if (!current) throw new Error('Invoice not found');

            // VALIDATION: State Machine
            if (dto.status) {
                this.validateStatusTransition(current, dto.status);
            }

            // VALIDATION: Editing Limitation
            // If trying to edit financial fields (items, tax), status must be DRAFT
            if ((dto.items || dto.tax_rate !== undefined) && current.status !== InvoiceStatus.Draft) {
                throw new Error(`Cannot edit finalized document. Current status: ${current.status}`);
            }

            // Calculations
            let { subtotal, tax_total, grand_total } = current;
            if (dto.items || dto.tax_rate !== undefined) {
                const items = dto.items || current.items;
                const taxRate = dto.tax_rate !== undefined ? dto.tax_rate : current.tax_rate;
                const totals = this.calculateTotals(items, taxRate);
                subtotal = totals.subtotal;
                tax_total = totals.tax_total;
                grand_total = totals.grand_total;

                // Update items in DB
                if (dto.items) {
                    this.db.run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
                    this.insertItems(id, dto.items);
                }
            }

            // Balance Recalculation
            // Balance = GrandTotal - Paid
            const balance_due = grand_total - current.amount_paid;

            // Updates Construction
            const updates: any = { ...dto };
            delete updates.items; // Handled separately

            // Apply calculated fields
            updates.subtotal = subtotal;
            updates.tax_total = tax_total;
            updates.grand_total = grand_total;
            updates.balance_due = balance_due;

            // Design config stringify
            if (updates.design_config) updates.design_config = JSON.stringify(updates.design_config);

            const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
            if (fields.length > 0) {
                this.db.run(`UPDATE invoices SET ${fields} WHERE id = ?`, [...Object.values(updates), id]);
            }

            return this.getById(id);
        });
    }

    addPayment(id: number, payment: { amount: number, date: string, method: string, reference?: string }) {
        return this.db.transaction(() => {
            const current = this.getById(id);
            if (!current) throw new Error('Invoice not found');
            if (current.type === InvoiceType.Quotation) throw new Error('Cannot add payment to a quotation');
            if (current.status === InvoiceStatus.Draft) throw new Error('Cannot add payment to a draft invoice. Send it first.');

            // Add Payment
            this.db.run(
                `INSERT INTO payments (invoice_id, amount, date, method, reference) VALUES (?, ?, ?, ?, ?)`,
                [id, payment.amount, payment.date, payment.method, payment.reference]
            );

            // Update Totals
            const newPaid = Money.fromFloat(current.amount_paid).add(Money.fromFloat(payment.amount));
            const total = Money.fromFloat(current.grand_total);
            const balance = total.subtract(newPaid);

            let newStatus = current.status;
            if (balance.toCents() <= 0) newStatus = InvoiceStatus.Paid;
            else newStatus = InvoiceStatus.PartiallyPaid;

            this.db.run(
                `UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ? WHERE id = ?`,
                [newPaid.toFloat(), Math.max(0, balance.toFloat()), newStatus, id]
            );

            return this.getById(id);
        });
    }

    delete(id: number) {
        // Only allow deleting Drafts? Or any?
        // User didn't specify, but typically strict systems only allow deleting Drafts, otherwise Void.
        // For now, allow delete but maybe restrict later.
        const current = this.getById(id);
        if (current && current.status !== InvoiceStatus.Draft && current.status !== InvoiceStatus.Void) {
            // throw new Error('Cannot delete active document. Void it instead.');
            // Commendted out for flexibility for now, but good practice.
        }
        this.db.run('DELETE FROM invoices WHERE id = ?', [id]);
        return true;
    }

    // --- Helpers ---

    private validateStatusTransition(current: any, newStatus: InvoiceStatus) {
        if (current.status === newStatus) return;

        const type = current.type;
        const oldS = current.status;

        // Rules
        if (oldS === InvoiceStatus.Paid && newStatus !== InvoiceStatus.Void) {
            throw new Error('Paid invoices cannot change status');
        }

        if (type === InvoiceType.Quotation) {
            // Draft -> Sent -> Approved/Rejected -> Invoiced
            if (newStatus === InvoiceStatus.Invoiced && oldS !== InvoiceStatus.Approved) {
                throw new Error('Quotation must be Approved before Invoicing');
            }
        }
    }

    private calculateTotals(items: InvoiceItemDto[], taxRate: number) {
        let subtotal = Money.fromCents(0);

        items.forEach(item => {
            const qty = item.quantity; // float
            const price = Money.fromFloat(item.unit_price);
            const lineTotal = price.multiply(qty);
            subtotal = subtotal.add(lineTotal);
        });

        const tax = subtotal.multiply(taxRate / 100);
        const grand = subtotal.add(tax);

        return {
            subtotal: subtotal.toFloat(),
            tax_total: tax.toFloat(),
            grand_total: grand.toFloat()
        };
    }

    private insertItems(invoiceId: number, items: InvoiceItemDto[]) {
        const stmt = this.db.prepare(
            `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) 
             VALUES (@invoice_id, @description, @quantity, @unit_price, @total)`
        );
        items.forEach(item => {
            const total = Money.fromFloat(item.unit_price).multiply(item.quantity).toFloat();
            stmt.run({
                invoice_id: invoiceId,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total
            });
        });
    }
}

export const invoiceService = new InvoiceService();
