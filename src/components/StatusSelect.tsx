import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, type Status } from "@/lib/types";

export function StatusSelect({ value, onChange }: { value: Status; onChange: (status: Status) => void }) {
	return (
		<Select value={value} onValueChange={(nextValue) => onChange(nextValue as Status)}>
			<SelectTrigger className="w-full rounded-xl border-zinc-800 bg-zinc-900 text-zinc-200 transition-all duration-200 hover:bg-zinc-800">
				<SelectValue />
			</SelectTrigger>
			<SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
				<SelectGroup>
					{STATUSES.map((status) => (
						<SelectItem key={status} value={status} className="focus:bg-zinc-900 focus:text-zinc-100">
							{status}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
