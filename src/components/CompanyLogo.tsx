import { cn } from "@/lib/utils";

export function CompanyLogo({ name, small = false }: { name: string; small?: boolean }) {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase())
		.join("");

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-semibold text-indigo-300",
				small ? "size-9" : "size-12"
			)}
		>
			{initials || "?"}
		</div>
	);
}
