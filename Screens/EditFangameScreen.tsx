import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CATEGORIAS, RequisitosSistema } from '../hooks/useCreateFangame';
import { useEditFangame } from '../hooks/useEditFangame';
import { useTheme } from '../hooks/useTheme';

type RouteParams = {
  EditFangame: {
    fangameId: string;
  };
};

// ✅ COMPONENTE FORA DO COMPONENTE PRINCIPAL
function RequisitoInput({ label, icon, placeholder, value, onChange, editable, colors }: any) {
  return (
    <View style={styles.requisitoField}>
      <Text style={[styles.requisitoLabel, { color: colors.textSecondary }]}>
        {icon} {label}
      </Text>
      <TextInput
        style={[
          styles.requisitoInput,
          { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        editable={editable}
      />
    </View>
  );
}

export default function EditFangameScreen() {
  const route = useRoute<RouteProp<RouteParams, 'EditFangame'>>();
  const navigation = useNavigation();
  const { fangameId } = route.params;
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    const loadFangame = async () => {
      try {
        const fangameDoc = await getDoc(doc(db, 'fangames', fangameId));
        if (fangameDoc.exists()) {
          setInitialData(fangameDoc.data());
        } else {
          Alert.alert('Erro', 'Fangame não encontrado');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Erro ao carregar fangame:', error);
        Alert.alert('Erro', 'Não foi possível carregar o fangame');
      } finally {
        setLoading(false);
      }
    };
    loadFangame();
  }, [fangameId]);

  if (loading || !initialData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <EditFangameForm
      fangameId={fangameId}
      initialData={initialData}
      navigation={navigation}
      colors={colors}
    />
  );
}

function EditFangameForm({ fangameId, initialData, navigation, colors }: any) {
  const {
    nome, setNome,
    descricao, setDescricao,
    categoria, setCategoria,
    imagens, novasImagens,
    adicionarImagem,
    removerImagemExistente,
    removerNovaImagem,
    salvarEdicao,
    carregando,
    totalImagens,
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
  } = useEditFangame(fangameId, initialData);

  const handleSalvar = async () => {
    if (carregando) return;
    const success = await salvarEdicao();
    if (success) {
      navigation.goBack();
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={carregando}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Fangame</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Nome do Fangame *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
        placeholder="Nome do fangame"
        placeholderTextColor={colors.textMuted}
        value={nome}
        onChangeText={setNome}
        editable={!carregando}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
        placeholder="Descrição..."
        placeholderTextColor={colors.textMuted}
        value={descricao}
        onChangeText={setDescricao}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!carregando}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria *</Text>
      <FlatList
        horizontal
        data={CATEGORIAS}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoriaBtn, { backgroundColor: colors.inputBackground }, categoria === item && { backgroundColor: colors.primary }]}
            onPress={() => setCategoria(item)}
            disabled={carregando}
          >
            <Text style={[styles.categoriaText, { color: colors.textMuted }, categoria === item && { color: '#000', fontWeight: 'bold' }]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriaList}
      />

      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Imagens ({totalImagens}/3)</Text>
      </View>

      <View style={styles.imageRow}>
        {imagens.map((url: string, index: number) => (
          <View key={`existing-${index}`} style={[styles.previewContainer, { borderColor: colors.border }]}>
            <Image source={{ uri: url }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => removerImagemExistente(url)} disabled={carregando}>
              <Ionicons name="close-circle" size={24} color="#ff5252" />
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>Atual</Text>
            </View>
          </View>
        ))}

        {novasImagens.map((base64: string, index: number) => (
          <View key={`new-${index}`} style={[styles.previewContainer, { borderColor: colors.primary }]}>
            <Image source={{ uri: `data:image/jpeg;base64,${base64}` }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => removerNovaImagem(index)} disabled={carregando}>
              <Ionicons name="close-circle" size={24} color="#ff5252" />
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>Nova</Text>
            </View>
          </View>
        ))}

        {totalImagens < 3 && (
          <>
            <TouchableOpacity
              style={[styles.addImageBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => adicionarImagem('camera')}
              disabled={carregando}
            >
              <Ionicons name="camera" size={28} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addImageBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => adicionarImagem('galeria')}
              disabled={carregando}
            >
              <Ionicons name="images" size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* SEÇÃO DE LINKS */}
      <TouchableOpacity
        style={[styles.toggleBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        onPress={() => setMostrarLinks(!mostrarLinks)}
        disabled={carregando}
      >
        <Ionicons name="link-outline" size={22} color={colors.primary} />
        <Text style={[styles.toggleText, { color: colors.text }]}>
          Links do Fangame ({links.length}/3)
        </Text>
        <Ionicons name={mostrarLinks ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
      </TouchableOpacity>

      {mostrarLinks && (
        <View style={[styles.linksContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          {links.map((link, index) => (
            <View key={index} style={[styles.linkItem, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={styles.linkHeader}>
                <Text style={[styles.linkNumber, { color: colors.primary }]}>
                  Link {index + 1}
                </Text>
                <TouchableOpacity onPress={() => removerLink(index)} disabled={carregando}>
                  <Ionicons name="trash-outline" size={20} color="#ff5252" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.linkInput, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: colors.inputBorder }]}
                placeholder="Título (ex: Baixar, Site Oficial)"
                placeholderTextColor={colors.textMuted}
                value={link.titulo}
                onChangeText={(text) => atualizarLink(index, 'titulo', text)}
                editable={!carregando}
              />

              <TextInput
                style={[styles.linkInput, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: colors.inputBorder }]}
                placeholder="https://exemplo.com"
                placeholderTextColor={colors.textMuted}
                value={link.url}
                onChangeText={(text) => atualizarLink(index, 'url', text)}
                autoCapitalize="none"
                keyboardType="url"
                editable={!carregando}
              />
            </View>
          ))}

          {links.length < 3 && (
            <TouchableOpacity
              style={[styles.addLinkBtn, { borderColor: colors.primary }]}
              onPress={adicionarLink}
              disabled={carregando}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              <Text style={[styles.addLinkText, { color: colors.primary }]}>
                Adicionar Link
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* REQUISITOS DO SISTEMA (CELULAR) */}
      <TouchableOpacity
        style={[styles.toggleBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        onPress={() => setMostrarRequisitos(!mostrarRequisitos)}
        disabled={carregando}
      >
        <Ionicons name="phone-portrait-outline" size={22} color={colors.primary} />
        <Text style={[styles.toggleText, { color: colors.text }]}>
          Requisitos para Celular
        </Text>
        <Ionicons name={mostrarRequisitos ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
      </TouchableOpacity>

      {mostrarRequisitos && (
        <View style={[styles.requisitosContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <View style={styles.requisitosInfoBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.requisitosInfoText, { color: colors.textMuted }]}>
              Informe os requisitos mínimos para rodar o fangame em um celular.
            </Text>
          </View>

          <View style={styles.requisitosSection}>
            <View style={styles.requisitosSectionHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#ff9800" />
              <Text style={[styles.requisitosSectionTitle, { color: colors.text }]}>Requisitos Mínimos</Text>
            </View>
            <RequisitoInput 
              label="Sistema Operacional" 
              icon="📱" 
              placeholder="Ex: Android 8.0 ou iOS 13"
              value={requisitos.osMinimo}
              onChange={(text: string) => atualizarRequisito('osMinimo', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Processador" 
              icon="⚙️" 
              placeholder="Ex: Snapdragon 660 / A10"
              value={requisitos.processadorMinimo}
              onChange={(text: string) => atualizarRequisito('processadorMinimo', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Memória RAM" 
              icon="🧠" 
              placeholder="Ex: 3 GB"
              value={requisitos.memoriaMinima}
              onChange={(text: string) => atualizarRequisito('memoriaMinima', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Armazenamento Livre" 
              icon="💾" 
              placeholder="Ex: 500 MB"
              value={requisitos.armazenamentoMinimo}
              onChange={(text: string) => atualizarRequisito('armazenamentoMinimo', text)}
              editable={!carregando}
              colors={colors}
            />
          </View>

          <View style={styles.requisitosSection}>
            <View style={styles.requisitosSectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#4caf50" />
              <Text style={[styles.requisitosSectionTitle, { color: colors.text }]}>Requisitos Recomendados</Text>
            </View>
            <RequisitoInput 
              label="Sistema Operacional" 
              icon="📱" 
              placeholder="Ex: Android 12 ou iOS 16"
              value={requisitos.osRecomendado}
              onChange={(text: string) => atualizarRequisito('osRecomendado', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Processador" 
              icon="⚙️" 
              placeholder="Ex: Snapdragon 870 / A15"
              value={requisitos.processadorRecomendado}
              onChange={(text: string) => atualizarRequisito('processadorRecomendado', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Memória RAM" 
              icon="🧠" 
              placeholder="Ex: 6 GB"
              value={requisitos.memoriaRecomendada}
              onChange={(text: string) => atualizarRequisito('memoriaRecomendada', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Armazenamento Livre" 
              icon="💾" 
              placeholder="Ex: 2 GB"
              value={requisitos.armazenamentoRecomendado}
              onChange={(text: string) => atualizarRequisito('armazenamentoRecomendado', text)}
              editable={!carregando}
              colors={colors}
            />
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          disabled={carregando}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, carregando && styles.saveButtonDisabled]}
          onPress={handleSalvar}
          disabled={carregando}
          activeOpacity={carregando ? 1 : 0.7}
        >
          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#000" size="small" />
              <Text style={styles.saveButtonText}>Salvando...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#000" />
              <Text style={styles.saveButtonText}>Salvar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1 },
  textArea: { height: 100, textAlignVertical: 'top' },
  categoriaList: { marginBottom: 8 },
  categoriaBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  categoriaText: { fontSize: 14 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  previewContainer: { position: 'relative', marginRight: 10, marginBottom: 10, borderWidth: 2, borderRadius: 8 },
  previewImage: { width: 90, height: 90, borderRadius: 6 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12 },
  badge: { position: 'absolute', bottom: 4, left: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, color: '#000', fontWeight: 'bold' },
  addImageBtn: { width: 90, height: 90, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginBottom: 10, borderWidth: 1, borderStyle: 'dashed' },
  toggleBox: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 20, marginBottom: 12, gap: 10 },
  toggleText: { flex: 1, fontSize: 15, fontWeight: '600' },
  linksContainer: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  linkItem: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  linkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  linkNumber: { fontSize: 14, fontWeight: 'bold' },
  linkInput: { borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, marginBottom: 8 },
  addLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  addLinkText: { fontSize: 14, fontWeight: '600' },
  requisitosContainer: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  requisitosInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,200,83,0.08)',
  },
  requisitosInfoText: { fontSize: 12, flex: 1 },
  requisitosSection: { marginBottom: 20 },
  requisitosSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)' },
  requisitosSectionTitle: { fontSize: 16, fontWeight: 'bold' },
  requisitoField: { marginBottom: 10 },
  requisitoLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  requisitoInput: { padding: 10, borderRadius: 8, fontSize: 14, borderWidth: 1 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelButtonText: { fontSize: 15, fontWeight: '600' },
  saveButton: { flex: 2, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});