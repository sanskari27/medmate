import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { App } from "@/app/App";
import { GuestRoute, ProtectedRoute } from "@/app/routes/ProtectedRoute";
import { LoginPage } from "@/features/authentication";
import { LandingPage } from "@/features/landing";
import { PatientListPage } from "@/features/patients";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "patients",
        element: (
          <ProtectedRoute>
            <PatientListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
