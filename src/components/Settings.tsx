import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save, Upload, Building2, CreditCard, Receipt, Image, Monitor, FolderOpen } from 'lucide-react';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import RichTextEditor from './RichTextEditor';
import Modal from './Modal';

type SettingsData = {
    company_name: string;
    company_email: string;
    company_address: string;
    company_phone: string;
    tax_rate: number;
    currency_symbol: string;
    bank_details: string;
    invoice_prefix: string;
    default_template_id?: number;
    app_theme?: 'light' | 'dark' | 'system';
    data_directory?: string;
};

export default function Settings() {
    const { register, handleSubmit, control, reset, formState: { isDirty } } = useForm<SettingsData>();
    const [logo, setLogo] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const { showModal: showUnsavedModal, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty && !saving);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        if (window.api) {
            try {
                const [settings, logoData] = await Promise.all([
                    window.api.getSettings(),
                    window.api.getLogo()
                ]);
                reset(settings);
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

    const inputClasses = "w-full p-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all";

    return (
        <div className="p-8 max-w-[1200px] mx-auto animate-fade-in pb-32">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 font-medium mt-1">Configure your business and application</p>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Company Logo */}
                <div className="card-apple p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Image className="text-purple-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Company Logo</h2>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 overflow-hidden hover:border-slate-300 transition-colors">
                            {logo ? (
                                <img src={logo} alt="Company Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                                    <span className="text-xs font-medium">No logo</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={handleLogoUpload}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
                            >
                                <Upload size={18} /> Upload Logo
                            </button>
                            <p className="text-xs text-slate-500 mt-2 font-medium">PNG, JPG or SVG. Max 2MB.</p>
                        </div>
                    </div>
                </div>

                {/* Company Profile */}
                <div className="card-apple p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Building2 className="text-blue-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Company Profile</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Company Name</label>
                            <input
                                {...register('company_name', { required: true })}
                                type="text"
                                placeholder="Your Business Name"
                                className={inputClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                            <input
                                {...register('company_email')}
                                type="email"
                                placeholder="billing@yourcompany.co.za"
                                className={inputClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Phone</label>
                            <input
                                {...register('company_phone')}
                                type="tel"
                                placeholder="+27 12 345 6789"
                                className={inputClasses}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Address</label>
                            <Controller
                                name="company_address"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor value={field.value || ''} onChange={field.onChange} placeholder="123 Main Street..." />
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Banking Details */}
                <div className="card-apple p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <CreditCard className="text-green-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Banking Details</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Bank Account Information</label>
                        <Controller
                            name="bank_details"
                            control={control}
                            render={({ field }) => (
                                <RichTextEditor value={field.value || ''} onChange={field.onChange} placeholder="Bank Name: FNB..." />
                            )}
                        />
                        <p className="text-xs text-slate-500 ml-1">This will appear on your invoices for client payments</p>
                    </div>
                </div>

                {/* Application Settings */}
                <div className="card-apple p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Monitor className="text-slate-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Application Settings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">App Theme</label>
                            <select {...register('app_theme')} className={inputClasses}>
                                <option value="light">Light Mode</option>
                                <option value="dark">Dark Mode</option>
                                <option value="system">System Default</option>
                            </select>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Data Storage Directory</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        {...register('data_directory')}
                                        type="text"
                                        readOnly
                                        disabled
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border-0 ring-1 ring-slate-200 text-slate-500 cursor-not-allowed"
                                        placeholder="C:\Users\User\Documents\SandBox\Quotevoice\data"
                                    />
                                </div>
                                {/* Future: Add ability to change directory */}
                            </div>
                            <p className="text-xs text-slate-400 ml-1">Location where your database and files are stored.</p>
                        </div>
                    </div>
                </div>

                {/* Invoice Defaults */}
                <div className="card-apple p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Receipt className="text-amber-600" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Invoice Defaults</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Invoice Prefix</label>
                            <input
                                {...register('invoice_prefix')}
                                type="text"
                                placeholder="INV"
                                className={`${inputClasses} uppercase`}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Currency Symbol</label>
                            <input
                                {...register('currency_symbol')}
                                type="text"
                                placeholder="R"
                                className={inputClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">VAT Rate (%)</label>
                            <input
                                {...register('tax_rate', { valueAsNumber: true })}
                                type="number"
                                step="0.1"
                                placeholder="15"
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-end z-40 max-w-[1200px] mx-auto rounded-t-3xl md:relative md:bg-transparent md:border-t-0 md:p-0">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

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
        </div >
    );
}
