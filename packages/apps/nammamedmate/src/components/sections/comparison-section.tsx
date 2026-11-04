import { CheckIcon } from '@/components/icons/CheckIcon';
import { MinusIcon } from '@/components/icons/MinusIcon';
import { PlayCircleIcon } from '@/components/icons/PlayCircleIcon';
import { XIcon } from '@/components/icons/XIcon';
export function ComparisonSection() {
  return (
    <section className="nl-sec" id="different" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            Why Namma MedMate
          </span>
          <h2>{"How we're different"}</h2>
          <p>
            A paper register, generic billing software and delivery apps each
            solve one piece. Namma MedMate runs the <b>whole shop</b>
            {' — '}and keeps your margins, your customers and your name on the
            store.
          </p>
        </div>
        <div className="nl-compare-wrap">
          <table className="nl-compare">
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col" className="">
                  Paper register
                </th>
                <th scope="col" className="">
                  Generic billing software
                </th>
                <th scope="col" className="">
                  Online delivery apps
                </th>
                <th scope="col" className="nl-col-us">
                  Namma MedMate
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{'Fast GST billing & POS'}</th>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="nl-col-us">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  {'Live inventory + expiry & restock alerts'}
                </th>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-p">
                    <MinusIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="nl-col-us">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">{'Customer CRM & prescriptions on file'}</th>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-p">
                    <MinusIcon />
                  </span>
                </td>
                <td className="nl-col-us">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">{'Hospital & ward credit (khata)'}</th>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="nl-col-us">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">{"Sell online under your own shop's name"}</th>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="nl-col-us">
                  <span className="nl-cmp-soon">Soon</span>
                </td>
              </tr>
              <tr>
                <th scope="row">{'You keep your margins & your customers'}</th>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="nl-col-us">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">One console for the whole shop</th>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-p">
                    <MinusIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="nl-col-us">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">{'Local setup & WhatsApp support'}</th>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-p">
                    <MinusIcon />
                  </span>
                </td>
                <td className="">
                  <span className="nl-cmp-ico nl-cmp-n">
                    <XIcon />
                  </span>
                </td>
                <td className="nl-col-us">
                  <span className="nl-cmp-ico nl-cmp-y">
                    <CheckIcon />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="nl-compare-note">
          {
            'Your online store & delivery are launching soon in Bengaluru — set up the console now and go live the day they open.'
          }
        </p>
        <div style={{ maxWidth: '680px', margin: '36px auto 0' }}>
          <figure className="nl-video">
            <button
              type="button"
              className="nl-video-thumb is-soon"
              style={{ aspectRatio: '16 / 9' }}
              aria-label="Why chemists switch to Namma MedMate — video coming soon"
            >
              <span className="nl-video-play" aria-hidden={true}>
                <PlayCircleIcon />
              </span>
              <span className="nl-video-soon">Video coming soon</span>
            </button>
            <figcaption className="nl-video-cap">
              <span className="nl-video-kicker">In 90 seconds</span>
              <b>Why chemists switch to Namma MedMate</b>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
