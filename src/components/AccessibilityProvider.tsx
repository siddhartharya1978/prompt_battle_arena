// ACCESSIBILITY PROVIDER - OMNI-AGENT NEXUS
// WCAG 2.1 AA compliance implementation

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityContextType {
  announceToScreenReader: (message: string) => void;
  focusManagement: {
    trapFocus: (element: HTMLElement) => () => void;
    restoreFocus: (element: HTMLElement | null) => void;
  };
  colorContrast: {
    checkContrast: (foreground: string, background: string) => boolean;
    getHighContrastColor: (background: string) => string;
  };
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create screen reader announcer
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.style.position = 'absolute';
    announcerElement.style.left = '-10000px';
    announcerElement.style.width = '1px';
    announcerElement.style.height = '1px';
    announcerElement.style.overflow = 'hidden';
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);

    return () => {
      if (announcerElement.parentNode) {
        announcerElement.parentNode.removeChild(announcerElement);
      }
    };
  }, []);

  const announceToScreenReader = (message: string) => {
    if (announcer) {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  };

  const restoreFocus = (element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  };

  const checkContrast = (foreground: string, background: string): boolean => {
    // Simplified contrast check - in production, use proper color contrast calculation
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
    return contrast >= 4.5; // WCAG AA standard
  };

  const getHighContrastColor = (background: string): string => {
    const luminance = getLuminance(background);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const value = {
    announceToScreenReader,
    focusManagement: {
      trapFocus,
      restoreFocus
    },
    colorContrast: {
      checkContrast,
      getHighContrastColor
    }
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// HELPER FUNCTIONS
function getLuminance(color: string): number {
  // Simplified luminance calculation
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ACCESSIBILITY UTILITIES
export const addAriaLabel = (element: HTMLElement, label: string) => {
  element.setAttribute('aria-label', label);
};

export const addAriaDescribedBy = (element: HTMLElement, descriptionId: string) => {
  element.setAttribute('aria-describedby', descriptionId);
};

export const announcePageChange = (pageName: string) => {
  // Announce page changes to screen readers
  const event = new CustomEvent('page-change', { detail: { pageName } });
  document.dispatchEvent(event);
};