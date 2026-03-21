
import React, { useState } from 'react';
import type { AffiliateFormState } from '../types';

interface AffiliateScriptFormProps {
  onSubmit: (state: AffiliateFormState) => void;
  isLoading: boolean;
}

const AffiliateScriptForm: React.FC<AffiliateScriptFormProps> = ({ onSubmit, isLoading }) => {
  const [form, setForm] = useState<AffiliateFormState>({
    productName: '',
    platform: 'TikTok',
    scriptType: 'Review',
    targetAudience: 'Người trẻ, sinh viên',
    tone: 'Năng động, hào hứng',
    productFeatures: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName || !form.productFeatures) {
        alert("Vui lòng điền thông tin sản phẩm bắt buộc!");
        return;
    }
    onSubmit(form);
  };

  const platforms = [
    { id: 'TikTok', icon: '📱' },
    { id: 'Reels', icon: '🎬' },
    { id: 'Shorts', icon: '🎥' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      <div className="space-y-6">
        <div className="space-y-3">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Môi trường Xuất bản</label>
            <div className="grid grid-cols-3 gap-3">
                {platforms.map(p => (
                    <button 
                        key={p.id} 
                        type="button" 
                        onClick={() => setForm({...form, platform: p.id as any})}
                        className={`py-3.5 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-2 ${
                            form.platform === p.id 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-[1.02]' 
                            : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                        }`}
                    >
                        <span className="text-base">{p.icon}</span>
                        {p.id}
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-3">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Định hướng kịch bản</label>
            <div className="relative">
                <select 
                    value={form.scriptType} 
                    onChange={e => setForm({...form, scriptType: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
                >
                    <option value="Review">⭐ Review trải nghiệm thực tế</option>
                    <option value="Unboxing">📦 Đập hộp chuyên sâu (Unboxing)</option>
                    <option value="Drama">🎞️ Drama lồng ghép sản phẩm</option>
                    <option value="Problem/Solution">💡 Giải quyết nỗi đau khách hàng</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
            </div>
        </div>

        <div className="space-y-3">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Nhận diện Sản phẩm</label>
            <input 
                type="text" 
                value={form.productName} 
                onChange={e => setForm({...form, productName: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner shadow-slate-100/50" 
                placeholder="VD: iPhone 15 Pro Max Titan Tự Nhiên..." 
            />
        </div>

        <div className="space-y-3">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Unique Selling Points (USPs)</label>
            <textarea 
                rows={5} 
                value={form.productFeatures} 
                onChange={e => setForm({...form, productFeatures: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner shadow-slate-100/50 resize-none leading-relaxed" 
                placeholder="Dung lượng pin 24h, camera 48MP siêu nét, hiệu năng chip A17 cực đỉnh..." 
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Khán giả</label>
                <input 
                    type="text" 
                    value={form.targetAudience} 
                    onChange={e => setForm({...form, targetAudience: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-xs text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500/10" 
                />
            </div>
            <div className="space-y-3">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Cảm hứng</label>
                <input 
                    type="text" 
                    value={form.tone} 
                    onChange={e => setForm({...form, tone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-xs text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500/10" 
                />
            </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="btn-primary w-full py-5 rounded-[1.5rem] font-extrabold text-white text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {isLoading ? (
            <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang kiến tạo Viral Flow...
            </>
        ) : (
            <>
                <span>🚀</span>
                Bắt Đầu Sáng Tạo Kịch Bản
            </>
        )}
      </button>
    </form>
  );
};

export default AffiliateScriptForm;
