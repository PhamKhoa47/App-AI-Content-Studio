
import React from 'react';
import type { StoryFormState } from '../types';

interface StoryFormProps {
  formState: StoryFormState;
  onFormChange: (newState: StoryFormState) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const StoryForm: React.FC<StoryFormProps> = ({ formState, onFormChange, onSubmit, isLoading }) => {

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onFormChange({ ...formState, [name]: value });
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    onFormChange({ ...formState, [name]: numValue > 0 ? numValue : 1 });
  };

  const handleOptionChange = (name: 'genre' | 'style', value: string) => {
    const currentValues = formState[name];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    if (newValues.length > 0) {
        onFormChange({ ...formState, [name]: newValues });
    }
  };
  
  const handleSingleOptionChange = (name: 'age', value: string) => {
    onFormChange({ ...formState, [name]: value });
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit();
    }
  };

 const storyGenres = [
    '🗺️ Phiêu lưu', '🔮 Giả tưởng', '🚀 Sci-fi', '😂 Hài hước', '❓ Huyền bí',
    '🏛️ Ngụ ngôn', '🔍 Trinh thám', '🌿 Đời thường', '🌸 Tiên hiệp', '🎨 Hoạt hình',
  ];

  const storyStyles = [
    '🌟 Nhẹ nhàng', '✍️ Giàu chất thơ', '🎬 Kịch tính', '😌 Thư giãn',
  ];
  
  const ageOptions = ['3-5 tuổi', '6-10 tuổi', 'Thiếu niên', 'Người lớn'];

  const renderMultiSelectOptions = (name: 'genre' | 'style', options: string[]) => (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const isActive = formState[name].includes(option);
        return (
          <button
            type="button"
            key={option}
            onClick={() => handleOptionChange(name, option)}
            className={`px-4 py-2 text-xs rounded-xl transition-all duration-300 border-2 ${
              isActive
                ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 scale-105'
                : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-500'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
  
  const renderSingleSelectOptions = (name: 'age', options: string[]) => (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const isActive = formState[name] === option;
        return (
          <button
            type="button"
            key={option}
            onClick={() => handleSingleOptionChange(name, option)}
            className={`px-4 py-2 text-xs rounded-xl transition-all duration-300 border-2 ${
              isActive
                ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 scale-105'
                : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-500'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );


  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">1. Ý tưởng cốt lõi</label>
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">Bắt buộc</span>
        </div>
        <textarea
          name="theme"
          rows={6}
          value={formState.theme}
          onChange={handleChange}
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 p-6 transition-all text-sm resize-none shadow-inner"
          placeholder="Ví dụ: Một chú rồng nhỏ sợ lửa đi tìm kiếm lòng dũng cảm trong khu rừng pha lê..."
          required
        />
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Thể loại</label>
            {renderMultiSelectOptions('genre', storyGenres)}
        </div>
        <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Phong cách văn học</label>
            {renderMultiSelectOptions('style', storyStyles)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Đối tượng</label>
            {renderSingleSelectOptions('age', ageOptions)}
        </div>
        <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Quy mô (Số chương)</label>
            <div className="relative">
                <input
                    name="chapters"
                    type="number"
                    value={formState.chapters}
                    onChange={handleNumberChange}
                    min="1"
                    max="20"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all"
                    required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Chương</div>
            </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full py-5 rounded-[2rem] group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <span className="relative flex items-center justify-center gap-3">
            {isLoading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang khởi tạo thế giới...
                </>
            ) : (
                <>
                    <span className="text-lg">✨</span>
                    Tiến hành sáng tác
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </>
            )}
        </span>
      </button>
    </form>
  );
};

export default StoryForm;
