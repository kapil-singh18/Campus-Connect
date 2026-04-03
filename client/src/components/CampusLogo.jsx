import { useId } from "react";

function CampusLogo({ compact = false }) {
  const ringClip = useId();

  return (
    <div className={`inline-flex items-center ${compact ? "gap-2" : "gap-3"}`}>
      <span className={`relative inline-flex items-center justify-center ${compact ? "h-9 w-9" : "h-12 w-12"}`}>
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <defs>
            <clipPath id={ringClip}>
              <circle cx="32" cy="32" r="29" />
            </clipPath>
          </defs>

          <circle cx="32" cy="32" r="29" fill="none" stroke="#2f78c8" strokeWidth="4.2" />
          <path d="M14.5 26.5 32 17.5l17.5 9L32 35.5l-17.5-9Z" fill="#2f78c8" />
          <path
            d="M20.5 31.5V43c0 4.6 23 4.6 23 0V31.5"
            fill="none"
            stroke="#24558e"
            strokeWidth="3.3"
            strokeLinecap="round"
          />
          <circle cx="49.5" cy="18.5" r="4.2" fill="#f09a5b" />
          <path
            d="M45.8 21.2c-2.6 2.2-4.2 5.1-4.2 8.5"
            fill="none"
            stroke="#f09a5b"
            strokeWidth="2.8"
            strokeLinecap="round"
            clipPath={`url(#${ringClip})`}
          />
        </svg>
      </span>
      <span className={compact ? "text-base font-extrabold tracking-tight" : "text-lg font-extrabold tracking-tight"}>
        Campus Connect
      </span>
    </div>
  );
}

export default CampusLogo;
