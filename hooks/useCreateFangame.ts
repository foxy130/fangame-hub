import { useState } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToImgBB } from '../utils/uploadImage';

export const CATEGORIAS = [
    'Terror',
    'Luta',
    'Guerra',
    'Horror',
    'Infantil',
    'Simulação',
    'Esportes',
    'RPG',
    'Aventura',
] as const;

export type Categoria = typeof CATEGORIAS[number];

export interface RequisitosSistema {
    osMinimo: string;
    processadorMinimo: string;
    memoriaMinima: string;
    armazenamentoMinimo: string;
    osRecomendado: string;
    processadorRecomendado: string;
    memoriaRecomendada: string;
    armazenamentoRecomendado: string;
}

export interface FangameLink {
    titulo: string;
    url: string;
}

export function useCreateFangame() {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState<Categoria | ''>('');
    const [imagens, setImagens] = useState<string[]>([]);
    const [carregando, setCarregando] = useState(false);

    const [links, setLinks] = useState<FangameLink[]>([]);
    const [mostrarLinks, setMostrarLinks] = useState(false);

    const [requisitos, setRequisitos] = useState<RequisitosSistema>({
        osMinimo: '',
        processadorMinimo: '',
        memoriaMinima: '',
        armazenamentoMinimo: '',
        osRecomendado: '',
        processadorRecomendado: '',
        memoriaRecomendada: '',
        armazenamentoRecomendado: '',
    });

    const [mostrarRequisitos, setMostrarRequisitos] = useState(false);

    const atualizarRequisito = (campo: keyof RequisitosSistema, valor: string) => {
        setRequisitos(prev => ({ ...prev, [campo]: valor }));
    };

    const adicionarLink = () => {
        if (links.length >= 3) {
            Alert.alert('Limite atingido', 'Você pode adicionar no máximo 3 links.');
            return;
        }
        setLinks([...links, { titulo: '', url: '' }]);
    };

    const atualizarLink = (index: number, campo: 'titulo' | 'url', valor: string) => {
        const novosLinks = [...links];
        novosLinks[index] = { ...novosLinks[index], [campo]: valor };
        setLinks(novosLinks);
    };

    const removerLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index));
    };

    const adicionarImagem = async (origem: 'camera' | 'galeria') => {
        if (imagens.length >= 3) {
            Alert.alert('Limite atingido', 'Você pode adicionar no máximo 3 imagens.');
            return;
        }
        try {
            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            };
            let result;
            if (origem === 'camera') {
                const perm = await ImagePicker.requestCameraPermissionsAsync();
                if (!perm.granted) {
                    Alert.alert('Permissão necessária', 'Precisa de permissão para usar a câmera.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync(options);
            } else {
                const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!perm.granted) {
                    Alert.alert('Permissão necessária', 'Precisa de permissão para acessar a galeria.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync(options);
            }
            if (!result.canceled && result.assets[0].base64) {
                setImagens((prev) => [...prev, result.assets[0].base64!]);
            }
        } catch (error) {
            console.error('Erro ao escolher imagem:', error);
        }
    };

    const removerImagem = (index: number) => {
        setImagens((prev) => prev.filter((_, i) => i !== index));
    };

    const criarFangame = async () => {
        if (carregando) return;

        if (nome.trim() === '') {
            Alert.alert('Digite um nome para o fangame');
            return;
        }
        if (!categoria) {
            Alert.alert('Selecione uma categoria');
            return;
        }

        const linksValidos = links.filter(l => l.url.trim() !== '');
        for (const link of linksValidos) {
            if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
                Alert.alert('Link inválido', `O link "${link.titulo || link.url}" deve começar com http:// ou https://`);
                return;
            }
        }

        setCarregando(true);
        try {
            const urls: string[] = [];
            for (const base64 of imagens) {
                const url = await uploadImageToImgBB(base64);
                urls.push(url);
            }

            await addDoc(collection(db, 'fangames'), {
                nome,
                descricao,
                categoria,
                imagens: urls,
                likes: [],
                dislikes: [],
                userId: auth.currentUser?.uid,
                userEmail: auth.currentUser?.email || 'Usuário',
                createdAt: new Date().toISOString(),
                comentariosCount: 0,
                visualizacoes: 0,
                links: linksValidos.map(l => ({
                    titulo: l.titulo.trim() || l.url.trim(),
                    url: l.url.trim(),
                })),
                requisitos: {
                    minimo: {
                        os: requisitos.osMinimo,
                        processador: requisitos.processadorMinimo,
                        memoria: requisitos.memoriaMinima,
                        armazenamento: requisitos.armazenamentoMinimo,
                    },
                    recomendado: {
                        os: requisitos.osRecomendado,
                        processador: requisitos.processadorRecomendado,
                        memoria: requisitos.memoriaRecomendada,
                        armazenamento: requisitos.armazenamentoRecomendado,
                    },
                },
            });

            Alert.alert('Sucesso', 'Fangame criado!');
            setNome('');
            setDescricao('');
            setCategoria('');
            setImagens([]);
            setLinks([]);
            setRequisitos({
                osMinimo: '',
                processadorMinimo: '',
                memoriaMinima: '',
                armazenamentoMinimo: '',
                osRecomendado: '',
                processadorRecomendado: '',
                memoriaRecomendada: '',
                armazenamentoRecomendado: '',
            });
            setMostrarRequisitos(false);
            setMostrarLinks(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível criar o fangame.');
        } finally {
            setCarregando(false);
        }
    };

    return {
        nome,
        setNome,
        descricao,
        setDescricao,
        categoria,
        setCategoria,
        imagens,
        adicionarImagem,
        removerImagem,
        criarFangame,
        carregando,
        requisitos,
        atualizarRequisito,
        mostrarRequisitos,
        setMostrarRequisitos,
        links,
        adicionarLink,
        atualizarLink,
        removerLink,
        mostrarLinks,
        setMostrarLinks,
    };
}