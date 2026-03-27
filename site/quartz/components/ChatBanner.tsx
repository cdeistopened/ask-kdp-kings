import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

interface Options {
  label?: string
  description?: string
}

export default ((opts?: Options) => {
  const ChatBanner: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const label = opts?.label || "Ask the Archive"
    const description = opts?.description || "Chat with an AI that's read every episode"

    const bannerScript = `
(function() {
  const banner = document.getElementById('chat-banner');
  if (!banner) return;

  banner.addEventListener('click', function() {
    const toggle = document.getElementById('wiki-chat-toggle');
    const panel = document.getElementById('wiki-chat-panel');
    if (toggle && panel) {
      panel.classList.add('open');
      const input = document.getElementById('wiki-chat-input') || document.getElementById('wiki-chat-email');
      if (input) input.focus();
    }
  });
})();
`

    return (
      <>
        <div id="chat-banner" class={`chat-banner ${displayClass ?? ""}`}>
          <div class="chat-banner-inner">
            <div class="chat-banner-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="chat-banner-text">
              <span class="chat-banner-label">{label}</span>
              <span class="chat-banner-desc">{description}</span>
            </div>
            <div class="chat-banner-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: bannerScript }} />
      </>
    )
  }

  ChatBanner.css = `
    .chat-banner {
      margin: 0 0 1rem 0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .chat-banner:hover {
      transform: translateY(-1px);
    }
    .chat-banner-inner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      background: var(--secondary);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .chat-banner:hover .chat-banner-inner {
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    }
    .chat-banner-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      flex-shrink: 0;
    }
    .chat-banner-text {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .chat-banner-label {
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1.3;
    }
    .chat-banner-desc {
      font-size: 0.8rem;
      opacity: 0.85;
      line-height: 1.3;
    }
    .chat-banner-arrow {
      flex-shrink: 0;
      opacity: 0.7;
      transition: transform 0.2s;
    }
    .chat-banner:hover .chat-banner-arrow {
      transform: translateX(2px);
      opacity: 1;
    }
  `

  return ChatBanner
}) satisfies QuartzComponentConstructor
