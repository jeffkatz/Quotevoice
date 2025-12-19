import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit2, X, User, Mail, Phone, CreditCard, LayoutGrid, List, FileDown, Upload } from 'lucide-react';
import clsx from 'clsx';
import type { Client } from '../../../types';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import Modal from '../../../components/Modal';

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, reset, setValue, formState: { isDirty } } = useForm<Client>();

    const { showModal: showUnsavedModal, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty && isModalOpen);

    const fetchClients = async () => {
        if (window.api) {
            const data = await window.api.getClients();
            // Sort by latest (assuming ID increments or created_at exists)
            setClients(data.sort((a, b) => b.id - a.id));
        } else {
            // Mock data
            setClients([
                { id: 1, name: 'Acme Corp', email: 'billing@acme.com', phone: '+1 555 0123', address: '123 Acme Way', tax_id: 'US123456' },
                { id: 2, name: 'Stark Industries', email: 'tony@stark.com', phone: '+1 555 9999', address: '10880 Malibu Point', tax_id: 'US987654' },
            ] as Client[]);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleOpenModal = () => {
        setEditingId(null);
        reset({ name: '', email: '', phone: '', address: '', tax_id: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (client: Client) => {
        setEditingId(client.id);
        setValue('name', client.name);
        setValue('email', client.email);
        setValue('phone', client.phone);
        setValue('address', client.address);
        setValue('tax_id', client.tax_id);
        setIsModalOpen(true);
    }

    const onSubmit = async (data: Client) => {
        if (window.api) {
            if (editingId) {
                await window.api.updateClient(editingId, data);
            } else {
                await window.api.createClient(data);
            }
            fetchClients();
        } else {
            // Mock submit
            if (editingId) {
                setClients(clients.map(c => c.id === editingId ? { ...c, ...data } : c));
            } else {
                setClients([...clients, { ...data, id: Date.now() } as Client]);
            }
        }
        setIsModalOpen(false);
        reset();
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(clients, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `clients_backup_${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                try {
                    const importedClients: Client[] = JSON.parse(text);
                    if (Array.isArray(importedClients)) {
                        let count = 0;
                        for (const client of importedClients) {
                            // Basic validation
                            if (client.name) {
                                if (window.api) {
                                    // Check if exists to avoid dupes? or just create always?
                                    // For simplicity, just create. user can clean up.
                                    await window.api.createClient(client);
                                }
                                count++;
                            }
                        }
                        alert(`Successfully imported ${count} clients.`);
                        fetchClients();
                    }
                } catch (err) {
                    console.error("Import error", err);
                    alert("Failed to import clients. Invalid JSON.");
                }
            }
        };
        reader.readAsText(fileObj);
        event.target.value = ''; // Reset
    };

    const filteredClients = clients.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputClasses = "w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all";

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clients</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your customer database</p>
                </div>
                <div className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                    <button onClick={handleImportClick} className="p-2.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm" title="Import JSON">
                        <Upload size={20} />
                    </button>
                    <button onClick={handleExport} className="p-2.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm" title="Export JSON">
                        <FileDown size={20} />
                    </button>
                    <div className="h-8 w-px bg-slate-200 mx-1"></div>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('list')} className={clsx("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                            <List size={20} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={clsx("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 font-medium active:scale-95 ml-2"
                    >
                        <Plus size={18} /> Add Client
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search clients by name or email..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-0 bg-white shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {viewMode === 'list' ? (
                <div className="card-apple overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company / Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tax ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-24 text-center">
                                        <EmptyState onAdd={handleOpenModal} />
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                                                    {client.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{client.name}</div>
                                                    <div className="text-xs text-slate-500 mt-1 max-w-[200px] leading-relaxed">{client.address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="space-y-1">
                                                {client.email && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Mail size={14} className="text-slate-400" /> {client.email}
                                                    </div>
                                                )}
                                                {client.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Phone size={14} className="text-slate-400" /> {client.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {client.tax_id ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-xs font-mono text-slate-600 border border-slate-100">
                                                    <CreditCard size={12} className="text-slate-400" />
                                                    {client.tax_id}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Not set</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
                                            <button onClick={() => handleEdit(client)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                <Edit2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredClients.length === 0 ? (
                        <div className="col-span-full py-24 text-center">
                            <EmptyState onAdd={handleOpenModal} />
                        </div>
                    ) : (
                        filteredClients.map(client => (
                            <div key={client.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                                        {client.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <button onClick={() => handleEdit(client)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg mb-1">{client.name}</h3>
                                {client.address && <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{client.address}</p>}

                                <div className="space-y-2 pt-4 border-t border-slate-50">
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Mail size={14} className="text-slate-400" /> <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Phone size={14} className="text-slate-400" /> {client.phone}
                                        </div>
                                    )}
                                    {client.tax_id && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <CreditCard size={14} className="text-slate-400" /> <span className="font-mono text-xs">{client.tax_id}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Client' : 'Add New Client'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Company / Name</label>
                                <input {...register('name', { required: true })} className={inputClasses} placeholder="e.g. Acme Corporation" autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email</label>
                                    <input {...register('email')} type="email" className={inputClasses} placeholder="billing@company.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Phone</label>
                                    <input {...register('phone')} className={inputClasses} placeholder="+1 234 567 890" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Address</label>
                                <textarea {...register('address')} className={clsx(inputClasses, "resize-none")} rows={3} placeholder="Full billing address..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Tax ID / VAT Number</label>
                                <input {...register('tax_id')} className={inputClasses} placeholder="Optional" />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium transition-colors shadow-lg shadow-slate-900/10 active:scale-95">
                                    {editingId ? 'Update Client' : 'Create Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <Modal
                isOpen={showUnsavedModal}
                title="Unsaved Changes"
                description="You have unsaved changes. Are you sure you want to leave without saving?"
                type="warning"
                confirmText="Leave"
                cancelText="Stay"
                onConfirm={confirmLeave}
                onCancel={cancelLeave}
            />
        </div>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium mb-1">No clients found</h3>
            <p className="text-slate-500 text-sm mb-4">Get started by adding your first client.</p>
            <button
                onClick={onAdd}
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors text-sm"
            >
                Add Client &rarr;
            </button>
        </div>
    );
}
