/**
 * moon.js — Real lunar phase display using SunCalc
 * Wraps SunCalc to provide display-ready moon data.
 */

// SunCalc is loaded as a global via <script> tag in index.html

/**
 * Get the real moon phase for a given date
 * @param {Date} [date]
 * @returns {{ phase: number, phaseName: string, emoji: string, illumination: string }}
 */
export function getRealMoonPhase(date = new Date()) {
  if (typeof SunCalc === 'undefined') {
    return { phase: 0, phaseName: 'Unknown', emoji: '🌙', illumination: '?' };
  }

  const illum = SunCalc.getMoonIllumination(date);
  const phase = illum.phase; // 0.0 to 1.0

  // angle > 0 means waxing, < 0 means waning
  const waxing = Math.sin(illum.angle) >= 0;

  return {
    phase,
    phaseName: getPhaseName(phase, waxing),
    emoji: getPhaseEmoji(phase, waxing),
    illumination: Math.round(illum.fraction * 100) + '%'
  };
}

function getPhaseName(phase, waxing) {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return waxing ? 'Waxing Crescent' : 'Waning Crescent';
  if (phase < 0.28) return waxing ? 'First Quarter' : 'Last Quarter';
  if (phase < 0.47) return waxing ? 'Waxing Gibbous' : 'Waning Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

function getPhaseEmoji(phase, waxing) {
  if (phase < 0.03 || phase > 0.97) return '🌑';
  if (phase < 0.22) return waxing ? '🌒' : '🌘';
  if (phase < 0.28) return waxing ? '🌓' : '🌗';
  if (phase < 0.47) return waxing ? '🌔' : '🌖';
  if (phase < 0.53) return '🌕';
  if (phase < 0.72) return '🌖';
  if (phase < 0.78) return '🌗';
  return '🌘';
}

/**
 * Check if the real moon phase is "in sync" with the cycle phase
 * Returns true if both point to roughly the same moon phase category
 */
export function checkMoonSync(realPhase, cyclePhase) {
  const realCategory = getRealMoonCategory(realPhase.phase);
  const cycleCategory = getCycleMoonCategory(cyclePhase);
  return realCategory === cycleCategory;
}

function getRealMoonCategory(phase) {
  if (phase < 0.1 || phase > 0.9) return 'new';
  if (phase < 0.4) return 'waxing';
  if (phase < 0.6) return 'full';
  return 'waning';
}

function getCycleMoonCategory(cyclePhase) {
  const map = {
    menstrual: 'new',
    follicular: 'waxing',
    ovulatory: 'full',
    early_luteal: 'waning',
    pms: 'waning',
    peak_pms: 'new'
  };
  return map[cyclePhase] || 'new';
}
