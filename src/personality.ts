import type { PersonalityResult } from './types';

export const PERSONALITY_TYPES: Record<string, PersonalityResult> = {
  // --- まったり系 ---
  'ひだまりの居眠り職人': {
    personality_type: 'ひだまりの居眠り職人',
    group: 'まったり系',
    description: 'どこでも寝られる。争いごとが嫌いで、平和と静けさをこよなく愛するタイプ。'
  },
  'ほのぼの系聞き上手': {
    personality_type: 'ほのぼの系聞き上手',
    group: 'まったり系',
    description: 'いつもニコニコと話を聞いてくれる。お茶と和菓子があればずっと喋っていられるタイプ。'
  },
  '心優しきグリーンフィンガー': {
    personality_type: '心優しきグリーンフィンガー',
    group: 'まったり系',
    description: '植物や動物と無意識に心を通わせる（と噂されている）おっとりしたタイプ。'
  },
  // --- エネルギッシュ系 ---
  '直感型スピードスター': {
    personality_type: '直感型スピードスター',
    group: 'エネルギッシュ系',
    description: '考える前に行動する。忘れ物が多いけれど、持ち前の圧倒的な明るさで乗り切るタイプ。'
  },
  'お祭り騒ぎの仕掛け人': {
    personality_type: 'お祭り騒ぎの仕掛け人',
    group: 'エネルギッシュ系',
    description: '楽しいイベントや人を巻き込むのが大好き。静かな場所や静寂が少し苦手なタイプ。'
  },
  '涙もろきパッションリーダー': {
    personality_type: '涙もろきパッションリーダー',
    group: 'エネルギッシュ系',
    description: '何事にも全力投球。友情に熱く、他人の幸せや悲しみに全力で涙を流せる熱いタイプ。'
  },
  // --- インテリ系 ---
  'ポーカーフェイスの戦略家': {
    personality_type: 'ポーカーフェイスの戦略家',
    group: 'インテリ系',
    description: '感情をあまり表に出さないが、頭の中は常に高速回転。たまに言うシュールなジョークが面白いタイプ。'
  },
  '歩く知識の図書館': {
    personality_type: '歩く知識の図書館',
    group: 'インテリ系',
    description: 'あらゆる雑学に精通する生きる辞書。聞かれたことは何でも答えるが、話がマニアックになりがちなタイプ。'
  },
  'スマートな解決屋': {
    personality_type: 'スマートな解決屋',
    group: 'インテリ系',
    description: 'トラブルが起きても決して動じず、最も効率的でスマートな解決策を瞬時に導き出すタイプ。'
  },
  // --- フリーダム系 ---
  '神出鬼没のアイデアマン': {
    personality_type: '神出鬼没のアイデアマン',
    group: 'フリーダム系',
    description: '誰も思いつかないような突飛で面白いアイデアを出す。気づくといなくなっている自由人タイプ。'
  },
  'マイペースな芸術家': {
    personality_type: 'マイペースな芸術家',
    group: 'フリーダム系',
    description: '独自の美学とこだわりを強く持っている。他人の目を一切気にせず、我が道を行くタイプ。'
  },
  'のほほん宇宙人': {
    personality_type: 'のほほん宇宙人',
    group: 'フリーダム系',
    description: '言言動が非常にシュールで謎に満ちているが、なぜかみんなから愛されてしまう不思議なタイプ。'
  }
};

export function diagnose(pace: number, sociability: number, focus: number, attitude: number): PersonalityResult {
  let typeKey = '';

  // 1. pace (行動の早さ) と sociability (社交性) で4大グループを判定
  if (pace < 3 && sociability < 3) {
    // 【まったり系】
    if (focus < 3 && attitude < 3) {
      typeKey = 'ひだまりの居眠り職人';
    } else if (focus >= 3 && attitude < 3) {
      typeKey = 'ほのぼの系聞き上手';
    } else {
      typeKey = '心優しきグリーンフィンガー';
    }
  } else if (pace >= 3 && sociability >= 3) {
    // 【エネルギッシュ系】
    if (focus < 3 && attitude < 3) {
      typeKey = '直感型スピードスター';
    } else if (focus < 3 && attitude >= 3) {
      typeKey = 'お祭り騒ぎの仕掛け人';
    } else {
      typeKey = '涙もろきパッションリーダー';
    }
  } else if (pace >= 3 && sociability < 3) {
    // 【インテリ系】
    if (focus >= 3 && attitude < 3) {
      typeKey = 'ポーカーフェイスの戦略家';
    } else if (focus >= 3 && attitude >= 3) {
      typeKey = '歩く知識の図書館';
    } else {
      typeKey = 'スマートな解決屋';
    }
  } else {
    // 【フリーダム系】
    if (focus < 3 && attitude < 3) {
      typeKey = '神出鬼没のアイデアマン';
    } else if (focus >= 3) {
      typeKey = 'マイペースな芸術家';
    } else {
      typeKey = 'のほほん宇宙人';
    }
  }

  return PERSONALITY_TYPES[typeKey] || PERSONALITY_TYPES['のほほん宇宙人'];
}
