// XP required to reach each level
export function xpForLevel(level) {
  return level * 100;
}

// Total XP needed to reach a level from scratch
export function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

// Get level from total XP
export function getLevelFromXp(xp) {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return level;
}

// Get XP progress within current level
export function getXpProgress(xp) {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return {
    level,
    currentXp: remaining,
    requiredXp: xpForLevel(level),
    percentage: Math.round((remaining / xpForLevel(level)) * 100)
  };
}