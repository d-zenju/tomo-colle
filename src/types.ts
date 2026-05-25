export interface Friend {
  id: string;
  name: string;
  nickname: string;
  birthdate: string; // YYYY-MM-DD
  blood_type: 'A' | 'B' | 'AB' | 'O';
  tagline: string;
  favorite_food?: string;
  favorite_thing?: string;
  hobby?: string;
  personality_type?: string;
  created_at: string;
  updated_at: string;
}

export type FriendInput = Omit<Friend, 'id' | 'created_at' | 'updated_at'>;

export interface PersonalityResult {
  personality_type: string;
  group: string;
  description: string;
}
