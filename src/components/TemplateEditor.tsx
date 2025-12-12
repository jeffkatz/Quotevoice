import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, LayoutTemplate, Palette, Settings as SettingsIcon, Layers } from 'lucide-react';
import clsx from 'clsx';
import type { Template, DesignConfig } from '../types';
import RichTextEditor from './RichTextEditor';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

export default function TemplateEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<Template | null>(null);
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);
    const [previewBg, setPreviewBg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');

    const { register, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm<Template>();

    // Protect unsaved changes
    useUnsavedChanges(isDirty);

    // Watch values for live preview
    const watchedDesign = watch('design') || {};
    const watchedName = watch('name');
    const watchedNotes = watch('notes');

    useEffect(() => {
        loadTemplate();
    }, [id]);

    const loadTemplate = async () => {
        if (!window.api || !id) return;
        try {
            const data = await window.api.getTemplate(Number(id));
            if (data) {
                setTemplate(data);
                reset(data);
                if (data.design?.logo_path) setPreviewLogo(data.design.logo_path);
                if (data.design?.background_image) setPreviewBg(data.design.background_image);
            }
        } catch (e) {
            console.error('Failed to load template', e);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: Template) => {
        if (!window.api || !id) return;
        setSaving(true);
        try {
            const updatedDesign: DesignConfig = {
                ...template?.design,
                ...data.design,
                logo_path: previewLogo || undefined,
                background_image: previewBg || undefined
            };

            await window.api.updateTemplate(Number(id), {
                ...data,
                design: updatedDesign
            });
            // Reset dirty state after save
            reset({ ...data, design: updatedDesign });
            alert('Template saved successfully');
        } catch (e) {
            console.error('Failed to save template', e);
            alert('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadLogo = async () => {
        if (!window.api) return;
        const result = await window.api.uploadLogo();
        if (result.success && result.base64) {
            setPreviewLogo(result.base64);
            setValue('design.logo_path', result.base64, { shouldDirty: true });
        }
    };

    const handleUploadBg = async () => {
        if (!window.api) return;
        const result = await window.api.uploadBackgroundImage();
        if (result.success && result.base64) {
            setPreviewBg(result.base64);
            setValue('design.background_image', result.base64, { shouldDirty: true });
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading editor...</div>;

    const isLandscape = watchedDesign.orientation === 'landscape';
    const logoSize = watchedDesign.logo_size || 60; // Default 60px height

    return (
        <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/templates')} className="text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <LayoutTemplate size={20} />
                        {watchedName || 'Untitled Template'}
                    </h1>
                </div>
                <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 font-medium active:scale-95 disabled:opacity-50"
                >
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Controls Panel */}
                <div className="w-[420px] bg-white border-r border-slate-200 flex flex-col z-10">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('content')}
                            className={clsx("flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors", activeTab === 'content' ? "border-blue-500 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-700")}
                        >
                            <Layers size={16} /> Content
                        </button>
                        <button
                            onClick={() => setActiveTab('style')}
                            className={clsx("flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors", activeTab === 'style' ? "border-purple-500 text-purple-600 bg-purple-50/50" : "border-transparent text-slate-500 hover:text-slate-700")}
                        >
                            <Palette size={16} /> Styles
                        </button>
                        <button
                            onClick={() => setActiveTab('advanced')}
                            className={clsx("flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors", activeTab === 'advanced' ? "border-slate-500 text-slate-700 bg-slate-50" : "border-transparent text-slate-500 hover:text-slate-700")}
                        >
                            <SettingsIcon size={16} /> Advanced
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                        {/* CONTENT TAB */}
                        {activeTab === 'content' && (
                            <div className="space-y-6 animate-fade-in">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Template Identity</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                                        <input {...register('name', { required: true })} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea {...register('description')} rows={2} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none" />
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logo & Branding</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
                                        <div className="flex items-center gap-3">
                                            {previewLogo && <div className="p-2 border border-slate-100 rounded-lg bg-white"><img src={previewLogo} className="w-10 h-10 object-contain" /></div>}
                                            <button type="button" onClick={handleUploadLogo} className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-all">
                                                Upload Logo
                                            </button>
                                        </div>
                                        {/* Logo Size Slider */}
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>Size</span>
                                                <span>{watchedDesign.logo_size || 60}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="40"
                                                max="150"
                                                step="5"
                                                defaultValue={60}
                                                {...register('design.logo_size', { valueAsNumber: true })}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Default Content</h3>
                                    <RichTextEditor
                                        label="Header Text"
                                        value={watchedDesign.header_text || ''}
                                        onChange={(val) => setValue('design.header_text', val, { shouldDirty: true })}
                                    />
                                    <RichTextEditor
                                        label="Default Notes / Terms"
                                        value={watchedNotes || ''}
                                        onChange={(val) => setValue('notes', val, { shouldDirty: true })}
                                    />
                                    <RichTextEditor
                                        label="Footer Text"
                                        value={watchedDesign.footer_text || ''}
                                        onChange={(val) => setValue('design.footer_text', val, { shouldDirty: true })}
                                    />
                                </section>
                            </div>
                        )}

                        {/* STYLES TAB */}
                        {activeTab === 'style' && (
                            <div className="space-y-6 animate-fade-in">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Colors & Typography</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Primary Color</label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                {...register('design.primary_color')}
                                                className="h-10 w-10 rounded-lg p-0 border-0 overflow-hidden cursor-pointer shadow-sm ring-1 ring-slate-200"
                                            />
                                            <input
                                                type="text"
                                                {...register('design.primary_color')}
                                                className="flex-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none text-sm font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Font Family</label>
                                        <select {...register('design.font_family')} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none">
                                            <option value="Inter">Inter (Clean)</option>
                                            <option value="Roboto">Roboto (Geometric)</option>
                                            <option value="Open Sans">Open Sans (Neutral)</option>
                                            <option value="Times New Roman">Times New Roman (Classic)</option>
                                            <option value="Lora">Lora (Serif)</option>
                                        </select>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Layout & Spacing</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Page Orientation</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setValue('design.orientation', 'portrait', { shouldDirty: true })}
                                                className={clsx("p-3 rounded-xl border text-sm font-medium transition-all", watchedDesign.orientation !== 'landscape' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                                            >
                                                Portrait
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setValue('design.orientation', 'landscape', { shouldDirty: true })}
                                                className={clsx("p-3 rounded-xl border text-sm font-medium transition-all", watchedDesign.orientation === 'landscape' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                                            >
                                                Landscape
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Content Density</label>
                                        <select {...register('design.content_spacing')} className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none">
                                            <option value="normal">Normal</option>
                                            <option value="compact">Compact</option>
                                            <option value="relaxed">Relaxed</option>
                                        </select>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Background Image</h3>
                                    <div className="flex items-center gap-3 mb-2">
                                        {previewBg && <div className="w-12 h-12 rounded-lg border border-slate-200 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${previewBg})` }} />}
                                        <button type="button" onClick={handleUploadBg} className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-all">
                                            {previewBg ? 'Replace Background' : 'Upload Background'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 w-12">Opacity</span>
                                        <input type="range" min="0" max="1" step="0.05" {...register('design.background_opacity')} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* ADVANCED TAB */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-6 animate-fade-in text-center py-8">
                                <p className="text-slate-400 text-sm">Advanced layout controls and CSS overrides coming soon.</p>
                                {/* Placeholder for Metadata or JSON view if needed by advanced users */}
                            </div>
                        )}

                    </div>
                </div>

                {/* Right: Live Preview */}
                <div className="flex-1 bg-slate-200/50 p-8 overflow-auto flex justify-center items-start">
                    <div
                        className={clsx(
                            "bg-white shadow-2xl relative transition-all duration-300 ease-in-out shrink-0",
                            isLandscape ? "w-[297mm] min-h-[210mm]" : "w-[210mm] min-h-[297mm]"
                        )}
                        style={{ fontFamily: watchedDesign.font_family || 'Inter' }}
                    >
                        {/* Background Layer */}
                        {previewBg && (
                            <div className="absolute inset-0 z-0 pointer-events-none bg-center bg-no-repeat bg-cover"
                                style={{ backgroundImage: `url(${previewBg})`, opacity: watchedDesign.background_opacity ?? 0.1 }} />
                        )}

                        {/* Computed Spacing Class */}
                        <div className={clsx("relative z-10 flex flex-col h-full min-h-[inherit]",
                            watchedDesign.content_spacing === 'compact' ? 'p-8' :
                                watchedDesign.content_spacing === 'relaxed' ? 'p-16' : 'p-12'
                        )}>

                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    {previewLogo ? (
                                        <img src={previewLogo} style={{ height: `${logoSize}px` }} className="w-auto object-contain mb-4" />
                                    ) : (
                                        <div className="text-3xl font-bold mb-4 text-slate-200 uppercase tracking-widest border-2 border-slate-200 border-dashed p-4 rounded-lg inline-block">Logo Area</div>
                                    )}
                                    <div className="space-y-2 opacity-50">
                                        <div className="h-4 w-48 bg-slate-100 rounded"></div>
                                        <div className="h-4 w-32 bg-slate-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase opacity-90">INVOICE</h1>
                                    {watchedDesign.header_text && (
                                        <div
                                            className="mt-4 text-sm text-slate-600 prose prose-sm max-w-[200px] ml-auto text-right"
                                            dangerouslySetInnerHTML={{ __html: watchedDesign.header_text }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Items Mock */}
                            <table className="w-full mb-8">
                                <thead className="border-b-2 border-slate-100">
                                    <tr>
                                        <th className="text-left py-4 font-bold text-slate-900" style={{ color: watchedDesign.primary_color }}>Description</th>
                                        <th className="text-right py-4 font-bold text-slate-900" style={{ color: watchedDesign.primary_color }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-50">
                                        <td className="py-4 text-slate-700">Web Design Services (Example Item)</td>
                                        <td className="py-4 text-right font-bold text-slate-900">1,200.00</td>
                                    </tr>
                                    <tr className="border-b border-slate-50">
                                        <td className="py-4 text-slate-700">Hosting Setup</td>
                                        <td className="py-4 text-right font-bold text-slate-900">300.00</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Total Mock */}
                            <div className="flex justify-end mb-auto">
                                <div className="w-64">
                                    <div className="flex justify-between py-2 text-xl font-bold">
                                        <span>Total</span>
                                        <span style={{ color: watchedDesign.primary_color }}>1,500.00</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            {(watchedDesign.footer_text || watchedNotes) && (
                                <div className="border-t border-slate-100 pt-8 mt-12">
                                    {watchedNotes && (
                                        <div className="mb-8 prose prose-sm max-w-none text-slate-600">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Terms & Notes</h4>
                                            <div dangerouslySetInnerHTML={{ __html: watchedNotes }} />
                                        </div>
                                    )}
                                    {watchedDesign.footer_text && (
                                        <div
                                            className="text-center text-sm text-slate-400 prose prose-sm max-w-none mx-auto"
                                            dangerouslySetInnerHTML={{ __html: watchedDesign.footer_text }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
