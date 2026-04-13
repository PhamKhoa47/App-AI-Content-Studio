
import React, { useState, useEffect, useCallback, Component, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from "react-ga4";
import { ToastProvider, useToast } from './components/Toast';
import type { AppMode, StoryFormState, StoryPage, VoiceProfile, ScriptFormState, AdImageFormState, AdImageGenerationStatus, AffiliateFormState, AffiliateScriptResult, SavedStory, AdSuggestion, TetConcept } from './types';
import { generateStory, generateArticleFromUrls, generateScript, generateAdImage, generateAffiliateScript, generateAdIdeas } from './services/geminiService';
import { auth, signInWithGoogle, logout, onAuthStateChanged, db, collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, orderBy, User, handleFirestoreError, OperationType } from './firebase';

// Lazy loading components for performance
const StoryForm = lazy(() => import('./components/StoryForm'));
const StoryViewer = lazy(() => import('./components/StoryViewer'));
const LoadingSpinner = lazy(() => import('./components/LoadingSpinner'));
const ArticleForm = lazy(() => import('./components/ArticleForm'));
const ScriptForm = lazy(() => import('./components/ScriptForm'));
const AdImageForm = lazy(() => import('./components/AdImageForm'));
const AffiliateScriptForm = lazy(() => import('./components/AffiliateScriptForm'));
const SavedStories = lazy(() => import('./components/SavedStories'));
const TetConceptLibrary = lazy(() => import('./components/TetConceptLibrary'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const OfferPage = lazy(() => import('./components/OfferPage'));
import ProtectedRoute from './components/ProtectedRoute';

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
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-2">Cấu Hình API Key</h3>
        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
          Sử dụng API Key cá nhân (Gemini API) để tăng giới hạn sử dụng và đảm bảo tính ổn định cao nhất.
          <br />
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 font-bold hover:underline mt-2 inline-block"
          >
            👉 Nhấn vào đây để lấy API Key miễn phí
          </a>
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Gemini API Key</label>
            <input 
              type="password" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Nhập API Key của bạn..."
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-mono text-sm"
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
              className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
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

const UserMenu: React.FC<{ user: User; onLogout: () => void; onOpenKey: () => void }> = ({ user, onLogout, onOpenKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 p-1.5 pr-4 rounded-2xl border border-slate-200 transition-all"
      >
        <img src={user.photoURL || ''} className="w-8 h-8 rounded-xl border border-slate-200 shadow-sm" alt="User" />
        <div className="text-left hidden md:block text-slate-900">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 leading-none mb-1">Thành viên</p>
          <p className="text-xs font-bold truncate max-w-[100px] leading-none">{user.displayName}</p>
        </div>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[80] animate-slide-in-top">
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tài khoản</p>
              <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
            </div>
            <div className="p-2">
              <button 
                onClick={() => { onOpenKey(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-700 font-bold text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                </div>
                Cấu hình API Key
              </button>
              <button 
                onClick={() => { onLogout(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-100 rounded-2xl transition-colors text-blue-600 font-bold text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                </div>
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Đã có lỗi xảy ra</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang hoặc liên hệ hỗ trợ nếu lỗi tiếp tục diễn ra.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              TẢI LẠI TRANG
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-[10px] text-slate-300 cursor-pointer uppercase font-black tracking-widest">Chi tiết kỹ thuật</summary>
                <pre className="mt-2 p-4 bg-slate-900 text-green-400 text-[10px] rounded-xl overflow-auto max-h-40 font-mono">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const MainApp: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(true);
  
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
  const [hasQuotaError, setHasQuotaError] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  useEffect(() => {
    if (user) {
      // Check for affiliate cooldown
      const lastClick = localStorage.getItem('affiliate_click_timestamp');
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours

      if (!lastClick || (now - parseInt(lastClick)) > cooldown) {
        navigate("/offer", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLogin = () => {
    navigate("/login");
  };
  
  const [affiliateResult, setAffiliateResult] = useState<AffiliateScriptResult | null>(null);
  const [adImageStatus, setAdImageStatus] = useState<AdImageGenerationStatus>({ status: 'idle', results: [] });
  const [adSuggestions, setAdSuggestions] = useState<AdSuggestion[] | null>(null);
  const [isSuggestingAd, setIsSuggestingAd] = useState(false);
  const [adSuggestionError, setAdSuggestionError] = useState<string | null>(null);

  const [storyFormState, setStoryFormState] = useState<StoryFormState>(initialStoryFormState);
  const [adImageFormState, setAdImageFormState] = useState<AdImageFormState>(initialAdImageFormState);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic SEO metadata based on mode
  const getPageMetadata = () => {
    switch(mode) {
      case 'story': return { title: 'Viết Truyện AI | PK Creative Hub', desc: 'Sáng tạo truyện thiếu nhi, tiểu thuyết với AI.' };
      case 'article': return { title: 'Tổng Hợp Báo Chí AI | PK Creative Hub', desc: 'Tự động tổng hợp bài viết từ nhiều nguồn uy tín.' };
      case 'script': return { title: 'Kịch Bản Viral AI | PK Creative Hub', desc: 'Sáng tạo kịch bản video ngắn TikTok, Reels, Shorts.' };
      case 'ad': return { title: 'Thiết Kế Quảng Cáo AI | PK Creative Hub', desc: 'Tạo hình ảnh quảng cáo 2K chuyên nghiệp.' };
      case 'affiliate': return { title: 'Affiliate Marketing AI | PK Creative Hub', desc: 'Tối ưu nội dung tiếp thị liên kết.' };
      case 'tet_2026': return { title: 'Concept Tết 2026 | PK Creative Hub', desc: 'Thư viện ý tưởng sáng tạo cho mùa Tết 2026.' };
      default: return { title: 'PK Creative Hub | AI Content Suite', desc: 'Nền tảng AI sáng tạo nội dung đa phương tiện.' };
    }
  };

  const metadata = getPageMetadata();

  // Initialize GA4
  useEffect(() => {
    if (process.env.GA_MEASUREMENT_ID) {
      // ReactGA.initialize(process.env.GA_MEASUREMENT_ID);
    }
  }, []);

  // Track page view on mode change
  useEffect(() => {
    if (process.env.GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: `/${mode}`, title: metadata.title });
    }
  }, [mode, metadata.title]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data());
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
      return () => unsubscribe();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'content'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setSavedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'content');
      });
      return () => unsubscribe();
    } else {
      setSavedItems([]);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Đã đăng xuất an toàn.", "info");
      navigate("/login");
    } catch (err) {
      showToast("Lỗi khi đăng xuất.", "error");
    }
  };

  const handleSaveContent = async () => {
    if (!user) {
      showToast("Vui lòng đăng nhập để lưu nội dung!", "warning");
      return;
    }
    if (!fullStoryText && adImageStatus.results.length === 0) return;

    const contentId = crypto.randomUUID();
    try {
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
      showToast("Đã lưu thành công vào lịch sử!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `content/${contentId}`);
      showToast("Không thể lưu nội dung.", "error");
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
      showToast("Vui lòng đăng nhập để lưu API Key!", "warning");
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid), {
        customApiKey: key
      }, { merge: true });
      setIsKeyModalOpen(false);
      showToast("Đã lưu API Key thành công!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      showToast("Không thể lưu API Key.", "error");
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
    <>
      <Helmet>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.desc} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.desc} />
        <meta property="twitter:title" content={metadata.title} />
        <meta property="twitter:description" content={metadata.desc} />
      </Helmet>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-white border border-slate-100 rounded-2xl shadow-2xl text-indigo-600 transition-all duration-500 hover:scale-110 active:scale-95 ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7"/></svg>
      </button>
      <div className={`min-h-screen flex flex-col transition-all duration-700 bg-slate-50 pb-24 lg:pb-0 ${!user ? 'blur-md pointer-events-none select-none' : ''}`}>
      
      {/* Compact Sticky Header */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-[60] border-b border-slate-200 shadow-sm px-4 py-3 lg:px-8 lg:py-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">PK Hub</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block mt-1">Creative Studio 2026</p>
              </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
              {user ? (
                  <>
                      <button onClick={() => navigate("/offer")} className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-5 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-200 active:scale-95">
                          <span className="text-lg leading-none">🎁</span>
                          Nhận Ưu Đãi
                      </button>
                      <UserMenu user={user} onLogout={handleLogout} onOpenKey={handleOpenKeySelector} />
                  </>
              ) : (
                  <button onClick={() => navigate("/login")} className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-200 active:scale-95">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      Đăng Nhập
                  </button>
              )}
              
              {/* Hamburger Menu Toggle */}
              <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isMobileMenuOpen ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                      ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"/>
                      )}
                  </svg>
              </button>
          </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
          {isMobileMenuOpen && (
              <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="lg:hidden fixed inset-0 z-[55] bg-white pt-20 px-4 pb-24 overflow-y-auto"
              >
                  <div className="space-y-2 mt-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Công cụ sáng tạo</p>
                      {modeOptions.map(opt => (
                          <button 
                              key={opt.id} 
                              onClick={() => { 
                                  setMode(opt.id as any); 
                                  resetOutput(); 
                                  setIsMobileMenuOpen(false);
                                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                              }}
                              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 border-2 ${
                                  mode === opt.id 
                                  ? 'bg-slate-100 border-blue-200 text-blue-700' 
                                  : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                              <span className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl ${
                                   mode === opt.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500'
                              }`}>{opt.icon}</span>
                              <div>
                                  <span className="block text-base font-black tracking-tight">{opt.label}</span>
                                  <span className="block text-xs font-bold mt-0.5 opacity-70">{opt.desc}</span>
                              </div>
                          </button>
                      ))}
                  </div>
                  
                  {!user ? (
                      <div className="mt-8 pt-8 border-t border-slate-100">
                          <button onClick={() => { setIsMobileMenuOpen(false); navigate("/login"); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                              Đăng Nhập Ngay
                          </button>
                      </div>
                  ) : (
                      <div className="mt-8 pt-8 border-t border-slate-100">
                          <button onClick={() => { setIsMobileMenuOpen(false); navigate("/offer"); }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                              <span className="text-2xl leading-none">🎁</span>
                              Nhận Ưu Đãi Ngay
                          </button>
                      </div>
                  )}
              </motion.div>
          )}
      </AnimatePresence>

      {/* Support Section (Moved to footer) */}
      <div className="container mx-auto max-w-[1600px] px-4 lg:px-8 py-6 lg:py-12 flex-grow">
        {/* Error Warning Banners */}
        {(hasQuotaError || hasPermissionError) && (
            <div className="mb-10 p-6 lg:p-10 bg-indigo-50 border-2 border-indigo-200 rounded-[2.5rem] shadow-2xl animate-bounce-slow flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="w-16 h-16 bg-indigo-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200 shrink-0">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-indigo-900 leading-tight mb-2">
                            {hasPermissionError ? "Lỗi Quyền Truy Cập (403 Forbidden)" : "Hết Hạn Mức Miễn Phí (429 Quota)"}
                        </h4>
                        <p className="text-sm font-bold text-indigo-700/80 leading-relaxed max-w-xl">
                            {hasPermissionError 
                              ? "API Key hiện tại không có quyền sử dụng model cao cấp này. Vui lòng sử dụng API Key từ Project Google Cloud đã bật Billing (thanh toán)." 
                              : "Hạn mức API Key hệ thống đã hết. Để duy trì chất lượng 2K và bảo tồn nhận diện, vui lòng sử dụng API Key cá nhân trả phí của bạn."}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenKeySelector}
                    className="shrink-0 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3"
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
                <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
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
                                ? 'bg-white border-blue-500 shadow-xl shadow-slate-200 scale-105 z-10' 
                                : 'bg-transparent border-transparent hover:bg-slate-100/50 text-slate-500'
                            }`}
                        >
                            <span className={`text-xl w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-500 ${
                                 mode === opt.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                            }`}>{opt.icon}</span>
                            <div>
                                <span className={`block text-sm font-black tracking-tight ${mode === opt.id ? 'text-blue-700' : 'text-slate-800'}`}>{opt.label}</span>
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
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-blue-600 border border-slate-200 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                    </div>
                    <div>
                        <h3 className="text-xl lg:text-2xl font-black text-slate-900 leading-tight">Cấu Hình</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Sáng tạo 2026</p>
                    </div>
                </div>
                <div className="animate-fade-in">
                    <Suspense fallback={<div className="py-20 text-center text-slate-400 font-bold animate-pulse">Đang tải module...</div>}>
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
                                <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group" onClick={() => {
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
                                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.type}</span>
                                      <h4 className="font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                                      <p className="text-[10px] text-slate-400 mt-1">{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Đang lưu...'}</p>
                                    </div>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">➔</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                    </Suspense>
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
                                    <button onClick={async () => {
                                        try {
                                            const resFetch = await fetch(`data:image/png;base64,${res.base64}`);
                                            const blob = await resFetch.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `pk-2026-${i+1}.png`;
                                            link.target = '_blank';
                                            document.body.appendChild(link);
                                            link.click();
                                            setTimeout(() => {
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                            }, 1000);
                                        } catch (e) {
                                            console.error('Lỗi tải ảnh:', e);
                                            alert('Không thể tải ảnh. Vui lòng thử lại.');
                                        }
                                    }} className="px-6 py-3 bg-white text-blue-700 rounded-2xl font-black shadow-xl transition-all hover:scale-110 flex items-center gap-3">
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
                            <div className="bg-slate-50 p-6 rounded-2xl font-mono text-[11px] text-slate-800 leading-relaxed border border-slate-100 select-all shadow-inner">
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
                <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-[3rem] border border-slate-100/50 shadow-sm animate-fade-in">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-800">Studio PK Sẵn Sàng</h3>
                    <p className="mt-2 text-xs text-slate-400 font-bold">Hãy sử dụng API Key trả phí để có chất lượng tốt nhất.</p>
                </div>
             )}
          </section>
        </main>
      </div>

      {/* Sticky Bottom Button for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-[50]">
          {!user ? (
              <button 
                  onClick={() => navigate("/login")}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  ĐĂNG NHẬP ĐỂ BẮT ĐẦU
              </button>
          ) : isLoading ? (
              <button 
                  disabled
                  className="w-full py-4 bg-slate-200 text-slate-500 rounded-2xl font-black text-lg shadow-inner flex items-center justify-center gap-3"
              >
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ĐANG XỬ LÝ...
              </button>
          ) : (pages.length > 0 || adImageStatus.results.length > 0 || affiliateResult) ? (
              <div className="flex gap-3">
                  <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="btn-secondary flex-1 py-4 rounded-2xl text-sm"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      TẠO MỚI
                  </button>
                  <button 
                      onClick={handleSaveContent}
                      className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                      LƯU KẾT QUẢ
                  </button>
              </div>
          ) : (
              <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  BẮT ĐẦU SÁNG TẠO
              </button>
          )}
      </div>

      <footer className="mt-12 mb-20 lg:mb-0 border-t-2 border-slate-100 bg-white">
        {/* Support Section */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white px-4 py-8 lg:px-10 lg:py-10 shadow-inner">
            <div className="container mx-auto max-w-[1600px] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="relative shrink-0">
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                        <div className="relative w-24 h-24 lg:w-32 lg:h-32 bg-white p-1.5 rounded-2xl shadow-2xl border-2 border-white/20 overflow-hidden">
                            <img 
                            src="https://img.vietqr.io/image/BIDV-6320410146-compact2.jpg?amount=99000&addInfo=Moi%20Khoa%20Cafe%202026&accountName=PHAM%20VAN%20KHOA" 
                            alt="QR Code" 
                            className="w-full h-full object-contain rounded-lg" 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 lg:gap-3 mb-2">
                        <span className="text-2xl lg:text-3xl">☕️</span>
                        <h2 className="text-xl lg:text-3xl font-black tracking-tight leading-none">
                            Mời <span className="gold-text-shimmer">Phạm Khoa cafe 99k</span>
                        </h2>
                        </div>
                        <p className="text-xs lg:text-sm font-bold text-blue-200 mb-1">
                            Ủng hộ tác giả duy trì server AI và phát triển tính năng mới
                        </p>
                        <p className="text-[10px] lg:text-xs font-black text-red-400 uppercase tracking-widest">
                            BIDV • 6320410146 • PHAM VAN KHOA
                        </p>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-end gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                            <svg className="w-7 h-7 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-white leading-none">Phạm Văn Khoa</p>
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1.5">Lead AI Architect</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="container mx-auto px-8 py-12 flex flex-col items-center gap-8 text-center">
            <p className="text-2xl lg:text-3xl font-display italic font-black text-blue-800 tracking-widest uppercase">Phạm Khoa</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                Copyright © 2026 Phạm Khoa
            </p>
        </div>
      </footer>
      
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
        currentKey={userProfile?.customApiKey || ''}
        onSave={handleSaveApiKey}
      />
    </div>
    </>
  );
};

const App: React.FC = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-slate-400 animate-pulse">KHỞI TẠO PK HUB...</div>}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/offer" element={
          <ProtectedRoute user={user}>
            <OfferPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute user={user}>
            <MainApp user={user} />
          </ProtectedRoute>
        } />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const AppWithErrorBoundary = () => (
  <HelmetProvider>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default AppWithErrorBoundary;
