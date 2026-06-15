const STOP_WORDS = new Set([
	"and",
	"are",
	"but",
	"for",
	"from",
	"have",
	"into",
	"our",
	"the",
	"this",
	"with",
	"you",
	"your",
	"will",
	"remote",
	"job",
	"role",
	"work",
]);

export function tokenize(text = "") {
	return String(text)
		.toLowerCase()
		.replace(/[^a-z0-9+#.\s-]/g, " ")
		.split(/\s+/)
		.map((word) => word.trim())
		.filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function calculateMatchScore(profileText, jobText) {
	const profileTokens = new Set(tokenize(profileText));
	if (profileTokens.size === 0) {
		return 0;
	}

	const jobTokens = new Set(tokenize(jobText));
	let matches = 0;
	for (const token of profileTokens) {
		if (jobTokens.has(token)) {
			matches += 1;
		}
	}

	return Math.min(100, Math.round((matches / profileTokens.size) * 100));
}
