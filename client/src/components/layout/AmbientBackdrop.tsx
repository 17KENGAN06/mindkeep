/** Soft moving light + floating particles across the whole app (desktop-forward). */
export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="ambient-orb-a absolute -top-[20%] -left-[10%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,var(--app-accent-soft),transparent_68%)] blur-2xl" />
      <div className="ambient-orb-b absolute top-[30%] -right-[15%] h-[45vmax] w-[45vmax] rounded-full bg-[radial-gradient(circle,rgba(95,201,142,0.22),transparent_70%)] blur-2xl" />
      <div className="ambient-orb-c absolute -bottom-[25%] left-[20%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(142,239,180,0.16),transparent_65%)] blur-3xl" />
      <div className="ambient-orb-d absolute top-[55%] left-[40%] hidden h-[28vmax] w-[28vmax] rounded-full bg-[radial-gradient(circle,rgba(142,239,180,0.1),transparent_70%)] blur-3xl md:block" />

      <div className="ambient-aurora absolute inset-x-[-20%] top-[-30%] hidden h-[70%] md:block" />
      <div className="ambient-aurora ambient-aurora-b absolute inset-x-[-10%] bottom-[-40%] hidden h-[55%] md:block" />

      <div className="ambient-particles absolute inset-0 hidden md:block">
        {Array.from({ length: 42 }).map((_, index) => {
          const size = 2 + (index % 5);
          const variant = index % 4;
          return (
            <span
              key={index}
              className={`ambient-particle ambient-particle-${variant} absolute rounded-full bg-brand-500`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${(index * 13 + 7) % 100}%`,
                top: `${(index * 19 + 11) % 100}%`,
                animationDelay: `${(index % 12) * 0.35}s`,
                animationDuration: `${5.5 + (index % 8) * 0.9}s`,
                opacity: 0.22 + (index % 5) * 0.12,
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
}
