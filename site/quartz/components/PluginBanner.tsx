import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  const PluginBanner: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <a
        id="plugin-banner"
        href="https://github.com/cdeistopened/samparr-wiki"
        target="_blank"
        rel="noopener noreferrer"
        class={`plugin-banner ${displayClass ?? ""}`}
      >
        <div class="plugin-banner-inner">
          <div class="plugin-banner-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </div>
          <div class="plugin-banner-text">
            <span class="plugin-banner-label">Ask Sam - Claude Code Plugin</span>
            <span class="plugin-banner-desc">18 interactive skills from 876 episodes. Clone the repo to get started.</span>
          </div>
          <div class="plugin-banner-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </a>
    )
  }

  PluginBanner.css = `
    .plugin-banner {
      display: block;
      margin: 0 0 1.5rem 0;
      text-decoration: none;
      color: inherit;
      transition: all 0.15s ease;
    }
    .plugin-banner:hover {
      text-decoration: none;
    }
    .plugin-banner-inner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 4px;
      background: var(--lightgray);
      color: var(--secondary);
      border: 1px solid var(--secondary);
    }
    .plugin-banner:hover .plugin-banner-inner {
      background: color-mix(in srgb, var(--lightgray) 80%, var(--secondary));
    }
    .plugin-banner-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--secondary) 12%, transparent);
      flex-shrink: 0;
    }
    .plugin-banner-text {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .plugin-banner-label {
      font-weight: 700;
      font-size: 0.8rem;
      line-height: 1.3;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--secondary);
    }
    .plugin-banner-desc {
      font-size: 0.8rem;
      color: var(--darkgray);
      line-height: 1.3;
    }
    .plugin-banner-arrow {
      flex-shrink: 0;
      opacity: 0.6;
      color: var(--secondary);
      transition: transform 0.15s;
    }
    .plugin-banner:hover .plugin-banner-arrow {
      transform: translateX(2px);
      opacity: 1;
    }
  `

  return PluginBanner
}) satisfies QuartzComponentConstructor
