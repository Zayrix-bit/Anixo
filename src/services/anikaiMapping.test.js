import assert from "node:assert/strict";
import { normalizeTitle, resolveAnikaiMatch } from "./anikaiMapping.js";

function testNormalizeTitle() {
  const a = normalizeTitle("Jujutsu Kaisen 2nd Season");
  const b = normalizeTitle("Jujutsu Kaisen Season 2");
  const c = normalizeTitle("Jujutsu Kaisen (TV) S2");
  assert.equal(a, b);
  assert.equal(b, c);
}

function testResolveExactMatch() {
  const anime = {
    title: { english: "Jujutsu Kaisen 2nd Season" },
    synonyms: [],
  };
  const results = [
    { title: "Jujutsu Kaisen", slug: "jujutsu-kaisen" },
    { title: "Jujutsu Kaisen 2nd Season", slug: "jujutsu-kaisen-2nd-season" },
  ];
  const slug = resolveAnikaiMatch(results, anime);
  assert.equal(slug, "jujutsu-kaisen-2nd-season");
}

function testResolveFallback() {
  const anime = {
    title: { english: "Unknown Show" },
    synonyms: [],
  };
  const results = [
    { title: "Something Else", slug: "something-else" },
    { title: "Another", slug: "another" },
  ];
  const slug = resolveAnikaiMatch(results, anime);
  assert.equal(slug, "something-else");
}

function run() {
  testNormalizeTitle();
  testResolveExactMatch();
  testResolveFallback();
  console.log("anikaiMapping tests passed");
}

run();

