export function ScrapeSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{[0, 1, 2, 3, 4].map((item) => (
				<div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
					<div className="flex gap-4">
						<div className="size-12 animate-pulse rounded-xl bg-zinc-800" />
						<div className="flex flex-1 flex-col gap-3">
							<div className="h-4 w-2/5 animate-pulse rounded bg-zinc-800" />
							<div className="h-3 w-1/4 animate-pulse rounded bg-zinc-800" />
							<div className="h-3 w-4/5 animate-pulse rounded bg-zinc-800" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
