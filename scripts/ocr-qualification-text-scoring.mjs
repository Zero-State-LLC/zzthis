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
  const normalized = value.normalize("NFC");
  return normalized.split(/\s+/u).filter((part) => part.length > 0);
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
  const predictionWords = payloadWords(prediction);
  const editDistance = sequenceEditDistance(referenceWords, predictionWords);
  const numerator = Math.max(0, referenceWords.length - editDistance);
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

function validatePayloadInputs(
  manifestSample,
  adapterResult,
  pairScoring,
  wordlistVersion,
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
  if (!isWordlistVersion(wordlistVersion)) {
    throw new RangeError("decoder_wordlist_version_unavailable");
  }
  return loadWordlist(wordlistVersion);
}

function indexPredictedPairs(correctPairs) {
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

function selectTopCandidate(truth, predictedPairByTruth, adapterResult) {
  const predictedPairId = predictedPairByTruth.get(truth.pair_id);
  const pairCandidates =
    predictedPairId === undefined
      ? []
      : adapterResult.candidates.filter(
          (candidate) => candidate.pair_id === predictedPairId,
        );
  return { pairCandidates, top1: pairCandidates[0] };
}

function scoreTruthObservation(truth, decoded) {
  const referenceLength = codePoints(truth.literal_payload).length;
  const distance = levenshteinDistance(decoded.rawText, truth.literal_payload);
  const hasCanonicalTruth = typeof truth.canonical_code === "string";
  const exactCorrect = hasCanonicalTruth
    ? decoded.canonical === truth.canonical_code
    : null;
  const isFalseValid =
    hasCanonicalTruth &&
    decoded.falseValidEligible &&
    decoded.canonical !== truth.canonical_code;
  return {
    referenceLength,
    distance,
    hasCanonicalTruth,
    exactCorrect,
    isFalseValid,
    partWordAccuracy: partWordAccuracy(truth.literal_payload, decoded.rawText),
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
  const wordlist = validatePayloadInputs(
    manifestSample,
    adapterResult,
    pairScoring,
    wordlistVersion,
  );
  const predictedPairByTruth = indexPredictedPairs(pairScoring.correct_pairs);

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
    const { pairCandidates, top1 } = selectTopCandidate(
      truth,
      predictedPairByTruth,
      adapterResult,
    );
    // Filtering is stable; the adapter's original engine order defines top-1.
    const decoded = decodeTop1(top1, wordlist);
    const scored = scoreTruthObservation(truth, decoded);
    editDistance += scored.distance;
    referenceCodePointCount += scored.referenceLength;
    partWordNumerator += scored.partWordAccuracy.numerator;
    partWordDenominator += scored.partWordAccuracy.denominator;

    if (scored.hasCanonicalTruth) {
      exactDenominator += 1;
      if (scored.exactCorrect) exactNumerator += 1;
      falseValidDenominator += 1;
      if (scored.isFalseValid) {
        falseValidNumerator += 1;
        falseValidCases.push({
          device_matrix_entry_id: adapterResult.device_matrix_entry_id,
          sample_id: manifestSample.sample_id,
          pair_id: truth.pair_id,
          expected_code: truth.canonical_code,
          observed_code: decoded.canonical,
        });
      }
    }

    observations.push({
      pair_id: truth.pair_id,
      candidate_count: pairCandidates.length,
      top1_candidate_id: top1?.candidate_id ?? null,
      exact_code_correct: scored.exactCorrect,
      character_edit_distance: scored.distance,
      reference_code_point_count: scored.referenceLength,
      part_word_accuracy: scored.partWordAccuracy,
      false_valid_decode: scored.hasCanonicalTruth ? scored.isFalseValid : null,
    });
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
