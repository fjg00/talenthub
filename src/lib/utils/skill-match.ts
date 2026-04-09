export interface SkillMatchResult {
  matchPct: number;
  matchedSkills: string[];
  missingSkills: string[];
}

const normalise = (s: string) => s.toLowerCase().trim();

export function computeSkillMatch(
  jobSkills: string[],
  candidateSkills: string[]
): SkillMatchResult {
  if (jobSkills.length === 0) {
    return { matchPct: 0, matchedSkills: [], missingSkills: [] };
  }

  const candidateSet = new Set(candidateSkills.map(normalise));
  const jobNormalised = jobSkills.map(normalise);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of jobNormalised) {
    if (candidateSet.has(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const matchPct = Math.round((matchedSkills.length / jobNormalised.length) * 100);

  return { matchPct, matchedSkills, missingSkills };
}
