
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
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              isActive
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
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
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              isActive
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Ý tưởng cốt lõi</label>
        <textarea
          name="theme"
          rows={6}
          value={formState.theme}
          onChange={handleChange}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 p-4 transition-all text-sm resize-none"
          placeholder="Mô tả ý tưởng của bạn..."
          required
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thể loại</label>
            {renderMultiSelectOptions('genre', storyGenres)}
        </div>
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phong cách</label>
            {renderMultiSelectOptions('style', storyStyles)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Độ tuổi</label>
            {renderSingleSelectOptions('age', ageOptions)}
        </div>
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Số chương</label>
            <input
                name="chapters"
                type="number"
                value={formState.chapters}
                onChange={handleNumberChange}
                min="1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-sm text-slate-700"
                required
            />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
      >
        {isLoading ? 'Đang khởi tạo...' : 'Tiến hành sáng tác'}
      </button>
    </form>
  );
};

export default StoryForm;
