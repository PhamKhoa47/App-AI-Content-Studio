import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';

const AFFILIATE_LINK = "https://s.shopee.vn/40bxa4Y1nm";

const OfferPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isPreparing, setIsPreparing] = useState(true);

  useEffect(() => {
    // Simulate "preparing offer" status
    const timer = setTimeout(() => {
      setIsPreparing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClaimOffer = () => {
    // Open affiliate link in new tab
    window.open(AFFILIATE_LINK, '_blank');
    
    // Save click timestamp to localStorage
    localStorage.setItem('affiliate_click_timestamp', Date.now().toString());
    
    // Redirect current tab to homepage
    showToast("Đang chuyển hướng bạn tới trang chủ...", "success");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full -mr-80 -mt-80 blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full -ml-80 -mb-80 blur-[100px]"></div>

      <AnimatePresence mode="wait">
        {isPreparing ? (
          <motion.div 
            key="preparing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <div className="w-24 h-24 border-8 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest animate-pulse">
              Đang chuẩn bị ưu đãi...
            </h2>
            <p className="text-slate-400 font-bold mt-4">Vui lòng đợi trong giây lát</p>
          </motion.div>
        ) : (
          <motion.div 
            key="offer"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[4rem] shadow-2xl max-w-2xl w-full overflow-hidden relative border border-white/20 z-10"
          >
            <div className="absolute top-0 right-0 p-12">
              <span className="text-8xl opacity-5 select-none">🎁</span>
            </div>
            
            <div className="p-12 lg:p-20 text-center relative">
              <div className="w-28 h-28 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-slate-200 border border-slate-200">
                <span className="text-6xl">🎁</span>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                🎁 Ưu đãi dành riêng cho bạn
              </h2>
              
              <p className="text-slate-500 font-medium mb-12 leading-relaxed text-xl max-w-lg mx-auto">
                Chúng tôi đã chuẩn bị ưu đãi phù hợp, nhấn để nhận ngay
              </p>
              
              <div className="space-y-6">
                <button 
                  onClick={handleClaimOffer}
                  className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white font-black text-xl shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                >
                  <span className="text-2xl">🎁</span>
                  NHẬN ƯU ĐÃI NGAY
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
              </div>

              <div className="mt-16 pt-10 border-t border-slate-50">
                <div className="flex items-center justify-center gap-8 opacity-40 grayscale">
                  <span className="text-xs font-black uppercase tracking-widest">Trusted by</span>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfferPage;
