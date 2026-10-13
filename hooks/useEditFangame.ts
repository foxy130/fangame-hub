import { useState } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToImgBB } from '../utils/uploadImage';
import { Categoria, RequisitosSistema, FangameLink } from './useCreateFangame';

export function useEditFangame(fangameId: string, initialData?: any) {
  const [nome, setNome] = useState(initialData?.nome || '');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [categoria, setCategoria] = useState<Categoria | ''>(initialData?.categoria || '');
  const [imagens, setImagens] = useState<string[]>(initialData?.imagens || []);
  const [novasImagens, setNovasImagens] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [links, setLinks] = useState<FangameLink[]>(initialData?.links || []);
  const [mostrarLinks, setMostrarLinks] = useState((initialData?.links?.length || 0) > 0);

  const [requisitos, setRequisitos] = useState<RequisitosSistema>({
    osMinimo: initialData?.requisitos?.minimo?.os || '',
    processadorMinimo: initialData?.requisitos?.minimo?.processador || '',
    memoriaMinima: initialData?.requisitos?.minimo?.memoria || '',
    armazenamentoMinimo: initialData?.requisitos?.minimo?.armazenamento || '',
    osRecomendado: initialData?.requisitos?.recomendado?.os || '',
    processadorRecomendado: initialData?.requisitos?.recomendado?.processador || '',
    memoriaRecomendada: initialData?.requisitos?.recomendado?.memoria || '',
    armazenamentoRecomendado: initialData?.requisitos?.recomendado?.armazenamento || '',
  });

  const [mostrarRequisitos, setMostrarRequisitos] = useState(
    !!(initialData?.requisitos?.minimo?.os || initialData?.requisitos?.recomendado?.os)
  );

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
    const totalImagens = imagens.length + novasImagens.length;
    if (totalImagens >= 3) {
      Alert.alert('Limite atingido', 'Você pode ter no máximo 3 imagens.');
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
        setNovasImagens((prev) => [...prev, result.assets[0].base64!]);
      }
    } catch (error) {
      console.error('Erro ao escolher imagem:', error);
    }
  };

  const removerImagemExistente = (url: string) => {
    Alert.alert('Remover imagem', 'Deseja remover esta imagem?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setImagens((prev) => prev.filter((img) => img !== url)) },
    ]);
  };

  const removerNovaImagem = (index: number) => {
    setNovasImagens((prev) => prev.filter((_, i) => i !== index));
  };

  const salvarEdicao = async (): Promise<boolean> => {
    if (carregando) return false;

    if (!auth.currentUser) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return false;
    }

    if (nome.trim() === '') {
      Alert.alert('Atenção', 'Digite um nome para o fangame');
      return false;
    }

    if (!categoria) {
      Alert.alert('Atenção', 'Selecione uma categoria');
      return false;
    }

    const linksValidos = links.filter(l => l.url.trim() !== '');
    for (const link of linksValidos) {
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        Alert.alert('Link inválido', `O link "${link.titulo || link.url}" deve começar com http:// ou https://`);
        return false;
      }
    }

    setCarregando(true);

    try {
      const fangameRef = doc(db, 'fangames', fangameId);
      const fangameDoc = await getDoc(fangameRef);

      if (!fangameDoc.exists()) {
        Alert.alert('Erro', 'Fangame não encontrado');
        return false;
      }

      if (fangameDoc.data().userId !== auth.currentUser.uid) {
        Alert.alert('Erro', 'Você não tem permissão para editar este fangame');
        return false;
      }

      const novasUrls: string[] = [];
      for (const base64 of novasImagens) {
        try {
          const url = await uploadImageToImgBB(base64);
          novasUrls.push(url);
        } catch (error) {
          console.error('Erro ao fazer upload:', error);
        }
      }

      const todasImagens = [...imagens, ...novasUrls];

      await updateDoc(fangameRef, {
        nome: nome.trim(),
        descricao: descricao.trim(),
        categoria,
        imagens: todasImagens,
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
        updatedAt: new Date().toISOString(),
      });

      setImagens(todasImagens);
      setNovasImagens([]);

      Alert.alert('Sucesso', 'Fangame atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao editar fangame:', error);
      Alert.alert('Erro', 'Não foi possível editar o fangame');
      return false;
    } finally {
      setCarregando(false);
    }
  };

  return {
    nome, setNome,
    descricao, setDescricao,
    categoria, setCategoria,
    imagens, novasImagens,
    adicionarImagem,
    removerImagemExistente,
    removerNovaImagem,
    salvarEdicao,
    carregando,
    totalImagens: imagens.length + novasImagens.length,
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