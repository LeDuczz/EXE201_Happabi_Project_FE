import { ArrowRight, Baby, CalendarCheck, ChevronLeft, ChevronRight, HeartHandshake, Menu, MessageCircleHeart, ShieldCheck, Sparkles, Stethoscope, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Avatar from '../components/common/Avatar';
import Btn from '../components/common/Btn';
import { useAuth } from '../contexts/AuthContext';

const features = [
  { icon: HeartHandshake, title: 'Chăm sóc sau sinh', desc: 'Đặt điều dưỡng đến nhà để hỗ trợ mẹ phục hồi, tắm bé, chăm rốn và hướng dẫn cho con bú.' },
  { icon: CalendarCheck, title: 'Đặt lịch nhanh', desc: 'Chọn ngày giờ, khu vực và dịch vụ phù hợp. Mọi ca chăm sóc được theo dõi rõ ràng.' },
  { icon: ShieldCheck, title: 'Hồ sơ xác thực', desc: 'Điều dưỡng có kinh nghiệm, chứng chỉ, đánh giá và trạng thái sẵn sàng nhận ca.' },
  { icon: MessageCircleHeart, title: 'Đồng hành 24/7', desc: 'Mẹ có thể hỏi nhanh về chăm sóc mẹ và bé, lưu lại hành trình phục hồi sau sinh.' },
];

const reviews = [
  { name: 'Chị Ngọc Hà', role: 'Mẹ bé 18 ngày', text: 'Mình yên tâm hơn rất nhiều khi có điều dưỡng đến nhà hướng dẫn từng bước.' },
  { name: 'Chị Thu An', role: 'Mẹ sinh mổ', text: 'Đặt lịch nhanh, hồ sơ điều dưỡng rõ ràng, bé được tắm và chăm rốn rất nhẹ nhàng.' },
  { name: 'Điều dưỡng Lan Anh', role: '8 năm kinh nghiệm', text: 'Dashboard giúp mình quản lý lịch làm và theo dõi từng ca chuyên nghiệp hơn.' },
];

const memories = [
  {
    src: '/image/1.webp',
    tag: 'Khoảnh khắc đầu tiên',
    title: 'Mẹ và bé chào thế giới',
    desc: 'Ngày đặc biệt nhất, khoảnh khắc con cất tiếng khóc chào đời.',
    heart: '🌸',
  },
  {
    src: '/image/2.webp',
    tag: 'Ngày đầu về nhà',
    title: 'Bước đầu làm mẹ',
    desc: 'Bỡ ngỡ nhưng đầy yêu thương, mẹ đã làm rất tốt.',
    heart: '💕',
  },
  {
    src: '/image/3.webp',
    tag: 'Chăm sóc mỗi ngày',
    title: 'Điều dưỡng bên cạnh',
    desc: 'Tắm bé, chăm rốn, hỗ trợ cho bú, mọi khoảnh khắc đều được chăm sóc.',
    heart: '💜',
  },
  {
    src: '/image/4.jpg',
    tag: 'Nụ cười đầu tiên',
    title: 'Bé cười với mẹ',
    desc: 'Nụ cười đó làm mọi mệt mỏi tan biến chỉ trong một giây.',
    heart: '⭐',
  },
  {
    src: '/image/5.webp',
    tag: 'Hành trình phục hồi',
    title: 'Mẹ mỗi ngày khỏe hơn',
    desc: 'Từng ngày mẹ lại mạnh mẽ hơn, đó là điều kỳ diệu nhất.',
    heart: '🌷',
  },
];

const TIMELINE_NODE_OFFSET_PX = 170;
const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

const toLocalDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (value: string) => {
  const date = parseLocalDate(value);
  if (!date) return 'Chọn ngày sinh của bé';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatCalendarMonth = (date: Date) =>
  new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(date);

const isSameCalendarDay = (left: Date | null, right: Date) =>
  Boolean(left)
  && left?.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate();

const buildCalendarDays = (monthDate: Date): CalendarDay[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      date,
      isCurrentMonth: date.getMonth() === month,
    };
  });
};

const initials = (name?: string) => {
  if (!name) return 'HB';
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase() || 'HB';
};

const dashboardPath = (role: string | null) => {
  if (role === 'NURSE') return '/nurse/home';
  if (role === 'DOCTOR') return '/doctor/nurses/review';
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'MOTHER') return '/mother/home';
  return '/';
};

const profilePath = (role: string | null) => {
  if (role === 'NURSE') return '/nurse/profile';
  if (role === 'DOCTOR') return '/doctor/profile';
  if (role === 'ADMIN') return '/admin/profile';
  if (role === 'MOTHER') return '/mother/profile';
  return '/profile';
};

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
};

const Reveal = ({ as: Component = 'div', children, className = '', delay = 0 }: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.16 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      className={`landing-reveal ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, primaryRole, logout } = useAuth();
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const babyDatePickerRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [babyBirth, setBabyBirth] = useState('');
  const [babyDatePickerOpen, setBabyDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [timelineProgress, setTimelineProgress] = useState(0);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const selectedBabyDate = useMemo(() => parseLocalDate(babyBirth), [babyBirth]);
  const babyCalendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const babyDays = useMemo(() => {
    const start = parseLocalDate(babyBirth);
    if (!start) return null;
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  }, [babyBirth, today]);

  useEffect(() => {
    if (!isAuthenticated || primaryRole !== 'MOTHER') {
      setBabyBirth('');
      return;
    }

    let ignore = false;
    const loadBabyBirth = async () => {
      try {
        const response = await axiosClient.get('/api/v1/users/me/mother-profile');
        if (!ignore) {
          setBabyBirth(response.data?.data?.babyBirthDate || '');
        }
      } catch {
        // Landing still works if the profile is not available yet.
      }
    };

    void loadBabyBirth();
    window.addEventListener('focus', loadBabyBirth);

    return () => {
      ignore = true;
      window.removeEventListener('focus', loadBabyBirth);
    };
  }, [isAuthenticated, primaryRole, user?.id]);

  useEffect(() => {
    const selectedDate = parseLocalDate(babyBirth);
    if (!selectedDate) return;
    setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [babyBirth]);

  useEffect(() => {
    if (!babyDatePickerOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!babyDatePickerRef.current?.contains(event.target as Node)) {
        setBabyDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [babyDatePickerOpen]);

  useEffect(() => {
    const updateTimelineProgress = () => {
      const timeline = timelineRef.current;
      if (!timeline) return;

      const rect = timeline.getBoundingClientRect();
      const viewportAnchor = window.innerHeight * 0.58;
      const drawableHeight = Math.max(rect.height - TIMELINE_NODE_OFFSET_PX * 2, 1);
      const progress = (viewportAnchor - rect.top - TIMELINE_NODE_OFFSET_PX) / drawableHeight;
      setTimelineProgress(Math.min(Math.max(progress, 0), 1));
    };

    updateTimelineProgress();
    window.addEventListener('scroll', updateTimelineProgress, { passive: true });
    window.addEventListener('resize', updateTimelineProgress);

    return () => {
      window.removeEventListener('scroll', updateTimelineProgress);
      window.removeEventListener('resize', updateTimelineProgress);
    };
  }, []);

  const goHome = () => navigate(dashboardPath(primaryRole));

  const changeCalendarMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectBabyBirthDate = (date: Date) => {
    if (date > today) return;
    setBabyBirth(toLocalDateValue(date));
    setBabyDatePickerOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fff9fb] text-text-dark">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <button className="flex items-center gap-2" onClick={() => navigate('/')}>
            <img src="/image/logo.png" alt="Happabi" className="h-11 w-11 rounded-2xl object-cover" />
            <div className="text-left">
              <div className="text-brand text-3xl leading-tight text-grad">Happabi</div>
              <div className="text-overline text-text-light">Mẹ khỏe · Bé ngoan</div>
            </div>
          </button>

          <nav className="hidden items-center gap-8 text-overline text-text-mid lg:flex">
            <a href="#roles">Vai trò</a>
            <a href="#features">Tính năng</a>
            <a href="#reviews">Đánh giá</a>
            <a href="#gallery">Khoảnh khắc</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-full border border-lav-200 bg-white px-2 py-1 pr-4 shadow-sm"
                  onClick={() => setAccountOpen((value) => !value)}
                  type="button"
                >
                  <Avatar src={user.avatarUrl} initials={initials(user.fullName)} size={34} />
                  <span className="max-w-36 truncate text-sm font-semibold">{user.fullName || user.phone || user.email}</span>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-[48px] z-50 w-44 overflow-hidden rounded-2xl border border-lav-200 bg-white py-2 text-sm font-bold text-text-mid shadow-[0_18px_50px_rgba(168,85,247,.16)]">
                    <button className="block w-full px-4 py-2 text-left hover:bg-lav-100" onClick={goHome}>Trang chủ</button>
                    <button className="block w-full px-4 py-2 text-left hover:bg-lav-100" onClick={() => navigate(profilePath(primaryRole))}>Hồ sơ</button>
                    <button className="block w-full px-4 py-2 text-left hover:bg-lav-100" onClick={handleLogout}>Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Btn variant="soft" size="sm" onClick={() => navigate('/register/mother')}>
                  Đăng ký
                </Btn>
                <Btn size="sm" onClick={() => navigate('/auth/mother')}>
                  Đăng nhập
                </Btn>
              </>
            )}
          </div>

          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-lav-200 bg-white md:hidden" onClick={() => setMenuOpen((value) => !value)} aria-label="Menu">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-lav-100 bg-white px-4 py-4 md:hidden">
            <div className="grid gap-3 text-sm font-bold text-text-mid">
              <a href="#roles" onClick={() => setMenuOpen(false)}>Vai trò</a>
              <a href="#features" onClick={() => setMenuOpen(false)}>Tính năng</a>
              <a href="#reviews" onClick={() => setMenuOpen(false)}>Đánh giá</a>
            </div>
            <div className="mt-4 flex gap-2">
              {isAuthenticated ? (
                <Btn full size="sm" onClick={goHome}>Trang chủ</Btn>
              ) : (
                <>
                  <Btn full variant="soft" size="sm" onClick={() => navigate('/register/mother')}>Đăng ký</Btn>
                  <Btn full size="sm" onClick={() => navigate('/auth/mother')}>Đăng nhập</Btn>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="pt-[76px]">
        <section className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-[#f7f0ff]">
          <div className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(circle_at_20%_20%,rgba(252,231,243,.95),transparent_34%),radial-gradient(circle_at_80%_5%,rgba(216,180,254,.8),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-9 px-4 pb-12 pt-10 md:grid-cols-[1.02fr_0.98fr] md:items-center md:px-6 md:pt-16">
            <div className="landing-hero-copy">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/85 px-4 py-2 text-overline text-pink-dark shadow-sm">
                <Sparkles size={15} /> Nền tảng chăm sóc mẹ và bé tại nhà
              </div>
              <h1 className="max-w-3xl text-heading text-4xl font-semibold leading-tight text-dark-200 md:text-5xl lg:text-6xl">
                Mẹ an tâm, bé được chăm sóc đúng cách.
              </h1>
              <p className="mt-6 max-w-2xl text-body-lg text-text-mid">
                Happabi kết nối mẹ sau sinh với điều dưỡng, nữ hộ sinh đã xác thực. Mother đăng nhập bằng Google, Facebook hoặc số điện thoại. Nurse dùng số điện thoại và mật khẩu để vào thẳng homepage làm việc.
              </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {!isAuthenticated ? (
                  <>
                    <Btn size="lg" onClick={() => navigate('/auth/mother')}>
                      Đăng nhập <ArrowRight size={18} />
                    </Btn>
                    <Btn variant="soft" size="lg" onClick={() => navigate('/register/mother')}>
                      Đăng ký
                    </Btn>
                  </>
                ) : (
                  <Btn size="lg" onClick={goHome}>
                    Vào trang chủ <ArrowRight size={18} />
                  </Btn>
                )}
              </div>
            </div>

            <div className="relative min-h-[520px]">
              <div className="landing-float-slow absolute left-2 top-4 h-[430px] w-[72%] overflow-hidden rounded-[38px] border-[8px] border-white bg-white shadow-[0_30px_90px_rgba(168,85,247,.24)] md:left-8">
                <img src="/image/1.webp" alt="Mẹ và bé" className="h-full w-full object-cover" />
              </div>
              <div className="landing-float-soft absolute bottom-0 right-0 h-[330px] w-[54%] overflow-hidden rounded-[34px] border-[8px] border-white bg-white shadow-[0_24px_70px_rgba(251,113,133,.22)]">
                <img src="/image/5.webp" alt="Chăm sóc bé" className="h-full w-full object-cover" />
              </div>
              <div className="landing-float-soft absolute right-4 top-8 rounded-3xl border border-lav-200 bg-white/92 p-4 shadow-xl backdrop-blur">
                <div className="text-overline text-text-light">Hôm nay</div>
                <div className="mt-1 text-heading text-2xl font-semibold text-grad">3 điều dưỡng</div>
                <div className="text-caption text-text-mid">phù hợp gần bạn</div>
              </div>
              <div className="landing-float-slow absolute bottom-10 left-0 rounded-3xl border border-pink-100 bg-white/92 p-4 shadow-xl backdrop-blur">
                <div className="flex items-center gap-3">
                  <Baby className="text-pink-dark" size={28} />
                  <div>
                    <div className="text-heading text-xl font-semibold text-dark-200">24/7</div>
                    <div className="text-caption text-text-mid">Đồng hành mẹ và bé</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="bg-dark-200 px-4 py-16 text-white md:px-6">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-overline text-lav-acc">Ai dùng Happabi?</p>
              <h2 className="mt-3 text-heading text-4xl font-semibold">Một app · Hai vai trò</h2>
            </Reveal>
            <div className="mt-9 grid gap-5 md:grid-cols-2">
              <Reveal as="article" className="landing-hover-lift rounded-[28px] border border-white/10 bg-white/[0.06] p-7">
                <HeartHandshake className="landing-icon-pop text-pink-acc" size={34} />
                <h3 className="mt-5 text-heading text-2xl font-semibold">Mẹ bỉm sữa</h3>
                <p className="mt-3 leading-7 text-white/58">Đăng nhập bằng Google, Facebook hoặc số điện thoại và mật khẩu. Sau khi đăng nhập, mẹ quay về landing page, thấy avatar ở góc phải và bấm vào homepage khi cần đặt lịch.</p>
                {!isAuthenticated && <div className="mt-6 text-sm font-bold text-white/50">Đăng nhập hoặc đăng ký ở thanh trên cùng.</div>}
              </Reveal>
              <Reveal as="article" delay={120} className="landing-hover-lift rounded-[28px] border border-white/10 bg-white/[0.06] p-7">
                <Stethoscope className="landing-icon-pop text-lav-acc" size={34} />
                <h3 className="mt-5 text-heading text-2xl font-semibold">Điều dưỡng</h3>
                <p className="mt-3 leading-7 text-white/58">Nurse đăng nhập bằng số điện thoại và mật khẩu. Khi đăng nhập thành công, hệ thống đưa vào thẳng homepage dành cho nurse để quản lý lịch làm.</p>
                {!isAuthenticated && <div className="mt-6 text-sm font-bold text-white/50">Nurse chọn đăng nhập rồi chuyển tab Nurse trong form.</div>}
              </Reveal>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <Reveal className="text-center">
            <p className="text-overline text-pink-dark">Tính năng nổi bật</p>
            <h2 className="mt-3 text-heading text-4xl font-semibold text-dark-200">Mọi thứ mẹ cần sau sinh</h2>
          </Reveal>
          <div className="mt-9 grid gap-5 md:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }, index) => (
              <Reveal
                as="article"
                key={title}
                delay={index * 90}
                className="landing-hover-lift rounded-[24px] border border-lav-100 bg-white p-6 shadow-[0_10px_36px_rgba(168,85,247,.08)]"
              >
                <Icon className="landing-icon-pop text-lav-dark" size={30} />
                <h3 className="mt-4 text-heading text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-mid">{desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-y border-lav-100 bg-white px-4 py-16 md:px-6">
          <Reveal className="mx-auto max-w-4xl text-center">
            <p className="text-overline text-lav-dark">Hành trình của bé</p>
            <h2 className="mt-3 text-heading text-4xl font-semibold">Đếm từng ngày yêu thương</h2>
            <div ref={babyDatePickerRef} className="landing-hover-lift relative mx-auto mt-8 max-w-md rounded-[28px] border border-pink-100 bg-[#fff9fb] p-5 shadow-sm">
              <label className="text-subheading text-text-mid" htmlFor="babyBirthButton">Nhập ngày sinh của bé</label>
              <button
                id="babyBirthButton"
                type="button"
                onClick={() => setBabyDatePickerOpen((open) => !open)}
                className="mt-3 flex w-full items-center justify-between rounded-2xl border border-lav-200 bg-white px-4 py-3 text-left text-body text-text-dark shadow-[0_12px_30px_rgba(168,85,247,.08)] outline-none transition hover:border-lav-acc hover:shadow-[0_16px_38px_rgba(168,85,247,.12)] focus:border-lav-dark"
              >
                <span className={babyBirth ? 'font-semibold text-text-dark' : 'font-medium text-text-light'}>
                  {formatDisplayDate(babyBirth)}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-grad text-white shadow-[0_10px_24px_rgba(168,85,247,.22)]">
                  <CalendarCheck size={18} />
                </span>
              </button>
              {babyDatePickerOpen && (
                <div className="mt-4 rounded-[26px] border border-lav-100 bg-white p-4 text-left shadow-[0_24px_60px_rgba(45,27,78,.14)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-overline text-text-light">Tháng</div>
                      <div className="text-subheading capitalize text-text-dark">{formatCalendarMonth(calendarMonth)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => changeCalendarMonth(-1)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lav-100 bg-lav-50 text-lav-dark transition hover:bg-lav-100" aria-label="Tháng trước">
                        <ChevronLeft size={18} />
                      </button>
                      <button type="button" onClick={() => changeCalendarMonth(1)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-lav-100 bg-lav-50 text-lav-dark transition hover:bg-lav-100" aria-label="Tháng sau">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                    {WEEKDAY_LABELS.map((label) => (
                      <div key={label} className="py-2 text-[11px] font-black uppercase text-text-light">{label}</div>
                    ))}
                    {babyCalendarDays.map(({ date, isCurrentMonth }) => {
                      const isSelected = isSameCalendarDay(selectedBabyDate, date);
                      const isToday = isSameCalendarDay(today, date);
                      const isFuture = date > today;

                      return (
                        <button
                          key={toLocalDateValue(date)}
                          type="button"
                          disabled={isFuture}
                          onClick={() => selectBabyBirthDate(date)}
                          className={`flex h-10 items-center justify-center rounded-2xl text-sm font-bold transition ${
                            isSelected
                              ? 'bg-grad text-white shadow-[0_10px_22px_rgba(168,85,247,.24)]'
                              : isToday
                                ? 'border border-pink-200 bg-pink-50 text-pink-dark'
                                : isCurrentMonth
                                  ? 'text-text-dark hover:bg-lav-50 hover:text-lav-dark'
                                  : 'text-text-light/45'
                          } ${isFuture ? 'cursor-not-allowed opacity-35' : ''}`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-lav-100 pt-3">
                    <button type="button" onClick={() => setBabyBirth('')} className="rounded-xl px-3 py-2 text-sm font-bold text-text-light transition hover:bg-lav-50 hover:text-text-mid">
                      Xóa
                    </button>
                    <button type="button" onClick={() => selectBabyBirthDate(today)} className="rounded-xl bg-pink-50 px-3 py-2 text-sm font-bold text-pink-dark transition hover:bg-pink-100">
                      Hôm nay
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-heading text-2xl font-semibold text-grad">{babyDays ?? '-'}</div>
                  <div className="text-caption text-text-light">Ngày tuổi</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-heading text-2xl font-semibold text-grad">{babyDays === null ? '-' : Math.floor(babyDays / 7)}</div>
                  <div className="text-caption text-text-light">Tuần tuổi</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-heading text-2xl font-semibold text-grad">∞</div>
                  <div className="text-caption text-text-light">Yêu thương</div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="reviews" className="overflow-hidden bg-[#f7f0ff] py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <p className="text-center text-overline text-pink-dark">Mẹ bỉm nói gì</p>
            <h2 className="mt-3 text-center text-heading text-4xl font-semibold">Gia đình tin tưởng Happabi</h2>
            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {reviews.map((review, index) => (
                <Reveal
                  as="article"
                  key={review.name}
                  delay={index * 110}
                  className="landing-hover-lift rounded-[24px] border border-lav-100 bg-white p-6 shadow-sm"
                >
                  <div className="text-lg text-[#f59e0b]">★★★★★</div>
                  <p className="mt-4 leading-7 text-text-mid">"{review.text}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <Avatar initials={initials(review.name)} size={42} />
                    <div>
                      <div className="font-semibold">{review.name}</div>
                      <div className="text-caption text-text-light">{review.role}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="gallery" className="overflow-hidden bg-[linear-gradient(to_bottom,#ffffff,#f3e8ff,#ffffff)] px-4 py-24 md:px-6">
          <Reveal className="text-center">
            <p className="mx-auto flex items-center justify-center gap-3 text-overline text-text-light before:h-px before:w-9 before:bg-lav-300 after:h-px after:w-9 after:bg-lav-300">
              Khoảnh khắc của mẹ và bé
            </p>
            <h2 className="mt-3 text-heading text-4xl font-semibold leading-tight text-lav-dark md:text-5xl">Kỷ niệm cùng bé</h2>
          </Reveal>

          <div ref={timelineRef} className="relative mx-auto mt-14 flex w-full max-w-[860px] flex-col gap-20">
            <div className="absolute bottom-[170px] left-1/2 top-[170px] hidden w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-lav-200/90 md:block">
              <div
                className="landing-timeline-progress absolute left-0 top-0 w-full rounded-full"
                style={{ height: `${timelineProgress * 100}%` }}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 hidden md:block">
              {memories.map((memory, index) => {
                const markerProgress = index / Math.max(memories.length - 1, 1);
                return (
                  <div
                    key={memory.title}
                    className={`landing-timeline-dot absolute left-1/2 z-10 h-5 w-5 rounded-full border-[3px] ${
                      timelineProgress >= markerProgress
                        ? 'is-active border-lav-dark bg-lav-dark shadow-[0_0_0_8px_rgba(216,180,254,.58),0_0_22px_rgba(168,85,247,.38)]'
                        : 'border-lav-acc bg-white shadow-[0_0_0_6px_#e9d5ff]'
                    }`}
                    style={{
                      top: `calc(${TIMELINE_NODE_OFFSET_PX}px + ${markerProgress} * (100% - ${TIMELINE_NODE_OFFSET_PX * 2}px))`,
                    }}
                  />
                );
              })}
            </div>

            {memories.map((memory, index) => {
              const isRight = index % 2 === 1;
              return (
                <div key={memory.title} className="relative">
                  <Reveal
                    delay={index * 80}
                    className={`relative grid items-center gap-12 md:grid-cols-[1fr_1fr] ${isRight ? 'md:[&_.memory-image]:col-start-2 md:[&_.memory-copy]:col-start-1 md:[&_.memory-copy]:row-start-1' : ''}`}
                  >
                  <div className={`memory-image flex ${isRight ? 'md:justify-start' : 'md:justify-end'}`}>
                    <div className={`h-[340px] w-[280px] overflow-hidden rounded-[20px] border-[3px] border-white bg-lav-100 shadow-[0_20px_60px_rgba(168,85,247,.18)] transition-transform duration-500 hover:translate-y-[-8px] hover:rotate-0 hover:scale-105 hover:shadow-[0_40px_80px_rgba(168,85,247,.28)] ${isRight ? 'rotate-2' : '-rotate-2'}`}>
                      <img src={memory.src} alt={memory.title} className="h-full w-full object-cover" />
                    </div>
                  </div>

                  <div className={`memory-copy flex flex-col gap-2 ${isRight ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
                    <div className="text-overline text-text-light">{memory.tag}</div>
                    <div className="text-heading text-2xl font-semibold leading-snug text-dark-200">{memory.title}</div>
                    <p className="max-w-[240px] text-body leading-relaxed text-text-mid">{memory.desc}</p>
                    <div className="mt-1 text-xl">{memory.heart}</div>
                  </div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#0f0520] px-[6vw] pb-8 pt-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-2 flex min-h-[42px] items-center gap-3">
              <img src="/image/logo.png" alt="Happabi" className="h-[38px] w-[38px] rounded-xl object-cover" />
              <span className="text-brand text-[30px] text-grad">Happabi</span>
            </div>
            <div className="mb-2 text-overline text-white/[0.18]">Mẹ Khỏe · Bé Ngoan</div>
            <p className="mt-3 max-w-[280px] text-caption leading-relaxed text-white/30">
              Nền tảng kết nối mẹ sau sinh với điều dưỡng, nữ hộ sinh được xác thực. Đặt lịch dễ dàng, chăm sóc tận tâm tại nhà.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['App Store', 'Google Play'].map((store) => (
                <a
                  key={store}
                  className="flex items-center gap-2 rounded-[10px] border border-white/[0.07] bg-white/[0.05] px-3.5 py-2 text-white transition hover:border-lav-acc/30 hover:bg-lav-acc/15"
                  href="#"
                  onClick={(event) => event.preventDefault()}
                >
                  <span className="text-lg">{store === 'App Store' ? 'ios' : 'android'}</span>
                  <span>
                    <span className="block text-caption text-white/25">Tải trên</span>
                    <span className="text-caption font-semibold">{store}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 text-overline text-white/25">Sản phẩm</div>
            <div className="flex flex-col gap-2.5 text-caption text-white/40">
              {['Dành cho mẹ bỉm', 'Dành cho điều dưỡng', 'AI Matching', 'Bảng giá'].map((item) => (
                <span key={item} className="cursor-pointer transition hover:text-lav-acc">{item}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 text-overline text-white/25">Công ty</div>
            <div className="flex flex-col gap-2.5 text-caption text-white/40">
              {['Về Happabi', 'Blog sức khỏe', 'Tuyển dụng', 'Báo chí', 'Liên hệ'].map((item) => (
                <span key={item} className="cursor-pointer transition hover:text-lav-acc">{item}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 text-overline text-white/25">Liên hệ</div>
            <div className="text-caption leading-relaxed text-white/30">
              hello@happabi.vn<br />
              1800 6868<br />
              TP. Hồ Chí Minh<br />
              8:00 - 22:00 mỗi ngày
            </div>
          </div>
        </div>

        <div className="mx-auto my-7 h-px max-w-7xl bg-white/[0.05]" />

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="text-caption leading-relaxed text-white/[0.18]">
            © 2026 Happabi Technology JSC · GPKD số 0123456789<br />
            <span className="text-caption text-white/[0.1]">Được cấp phép hoạt động bởi Bộ Y tế Việt Nam</span>
          </div>
          {!isAuthenticated && (
            <div className="flex gap-3">
              <Btn variant="outline" onClick={() => navigate('/register/mother')}>Đăng ký</Btn>
              <Btn onClick={() => navigate('/auth/mother')}>Đăng nhập</Btn>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
