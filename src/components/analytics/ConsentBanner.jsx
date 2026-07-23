export default function ConsentBanner({ analyticsConfig, onAccept, onReject }) {
  return <section className="analytics-consent" role="dialog" aria-label="Analytics preferences">
    <p>We use optional analytics to understand traffic and improve the blog.</p>
    <div className="analytics-consent__actions">
      <button type="button" onClick={onAccept}>Accept analytics</button>
      <button type="button" onClick={onReject}>Reject non-essential analytics</button>
      <a href={analyticsConfig.consent.privacyPagePath}>Privacy</a>
    </div>
  </section>;
}
