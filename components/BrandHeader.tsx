interface BrandHeaderProps {
  subtitle?: string
}

export default function BrandHeader({ subtitle }: BrandHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <svg
          viewBox="0 0 64 64"
          width={40}
          height={40}
          role="img"
          aria-label="Orkesta Labs logo"
          className="shrink-0"
        >
          <circle cx={32} cy={32} r={30} fill="#1B3A4B" />
          <path
            d="M32 12c-11 0-20 9-20 20s9 20 20 20c8 0 14.8-4.7 17.8-11.4"
            stroke="white"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={44} cy={18} r={3.5} fill="white" />
        </svg>
        <span className="font-serif font-bold text-navy text-2xl leading-none">
          Orkesta Labs
        </span>
      </div>
      <div className="w-12 h-0.5 bg-teal" />
      {subtitle ? (
        <p className="font-sans text-sm text-dark/70 mt-1">{subtitle}</p>
      ) : null}
    </div>
  )
}
