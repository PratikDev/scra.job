import {
	BarChart3Icon,
	BriefcaseBusinessIcon,
	LayoutDashboardIcon,
	SearchIcon,
	UserRoundIcon,
} from "lucide-react";
import type { ActiveView } from "@/lib/types";

export const NAV_ITEMS: {
	id: ActiveView;
	label: string;
	icon: typeof LayoutDashboardIcon;
	to: "/dashboard" | "/scraper" | "/tracker" | "/profile" | "/analytics";
}[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon, to: "/dashboard" },
	{ id: "scraper", label: "Scraper", icon: SearchIcon, to: "/scraper" },
	{ id: "tracker", label: "Tracker", icon: BriefcaseBusinessIcon, to: "/tracker" },
	{ id: "profile", label: "Profile", icon: UserRoundIcon, to: "/profile" },
	{ id: "analytics", label: "Analytics", icon: BarChart3Icon, to: "/analytics" },
];
