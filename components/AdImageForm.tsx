
import React, { useState } from 'react';
import type { AdImageFormState, AdImageFile, AdImageRole, AdSuggestion } from '../types';
import { removeBackground, retouchImage } from '../services/geminiService';

interface AdImageFormProps {
  formState: AdImageFormState;
  onFormChange: (newState: AdImageFormState) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onGenerateSuggestions: (productInfo: string) => void;
  suggestions: AdSuggestion[] | null;
  isSuggesting: boolean;
  suggestionError: string | null;
}

const AdImageForm: React.FC<AdImageFormProps> = ({
  formState,
  onFormChange,
  onSubmit,
  isLoading,
  onGenerateSuggestions,
  suggestions,
  isSuggesting,
  suggestionError,
}) => {
  const [suggestionQuery, setSuggestionQuery] = useState('');

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFormChange({ ...formState, prompt: e.target.value });
  };

  const handleVariationsChange = (variations: 1 | 3 | 5) => {
    onFormChange({ ...formState, variations });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    Array.from(e.target.files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const base64 = event.target.result.split(',')[1];
          const newFile: AdImageFile = {
            id: crypto.randomUUID(),
            name: file.name,
            base64,
            mimeType: file.type,
            role: formState.files.length === 0 ? 'product' : 'none',
            isProcessing: false,
          };
          onFormChange({ ...formState, files: [...formState.files, newFile] });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  
  const handleRemoveFile = (id: string) => {
    onFormChange({ ...formState, files: formState.files.filter(f => f.id !== id) });
  };

  const handleRoleChange = (id: string, role: AdImageRole) => {
    onFormChange({ 
        ...formState, 
        files: formState.files.map(f => f.id === id ? { ...f, role } : f) 
    });
  };

  const handleProcessImage = async (id: string, action: 'remove_bg' | 'retouch') => {
    const file = formState.files.find(f => f.id === id);
    if (!file) return;

    onFormChange({
        ...formState,
        files: formState.files.map(f => f.id === id ? { ...f, isProcessing: true } : f)
    });

    try {
        let newBase64 = '';
        if (action === 'remove_bg') {
            newBase64 = await removeBackground(file);
        } else {
            newBase64 = await retouchImage(file);
        }

        onFormChange({
            ...formState,
            files: formState.files.map(f => f.id === id ? { ...f, base64: newBase64, isProcessing: false } : f)
        });
    } catch (err) {
        alert(err instanceof Error ? err.message : "Có lỗi xảy ra khi xử lý ảnh.");
        onFormChange({
            ...formState,
            files: formState.files.map(f => f.id === id ? { ...f, isProcessing: false } : f)
        });
    }
  };
  
  const handleGetSuggestions = () => {
    if (!isSuggesting && suggestionQuery.trim()) {
        onGenerateSuggestions(suggestionQuery.trim());
    }
  };

  const handleUseSuggestion = (prompt: string) => {
      onFormChange({ ...formState, prompt });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.files.length === 0) {
        alert("Vui lòng tải lên ít nhất một ảnh sản phẩm!");
        return;
    }
    if (!isLoading) onSubmit();
  };
  
  const roleOptions: { value: AdImageRole; label: string }[] = [
      { value: 'product', label: '📦 Sản phẩm (Chính)' },
      { value: 'model', label: '👤 Người mẫu' },
      { value: 'logo', label: '®️ Thương hiệu' },
      { value: 'background', label: '🏞️ Phông nền tham khảo' },
      { value: 'none', label: '🎨 Tham chiếu khác' },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Identity Badge */}
      <div className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582A1 1 0 004.5 6.82V14a2 2 0 002 2h7a2 2 0 002-2V6.82a1 1 0 00-.546-.894L11 4.323V3a1 1 0 00-1-1zM9 6.677V14h2V6.677l-1-.4L9 6.677z" clipRule="evenodd"/></svg>
          </div>
          <div className="flex-grow">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Active Technology</p>
              <p className="text-[11px] font-bold text-slate-700">PK-2026 Identity Preservation: Strictly Original Face</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
      </div>

      <div className="space-y-4">
          <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1">
            Bước 1: Tải lên Sản phẩm/Mẫu
          </label>
          <div className="bg-red-50/30 border-2 border-dashed border-red-200 rounded-3xl p-8 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all group">
              <input type="file" id="file-upload" multiple accept="image/*" onChange={handleFileChange} className="sr-only" />
              <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform border border-red-50">
                      <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  </div>
                  <p className="text-[13px] font-black text-slate-900">Kéo thả ảnh hoặc <span className="text-red-600 underline">chọn tệp</span></p>
                  <p className="text-[10px] text-slate-500 font-bold mt-2">Ảnh mẫu sẽ được giữ nguyên 100% khuôn mặt</p>
              </label>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
              {formState.files.map(file => (
                  <div key={file.id} className={`flex flex-col bg-white p-4 rounded-2xl border transition-all ${file.role === 'product' ? 'border-red-200 shadow-md ring-1 ring-red-50' : 'border-slate-200 shadow-sm'}`}>
                      <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            {file.isProcessing && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <img src={`data:${file.mimeType};base64,${file.base64}`} className="w-16 h-16 object-cover rounded-xl border border-slate-100" />
                          </div>
                          <div className="flex-grow space-y-2">
                              <select value={file.role} onChange={(e) => handleRoleChange(file.id, e.target.value as AdImageRole)}
                                  className="w-full bg-slate-100 border-none text-[11px] font-black uppercase rounded-lg p-2 focus:ring-2 focus:ring-red-200 text-slate-900">
                                  {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                              <div className="flex gap-2">
                                  <button onClick={() => handleProcessImage(file.id, 'remove_bg')} disabled={file.isProcessing}
                                    className="flex-grow py-1.5 px-3 bg-red-50 text-red-700 text-[9px] font-black uppercase rounded-lg hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
                                      ✂️ Tách nền
                                  </button>
                                  <button onClick={() => handleProcessImage(file.id, 'retouch')} disabled={file.isProcessing}
                                    className="flex-grow py-1.5 px-3 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded-lg hover:bg-amber-600 hover:text-white transition-all disabled:opacity-50">
                                      ✨ Retouch
                                  </button>
                              </div>
                          </div>
                          <button onClick={() => handleRemoveFile(file.id)} className="p-2 text-slate-300 hover:text-red-600 transition-all self-start">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"/></svg>
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="bg-red-50/40 p-6 lg:p-8 rounded-[2rem] border border-red-100 shadow-inner space-y-6">
        <label className="text-[12px] font-black text-red-800 uppercase tracking-widest block">
          Bước 2: Ý tưởng bối cảnh
        </label>
        <div className="relative">
            <input type="text" value={suggestionQuery} onChange={e => setSuggestionQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleGetSuggestions()}
                className="w-full bg-white border-2 border-red-50 rounded-2xl p-4 pr-16 text-[14px] font-black text-slate-900 placeholder:text-slate-300 shadow-sm focus:border-red-400 transition-all"
                placeholder="Nhập bối cảnh (VD: Phòng khách tết xưa)..." />
            <button onClick={handleGetSuggestions} disabled={isSuggesting || !suggestionQuery.trim()}
                className="absolute right-2 top-2 w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg disabled:opacity-30">
                {isSuggesting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "🚀"}
            </button>
        </div>

        {suggestions && (
            <div className="grid grid-cols-1 gap-3">
                {suggestions.map((s, idx) => (
                    <button key={idx} onClick={() => handleUseSuggestion(s.prompt)}
                        className="text-left p-4 bg-white border border-slate-100 rounded-2xl hover:border-red-500 hover:shadow-lg transition-all flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 text-xs font-black shrink-0">{idx + 1}</div>
                        <div className="flex-grow"><p className="text-sm font-black text-slate-900 tracking-tight">{s.title}</p></div>
                    </button>
                ))}
            </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
            <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1">Bước 3: Tinh chỉnh mô tả</label>
            <textarea name="prompt" rows={5} value={formState.prompt} onChange={handlePromptChange} 
                className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-[14px] font-black text-slate-900 placeholder:text-slate-300 focus:border-red-400 transition-all resize-none shadow-inner border-l-4 border-l-red-600" 
                placeholder="Mô tả kỹ thuật cho AI..." required />
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-1">Khuôn mặt sẽ được bảo vệ bởi thuật toán Identity-Lock PK-2026</p>
        </div>
        
        <div className="space-y-3">
            <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1">Bước 4: Số lượng Concept</label>
            <div className="flex gap-3">
                {[1, 3, 5].map(v => (
                    <button type="button" key={v} onClick={() => handleVariationsChange(v as 1 | 3 | 5)}
                        className={`flex-grow py-3 rounded-xl text-[11px] font-black transition-all border-2 ${formState.variations === v ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-red-200'}`}>
                        {v} BẢN VẼ
                    </button>
                ))}
            </div>
        </div>

        <button type="submit" disabled={isLoading || formState.files.length === 0}
            className="btn-primary w-full py-6 rounded-3xl text-[15px] flex items-center justify-center gap-3">
            {isLoading ? <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin"></div> : "KẾT XUẤT ẢNH QUẢNG CÁO TẾT"}
        </button>
      </form>
    </div>
  );
};

export default AdImageForm;
