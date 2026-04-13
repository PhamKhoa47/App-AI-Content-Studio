import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithGoogle } from '../firebase';
import { useToast } from './Toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      showToast("Chào mừng bạn đã quay trở lại!", "success");
      
      // Check for affiliate cooldown
      const lastClick = localStorage.getItem('affiliate_click_timestamp');
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours

      if (!lastClick || (now - parseInt(lastClick)) > cooldown) {
        navigate("/offer", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      showToast(err.message || "Đăng nhập thất bại.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full -mr-64 -mt-64 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full -ml-64 -mb-64 blur-[120px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3.5rem] shadow-2xl max-w-md w-full overflow-hidden relative border border-white/20 z-10"
      >
        <div className="p-10 lg:p-14 text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-slate-200">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">Đăng Nhập <span className="text-blue-600">PK Hub</span></h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">
            Tham gia cộng đồng sáng tạo nội dung AI chuyên nghiệp để lưu trữ lịch sử và sử dụng các tính năng nâng cao.
          </p>

          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-5 bg-white border-2 border-slate-100 hover:border-blue-500 rounded-2xl text-slate-900 font-black text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Tiếp tục với Google
              </>
            )}
          </button>

          <div className="mt-10 pt-8 border-t border-slate-50">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest leading-relaxed">
              Bằng cách đăng nhập, bạn đồng ý với các điều khoản và chính sách bảo mật của chúng tôi.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
