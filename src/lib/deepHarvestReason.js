export const DEEP_HARVEST_REASONS = /** @type {const} */ ({
  startup: 'startup',
  recordingOn: 'recording-on',
  liveIdChange: 'live-id-change',
  tabVisible: 'tab-visible'
});

/**
 * @param {unknown} reason
 * @returns {reason is (typeof DEEP_HARVEST_REASONS)[keyof typeof DEEP_HARVEST_REASONS]}
 */
export function isKnownDeepHarvestReason(reason) {
  const s = String(reason || '').trim();
  return Object.values(DEEP_HARVEST_REASONS).includes(
    /** @type {(typeof DEEP_HARVEST_REASONS)[keyof typeof DEEP_HARVEST_REASONS]} */ (s)
  );
}
