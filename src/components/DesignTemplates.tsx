import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Palette, Upload, Image as ImageIcon, Layout, Save, CheckCircle } from 'lucide-react';

type DesignSettings = {
    primary_color: string;
    font_family: string;
    header_text: string;
    footer_text: string;
    background_opacity: number;
};

export default function DesignTemplates() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [logo, setLogo] = useState<string | null>(null);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const { register, handleSubmit, watch, setValue, reset } = useForm<DesignSettings>();

    const settings = watch();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        if (window.api) {
            const [data, logoData] = await Promise.all([
                window.api.getSettings(),
                window.api.getLogo()
            ]);
            reset(data);
            setLogo(logoData);
            setBgImage(data.background_image || null);
            setLoading(false);
        }
    };

    const onSubmit = async (data: DesignSettings) => {
        setSaving(true);
        if (window.api) {
            await window.api.updateSettings(data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        }
        setSaving(false);
    };

    const handleUploadLogo = async () => {
        if (window.api) {
            const result = await window.api.uploadLogo();
            if (result.success && result.base64) {
                setLogo(result.base64);
            }
        }
    };

    const handleUploadBg = async () => {
        if (window.api) {
            const result = await window.api.uploadBackgroundImage();
            if (result.success && result.base64) {
                setBgImage(result.base64);
                setValue('background_image' as any, result.base64); // update form state if needed
                // But wait, setValue logic for background_image might be tricky if it's not in DesignSettings type strictly?
                // The API updateSettings merges whatever we send.
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading editor...</div>;

    // Dummy Data for Preview
    const dummyInvoice = {
        invoice_number: 'INV-2024-001',
        issue_date: '2024-03-20',
        due_date: '2024-04-20',
        client: {
            name: 'Acme Corp Ltd',
            address: '123 Business Park\nSandton, 2196',
            email: 'accounts@acmeco.com',
            tax_id: '4200123456'
        },
        items: [
            { description: 'Professional Services - March', quantity: 1, unit_price: 5000, total_price: 5000 },
            { description: 'Consultation Fee', quantity: 2, unit_price: 1500, total_price: 3000 }
        ],
        subtotal: 8000,
        tax_total: 1200,
        grand_total: 9200
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Left Control Panel */}
            <div className="w-[400px] bg-white border-r border-slate-200 overflow-y-auto flex flex-col z-10 shadow-xl">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-20">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Layout className="text-brand-600" size={24} /> Template Editor
                    </h1>
                </div>

                <div className="p-6 space-y-8 flex-1">
                    {/* Branding Section */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ImageIcon size={16} /> Branding
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Company Logo</label>
                                <div className="flex items-center gap-4">
                                    {logo && (
                                        <div className="w-16 h-16 border rounded-lg p-1 bg-slate-50">
                                            <img src={logo} className="w-full h-full object-contain" alt="Logo" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleUploadLogo}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Upload size={16} /> Upload Logo
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Background Image</label>
                                <div className="flex items-center gap-4">
                                    {bgImage && (
                                        <div className="w-16 h-16 border rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}></div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleUploadBg}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Upload size={16} /> Upload Image
                                    </button>
                                </div>
                                <div className="mt-3">
                                    <label className="text-xs text-slate-500 mb-1 block">Opacity: {settings.background_opacity}</label>
                                    <input
                                        {...register('background_opacity', { valueAsNumber: true })}
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        className="w-full accent-brand-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-slate-100" />

                    {/* Styles Section */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Palette size={16} /> Styles
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        {...register('primary_color')}
                                        type="color"
                                        className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
                                    />
                                    <input
                                        {...register('primary_color')}
                                        type="text"
                                        className="flex-1 p-2 border border-slate-300 rounded-lg text-sm font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Font Family</label>
                                <select
                                    {...register('font_family')}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="Inter">Inter</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Open Sans">Open Sans</option>
                                    <option value="Montserrat">Montserrat</option>
                                    <option value="Georgia">Georgia</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <hr className="border-slate-100" />

                    {/* Header & Footer */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Layout size={16} /> Header & Footer
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Header (Top Right)</label>
                                <textarea
                                    {...register('header_text')}
                                    rows={2}
                                    placeholder="e.g. Reg: 2024/000/00"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start of Footer Text</label>
                                <textarea
                                    {...register('footer_text')}
                                    rows={3}
                                    placeholder="e.g. Terms & Conditions apply..."
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                ></textarea>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Save Bar */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 sticky bottom-0">
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl hover:bg-brand-700 transition font-medium shadow-lg shadow-brand-500/20"
                    >
                        {saving ? 'Saving...' : success ? <><CheckCircle size={20} /> Saved Changes</> : <><Save size={20} /> Save Template</>}
                    </button>
                </div>
            </div>

            {/* Right Preview Panel */}
            <div className="flex-1 bg-slate-200/50 p-8 overflow-y-auto flex justify-center items-start">
                <div
                    className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-2xl relative transition-all duration-300 ease-in-out print:shadow-none"
                    style={{ fontFamily: settings.font_family }}
                >
                    {/* Background Image Layer */}
                    {bgImage && (
                        <div
                            className="absolute inset-0 z-0 pointer-events-none bg-center bg-no-repeat bg-contain"
                            style={{
                                backgroundImage: `url(${bgImage})`,
                                opacity: settings.background_opacity
                            }}
                        />
                    )}

                    {/* Content Layer */}
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                {logo ? (
                                    <img src={logo} alt="Logo" className="h-16 w-auto object-contain mb-4" />
                                ) : (
                                    <div className="text-2xl font-bold mb-4" style={{ color: settings.primary_color }}>
                                        My Company Ltd
                                    </div>
                                )}
                                <div className="text-sm text-slate-500">123 Business Road, City</div>
                                <div className="text-sm text-slate-500">VAT: 4920123456</div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight">INVOICE</h1>
                                <div className="text-lg font-mono text-slate-600 mt-1">{dummyInvoice.invoice_number}</div>
                                {settings.header_text && (
                                    <div className="mt-2 text-xs text-slate-400 whitespace-pre-line max-w-[200px] ml-auto">
                                        {settings.header_text}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Client & Dates */}
                        <div className="flex justify-between mb-10 pb-8 border-b border-slate-200">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</div>
                                <div className="font-bold text-lg text-slate-800">{dummyInvoice.client.name}</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line">{dummyInvoice.client.address}</div>
                            </div>
                            <div className="text-right text-sm">
                                <div className="mb-1"><span className="text-slate-500 mr-4">Issue Date:</span> <span className="font-medium">{dummyInvoice.issue_date}</span></div>
                                <div><span className="text-slate-500 mr-4">Due Date:</span> <span className="font-medium">{dummyInvoice.due_date}</span></div>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="text-left py-3 font-bold text-slate-700 text-sm">Description</th>
                                    <th className="text-right py-3 font-bold text-slate-700 text-sm">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dummyInvoice.items.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-4 text-slate-700">
                                            <div>{item.description}</div>
                                        </td>
                                        <td className="py-4 text-right font-medium text-slate-800">
                                            R{item.total_price.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end mb-12">
                            <div className="w-72">
                                <div className="flex justify-between py-2 text-slate-600"><span>Subtotal</span><span>R{dummyInvoice.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between py-2 text-slate-600"><span>VAT (15%)</span><span>R{dummyInvoice.tax_total.toFixed(2)}</span></div>
                                <div className="flex justify-between py-3 border-t-2 border-slate-900 font-bold text-lg">
                                    <span>Total</span>
                                    <span style={{ color: settings.primary_color }}>R{dummyInvoice.grand_total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Text */}
                        {settings.footer_text && (
                            <div className="border-t border-slate-200 pt-6 text-center text-sm text-slate-500 whitespace-pre-line">
                                {settings.footer_text}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
