"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Heart, X } from "lucide-react";

/** ---------- Types ---------- */
export type LoginPopupContextType = {
  showLoginPopup: () => void;
  hideLoginPopup: () => void;
};

/** ---------- Context ---------- */
const LoginPopupContext = createContext<LoginPopupContextType | undefined>(undefined);

/** ---------- Provider ---------- */
export function LoginPopupProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const showLoginPopup = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideLoginPopup = useCallback(() => {
    setIsVisible(false);
  }, []);

  const value: LoginPopupContextType = {
    showLoginPopup,
    hideLoginPopup,
  };

  return (
    <LoginPopupContext.Provider value={value}>
      {children}
      
      {/* Global Login Popup */}
      {isVisible && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9998]"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in cursor-pointer"
            onClick={hideLoginPopup}
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Popup Content */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-md w-full mx-4 z-[9999] animate-scale-in"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Close Button */}
            <button
              onClick={hideLoginPopup}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="text-gray-500" size={20} />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <Heart className="text-red-500" size={32} />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Vui lòng đăng nhập
              </h3>
              <p className="text-gray-600">
                Bạn cần đăng nhập để có thể yêu thích sản phẩm và lưu vào danh sách của mình
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={hideLoginPopup}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Để sau
              </button>
              <a
                href="/login"
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-center"
              >
                Đăng nhập
              </a>
            </div>
          </div>
        </div>
      )}
    </LoginPopupContext.Provider>
  );
}

/** ---------- Hook ---------- */
export function useLoginPopup(): LoginPopupContextType {
  const ctx = useContext(LoginPopupContext);
  if (!ctx) throw new Error("useLoginPopup must be used within LoginPopupProvider");
  return ctx;
}

/** ---------- Default export ---------- */
export default LoginPopupProvider;

