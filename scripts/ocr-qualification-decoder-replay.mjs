import {
  classifyCode,
  isWordlistVersion,
  loadWordlist,
  parseCode,
  verifyCheckWord,
} from "../packages/zz-core/src/index.ts";

export function replayDecoderEvidence(
  manifest,
  adapterResults,
  candidateBundle,
) {
  const wordlistVersion = candidateBundle?.decoder?.wordlist_version;
  if (!isWordlistVersion(wordlistVersion)) {
    return {
      performed: false,
      reason: "decoder_wordlist_version_unavailable",
      summary: null,
    };
  }

  const wordlist = loadWordlist(wordlistVersion);
  const errors = [];
  const summary = {
    candidate_count: 0,
    parsed_candidate_count: 0,
    checkword_valid_candidate_count: 0,
    classification_counts: { word: 0, field: 0, confirm: 0, other: 0 },
    valid_truth_count: 0,
  };

  for (const sample of manifest.samples) {
    for (const truth of sample.ground_truth_codes) {
      if (truth.kind !== "valid") continue;
      summary.valid_truth_count += 1;
      const parsed = parseCode(`zz-${truth.literal_payload}-zz`);
      if (!parsed.ok || parsed.canonical !== truth.canonical_code) {
        errors.push("valid_ground_truth_decoder_mismatch");
        continue;
      }
      if (
        parsed.kind === "plain" &&
        verifyCheckWord(parsed.words, wordlist).result !== "ok"
      ) {
        errors.push("valid_ground_truth_checkword_mismatch");
      }
    }
  }

  for (const row of adapterResults.results) {
    for (const candidate of row.candidates) {
      summary.candidate_count += 1;
      const parsed = parseCode(`zz-${candidate.raw_text}-zz`);
      if (!parsed.ok) continue;
      summary.parsed_candidate_count += 1;
      if (parsed.kind === "plain") {
        const check = verifyCheckWord(parsed.words, wordlist);
        if (check.result === "ok") {
          summary.checkword_valid_candidate_count += 1;
        }
        const classification = classifyCode(parsed, wordlist).class;
        if (Object.hasOwn(summary.classification_counts, classification)) {
          summary.classification_counts[classification] += 1;
        } else {
          summary.classification_counts.other += 1;
        }
      } else {
        summary.classification_counts.other += 1;
      }
    }
  }

  return {
    performed: true,
    errors,
    summary,
  };
}
