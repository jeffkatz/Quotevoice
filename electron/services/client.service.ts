import { DatabaseManager } from '../database';
import { Client } from '../types';

export class ClientService {
    private db = DatabaseManager.getInstance();

    getAll(): Client[] {
        return this.db.query<Client>('SELECT * FROM clients ORDER BY created_at DESC');
    }

    getById(id: number): Client | undefined {
        return this.db.get<Client>('SELECT * FROM clients WHERE id = ?', [id]);
    }

    create(client: Omit<Client, 'id' | 'created_at'>): Client {
        const result = this.db.run(
            `INSERT INTO clients (name, email, phone, address, tax_id) VALUES (?, ?, ?, ?, ?)`,
            [client.name, client.email, client.phone, client.address, client.tax_id]
        );
        return {
            ...client,
            id: Number(result.lastInsertRowid),
            created_at: new Date().toISOString() // Approximate for return
        };
    }

    update(id: number, updates: Partial<Client>): Client | undefined {
        const fields: string[] = [];
        const values: any[] = [];

        Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'id' && key !== 'created_at') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        });

        if (fields.length === 0) return this.getById(id);

        values.push(id);
        this.db.run(
            `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return this.getById(id);
    }

    delete(id: number): boolean {
        // SQLite will enforce Foreign Key constraints here (RESTRICT), so we can't delete if they have invoices
        try {
            const result = this.db.run('DELETE FROM clients WHERE id = ?', [id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Failed to delete client (likely has active invoices)', error);
            return false;
        }
    }
}

export const clientService = new ClientService();
