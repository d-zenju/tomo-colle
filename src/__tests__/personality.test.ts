import { describe, it, expect } from 'vitest';
import { diagnose, PERSONALITY_TYPES } from '../personality';

// 境界値の定義：3未満 = "低", 3以上 = "高"
const LO = 1; // 明確な低値
const HI = 5; // 明確な高値
const BOUNDARY_LO = 2; // 閾値の直下
const BOUNDARY_HI = 3; // 閾値の直上（グループ切り替え点）

describe('diagnose — グループ判定（pace × sociability）', () => {
  it('pace<3 かつ sociability<3 → まったり系に振り分けられる', () => {
    const result = diagnose(BOUNDARY_LO, BOUNDARY_LO, LO, LO);
    expect(result.group).toBe('まったり系');
  });

  it('pace>=3 かつ sociability>=3 → エネルギッシュ系に振り分けられる', () => {
    const result = diagnose(BOUNDARY_HI, BOUNDARY_HI, LO, LO);
    expect(result.group).toBe('エネルギッシュ系');
  });

  it('pace>=3 かつ sociability<3 → インテリ系に振り分けられる', () => {
    const result = diagnose(BOUNDARY_HI, BOUNDARY_LO, HI, LO);
    expect(result.group).toBe('インテリ系');
  });

  it('pace<3 かつ sociability>=3 → フリーダム系に振り分けられる', () => {
    const result = diagnose(BOUNDARY_LO, BOUNDARY_HI, LO, LO);
    expect(result.group).toBe('フリーダム系');
  });

  it('pace=2 と pace=3 でグループが変わる（境界値）', () => {
    const slow = diagnose(2, 2, LO, LO);
    const fast = diagnose(3, 2, LO, LO);
    expect(slow.group).toBe('まったり系');
    expect(fast.group).toBe('インテリ系');
  });

  it('sociability=2 と sociability=3 でグループが変わる（境界値）', () => {
    const solo = diagnose(2, 2, LO, LO);
    const social = diagnose(2, 3, LO, LO);
    expect(solo.group).toBe('まったり系');
    expect(social.group).toBe('フリーダム系');
  });
});

describe('diagnose — 12タイプの判定', () => {
  // --- まったり系 (pace<3, sociability<3) ---
  it('ひだまりの居眠り職人: focus<3, attitude<3', () => {
    const result = diagnose(LO, LO, LO, LO);
    expect(result.personality_type).toBe('ひだまりの居眠り職人');
    expect(result.group).toBe('まったり系');
  });

  it('ほのぼの系聞き上手: focus>=3, attitude<3', () => {
    const result = diagnose(LO, LO, HI, LO);
    expect(result.personality_type).toBe('ほのぼの系聞き上手');
    expect(result.group).toBe('まったり系');
  });

  it('心優しきグリーンフィンガー: focus<3, attitude>=3', () => {
    const result = diagnose(LO, LO, LO, HI);
    expect(result.personality_type).toBe('心優しきグリーンフィンガー');
    expect(result.group).toBe('まったり系');
  });

  it('心優しきグリーンフィンガー: focus>=3, attitude>=3 でも同タイプ', () => {
    const result = diagnose(LO, LO, HI, HI);
    expect(result.personality_type).toBe('心優しきグリーンフィンガー');
  });

  // --- エネルギッシュ系 (pace>=3, sociability>=3) ---
  it('直感型スピードスター: focus<3, attitude<3', () => {
    const result = diagnose(HI, HI, LO, LO);
    expect(result.personality_type).toBe('直感型スピードスター');
    expect(result.group).toBe('エネルギッシュ系');
  });

  it('お祭り騒ぎの仕掛け人: focus<3, attitude>=3', () => {
    const result = diagnose(HI, HI, LO, HI);
    expect(result.personality_type).toBe('お祭り騒ぎの仕掛け人');
    expect(result.group).toBe('エネルギッシュ系');
  });

  it('涙もろきパッションリーダー: focus>=3, attitude<3', () => {
    const result = diagnose(HI, HI, HI, LO);
    expect(result.personality_type).toBe('涙もろきパッションリーダー');
    expect(result.group).toBe('エネルギッシュ系');
  });

  it('涙もろきパッションリーダー: focus>=3, attitude>=3 でも同タイプ', () => {
    const result = diagnose(HI, HI, HI, HI);
    expect(result.personality_type).toBe('涙もろきパッションリーダー');
  });

  // --- インテリ系 (pace>=3, sociability<3) ---
  it('ポーカーフェイスの戦略家: focus>=3, attitude<3', () => {
    const result = diagnose(HI, LO, HI, LO);
    expect(result.personality_type).toBe('ポーカーフェイスの戦略家');
    expect(result.group).toBe('インテリ系');
  });

  it('歩く知識の図書館: focus>=3, attitude>=3', () => {
    const result = diagnose(HI, LO, HI, HI);
    expect(result.personality_type).toBe('歩く知識の図書館');
    expect(result.group).toBe('インテリ系');
  });

  it('スマートな解決屋: focus<3', () => {
    const result = diagnose(HI, LO, LO, LO);
    expect(result.personality_type).toBe('スマートな解決屋');
    expect(result.group).toBe('インテリ系');
  });

  // --- フリーダム系 (pace<3, sociability>=3) ---
  it('神出鬼没のアイデアマン: focus<3, attitude<3', () => {
    const result = diagnose(LO, HI, LO, LO);
    expect(result.personality_type).toBe('神出鬼没のアイデアマン');
    expect(result.group).toBe('フリーダム系');
  });

  it('マイペースな芸術家: focus>=3', () => {
    const result = diagnose(LO, HI, HI, LO);
    expect(result.personality_type).toBe('マイペースな芸術家');
    expect(result.group).toBe('フリーダム系');
  });

  it('のほほん宇宙人: focus<3, attitude>=3', () => {
    const result = diagnose(LO, HI, LO, HI);
    expect(result.personality_type).toBe('のほほん宇宙人');
    expect(result.group).toBe('フリーダム系');
  });
});

describe('diagnose — レスポンス構造', () => {
  it('返り値に personality_type / group / description が含まれる', () => {
    const result = diagnose(LO, LO, LO, LO);
    expect(result).toHaveProperty('personality_type');
    expect(result).toHaveProperty('group');
    expect(result).toHaveProperty('description');
    expect(typeof result.personality_type).toBe('string');
    expect(typeof result.group).toBe('string');
    expect(typeof result.description).toBe('string');
  });

  it('description が空文字でない', () => {
    const result = diagnose(HI, HI, HI, HI);
    expect(result.description.length).toBeGreaterThan(0);
  });
});

describe('PERSONALITY_TYPES — 定数の整合性', () => {
  it('全12タイプが定義されている', () => {
    expect(Object.keys(PERSONALITY_TYPES)).toHaveLength(12);
  });

  it('各タイプが personality_type / group / description を持つ', () => {
    for (const [key, value] of Object.entries(PERSONALITY_TYPES)) {
      expect(value.personality_type).toBe(key);
      expect(value.group).toBeTruthy();
      expect(value.description).toBeTruthy();
    }
  });

  it('4グループそれぞれに3タイプずつ存在する', () => {
    const groups = Object.values(PERSONALITY_TYPES).map(t => t.group);
    const countByGroup = groups.reduce<Record<string, number>>((acc, g) => {
      acc[g] = (acc[g] ?? 0) + 1;
      return acc;
    }, {});
    expect(countByGroup['まったり系']).toBe(3);
    expect(countByGroup['エネルギッシュ系']).toBe(3);
    expect(countByGroup['インテリ系']).toBe(3);
    expect(countByGroup['フリーダム系']).toBe(3);
  });
});
