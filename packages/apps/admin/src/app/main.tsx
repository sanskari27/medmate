import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import { store } from "@/app/store";
import { clearSession, writePersistedAuth } from "@/services/storage";
import "@/styles/globals.css";

store.subscribe(() => {
  const { session, pinReset } = store.getState().auth;
  if (session) writePersistedAuth({ session, pinReset });
  else clearSession();
});

const root = document.getElementById("root");
if (!root) throw new Error("root missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
