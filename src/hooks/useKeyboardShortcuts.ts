import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const currentTheme = root.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
  }, []);

  const shortcuts: ShortcutConfig[] = [
    // Theme toggle
    { key: "d", alt: true, action: toggleTheme, description: "Toggle dark mode" },
    
    // Navigation shortcuts
    { key: "h", alt: true, action: () => navigate("/"), description: "Go to Home" },
    { key: "b", alt: true, action: () => navigate("/dashboard"), description: "Go to Dashboard" },
    { key: "s", alt: true, action: () => navigate("/store"), description: "Go to Store" },
    { key: "f", alt: true, action: () => navigate("/farm"), description: "Go to Farm" },
    { key: "a", alt: true, action: () => navigate("/aquapedia"), description: "Go to Aquapedia" },
    { key: "c", alt: true, action: () => navigate("/calculators"), description: "Go to Calculators" },
    { key: "p", alt: true, action: () => navigate("/profile"), description: "Go to Profile" },
    
    // Search (opens command palette if available)
    { 
      key: "k", 
      ctrl: true, 
      action: () => {
        const event = new CustomEvent('open-command-palette');
        window.dispatchEvent(event);
      }, 
      description: "Open search" 
    },
    
    // Go back
    { key: "Escape", action: () => window.history.back(), description: "Go back" },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, location, shortcuts]);

  return { shortcuts };
};

export default useKeyboardShortcuts;
