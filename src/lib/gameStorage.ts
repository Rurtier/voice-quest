import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { GameState } from '../App';

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
  saveId?: string
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

  return snapshot.docs.map(doc => doc.data() as SavedGame);
};

export const deleteSave = async (saveId: string): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  const saveRef = doc(db, 'saves', userId, 'games', saveId);
  await deleteDoc(saveRef);
};