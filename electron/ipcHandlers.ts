import { ipcMain } from 'electron';
import { clientService } from './services/client.service';
import { invoiceService } from './domain/invoice/invoice.service';
import { settingsService } from './services/settings.service';

import { DatabaseManager } from './database';

export function setupIpcHandlers() {
    // --- CLIENTS ---
    ipcMain.handle('get-clients', async () => clientService.getAll());
    ipcMain.handle('get-client', async (_, id: number) => clientService.getById(id));
    ipcMain.handle('create-client', async (_, client) => clientService.create(client));
    ipcMain.handle('update-client', async (_, id, updates) => clientService.update(id, updates));
    ipcMain.handle('delete-client', async (_, id) => clientService.delete(id));

    // --- INVOICES ---
    ipcMain.handle('get-invoices', async () => invoiceService.getAll());
    ipcMain.handle('get-invoice', async (_, id: number) => invoiceService.getById(id));
    ipcMain.handle('create-invoice', async (_, data) => {
        // Domain service handles DTO validation
        return invoiceService.create(data);
    });
    ipcMain.handle('update-invoice', async (_, id, updates) => {
        // Domain service handles DTO validation
        return invoiceService.update(id, updates);
    });
    ipcMain.handle('update-invoice-status', async (_, id, status) => invoiceService.update(id, { status }));
    ipcMain.handle('delete-invoice', async (_, id) => invoiceService.delete(id));
    ipcMain.handle('add-payment', async (_, invoiceId, payment) => invoiceService.addPayment(invoiceId, payment));

    // --- DASHBOARD STATS ---
    ipcMain.handle('get-dashboard-stats', async () => {
        const db = DatabaseManager.getInstance();
        const paid = db.get<{ sum: number }>('SELECT SUM(grand_total) as sum FROM invoices WHERE status = \'paid\'')?.sum || 0;
        const partial = db.get<{ sum: number }>('SELECT SUM(amount_paid) as sum FROM invoices WHERE status = \'partially_paid\'')?.sum || 0;
        const overdue = db.get<{ count: number }>('SELECT COUNT(*) as count FROM invoices WHERE status != \'paid\' AND status != \'void\' AND due_date < date(\'now\')')?.count || 0;
        const drafts = db.get<{ count: number }>('SELECT COUNT(*) as count FROM invoices WHERE status = \'draft\'')?.count || 0;

        const revenueTrend = db.query<{ month: string, amount: number }>(`
            SELECT strftime('%Y-%m', issue_date) as month, SUM(grand_total) as amount
            FROM invoices
            WHERE status = 'paid' OR status = 'partially_paid'
            GROUP BY month
            ORDER BY month ASC
            LIMIT 6
        `);

        return {
            revenue: paid + partial,
            overdueInvoices: overdue,
            drafts: drafts,
            revenueTrend
        };
    });

    // --- SETTINGS ---
    ipcMain.handle('get-settings', async () => settingsService.getAll());
    ipcMain.handle('update-settings', async (_, newSettings) => settingsService.update(newSettings));

    // TODO: Re-implement backup/logo if critical, for now focus on core logic
    ipcMain.handle('create-backup', async () => { return { success: false, error: 'Not implemented in SQL mode yet' } });
    ipcMain.handle('upload-logo', async () => { return { success: false, error: 'Not implemented in SQL mode yet' } });
    ipcMain.handle('get-logo', async () => { return (settingsService.getAll() as any).logo_path; }); // Stored as base64 in value
    ipcMain.handle('upload-background-image', async () => { return { success: false, error: 'Not implemented' } });


}
