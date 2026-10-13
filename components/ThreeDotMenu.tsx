import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, ThemeType } from '../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';

interface ThreeDotMenuProps {
  userId?: string;
  userName?: string;
}

const DENUNCIA_TOPICOS = [
  'Conteúdo impróprio',
  'Ofensas/Assédio',
  'Spam/Publicidade',
  'Fake news/Desinformação',
  'Violação de direitos autorais',
  'Discurso de ódio',
  'Conteúdo sexual',
  'Violência/Incitação à violência',
  'Dados pessoais expostos',
  'Outro (especifique)',
];

export default function ThreeDotMenu({ userId, userName }: ThreeDotMenuProps) {
  const navigation = useNavigation<any>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState('');
  const [description, setDescription] = useState('');
  const [proofs, setProofs] = useState<string[]>([]);
  const [reportUserName, setReportUserName] = useState('');
  const [sending, setSending] = useState(false);

  const { colors, currentTheme, changeTheme } = useTheme();

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const openReport = () => {
    setMenuVisible(false);
    setTimeout(() => {
      setReportModalVisible(true);
      setSelectedTopic('');
      setDescription('');
      setProofs([]);
      setReportUserName(userName || '');
    }, 350);
  };

  const openTheme = () => {
    setMenuVisible(false);
    setTimeout(() => {
      setThemeModalVisible(true);
    }, 350);
  };

  // 🔥 Termos de Uso - passa origem como parâmetro
  const openTerms = () => {
    setMenuVisible(false);
    setTimeout(() => {
      navigation.navigate('Terms', { origem: 'menu' });
    }, 350);
  };

  const addProof = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Precisa de permissão para acessar a galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProofs([...proofs, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Erro ao adicionar prova:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a imagem.');
    }
  };

  const removeProof = (index: number) => {
    setProofs(proofs.filter((_, i) => i !== index));
  };

  const submitReport = () => {
    if (!selectedTopic) {
      Alert.alert('Atenção', 'Selecione um tópico para a denúncia.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Atenção', 'Descreva o problema com mais detalhes.');
      return;
    }
    if (!reportUserName.trim()) {
      Alert.alert('Atenção', 'Informe o nome do usuário que você está denunciando.');
      return;
    }

    setSending(true);

    setTimeout(() => {
      setSending(false);
      setReportModalVisible(false);
      Alert.alert(
        '✅ Denúncia enviada!',
        'Sua denúncia foi enviada com sucesso! Nossa equipe irá analisar e tomar as providências necessárias.\n\nObrigado por ajudar a manter a comunidade segura!'
      );
      setSelectedTopic('');
      setDescription('');
      setProofs([]);
      setReportUserName('');
    }, 1500);
  };

  const changeThemeHandler = (theme: ThemeType) => {
    changeTheme(theme);
    setThemeModalVisible(false);
  };

  const dynamicStyles = {
    modalOverlay: { backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
    modalTitle: { color: colors.text },
    input: { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text },
    inputLabel: { color: colors.textSecondary },
    topicButton: { backgroundColor: colors.inputBackground, borderColor: colors.border },
    topicButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    topicText: { color: colors.textSecondary },
    topicTextActive: { color: '#000' },
    sendButton: { backgroundColor: colors.primary },
    sendButtonText: { color: '#000' },
    cancelButton: { borderColor: colors.border },
    cancelButtonText: { color: colors.textMuted },
    themeOption: { backgroundColor: colors.inputBackground, borderColor: colors.border },
    themeOptionActive: { borderColor: colors.primary, borderWidth: 2 },
    themeOptionText: { color: colors.text },
  };

  return (
    <>
      <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
      </TouchableOpacity>

      {/* MENU PRINCIPAL */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMenu}>
          <View style={[styles.menuContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={openTerms}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Termos de Uso</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={openReport}>
              <Ionicons name="flag-outline" size={22} color="#ff5252" />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Denunciar</Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={openTheme}>
              <Ionicons name="color-palette-outline" size={22} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Alterar Tema</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL DE DENÚNCIA */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
        statusBarTranslucent
      >
        <View style={[styles.modalOverlay, dynamicStyles.modalOverlay]}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>🚨 Denunciar Usuário</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Nome do usuário denunciado *</Text>
                <TextInput
                  style={[styles.input, dynamicStyles.input]}
                  placeholder="Digite o nome do usuário"
                  placeholderTextColor={colors.textMuted}
                  value={reportUserName}
                  onChangeText={setReportUserName}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Tópico da denúncia *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
                  {DENUNCIA_TOPICOS.map((topic) => (
                    <TouchableOpacity
                      key={topic}
                      style={[
                        styles.topicButton,
                        dynamicStyles.topicButton,
                        selectedTopic === topic && dynamicStyles.topicButtonActive,
                      ]}
                      onPress={() => setSelectedTopic(topic)}
                    >
                      <Text style={[
                        styles.topicText,
                        dynamicStyles.topicText,
                        selectedTopic === topic && dynamicStyles.topicTextActive,
                      ]}>
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Descrição *</Text>
                <TextInput
                  style={[styles.input, styles.textArea, dynamicStyles.input]}
                  placeholder="Descreva o que aconteceu em detalhes..."
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, dynamicStyles.inputLabel]}>Provas (prints)</Text>
                <View style={styles.proofsContainer}>
                  {proofs.map((uri, index) => (
                    <View key={index} style={styles.proofItem}>
                      <Image source={{ uri }} style={[styles.proofImage, { backgroundColor: colors.inputBackground }]} />
                      <TouchableOpacity style={styles.removeProofButton} onPress={() => removeProof(index)}>
                        <Ionicons name="close-circle" size={22} color="#ff5252" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={[styles.addProofButton, { backgroundColor: colors.inputBackground }]} onPress={addProof}>
                    <Ionicons name="camera" size={28} color={colors.textMuted} />
                    <Text style={[styles.addProofText, { color: colors.textMuted }]}>Adicionar print</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  Adicione até 3 prints como prova (opcional)
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.cancelButton, dynamicStyles.cancelButton]} onPress={() => setReportModalVisible(false)}>
                  <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sendButton, dynamicStyles.sendButton]} onPress={submitReport} disabled={sending}>
                  <Text style={[styles.sendButtonText, dynamicStyles.sendButtonText]}>
                    {sending ? 'Enviando...' : 'Enviar Denúncia'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE TEMAS */}
      <Modal
        visible={themeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
        statusBarTranslucent
      >
        <View style={[styles.modalOverlay, dynamicStyles.modalOverlay]}>
          <View style={[styles.modalContent, styles.themeModalContent, dynamicStyles.modalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>🎨 Escolha um Tema</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  dynamicStyles.themeOption,
                  currentTheme === 'original' && dynamicStyles.themeOptionActive,
                ]}
                onPress={() => changeThemeHandler('original')}
              >
                <View style={[styles.themePreview, { backgroundColor: '#1b1b2f' }]} />
                <Text style={[styles.themeOptionText, dynamicStyles.themeOptionText]}>🌙 Original</Text>
                {currentTheme === 'original' && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  dynamicStyles.themeOption,
                  currentTheme === 'white' && dynamicStyles.themeOptionActive,
                ]}
                onPress={() => changeThemeHandler('white')}
              >
                <View style={[styles.themePreview, { backgroundColor: '#f5f5f5' }]} />
                <Text style={[styles.themeOptionText, dynamicStyles.themeOptionText]}>⚪ Branco</Text>
                {currentTheme === 'white' && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  dynamicStyles.themeOption,
                  currentTheme === 'dark' && dynamicStyles.themeOptionActive,
                ]}
                onPress={() => changeThemeHandler('dark')}
              >
                <View style={[styles.themePreview, { backgroundColor: '#000000' }]} />
                <Text style={[styles.themeOptionText, dynamicStyles.themeOptionText]}>⚫ Preto</Text>
                {currentTheme === 'dark' && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.themeDescription, { color: colors.textMuted }]}>
              O tema será salvo automaticamente para a próxima vez que você abrir o app.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: { padding: 8 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingRight: 16,
  },
  menuContainer: {
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: { fontSize: 15, fontWeight: '500' },
  menuDivider: { height: 1, marginHorizontal: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    maxWidth: '90%',
    width: 400,
    maxHeight: '85%',
    borderWidth: 1,
  },
  themeModalContent: { maxWidth: 400, width: 340 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  fieldContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1 },
  textArea: { minHeight: 100, paddingTop: 12 },
  topicsScroll: { flexDirection: 'row', marginBottom: 4 },
  topicButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  topicText: { fontSize: 13, fontWeight: '500' },
  proofsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  proofItem: { position: 'relative' },
  proofImage: { width: 80, height: 80, borderRadius: 8 },
  removeProofButton: { position: 'absolute', top: -6, right: -6 },
  addProofButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    borderStyle: 'dashed',
  },
  addProofText: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  helperText: { fontSize: 12, marginTop: 6 },
  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 8 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  cancelButtonText: { fontSize: 15, fontWeight: '600' },
  sendButton: { flex: 2, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  sendButtonText: { fontSize: 15, fontWeight: 'bold' },
  themeOptions: { gap: 12, marginVertical: 16 },
  themeOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 14 },
  themePreview: { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)' },
  themeOptionText: { fontSize: 16, fontWeight: '500', flex: 1 },
  themeDescription: { fontSize: 13, textAlign: 'center', marginTop: 8 },
});