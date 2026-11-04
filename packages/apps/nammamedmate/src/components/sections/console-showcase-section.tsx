import { BarChartIcon } from '@/components/icons/BarChartIcon';
import { PackageIcon } from '@/components/icons/PackageIcon';
import { PlayCircleIcon } from '@/components/icons/PlayCircleIcon';
import { ReceiptIcon } from '@/components/icons/ReceiptIcon';
import { ZapIcon } from '@/components/icons/ZapIcon';
export function ConsoleShowcaseSection() {
  return (
    <section className="nl-sec nl-showcase" id="console">
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            One console. Every screen.
          </span>
          <h2>Runs on the devices you already have</h2>
          <p>
            The full ERP on your desktop, a fast counter on the tablet, and the
            whole shop in your pocket. Same data, everywhere — live.
          </p>
        </div>
        <div className="nl-showcase-stage">
          <div className="nl-showcase-tablet">
            <img
              src="/assets/landing/dash-tablet.png"
              alt="Namma MedMate dashboard on tablet"
            />
          </div>
          <div className="nl-showcase-phone">
            <img
              src="/assets/landing/dash-phone.png"
              alt="Namma MedMate partner app on phone"
            />
          </div>
        </div>
        <div className="nl-showcase-tags">
          <span className="nl-dtag">
            <BarChartIcon />
            Desktop ERP
          </span>
          <span className="nl-dtag">
            <ReceiptIcon />
            Tablet counter
          </span>
          <span className="nl-dtag">
            <PackageIcon />
            Phone on the move
          </span>
          <span className="nl-dtag">
            <ZapIcon />
            Realtime sync
          </span>
        </div>
        <div style={{ maxWidth: '720px', margin: '40px auto 0' }}>
          <figure className="nl-video">
            <button
              type="button"
              className="nl-video-thumb is-soon"
              style={{ aspectRatio: '16 / 9' }}
              aria-label="See the console in 2 minutes — video coming soon"
            >
              <span className="nl-video-play" aria-hidden={true}>
                <PlayCircleIcon />
              </span>
              <span className="nl-video-soon">Video coming soon</span>
            </button>
            <figcaption className="nl-video-cap">
              <span className="nl-video-kicker">Product walkthrough</span>
              <b>See the console in 2 minutes</b>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
