// Helper utility to calculate server-authoritative Guild Level and Perks

const XP_PER_LEVEL = 250;

/**
 * Calculate team guild level based on accumulated score
 * LVL 1: 0 - 249 XP
 * LVL 2: 250 - 499 XP (+10% Guild XP Multiplier)
 * LVL 3: 500 - 749 XP (Precision Radar)
 * LVL 4: 750 - 999 XP (+25m Proximity Sonar expansion)
 * LVL 5: 1000+ XP (Grandmaster Crest)
 */
const calculateGuildLevel = (score = 0) => {
  return Math.floor(Math.max(0, score) / XP_PER_LEVEL) + 1;
};

/**
 * Get active unlocked perks for a given guild score
 */
const getGuildPerks = (score = 0) => {
  const level = calculateGuildLevel(score);
  return {
    level,
    xpMultiplier: level >= 2 ? 1.1 : 1.0,
    bonusRadiusMeters: level >= 4 ? 25 : 0,
    hasTelemetrySync: level >= 1,
    hasXpBoost: level >= 2,
    hasPrecisionRadar: level >= 3,
    hasSonarBuff: level >= 4,
    hasGrandmasterCrest: level >= 5,
  };
};

/**
 * Apply level-gated XP multipliers to base points
 */
const calculateAwardedXp = (basePoints, currentScore = 0) => {
  const perks = getGuildPerks(currentScore);
  const finalPoints = Math.round(Number(basePoints) * perks.xpMultiplier);
  const bonusXp = finalPoints - Number(basePoints);

  return {
    basePoints: Number(basePoints),
    finalPoints,
    bonusXp,
    appliedMultiplier: perks.xpMultiplier,
    guildLevel: perks.level,
    hasBuff: bonusXp > 0,
  };
};

module.exports = {
  XP_PER_LEVEL,
  calculateGuildLevel,
  getGuildPerks,
  calculateAwardedXp,
};
