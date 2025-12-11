import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit2, X } from 'lucide-react';

type Client = {
    id?: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    tax_id: string;
};

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm<Client>();
    const [searchTerm, setSearchTerm] = useState('');

    const fetchClients = async () => {
        if (window.api) {
            const data = await window.api.getClients();
            setClients(data);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const onSubmit = async (data: Client) => {
        if (window.api) {
            await window.api.createClient(data);
            reset();
            setIsModalOpen(false);
            fetchClients();
        }
    };

    const filteredClients = clients.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Clients</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                >
                    <Plus size={20} /> Add Client
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Tax ID</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-800">{client.name}</div>
                                    <div className="text-sm text-slate-500">{client.address}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-slate-700">{client.email}</div>
                                    <div className="text-sm text-slate-500">{client.phone}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-sm text-slate-600">
                                    {client.tax_id}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-brand-600 mr-3"><Edit2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {filteredClients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    No clients found. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Add New Client</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company / Name</label>
                                <input {...register('name', { required: true })} className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input {...register('email')} className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input {...register('phone')} className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea {...register('address')} className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none" rows={3}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / VAT</label>
                                <input {...register('tax_id')} className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none" />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Create Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
