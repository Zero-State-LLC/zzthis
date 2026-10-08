import { describe, expect, it } from "vitest";
import {
  levenshteinDistance,
  scorePayloadObservations,
} from "../scripts/ocr-qualification-text-scoring.mjs";

const mapping = (predictedPairId = "pred-1") => ({
  correct_pairs: [
    { truth_pair_id: "truth-1", predicted_pair_id: predictedPairId },
  ],
});

function input(
  rawTexts: string[],
  options: {
    literal?: string;
    canonical?: string | null;
    pairId?: string | null;
  } = {},
) {
  const literal = options.literal ?? "copper lantern sky";
  return {
    manifest: {
      sample_id: "sample-1",
      ground_truth_codes: [
        {
          pair_id: "truth-1",
          literal_payload: literal,
          canonical_code:
            options.canonical === undefined
              ? "zz-copper-lantern-sky-zz"
              : options.canonical,
          kind:
            options.canonical === null
              ? ("partial" as const)
              : ("valid" as const),
        },
      ],
    },
    adapter: {
      sample_id: "sample-1",
      split: "final" as const,
      device_matrix_entry_id: "ios-device-a",
      candidates: rawTexts.map((raw_text, index) => ({
        candidate_id: `candidate-${index + 1}`,
        pair_id: options.pairId === undefined ? "pred-1" : options.pairId,
        raw_text,
      })),
    },
  };
}

describe("OCR qualification payload scoring", () => {
  it("computes Levenshtein distance over NFC code points", () => {
    expect(levenshteinDistance("café", "cafe\u0301")).toBe(0);
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  it("scores ordered payload words with NFC but no case or punctuation correction", () => {
    const partialMatch = input(["copper lantern stone"]);
    const scoredPartial = scorePayloadObservations(
      partialMatch.manifest,
      partialMatch.adapter,
      mapping(),
      "fixture-7",
    );
    expect(scoredPartial.part_word_accuracy).toEqual({
      numerator: 2,
      denominator: 3,
      rate: 2 / 3,
    });

    const caseMismatch = input(["Copper lantern sky"]);
    const scoredCase = scorePayloadObservations(
      caseMismatch.manifest,
      caseMismatch.adapter,
      mapping(),
      "fixture-7",
    );
    expect(scoredCase.part_word_accuracy).toEqual({
      numerator: 2,
      denominator: 3,
      rate: 2 / 3,
    });

    const inserted = input(["copper lantern sky extra"]);
    const scoredInsertion = scorePayloadObservations(
      inserted.manifest,
      inserted.adapter,
      mapping(),
      "fixture-7",
    );
    expect(scoredInsertion.part_word_accuracy).toEqual({
      numerator: 2,
      denominator: 3,
      rate: 2 / 3,
    });

    const normalized = input(["café noir"], { literal: "cafe\u0301 noir" });
    const scoredNormalized = scorePayloadObservations(
      normalized.manifest,
      normalized.adapter,
      mapping(),
      "fixture-7",
    );
    expect(scoredNormalized.part_word_accuracy.rate).toBe(1);
  });

  it("scores only the first engine-ordered hypothesis", () => {
    const values = input(["copper lantern sky", "copper maple sky"]);
    const scored = scorePayloadObservations(
      values.manifest,
      values.adapter,
      mapping(),
      "fixture-7",
    );

    expect(scored.exact_code_accuracy).toEqual({
      numerator: 1,
      denominator: 1,
      rate: 1,
    });
    expect(scored.character_error_rate).toEqual({
      edit_distance: 0,
      reference_code_point_count: 18,
      rate: 0,
    });
    expect(scored.false_valid_decode_rate).toEqual({
      numerator: 0,
      denominator: 1,
      rate: 0,
    });
    expect(scored.observations[0]?.top1_candidate_id).toBe("candidate-1");
  });

  it("counts a wrong valid top-1 even when a later hypothesis is correct", () => {
    const values = input(["copper river lantern", "copper lantern sky"]);
    const scored = scorePayloadObservations(
      values.manifest,
      values.adapter,
      mapping(),
      "fixture-7",
    );

    expect(scored.exact_code_accuracy).toEqual({
      numerator: 0,
      denominator: 1,
      rate: 0,
    });
    expect(scored.false_valid_decode_rate).toEqual({
      numerator: 1,
      denominator: 1,
      rate: 1,
    });
    expect(scored.false_valid_cases).toEqual([
      {
        device_matrix_entry_id: "ios-device-a",
        sample_id: "sample-1",
        pair_id: "truth-1",
        expected_code: "zz-copper-lantern-sky-zz",
        observed_code: "zz-copper-river-lantern-zz",
      },
    ]);
  });

  it("counts missing hypotheses as wrong exact/CER observations but not false-valid", () => {
    const values = input([]);
    const scored = scorePayloadObservations(
      values.manifest,
      values.adapter,
      mapping(),
      "fixture-7",
    );
    expect(scored.exact_code_accuracy.numerator).toBe(0);
    expect(scored.exact_code_accuracy.denominator).toBe(1);
    expect(scored.character_error_rate).toEqual({
      edit_distance: 18,
      reference_code_point_count: 18,
      rate: 1,
    });
    expect(scored.false_valid_decode_rate).toEqual({
      numerator: 0,
      denominator: 1,
      rate: 0,
    });
  });

  it("does not reuse candidates from crossed or unmapped pairs", () => {
    const values = input(["copper lantern sky"]);
    const scored = scorePayloadObservations(
      values.manifest,
      values.adapter,
      { correct_pairs: [] },
      "fixture-7",
    );
    expect(scored.exact_code_accuracy.rate).toBe(0);
    expect(scored.observations[0]?.candidate_count).toBe(0);
    expect(scored.false_valid_decode_rate.denominator).toBe(1);
  });

  it("keeps partial truths in CER but excludes them from valid-code gates", () => {
    const values = input(["copper lantern sky"], {
      literal: "copper lantern",
      canonical: null,
    });
    const scored = scorePayloadObservations(
      values.manifest,
      values.adapter,
      mapping(),
      "fixture-7",
    );
    expect(scored.exact_code_accuracy).toEqual({
      numerator: 0,
      denominator: 0,
      rate: null,
    });
    expect(scored.false_valid_decode_rate).toEqual({
      numerator: 0,
      denominator: 0,
      rate: null,
    });
    expect(scored.character_error_rate).toEqual({
      edit_distance: 4,
      reference_code_point_count: 14,
      rate: 4 / 14,
    });
  });
});
