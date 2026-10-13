import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
  setDoc,
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import * as ImagePicker from 'expo-image-picker';

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export type Projeto = {
  id: string;
  nome: string;
  imagemUrl?: string;
};

export type Tarefa = {
  id: string;
  descricao: string;
  concluida: boolean;
  projetoId: string;
  imagemUrl?: string;
};

export type Fangame = {
  id: string;
  nome: string;
  descricao: string;
  imagens: string[];
  likes?: string[];
  dislikes?: string[];
  userId: string;
};

export interface UseHomeLogicReturn {
  novoProjeto: string;
  setNovoProjeto: (value: string) => void;
  projetos: Projeto[];
  projetoSelecionado: string | null;
  setProjetoSelecionado: (id: string | null) => void;
  novaTarefa: string;
  setNovaTarefa: (value: string) => void;
  tarefas: Tarefa[];
  fazendoUpload: boolean;
  fazendoUploadProjeto: boolean;
  adicionarProjeto: (base64Imagem?: string) => Promise<void>;
  escolherImagemProjeto: () => void;
  alterarImagemProjeto: (projetoId: string, imagemBase64?: string) => Promise<void>;
  escolherOpcaoImagemProjetoExistente: (projetoId: string) => void;
  deletarProjeto: (id: string) => Promise<void>;
  adicionarTarefa: () => Promise<void>;
  alternarStatusTarefa: (id: string, statusAtual: boolean) => Promise<void>;
  deletarTarefa: (id: string) => Promise<void>;
  escolherOpcaoImagem: (tarefaId: string) => void;
  processarImagem: (tarefaId: string, origem: 'camera' | 'galeria') => Promise<void>;
  deslogar: () => void;
  userEmail: string | null | undefined;

  // Fangames
  novoFangameNome: string;
  setNovoFangameNome: (value: string) => void;
  novoFangameDescricao: string;
  setNovoFangameDescricao: (value: string) => void;
  fangames: Fangame[];
  adicionarFangame: () => Promise<void>;
  deletarFangame: (id: string) => Promise<void>;
  adicionarImagemFangame: (fangameId: string) => void;
  fazerUploadFangame: boolean;

  // Perfil do usuário
  userPhoto: string | null;
  userUsername: string | null; // NOVO: nome de usuário
  uploadProfilePhoto: (base64: string) => Promise<void>;
  fazendoUploadFotoPerfil: boolean;
}

export function useHomeLogic(): UseHomeLogicReturn {
  const navigation = useNavigation<HomeScreenProp>();

  // Projetos
  const [novoProjeto, setNovoProjeto] = useState('');
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState<string | null>(null);
  const [fazendoUploadProjeto, setFazendoUploadProjeto] = useState(false);

  // Tarefas
  const [novaTarefa, setNovaTarefa] = useState('');
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  // Fangames
  const [novoFangameNome, setNovoFangameNome] = useState('');
  const [novoFangameDescricao, setNovoFangameDescricao] = useState('');
  const [fangames, setFangames] = useState<Fangame[]>([]);
  const [fazerUploadFangame, setFazerUploadFangame] = useState(false);

  // Perfil
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userUsername, setUserUsername] = useState<string | null>(null); // NOVO
  const [fazendoUploadFotoPerfil, setFazendoUploadFotoPerfil] = useState(false);

  const projetosCollectionRef = collection(db, 'Projetos');
  const tarefasCollectionRef = collection(db, 'tarefas');
  const fangamesCollectionRef = collection(db, 'fangames');

  // ============ PROJETOS ============
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const qProjetos = query(projetosCollectionRef, where('userId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(qProjetos, (snapshot) => {
      const listaProjetos = snapshot.docs.map((doc) => ({
        id: doc.id,
        nome: doc.data().nome,
        imagemUrl: doc.data().imagemUrl || null,
      }));
      setProjetos(listaProjetos);
    });
    return () => unsub();
  }, []);

  const adicionarProjeto = async (base64Imagem?: string) => {
    if (novoProjeto.trim() === '') {
      Alert.alert('Digite um nome para o projeto');
      return;
    }
    let imagemUrl = '';
    if (base64Imagem) {
      setFazendoUploadProjeto(true);
      try {
        const formData = new FormData();
        formData.append('image', base64Imagem);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=26d49e2bc40598c6501ff5949e5c66b1`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) imagemUrl = data.data.url;
        else Alert.alert('Erro', 'Falha ao enviar imagem para o projeto.');
      } catch (error) {
        console.error('Erro upload imagem projeto:', error);
      } finally {
        setFazendoUploadProjeto(false);
      }
    }
    try {
      await addDoc(projetosCollectionRef, {
        nome: novoProjeto,
        userId: auth.currentUser?.uid,
        imagemUrl: imagemUrl || null,
      });
      setNovoProjeto('');
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
    }
  };

  const escolherImagemProjeto = () => {
    Alert.alert('Foto do Projeto', 'Escolha uma imagem para este projeto', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar Foto', onPress: () => processarImagemProjeto('camera') },
      { text: 'Escolher da Galeria', onPress: () => processarImagemProjeto('galeria') },
    ]);
  };

  const processarImagemProjeto = async (origem: 'camera' | 'galeria') => {
    try {
      const opcoes: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      };
      if (origem === 'camera') {
        const permissao = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissao.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para usar a câmera.');
          return;
        }
      } else {
        const permissaoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissaoGaleria.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para acessar a galeria.');
          return;
        }
      }
      let result: ImagePicker.ImagePickerResult;
      if (origem === 'camera') result = await ImagePicker.launchCameraAsync(opcoes);
      else result = await ImagePicker.launchImageLibraryAsync(opcoes);
      if (!result.canceled && result.assets[0].base64) {
        await adicionarProjeto(result.assets[0].base64);
      } else {
        await adicionarProjeto();
      }
    } catch (error) {
      console.error('Erro ao escolher imagem do projeto:', error);
      Alert.alert('Erro', 'Falha ao processar imagem.');
    }
  };

  const alterarImagemProjeto = async (projetoId: string, imagemBase64?: string) => {
    if (!imagemBase64) return;
    setFazendoUploadProjeto(true);
    try {
      const formData = new FormData();
      formData.append('image', imagemBase64);
      const response = await fetch(`https://api.imgbb.com/1/upload?key= 26d49e2bc40598c6501ff5949e5c66b1`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        await updateDoc(doc(db, 'Projetos', projetoId), { imagemUrl: data.data.url });
        Alert.alert('Sucesso', 'Foto do projeto atualizada!');
      } else {
        Alert.alert('Erro', 'Falha ao enviar imagem.');
      }
    } catch (error) {
      console.error('Erro ao atualizar imagem do projeto:', error);
    } finally {
      setFazendoUploadProjeto(false);
    }
  };

  const escolherOpcaoImagemProjetoExistente = (projetoId: string) => {
    Alert.alert('Alterar Foto', 'Selecione uma nova imagem para o projeto', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar Foto', onPress: () => processarImagemProjetoExistente(projetoId, 'camera') },
      { text: 'Escolher da Galeria', onPress: () => processarImagemProjetoExistente(projetoId, 'galeria') },
    ]);
  };

  const processarImagemProjetoExistente = async (projetoId: string, origem: 'camera' | 'galeria') => {
    try {
      const opcoes: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      };
      if (origem === 'camera') {
        const permissao = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissao.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para usar a câmera.');
          return;
        }
      } else {
        const permissaoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissaoGaleria.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para acessar a galeria.');
          return;
        }
      }
      let result: ImagePicker.ImagePickerResult;
      if (origem === 'camera') result = await ImagePicker.launchCameraAsync(opcoes);
      else result = await ImagePicker.launchImageLibraryAsync(opcoes);
      if (!result.canceled && result.assets[0].base64) {
        await alterarImagemProjeto(projetoId, result.assets[0].base64);
      }
    } catch (error) {
      console.error('Erro ao escolher imagem para projeto existente:', error);
    }
  };

  const deletarProjeto = async (id: string) => {
    try {
      const qTarefasDoProjeto = query(tarefasCollectionRef, where('projetoId', '==', id));
      const snapshotTarefas = await getDocs(qTarefasDoProjeto);
      if (!snapshotTarefas.empty) {
        Alert.alert('Ação Bloqueada 🚫', 'Você não pode excluir este projeto porque ele ainda possui tarefas. Exclua as tarefas primeiro!');
        return;
      }
      await deleteDoc(doc(db, 'Projetos', id));
      if (projetoSelecionado === id) setProjetoSelecionado(null);
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
    }
  };

  // ============ TAREFAS ============
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const q = query(tarefasCollectionRef, where('userId', '==', auth.currentUser?.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const listaTarefas = snapshot.docs.map((doc) => ({
        id: doc.id,
        descricao: doc.data().descricao,
        concluida: doc.data().concluida || false,
        projetoId: doc.data().projetoId,
        imagemUrl: doc.data().imagemUrl,
      }));
      setTarefas(listaTarefas);
    });
    return () => unsub();
  }, []);

  const adicionarTarefa = async () => {
    if (novaTarefa.trim() === '') {
      Alert.alert('Digite uma tarefa');
      return;
    }
    try {
      await addDoc(tarefasCollectionRef, {
        descricao: novaTarefa,
        userId: auth.currentUser?.uid,
        concluida: false,
        projetoId: projetoSelecionado,
      });
      setNovaTarefa('');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const alternarStatusTarefa = async (id: string, statusAtual: boolean) => {
    try {
      await updateDoc(doc(db, 'tarefas', id), { concluida: !statusAtual });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const deletarTarefa = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tarefas', id));
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  const escolherOpcaoImagem = (tarefaId: string) => {
    Alert.alert('Anexar Imagem', 'De onde você quer pegar a foto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar Foto (Câmera)', onPress: () => processarImagem(tarefaId, 'camera') },
      { text: 'Abrir Galeria', onPress: () => processarImagem(tarefaId, 'galeria') },
    ]);
  };

  const processarImagem = async (tarefaId: string, origem: 'camera' | 'galeria') => {
    try {
      const opcoes: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      };
      if (origem === 'camera') {
        const permissao = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissao.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para usar a câmera.');
          return;
        }
      } else {
        const permissaoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissaoGaleria.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para acessar a galeria.');
          return;
        }
      }
      let result: ImagePicker.ImagePickerResult;
      if (origem === 'camera') result = await ImagePicker.launchCameraAsync(opcoes);
      else result = await ImagePicker.launchImageLibraryAsync(opcoes);
      if (!result.canceled && result.assets[0].base64) {
        setFazendoUpload(true);
        const formData = new FormData();
        formData.append('image', result.assets[0].base64);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=26d49e2bc40598c6501ff5949e5c66b1`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          const downloadUrl = data.data.url;
          await updateDoc(doc(db, 'tarefas', tarefaId), { imagemUrl: downloadUrl });
          Alert.alert('Sucesso', 'Imagem anexada com sucesso!');
        } else {
          Alert.alert('Erro', 'Falha ao enviar a imagem para o servidor.');
        }
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      Alert.alert('Erro', 'Falha ao anexar imagem.');
    } finally {
      setFazendoUpload(false);
    }
  };

  // ============ FANGAMES ============
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const qF = query(fangamesCollectionRef, where('userId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(qF, (snapshot) => {
      const listaFangames = snapshot.docs.map((doc) => ({
        id: doc.id,
        nome: doc.data().nome,
        descricao: doc.data().descricao,
        imagens: doc.data().imagens || [],
        likes: doc.data().likes || [],
        dislikes: doc.data().dislikes || [],
        userId: doc.data().userId,
      }));
      setFangames(listaFangames);
    });
    return () => unsub();
  }, []);

  const adicionarFangame = async () => {
    if (novoFangameNome.trim() === '') {
      Alert.alert('Digite um nome para o fangame');
      return;
    }
    try {
      await addDoc(fangamesCollectionRef, {
        nome: novoFangameNome,
        descricao: novoFangameDescricao,
        imagens: [],
        likes: [],
        dislikes: [],
        userId: auth.currentUser?.uid,
      });
      setNovoFangameNome('');
      setNovoFangameDescricao('');
    } catch (error) {
      console.error('Erro ao adicionar fangame:', error);
    }
  };

  const deletarFangame = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'fangames', id));
    } catch (error) {
      console.error('Erro ao deletar fangame:', error);
    }
  };

  const adicionarImagemFangame = (fangameId: string) => {
    Alert.alert('Adicionar Foto', 'Escolha a origem da imagem', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tirar Foto', onPress: () => uploadImagemFangame(fangameId, 'camera') },
      { text: 'Galeria', onPress: () => uploadImagemFangame(fangameId, 'galeria') },
    ]);
  };

  const uploadImagemFangame = async (fangameId: string, origem: 'camera' | 'galeria') => {
    try {
      const opcoes: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      };
      if (origem === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para usar a câmera.');
          return;
        }
      } else {
        const permGal = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permGal.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para acessar a galeria.');
          return;
        }
      }
      let result: ImagePicker.ImagePickerResult;
      if (origem === 'camera') result = await ImagePicker.launchCameraAsync(opcoes);
      else result = await ImagePicker.launchImageLibraryAsync(opcoes);
      if (!result.canceled && result.assets[0].base64) {
        setFazerUploadFangame(true);
        const formData = new FormData();
        formData.append('image', result.assets[0].base64);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=26d49e2bc40598c6501ff5949e5c66b1`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          const url = data.data.url;
          await updateDoc(doc(db, 'fangames', fangameId), {
            imagens: arrayUnion(url),
          });
          Alert.alert('Sucesso', 'Foto adicionada ao fangame!');
        } else {
          Alert.alert('Erro', 'Falha ao enviar imagem.');
        }
      }
    } catch (error) {
      console.error('Erro upload imagem fangame:', error);
      Alert.alert('Erro', 'Erro ao anexar imagem.');
    } finally {
      setFazerUploadFangame(false);
    }
  };

  // ============ PERFIL DO USUÁRIO ============
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserPhoto(data.photoURL || null);
        setUserUsername(data.username || null); // NOVO: buscar username
      } else {
        setUserPhoto(null);
        setUserUsername(null);
      }
    });
    return unsub;
  }, []);

  const uploadProfilePhoto = async (base64: string) => {
    if (!auth.currentUser?.uid) return;
    setFazendoUploadFotoPerfil(true);
    try {
      const formData = new FormData();
      formData.append('image', base64);
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=26d49e2bc40598c6501ff5949e5c66b1`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (data.success) {
        const url = data.data.url;
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, { photoURL: url }, { merge: true });
        setUserPhoto(url);
        Alert.alert('Sucesso', 'Foto de perfil atualizada!');
      } else {
        Alert.alert('Erro', 'Falha ao enviar a foto.');
      }
    } catch (error) {
      console.error('Erro upload foto perfil:', error);
      Alert.alert('Erro', 'Erro ao enviar foto.');
    } finally {
      setFazendoUploadFotoPerfil(false);
    }
  };

  // ============ LOGOUT ============
  const deslogar = () => {
    signOut(auth).then(() => navigation.replace('Login'));
  };

  return {
    // originais
    novoProjeto,
    setNovoProjeto,
    projetos,
    projetoSelecionado,
    setProjetoSelecionado,
    novaTarefa,
    setNovaTarefa,
    tarefas,
    fazendoUpload,
    fazendoUploadProjeto,
    adicionarProjeto,
    escolherImagemProjeto,
    alterarImagemProjeto,
    escolherOpcaoImagemProjetoExistente,
    deletarProjeto,
    adicionarTarefa,
    alternarStatusTarefa,
    deletarTarefa,
    escolherOpcaoImagem,
    processarImagem,
    deslogar,
    userEmail: auth.currentUser?.email,
    // fangames
    novoFangameNome,
    setNovoFangameNome,
    novoFangameDescricao,
    setNovoFangameDescricao,
    fangames,
    adicionarFangame,
    deletarFangame,
    adicionarImagemFangame,
    fazerUploadFangame,
    // perfil
    userPhoto,
    userUsername, // NOVO
    uploadProfilePhoto,
    fazendoUploadFotoPerfil,
  };
}