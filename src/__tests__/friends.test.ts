import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as fsMock from 'fs/promises';

// fs/promises をモック（vi.mock は自動的にファイル先頭に巻き上げられる）
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

import { getAllFriends, getFriendById, createFriend, updateFriend, deleteFriend } from '../friends';
import type { Friend, FriendInput } from '../types';

// vi.mocked で TypeScript の型補完を得る
const mkdir    = vi.mocked(fsMock.mkdir);
const access   = vi.mocked(fsMock.access);
const readFile = vi.mocked(fsMock.readFile);
const writeFile = vi.mocked(fsMock.writeFile);

// テスト用フィクスチャ
const FRIEND_A: Friend = {
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  name: '山田 太郎',
  nickname: 'たろう',
  birthdate: '2000-04-01',
  blood_type: 'A',
  tagline: 'よろしくお願いします',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const FRIEND_B: Friend = {
  id: 'bbbbbbbb-0000-4000-8000-000000000002',
  name: '鈴木 花子',
  nickname: 'はなちゃん',
  birthdate: '1999-08-15',
  blood_type: 'O',
  tagline: 'よろしくです！',
  created_at: '2026-01-02T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
};

const INPUT: FriendInput = {
  name: '新規 ユーザー',
  nickname: 'しんき',
  birthdate: '2001-12-31',
  blood_type: 'B',
  tagline: 'はじめまして',
  favorite_food: 'ピザ',
};

beforeEach(() => {
  vi.resetAllMocks();
  // initStorage: mkdir と access は常に成功するデフォルト
  mkdir.mockResolvedValue(undefined as never);
  access.mockResolvedValue(undefined as never);
  writeFile.mockResolvedValue(undefined as never);
});

// ヘルパー：readFile がJSON文字列を返すよう設定
function setupData(friends: Friend[]) {
  readFile.mockResolvedValue(JSON.stringify(friends) as never);
}

// ===== getAllFriends =====
describe('getAllFriends', () => {
  it('データが空のとき空配列を返す', async () => {
    setupData([]);
    const result = await getAllFriends();
    expect(result).toEqual([]);
  });

  it('保存されている全トモダチを返す', async () => {
    setupData([FRIEND_A, FRIEND_B]);
    const result = await getAllFriends();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(FRIEND_A);
    expect(result[1]).toEqual(FRIEND_B);
  });

  it('ファイル読み込みエラー時は空配列を返す', async () => {
    readFile.mockRejectedValue(new Error('ENOENT') as never);
    const result = await getAllFriends();
    expect(result).toEqual([]);
  });
});

// ===== getFriendById =====
describe('getFriendById', () => {
  it('IDが一致するトモダチを返す', async () => {
    setupData([FRIEND_A, FRIEND_B]);
    const result = await getFriendById(FRIEND_A.id);
    expect(result).toEqual(FRIEND_A);
  });

  it('存在しないIDはnullを返す', async () => {
    setupData([FRIEND_A]);
    const result = await getFriendById('non-existent-id');
    expect(result).toBeNull();
  });

  it('データが空のときnullを返す', async () => {
    setupData([]);
    const result = await getFriendById(FRIEND_A.id);
    expect(result).toBeNull();
  });
});

// ===== createFriend =====
describe('createFriend', () => {
  it('入力フィールドをすべて持つFriendを返す', async () => {
    setupData([]);
    const result = await createFriend(INPUT);
    expect(result.name).toBe(INPUT.name);
    expect(result.nickname).toBe(INPUT.nickname);
    expect(result.birthdate).toBe(INPUT.birthdate);
    expect(result.blood_type).toBe(INPUT.blood_type);
    expect(result.tagline).toBe(INPUT.tagline);
    expect(result.favorite_food).toBe(INPUT.favorite_food);
  });

  it('UUIDとタイムスタンプが自動付与される', async () => {
    setupData([]);
    const before = new Date().toISOString();
    const result = await createFriend(INPUT);
    const after = new Date().toISOString();

    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(result.created_at >= before).toBe(true);
    expect(result.created_at <= after).toBe(true);
    expect(result.created_at).toBe(result.updated_at);
  });

  it('既存データに追記してwriteFileを呼ぶ', async () => {
    setupData([FRIEND_A]);
    const result = await createFriend(INPUT);

    expect(writeFile).toHaveBeenCalledOnce();
    const written: Friend[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string);
    expect(written).toHaveLength(2);
    expect(written[0]).toEqual(FRIEND_A);
    expect(written[1].id).toBe(result.id);
  });

  it('複数回呼ぶとそれぞれ異なるIDが発行される', async () => {
    setupData([]);
    readFile.mockResolvedValue('[]' as never);
    const [a, b] = await Promise.all([createFriend(INPUT), createFriend(INPUT)]);
    expect(a.id).not.toBe(b.id);
  });
});

// ===== updateFriend =====
describe('updateFriend', () => {
  it('IDが一致するトモダチを更新して返す', async () => {
    setupData([FRIEND_A, FRIEND_B]);
    const patch: FriendInput = { ...INPUT, name: '山田 次郎', nickname: 'じろう' };

    const result = await updateFriend(FRIEND_A.id, patch);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('山田 次郎');
    expect(result!.nickname).toBe('じろう');
    expect(result!.id).toBe(FRIEND_A.id);
  });

  it('updated_at が created_at より新しくなる（または同じ秒内でも上書きされる）', async () => {
    setupData([FRIEND_A]);
    const result = await updateFriend(FRIEND_A.id, INPUT);
    expect(result).not.toBeNull();
    // updated_at はテスト実行時刻になるので、元の固定値より新しい
    expect(result!.updated_at >= FRIEND_A.updated_at).toBe(true);
  });

  it('更新対象以外のトモダチはそのまま保持される', async () => {
    setupData([FRIEND_A, FRIEND_B]);
    await updateFriend(FRIEND_A.id, INPUT);

    const written: Friend[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string);
    const untouched = written.find(f => f.id === FRIEND_B.id);
    expect(untouched).toEqual(FRIEND_B);
  });

  it('存在しないIDはnullを返し、writeFileを呼ばない', async () => {
    setupData([FRIEND_A]);
    const result = await updateFriend('non-existent-id', INPUT);
    expect(result).toBeNull();
    expect(writeFile).not.toHaveBeenCalled();
  });
});

// ===== deleteFriend =====
describe('deleteFriend', () => {
  it('IDが一致するトモダチを削除してtrueを返す', async () => {
    setupData([FRIEND_A, FRIEND_B]);
    const result = await deleteFriend(FRIEND_A.id);
    expect(result).toBe(true);
  });

  it('削除後のリストから対象が消える', async () => {
    setupData([FRIEND_A, FRIEND_B]);
    await deleteFriend(FRIEND_A.id);

    const written: Friend[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string);
    expect(written).toHaveLength(1);
    expect(written[0].id).toBe(FRIEND_B.id);
  });

  it('存在しないIDはfalseを返し、writeFileを呼ばない', async () => {
    setupData([FRIEND_A]);
    const result = await deleteFriend('non-existent-id');
    expect(result).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('1件しかない状態で削除すると空配列をwriteする', async () => {
    setupData([FRIEND_A]);
    await deleteFriend(FRIEND_A.id);

    const written: Friend[] = JSON.parse(vi.mocked(writeFile).mock.calls[0][1] as string);
    expect(written).toEqual([]);
  });
});
