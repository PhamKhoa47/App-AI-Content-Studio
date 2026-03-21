
import React, { useState, useEffect, useCallback } from 'react';
import type { StoryPage, VoiceProfile, ScenePrompt } from '../types';

interface StoryViewerProps {
  pages: StoryPage[];
  fullStoryText: string | null;
  voiceProfile: VoiceProfile | null;
  synopsis: string | null;
  title: string;
  onAnalyzeScenes: () => void;
  isAnalyzingScenes: boolean;
  scenePrompts: ScenePrompt[] | null;
  analysisError: string | null;
  onGenerateImage: (prompt: string, scene: number, quality: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3') => void;
  imageStatuses: Record<number, any>;
  onGenerateVideo: (prompt: string, scene: number, quality: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3') => void;
  videoStatuses: Record<number, any>;
  sceneCountTarget: string;
  onSceneCountChange: (value: string) => void;
  articleData: any;
  onDownloadMedia: (url: string, filename: string) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ 
    pages, 
    voiceProfile, 
    synopsis, 
    title,
    scenePrompts,
}) => {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    const currentPage = pages[currentPageIndex];

    useEffect(() => {
        const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
            loadVoices();
        }
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.onvoiceschanged = null;
                if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
            }
        };
    }, []);

    const speakText = useCallback((text: string, onEndCallback: () => void) => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const vnVoice = voices.find(v => v.lang.startsWith('vi-VN'));
        if (vnVoice) utterance.voice = vnVoice;
        utterance.lang = 'vi-VN';
        if (voiceProfile) {
            utterance.rate = voiceProfile.speed === 'slow' ? 0.8 : voiceProfile.speed === 'fast' ? 1.2 : 1.0;
        }
        utterance.onend = onEndCallback;
        window.speechSynthesis.speak(utterance);
    }, [voices, voiceProfile]);

    const changePage = (direction: 'next' | 'prev') => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsPlaying(false);
        if (direction === 'next' && currentPageIndex < pages.length - 1) setCurrentPageIndex(prev => prev + 1);
        else if (direction === 'prev' && currentPageIndex > 0) setCurrentPageIndex(prev => prev - 1);
    };

    const handleToggleVoice = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            speakText(currentPage.text, () => setIsPlaying(false));
        }
    };

    return (
        <div className="space-y-10 animate-fade-in relative">
            {/* Main Content Container */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                {/* Branding Notice */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none z-20">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.6em] whitespace-nowrap">Intelligence Content by Phạm Khoa © 2026</span>
                </div>

                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
                
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                    <div>
                        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-4">{title}</h3>
                        {synopsis && (
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                <p className="text-sm text-slate-400 font-medium italic leading-relaxed">{synopsis}</p>
                            </div>
                        )}
                    </div>
                    <button onClick={handleToggleVoice} 
                        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl active:scale-95 ${
                            isPlaying 
                            ? 'bg-indigo-600 text-white shadow-indigo-200' 
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                        }`}
                    >
                        {isPlaying ? (
                            <>
                                <div className="flex gap-0.5">
                                    <div className="w-1 h-3 bg-white animate-[bounce_1s_infinite_0.1s]"></div>
                                    <div className="w-1 h-3 bg-white animate-[bounce_1s_infinite_0.2s]"></div>
                                    <div className="w-1 h-3 bg-white animate-[bounce_1s_infinite_0.3s]"></div>
                                </div>
                                Dừng Nghe
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z"/></svg>
                                Nghe AI Đọc
                            </>
                        )}
                    </button>
                </div>
                
                <div className="bg-[#fcfdfe] p-10 md:p-14 rounded-[3rem] min-h-[350px] flex items-start border border-slate-100 shadow-inner shadow-slate-100/30 relative">
                    <p className="font-serif text-2xl leading-[1.8] text-slate-800 text-left w-full font-medium antialiased">
                        {currentPage?.text}
                    </p>
                </div>

                <div className="mt-10 flex items-center justify-center gap-10">
                    <button onClick={() => changePage('prev')} disabled={currentPageIndex === 0}
                        className="p-5 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 disabled:opacity-30 shadow-sm transition-all hover:scale-105 active:scale-95">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-widest mb-1">Trang</span>
                        <div className="text-xl font-extrabold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl">
                            {currentPageIndex + 1} <span className="text-slate-300 font-medium">/</span> {pages.length}
                        </div>
                    </div>

                    <button onClick={() => changePage('next')} disabled={currentPageIndex === pages.length - 1}
                        className="p-5 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 disabled:opacity-30 shadow-sm transition-all hover:scale-105 active:scale-95">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                    </button>
                </div>
            </div>

            {/* Storyboard / Scene Analysis Section */}
            {scenePrompts && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-4">
                        <h4 className="text-xl font-extrabold text-slate-800 tracking-tight">Cấu trúc Hình ảnh (Storyboard)</h4>
                        <div className="h-px bg-slate-100 flex-grow"></div>
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-widest">Powered by PK AI</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {scenePrompts.map((p, idx) => (
                            <div key={idx} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-50 group-hover:bg-indigo-500 transition-colors"></div>
                                <div className="flex gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                                        <span className="text-sm font-extrabold text-slate-400 group-hover:text-indigo-600">#{p.scene}</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mb-1">Hành động & Diễn hoạt</p>
                                            <p className="text-base font-bold text-slate-800 leading-snug">{p.action}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Visual Prompt (Bản quyền PK Suite)</p>
                                            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 italic font-medium leading-relaxed border border-slate-100/50">
                                                {p.prompt}
                                            </div>
                                        </div>
                                        {p.dialogue && (
                                            <div>
                                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Thoại / Voiceover</p>
                                                <p className="text-sm text-slate-600 font-medium">"{p.dialogue}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryViewer;
