
import React, { useState, useEffect, useCallback } from 'react';
import type { AppMode, StoryFormState, StoryPage, VoiceProfile, ScriptFormState, AdImageFormState, AdImageGenerationStatus, AffiliateFormState, AffiliateScriptResult, SavedStory, AdSuggestion, TetConcept } from './types';
import { generateStory, generateArticleFromUrls, generateScript, generateAdImage, generateAffiliateScript, generateAdIdeas } from './services/geminiService';
import { auth, signInWithGoogle, logout, onAuthStateChanged, db, collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, orderBy, User } from './firebase';
import StoryForm from './components/StoryForm';
import StoryViewer from './components/StoryViewer';
import LoadingSpinner from './components/LoadingSpinner';
import ArticleForm from './components/ArticleForm';
import ScriptForm from './components/ScriptForm';
import AdImageForm from './components/AdImageForm';
import AffiliateScriptForm from './components/AffiliateScriptForm';
import SavedStories from './components/SavedStories';
import TetConceptLibrary from './components/TetConceptLibrary';

const paginateStory = (text: string, charsPerPage = 700): StoryPage[] => {
    if (!text) return [];
    const pages: string[] = [];
    let remainingText = text.trim();
    while (remainingText.length > 0) {
        if (remainingText.length <= charsPerPage) {
            pages.push(remainingText);
            break;
        }
        let splitPos = remainingText.lastIndexOf('.', charsPerPage);
        if (splitPos === -1 || splitPos < charsPerPage / 2) splitPos = remainingText.lastIndexOf('\n', charsPerPage);
        if (splitPos === -1 || splitPos < charsPerPage / 2) splitPos = remainingText.lastIndexOf(' ', charsPerPage);
        if (splitPos === -1) splitPos = charsPerPage;
        pages.push(remainingText.substring(0, splitPos + 1).trim());
        remainingText = remainingText.substring(splitPos + 1).trim();
    }
    return pages.filter(p => p.length > 0).map((p, i) => ({ id: i, text: p }));
};

const initialStoryFormState: StoryFormState = {
    theme: 'Một chú cáo nhỏ tên Fin đi tìm kho báu trong khu rừng phép thuật.',
    genre: ['🗺️ Phiêu lưu'],
    style: ['🌟 Nhẹ nhàng'],
    age: '3-5 tuổi',
    chapters: 1,
};

const initialAdImageFormState: AdImageFormState = {
  files: [],
  prompt: 'A minimalist, clean, and elegant advertisement for Lunar New Year 2026, soft studio lighting, traditional red and gold accents.',
  variations: 1,
};

const WelcomeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-red-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden relative border border-white/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="p-10 lg:p-14 text-center relative z-10">
          <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-red-100">
            <span className="text-5xl">🧧</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">Chào mừng bạn tới <span className="text-red-600">PK Creative Hub</span></h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">
            Nền tảng trí tuệ nhân tạo thế hệ mới chuyên biệt cho sáng tạo nội dung, thiết kế quảng cáo và kịch bản truyền thông 2026.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 text-left">
              <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">Thiết kế</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">Studio Ảnh Quảng Cáo 2K & Bảo tồn nhân dạng PK-Face</p>
            </div>
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 text-left">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Dịch vụ</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">Hỗ trợ API Key cá nhân để vượt qua giới hạn Quota/Permission</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full py-5 bg-gradient-to-r from-red-600 to-red-800 rounded-2xl text-white font-black text-lg shadow-2xl shadow-red-200 transition-all hover:scale-[1.02] active:scale-95"
          >
            BẮT ĐẦU SÁNG TẠO NGAY
          </button>
        </div>
      </div>
    </div>
  );
};

const ApiKeyModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  currentKey: string; 
  onSave: (key: string) => void 
}> = ({ isOpen, onClose, currentKey, onSave }) => {
  const [key, setKey] = useState(currentKey);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-2">Cấu Hình API Key</h3>
        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
          Sử dụng API Key cá nhân (Gemini API) để tăng giới hạn sử dụng và đảm bảo tính ổn định cao nhất.
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Gemini API Key</label>
            <input 
              type="password" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Nhập API Key của bạn..."
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-500 focus:bg-white outline-none transition-all font-mono text-sm"
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            >
              HỦY
            </button>
            <button 
              onClick={() => onSave(key)}
              className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
            >
              LƯU LẠI
            </button>
          </div>
          
          <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed">
            API Key của bạn được lưu trữ an toàn trong tài khoản cá nhân và chỉ được sử dụng cho các yêu cầu của chính bạn.
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [mode, setMode] = useState<AppMode>('story');
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [fullStoryText, setFullStoryText] = useState<string | null>(null);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [synopsis, setSynopsis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasQuotaError, setHasQuotaError] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  
  const [affiliateResult, setAffiliateResult] = useState<AffiliateScriptResult | null>(null);
  const [adImageStatus, setAdImageStatus] = useState<AdImageGenerationStatus>({ status: 'idle', results: [] });
  const [adSuggestions, setAdSuggestions] = useState<AdSuggestion[] | null>(null);
  const [isSuggestingAd, setIsSuggestingAd] = useState(false);
  const [adSuggestionError, setAdSuggestionError] = useState<string | null>(null);

  const [storyFormState, setStoryFormState] = useState<StoryFormState>(initialStoryFormState);
  const [adImageFormState, setAdImageFormState] = useState<AdImageFormState>(initialAdImageFormState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'content'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setSavedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    } else {
      setSavedItems([]);
    }
  }, [user]);

  const handleSaveContent = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu nội dung!");
      return;
    }
    if (!fullStoryText && adImageStatus.results.length === 0) return;

    try {
      const contentId = crypto.randomUUID();
      await setDoc(doc(db, 'content', contentId), {
        uid: user.uid,
        type: mode,
        title: synopsis || (mode === 'ad' ? 'Bộ ảnh quảng cáo' : 'Nội dung mới'),
        content: fullStoryText || JSON.stringify(adImageStatus.results),
        metadata: {
          mode,
          synopsis,
          voiceProfile,
          affiliateResult
        },
        createdAt: serverTimestamp()
      });
      alert("Đã lưu thành công vào lịch sử!");
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      alert("Không thể lưu nội dung.");
    }
  };

  const resetOutput = () => {
    setPages([]);
    setFullStoryText(null);
    setSynopsis(null);
    setVoiceProfile(null);
    setAffiliateResult(null);
    setAdImageStatus({ status: 'idle', results: [] });
    setAdSuggestions(null);
    setError(null);
    setHasQuotaError(false);
    setHasPermissionError(false);
  };

  const handleOpenKeySelector = () => {
    setIsKeyModalOpen(true);
  };

  const handleSaveApiKey = async (key: string) => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu API Key!");
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid), {
        customApiKey: key
      }, { merge: true });
      setIsKeyModalOpen(false);
      alert("Đã lưu API Key thành công!");
    } catch (err) {
      console.error("Lỗi khi lưu API Key:", err);
      alert("Không thể lưu API Key.");
    }
  };

  const handleError = (err: any) => {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      if (msg.includes("Quota") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
          setHasQuotaError(true);
      }
      if (msg.includes("Permission") || msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
          setHasPermissionError(true);
      }
  };

  const handleGenerateStory = async () => {
    setIsLoading(true);
    resetOutput();
    setStatusMessage('Đang dệt nên thế giới kỳ diệu...');
    try {
        const response = await generateStory(storyFormState, "", userProfile?.customApiKey);
        setFullStoryText(response.story.storyText);
        setPages(paginateStory(response.story.storyText));
        setVoiceProfile(response.story.voiceProfile);
        setSynopsis(response.story.synopsis);
    } catch (err) {
        handleError(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateArticle = async (urls: string[]) => {
    setIsLoading(true);
    resetOutput();
    setStatusMessage('Đang tổng hợp dữ liệu từ các nguồn uy tín...');
    try {
        const data = await generateArticleFromUrls(urls, userProfile?.customApiKey);
        setFullStoryText(data.vietnameseArticle);
        setPages(paginateStory(data.vietnameseArticle));
        setSynopsis(data.vietnameseTitle);
    } catch (err) {
        handleError(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateScript = async (form: ScriptFormState) => {
    setIsLoading(true);
    resetOutput();
    setStatusMessage('Đang biên kịch kịch bản Production chuyên nghiệp...');
    try {
        const data = await generateScript(form, userProfile?.customApiKey);
        setFullStoryText(data.vietnameseScript);
        setPages(paginateStory(data.vietnameseScript));
    } catch (err) {
        handleError(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateAdSuggestions = async (productInfo: string) => {
    setIsSuggestingAd(true);
    setAdSuggestionError(null);
    try {
        const ideas = await generateAdIdeas(productInfo, userProfile?.customApiKey);
        setAdSuggestions(ideas);
    } catch (err) {
        setAdSuggestionError(err instanceof Error ? err.message : 'Không thể tạo gợi ý');
    } finally {
        setIsSuggestingAd(false);
    }
  };

  const handleGenerateAdImage = async () => {
    setIsLoading(true);
    setAdImageStatus({ status: 'generating', results: [] });
    setStatusMessage('Đang kết nối Studio 2K - Bảo tồn nhận diện...');
    try {
        const results = await generateAdImage(adImageFormState, userProfile?.customApiKey);
        setAdImageStatus({ 
            status: 'completed', 
            results: results.map(base64 => ({ id: crypto.randomUUID(), base64 })) 
        });
    } catch (err) {
        setAdImageStatus({ status: 'failed', results: [] });
        handleError(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateAffiliate = async (form: AffiliateFormState) => {
    setIsLoading(true);
    resetOutput();
    setStatusMessage('Đang phân tích insights và viết kịch bản viral...');
    try {
        const result = await generateAffiliateScript(form, userProfile?.customApiKey);
        setAffiliateResult(result);
        setFullStoryText(result.scriptText);
        setPages(paginateStory(result.scriptText));
    } catch (err) {
        handleError(err);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUseTetConcept = (concept: TetConcept) => {
      setMode('ad');
      setAdImageFormState({ ...adImageFormState, prompt: concept.prompt });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const modeOptions = [
      { id: 'story', icon: '📚', label: 'Truyện AI', desc: 'Văn học & Sáng tạo' },
      { id: 'article', icon: '📰', label: 'Tòa Soạn', desc: 'Báo chí & Tin tức' },
      { id: 'script', icon: '🎬', label: 'Phim Pro', desc: 'Kịch bản Điện ảnh' },
      { id: 'ad', icon: '🖼️', label: 'Ảnh QC', desc: 'Studio Thiết kế 2K' },
      { id: 'affiliate', icon: '💰', label: 'Affiliate', desc: 'Viral Content Lab' },
      { id: 'history', icon: '📜', label: 'Lịch Sử', desc: 'Kho Lưu Trữ' },
      { id: 'tet_2026', icon: '🧧', label: 'Tết 2026', desc: 'Concept Xuân Việt' },
  ];

  return (
    <div className="min-h-screen flex flex-col transition-all duration-700 bg-tet-pattern safe-bottom pb-24 lg:pb-0">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      
      {/* Premium Support Header */}
      <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white px-4 py-6 lg:px-10 lg:py-8 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 sticky top-0 z-[60] shadow-xl border-b border-red-700/30">
          <div className="flex items-center gap-4 lg:gap-8 w-full lg:w-auto">
              <div className="relative shrink-0">
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-red-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                  <div className="relative w-20 h-20 lg:w-32 lg:h-32 bg-white p-1.5 rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden">
                      <img 
                        src="https://img.vietqr.io/image/BIDV-6320410146-compact2.jpg?amount=99000&addInfo=Moi%20Khoa%20Cafe%202026&accountName=PHAM%20VAN%20KHOA" 
                        alt="QR Code" 
                        className="w-full h-full object-contain rounded-lg" 
                      />
                  </div>
              </div>
              
              <div className="flex-grow">
                  <div className="flex items-center gap-2 lg:gap-3 mb-1">
                    <span className="text-xl lg:text-3xl">☕️</span>
                    <h2 className="text-lg lg:text-2xl font-black tracking-tight leading-none">
                        Mời <span className="gold-text-shimmer">Phạm Khoa cafe 99k</span>
                    </h2>
                  </div>
                  <p className="text-[9px] lg:text-[11px] font-black text-red-300 uppercase tracking-widest opacity-80">
                      BIDV • 6320410146 • PHAM VAN KHOA
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={handleOpenKeySelector} className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        API KEY
                    </button>
                    {user ? (
                      <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-xl border border-white/5">
                        <img src={user.photoURL || ''} className="w-6 h-6 rounded-full border border-white/20" alt="User" />
                        <span className="text-[10px] font-bold truncate max-w-[80px]">{user.displayName}</span>
                        <button onClick={logout} className="text-[10px] text-red-400 hover:text-red-300 font-black uppercase">Thoát</button>
                      </div>
                    ) : (
                      <button onClick={signInWithGoogle} className="text-[10px] bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20">
                        Đăng Nhập Gmail
                      </button>
                    )}
                  </div>
              </div>
          </div>

          <div className="hidden xl:flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                      <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                  </div>
                  <div className="text-right">
                      <p className="text-lg font-black text-white leading-none">Phạm Văn Khoa</p>
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mt-1">Lead AI Architect</p>
                  </div>
              </div>
          </div>
      </header>

      <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 py-6 lg:py-12 flex-grow">
        {/* Error Warning Banners */}
        {(hasQuotaError || hasPermissionError) && (
            <div className="mb-10 p-6 lg:p-10 bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] shadow-2xl animate-bounce-slow flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="w-16 h-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-amber-200 shrink-0">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-amber-900 leading-tight mb-2">
                            {hasPermissionError ? "Lỗi Quyền Truy Cập (403 Forbidden)" : "Hết Hạn Mức Miễn Phí (429 Quota)"}
                        </h4>
                        <p className="text-sm font-bold text-amber-700/80 leading-relaxed max-w-xl">
                            {hasPermissionError 
                              ? "API Key hiện tại không có quyền sử dụng model cao cấp này. Vui lòng sử dụng API Key từ Project Google Cloud đã bật Billing (thanh toán)." 
                              : "Hạn mức API Key hệ thống đã hết. Để duy trì chất lượng 2K và bảo tồn nhận diện, vui lòng sử dụng API Key cá nhân trả phí của bạn."}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenKeySelector}
                    className="shrink-0 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                    THAY ĐỔI API KEY TRẢ PHÍ
                </button>
            </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8">
            <div className="premium-card p-8 bg-white/80 backdrop-blur-xl sticky top-48">
                <div className="flex items-center gap-4 mb-8 pb-4 border-b border-red-50">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16m-7 6h7"/></svg>
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Creative Hub</h2>
                </div>
                
                <nav className="space-y-3">
                    {modeOptions.map(opt => (
                        <button 
                            key={opt.id} 
                            onClick={() => { setMode(opt.id as any); resetOutput(); }}
                            className={`w-full group text-left p-4 rounded-2xl transition-all flex items-center gap-4 border-2 ${
                                mode === opt.id 
                                ? 'bg-white border-red-500 shadow-xl shadow-red-100 scale-105 z-10' 
                                : 'bg-transparent border-transparent hover:bg-red-50/50 text-slate-500'
                            }`}
                        >
                            <span className={`text-xl w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-500 ${
                                 mode === opt.id ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                            }`}>{opt.icon}</span>
                            <div>
                                <span className={`block text-sm font-black tracking-tight ${mode === opt.id ? 'text-red-700' : 'text-slate-800'}`}>{opt.label}</span>
                                <span className="block text-[10px] font-bold mt-0.5 opacity-60 uppercase">{opt.desc}</span>
                            </div>
                        </button>
                    ))}
                </nav>
            </div>
          </aside>

          {/* Configuration Form Column */}
          <section className="lg:col-span-4 order-1 lg:order-2">
            <div className="premium-card p-6 lg:p-10 bg-white">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 text-red-600 border border-red-100 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                    </div>
                    <div>
                        <h3 className="text-xl lg:text-2xl font-black text-slate-900 leading-tight">Cấu Hình</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Sáng tạo 2026</p>
                    </div>
                </div>
                <div className="animate-fade-in">
                    {mode === 'story' && <StoryForm formState={storyFormState} onFormChange={setStoryFormState} onSubmit={handleGenerateStory} isLoading={isLoading} />}
                    {mode === 'article' && <ArticleForm onSubmit={handleGenerateArticle} isLoading={isLoading} />}
                    {mode === 'script' && <ScriptForm onSubmit={handleGenerateScript} isLoading={isLoading} />}
                    {mode === 'ad' && <AdImageForm formState={adImageFormState} onFormChange={setAdImageFormState} onSubmit={handleGenerateAdImage} isLoading={isLoading} onGenerateSuggestions={handleGenerateAdSuggestions} suggestions={adSuggestions} isSuggesting={isSuggestingAd} suggestionError={adSuggestionError} />}
                    {mode === 'affiliate' && <AffiliateScriptForm onSubmit={handleGenerateAffiliate} isLoading={isLoading} />}
                    {mode === 'tet_2026' && <TetConceptLibrary onSelect={handleUseTetConcept} />}
                    {mode === 'history' && (
                      <div className="space-y-4">
                        {savedItems.length === 0 ? (
                          <p className="text-center text-slate-400 py-10 font-bold">Chưa có nội dung nào được lưu.</p>
                        ) : (
                          savedItems.map(item => (
                            <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-200 transition-all cursor-pointer group" onClick={() => {
                              if (item.type === 'ad') {
                                setAdImageStatus({ status: 'completed', results: JSON.parse(item.content) });
                              } else {
                                setFullStoryText(item.content);
                                setPages(paginateStory(item.content));
                                setSynopsis(item.title);
                                setVoiceProfile(item.metadata?.voiceProfile);
                                setAffiliateResult(item.metadata?.affiliateResult);
                              }
                              setMode(item.type);
                            }}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{item.type}</span>
                                  <h4 className="font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                                  <p className="text-[10px] text-slate-400 mt-1">{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Đang lưu...'}</p>
                                </div>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600">➔</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                </div>
            </div>
          </section>

          {/* Result View Column */}
          <section className="lg:col-span-5 order-2 lg:order-3 min-h-[50vh]">
             {isLoading && <LoadingSpinner statusMessage={statusMessage} />}
             
             {error && (
                 <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-3xl text-rose-700 animate-fade-in flex flex-col items-start gap-5 shadow-lg">
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        </div>
                        <div>
                            <p className="font-black text-lg mb-1">Yêu cầu bị từ chối</p>
                            <p className="opacity-80 font-bold text-sm leading-relaxed">{error}</p>
                        </div>
                    </div>
                    {(hasQuotaError || hasPermissionError) && (
                        <button onClick={handleOpenKeySelector} className="mt-4 w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xs">
                            BẤM VÀO ĐÂY ĐỂ ĐỔI API KEY TRẢ PHÍ (BILLING)
                        </button>
                    )}
                 </div>
             )}
             
             {!isLoading && mode === 'ad' && adImageStatus.results.length > 0 && (
                <div className="grid grid-cols-1 gap-8 animate-fade-in">
                    <div className="flex justify-end">
                      <button 
                        onClick={handleSaveContent}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                        LƯU BỘ ẢNH NÀY
                      </button>
                    </div>
                    {adImageStatus.results.map((res, i) => (
                        <div key={res.id} className="premium-card p-6 group relative overflow-hidden">
                            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-50 shadow-lg">
                                <img src={`data:image/png;base64,${res.base64}`} alt="Art" className="w-full h-auto object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm">
                                    <button onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `data:image/png;base64,${res.base64}`;
                                        link.download = `pk-2026-${i+1}.png`;
                                        link.click();
                                    }} className="px-6 py-3 bg-white text-red-700 rounded-2xl font-black shadow-xl transition-all hover:scale-110 flex items-center gap-3">
                                        TẢI ARTWORK 2K
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             )}

             {!isLoading && (pages.length > 0 || affiliateResult) && (
                 <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-end">
                      <button 
                        onClick={handleSaveContent}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                        LƯU VÀO LỊCH SỬ
                      </button>
                    </div>
                    {affiliateResult && (
                        <div className="premium-card p-8 space-y-6">
                            <h3 className="text-xl font-black text-slate-900 leading-none">Master Consistency Flow</h3>
                            <div className="bg-slate-50 p-6 rounded-2xl font-mono text-[11px] text-slate-800 leading-relaxed border border-red-50 select-all shadow-inner">
                                {affiliateResult.masterFlowPrompt}
                            </div>
                        </div>
                    )}
                    <StoryViewer 
                        pages={pages} 
                        fullStoryText={fullStoryText} 
                        voiceProfile={voiceProfile} 
                        synopsis={synopsis} 
                        title={mode === 'affiliate' ? 'Kịch Bản Viral' : 'Kết Quả Sáng Tạo'}
                        onAnalyzeScenes={()=>{}}
                        isAnalyzingScenes={false}
                        scenePrompts={affiliateResult?.scenes || null}
                        analysisError={null}
                        onGenerateImage={()=>{}}
                        imageStatuses={{}}
                        onGenerateVideo={()=>{}}
                        videoStatuses={{}}
                        sceneCountTarget="Tự động"
                        onSceneCountChange={()=>{}}
                        articleData={null}
                        onDownloadMedia={()=>{}}
                    />
                 </div>
             )}

             {!isLoading && pages.length === 0 && adImageStatus.results.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border border-red-50/50 shadow-sm animate-fade-in">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-800">Studio PK Sẵn Sàng</h3>
                    <p className="mt-2 text-xs text-slate-400 font-bold">Hãy sử dụng API Key trả phí để có chất lượng tốt nhất.</p>
                </div>
             )}
          </section>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] nav-blur border-t border-slate-100 flex items-center justify-around px-2 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          {modeOptions.map(opt => (
              <button 
                key={opt.id} 
                onClick={() => { setMode(opt.id as any); resetOutput(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`relative flex flex-col items-center justify-center w-14 transition-all duration-300 ${mode === opt.id ? 'bottom-nav-active' : 'text-slate-400'}`}
              >
                  <span className="text-xl mb-1">{opt.icon}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-center">{opt.label}</span>
              </button>
          ))}
      </nav>

      <footer className="mt-12 py-16 border-t-2 border-red-50 bg-white text-center">
        <div className="container mx-auto px-8 flex flex-col items-center gap-8">
            <p className="text-2xl lg:text-3xl font-display italic font-black text-red-800 tracking-widest uppercase">Phạm Khoa</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                Copyright © 2026 Phạm Khoa
            </p>
        </div>
      </footer>

      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
        currentKey={userProfile?.customApiKey || ''}
        onSave={handleSaveApiKey}
      />
    </div>
  );
};

export default App;
