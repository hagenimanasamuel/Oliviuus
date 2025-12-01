// src/config/navConfig.js
import { Home, Users, Film, CreditCard, BarChart, Globe, LifeBuoy } from "lucide-react";

export const navConfig = [
  {
    key: "overview",
    label: "Overview",
    icon: Home,
    allowed: ["admin"], // only admin role
    permissions: [] // no extra check needed
  },
  {
    key: "users",
    label: "Users",
    icon: Users,
    allowed: ["admin"],
    permissions: ["manage_users"]
  },
  {
    key: "content",
    label: "Content",
    icon: Film,
    allowed: ["admin", "other"],
    permissions: ["approve_content", "manage_distributors"]
  },
  {
    key: "subscriptions",
    label: "Subscriptions & Billing",
    icon: CreditCard,
    allowed: ["admin"],
    permissions: ["manage_billing"]
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart,
    allowed: ["admin", "other"],
    permissions: ["view_analytics"]
  },
  {
    key: "global",
    label: "Global Management",
    icon: Globe,
    allowed: ["admin"],
    permissions: ["system_config"]
  },
  {
    key: "support",
    label: "Support",
    icon: LifeBuoy,
    allowed: ["admin", "other"],
    permissions: ["handle_tickets"]
  }
];
