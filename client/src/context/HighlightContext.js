import { createContext, useState } from "react";

export const HighlightContext = createContext();

export const HighlightProvider = ({ children }) => {
  const [selectedText, setSelectedText] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleSelection = (e) => {
    const text = window.getSelection().toString().trim();
    if (text) {
      setSelectedText(text);
      setMousePos({ x: e.pageX, y: e.pageY });
    }
  };

  return (
    <HighlightContext.Provider value={{ selectedText, setSelectedText, handleSelection, mousePos }}>
      {children}
    </HighlightContext.Provider>
  );
};
