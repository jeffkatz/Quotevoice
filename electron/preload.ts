import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    // Clients
    getClients: () => ipcRenderer.invoke('get-clients'),
    getClient: (id: number) => ipcRenderer.invoke('get-client', id),
    createClient: (client: any) => ipcRenderer.invoke('create-client', client),
    updateClient: (id: number, updates: any) => ipcRenderer.invoke('update-client', id, updates),
    deleteClient: (id: number) => ipcRenderer.invoke('delete-client', id),

    // Invoices
    getInvoices: () => ipcRenderer.invoke('get-invoices'),
    getInvoice: (id: number) => ipcRenderer.invoke('get-invoice', id),
    createInvoice: (data: any) => ipcRenderer.invoke('create-invoice', data),
    updateInvoice: (id: number, updates: any) => ipcRenderer.invoke('update-invoice', id, updates),
    updateInvoiceStatus: (id: number, status: string) => ipcRenderer.invoke('update-invoice-status', id, status),
    deleteInvoice: (id: number) => ipcRenderer.invoke('delete-invoice', id),
    addPayment: (invoiceId: number, payment: any) => ipcRenderer.invoke('add-payment', invoiceId, payment),

    // Dashboard
    getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),
    createBackup: () => ipcRenderer.invoke('create-backup'),

    // Logo
    uploadLogo: () => ipcRenderer.invoke('upload-logo'),
    getLogo: () => ipcRenderer.invoke('get-logo'),
    uploadBackgroundImage: () => ipcRenderer.invoke('upload-background-image'),


});

contextBridge.exposeInMainWorld('electron', {
    onNavigate: (callback: (path: string) => void) => ipcRenderer.on('navigate-to', (_event, path) => callback(path))
});
