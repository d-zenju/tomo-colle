import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Friend, FriendInput } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'friends.json');

// 保存用ディレクトリとファイルの初期化確認
async function initStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Storage initialization failed:', error);
  }
}

export async function readFriends(): Promise<Friend[]> {
  await initStorage();
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data) as Friend[];
  } catch (error) {
    console.error('Failed to read friends data:', error);
    return [];
  }
}

export async function writeFriends(friends: Friend[]): Promise<void> {
  await initStorage();
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(friends, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write friends data:', error);
  }
}

// すべて取得
export async function getAllFriends(): Promise<Friend[]> {
  return readFriends();
}

// IDで1件取得
export async function getFriendById(id: string): Promise<Friend | null> {
  const friends = await readFriends();
  return friends.find(f => f.id === id) || null;
}

function pickFriendInput(input: FriendInput): FriendInput {
  const picked: FriendInput = {
    name: input.name,
    nickname: input.nickname,
    birthdate: input.birthdate,
    blood_type: input.blood_type,
    tagline: input.tagline,
  };
  if (input.favorite_food !== undefined) picked.favorite_food = input.favorite_food;
  if (input.favorite_thing !== undefined) picked.favorite_thing = input.favorite_thing;
  if (input.hobby !== undefined) picked.hobby = input.hobby;
  if (input.personality_type !== undefined) picked.personality_type = input.personality_type;
  return picked;
}

// 新規作成
export async function createFriend(input: FriendInput): Promise<Friend> {
  const friends = await readFriends();
  const now = new Date().toISOString();
  const safe = pickFriendInput(input);

  const newFriend: Friend = {
    id: crypto.randomUUID(),
    ...safe,
    created_at: now,
    updated_at: now
  };

  friends.push(newFriend);
  await writeFriends(friends);
  return newFriend;
}

// 更新
export async function updateFriend(id: string, input: FriendInput): Promise<Friend | null> {
  const friends = await readFriends();
  const idx = friends.findIndex(f => f.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const safe = pickFriendInput(input);
  const updatedFriend: Friend = {
    ...friends[idx],
    ...safe,
    updated_at: now
  };

  friends[idx] = updatedFriend;
  await writeFriends(friends);
  return updatedFriend;
}

// 削除
export async function deleteFriend(id: string): Promise<boolean> {
  const friends = await readFriends();
  const idx = friends.findIndex(f => f.id === id);
  if (idx === -1) return false;

  friends.splice(idx, 1);
  await writeFriends(friends);
  return true;
}
