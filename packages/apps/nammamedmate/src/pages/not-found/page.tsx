import { Link } from "react-router-dom";
import { LandingLayout } from "@/components/layout/LandingLayout";

export default function NotFoundPage() {
  return (
    <LandingLayout>
      <section className="nl-sec" style={{ background: "var(--surface)" }}>
        <div className="nl-wrap">
          <div className="nl-sec-head">
            <span className="nl-eyebrow" style={{ justifyContent: "center" }}>
              404
            </span>
            <h2>That page is not here</h2>
            <p>The link may be old, or the page may have moved.</p>
            <p>
              <Link to="/">Back to the home page</Link>
            </p>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
