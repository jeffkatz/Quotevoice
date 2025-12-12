import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, LayoutTemplate, LayoutGrid, List } from 'lucide-react';
import type { Template } from '../types';

export default function Templates() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        if (!window.api) return;
        try {
            const data = await window.api.getTemplates();
            setTemplates(data);
        } catch (e) {
            console.error('Failed to load templates', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            await window.api.deleteTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (e) {
            console.error('Failed to delete template', e);
            alert('Failed to delete template');
        }
    };

    const handleCreate = async () => {
        try {
            // Create a default new template
            const newTemplate = await window.api.createTemplate({
                name: 'New Template',
                description: 'Custom template description',
                items: [],
                notes: '',
                design: {
                    orientation: 'portrait',
                    primary_color: '#000000',
                    font_family: 'Inter',
                    background_opacity: 0.1
                }
            });
            navigate(`/templates/${newTemplate.id}`);
        } catch (e) {
            console.error('Failed to create template', e);
            alert('Failed to create template');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading templates...</div>;

    return (
        <div className="max-w-7xl mx-auto p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Templates</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage your document templates</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 font-medium active:scale-95"
                    >
                        <Plus size={18} /> Create New Template
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {templates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => navigate(`/templates/${template.id}`)}
                            className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden flex flex-col h-[300px]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex-1 bg-slate-50 rounded-lg mb-4 relative overflow-hidden border border-slate-100 group-hover:border-blue-100 transition-colors">
                                {/* Thumbnail Simulation */}
                                <div className="absolute inset-4 bg-white shadow-sm rounded-sm p-4 transform group-hover:scale-[1.02] transition-transform duration-500">
                                    <div className="space-y-2 opacity-30">
                                        <div className="h-4 bg-slate-900 w-1/2 mb-4" />
                                        <div className="h-2 bg-slate-200 w-full" />
                                        <div className="h-2 bg-slate-200 w-full" />
                                        <div className="h-2 bg-slate-200 w-2/3" />
                                        <div className="mt-8 space-y-2">
                                            <div className="flex justify-between"><div className="w-16 h-2 bg-slate-200" /><div className="w-8 h-2 bg-slate-200" /></div>
                                            <div className="flex justify-between"><div className="w-16 h-2 bg-slate-200" /><div className="w-8 h-2 bg-slate-200" /></div>
                                            <div className="flex justify-between"><div className="w-16 h-2 bg-slate-200" /><div className="w-8 h-2 bg-slate-200" /></div>
                                        </div>
                                    </div>
                                    {/* Overlay Info */}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: template.design?.primary_color || '#000' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{template.name}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{template.description || 'Professional Document'}</p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, template.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Template"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="bg-slate-100 px-2 py-1 rounded-md">{template.design?.orientation || 'Portrait'}</span>
                                    <span>{new Date(template.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card-apple overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Icon</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Template Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Orientation</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Created</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {templates.map(template => (
                                <tr
                                    key={template.id}
                                    onClick={() => navigate(`/templates/${template.id}`)}
                                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <LayoutTemplate size={20} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-900">{template.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm max-w-[300px] truncate">
                                        {template.description || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                                            {template.design?.orientation || 'Portrait'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 text-sm">
                                        {new Date(template.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => handleDelete(e, template.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {templates.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 mt-8">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                        <LayoutTemplate size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Templates Yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your first template to start generating professional documents.</p>
                    <button
                        onClick={handleCreate}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-colors font-medium shadow-sm"
                    >
                        Create Template
                    </button>
                </div>
            )}
        </div>
    );
}
