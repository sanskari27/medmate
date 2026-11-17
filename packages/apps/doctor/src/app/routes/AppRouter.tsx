import { createBrowserRouter } from "react-router-dom";
import { App } from "@/app/App";
import { LandingPage } from "@/features/landing";
import { PatientListPage } from "@/features/patients";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "patients", element: <PatientListPage /> },
    ],
  },
]);