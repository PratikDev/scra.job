import type React from "react";
import { Label } from "@/components/ui/label";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<Label className="text-xs font-medium text-zinc-400">{label}</Label>
			{children}
		</div>
	);
}
