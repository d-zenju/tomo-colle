import { vi, describe, it, expect, beforeEach } from 'vitest';

// serve-static は公開ディレクトリへのアクセスが不要なため、テスト内では素通りにする
vi.mock('@hono/node-server/serve-static', () => ({
  serveStatic: () => (_c: unknown, next: () => Promise<void>) => next(),
}));

// friends モジュールをモックして DB/ファイルアクセスを排除
vi.mock('../friends', () => ({
  getAllFriends: vi.fn(),
  getFriendById: vi.fn(),
  createFriend: vi.fn(),
  updateFriend: vi.fn(),
  deleteFriend: vi.fn(),
}));

import { app } from '../app';
import * as friendsMod from '../friends';
import type { Friend } from '../types';

const getAllFriends  = vi.mocked(friendsMod.getAllFriends);
const getFriendById = vi.mocked(friendsMod.getFriendById);
const createFriend  = vi.mocked(friendsMod.createFriend);
const updateFriend  = vi.mocked(friendsMod.updateFriend);
const deleteFriend  = vi.mocked(friendsMod.deleteFriend);

// テスト用フィクスチャ
const FRIEND: Friend = {
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  name: '山田 太郎',
  nickname: 'たろう',
  birthdate: '2000-04-01',
  blood_type: 'A',
  tagline: 'よろしくお願いします',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const VALID_INPUT = {
  name: '山田 太郎',
  nickname: 'たろう',
  birthdate: '2000-04-01',
  blood_type: 'A',
  tagline: 'よろしくお願いします',
};

// JSON POST ヘルパー
function post(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function put(path: string, body: unknown) {
  return app.request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ===== GET /api/friends =====
describe('GET /api/friends', () => {
  it('200 と全件リストを返す', async () => {
    getAllFriends.mockResolvedValue([FRIEND]);
    const res = await app.request('/api/friends');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(FRIEND.id);
  });

  it('データが空でも 200 と空配列を返す', async () => {
    getAllFriends.mockResolvedValue([]);
    const res = await app.request('/api/friends');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [] });
  });

  it('取得失敗時は 500 を返す', async () => {
    getAllFriends.mockRejectedValue(new Error('DB error'));
    const res = await app.request('/api/friends');
    expect(res.status).toBe(500);
  });
});

// ===== GET /api/friends/:id =====
describe('GET /api/friends/:id', () => {
  it('存在するIDは 200 と該当データを返す', async () => {
    getFriendById.mockResolvedValue(FRIEND);
    const res = await app.request(`/api/friends/${FRIEND.id}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(FRIEND.id);
    expect(body.name).toBe(FRIEND.name);
  });

  it('存在しないIDは 404 を返す', async () => {
    getFriendById.mockResolvedValue(null);
    const res = await app.request('/api/friends/non-existent');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });
});

// ===== POST /api/friends =====
describe('POST /api/friends', () => {
  it('正常な入力で 201 と登録結果を返す', async () => {
    createFriend.mockResolvedValue(FRIEND);
    const res = await post('/api/friends', VALID_INPUT);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(FRIEND.id);
  });

  it('createFriend に正しい入力が渡される', async () => {
    createFriend.mockResolvedValue(FRIEND);
    await post('/api/friends', VALID_INPUT);
    expect(createFriend).toHaveBeenCalledWith(VALID_INPUT);
  });

  it.each([
    ['name が欠けている', { ...VALID_INPUT, name: '' }],
    ['nickname が欠けている', { ...VALID_INPUT, nickname: '' }],
    ['birthdate が欠けている', { ...VALID_INPUT, birthdate: '' }],
    ['blood_type が欠けている', { ...VALID_INPUT, blood_type: '' }],
    ['tagline が欠けている', { ...VALID_INPUT, tagline: '' }],
  ])('400: %s', async (_label, input) => {
    const res = await post('/api/friends', input);
    expect(res.status).toBe(400);
    expect(createFriend).not.toHaveBeenCalled();
  });

  it('血液型が不正な値のとき 400 を返す', async () => {
    const res = await post('/api/friends', { ...VALID_INPUT, blood_type: 'X' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/血液型/);
  });

  it('任意フィールド（favorite_food など）は送らなくても 201 になる', async () => {
    createFriend.mockResolvedValue(FRIEND);
    const res = await post('/api/friends', VALID_INPUT);
    expect(res.status).toBe(201);
  });
});

// ===== POST /api/friends - インジェクション防止 =====
describe('POST /api/friends - インジェクション防止', () => {
  it('リクエストボディに id が含まれていても createFriend に id は渡されない', async () => {
    createFriend.mockResolvedValue(FRIEND);
    await post('/api/friends', { ...VALID_INPUT, id: 'evil-id' });
    expect(createFriend).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'evil-id' })
    );
  });

  it('リクエストボディに未知フィールドが含まれていても createFriend に渡されない', async () => {
    createFriend.mockResolvedValue(FRIEND);
    await post('/api/friends', { ...VALID_INPUT, admin: true });
    expect(createFriend).not.toHaveBeenCalledWith(
      expect.objectContaining({ admin: true })
    );
  });
});

// ===== PUT /api/friends/:id =====
describe('PUT /api/friends/:id', () => {
  it('正常な入力で 200 と更新結果を返す', async () => {
    const updated = { ...FRIEND, name: '山田 次郎' };
    updateFriend.mockResolvedValue(updated);
    const res = await put(`/api/friends/${FRIEND.id}`, VALID_INPUT);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('山田 次郎');
  });

  it('存在しないIDは 404 を返す', async () => {
    updateFriend.mockResolvedValue(null);
    const res = await put('/api/friends/non-existent', VALID_INPUT);
    expect(res.status).toBe(404);
  });

  it('必須項目が欠けているとき 400 を返す', async () => {
    const res = await put(`/api/friends/${FRIEND.id}`, { ...VALID_INPUT, name: '' });
    expect(res.status).toBe(400);
    expect(updateFriend).not.toHaveBeenCalled();
  });

  it('血液型が不正な値のとき 400 を返す', async () => {
    const res = await put(`/api/friends/${FRIEND.id}`, { ...VALID_INPUT, blood_type: 'Z' });
    expect(res.status).toBe(400);
  });
});

// ===== PUT /api/friends/:id - インジェクション防止 =====
describe('PUT /api/friends/:id - インジェクション防止', () => {
  it('リクエストボディに id が含まれていても updateFriend に id は渡されない', async () => {
    updateFriend.mockResolvedValue(FRIEND);
    await put(`/api/friends/${FRIEND.id}`, { ...VALID_INPUT, id: 'evil-id' });
    expect(updateFriend).not.toHaveBeenCalledWith(
      FRIEND.id,
      expect.objectContaining({ id: 'evil-id' })
    );
  });

  it('リクエストボディに未知フィールドが含まれていても updateFriend に渡されない', async () => {
    updateFriend.mockResolvedValue(FRIEND);
    await put(`/api/friends/${FRIEND.id}`, { ...VALID_INPUT, admin: true });
    expect(updateFriend).not.toHaveBeenCalledWith(
      FRIEND.id,
      expect.objectContaining({ admin: true })
    );
  });
});

// ===== DELETE /api/friends/:id =====
describe('DELETE /api/friends/:id', () => {
  it('存在するIDは 204 を返す', async () => {
    deleteFriend.mockResolvedValue(true);
    const res = await app.request(`/api/friends/${FRIEND.id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('存在しないIDは 404 を返す', async () => {
    deleteFriend.mockResolvedValue(false);
    const res = await app.request('/api/friends/non-existent', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });

  it('削除時に正しいIDが渡される', async () => {
    deleteFriend.mockResolvedValue(true);
    await app.request(`/api/friends/${FRIEND.id}`, { method: 'DELETE' });
    expect(deleteFriend).toHaveBeenCalledWith(FRIEND.id);
  });
});

// ===== GET /api/personality =====
describe('GET /api/personality', () => {
  it('正常なパラメータで 200 と診断結果を返す', async () => {
    const res = await app.request('/api/personality?pace=1&sociability=1&focus=1&attitude=1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('personality_type');
    expect(body).toHaveProperty('group');
    expect(body).toHaveProperty('description');
  });

  it('診断結果が正しいタイプになる（全パラメータ低値 → まったり系）', async () => {
    const res = await app.request('/api/personality?pace=1&sociability=1&focus=1&attitude=1');
    const body = await res.json();
    expect(body.group).toBe('まったり系');
  });

  it('パラメータが欠けているとき 400 を返す', async () => {
    const res = await app.request('/api/personality?pace=1&sociability=1&focus=1');
    expect(res.status).toBe(400);
  });

  it.each([
    ['pace が 0（範囲外）', 'pace=0&sociability=1&focus=1&attitude=1'],
    ['pace が 6（範囲外）', 'pace=6&sociability=1&focus=1&attitude=1'],
    ['sociability が 0（範囲外）', 'pace=1&sociability=0&focus=1&attitude=1'],
    ['attitude が 6（範囲外）', 'pace=1&sociability=1&focus=1&attitude=6'],
  ])('400: %s', async (_label, query) => {
    const res = await app.request(`/api/personality?${query}`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  it('パラメータが数値でないとき 400 を返す', async () => {
    const res = await app.request('/api/personality?pace=foo&sociability=1&focus=1&attitude=1');
    expect(res.status).toBe(400);
  });

  it('境界値: 全パラメータ 5 でも 200 を返す', async () => {
    const res = await app.request('/api/personality?pace=5&sociability=5&focus=5&attitude=5');
    expect(res.status).toBe(200);
  });
});

// ===== CORS =====
describe('CORS ヘッダー', () => {
  it('OPTIONS プリフライトに 204 を返す', async () => {
    const res = await app.request('/api/friends', { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });

  it('レスポンスに Access-Control-Allow-Origin が含まれる', async () => {
    getAllFriends.mockResolvedValue([]);
    const res = await app.request('/api/friends');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
