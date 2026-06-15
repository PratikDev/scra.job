import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ProfileView } from "@/components/ProfileView";

export const Route = createFileRoute("/profile")({
	component: ProfileRoute,
});

function ProfileRoute() {
	return (
		<AppShell activeView="profile">
			<ProfileView />
		</AppShell>
	);
}
