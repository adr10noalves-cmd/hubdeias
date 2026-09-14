import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { IAItem } from '../types';
import { initialIAs } from '../data/initialIAs';

const COLLECTION_NAME = 'ias';

/**
 * Remove valores undefined de objetos para conformidade estrita com o Firestore.
 */
function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Carrega a lista completa de IAs do Firestore.
 * Se a coleção estiver vazia, popula automaticamente com as IAs iniciais (seed).
 */
export async function getIAsFromFirestore(): Promise<IAItem[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      console.log('[Firestore] Coleção vazia. Inicializando banco com as IAs iniciais...');
      await seedInitialIAs(initialIAs);
      return initialIAs;
    }

    const items: IAItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        ...data,
        id: Number(data.id || docSnap.id),
      } as IAItem);
    });

    // Ordenar por ID crescente para manter estabilidade
    items.sort((a, b) => a.id - b.id);
    return items;
  } catch (err) {
    console.error('[Firestore getIAs Error]:', err);
    throw err;
  }
}

/**
 * Insere ou atualiza uma IA no Firestore.
 */
export async function saveIAToFirestore(item: IAItem): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, String(item.id));
    const cleanData = cleanFirestoreData({
      ...item,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error(`[Firestore saveIA Error id=${item.id}]:`, err);
    throw err;
  }
}

/**
 * Remove uma IA do Firestore pelo ID.
 */
export async function deleteIAFromFirestore(id: number): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, String(id));
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`[Firestore deleteIA Error id=${id}]:`, err);
    throw err;
  }
}

/**
 * Popula ou reseta o banco de dados com uma lista de IAs (Seed / Reset).
 */
export async function seedInitialIAs(items: IAItem[]): Promise<void> {
  try {
    // Processar em lotes de 500 (limite do writeBatch do Firestore)
    const BATCH_SIZE = 400;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((item) => {
        const docRef = doc(db, COLLECTION_NAME, String(item.id));
        const clean = cleanFirestoreData({
          ...item,
          updatedAt: new Date().toISOString(),
        });
        batch.set(docRef, clean, { merge: true });
      });

      await batch.commit();
    }
    console.log(`[Firestore] ${items.length} IAs sincronizadas com sucesso.`);
  } catch (err) {
    console.error('[Firestore Seed Error]:', err);
    throw err;
  }
}

/**
 * Escuta atualizações em tempo real do Firestore.
 */
export function subscribeToIAs(
  onUpdate: (items: IAItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: IAItem[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          ...data,
          id: Number(data.id || docSnap.id),
        } as IAItem);
      });
      items.sort((a, b) => a.id - b.id);
      onUpdate(items);
    },
    (error) => {
      console.warn('[Firestore Realtime Error]:', error);
      if (onError) onError(error);
    }
  );
}
