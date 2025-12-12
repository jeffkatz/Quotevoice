import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Plus, Trash2, Save, FileDown, Eye, ArrowLeft, Printer, Calendar, User, FileText, ChevronDown, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import clsx from 'clsx';
import type { DesignConfig, Template } from '../types';
import RichTextEditor from './RichTextEditor';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

type FormValues = {
    invoice_number: string;
    invoice_name: string;
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
    logo_path?: string;
};

export default function InvoiceEditor() {
    const { id } = useParams();
    const location = useLocation();

    // States
    const [clients, setClients] = useState<any[]>([]);
    const [templatesList, setTemplatesList] = useState<Template[]>([]);
    const [globalSettings, setGlobalSettings] = useState<Settings | null>(null);
    const [design, setDesign] = useState<DesignConfig | null>(null);
    const [template, setTemplate] = useState<Template | null>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedInvoice, setSavedInvoice] = useState<any | null>(null); // Relaxed type to include payments
    const [isEditMode, setIsEditMode] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false); // For payment modal

    const previewRef = useRef<HTMLDivElement>(null);

    const { register, control, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm<FormValues>({
        defaultValues: {
            invoice_number: '', // Will be auto-generated or populated
            invoice_name: '',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [{ description: '', quantity: 1, unit_price: 0 }],
            notes: '<p>Payment due within 30 days of invoice date.</p>',
            type: 'quotation'
        }
    });

    useUnsavedChanges(isDirty && !saving);

    const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });

    const invoiceType = watch('type');
    const items = watch('items');
    const clientId = watch('client_id');
    const notes = watch('notes');
    const currentInvoiceNumber = watch('invoice_number');

    // ... (Derived Settings and calculations remain similar, verify if changed)
    const effectiveSettings = {
        ...globalSettings,
        primary_color: design?.primary_color || globalSettings?.primary_color || '#000000',
        font_family: design?.font_family || globalSettings?.font_family || 'Inter',
        header_text: design?.header_text,
        footer_text: design?.footer_text,
        orientation: design?.orientation || 'portrait',
        logo_size: design?.logo_size || 60,
        content_spacing: design?.content_spacing || 'normal'
    };

    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    const taxRate = (globalSettings?.tax_rate || 15) / 100;
    const taxTotal = subtotal * taxRate;
    const grandTotal = subtotal + taxTotal;
    const currency = globalSettings?.currency_symbol || '$';

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!window.api) return;
        try {
            const [clientsData, settingsData, templatesData] = await Promise.all([
                window.api.getClients(),
                window.api.getSettings(),
                window.api.getTemplates()
            ]);
            setClients(clientsData);
            setGlobalSettings(settingsData);
            setTemplatesList(templatesData);

            if (id) {
                const invoice = await window.api.getInvoice(Number(id));
                if (invoice) {
                    setIsEditMode(true);
                    setSavedInvoice(invoice);
                    reset({
                        invoice_number: invoice.invoice_number,
                        invoice_name: invoice.invoice_name || '',
                        client_id: invoice.client_id,
                        issue_date: invoice.issue_date,
                        due_date: invoice.due_date || '',
                        items: invoice.items,
                        notes: invoice.notes || '',
                        type: invoice.type
                    });
                    if (invoice.design) {
                        setDesign(invoice.design);
                    }
                    // Start in preview mode if viewing an existing invoice?
                    // Usually safer to start in Edit mode if the route is /edit, 
                    // but for now we follow existing behavior. 
                    // Just defaulting to edit mode, let user switch to preview.
                }
            } else if (location.state?.templateId) {
                const tmpl = templatesData.find((t: Template) => t.id === location.state.templateId);
                if (tmpl) applyTemplate(tmpl, true);
            } else {
                if (templatesData.length > 0) applyTemplate(templatesData[0], true);
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
    };

    const applyTemplate = (tmpl: Template, applyContent = false) => {
        setTemplate(tmpl);
        if (tmpl.design) setDesign(tmpl.design);

        if (applyContent) {
            // Only applied on initial creation or explicit "Reset to Template" action
            if (tmpl.items && tmpl.items.length > 0) {
                // Logic to replace items excluded per user request "All invoice data stays intact. Only layout updates"
                // So we only do this on *Creation*, which this function handles via applyContent=true
                replace(tmpl.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                })));
            }
            if (tmpl.notes) setValue('notes', tmpl.notes);
        }
    };

    const handleTemplateSwitch = (tmplId: string) => {
        const tmpl = templatesList.find(t => t.id === Number(tmplId));
        if (tmpl) {
            // "When switching templates: All invoice data stays intact. Only layout/style updates."
            setTemplate(tmpl);
            if (tmpl.design) setDesign(tmpl.design);
            // We do NOT call applyContent here.
        }
    };

    const onSubmit = async (data: FormValues) => {
        if (!window.api) return;
        setSaving(true);
        try {
            const invoiceData = {
                ...data,
                client_id: Number(data.client_id),
                items: data.items,
                subtotal,
                tax_rate: globalSettings?.tax_rate || 15,
                tax_total: taxTotal,
                grand_total: grandTotal,
                design: design
            };

            if (isEditMode && savedInvoice) {
                const result = await window.api.updateInvoice(savedInvoice.id, invoiceData);
                if (result) {
                    setIsPreview(true);
                    // Update local state to reflect potentially new generated number or other backend changes
                    setSavedInvoice({ ...savedInvoice, ...invoiceData });
                    reset(data); // Reset dirty
                } else {
                    alert('Failed to update invoice');
                }
            } else {
                const result = await window.api.createInvoice(invoiceData);
                if (result.success) {
                    setSavedInvoice({ ...invoiceData, id: result.id!, invoice_number: result.invoice_number! });
                    setIsPreview(true);
                    // Provide the generated invoice number back to the form if it was empty
                    if (!data.invoice_number && result.invoice_number) {
                        setValue('invoice_number', result.invoice_number);
                    }
                    reset({ ...data, invoice_number: result.invoice_number || data.invoice_number });
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

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const amount = Number(formData.get('amount'));
        const date = formData.get('date') as string;
        const method = formData.get('method') as string;
        const reference = formData.get('reference') as string;

        if (savedInvoice) {
            try {
                await window.api.addPayment(savedInvoice.id, {
                    invoice_id: savedInvoice.id,
                    amount,
                    date,
                    method,
                    reference
                });

                // Reload invoice to get updated status and payments
                const updatedInvoice = await window.api.getInvoice(savedInvoice.id);
                setSavedInvoice(updatedInvoice);
                setShowPaymentModal(false);
            } catch (err) {
                console.error('Failed to add payment', err);
                alert('Failed to add payment');
            }
        }
    };

    const handleDownloadPDF = async () => {
        if (!previewRef.current) return;
        try {
            const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF(effectiveSettings.orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const filename = savedInvoice ? `${savedInvoice.invoice_number}.pdf` : `${invoiceType}_${new Date().getTime()}.pdf`;
            pdf.save(filename);
        } catch (e) {
            console.error('PDF generation failed:', e);
            alert('Failed to generate PDF');
        }
    };

    const selectedClient = clients.find(c => c.id === Number(clientId));
    const isLandscape = design?.orientation === 'landscape';

    // RENDER
    if (isPreview) {
        // ... (We will handle Preview separately in next step)
        return (
            <div className="p-8 max-w-7xl mx-auto flex gap-8 print:p-0 print:max-w-none animate-fade-in relative z-10">
                {/* Sidebar Controls */}
                <div className="w-72 space-y-6 print:hidden shrink-0">
                    <button onClick={() => setIsPreview(false)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium pl-1">
                        <ArrowLeft size={18} /> Back to Editor
                    </button>
                    {savedInvoice && (
                        <>
                            <div className={clsx("border p-5 rounded-2xl backdrop-blur-sm transition-colors",
                                savedInvoice.status === 'paid' ? "bg-green-50/50 border-green-200/50 text-green-700" :
                                    savedInvoice.status === 'partially_paid' ? "bg-amber-50/50 border-amber-200/50 text-amber-700" :
                                        "bg-slate-50/50 border-slate-200/50 text-slate-700"
                            )}>
                                <div className="flex items-center gap-2 font-semibold mb-1">
                                    <div className={clsx("w-2 h-2 rounded-full",
                                        savedInvoice.status === 'paid' ? "bg-green-500" :
                                            savedInvoice.status === 'partially_paid' ? "bg-amber-500" : "bg-slate-400"
                                    )}></div>
                                    {savedInvoice.status === 'partially_paid' ? 'Partially Paid' :
                                        savedInvoice.status === 'paid' ? 'Paid in Full' : 'Document Saved'}
                                </div>
                                <div className="text-xl font-bold text-slate-900 mb-2">{savedInvoice.invoice_number}</div>
                                {savedInvoice.status !== 'paid' && savedInvoice.balance_due > 0 && (
                                    <div className="text-sm font-medium">Balance Due: {currency}{savedInvoice.balance_due.toFixed(2)}</div>
                                )}
                            </div>

                            {/* Payment Actions */}
                            {savedInvoice.status !== 'draft' && savedInvoice.status !== 'void' && savedInvoice.balance_due > 0 && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-medium shadow-lg shadow-green-900/10 active:scale-95"
                                >
                                    <CheckCircle size={18} /> Record Payment
                                </button>
                            )}

                            {/* Payment History sidebar widget */}
                            {savedInvoice.payments && savedInvoice.payments.length > 0 && (
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400" /> Payment History
                                    </h3>
                                    <div className="space-y-3 relative">
                                        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-100"></div>
                                        {savedInvoice.payments.map((p: any) => (
                                            <div key={p.id} className="relative pl-5 text-sm">
                                                <div className="absolute left-0 top-1.5 w-3 h-3 bg-green-100 border-2 border-white ring-1 ring-green-500 rounded-full"></div>
                                                <div className="flex justify-between font-medium text-slate-900">
                                                    <span>{currency}{p.amount.toFixed(2)}</span>
                                                    <span className="text-slate-500 text-xs">{new Date(p.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">{p.method} {p.reference ? `- ${p.reference}` : ''}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                        <button onClick={handleDownloadPDF} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition font-medium shadow-lg shadow-slate-900/10 active:scale-95">
                            <FileDown size={18} /> Download PDF
                        </button>
                        <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition font-medium">
                            <Printer size={18} /> Print
                        </button>
                    </div>
                </div>

                {/* Preview Canvas */}
                <div className="flex-1 bg-slate-100/50 p-8 rounded-3xl overflow-auto flex justify-center print:bg-white print:p-0 border border-slate-200/50 shadow-inner">
                    <div
                        ref={previewRef}
                        className={clsx(
                            "bg-white p-0 shadow-2xl text-slate-800 relative print:shadow-none transition-all duration-300 origin-top flex flex-col min-h-[inherit] overflow-hidden",
                            isLandscape ? "w-[297mm] min-h-[210mm]" : "w-[210mm] min-h-[297mm]"
                        )}
                        style={{ fontFamily: effectiveSettings.font_family }}
                    >
                        {/* Background Image Layer */}
                        {design?.background_image && (
                            <div className="absolute inset-0 z-0 pointer-events-none bg-center bg-no-repeat bg-cover print:hidden"
                                style={{
                                    backgroundImage: `url(${design.background_image})`,
                                    opacity: design.background_opacity ?? 0.1
                                }}
                            />
                        )}

                        <div className={clsx("relative z-10 flex flex-col flex-1",
                            effectiveSettings.content_spacing === 'compact' ? 'p-8' :
                                effectiveSettings.content_spacing === 'relaxed' ? 'p-16' : 'p-12'
                        )}>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-12">
                                <div className="flex-1">
                                    {(design?.logo_path || globalSettings?.logo_path) ? (
                                        <img src={design?.logo_path || globalSettings?.logo_path}
                                            alt="Logo"
                                            style={{ height: `${effectiveSettings.logo_size}px` }}
                                            className="w-auto object-contain mb-4"
                                        />
                                    ) : (
                                        <div className="text-3xl font-bold tracking-tight mb-2" style={{ color: effectiveSettings.primary_color }}>
                                            {globalSettings?.company_name || 'Your Company'}
                                        </div>
                                    )}
                                    <div className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">
                                        {globalSettings?.company_address}
                                        <div className="mt-2 space-y-1">
                                            {globalSettings?.company_email && <div>{globalSettings.company_email}</div>}
                                            {globalSettings?.company_phone && <div>{globalSettings.company_phone}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-1">
                                    <h1 className="text-5xl font-black text-slate-100 tracking-tight uppercase">{invoiceType}</h1>
                                    <div className="text-lg font-mono font-medium text-slate-600 mt-2">#{currentInvoiceNumber || (savedInvoice?.invoice_number) || 'DRAFT'}</div>
                                    {effectiveSettings.header_text && (
                                        <div
                                            className="mt-4 text-sm text-slate-500 prose prose-sm max-w-[250px] ml-auto text-right"
                                            dangerouslySetInnerHTML={{ __html: effectiveSettings.header_text }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Bill To & Details */}
                            <div className="flex justify-between mb-12 pb-8 border-b border-slate-100">
                                <div>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</div>
                                    {selectedClient ? (
                                        <>
                                            <div className="font-bold text-xl text-slate-900 mb-1">{selectedClient.name}</div>
                                            {selectedClient.address && <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{selectedClient.address}</div>}
                                            {selectedClient.email && <div className="text-sm text-slate-500 mt-2">{selectedClient.email}</div>}
                                            {selectedClient.tax_id && <div className="text-sm text-slate-400 mt-1">VAT: {selectedClient.tax_id}</div>}
                                        </>
                                    ) : <div className="text-slate-400 italic">No client selected</div>}
                                </div>
                                <div className="text-right min-w-[200px]">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Date</div>
                                            <div className="font-semibold text-slate-900">{new Date(watch('issue_date')).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</div>
                                            <div className="font-semibold text-slate-900">{new Date(watch('due_date')).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <table className="w-full mb-8">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-4 font-bold text-slate-900 text-sm pl-2">Description</th>
                                        <th className="text-center py-4 font-bold text-slate-900 text-sm w-24">Qty</th>
                                        <th className="text-right py-4 font-bold text-slate-900 text-sm w-32">Rate</th>
                                        <th className="text-right py-4 font-bold text-slate-900 text-sm w-32 pr-2">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.filter(item => item.description).map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-4 text-slate-700 pl-2 font-medium">{item.description}</td>
                                            <td className="py-4 text-center text-slate-500">{item.quantity}</td>
                                            <td className="py-4 text-right text-slate-500">{currency}{(item.unit_price || 0).toFixed(2)}</td>
                                            <td className="py-4 text-right font-bold text-slate-900 pr-2">{currency}{((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end mb-12">
                                <div className="w-80 bg-slate-50 rounded-xl p-6">
                                    <div className="flex justify-between py-2 text-slate-500 text-sm"><span>Subtotal</span><span className="font-medium text-slate-900">{currency}{subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between py-2 text-slate-500 text-sm border-b border-slate-200 mb-2"><span>VAT ({globalSettings?.tax_rate || 15}%)</span><span className="font-medium text-slate-900">{currency}{taxTotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between pt-2 font-bold text-xl text-slate-900"><span>Total</span><span style={{ color: effectiveSettings.primary_color }}>{currency}{grandTotal.toFixed(2)}</span></div>
                                    {savedInvoice && (savedInvoice.amount_paid > 0) && (
                                        <>
                                            <div className="flex justify-between py-2 text-green-600 text-sm border-t border-slate-200 mt-2"><span>Amount Paid</span><span className="font-medium">-{currency}{savedInvoice.amount_paid.toFixed(2)}</span></div>
                                            <div className="flex justify-between pt-2 font-bold text-lg text-slate-700"><span>Balance Due</span><span>{currency}{savedInvoice.balance_due.toFixed(2)}</span></div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {notes && (
                                <div className="mb-8">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notes / Terms</div>
                                    <div className="prose prose-sm text-slate-600 max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100" dangerouslySetInnerHTML={{ __html: notes }} />
                                </div>
                            )}

                            {/* Footer Text & Banking */}
                            <div className="mt-auto pt-8 border-t border-slate-100">
                                {effectiveSettings.footer_text && (
                                    <div className="text-center text-xs text-slate-400 prose prose-sm max-w-none mx-auto mb-4" dangerouslySetInnerHTML={{ __html: effectiveSettings.footer_text }} />
                                )}
                                {globalSettings?.bank_details && (
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">Banking Details</div>
                                        <div className="text-xs text-slate-400 whitespace-pre-line font-mono">{globalSettings.bank_details}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Payment Modal */}
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle className="text-green-600" /> Record Payment</h2>
                            <p className="text-slate-500 text-sm mb-6">Enter payment details for invoice {savedInvoice?.invoice_number}. Current Balance: {currency}{savedInvoice?.balance_due.toFixed(2)}</p>

                            <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                                        <input
                                            name="amount"
                                            type="number"
                                            step="0.01"
                                            max={savedInvoice?.balance_due}
                                            defaultValue={savedInvoice?.balance_due}
                                            required
                                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-lg"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Payment Date</label>
                                    <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                                    <select name="method" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Cash">Cash</option>
                                        <option value="PayPal">PayPal</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Reference (Optional)</label>
                                    <input name="reference" type="text" placeholder="e.g. Transaction ID" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">Save Payment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // EDITOR RENDER
    return (
        <div className="max-w-[1200px] mx-auto p-8 animate-fade-in pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2 font-medium transition-colors"><ArrowLeft size={16} /> Back to Dashboard</Link>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Document</h1>

                    {/* Template Switcher */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-slate-500 font-medium text-sm">Template:</span>
                        <div className="relative group">
                            <select
                                onChange={(e) => handleTemplateSwitch(e.target.value)}
                                value={template?.id || ''}
                                className="appearance-none bg-slate-100 hover:bg-slate-200 pl-3 pr-8 py-1 rounded-lg text-sm font-semibold text-slate-900 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-slate-900/20"
                            >
                                <option value="" disabled>Select Template</option>
                                {templatesList.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsPreview(true)} className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-full bg-white text-slate-700 hover:bg-slate-50 transition-colors font-medium shadow-sm hover:shadow">
                        <Eye size={18} /> Preview
                    </button>
                    <button onClick={handleSubmit(onSubmit)} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 font-medium active:scale-95 disabled:opacity-50">
                        <Save size={18} /> {saving ? 'Saving...' : 'Save & Preview'}
                    </button>
                </div>
            </div>

            <div className="card-apple p-8 space-y-8">
                {/* Type Selection */}
                <div className="flex justify-center">
                    <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex shadow-inner">
                        <button type="button" onClick={() => setValue('type', 'quotation')} className={clsx("px-10 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 leading-none", invoiceType === 'quotation' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                            <span className="flex items-center gap-2"><FileText size={16} /> Quotation</span>
                        </button>
                        <button type="button" onClick={() => setValue('type', 'invoice')} className={clsx("px-10 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 leading-none", invoiceType === 'invoice' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                            <span className="flex items-center gap-2"><FileText size={16} /> Invoice</span>
                        </button>
                    </div>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 pl-1">Document Name <span className="text-red-500">*</span></label>
                            <input
                                className="w-full p-3 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                                placeholder="e.g. Web Development Project"
                                {...register('invoice_name', { required: 'Invoice Name is required' })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 pl-1">Invoice Number <span className="text-slate-400 font-normal text-xs">(Auto-generated if empty)</span></label>
                            <input
                                className="w-full p-3 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                                placeholder="INV-001"
                                {...register('invoice_number')}
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 pl-1"><User size={16} className="text-slate-400" /> Client</label>
                            <div className="relative">
                                <select className="w-full p-3 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none" {...register('client_id', { required: true })}>
                                    <option value="">Select a Client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                            <div className="pl-1"><Link to="/clients" className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">+ Create New Client</Link></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 pl-1"><Calendar size={16} className="text-slate-400" /> Issue Date</label>
                                <input type="date" className="w-full p-3 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" {...register('issue_date')} />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 pl-1"><Calendar size={16} className="text-slate-400" /> Due Date</label>
                                <input type="date" className="w-full p-3 rounded-xl border-0 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" {...register('due_date')} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Line Items */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 text-lg">Line Items</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-4">
                            <div className="col-span-6">Description</div>
                            <div className="col-span-2">Qty</div>
                            <div className="col-span-2">Rate ({currency})</div>
                            <div className="col-span-2">Amount</div>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-center group bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 hover:bg-slate-50 hover:border-slate-200 transition-colors">
                                <div className="col-span-6">
                                    <input className="w-full p-2.5 rounded-lg border-0 bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-700" placeholder="Item description" {...register(`items.${index}.description`)} />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" min="1" className="w-full p-2.5 rounded-lg border-0 bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-center font-medium text-slate-700" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" step="0.01" min="0" className="w-full p-2.5 rounded-lg border-0 bg-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-right font-medium text-slate-700" {...register(`items.${index}.unit_price`, { valueAsNumber: true })} />
                                </div>
                                <div className="col-span-2 flex items-center justify-between pl-3 pr-2">
                                    <span className="font-bold text-slate-900">{currency}{((items[index]?.quantity || 0) * (items[index]?.unit_price || 0)).toFixed(2)}</span>
                                    {fields.length > 1 && (
                                        <button type="button" onClick={() => remove(index)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => append({ description: '', quantity: 1, unit_price: 0 })} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 mt-6 px-2 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Plus size={18} /> Add Line Item</button>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Notes */}
                <div className="space-y-3">
                    <RichTextEditor
                        label="Notes / Payment Terms"
                        value={notes}
                        onChange={(val) => setValue('notes', val, { shouldDirty: true })}
                    />
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-4">
                    <div className="w-80 space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex justify-between text-slate-500 font-medium"><span>Subtotal</span><span>{currency}{subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-slate-500 font-medium"><span>VAT ({globalSettings?.tax_rate || 15}%)</span><span>{currency}{taxTotal.toFixed(2)}</span></div>
                        <div className="h-px bg-slate-200 my-2"></div>
                        <div className="flex justify-between font-bold text-xl text-slate-900"><span>Total</span><span className="text-blue-600">{currency}{grandTotal.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
