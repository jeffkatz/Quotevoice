import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Template } from '../types';

export default function TemplatePicker() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleSelect = (templateId: number) => {
        navigate('/invoices/new', { state: { templateId } });
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center text-slate-500 font-medium">
            Loading templates...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 animate-fade-in">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-8 font-medium transition-colors"
                >
                    <ArrowLeft size={16} /> Cancel
                </button>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Choose a Template</h1>
                    <p className="text-xl text-slate-500">Select a design to start your document.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => handleSelect(template.id)}
                            className="group bg-white rounded-3xl p-8 border border-slate-200 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="mb-6 flex justify-center">
                                <div className="w-24 h-32 bg-slate-100 rounded-lg shadow-inner flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform duration-300">
                                    <Layout size={32} />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-center text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{template.name}</h3>
                            <p className="text-sm text-center text-slate-500 mb-6">{template.description || 'Professional document template'}</p>

                            <div className="flex justify-center">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    Use Template <ArrowRight size={16} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
