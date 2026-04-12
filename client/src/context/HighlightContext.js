import { createContext, useState, useEffect } from "react";

export const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
  const [selectedText, setSelectedText] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Bật/tắt popup
  const [enablePopup, setEnablePopup] = useState(true);

  // ⭐ Lắng nghe chọn văn bản trực tiếp tại đây
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (!enablePopup) return; // Nếu tắt → không chạy

      // Bỏ qua nếu click vào trong popup dịch
      if (e.target.closest("#translate-popup")) {
        return;
      }

      setTimeout(() => {
        const text = window.getSelection().toString().trim();

        if (text) {
          setSelectedText(text);
          setMousePos({ x: e.pageX, y: e.pageY });
        } else {
          setSelectedText("");
        }
      }, 10);
    };

    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enablePopup]);

  return (
    <HighlightContext.Provider
      value={{
        selectedText,
        setSelectedText,
        mousePos,
        setMousePos,
        enablePopup,
        setEnablePopup,
      }}
    >
      {children}
    </HighlightContext.Provider>
  );
};
