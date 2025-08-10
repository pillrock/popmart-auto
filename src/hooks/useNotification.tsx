import { ReactNode, useState, useEffect } from 'react';

interface NotificationProps {
  children: ReactNode;
  message: string;
  duration?: number;
  type?: 'error' | 'success' | 'warning' | 'info';
}

export default function Notification({
  children,
  message,
  duration = 2000,
  type = 'error',
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Màu sắc theo type
  const typeColors = {
    error: 'border-red-500 bg-red-50',
    success: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    info: 'border-blue-500 bg-blue-50',
  };

  useEffect(() => {
    if (message) {
      setShouldRender(true);

      setTimeout(() => {
        setIsVisible(true);
      }, 10);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);

        setTimeout(() => {
          setShouldRender(false);
        }, 400);
      }, duration);

      return () => {
        clearTimeout(hideTimer);
      };
    }
  }, [message, duration]);

  if (!message || !shouldRender) return null;

  return (
    <div
      className={`fixed top-[20%] right-0 z-50 max-w-[250px] rounded-l-md border-l-4 p-3 shadow-lg ${typeColors[type]} transform transition-all duration-400 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } `}
    >
      <div className="text-sm font-medium text-gray-800">{message}</div>
      {children && <div className="mt-2 text-xs text-gray-600">{children}</div>}
    </div>
  );
}

// Hook để sử dụng notification queue
export function useNotification() {
  const [notifications, setNotifications] = useState<
    Array<{
      id: number;
      message: string;
      type: 'error' | 'success' | 'warning' | 'info';
      isVisible: boolean;
    }>
  >([]);

  const showNotification = (
    message: string,
    type: 'error' | 'success' | 'warning' | 'info' = 'info'
  ) => {
    const id = Date.now() + Math.random();

    setNotifications((prev) => [
      ...prev,
      {
        id,
        message,
        type,
        isVisible: false,
      },
    ]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isVisible: true } : notif
        )
      );
    }, 10);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isVisible: false } : notif
        )
      );

      setTimeout(() => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      }, 400);
    }, 5000);
  };

  const NotificationComponents = (
    <div className="fixed top-[20%] right-0 z-50 space-y-2">
      {notifications.map((notif, index) => (
        <NotificationItem
          key={notif.id}
          message={notif.message}
          type={notif.type}
          isVisible={notif.isVisible}
          index={index}
        />
      ))}
    </div>
  );

  return {
    showNotification,
    NotificationComponents,
  };
}

// Component con để render từng notification
function NotificationItem({
  message,
  type,
  isVisible,
  index,
}: {
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  isVisible: boolean;
  index: number;
}) {
  const typeColors = {
    error: 'border-red-500 bg-red-50',
    success: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    info: 'border-blue-500 bg-blue-50',
  };

  return (
    <div
      className={`max-w-[250px] rounded-l-md border-l-4 p-3 shadow-lg ${typeColors[type]} transform transition-all duration-400 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } `}
      style={{
        marginTop: index > 0 ? '8px' : '0',
      }}
    >
      <div className="text-sm font-medium text-gray-800">{message}</div>
    </div>
  );
}
