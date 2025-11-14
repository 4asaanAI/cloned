import { CheckCircle, XCircle, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export function Notification({ type, message, onClose }: NotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
        ) : (
          <XCircle className="w-6 h-6 text-white flex-shrink-0" />
        )}
        <p className="text-white font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
