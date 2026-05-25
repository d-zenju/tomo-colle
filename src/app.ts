import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { diagnose } from './personality';
import {
  getAllFriends,
  getFriendById,
  createFriend,
  updateFriend,
  deleteFriend
} from './friends';
import type { FriendInput } from './types';

const app = new Hono();

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (c.req.method === 'OPTIONS') {
    return c.newResponse(null, 204);
  }
  await next();
});

// --- 性格診断 API ---
app.get('/api/personality', (c) => {
  const pace = parseInt(c.req.query('pace') || '');
  const sociability = parseInt(c.req.query('sociability') || '');
  const focus = parseInt(c.req.query('focus') || '');
  const attitude = parseInt(c.req.query('attitude') || '');

  if (
    isNaN(pace) || pace < 1 || pace > 5 ||
    isNaN(sociability) || sociability < 1 || sociability > 5 ||
    isNaN(focus) || focus < 1 || focus > 5 ||
    isNaN(attitude) || attitude < 1 || attitude > 5
  ) {
    return c.json({ message: 'リクエストパラメータが不正です。1〜5の数値で指定してください。' }, 400);
  }

  const result = diagnose(pace, sociability, focus, attitude);
  return c.json(result);
});

// --- 自己紹介 (Friend) API ---

app.get('/api/friends', async (c) => {
  try {
    const friends = await getAllFriends();
    return c.json(friends);
  } catch {
    return c.json({ message: 'データの取得に失敗しました。' }, 500);
  }
});

app.get('/api/friends/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const friend = await getFriendById(id);
    if (!friend) {
      return c.json({ message: '指定されたIDのトモダチが見つかりません。' }, 404);
    }
    return c.json(friend);
  } catch {
    return c.json({ message: 'データの取得に失敗しました。' }, 500);
  }
});

app.post('/api/friends', async (c) => {
  try {
    const body = await c.req.json<FriendInput>();

    if (!body.name || !body.nickname || !body.birthdate || !body.blood_type || !body.tagline) {
      return c.json({ message: '必須項目が不足しています。' }, 400);
    }
    if (!['A', 'B', 'AB', 'O'].includes(body.blood_type)) {
      return c.json({ message: '血液型は A, B, AB, O のいずれかで指定してください。' }, 400);
    }

    const newFriend = await createFriend(body);
    return c.json(newFriend, 201);
  } catch {
    return c.json({ message: 'データの登録に失敗しました。リクエスト内容を確認してください。' }, 400);
  }
});

app.put('/api/friends/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json<FriendInput>();

    if (!body.name || !body.nickname || !body.birthdate || !body.blood_type || !body.tagline) {
      return c.json({ message: '必須項目が不足しています。' }, 400);
    }
    if (!['A', 'B', 'AB', 'O'].includes(body.blood_type)) {
      return c.json({ message: '血液型は A, B, AB, O のいずれかで指定してください。' }, 400);
    }

    const updated = await updateFriend(id, body);
    if (!updated) {
      return c.json({ message: '指定されたIDのトモダチが見つかりません。' }, 404);
    }
    return c.json(updated);
  } catch {
    return c.json({ message: 'データの更新に失敗しました。リクエスト内容を確認してください。' }, 400);
  }
});

app.delete('/api/friends/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const success = await deleteFriend(id);
    if (!success) {
      return c.json({ message: '指定されたIDのトモダチが見つかりません。' }, 404);
    }
    return c.newResponse(null, 204);
  } catch {
    return c.json({ message: 'データの削除に失敗しました。' }, 500);
  }
});

// 静的ファイル（public/）を配信
app.use('/*', serveStatic({ root: './public' }));

export { app };
