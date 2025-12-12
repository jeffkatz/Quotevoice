import { ipcMain } from 'electron';
import { dbService } from './db';

export function setupIpcHandlers() {
    // --- CLIENTS ---
    ipcMain.handle('get-clients', async () => {
        return dbService.getClients();
    });

    ipcMain.handle('get-client', async (_event: any, id: number) => {
        return dbService.getClient(id);
    });

    ipcMain.handle('create-client', async (_event: any, client: any) => {
        return dbService.createClient(client);
    });

    ipcMain.handle('update-client', async (_event: any, id: number, updates: any) => {
        return dbService.updateClient(id, updates);
    });

    ipcMain.handle('delete-client', async (_event: any, id: number) => {
        return dbService.deleteClient(id);
    });

    // --- INVOICES ---
    ipcMain.handle('get-invoices', async () => {
        return dbService.getInvoices();
    });

    ipcMain.handle('get-invoice', async (_event: any, id: number) => {
        return dbService.getInvoice(id);
    });

    ipcMain.handle('create-invoice', async (_event: any, data: any) => {
        return dbService.createInvoice(data);
    });

    ipcMain.handle('update-invoice', async (_event: any, id: number, updates: any) => {
        return dbService.updateInvoice(id, updates);
    });

    ipcMain.handle('update-invoice-status', async (_event: any, id: number, status: any) => {
        return dbService.updateInvoiceStatus(id, status);
    });

    ipcMain.handle('delete-invoice', async (_event: any, id: number) => {
        return dbService.deleteInvoice(id);
    });

    ipcMain.handle('add-payment', async (_event: any, invoiceId: number, payment: any) => {
        return dbService.addPayment(invoiceId, payment);
    });

    // --- DASHBOARD STATS ---
    ipcMain.handle('get-dashboard-stats', async () => {
        return dbService.getStats();
    });

    // --- SETTINGS ---
    ipcMain.handle('get-settings', async () => {
        return dbService.getSettings();
    });

    ipcMain.handle('update-settings', async (_event: any, newSettings: any) => {
        return dbService.updateSettings(newSettings);
    });

    ipcMain.handle('create-backup', async () => {
        return dbService.createBackup();
    });

    // --- LOGO ---
    ipcMain.handle('upload-logo', async () => {
        return dbService.uploadLogo();
    });

    ipcMain.handle('get-logo', async () => {
        return dbService.getLogoBase64();
    });

    ipcMain.handle('upload-background-image', async () => {
        return dbService.uploadBackgroundImage();
    });


    // --- TEMPLATES ---
    ipcMain.handle('get-templates', async () => {
        return dbService.getTemplates();
    });

    ipcMain.handle('get-template', async (_event: any, id: number) => {
        return dbService.getTemplate(id);
    });

    ipcMain.handle('create-template', async (_event: any, template: any) => {
        return dbService.createTemplate(template);
    });

    ipcMain.handle('update-template', async (_event: any, id: number, updates: any) => {
        return dbService.updateTemplate(id, updates);
    });

    ipcMain.handle('delete-template', async (_event: any, id: number) => {
        return dbService.deleteTemplate(id);
    });
}
