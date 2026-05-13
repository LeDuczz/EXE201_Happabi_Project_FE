interface AvatarProps {
  initials?: string;
  src?: string;
  size?: number;
}

const Avatar = ({ initials = 'HB', src, size = 40 }: AvatarProps) => {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full border border-white/70 bg-grad text-white shadow-sm"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[12px] font-black">
          {initials.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default Avatar;
