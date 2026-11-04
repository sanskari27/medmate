import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { setProductDetails } from "@/content/details-api";
import { App } from "./router";
import "./styles/globals.css";

const root = document.getElementById("root")!;

async function boot() {
  const path = window.location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  if (path.startsWith("/medicine/")) {
    setProductDetails(await import("@/content/product-details"));
  }
  const app = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  if (root.childElementCount > 0) hydrateRoot(root, app);
  else createRoot(root).render(app);
}

void boot();
