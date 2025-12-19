import { DatabaseManager } from '../database';
import { Settings } from '../types';

export class SettingsService {
    private db = DatabaseManager.getInstance();

    getAll(): Settings {
        const rows = this.db.query<{ key: string, value: string }>('SELECT key, value FROM settings');
        const settings: any = {};

        // Default settings
        const defaults: Settings = {
            tax_rate: 15,
            currency_symbol: 'R',
            invoice_prefix: 'INV',
            next_invoice_number: 1,
            next_quote_number: 1,
            primary_color: '#0ea5e9',
            font_family: 'Inter',
            background_opacity: 0.1
        };

        // Merge defaults
        Object.assign(settings, defaults);

        // Overwrite with DB values
        rows.forEach(row => {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch (e) {
                settings[row.key] = row.value;
            }
        });

        return settings;
    }

    update(updates: Partial<Settings>): Settings {
        this.db.transaction(() => {
            Object.entries(updates).forEach(([key, value]) => {
                const strValue = JSON.stringify(value);
                this.db.run(
                    `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`,
                    [key, strValue, strValue]
                );
            });
        });

        return this.getAll();
    }

    // Specific helper for incrementing numbers
    incrementInvoiceNumber(type: 'invoice' | 'quotation'): string {
        return this.db.transaction(() => {
            const settings = this.getAll();
            const prefix = type === 'invoice' ? (settings.invoice_prefix || 'INV') : 'QT';
            const key = type === 'invoice' ? 'next_invoice_number' : 'next_quote_number';
            const num = (settings as any)[key] || 1;

            const paddedNum = String(num).padStart(4, '0');
            const fullNumber = `${prefix}-${paddedNum}`;

            this.update({ [key]: num + 1 });

            return fullNumber;
        });
    }
}

export const settingsService = new SettingsService();
