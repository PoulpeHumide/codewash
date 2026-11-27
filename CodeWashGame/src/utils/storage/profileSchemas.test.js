import { describe, expect, it } from 'vitest';
import { THEMES_LIST } from '../../constants/gameData';
import { getDefaultStats } from '../achievementUtils';
import { getSavedSkillsData, isRecord, isValidTheme, normalizeSavedStats } from './profileSchemas';

describe('saved profile schemas', () => {
    it('recognizes plain records and supported themes', () => {
        expect(isRecord({})).toBe(true);
        expect(isRecord(null)).toBe(false);
        expect(isRecord([])).toBe(false);
        expect(isRecord('skills')).toBe(false);

        THEMES_LIST.forEach(({ id }) => expect(isValidTheme(id)).toBe(true));
        expect(isValidTheme('unknown')).toBe(false);
        expect(isValidTheme(null)).toBe(false);
    });

    it('merges valid partial statistics with defaults and rejects invalid field types', () => {
        expect(normalizeSavedStats({ totalMobsDefeated: 4, extraStat: 'preserved' })).toEqual({
            ...getDefaultStats(),
            totalMobsDefeated: 4,
            extraStat: 'preserved',
        });
        expect(normalizeSavedStats({ uniqueMobsDefeated: ['zombie'] })).toMatchObject({
            uniqueMobsDefeated: ['zombie'],
        });
        expect(normalizeSavedStats(null)).toBeNull();
        expect(normalizeSavedStats({ uniqueMobsDefeated: 'zombie' })).toBeNull();
        expect(normalizeSavedStats({ totalMobsDefeated: 'many' })).toBeNull();
        expect(normalizeSavedStats({ totalMobsDefeated: Number.POSITIVE_INFINITY })).toBeNull();
        expect(normalizeSavedStats({ totalMobsDefeated: -1 })).toBeNull();
    });

    it('reads nested and legacy skill data only from record-shaped saves', () => {
        const nestedSkills = { math: { level: 4 } };
        expect(getSavedSkillsData({ skills: nestedSkills })).toBe(nestedSkills);
        expect(getSavedSkillsData(nestedSkills)).toBe(nestedSkills);
        expect(getSavedSkillsData(null)).toBeNull();
        expect(getSavedSkillsData({ skills: [] })).toBeNull();
        expect(getSavedSkillsData({ skills: 7 })).toBeNull();
    });
});
