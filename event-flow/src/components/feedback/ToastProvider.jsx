import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ToastProvider({ children }) {
  return (
    <>
      {children}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
}

export default ToastProvider;