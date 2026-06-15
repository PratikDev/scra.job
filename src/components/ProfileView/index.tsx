import { SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DarkTextarea } from "@/components/DarkTextarea";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";

export function ProfileView() {
	const [resumeText, setResumeText] = useState("");
	const [message, setMessage] = useState("Ready");
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadProfile() {
			try {
				const profile = await api<{ resumeText: string }>("/api/profile");
				setResumeText(profile.resumeText);
				setMessage("Profile loaded");
			} catch (caught) {
				setError(caught instanceof Error ? caught.message : "Failed to load profile");
			}
		}

		void loadProfile();
	}, []);

	async function saveProfile() {
		try {
			await api<{ resumeText: string }>("/api/profile", {
				method: "PUT",
				body: JSON.stringify({ resumeText }),
			});
			setMessage("Profile saved");
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Could not save profile");
		}
	}

	return (
		<Panel title="Resume Match Profile" description="Local keyword scoring only. No external AI or paid APIs.">
			<div className="flex flex-col gap-4">
				{error ? (
					<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
						{error}
					</div>
				) : (
					<p className="text-xs text-zinc-400">{message}</p>
				)}
				<DarkTextarea
					className="min-h-96 text-sm leading-6"
					placeholder="React, Node.js, SQLite, scraping, data visualization..."
					value={resumeText}
					onChange={(event) => setResumeText(event.target.value)}
				/>
				<div className="flex justify-end">
					<Button onClick={() => void saveProfile()} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
						<SaveIcon data-icon="inline-start" />
						Save Profile
					</Button>
				</div>
			</div>
		</Panel>
	);
}
