import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
  getDocs,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

export type TopicCategory = 'duvida' | 'ajuda' | 'discussao' | 'ideia' | 'geral';

export interface ForumTopic {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: TopicCategory;
  tags: string[];
  userId: string;
  userEmail: string;
  userPhoto: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likes: string[];
  comentariosCount: number;
  resolvido: boolean;
  anexos: string[];
  projetoId?: string;
}

export function useForumTopics() {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<TopicCategory | ''>('');
  const [busca, setBusca] = useState('');

  const topicsRef = collection(db, 'forumTopics');

  // Carregar tópicos iniciais
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(topicsRef, orderBy('createdAt', 'desc'), limit(10));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ForumTopic[];

        setTopics(list);
        setLoading(false);

        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }
        setHasMore(snapshot.docs.length === 10);
      },
      (error) => {
        console.error('Erro ao carregar tópicos:', error);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  // Carregar mais tópicos
  const carregarMais = async () => {
    if (!hasMore || !lastDoc || loading) return;

    try {
      const q = query(
        topicsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const newTopics = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ForumTopic[];

      setTopics((prev) => [...prev, ...newTopics]);
      setHasMore(snapshot.docs.length === 10);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error('Erro ao carregar mais tópicos:', error);
    }
  };

  // Buscar tópico específico
  const buscarTopico = async (topicId: string): Promise<ForumTopic | null> => {
    try {
      const docRef = doc(db, 'forumTopics', topicId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ForumTopic;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar tópico:', error);
      return null;
    }
  };

  // Criar novo tópico
  const criarTopico = async (
    titulo: string,
    conteudo: string,
    categoria: TopicCategory,
    anexos: string[] = [],
    projetoId?: string,
    tags: string[] = []
  ): Promise<boolean> => {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return false;
    }

    if (titulo.trim() === '' || conteudo.trim() === '') {
      Alert.alert('Erro', 'Preencha todos os campos');
      return false;
    }

    try {
      await addDoc(topicsRef, {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        categoria,
        tags,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || 'Usuário',
        userPhoto: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: [],
        comentariosCount: 0,
        resolvido: false,
        anexos,
        projetoId: projetoId || null,
      });

      Alert.alert('Sucesso', 'Tópico criado!');
      return true;
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      Alert.alert('Erro', 'Não foi possível criar o tópico');
      return false;
    }
  };

  // 🔥 EDITAR TÓPICO
  const editarTopico = async (
    topicId: string,
    novoTitulo: string,
    novoConteudo: string,
    novaCategoria: TopicCategory
  ): Promise<boolean> => {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return false;
    }

    if (novoTitulo.trim() === '' || novoConteudo.trim() === '') {
      Alert.alert('Atenção', 'Preencha título e conteúdo');
      return false;
    }

    if (novoTitulo.length < 5) {
      Alert.alert('Atenção', 'O título deve ter pelo menos 5 caracteres');
      return false;
    }

    if (novoConteudo.length < 10) {
      Alert.alert('Atenção', 'O conteúdo deve ter pelo menos 10 caracteres');
      return false;
    }

    try {
      const topicRef = doc(db, 'forumTopics', topicId);
      const topicDoc = await getDoc(topicRef);

      if (!topicDoc.exists()) {
        Alert.alert('Erro', 'Tópico não encontrado');
        return false;
      }

      // 🔥 Verificar se é o dono do tópico
      if (topicDoc.data().userId !== auth.currentUser.uid) {
        Alert.alert('Erro', 'Você não tem permissão para editar este tópico');
        return false;
      }

      await updateDoc(topicRef, {
        titulo: novoTitulo.trim(),
        conteudo: novoConteudo.trim(),
        categoria: novaCategoria,
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Sucesso', 'Tópico atualizado!');
      return true;
    } catch (error) {
      console.error('Erro ao editar tópico:', error);
      Alert.alert('Erro', 'Não foi possível editar o tópico');
      return false;
    }
  };

  // Curtir tópico
  const toggleLike = async (topicId: string) => {
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Faça login para curtir');
      return;
    }

    const userId = auth.currentUser.uid;
    const topicRef = doc(db, 'forumTopics', topicId);

    try {
      const topicDoc = await getDoc(topicRef);
      if (!topicDoc.exists()) return;

      const data = topicDoc.data();
      const likes = data.likes || [];

      if (likes.includes(userId)) {
        await updateDoc(topicRef, { likes: arrayRemove(userId) });
      } else {
        await updateDoc(topicRef, { likes: arrayUnion(userId) });
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
      Alert.alert('Erro', 'Não foi possível curtir o tópico');
    }
  };

  // Deletar tópico
  const deletarTopico = async (topicId: string): Promise<boolean> => {
    if (!auth.currentUser) return false;

    return new Promise((resolve) => {
      Alert.alert('Confirmar', 'Tem certeza que deseja excluir este tópico?', [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'forumTopics', topicId));
              Alert.alert('Sucesso', 'Tópico excluído');
              resolve(true);
            } catch (error) {
              console.error('Erro ao excluir tópico:', error);
              Alert.alert('Erro', 'Não foi possível excluir');
              resolve(false);
            }
          },
        },
      ]);
    });
  };

  return {
    topics,
    loading,
    hasMore,
    carregarMais,
    buscarTopico,
    criarTopico,
    editarTopico,
    toggleLike,
    deletarTopico,
    categoriaFiltro,
    setCategoriaFiltro,
    busca,
    setBusca,
  };
}