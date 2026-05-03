import Dashboard from "../features/dashboard/pages/Dashboard";
import DailyCheckIn from "../features/checkin/pages/DailyCheckIn";
import WearableData from "../features/wearable/pages/WearableData";
import DailyHistory from "../features/history/pages/DailyHistory";
import Analytics from "../features/analytics/pages/Analytics";
import Predictions from "../features/predictions/pages/Predictions";
import FailurePrediction from "../features/failure/pages/FailurePrediction";
import UserDashboard from "../features/account/pages/UserDashboard";
import Feedback from "../features/feedback/pages/Feedback";
import AboutUs from "../features/about/pages/AboutUs";
import NotificationCenter from "../features/notifications/components/NotificationCenter";
import Settings from "../features/settings/pages/Settings";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import DietAssistant from "../features/assistant/pages/DietAssistant";
import {
  Activity,
  BarChart3,
  BellRing,
  Bot,
  Brain,
  CalendarDays,
  ClipboardCheck,
  Gauge,
  Home,
  Info,
  KeyRound,
  MessageSquare,
  Settings as SettingsIcon,
  ShieldCheck,
  Watch
} from "lucide-react";

const routes = [
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    component: AdminDashboard,
    roles: ["admin"]
  },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
    component: Dashboard,
    roles: ["user"]
  },
  {
    key: "checkin",
    label: "Daily Check-In",
    icon: ClipboardCheck,
    component: DailyCheckIn,
    roles: ["user"]
  },
  {
    key: "wearable",
    label: "Wearable Data",
    icon: Watch,
    component: WearableData,
    roles: ["user"]
  },
  {
    key: "history",
    label: "Daily History",
    icon: CalendarDays,
    component: DailyHistory,
    roles: ["user"]
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    component: Analytics,
    roles: ["user"]
  },
  {
    key: "predictions",
    label: "Predictions",
    icon: Brain,
    component: Predictions,
    roles: ["user"]
  },
  {
    key: "assistant",
    label: "AI Assistant",
    icon: Bot,
    component: DietAssistant,
    roles: ["user"]
  },
  {
    key: "failure",
    label: "Failure Risk",
    icon: Gauge,
    component: FailurePrediction,
    roles: ["user"]
  },
  {
    key: "account",
    label: "Users / Pass",
    icon: KeyRound,
    component: UserDashboard,
    roles: ["user"]
  },
  {
    key: "feedback",
    label: "Feedback",
    icon: MessageSquare,
    component: Feedback,
    roles: ["user"]
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: BellRing,
    component: NotificationCenter,
    roles: ["user"]
  },
  {
    key: "about",
    label: "About Us",
    icon: Info,
    component: AboutUs,
    roles: ["user", "admin"]
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    component: Settings,
    roles: ["user"]
  }
];

export default routes;
