import { useState, useEffect } from "react";

const WELCOME_MODAL_KEY = "heyaura-welcome-seen";

export function useWelcome() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeen = localStorage.getItem(WELCOME_MODAL_KEY);
    if (!hasSeen) {
      setShowWelcome(true);
    }
    setHasSeenWelcome(!!hasSeen);
  }, []);

  const closeWelcome = () => {
    setShowWelcome(false);
    // Mark as seen in localStorage
    localStorage.setItem(WELCOME_MODAL_KEY, "true");
    setHasSeenWelcome(true);
  };

  const openWelcome = () => {
    setShowWelcome(true);
  };

  return {
    showWelcome,
    hasSeenWelcome,
    closeWelcome,
    openWelcome,
  };
}
