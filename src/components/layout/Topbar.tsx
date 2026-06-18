import { useEffect, useRef, useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import Avatar from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import notificationApi from '../../api/notificationApi';
import type { AppNotification, RealtimeNotificationPayload } from '../../types/notification';
import { localizeNotification } from '../../utils/notificationText';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const formatRelativeTime = (value?: string) => {
  if (!value) return '';
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(new Date(value));
};

const Topbar = ({ title, subtitle }: TopbarProps) => {
  const { user } = useAuth();
  const displayName = user?.fullName || user?.phone || 'Người dùng';
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await notificationApi.getMyNotifications();
      setUnreadCount(data.unreadCount);
      setNotifications((data.notifications ?? []).map(localizeNotification));
    } catch {
      setError('Không tải được thông báo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(() => {
      if (!socketRef.current?.connected) {
        void loadNotifications();
      }
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [user?.id]);

  useEffect(() => {
    const token = localStorage.getItem('happabi_access_token');
    if (!user || !token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:9093';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      query: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.info('[NotificationSocket] connected');
    });

    socket.on('connect_error', (err) => {
      console.warn('[NotificationSocket] connect_error', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.info('[NotificationSocket] disconnected', reason);
    });

    socket.on('notification', (payload: RealtimeNotificationPayload) => {
      const nextNotification = localizeNotification({
        id: payload.notificationId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        read: false,
        createdAt: payload.createdAt,
      });
      setUnreadCount(payload.unreadCount);
      setNotifications((current) => [
        nextNotification,
        ...current.filter((item) => item.id !== nextNotification.id),
      ].slice(0, 30));
      window.dispatchEvent(new CustomEvent<AppNotification>('happabi:notification-received', {
        detail: nextNotification,
      }));
      setLatestToast(nextNotification);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setLatestToast(null);
        toastTimerRef.current = null;
      }, 5000);
    });

    const handleTokenRefreshed = (event: Event) => {
      const accessToken = (event as CustomEvent<{ accessToken?: string }>).detail?.accessToken;
      if (accessToken) {
        socket.io.opts.query = { token: accessToken };
        socket.disconnect();
        socket.connect();
      }
    };
    window.addEventListener('happabi:token-refreshed', handleTokenRefreshed);

    return () => {
      window.removeEventListener('happabi:token-refreshed', handleTokenRefreshed);
      socket.off('notification');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (isOpen) {
      setLatestToast(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleNotifications = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      void loadNotifications();
    }
  };

  const handleOpenLatestToast = () => {
    setLatestToast(null);
    setIsOpen(true);
    void loadNotifications();
  };

  const handleMarkAsRead = async (notification: AppNotification) => {
    if (notification.read) return;
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true, readAt: new Date().toISOString() } : item,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
    try {
      await notificationApi.markAsRead(notification.id);
    } catch {
      void loadNotifications();
    }
  };

  return (
    <div className="mb-7 flex items-start justify-between">
      <div>
        <h1 className="font-serif text-[26px] font-black leading-[1.2] text-text-dark">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-text-light">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2.5">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-lav-200 bg-lav-100 text-lav-dark transition-colors hover:bg-lav-200"
            aria-label="Thông báo"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-pink-dark px-1 text-[10px] font-black leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-[46px] z-50 w-[360px] overflow-hidden rounded-2xl border border-lav-200 bg-white shadow-[0_22px_60px_rgba(66,38,95,0.18)]">
              <div className="flex items-center justify-between border-b border-lav-100 px-4 py-3">
                <div>
                  <div className="text-[14px] font-black text-text-dark">Thông báo</div>
                  <div className="mt-0.5 text-[11px] font-bold text-text-light">
                    {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void loadNotifications()}
                  className="rounded-lg px-2 py-1 text-[11px] font-black text-lav-dark hover:bg-lav-50"
                >
                  Làm mới
                </button>
              </div>

              <div className="max-h-[420px] overflow-auto py-2">
                {isLoading ? (
                  <div className="flex h-28 items-center justify-center text-lav-dark">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : error ? (
                  <div className="mx-3 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-[12px] font-bold text-red-700">
                    {error}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-lav-50 text-lav-dark">
                      <Bell size={18} />
                    </div>
                    <div className="text-[13px] font-black text-text-dark">Chưa có thông báo</div>
                    <div className="mt-1 text-[12px] font-bold text-text-light">
                      Các cập nhật booking và ca làm sẽ hiển thị tại đây.
                    </div>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleMarkAsRead(notification)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-lav-50 ${
                        notification.read ? 'bg-white' : 'bg-lav-50/70'
                      }`}
                    >
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          notification.read ? 'bg-lav-200' : 'bg-pink-dark'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-black text-text-dark">
                          {notification.title}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-[12px] font-semibold leading-5 text-text-mid">
                          {notification.message}
                        </span>
                        <span className="mt-2 flex items-center gap-2 text-[11px] font-bold text-text-light">
                          {formatRelativeTime(notification.createdAt)}
                          {notification.read && (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <Check size={12} />
                              Đã đọc
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {latestToast && !isOpen && (
            <button
              type="button"
              onClick={handleOpenLatestToast}
              className="absolute right-0 top-[46px] z-50 w-[320px] rounded-2xl border border-lav-200 bg-white p-3 text-left shadow-[0_18px_50px_rgba(66,38,95,0.18)] transition-all hover:-translate-y-0.5 hover:border-lav-300"
            >
              <span className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lav-100 text-lav-dark">
                  <Bell size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-black text-text-dark">
                    {latestToast.title}
                  </span>
                  <span className="block text-[11px] font-bold text-text-light">
                    {formatRelativeTime(latestToast.createdAt)}
                  </span>
                </span>
              </span>
              <span className="line-clamp-2 text-[12px] font-semibold leading-5 text-text-mid">
                {latestToast.message}
              </span>
            </button>
          )}
        </div>

        <div className="flex cursor-pointer items-center gap-2 rounded-xl border border-lav-200 bg-white py-1.5 pl-[7px] pr-3 shadow-sm transition-colors hover:border-lav-300">
          <Avatar initials={getInitials(user?.fullName)} size={30} src={user?.avatarUrl} />
          <span className="max-w-[140px] truncate text-[13px] font-semibold text-text-dark">{displayName}</span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
