import type React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Panel({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<Card className="rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl shadow-black/20">
			<CardHeader>
				<CardTitle className="text-base font-semibold tracking-normal text-zinc-50">{title}</CardTitle>
				<CardDescription className="text-xs text-zinc-400">{description}</CardDescription>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
