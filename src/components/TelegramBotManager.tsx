import { useEffect, useState } from 'react';

export function TelegramBotManager() {
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    // Start polling when component mounts
    fetch('/api/telegram-bot', { method: 'POST' })
      .then(res => res.json())
      .then(data => setIsPolling(true))
      .catch(console.error);

    // Stop polling when component unmounts
    return () => {
      fetch('/api/telegram-bot', { method: 'DELETE' })
        .catch(console.error);
    };
  }, []);

  return null; // This component doesn't render anything
} 