import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/layout";
import {
  LoginPage,
  PinSetupPage,
  accountRoleLabel,
  canReview,
  canSupport,
  canUseAdminPortal,
  useAuthActions,
  useAuthState,
} from "@/features/authentication";
import { LeadDetailPage, LeadsPage } from "@/features/leads";
import { PharmacyDetailPage } from "@/features/pharmacies";
import { ReviewDetailPage, ReviewsPage } from "@/features/reviews";
import { SupportCasePage, SupportPage } from "@/features/support";
import { GuestRoute, PinRoute, ProtectedRoute } from "./ProtectedRoute";
import { navRoutes } from "./routeConfig";

export function AppRouter() {
  const { session } = useAuthState();
  const auth = useAuthActions();
  const signOut = useRef(auth.signOut);
  signOut.current = auth.signOut;
  const blockedToken = session && !canUseAdminPortal(session.account) ? session.refreshToken : null;
  const items = navRoutes(session?.account);
  const review = canReview(session?.account);
  const support = canSupport(session?.account);
  const roleLabel = session ? accountRoleLabel(session.account) : "";
  const storedName = session?.account.displayName?.trim() ?? "";
  const displayName = storedName || roleLabel;
  useEffect(() => {
    if (!blockedToken) return;
    void signOut.current();
  }, [blockedToken]);
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/" element={<LoginPage />} />
      </Route>
      <Route element={<PinRoute />}>
        <Route path="/pin" element={<PinSetupPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <DashboardLayout
              items={items}
              displayName={displayName}
              roleLabel={storedName ? roleLabel : ""}
              onSignOut={() => void auth.signOut()}
            />
          }
        >
          {items
            .filter(
              (route) =>
                route.path !== "/reviews" && route.path !== "/support" && route.path !== "/leads",
            )
            .map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          <Route
            path="/reviews"
            element={review ? <ReviewsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/reviews/:pharmacyId"
            element={review ? <ReviewDetailPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/support"
            element={support ? <SupportPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/support/cases/:caseId"
            element={support ? <SupportCasePage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/leads"
            element={support ? <LeadsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/leads/:leadId"
            element={support ? <LeadDetailPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route path="/pharmacies/:pharmacyId" element={<PharmacyDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
