import { useClock } from '../../hooks/useClock';
import './TopBar.css';

export function TopBar() {
  const clock = useClock();

  return (
    <header className="topbar" id="topbar">
      {/* Left: Activities */}
      <div className="topbar__left">
        <span className="topbar__activities">Activities</span>
      </div>

      {/* Center: Clock */}
      <div className="topbar__center">
        {clock}
      </div>

      {/* Right: System Tray */}
      <div className="topbar__right">
        <div className="topbar__tray-group">
          {/* Wi-Fi icon */}
          <svg className="topbar__tray-icon" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          {/* Volume icon */}
          <svg className="topbar__tray-icon" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          {/* Battery icon */}
          <svg className="topbar__tray-icon" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>

        {/* Power icon */}
        <div className="topbar__power">
          <svg className="topbar__power-icon" viewBox="0 0 24 24">
            <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
          </svg>
        </div>
      </div>
    </header>
  );
}
