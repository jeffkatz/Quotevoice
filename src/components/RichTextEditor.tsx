import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    label?: string;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, label, placeholder }: RichTextEditorProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    const handleCommand = (command: string, val?: string) => {
        document.execCommand(command, false, val);
        if (contentRef.current) {
            onChange(contentRef.current.innerHTML);
        }
    };

    // Sync external value changes to contentEditable
    // Only if contentRef is empty or drastically different, avoiding cursor jump issues handled by simple onBlur usually
    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== value) {
            // Only update if not currently focused to avoid cursor jumping
            if (document.activeElement !== contentRef.current) {
                contentRef.current.innerHTML = value || '';
            }
        }
    }, [value]);

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-bold text-slate-700">{label}</label>}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-sm">
                <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50">
                    <button type="button" onClick={() => handleCommand('bold')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><Bold size={16} /></button>
                    <button type="button" onClick={() => handleCommand('italic')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><Italic size={16} /></button>
                    <button type="button" onClick={() => handleCommand('underline')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><Underline size={16} /></button>
                    <div className="w-px h-4 bg-slate-300 mx-1" />
                    <button type="button" onClick={() => handleCommand('justifyLeft')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><AlignLeft size={16} /></button>
                    <button type="button" onClick={() => handleCommand('justifyCenter')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><AlignCenter size={16} /></button>
                    <button type="button" onClick={() => handleCommand('justifyRight')} className="p-1.5 hover:bg-white rounded hover:shadow-sm text-slate-600 transition-all"><AlignRight size={16} /></button>
                </div>
                <div
                    ref={contentRef}
                    className="p-4 min-h-[100px] outline-none text-slate-700 prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2"
                    contentEditable
                    data-placeholder={placeholder}
                    onInput={(e) => onChange(e.currentTarget.innerHTML)}
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                />
            </div>
        </div>
    );
}
