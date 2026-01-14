// src/components/layout/dashboard/admin/Sidebar/NavItems.jsx
import React from "react";
import {
  Home,
  Users,
  Film,
  DollarSign,
  BarChart,
  Gamepad2,
  Headphones,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ✅ Export navItems so it can be reused in RoleForm
export const navItems = [
  { labelKey: "sidebar.overview", icon: Home, path: "/" },
  { labelKey: "sidebar.users", icon: Users, path: "/admin/users" },
  { labelKey: "sidebar.library", icon: Film, path: "/admin/library" },
  { labelKey: "sidebar.subscriptions", icon: DollarSign, path: "/admin/subscriptions" },
  { labelKey: "sidebar.games", icon: Gamepad2, path: "/admin/games" },
  { labelKey: "sidebar.support", icon: Headphones, path: "/admin/support" },
  { labelKey: "sidebar.analytics", icon: BarChart, path: "/admin/analytics" },
];

export default function NavItems({ isCollapsed }) {
  const { t } = useTranslation();

  return (
    <ul className="space-y-1 px-3 py-4 text-sm text-gray-300">
      {navItems.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-gray-700 text-white shadow-sm"
                  : "hover:bg-gray-800 text-gray-300"
              }`
            }
          >
            <item.icon size={18} strokeWidth={1.8} />
            {!isCollapsed && <span>{t(item.labelKey)}</span>}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}