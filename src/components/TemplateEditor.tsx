import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Palette, Settings as SettingsIcon, Layers, Maximize, Minus, Plus as PlusIcon } from 'lucide-react';
import clsx from 'clsx';
import type { Template, DesignConfig } from '../types';
import RichTextEditor from './RichTextEditor';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import Modal from './Modal';

export default function TemplateEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<Template | null>(null);
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);
    const [previewBg, setPreviewBg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');

    // Zoom State
    const [zoom, setZoom] = useState(0.5);

    // Pan State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;

        setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        description?: string;
        type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
        onConfirm?: () => void;
    }>({ isOpen: false, title: '' });

    const { register, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm<Template>();

    // Protect unsaved changes
    const { showModal: showUnsavedModal, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty);

    // Watch values for live preview
    const watchedDesign = watch('design') || {};
    const watchedPrimaryColor = watch('design.primary_color');
    const watchedFontFamily = watch('design.font_family');
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
            showModal('Error', 'Failed to load template', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showModal = (title: string, description: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        setModalConfig({ isOpen: true, title, description, type });
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
            showModal('Success', 'Template saved successfully', 'success');
        } catch (e) {
            console.error('Failed to save template', e);
            showModal('Error', 'Failed to save template', 'error');
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
        <div className="h-screen flex flex-col bg-slate-100 overflow-hidden text-sm"> {/* text-sm global for editor */}
            {/* Custom Modal */}
            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                description={modalConfig.description}
                type={modalConfig.type}
            />

            {/* Top Bar - Condensed */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center z-20 shadow-sm shrink-0 h-14">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/templates')} className="text-slate-500 hover:text-slate-900 transition-colors p-1.5 hover:bg-slate-100 rounded-lg">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-1"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">Template Editor</span>
                        <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2 leading-tight">
                            {watchedName || 'Untitled Template'}
                        </h1>
                    </div>
                </div>
                <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-1.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-sm font-medium active:scale-95 disabled:opacity-50 text-xs"
                >
                    <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Controls Panel - Responsive Width */}
                <div className="w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        {['content', 'style', 'advanced'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={clsx(
                                    "flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors",
                                    activeTab === tab
                                        ? "border-blue-500 text-blue-600 bg-blue-50/50"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                {tab === 'content' && <Layers size={14} />}
                                {tab === 'style' && <Palette size={14} />}
                                {tab === 'advanced' && <SettingsIcon size={14} />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

                        {/* CONTENT TAB */}
                        {activeTab === 'content' && (
                            <div className="space-y-6 animate-fade-in">
                                <section className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Identity</h3>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Template Name</label>
                                        <input {...register('name', { required: true })} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                                        <textarea {...register('description')} rows={2} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none text-sm" />
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Branding</h3>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Logo</label>
                                        <div className="flex items-center gap-3">
                                            {previewLogo && <div className="p-2 border border-slate-100 rounded-lg bg-white shrink-0 shadow-sm"><img src={previewLogo} className="w-10 h-10 object-contain" /></div>}
                                            <button type="button" onClick={handleUploadLogo} className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium transition-all">
                                                Upload Logo
                                            </button>
                                        </div>
                                        {/* Logo Size Slider */}
                                        <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium uppercase tracking-wide">
                                                <span>Logo Size</span>
                                                <span>{watchedDesign.logo_size || 60}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="40"
                                                max="150"
                                                step="5"
                                                defaultValue={60}
                                                {...register('design.logo_size', { valueAsNumber: true })}
                                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Default Content</h3>
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
                                <section className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Theme</h3>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Primary Color</label>
                                        <div className="flex gap-2 items-center">
                                            <div className="relative">
                                                <input
                                                    type="color"
                                                    {...register('design.primary_color')}
                                                    className="h-9 w-9 rounded-lg p-0 border-0 overflow-hidden cursor-pointer shadow-sm ring-1 ring-slate-200 absolute opacity-0 inset-0"
                                                />
                                                <div className="h-9 w-9 rounded-lg shadow-sm ring-1 ring-slate-200" style={{ backgroundColor: watchedPrimaryColor || '#000' }} />
                                            </div>
                                            <input
                                                type="text"
                                                {...register('design.primary_color')}
                                                className="flex-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none text-xs font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Typography</label>
                                        <select {...register('design.font_family')} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none text-sm">
                                            <option value="Inter">Inter (Clean)</option>
                                            <option value="Roboto">Roboto (Geometric)</option>
                                            <option value="Open Sans">Open Sans (Neutral)</option>
                                            <option value="Times New Roman">Times New Roman (Classic)</option>
                                            <option value="Lora">Lora (Serif)</option>
                                        </select>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Layout</h3>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Page Orientation</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setValue('design.orientation', 'portrait', { shouldDirty: true })}
                                                className={clsx("p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2", watchedDesign.orientation !== 'landscape' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}
                                            >
                                                <div className="w-3 h-4 border-2 border-current rounded-[1px]" /> Portrait
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setValue('design.orientation', 'landscape', { shouldDirty: true })}
                                                className={clsx("p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2", watchedDesign.orientation === 'landscape' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}
                                            >
                                                <div className="w-4 h-3 border-2 border-current rounded-[1px]" /> Landscape
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">Content Density</label>
                                        <select {...register('design.content_spacing')} className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none text-sm">
                                            <option value="normal">Normal</option>
                                            <option value="compact">Compact</option>
                                            <option value="relaxed">Relaxed</option>
                                        </select>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Background</h3>
                                    <div className="flex items-center gap-3 mb-2">
                                        {previewBg && <div className="w-10 h-10 rounded-lg border border-slate-200 bg-cover bg-center shrink-0 shadow-sm" style={{ backgroundImage: `url(${previewBg})` }} />}
                                        <button type="button" onClick={handleUploadBg} className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium transition-all">
                                            {previewBg ? 'Replace Background' : 'Upload Background'}
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium uppercase tracking-wide">
                                            <span>Opacity</span>
                                            <span>{Math.round((watchedDesign.background_opacity || 0.1) * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.05" {...register('design.background_opacity')} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* ADVANCED TAB */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-6 animate-fade-in text-center py-8">
                                <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <SettingsIcon className="mx-auto text-slate-300 mb-2" size={32} />
                                    <p className="text-slate-500 text-xs font-medium">Advanced styling coming soon</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Right: Live Preview Area */}
                <div
                    className={clsx(
                        "flex-1 bg-slate-100/50 overflow-hidden relative flex flex-col cursor-grab active:cursor-grabbing",
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >

                    {/* Zoomable Canvas Container */}
                    <div className="flex-1 overflow-hidden flex items-center justify-center p-12 custom-scrollbar pointer-events-none">
                        <div
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                transformOrigin: 'center center',
                                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                            }}
                            className={clsx(
                                "bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative shrink-0 pointer-events-auto transition-shadow flex flex-col",
                                isLandscape ? "w-[297mm] min-h-[210mm]" : "w-[210mm] min-h-[297mm]"
                            )}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div style={{ fontFamily: watchedFontFamily || 'Inter' }} className="flex-1 flex flex-col relative">
                                {/* Background Layer */}
                                {previewBg && (
                                    <div className="absolute inset-0 z-0 pointer-events-none bg-center bg-no-repeat bg-cover"
                                        style={{ backgroundImage: `url(${previewBg})`, opacity: watchedDesign.background_opacity ?? 0.1 }} />
                                )}

                                {/* Computed Spacing Class */}
                                <div className={clsx("relative z-10 flex flex-col h-full",
                                    watchedDesign.content_spacing === 'compact' ? 'p-8' :
                                        watchedDesign.content_spacing === 'relaxed' ? 'p-16' : 'p-12'
                                )}>

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-8 flex-none">
                                        <div>
                                            {previewLogo ? (
                                                <img src={previewLogo} style={{ height: `${logoSize}px` }} className="w-auto object-contain mb-4" />
                                            ) : (
                                                <div className="text-2xl font-bold mb-4 text-slate-300 uppercase tracking-widest border-2 border-slate-200 border-dashed p-4 rounded-lg inline-block">Logo Area</div>
                                            )}
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
                                    <table className="w-full mb-8 flex-none">
                                        <thead className="border-b-2 border-slate-100">
                                            <tr>
                                                <th className="text-left py-4 font-bold text-slate-900" style={{ color: watchedPrimaryColor }}>Description</th>
                                                <th className="text-right py-4 font-bold text-slate-900" style={{ color: watchedPrimaryColor }}>Amount</th>
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
                                    <div className="flex justify-end mb-8 flex-none">
                                        <div className="w-64">
                                            <div className="flex justify-between py-2 text-xl font-bold">
                                                <span>Total</span>
                                                <span style={{ color: watchedPrimaryColor }}>1,500.00</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Spacer/Grow to push footer down */}
                                    <div className="flex-1"></div>

                                    {/* Footer */}
                                    {(watchedDesign.footer_text || watchedNotes) && (
                                        <div className="border-t border-slate-100 pt-8 mt-auto flex-none">
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

                    {/* Bottom Floating Zoom Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-md shadow-lg border border-slate-200/50 p-2 rounded-full z-20 transition-all hover:scale-105 hover:bg-white cursor-auto" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Zoom Out"
                        >
                            <Minus size={16} />
                        </button>

                        <div className="flex items-center gap-2 px-2 min-w-[120px]">
                            <input
                                type="range"
                                min="0.25"
                                max="2"
                                step="0.05"
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                            />
                            <span className="text-xs font-mono font-bold text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
                        </div>

                        <button
                            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Zoom In"
                        >
                            <PlusIcon size={16} />
                        </button>

                        <div className="w-px h-4 bg-slate-200 mx-1"></div>

                        <button
                            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Reset View"
                        >
                            <Maximize size={14} />
                        </button>
                    </div>

                </div>
            </div>
            {/* General Modals (Error, Success, etc.) */}
            <Modal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                description={modalConfig.description}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
            />

            {/* Unsaved Changes Warning Modal */}
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
