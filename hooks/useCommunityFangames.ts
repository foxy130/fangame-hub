
import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  where,
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { Categoria } from './useCreateFangame';
import { Fangame } from '../types';

export function useCommunityFangames() {
    const [fangames, setFangames] = useState<Fangame[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriaFiltro, setCategoriaFiltro] = useState<Categoria | ''>('');
    const [ordenacao, setOrdenacao] = useState<'likes' | 'comentarios' | 'visualizacoes'>('likes');
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [carregandoMais, setCarregandoMais] = useState(false);

    const fangamesRef = collection(db, 'fangames');

    const ordenarFangames = useCallback((lista: Fangame[]) => {
        const sorted = [...lista];
        if (ordenacao === 'likes') {
            sorted.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        } else if (ordenacao === 'comentarios') {
            sorted.sort((a, b) => (b.comentariosCount || 0) - (a.comentariosCount || 0));
        } else if (ordenacao === 'visualizacoes') {
            sorted.sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
        }
        return sorted;
    }, [ordenacao]);

    const recarregar = useCallback(async () => {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
        
        try {
            let q = query(fangamesRef, orderBy('createdAt', 'desc'), limit(20));
            
            if (categoriaFiltro) {
                q = query(
                    fangamesRef,
                    where('categoria', '==', categoriaFiltro),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
            }

            const snapshot = await getDocs(q);
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Fangame[];
            
            const sortedList = ordenarFangames(list);
            setFangames(sortedList);
            setLoading(false);
            
            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            }
            setHasMore(snapshot.docs.length === 20);
        } catch (error) {
            console.error('Erro ao recarregar fangames:', error);
            setLoading(false);
        }
    }, [categoriaFiltro, ordenacao, fangamesRef, ordenarFangames]);

    useEffect(() => {
        setLoading(true);
        
        let q = query(fangamesRef, orderBy('createdAt', 'desc'), limit(20));
        
        if (categoriaFiltro) {
            q = query(
                fangamesRef,
                where('categoria', '==', categoriaFiltro),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Fangame[];
            
            const sortedList = ordenarFangames(list);
            setFangames(sortedList);
            setLoading(false);
            
            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            }
            setHasMore(snapshot.docs.length === 20);
        }, (error) => {
            console.error('Erro no listener:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [categoriaFiltro, ordenacao]);

    const carregarMais = async () => {
        if (!hasMore || carregandoMais || loading) return;

        setCarregandoMais(true);
        
        try {
            let q = query(
                fangamesRef,
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(20)
            );
            
            if (categoriaFiltro) {
                q = query(
                    fangamesRef,
                    where('categoria', '==', categoriaFiltro),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(20)
                );
            }

            const snapshot = await getDocs(q);
            const newFangames = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Fangame[];

            const sortedNew = ordenarFangames(newFangames);

            setFangames((prev) => {
                const combined = [...prev, ...sortedNew];
                const unique = combined.filter((item, index, self) => 
                    index === self.findIndex((t) => t.id === item.id)
                );
                return unique;
            });
            
            setHasMore(snapshot.docs.length === 20);
            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            }
        } catch (error) {
            console.error('Erro ao carregar mais fangames:', error);
        } finally {
            setCarregandoMais(false);
        }
    };

    const atualizarFangame = useCallback(async (fangameId: string) => {
        try {
            const docRef = doc(db, 'fangames', fangameId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFangames((prev) => {
                    const index = prev.findIndex(f => f.id === fangameId);
                    if (index === -1) return prev;
                    const updated = [...prev];
                    updated[index] = { id: fangameId, ...data } as Fangame;
                    return ordenarFangames(updated);
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao atualizar fangame:', error);
            return false;
        }
    }, [ordenarFangames]);

    // 🔥 INCREMENTAR VISUALIZAÇÃO (único por usuário)
    const incrementarVisualizacao = useCallback(async (fangameId: string) => {
        if (!auth.currentUser) return;
        
        const userId = auth.currentUser.uid;
        
        try {
            const fangameRef = doc(db, 'fangames', fangameId);
            const fangameDoc = await getDoc(fangameRef);
            
            if (!fangameDoc.exists()) return;
            
            const data = fangameDoc.data();
            const visualizacoesPorUsuario = data.visualizacoesPorUsuario || {};
            
            // Se o usuário já visualizou, não incrementar
            if (visualizacoesPorUsuario[userId]) {
                return;
            }
            
            // Incrementar visualização
            await updateDoc(fangameRef, {
                visualizacoes: increment(1),
                [`visualizacoesPorUsuario.${userId}`]: true,
            });
        } catch (error) {
            console.error('Erro ao incrementar visualização:', error);
        }
    }, []);

    return {
        fangames,
        loading,
        categoriaFiltro,
        setCategoriaFiltro,
        ordenacao,
        setOrdenacao,
        carregarMais,
        hasMore,
        recarregar,
        atualizarFangame,
        incrementarVisualizacao,
    };
}