import type React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function DarkTextarea(props: React.ComponentProps<typeof Textarea>) {
	return (
		<Textarea
			{...props}
			className={cn(
				"rounded-xl border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/30",
				props.className
			)}
		/>
	);
}
