import { useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import routes from "./routes";
import NotFound from "../components/shared/NotFound";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import Login from "../features/auth/pages/Login";
import Onboarding from "../features/onboarding/pages/Onboarding";
import Signup from "../features/auth/pages/Signup";
import { useAuth } from "../hooks/useAuth";

export default function App() {
  const { user } = useAuth();
  const [activeRoute, setActiveRoute] = useState("dashboard");
  const [authRoute, setAuthRoute] = useState("login");

  const currentRoute = useMemo(() => {
    return routes.find((route) => route.key === activeRoute);
  }, [activeRoute]);

  const Page = currentRoute?.component || NotFound;

  if (!user) {
    const AuthPage =
      authRoute === "signup"
        ? Signup
        : authRoute === "forgot"
          ? ForgotPassword
          : Login;

    return <AuthPage setAuthRoute={setAuthRoute} />;
  }

  if (!user.dietProfile?.completed) {
    return <Onboarding />;
  }

  return (
    <DashboardLayout
      routes={routes}
      activeRoute={activeRoute}
      setActiveRoute={setActiveRoute}
    >
      <Page setActiveRoute={setActiveRoute} />
    </DashboardLayout>
  );
}
