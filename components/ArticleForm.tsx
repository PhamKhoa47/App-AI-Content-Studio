
import React, { useState } from 'react';

interface ArticleFormProps {
  onSubmit: (urls: string[]) => void;
  isLoading: boolean;
}

const ArticleForm: React.FC<ArticleFormProps> = ({ onSubmit, isLoading }) => {
  const [urls, setUrls] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
    if (urlList.length > 0 && !isLoading) {
      onSubmit(urlList);
    } else if (urlList.length === 0) {
      alert("Vui lòng nhập ít nhất một đường link.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="space-y-3">
        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">
          Danh sách Nguồn (URLs)
        </label>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          AI sẽ tự động đọc, phân tích và tổng hợp thông tin từ tất cả các link bạn cung cấp để viết nên một bài báo chuyên sâu.
        </p>
        <textarea
          name="urls"
          rows={10}
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-5 text-slate-700 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm resize-none shadow-inner shadow-slate-100/50"
          placeholder="Dán các đường link báo chí vào đây, mỗi link nằm trên một dòng riêng biệt..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !urls.trim()}
        className="btn-primary w-full py-5 rounded-[1.5rem] font-extrabold text-white text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {isLoading ? (
            <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang biên tập bài báo...
            </>
        ) : (
            <>
                <span>📰</span>
                Bắt Đầu Tổng Hợp & Viết Bài
            </>
        )}
      </button>
    </form>
  );
};

export default ArticleForm;
