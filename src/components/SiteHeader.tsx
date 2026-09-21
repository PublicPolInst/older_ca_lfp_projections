/* Brand bar ported from web-data-visualization's site nav: orange band, Orbitron wordmark, a hairline divider, the institute name. This interactive stands alone, so the bar carries no search or site navigation; the wordmark links to PPIC's main site. */
export default function SiteHeader() {
  return (
    <div className="site-header">
      <div className="site-header-inner">
        <div className="site-brand">
          <a className="site-wordmark" href="https://www.ppic.org" aria-label="PPIC home">
            PPIC
          </a>
          <div className="site-brand-divider" aria-hidden="true" />
          <div className="site-institute">
            <div>Public Policy</div>
            <div>Institute of California</div>
          </div>
        </div>
      </div>
    </div>
  );
}
