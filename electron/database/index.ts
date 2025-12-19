import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

import { SCHEMA } from './schema';

export class DatabaseManager {
    private db: Database.Database;
    private static instance: DatabaseManager;

    private constructor() {
        const dbPath = process.env.NODE_ENV === 'development'
            ? path.join(__dirname, '../../database.sqlite')
            : path.join(app.getPath('userData'), 'database.sqlite');

        console.log(`Initializing Database at: ${dbPath}`);

        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');

        this.initSchema();
    }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    private initSchema() {
        try {
            // Execute the schema directly from the bundled string
            this.db.exec(SCHEMA);
            console.log('Database schema initialized.');

            // Check for legacy data migration
            this.migrateLegacyData();

        } catch (error) {
            console.error('Failed to init schema:', error);
        }
    }

    private migrateLegacyData() {
        const legacyPath = process.env.NODE_ENV === 'development'
            ? path.join(__dirname, '../../data.json')
            : path.join(app.getPath('userData'), 'data.json');

        if (fs.existsSync(legacyPath)) {
            console.log('Found legacy data.json, starting migration...');
            try {
                const raw = fs.readFileSync(legacyPath, 'utf-8');
                const data = JSON.parse(raw);

                this.db.transaction(() => {
                    // 1. Settings
                    if (data.settings) {
                        const stmt = this.db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
                        Object.entries(data.settings).forEach(([k, v]) => {
                            stmt.run(k, JSON.stringify(v));
                        });
                    }

                    // 2. Clients
                    const invalidClientIds = new Set<number>();
                    if (Array.isArray(data.clients)) {
                        const stmt = this.db.prepare('INSERT INTO clients (id, name, email, phone, address, tax_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
                        data.clients.forEach((c: any) => {
                            try {
                                stmt.run(c.id, c.name, c.email, c.phone, c.address, c.tax_id, c.created_at || new Date().toISOString());
                            } catch (e) {
                                console.error(`Failed to migrate client ${c.id}`, e);
                                invalidClientIds.add(c.id);
                            }
                        });
                    }

                    // 3. Invoices
                    if (Array.isArray(data.invoices)) {
                        const invStmt = this.db.prepare(`
                            INSERT INTO invoices (
                                id, client_id, invoice_number, invoice_name, type, status, 
                                issue_date, due_date, subtotal, tax_rate, tax_total, grand_total, 
                                amount_paid, balance_due, notes, created_at, design_config
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `);
                        const itemStmt = this.db.prepare(`
                            INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) 
                            VALUES (?, ?, ?, ?, ?)
                        `);
                        const payStmt = this.db.prepare(`
                            INSERT INTO payments (invoice_id, amount, date, method, reference, notes) 
                            VALUES (?, ?, ?, ?, ?, ?)
                        `);

                        data.invoices.forEach((inv: any) => {
                            if (invalidClientIds.has(inv.client_id)) return; // Skip orphaned invoices

                            try {
                                const subtotal = inv.subtotal || 0;
                                const tax_total = inv.tax_total || 0;
                                const grand = inv.grand_total || 0;
                                const paid = inv.amount_paid || 0;
                                const balance = inv.balance_due !== undefined ? inv.balance_due : (grand - paid);

                                invStmt.run(
                                    inv.id, inv.client_id, inv.invoice_number, inv.invoice_name || 'Legacy Invoice',
                                    inv.type || 'invoice', inv.status || 'draft',
                                    inv.issue_date || new Date().toISOString(), inv.due_date,
                                    subtotal, inv.tax_rate || 0, tax_total, grand,
                                    paid, balance, inv.notes,
                                    inv.created_at || new Date().toISOString(),
                                    JSON.stringify(inv.design || {})
                                );

                                if (Array.isArray(inv.items)) {
                                    inv.items.forEach((item: any) => {
                                        itemStmt.run(inv.id, item.description, item.quantity, item.unit_price, (item.quantity * item.unit_price));
                                    });
                                }

                                if (Array.isArray(inv.payments)) {
                                    inv.payments.forEach((p: any) => {
                                        payStmt.run(inv.id, p.amount, p.date, p.method, p.reference, p.notes);
                                    });
                                }

                            } catch (e) {
                                console.error(`Failed to migrate invoice ${inv.id}`, e);
                            }
                        });
                    }



                })();

                // Rename legacy file to prevent re-migration
                fs.renameSync(legacyPath, legacyPath + '.bak');
                console.log('Migration completed successfully.');

            } catch (error) {
                console.error('Migration failed:', error);
            }
        }
    }

    public query<T>(sql: string, params: any[] = []): T[] {
        return this.db.prepare(sql).all(...params) as T[];
    }

    public get<T>(sql: string, params: any[] = []): T | undefined {
        return this.db.prepare(sql).get(...params) as T | undefined;
    }

    public run(sql: string, params: any[] = []): Database.RunResult {
        return this.db.prepare(sql).run(...params);
    }

    // Restored transaction method and added prepare
    public transaction<T>(fn: () => T): T {
        const tx = this.db.transaction(fn);
        return tx();
    }

    public prepare(sql: string): Database.Statement {
        return this.db.prepare(sql);
    }
}
