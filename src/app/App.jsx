import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import routes from "./routes";
import NotFound from "../components/shared/NotFound";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import Login from "../features/auth/pages/Login";
import Onboarding from "../features/onboarding/pages/Onboarding";
import Signup from "../features/auth/pages/Signup";
import Welcome from "../features/auth/pages/Welcome";
import { useAuth } from "../hooks/useAuth";

export default function App() {
  const { user } = useAuth();
  const [activeRoute, setActiveRoute] = useState("dashboard");
  const [authRoute, setAuthRoute] = useState("welcome");
  const userRole = user?.role === "admin" ? "admin" : "user";
  const availableRoutes = useMemo(() => {
    return routes.filter((route) => !route.roles || route.roles.includes(userRole));
  }, [userRole]);

  const currentRoute = useMemo(() => {
    return (
      availableRoutes.find((route) => route.key === activeRoute) ||
      availableRoutes[0]
    );
  }, [availableRoutes, activeRoute]);

  const Page = currentRoute?.component || NotFound;

  useEffect(() => {
    if (!user) return;

    const canAccessActiveRoute = availableRoutes.some(
      (route) => route.key === activeRoute
    );

    if (!canAccessActiveRoute) {
      setActiveRoute(userRole === "admin" ? "admin" : "dashboard");
    }
  }, [activeRoute, availableRoutes, user, userRole]);

  if (!user) {
    const AuthPage =
      authRoute === "signup"
        ? Signup
        : authRoute === "forgot"
          ? ForgotPassword
          : authRoute === "login"
            ? Login
            : Welcome;

    return <AuthPage setAuthRoute={setAuthRoute} />;
  }

  if (user.role !== "admin" && !user.dietProfile?.completed) {
    return <Onboarding />;
  }

  return (
    <DashboardLayout
      routes={availableRoutes}
      activeRoute={activeRoute}
      setActiveRoute={setActiveRoute}
    >
      <Page setActiveRoute={setActiveRoute} />
    </DashboardLayout>
  );
}
