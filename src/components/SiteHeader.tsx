import logoUrl from "../assets/ppic-logo.svg";

/* Brand bar: PPIC's logo (compass mark, hairline, wordmark) on the white ground the logo artwork is drawn for, linking to the main PPIC site. This interactive stands alone, so the bar carries no search or site navigation. */
export default function SiteHeader() {
  return (
    <div className="site-header">
      <div className="site-header-inner">
        <a className="site-logo-link" href="https://www.ppic.org" aria-label="PPIC home">
          <img className="site-logo" src={logoUrl} alt="Public Policy Institute of California" width="164" height="48" />
        </a>
      </div>
    </div>
  );
}
