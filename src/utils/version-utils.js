// src/utils/version-utils.js
const semver = require('semver');

const LIRIFY_API_VERSION = '1.0.0';

class VersionUtils {
  static getAPIVersion() {
    return LIRIFY_API_VERSION;
  }

  static isVersionValid(version) {
    return !!semver.valid(version);
  }

  static isRangeValid(range) {
    return !!semver.validRange(range);
  }

  /** Check if a plugin's required API range is satisfied by the current Lirify API version */
  static isAPICompatible(requiredRange) {
    if (!requiredRange) return true; // No requirement = always compatible
    if (!semver.validRange(requiredRange)) return false;
    return semver.satisfies(LIRIFY_API_VERSION, requiredRange);
  }

  /** Compare two semver strings: -1, 0, 1 */
  static compare(a, b) {
    return semver.compare(a, b);
  }

  /** Check if `version` satisfies a range like '^1.0.0' or '>=1.2.0 <2.0.0' */
  static satisfies(version, range) {
    if (!version || !range) return false;
    return semver.satisfies(version, range);
  }
}

module.exports = { VersionUtils, LIRIFY_API_VERSION };
