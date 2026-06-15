import { describe, expect, it } from "vitest";
import { isAcceptedJobSourceUrl } from "./acceptedJobSources";

describe("accepted job sources", () => {
	it("allows configured public job source hosts", () => {
		expect(isAcceptedJobSourceUrl("https://www.ycombinator.com/companies/example/jobs/1")).toBe(true);
		expect(isAcceptedJobSourceUrl("https://news.ycombinator.com/jobs")).toBe(true);
		expect(isAcceptedJobSourceUrl("https://remoteok.com/remote-jobs/1")).toBe(true);
	});

	it("rejects unsupported job source hosts", () => {
		expect(isAcceptedJobSourceUrl("https://linkedin.com/jobs/view/1")).toBe(false);
	});
});
