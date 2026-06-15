import type React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DarkInput(props: React.ComponentProps<typeof Input>) {
	return (
		<Input
			{...props}
			className={cn(
				"rounded-xl border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/30",
				props.className
			)}
		/>
	);
}
