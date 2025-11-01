import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

interface GameState {
  characterName: string
  genre: string | null
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number
  gold: number
  inventory: string[]
  level: number
}

export interface SavedGame extends GameState {
  id: string;
  savedAt: any;
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>;
  gameLog: Array<{ type: 'system' | 'user' | 'assistant', content: string }>;
}

export const saveGame = async (
  gameState: GameState, 
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>,
  gameLog: Array<{ type: 'system' | 'user' | 'assistant', content: string }>,
  saveId?: string | null
): Promise<string> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  const id = saveId || `save_${Date.now()}`;
  const saveRef = doc(db, 'saves', userId, 'games', id);

  const saveData: SavedGame = {
    ...gameState,
    id,
    savedAt: serverTimestamp(),
    conversationHistory,
    gameLog,
  };

  await setDoc(saveRef, saveData);
  return id;
};

export const loadGame = async (saveId: string): Promise<SavedGame | null> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  const saveRef = doc(db, 'saves', userId, 'games', saveId);
  const saveDoc = await getDoc(saveRef);

  if (saveDoc.exists()) {
    return saveDoc.data() as SavedGame;
  }
  return null;
};

export const listSaves = async (): Promise<SavedGame[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  const savesRef = collection(db, 'saves', userId, 'games');
  const snapshot = await getDocs(savesRef);

  return snapshot.docs
    .map(doc => doc.data() as SavedGame)
    .sort((a, b) => {
      // Sort by savedAt, newest first
      const aTime = a.savedAt?.toMillis?.() || 0;
      const bTime = b.savedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
};

export const deleteSave = async (saveId: string): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  const saveRef = doc(db, 'saves', userId, 'games', saveId);
  await deleteDoc(saveRef);
};
