// hooks/useFangameUpdates.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';

export interface FangameUpdate {
  id: string;
  titulo: string;
  conteudo: string;
  imagens: string[];
  userId: string;
  userEmail: string;
  createdAt: any;
  likes: string[];
}

export function useFangameUpdates(fangameId: string) {
  const [updates, setUpdates] = useState<FangameUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fangameId) {
      setLoading(false);
      return;
    }

    const updatesRef = collection(db, 'fangames', fangameId, 'updates');
    const q = query(updatesRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FangameUpdate[];
      setUpdates(list);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar updates:', error);
      setLoading(false);
    });

    return unsub;
  }, [fangameId]);

  // Criar nova atualização
  const criarUpdate = async (titulo: string, conteudo: string, imagens: string[] = []): Promise<boolean> => {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return false;
    }

    if (titulo.trim() === '' || conteudo.trim() === '') {
      Alert.alert('Erro', 'Preencha título e conteúdo');
      return false;
    }

    try {
      const updatesRef = collection(db, 'fangames', fangameId, 'updates');
      await addDoc(updatesRef, {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        imagens,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || 'Usuário',
        createdAt: serverTimestamp(),
        likes: [],
      });

      Alert.alert('Sucesso', 'Atualização publicada!');
      return true;
    } catch (error) {
      console.error('Erro ao criar update:', error);
      Alert.alert('Erro', 'Não foi possível publicar');
      return false;
    }
  };

  // Deletar update
  const deletarUpdate = async (updateId: string) => {
    Alert.alert(
      'Confirmar',
      'Deseja realmente excluir esta atualização?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'fangames', fangameId, 'updates', updateId));
            } catch (error) {
              console.error('Erro ao deletar:', error);
              Alert.alert('Erro', 'Não foi possível excluir');
            }
          },
        },
      ]
    );
  };

  // Like em update
  const toggleLikeUpdate = async (updateId: string, likes: string[] = []) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const updateRef = doc(db, 'fangames', fangameId, 'updates', updateId);

    try {
      if (likes.includes(userId)) {
        await updateDoc(updateRef, { likes: arrayRemove(userId) });
      } else {
        await updateDoc(updateRef, { likes: arrayUnion(userId) });
      }
    } catch (error) {
      console.error('Erro ao curtir update:', error);
    }
  };

  return {
    updates,
    loading,
    criarUpdate,
    deletarUpdate,
    toggleLikeUpdate,
  };
}