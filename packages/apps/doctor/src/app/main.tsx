import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes";
import { store } from "@/app/store";
import { clearSession, writePersistedAuth } from "@/services/storage";
import "@/styles/globals.css";

store.subscribe(() => {
  const { session, pinReset, step } = store.getState().auth;
  if (session) writePersistedAuth({ session, pinReset, step });
  else clearSession();
});

const root = document.getElementById("root");
if (!root) throw new Error("root missing");

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
