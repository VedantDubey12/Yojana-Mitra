/**
 * Eligibility engine.
 * Works in the browser (window.SchemeEngine) and in Node (module.exports) so the
 * same logic can be unit-tested. Rules live in data/schemes.json, not in code.
 *
 * A profile looks like:
 *   { age: 34, income: 120000, occupation: "farmer", gender: "female", category: "OBC" }
 *
 * A rule may contain: occupations[], minAge, maxAge, maxIncome, gender, categories[],
 * and anyOf[] (a list of sub-rules, at least one of which must pass).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SchemeEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function passes(rule, p) {
    if (!rule) return true;
    if (rule.occupations && !rule.occupations.includes(p.occupation)) return false;
    if (rule.minAge != null && p.age < rule.minAge) return false;
    if (rule.maxAge != null && p.age > rule.maxAge) return false;
    if (rule.maxIncome != null && p.income > rule.maxIncome) return false;
    if (rule.gender && rule.gender !== p.gender) return false;
    if (rule.categories && !rule.categories.includes(p.category)) return false;
    if (rule.anyOf && !rule.anyOf.some((sub) => passes(sub, p))) return false;
    return true;
  }

  /** Returns the problems with a profile, or an empty array if it is valid. */
  function validateProfile(p) {
    const errors = [];
    if (!Number.isFinite(p.age) || p.age < 1 || p.age > 120) errors.push("Enter an age between 1 and 120.");
    if (!Number.isFinite(p.income) || p.income < 0 || p.income > 1e9) errors.push("Enter your annual family income in rupees (0 or more).");
    if (!p.occupation) errors.push("Select your occupation.");
    return errors;
  }

  /** Returns the schemes a profile appears eligible for. */
  function matchSchemes(profile, schemes) {
    return schemes.filter((s) => passes(s.rules, profile));
  }

  return { passes, validateProfile, matchSchemes };
});
