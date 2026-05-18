import { useEffect, useRef } from "react"; // 1. Import thêm useRef
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/authStore";

export default function OAuth2SuccessPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  
  // Dùng flag này để chặn Strict Mode chạy trùng luồng
  const isProcessed = useRef(false); 

  useEffect(() => {
    // Nếu lần chạy trước đã xử lý xong rồi thì thoát ra ngay lập tức, không chạy lại nữa
    if (isProcessed.current) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userName = params.get("userName");
    const email = params.get("email");


    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // Đánh dấu đã xử lý thành công để khóa chặn lần chạy sau
    isProcessed.current = true;

    // Lưu thông tin đăng nhập
    const userObj = { userName, email };
    setAuth(userObj, token);
    
    // Điều hướng sang Dashboard
    navigate("/dashboard", { replace: true });
    
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <p className="text-neutral-500">Đang thiết lập phiên đăng nhập...</p>
    </div>
  );
}