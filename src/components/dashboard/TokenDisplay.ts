import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { getUserTokens } from '../../lib/tokenService';
import { useAuth } from '../../contexts/AuthContext';

export function TokenDisplay() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      if (user?.id) {
        try {
          const userTokens = await getUserTokens(user.id);
          setTokens(userTokens);
        } catch (error) {
          console.error('Error loading tokens:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTokens();

    const interval = setInterval(loadTokens, 5000);

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-gray-700 dark:to-gray-600 px-4 py-2 rounded-lg border border-yellow-200 dark:border-gray-600">
      <Coins className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
      <div className="flex flex-col">
        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Chatbot Tokens</span>
        <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{tokens.toLocaleString()}</span>
      </div>
    </div>
  );
}
