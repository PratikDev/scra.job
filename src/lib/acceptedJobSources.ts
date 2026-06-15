export const ACCEPTED_JOB_SOURCE_HOSTS = [
	"weworkremotely.com",
	"remoteok.com",
	"news.ycombinator.com",
	"ycombinator.com",
];

export function isAcceptedJobSourceUrl(value: string) {
	try {
		const url = new URL(value);
		const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
		return ACCEPTED_JOB_SOURCE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
	} catch {
		return false;
	}
}

export function acceptedJobSourceLabel() {
	return ACCEPTED_JOB_SOURCE_HOSTS.join(", ");
}
