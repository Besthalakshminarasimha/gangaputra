import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, HelpCircle } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsModalProps {
  showTriggerButton?: boolean;
}

const KeyboardShortcutsModal = ({ showTriggerButton = false }: KeyboardShortcutsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { shortcuts } = useKeyboardShortcuts();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "?" && event.shiftKey) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const formatShortcut = (shortcut: { key: string; ctrl?: boolean; alt?: boolean; shift?: boolean }) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.shift) parts.push("Shift");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  // Group shortcuts by category
  const navigationShortcuts = shortcuts.filter(s => 
    s.description.toLowerCase().includes("go to") || s.description.toLowerCase().includes("go back")
  );
  const actionShortcuts = shortcuts.filter(s => 
    !s.description.toLowerCase().includes("go to") && !s.description.toLowerCase().includes("go back")
  );

  return (
    <>
      {showTriggerButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="rounded-full"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Navigation Shortcuts */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Navigation
              </h4>
              <div className="space-y-2">
                {navigationShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded-md border border-border">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Shortcuts */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Actions
              </h4>
              <div className="space-y-2">
                {actionShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded-md border border-border">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
                {/* Add the ? shortcut manually since it's handled here */}
                <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-foreground">Show shortcuts</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded-md border border-border">
                    Shift + ?
                  </kbd>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Shift + ?</kbd> anytime to show this menu
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KeyboardShortcutsModal;
