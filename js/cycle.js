/**
 * cycle.js — Core cycle calculation engine for LunaSync
 * All functions are pure (no side effects, no DOM).
 */

// ── Phase definitions ──────────────────────────────────────────────────────
export const PHASES = {
  MENSTRUAL: 'menstrual',
  FOLLICULAR: 'follicular',
  OVULATORY: 'ovulatory',
  EARLY_LUTEAL: 'early_luteal',
  PMS: 'pms',
  PEAK_PMS: 'peak_pms'
};

const PHASE_PROFILES = {
  [PHASES.MENSTRUAL]: {
    name: 'New Moon Phase',
    moonEmoji: '🌑',
    label: 'Menstrual',
    color: 'var(--phase-menstrual)',
    glowColor: '#6b7db3',
    tagline: 'Rest & restoration mode.',
    moodSummary: 'Low energy, deeply introspective, needs comfort and warmth.',
    tipShort: 'Be gentle today.',
    tips: [
      '🤍 She needs comfort, not solutions. Just be present.',
      '🍫 Warm food, hot drinks, cozy vibes are everything right now.',
      '🚫 Not a good day to make big plans or have serious talks.',
      '🛋️ Movie night > going out.',
      '💌 A small thoughtful gesture goes a long way.'
    ],
    notifEmojis: ['😶‍🌫️', '🌑', '🤍'],
    notifPhrases: [
      'She\'s in rest mode. Low energy, needs gentleness today.',
      'Cozy mode activated. Be soft, be present.',
      'Today calls for comfort food and no pressure.'
    ]
  },
  [PHASES.FOLLICULAR]: {
    name: 'Waxing Phase',
    moonEmoji: '🌒',
    label: 'Follicular',
    color: 'var(--phase-follicular)',
    glowColor: '#4ecdc4',
    tagline: 'Energy is building.',
    moodSummary: 'Rising energy, optimistic, social, open to new ideas and adventures.',
    tipShort: 'Great time for plans.',
    tips: [
      '🌱 She\'s feeling fresher and more open — initiate plans!',
      '💬 Good window for meaningful conversations.',
      '🎉 Suggest something new: a restaurant, a trip, an activity.',
      '⚡ Her energy is climbing — match her enthusiasm.',
      '🧠 She\'s sharp and decisive. Great time for decisions.'
    ],
    notifEmojis: ['🌒', '✨', '🌿'],
    notifPhrases: [
      'Energy is rising — she\'s feeling fresh and open today.',
      'Great day to plan something fun together.',
      'She\'s social and optimistic. Perfect day to connect.'
    ]
  },
  [PHASES.OVULATORY]: {
    name: 'Full Moon Phase',
    moonEmoji: '🌕',
    label: 'Ovulatory',
    color: 'var(--phase-ovulatory)',
    glowColor: '#f9c74f',
    tagline: 'Peak energy. She\'s glowing.',
    moodSummary: 'Peak confidence, highest energy, deeply social and communicative.',
    tipShort: 'Her best days.',
    tips: [
      '✨ She\'s at her most magnetic and confident right now.',
      '💛 Peak mood window — this is the golden zone.',
      '📍 Best time for date nights, special occasions, big talks.',
      '🗣️ Communication is at its best. Say the important things.',
      '🚀 She\'ll be energetic and enthusiastic — plan something special.'
    ],
    notifEmojis: ['🌕', '💛', '✨'],
    notifPhrases: [
      'Full moon energy ✨ She\'s glowing today. Make it count.',
      'Peak vibes. Plan something special — she\'s in her element.',
      'Golden window 🌕 Best mood, best energy. Enjoy it!'
    ]
  },
  [PHASES.EARLY_LUTEAL]: {
    name: 'Waning Phase',
    moonEmoji: '🌖',
    label: 'Early Luteal',
    color: 'var(--phase-luteal)',
    glowColor: '#f4a261',
    tagline: 'Winding down slowly.',
    moodSummary: 'Gradually decreasing energy, mild cravings starting, still fairly stable.',
    tipShort: 'Gentle shift.',
    tips: [
      '🍕 Cravings are starting — be the snack delivery hero.',
      '😴 Energy is gently dropping. Don\'t overbook her.',
      '🤝 She appreciates reliability and calm right now.',
      '📺 Easy, low-key activities work better than busy plans.',
      '💬 Still good for talks, but keep them light.'
    ],
    notifEmojis: ['🌖', '🤎', '😌'],
    notifPhrases: [
      'Energy is gently winding down. Keep it chill today.',
      'Early luteal — snacks and comfort are her love language.',
      'She\'s shifting gears. Cozy > adventurous right now.'
    ]
  },
  [PHASES.PMS]: {
    name: 'PMS Zone',
    moonEmoji: '🌘',
    label: 'PMS Zone',
    color: 'var(--phase-pms)',
    glowColor: '#e07a8f',
    tagline: 'Tread gently. Storm incoming.',
    moodSummary: 'Heightened sensitivity, mood swings, fatigue, possible irritability.',
    tipShort: 'Handle with care.',
    tips: [
      '⚠️ Emotional sensitivity is high. Choose words carefully.',
      '🚫 Avoid criticism, big discussions, or anything confrontational.',
      '🍫 Chocolate, comfort food, warm things = good.',
      '🤗 Physical affection (hugs) goes a long way if she wants it.',
      '🎧 Give her space if she needs it — don\'t take it personally.',
      '📵 Don\'t make plans without checking first.'
    ],
    notifEmojis: ['🌘', '⚠️', '🍫'],
    notifPhrases: [
      'PMS zone activated ⚠️ Tread softly. Bring snacks.',
      'She\'s in the storm window. Patience is your superpower today.',
      '🌘 High sensitivity alert. Be the calm, not the trigger.'
    ]
  },
  [PHASES.PEAK_PMS]: {
    name: 'Peak PMS',
    moonEmoji: '🌑',
    label: 'Peak PMS',
    color: 'var(--phase-peak-pms)',
    glowColor: '#c9184a',
    tagline: 'Maximum sensitivity. Handle with love.',
    moodSummary: 'Very high irritability, possible anxiety, deep fatigue. Period imminent.',
    tipShort: 'Maximum care mode.',
    tips: [
      '🔴 New moon approaching. This is the most intense window.',
      '🤫 Less talking, more doing. Actions speak louder now.',
      '🧸 Comfort is everything: warm blanket, her fave food, low stimulation.',
      '🛑 Do NOT: criticise, debate, or bring up grievances.',
      '✅ DO: be patient, validate her feelings, be quietly present.',
      '📅 Her period is likely within 1–3 days.',
      '💊 If she has pain meds, make sure she has them ready.'
    ],
    notifEmojis: ['🔴', '💊', '🧸'],
    notifPhrases: [
      '🔴 Peak PMS. Period in ~1-3 days. Maximum gentleness required.',
      'DEFCON snacks 🍫 She needs warmth, not words. Just be there.',
      'Final days of her cycle. Patience unlocked. Love mode: max.'
    ]
  }
};

// ── Core calculations ──────────────────────────────────────────────────────

/**
 * Get number of days since cycle started (1-indexed)
 * @param {Date} startDate - Day 1 of the current cycle
 * @param {Date} [today] - optional override for today
 * @returns {number} - day number in cycle (1 = first day of period)
 */
export function getCycleDay(startDate, today = new Date()) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return ((diffDays % 29) + 29) % 29 + 1; // always 1–29
}

/**
 * Determine the cycle phase for a given cycle day
 * Default breakdown for a 29-day cycle:
 *   Day 1–5:   Menstrual
 *   Day 6–13:  Follicular
 *   Day 14–16: Ovulatory
 *   Day 17–22: Early Luteal
 *   Day 23–26: PMS Zone
 *   Day 27–29: Peak PMS
 */
export function getPhase(cycleDay, cycleLength = 29) {
  // Scale thresholds proportionally if cycle length differs from 29
  const scale = cycleLength / 29;
  if (cycleDay <= Math.round(5 * scale)) return PHASES.MENSTRUAL;
  if (cycleDay <= Math.round(13 * scale)) return PHASES.FOLLICULAR;
  if (cycleDay <= Math.round(16 * scale)) return PHASES.OVULATORY;
  if (cycleDay <= Math.round(22 * scale)) return PHASES.EARLY_LUTEAL;
  if (cycleDay <= Math.round(26 * scale)) return PHASES.PMS;
  return PHASES.PEAK_PMS;
}

/**
 * Get the full mood profile object for a cycle phase
 */
export function getMoodProfile(phase) {
  return PHASE_PROFILES[phase] || PHASE_PROFILES[PHASES.MENSTRUAL];
}

/**
 * Get days remaining in cycle
 */
export function getDaysUntilNextPeriod(cycleDay, cycleLength = 29) {
  return cycleLength - cycleDay + 1;
}

/**
 * Generate a 7-day forecast array
 * @param {Date} startDate
 * @param {number} cycleLength
 * @param {Date} [from] - start of forecast window (defaults to today)
 * @returns {Array<{date, cycleDay, phase, profile}>}
 */
export function getForecast(startDate, cycleLength = 29, from = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(from);
    date.setDate(date.getDate() + i);
    const cycleDay = getCycleDay(startDate, date);
    // Wrap correctly within cycle length
    const adjustedDay = ((cycleDay - 1) % cycleLength) + 1;
    const phase = getPhase(adjustedDay, cycleLength);
    return {
      date,
      cycleDay: adjustedDay,
      phase,
      profile: getMoodProfile(phase)
    };
  });
}

/**
 * Get a random notification message for a phase
 */
export function getNotifMessage(phase) {
  const profile = PHASE_PROFILES[phase];
  if (!profile) return { title: '🌙 LunaSync', body: 'Check today\'s forecast.' };
  const idx = Math.floor(Math.random() * profile.notifPhrases.length);
  const emoji = profile.notifEmojis[idx % profile.notifEmojis.length];
  return {
    title: `${emoji} Day forecast — ${profile.label}`,
    body: profile.notifPhrases[idx]
  };
}

export { PHASE_PROFILES };
