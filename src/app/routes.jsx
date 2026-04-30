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
import {
  Activity,
  BarChart3,
  BellRing,
  Brain,
  CalendarDays,
  ClipboardCheck,
  Gauge,
  Home,
  Info,
  KeyRound,
  MessageSquare,
  Settings as SettingsIcon,
  Watch
} from "lucide-react";

const routes = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
    component: Dashboard
  },
  {
    key: "checkin",
    label: "Daily Check-In",
    icon: ClipboardCheck,
    component: DailyCheckIn
  },
  {
    key: "wearable",
    label: "Wearable Data",
    icon: Watch,
    component: WearableData
  },
  {
    key: "history",
    label: "Daily History",
    icon: CalendarDays,
    component: DailyHistory
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    component: Analytics
  },
  {
    key: "predictions",
    label: "Predictions",
    icon: Brain,
    component: Predictions
  },
  {
    key: "failure",
    label: "Failure Risk",
    icon: Gauge,
    component: FailurePrediction
  },
  {
    key: "account",
    label: "Users / Pass",
    icon: KeyRound,
    component: UserDashboard
  },
  {
    key: "feedback",
    label: "Feedback",
    icon: MessageSquare,
    component: Feedback
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: BellRing,
    component: NotificationCenter
  },
  {
    key: "about",
    label: "About Us",
    icon: Info,
    component: AboutUs
  },
  {
    key: "settings",
    label: "Settings",
    icon: SettingsIcon,
    component: Settings
  }
];

export default routes;
