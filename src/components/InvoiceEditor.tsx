import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, FileDown, Eye, ArrowLeft, Printer, Calendar, User, FileText, BookTemplate, SaveAll } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import clsx from 'clsx';

type FormValues = {
    client_id: number;
    issue_date: string;
    due_date: string;
    items: {
        description: string;
        quantity: number;
        unit_price: number;
    }[];
    notes: string;
    type: 'invoice' | 'quotation';
};

type Settings = {
    company_name: string;
    company_email: string;
    company_address: string;
    company_phone: string;
    tax_rate: number;
    currency_symbol: string;
    bank_details: string;
    primary_color?: string;
    font_family?: string;
};

type Template = {
    id: number;
    name: string;
    items: { description: string; quantity: number; unit_price: number; }[];
    notes: string;
};

export default function InvoiceEditor() {
    const { id } = useParams(); // For edit mode
    const navigate = useNavigate();
    const [clients, setClients] = useState<any[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [logo, setLogo] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isPreview, setIsPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedInvoice, setSavedInvoice] = useState<{ id: number; invoice_number: string } | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const previewRef = useRef<HTMLDivElement>(null);

    const { register, control, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
        defaultValues: {
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [{ description: '', quantity: 1, unit_price: 0 }],
            notes: 'Payment due within 30 days of invoice date.',
            type: 'quotation'
        }
    });

    const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });

    const invoiceType = watch('type');
    const items = watch('items');
    const clientId = watch('client_id');
    const notes = watch('notes');

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    const taxRate = (settings?.tax_rate || 15) / 100;
    const taxTotal = subtotal * taxRate;
    const grandTotal = subtotal + taxTotal;
    const currency = settings?.currency_symbol || 'R';

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!window.api) return;
        try {
            const [clientsData, settingsData, logoData, templatesData] = await Promise.all([
                window.api.getClients(),
                window.api.getSettings(),
                window.api.getLogo(),
                window.api.getTemplates()
            ]);
            setClients(clientsData);
            setSettings(settingsData);
            setLogo(logoData);
            setTemplates(templatesData);

            // If editing an existing invoice
            if (id) {
                const invoice = await window.api.getInvoice(Number(id));
                if (invoice) {
                    setIsEditMode(true);
                    setSavedInvoice({ id: invoice.id, invoice_number: invoice.invoice_number });
                    reset({
                        client_id: invoice.client_id,
                        issue_date: invoice.issue_date,
                        due_date: invoice.due_date || '',
                        items: invoice.items,
                        notes: invoice.notes || '',
                        type: invoice.type
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
    };

    const onSubmit = async (data: FormValues) => {
        if (!window.api) return;

        setSaving(true);
        try {
            if (isEditMode && savedInvoice) {
                // Update existing invoice
                const result = await window.api.updateInvoice(savedInvoice.id, {
                    ...data,
                    client_id: Number(data.client_id),
                    items: data.items,
                    subtotal,
                    tax_rate: settings?.tax_rate || 15,
                    tax_total: taxTotal,
                    grand_total: grandTotal
                });
                if (result) {
                    setIsPreview(true);
                } else {
                    alert('Failed to update invoice');
                }
            } else {
                // Create new invoice
                const result = await window.api.createInvoice({
                    ...data,
                    client_id: Number(data.client_id),
                    subtotal,
                    tax_rate: settings?.tax_rate || 15,
                    tax_total: taxTotal,
                    grand_total: grandTotal
                });

                if (result.success) {
                    setSavedInvoice({ id: result.id!, invoice_number: result.invoice_number! });
                    setIsPreview(true);
                } else {
                    alert('Failed to save: ' + result.error);
                }
            }
        } catch (e) {
            console.error('Failed to save:', e);
            alert('An error occurred while saving');
        }
        setSaving(false);
    };

    const handleLoadTemplate = (template: Template) => {
        replace(template.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price
        })));
        if (template.notes) {
            setValue('notes', template.notes);
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!window.api || !templateName.trim()) return;

        try {
            await window.api.createTemplate({
                name: templateName,
                items: items.filter(item => item.description),
                notes: notes
            });
            setShowTemplateModal(false);
            setTemplateName('');
            // Reload templates
            const templatesData = await window.api.getTemplates();
            setTemplates(templatesData);
            alert('Template saved successfully!');
        } catch (e) {
            console.error('Failed to save template:', e);
            alert('Failed to save template');
        }
    };

    const handleDownloadPDF = async () => {
        if (!previewRef.current) return;

        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const filename = savedInvoice
                ? `${savedInvoice.invoice_number}.pdf`
                : `${invoiceType}_${new Date().getTime()}.pdf`;

            pdf.save(filename);
        } catch (e) {
            console.error('PDF generation failed:', e);
            alert('Failed to generate PDF');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const selectedClient = clients.find(c => c.id === Number(clientId));

    // Preview Mode
    if (isPreview) {
        return (
            <div className="p-8 max-w-6xl mx-auto flex gap-8 print:p-0 print:max-w-none">
                {/* Sidebar Controls - Hidden in print */}
                <div className="w-64 space-y-4 print:hidden shrink-0">
                    <button
                        onClick={() => setIsPreview(false)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Editor
                    </button>

                    {savedInvoice && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                            <div className="text-sm font-medium text-green-800">Document Saved!</div>
                            <div className="text-lg font-bold text-green-700">{savedInvoice.invoice_number}</div>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                        <button
                            onClick={handleDownloadPDF}
                            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700 transition font-medium"
                        >
                            <FileDown size={18} /> Download PDF
                        </button>
                        <button
                            onClick={handlePrint}
                            className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 py-3 rounded-lg hover:bg-slate-50 transition font-medium"
                        >
                            <Printer size={18} /> Print
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center justify-center gap-2 text-slate-500 py-2 hover:text-slate-700 transition"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>

                {/* A4 Preview Canvas */}
                <div className="flex-1 bg-slate-200 p-8 rounded-xl overflow-auto flex justify-center print:bg-white print:p-0">
                    <div
                        ref={previewRef}
                        className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-2xl text-slate-800 relative print:shadow-none print:w-full"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                {logo ? (
                                    <img src={logo} alt="Logo" className="h-16 w-auto object-contain mb-4" />
                                ) : (
                                    <div className="text-2xl font-bold text-brand-600 mb-4">
                                        {settings?.company_name || 'Your Company'}
                                    </div>
                                )}
                                {logo && (
                                    <div className="text-xl font-bold text-slate-800">
                                        {settings?.company_name}
                                    </div>
                                )}
                                {settings?.company_address && (
                                    <div className="text-sm text-slate-500 whitespace-pre-line mt-1">
                                        {settings.company_address}
                                    </div>
                                )}
                                {settings?.company_email && (
                                    <div className="text-sm text-slate-500">{settings.company_email}</div>
                                )}
                                {settings?.company_phone && (
                                    <div className="text-sm text-slate-500">{settings.company_phone}</div>
                                )}
                            </div>
                            <div className="text-right">
                                <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight">
                                    {invoiceType}
                                </h1>
                                {savedInvoice && (
                                    <div className="text-lg font-mono text-slate-600 mt-1">
                                        {savedInvoice.invoice_number}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bill To & Details */}
                        <div className="flex justify-between mb-10 pb-8 border-b border-slate-200">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</div>
                                {selectedClient ? (
                                    <>
                                        <div className="font-bold text-lg text-slate-800">{selectedClient.name}</div>
                                        {selectedClient.address && (
                                            <div className="text-sm text-slate-600 whitespace-pre-line">{selectedClient.address}</div>
                                        )}
                                        {selectedClient.email && (
                                            <div className="text-sm text-slate-600">{selectedClient.email}</div>
                                        )}
                                        {selectedClient.tax_id && (
                                            <div className="text-sm text-slate-500 mt-1">VAT: {selectedClient.tax_id}</div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-slate-400 italic">No client selected</div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <span className="text-slate-500">Issue Date:</span>
                                    <span className="font-medium text-slate-800">{watch('issue_date')}</span>
                                    <span className="text-slate-500">Due Date:</span>
                                    <span className="font-medium text-slate-800">{watch('due_date')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="text-left py-3 font-bold text-slate-700 text-sm">Description</th>
                                    <th className="text-center py-3 font-bold text-slate-700 text-sm w-20">Qty</th>
                                    <th className="text-right py-3 font-bold text-slate-700 text-sm w-28">Rate</th>
                                    <th className="text-right py-3 font-bold text-slate-700 text-sm w-28">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.filter(item => item.description).map((item, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-4 text-slate-700">{item.description}</td>
                                        <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                                        <td className="py-4 text-right text-slate-600">{currency}{(item.unit_price || 0).toFixed(2)}</td>
                                        <td className="py-4 text-right font-medium text-slate-800">
                                            {currency}{((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="flex justify-end mb-8">
                            <div className="w-72">
                                <div className="flex justify-between py-2 text-slate-600">
                                    <span>Subtotal</span>
                                    <span>{currency}{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 text-slate-600">
                                    <span>VAT ({settings?.tax_rate || 15}%)</span>
                                    <span>{currency}{taxTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-3 border-t-2 border-slate-900 font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-brand-600">{currency}{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {watch('notes') && (
                            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes / Terms</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line">{watch('notes')}</div>
                            </div>
                        )}

                        {/* Banking Details */}
                        {settings?.bank_details && (
                            <div className="border-t border-slate-200 pt-6">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Details</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line font-mono">{settings.bank_details}</div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="absolute bottom-8 left-12 right-12 text-center text-xs text-slate-400">
                            Thank you for your business!
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Editor Mode
    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Create New Document</h1>
                    <p className="text-slate-500">Generate a professional invoice or quotation</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsPreview(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Eye size={18} /> Preview
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save & Preview'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
                {/* Document Type Toggle */}
                <div className="flex justify-center">
                    <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                        <button
                            type="button"
                            onClick={() => setValue('type', 'quotation')}
                            className={clsx(
                                "px-8 py-3 rounded-lg text-sm font-medium transition-all",
                                invoiceType === 'quotation'
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <FileText size={16} className="inline mr-2" />
                            Quotation
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue('type', 'invoice')}
                            className={clsx(
                                "px-8 py-3 rounded-lg text-sm font-medium transition-all",
                                invoiceType === 'invoice'
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <FileText size={16} className="inline mr-2" />
                            Invoice
                        </button>
                    </div>
                </div>

                {/* Client & Dates */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <User size={16} /> Client
                        </label>
                        <select
                            className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                            {...register('client_id', { required: true })}
                        >
                            <option value="">Select Client...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <Link to="/clients" className="text-xs text-brand-600 hover:underline">+ Add New Client</Link>
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Calendar size={16} /> Issue Date
                        </label>
                        <input
                            type="date"
                            className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                            {...register('issue_date')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Calendar size={16} /> Due Date
                        </label>
                        <input
                            type="date"
                            className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                            {...register('due_date')}
                        />
                    </div>
                </div>

                <hr className="border-slate-100" />

                {/* Line Items */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-800">Line Items</h3>
                        <div className="flex gap-2">
                            {templates.length > 0 && (
                                <select
                                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                                    onChange={(e) => {
                                        const template = templates.find(t => t.id === Number(e.target.value));
                                        if (template) handleLoadTemplate(template);
                                        e.target.value = '';
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Load Template...</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowTemplateModal(true)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                <BookTemplate size={14} /> Save as Template
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 px-2">
                            <div className="col-span-6">Description</div>
                            <div className="col-span-2">Qty</div>
                            <div className="col-span-2">Rate ({currency})</div>
                            <div className="col-span-2">Amount</div>
                        </div>

                        {/* Items */}
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-center group bg-slate-50 p-3 rounded-lg">
                                <div className="col-span-6">
                                    <input
                                        className="w-full p-2 rounded border border-slate-200 focus:border-brand-500 outline-none bg-white"
                                        placeholder="e.g. Website Design - Home Page"
                                        {...register(`items.${index}.description`)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full p-2 rounded border border-slate-200 focus:border-brand-500 outline-none bg-white"
                                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full p-2 rounded border border-slate-200 focus:border-brand-500 outline-none bg-white"
                                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="col-span-2 flex items-center justify-between pl-2">
                                    <span className="font-medium text-slate-700">
                                        {currency}{((items[index]?.quantity || 0) * (items[index]?.unit_price || 0)).toFixed(2)}
                                    </span>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
                        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 mt-4 px-2"
                    >
                        <Plus size={16} /> Add Line Item
                    </button>
                </div>

                <hr className="border-slate-100" />

                {/* Notes */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Notes / Payment Terms</label>
                    <textarea
                        {...register('notes')}
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
                        rows={3}
                        placeholder="Any additional terms or notes for the client..."
                    />
                </div>

                <hr className="border-slate-100" />

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-72 space-y-3">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span>{currency}{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>VAT ({settings?.tax_rate || 15}%)</span>
                            <span>{currency}{taxTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-slate-800 pt-3 border-t border-slate-200">
                            <span>Total</span>
                            <span className="text-brand-600">{currency}{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save as Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Save as Template</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Save the current line items as a reusable template for future documents.
                        </p>
                        <input
                            type="text"
                            placeholder="Template name (e.g., Website Design Package)"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowTemplateModal(false);
                                    setTemplateName('');
                                }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAsTemplate}
                                disabled={!templateName.trim()}
                                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition disabled:opacity-50"
                            >
                                <SaveAll size={16} className="inline mr-2" />
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

