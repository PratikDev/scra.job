const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:4000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_ORIGIN}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	});

	if (!response.ok) {
		const body = await response.json().catch(() => ({ error: response.statusText }));
		throw new Error(body.error || "Request failed");
	}

	return response.json() as Promise<T>;
}
