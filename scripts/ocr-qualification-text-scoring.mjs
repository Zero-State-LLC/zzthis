import {
  isWordlistVersion,
  loadWordlist,
  parseCode,
  verifyCheckWord,
} from "../packages/zz-core/src/index.ts";

function rate(numerator, denominator) {
  return {
    numerator,
    denominator,
    rate: denominator === 0 ? null : numerator / denominator,
  };
}

function codePoints(value) {
  return Array.from(value.normalize("NFC"));
}

function payloadWords(value) {
  return value
    .normalize("NFC")
    .split(/\s+/u)
    .filter((part) => part.length > 0);
}

function sequenceEditDistance(left, right) {
  let a = left;
  let b = right;
  if (a.length < b.length) [a, b] = [b, a];

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let aIndex = 1; aIndex <= a.length; aIndex += 1) {
    const current = [aIndex];
    for (let bIndex = 1; bIndex <= b.length; bIndex += 1) {
      const substitutionCost = a[aIndex - 1] === b[bIndex - 1] ? 0 : 1;
      current[bIndex] = Math.min(
        previous[bIndex] + 1,
        current[bIndex - 1] + 1,
        previous[bIndex - 1] + substitutionCost,
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function partWordAccuracy(reference, prediction) {
  const referenceWords = payloadWords(reference);
  if (referenceWords.length === 0) {
    return { numerator: 0, denominator: 0, rate: null };
  }
  const distance = sequenceEditDistance(
    referenceWords,
    payloadWords(prediction),
  );
  const numerator = Math.max(0, referenceWords.length - distance);
  return {
    numerator,
    denominator: referenceWords.length,
    rate: numerator / referenceWords.length,
  };
}

export function levenshteinDistance(left, right) {
  if (typeof left !== "string" || typeof right !== "string") {
    throw new TypeError("levenshtein_string_inputs_required");
  }
  const a = codePoints(left);
  const b = codePoints(right);
  if (a.length < b.length) return levenshteinDistance(right, left);

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let aIndex = 1; aIndex <= a.length; aIndex += 1) {
    const current = [aIndex];
    for (let bIndex = 1; bIndex <= b.length; bIndex += 1) {
      const substitutionCost = a[aIndex - 1] === b[bIndex - 1] ? 0 : 1;
      current[bIndex] = Math.min(
        previous[bIndex] + 1,
        current[bIndex - 1] + 1,
        previous[bIndex - 1] + substitutionCost,
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function decodeTop1(candidate, wordlist) {
  if (!candidate) {
    return { rawText: "", canonical: null, falseValidEligible: false };
  }
  const parsed = parseCode(`zz-${candidate.raw_text}-zz`);
  if (!parsed.ok) {
    return {
      rawText: candidate.raw_text,
      canonical: null,
      falseValidEligible: false,
    };
  }
  const falseValidEligible =
    parsed.kind === "plain" &&
    verifyCheckWord(parsed.words, wordlist).result === "ok";
  return {
    rawText: candidate.raw_text,
    canonical: parsed.canonical,
    falseValidEligible,
  };
}

/**
 * Score top-1 payload outcomes after fiducial pairing has been reconciled.
 * Pair mappings, candidate order, and all truth comparisons stay local.
 */
export function scorePayloadObservations(
  manifestSample,
  adapterResult,
  pairScoring,
  wordlistVersion,
) {
  validatePayloadScoringInputs(manifestSample, adapterResult, pairScoring);
  if (!isWordlistVersion(wordlistVersion)) {
    throw new RangeError("decoder_wordlist_version_unavailable");
  }
  const wordlist = loadWordlist(wordlistVersion);
  const predictedPairByTruth = indexCorrectPairs(pairScoring.correct_pairs);
  const candidatesByPair = groupCandidates(adapterResult.candidates);

  let exactNumerator = 0;
  let exactDenominator = 0;
  let editDistance = 0;
  let referenceCodePointCount = 0;
  let falseValidNumerator = 0;
  let falseValidDenominator = 0;
  let partWordNumerator = 0;
  let partWordDenominator = 0;
  const observations = [];
  const falseValidCases = [];

  for (const truth of manifestSample.ground_truth_codes) {
    const predictedPairId = predictedPairByTruth.get(truth.pair_id);
    const score = scoreTruthObservation(
      truth,
      candidatesByPair.get(predictedPairId) ?? [],
      wordlist,
    );
    editDistance += score.editDistance;
    referenceCodePointCount += score.referenceCodePointCount;
    partWordNumerator += score.partWordAccuracy.numerator;
    partWordDenominator += score.partWordAccuracy.denominator;
    observations.push(score.observation);
    if (score.exactCorrect !== null) {
      exactDenominator += 1;
      if (score.exactCorrect) exactNumerator += 1;
    }
    if (score.falseValidDecode !== null) {
      falseValidDenominator += 1;
      if (score.falseValidDecode) {
        falseValidNumerator += 1;
        falseValidCases.push({
          device_matrix_entry_id: adapterResult.device_matrix_entry_id,
          sample_id: manifestSample.sample_id,
          pair_id: truth.pair_id,
          expected_code: truth.canonical_code,
          observed_code: score.observedCode,
        });
      }
    }
  }

  return {
    sample_id: manifestSample.sample_id,
    device_matrix_entry_id: adapterResult.device_matrix_entry_id,
    split: adapterResult.split,
    observations,
    exact_code_accuracy: rate(exactNumerator, exactDenominator),
    part_word_accuracy: rate(partWordNumerator, partWordDenominator),
    character_error_rate: {
      edit_distance: editDistance,
      reference_code_point_count: referenceCodePointCount,
      rate:
        referenceCodePointCount === 0
          ? null
          : editDistance / referenceCodePointCount,
    },
    false_valid_decode_rate: rate(falseValidNumerator, falseValidDenominator),
    false_valid_cases: falseValidCases,
  };
}

function validatePayloadScoringInputs(
  manifestSample,
  adapterResult,
  pairScoring,
) {
  if (
    !manifestSample ||
    !adapterResult ||
    manifestSample.sample_id !== adapterResult.sample_id ||
    !Array.isArray(manifestSample.ground_truth_codes) ||
    !Array.isArray(adapterResult.candidates) ||
    !Array.isArray(pairScoring?.correct_pairs)
  ) {
    throw new TypeError("payload_scoring_inputs_invalid");
  }
}

function indexCorrectPairs(correctPairs) {
  const predictedPairByTruth = new Map();
  for (const pair of correctPairs) {
    if (
      typeof pair.truth_pair_id !== "string" ||
      typeof pair.predicted_pair_id !== "string" ||
      predictedPairByTruth.has(pair.truth_pair_id)
    ) {
      throw new TypeError("payload_pair_mapping_invalid");
    }
    predictedPairByTruth.set(pair.truth_pair_id, pair.predicted_pair_id);
  }
  return predictedPairByTruth;
}

function groupCandidates(candidates) {
  const byPair = new Map();
  for (const candidate of candidates) {
    if (typeof candidate.pair_id !== "string") continue;
    const group = byPair.get(candidate.pair_id) ?? [];
    group.push(candidate);
    byPair.set(candidate.pair_id, group);
  }
  return byPair;
}

function scoreTruthObservation(truth, candidates, wordlist) {
  // Candidate arrays retain adapter order, so index zero is the gated top-1.
  const top1 = candidates[0];
  const decoded = decodeTop1(top1, wordlist);
  const referenceLength = codePoints(truth.literal_payload).length;
  const distance = levenshteinDistance(decoded.rawText, truth.literal_payload);
  const partWordScore = partWordAccuracy(
    truth.literal_payload,
    decoded.rawText,
  );
  const hasCanonicalTruth = typeof truth.canonical_code === "string";
  const exactCorrect = hasCanonicalTruth
    ? decoded.canonical === truth.canonical_code
    : null;
  const falseValidDecode = hasCanonicalTruth
    ? decoded.falseValidEligible && decoded.canonical !== truth.canonical_code
    : null;
  return {
    editDistance: distance,
    referenceCodePointCount: referenceLength,
    exactCorrect,
    falseValidDecode,
    observedCode: decoded.canonical,
    partWordAccuracy: partWordScore,
    observation: {
      pair_id: truth.pair_id,
      candidate_count: candidates.length,
      top1_candidate_id: top1?.candidate_id ?? null,
      exact_code_correct: exactCorrect,
      character_edit_distance: distance,
      reference_code_point_count: referenceLength,
      part_word_accuracy: partWordScore,
      false_valid_decode: falseValidDecode,
    },
  };
}
