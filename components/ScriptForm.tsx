
import React, { useState } from 'react';
import type { ScriptFormState, CharacterProfile } from '../types';

interface ScriptFormProps {
  onSubmit: (formState: ScriptFormState) => void;
  isLoading: boolean;
}

const CharacterModal: React.FC<{
    character: Partial<CharacterProfile> | null;
    onSave: (character: CharacterProfile) => void;
    onClose: () => void;
}> = ({ character, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<CharacterProfile>>(
        character || {
            name: '',
            role: 'Chính',
            description: '',
            voice: 'Nữ ấm áp',
            referenceImage: undefined,
        }
    );

    const characterVoices = ['Nam trẻ', 'Nữ ấm áp', 'Trung niên', 'Người dẫn chuyện'];
    const characterRoles: CharacterProfile['role'][] = ['Chính', 'Phụ', 'Dẫn chuyện (Narrator)'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    const base64 = event.target.result.split(',')[1];
                    setFormData({
                        ...formData,
                        referenceImage: { base64, mimeType: file.type },
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: formData.id || crypto.randomUUID(),
            name: formData.name || 'Nhân vật không tên',
            role: formData.role || 'Chính',
            description: formData.description || '',
            voice: formData.voice || 'Nữ ấm áp',
            referenceImage: formData.referenceImage,
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg border border-slate-100" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSave} className="space-y-6">
                    <h2 className="text-xl font-extrabold text-slate-800">{formData.id ? 'Cập nhật Nhân vật' : 'Thêm Nhân vật Mới'}</h2>
                    
                    <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Tên định danh</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm font-bold text-slate-700" />
                    </div>

                    <div className="space-y-2">
                         <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Vai trò kịch bản</label>
                         <div className="flex flex-wrap gap-2">
                            {characterRoles.map(role => (
                                <button type="button" key={role} onClick={() => setFormData({...formData, role})}
                                    className={`px-4 py-1.5 text-xs rounded-full font-bold transition-all ${formData.role === role ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    {role}
                                </button>
                            ))}
                         </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Mô tả đặc điểm</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm font-medium text-slate-600 resize-none"></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="py-4 px-6 rounded-2xl bg-slate-50 text-slate-500 font-bold text-xs hover:bg-slate-100 transition-all">Hủy</button>
                        <button type="submit" className="py-4 px-8 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Xác nhận</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ScriptForm: React.FC<ScriptFormProps> = ({ onSubmit, isLoading }) => {
  const [activeTab, setActiveTab] = useState('script');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null);

  const [formState, setFormState] = useState<ScriptFormState>({
    theme: 'Sáng tạo một câu chuyện cảm động về một phi hành gia đơn độc.',
    script_style: 'Cảm động',
    script_cameraShots: ['Cận cảnh', 'Toàn cảnh'],
    characters: [],
    scene_type: ['Vũ trụ'],
    scene_description: 'Một trạm vũ trụ hiện đại nhưng mang vẻ u buồn, cô đơn giữa những vì sao.',
    scene_colorPalette: 'Tương phản',
    audio_voice: 'Nữ (Miền Bắc)',
    audio_music: 'Cảm xúc',
    audio_sfx_description: 'Tiếng gió rít, tiếng động cơ nhẹ, không gian tĩnh lặng.',
    publish_format: 'YouTube (16:9)',
    publish_quality: '1080p',
    includeEnglish: true,
  });

  const handleCharacterSave = (character: CharacterProfile) => {
    const exists = formState.characters.find(c => c.id === character.id);
    if (exists) {
        setFormState(prev => ({ ...prev, characters: prev.characters.map(c => c.id === character.id ? character : c) }));
    } else {
        setFormState(prev => ({ ...prev, characters: [...prev.characters, character] }));
    }
    setIsModalOpen(false);
    setEditingCharacter(null);
  };
  
  const handleDeleteCharacter = (id: string) => {
      if(window.confirm("Xóa nhân vật này khỏi kịch bản?")) {
        setFormState(prev => ({ ...prev, characters: prev.characters.filter(c => c.id !== id) }));
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormState(prevState => ({ ...prevState, [name]: checked }));
    } else {
        setFormState(prevState => ({ ...prevState, [name]: value }));
    }
  };
  
  const handleSingleOptionChange = (name: keyof ScriptFormState, value: string) => {
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };
  
  const handleMultiOptionChange = (name: keyof ScriptFormState, value: string) => {
    const currentValues = formState[name as 'script_cameraShots' | 'scene_type'];
    if (Array.isArray(currentValues)) {
        const newValues = currentValues.includes(value) ? currentValues.filter(item => item !== value) : [...currentValues, value];
        setFormState({ ...formState, [name]: newValues });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) onSubmit(formState);
  };

  const scriptDialogueStyles = ['Nghiêm túc', 'Dí dỏm', 'Cảm động', 'Kịch tính'];
  const scriptCameraShots = ['Cận cảnh', 'Toàn cảnh', 'Drone', 'POV', 'Slow-motion'];
  const sceneColorPalettes = ['Ấm', 'Lạnh', 'Neon', 'Pastel', 'Điện ảnh', 'Tương phản'];
  const audioVoices = ['Nam (Miền Bắc)', 'Nữ (Miền Bắc)', 'Nam (Miền Nam)', 'Nữ (Miền Nam)'];
  const publishFormats = ['TikTok (9:16)', 'YouTube (16:9)', 'Instagram (1:1)'];

  const tabs = [
    { id: 'script', name: 'Script', icon: '🎬' },
    { id: 'character', name: 'Cast', icon: '🎭' },
    { id: 'scene', name: 'Scene', icon: '🌆' },
    { id: 'audio', name: 'Audio', icon: '🎧' },
    { id: 'publish', name: 'Final', icon: '🎞️' }
  ];

  const renderSingleSelect = (name: keyof ScriptFormState, options: string[]) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => handleSingleOptionChange(name, opt)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all ${formState[name] === opt ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {isModalOpen && <CharacterModal character={editingCharacter} onSave={handleCharacterSave} onClose={() => setIsModalOpen(false)} />}
      <div className="flex flex-col gap-8 animate-fade-in">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab.id ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400'}`}>
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
        </div>

        <div className="min-h-[350px]">
            {activeTab === 'script' && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Ý tưởng chủ đạo</label>
                        <textarea name="theme" rows={6} value={formState.theme} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-sm font-medium text-slate-600 resize-none shadow-inner shadow-slate-100/50" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Phong cách hội thoại</label>
                        {renderSingleSelect('script_style', scriptDialogueStyles)}
                    </div>
                </div>
            )}

            {activeTab === 'character' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Dàn diễn viên ({formState.characters.length})</label>
                        <button type="button" onClick={() => setIsModalOpen(true)} className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-all">+ Thêm</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {formState.characters.length === 0 ? (
                            <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.93M9 21a6 6 0 01-6-6v-1a6 6 0 016-6h6a6 6 0 016 6v1a6 6 0 01-6 6H9z"/></svg>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Chưa có diễn viên</span>
                            </div>
                        ) : (
                            formState.characters.map(c => (
                                <div key={c.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-slate-100">{c.name[0]}</div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{c.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{c.role}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => handleDeleteCharacter(c.id)} className="p-2 text-rose-300 hover:text-rose-500 transition-all">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"/></svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'scene' && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Mô tả bối cảnh chuyên sâu</label>
                        <textarea name="scene_description" rows={6} value={formState.scene_description} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-sm font-medium text-slate-600 resize-none shadow-inner shadow-slate-100/50" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Palette màu sắc</label>
                        {renderSingleSelect('scene_colorPalette', sceneColorPalettes)}
                    </div>
                </div>
            )}

            {activeTab === 'audio' && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Giọng AI dẫn dắt</label>
                        {renderSingleSelect('audio_voice', audioVoices)}
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Đặc tả âm thanh SFX</label>
                        <textarea name="audio_sfx_description" rows={4} value={formState.audio_sfx_description} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-sm font-medium text-slate-600 resize-none shadow-inner shadow-slate-100/50" />
                    </div>
                </div>
            )}

            {activeTab === 'publish' && (
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Tỉ lệ khung hình</label>
                        {renderSingleSelect('publish_format', publishFormats)}
                    </div>
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                        <input type="checkbox" id="includeEnglish" name="includeEnglish" checked={formState.includeEnglish} onChange={handleChange} className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-4 focus:ring-indigo-100 cursor-pointer" />
                        <label htmlFor="includeEnglish" className="text-xs font-bold text-slate-700 cursor-pointer">Cung cấp phiên bản song ngữ (VI-EN)</label>
                    </div>
                </div>
            )}
        </div>

        <button type="submit" onClick={handleSubmit} disabled={isLoading} className="btn-primary w-full py-5 rounded-[1.5rem] flex items-center justify-center gap-3 mt-4">
            {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang biên kịch...</> : <><span>🎬</span> Tạo Kịch Bản Sản Xuất</>}
        </button>
      </div>
    </>
  );
};

export default ScriptForm;
