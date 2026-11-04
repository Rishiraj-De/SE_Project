"use client";

import React, { useEffect } from "react";

interface GoogleOneTapProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { name: string; email: string }) => Promise<void>;
  isLoading?: boolean;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Headless Google One Tap component.
 * Initializes official Google Identity Services (GIS) prompt.
 * Google itself renders and controls the official native One Tap prompt iframe.
 */
export const GoogleOneTap: React.FC<GoogleOneTapProps> = ({
  isOpen,
  onClose,
  onSelectAccount
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "696070150583-k3dma7021md9mmrmun0uoctake289j07.apps.googleusercontent.com";
    if (!clientId) return;

    let isMounted = true;

    const initGsi = () => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (response?.credential && isMounted) {
                const decoded = parseJwt(response.credential);
                if (decoded && decoded.email) {
                  await onSelectAccount({
                    name: decoded.name || decoded.email.split("@")[0],
                    email: decoded.email
                  });
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false
          });

          (window as any).google.accounts.id.prompt((notification: any) => {
            if (notification?.isDismissedMoment?.() && isMounted) {
              onClose();
            }
          });
        } catch (err) {
          console.warn("Google One Tap initialization skipped:", err);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setTimeout(initGsi, 800);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
      try {
        if ((window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.cancel();
        }
      } catch {}
    };
  }, [isOpen, onSelectAccount, onClose]);

  // Google GIS renders its own official prompt overlay directly via iframe; no mock DOM.
  return null;
};
