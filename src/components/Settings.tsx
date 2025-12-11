import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, Building2, CreditCard, Receipt, Image, Palette } from 'lucide-react';

type SettingsData = {
    company_name: string;
    company_email: string;
    company_address: string;
    company_phone: string;
    tax_rate: number;
    currency_symbol: string;
    bank_details: string;
    invoice_prefix: string;
    primary_color: string;
    font_family: string;
    accent_color: string;
};

export default function Settings() {
    const { register, handleSubmit, reset } = useForm<SettingsData>();
    const [logo, setLogo] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        if (window.api) {
            try {
                const settings = await window.api.getSettings();
                reset(settings);
                const logoData = await window.api.getLogo();
                setLogo(logoData);
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    };

    const onSubmit = async (data: SettingsData) => {
        if (!window.api) return;

        setSaving(true);
        setMessage(null);

        try {
            const result = await window.api.updateSettings({
                ...data,
                tax_rate: Number(data.tax_rate)
            });

            if (result) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings' });
            }
        } catch (e) {
            console.error('Failed to save:', e);
            setMessage({ type: 'error', text: 'An error occurred while saving' });
        }

        setSaving(false);
    };

    const handleLogoUpload = async () => {
        if (!window.api) return;

        try {
            const result = await window.api.uploadLogo();
            if (result.success) {
                const logoData = await window.api.getLogo();
                setLogo(logoData);
                setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (e) {
            console.error('Failed to upload logo:', e);
            setMessage({ type: 'error', text: 'Failed to upload logo' });
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
                    <p className="text-slate-500">Configure your business details</p>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Company Logo */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Image className="text-purple-600" size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800">Company Logo</h2>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                            {logo ? (
                                <img src={logo} alt="Company Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Building2 size={32} className="mx-auto mb-2" />
                                    <span className="text-xs">No logo</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={handleLogoUpload}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <Upload size={18} /> Upload Logo
                            </button>
                            <p className="text-xs text-slate-500 mt-2">PNG, JPG or SVG. Max 2MB.</p>
                        </div>
                    </div>
                </div>

                {/* Company Profile */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="text-blue-600" size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800">Company Profile</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Company Name *</label>
                            <input
                                {...register('company_name', { required: true })}
                                type="text"
                                placeholder="Your Business Name"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <input
                                {...register('company_email')}
                                type="email"
                                placeholder="billing@yourcompany.co.za"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phone</label>
                            <input
                                {...register('company_phone')}
                                type="tel"
                                placeholder="+27 12 345 6789"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Address</label>
                            <textarea
                                {...register('company_address')}
                                rows={3}
                                placeholder="123 Main Street&#10;Sandton, Johannesburg&#10;2196"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Banking Details */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CreditCard className="text-green-600" size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800">Banking Details</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Bank Account Information</label>
                        <textarea
                            {...register('bank_details')}
                            rows={5}
                            placeholder="Bank: FNB&#10;Account Name: Your Business&#10;Account Number: 1234567890&#10;Branch Code: 250655&#10;Account Type: Business Cheque"
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500">This will appear on your invoices for client payments</p>
                    </div>
                </div>

                {/* Invoice Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Receipt className="text-amber-600" size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800">Invoice Settings</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Invoice Prefix</label>
                            <input
                                {...register('invoice_prefix')}
                                type="text"
                                placeholder="INV"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Currency Symbol</label>
                            <input
                                {...register('currency_symbol')}
                                type="text"
                                placeholder="R"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">VAT Rate (%)</label>
                            <input
                                {...register('tax_rate', { valueAsNumber: true })}
                                type="number"
                                step="0.1"
                                placeholder="15"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Style & Typography */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                            <Palette className="text-pink-600" size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800">Style & Typography</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Primary Color</label>
                            <div className="flex gap-2">
                                <input
                                    {...register('primary_color')}
                                    type="color"
                                    className="w-12 h-12 rounded-lg border border-slate-300 cursor-pointer"
                                />
                                <input
                                    {...register('primary_color')}
                                    type="text"
                                    placeholder="#0ea5e9"
                                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Accent Color</label>
                            <div className="flex gap-2">
                                <input
                                    {...register('accent_color')}
                                    type="color"
                                    className="w-12 h-12 rounded-lg border border-slate-300 cursor-pointer"
                                />
                                <input
                                    {...register('accent_color')}
                                    type="text"
                                    placeholder="#0284c7"
                                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Font Family</label>
                            <select
                                {...register('font_family')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Poppins">Poppins</option>
                                <option value="Montserrat">Montserrat</option>
                                <option value="Arial">Arial</option>
                                <option value="Georgia">Georgia</option>
                            </select>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">These settings affect the appearance of your PDF documents</p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25"
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
