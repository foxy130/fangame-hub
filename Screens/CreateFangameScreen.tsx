import React from 'react';
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
import { useCreateFangame, CATEGORIAS, RequisitosSistema } from '../hooks/useCreateFangame';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Clipboard from 'expo-clipboard';

// ✅ COMPONENTE FORA DO COMPONENTE PRINCIPAL
function RequisitoInput({ label, campo, icon, placeholder, value, onChange, editable, colors }: any) {
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

export default function CreateFangameScreen() {
  const { colors } = useTheme();
  const {
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
  } = useCreateFangame();

  const copiarLink = async (url: string) => {
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('✅ Copiado!', 'O link foi copiado para a área de transferência.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o link.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Criar Novo Fangame</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
        placeholder="Nome do fangame"
        placeholderTextColor={colors.textMuted}
        value={nome}
        onChangeText={setNome}
        editable={!carregando}
      />

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

      <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria</Text>
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

      <Text style={[styles.label, { color: colors.textSecondary }]}>Imagens (máx 3)</Text>
      <View style={styles.imageRow}>
        {imagens.map((base64, index) => (
          <View key={index} style={[styles.previewContainer, { borderColor: colors.border }]}>
            <Image source={{ uri: `data:image/jpeg;base64,${base64}` }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => removerImagem(index)} disabled={carregando}>
              <Ionicons name="close-circle" size={24} color="#ff5252" />
            </TouchableOpacity>
          </View>
        ))}
        {imagens.length < 3 && (
          <>
            <TouchableOpacity
              style={[styles.addImageBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => adicionarImagem('camera')}
              disabled={carregando}
            >
              <Ionicons name="camera" size={32} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addImageBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
              onPress={() => adicionarImagem('galeria')}
              disabled={carregando}
            >
              <Ionicons name="images" size={32} color={colors.textMuted} />
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
          <View style={styles.linksHeader}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.linksInfo, { color: colors.textMuted }]}>
              Adicione até 3 links (download, site oficial, etc.)
            </Text>
          </View>

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

              <View style={styles.linkUrlRow}>
                <TextInput
                  style={[styles.linkInput, styles.linkUrlInput, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: colors.inputBorder }]}
                  placeholder="https://exemplo.com"
                  placeholderTextColor={colors.textMuted}
                  value={link.url}
                  onChangeText={(text) => atualizarLink(index, 'url', text)}
                  autoCapitalize="none"
                  keyboardType="url"
                  editable={!carregando}
                />
                {link.url.trim() !== '' && (
                  <TouchableOpacity
                    style={[styles.copyBtn, { backgroundColor: colors.primary }]}
                    onPress={() => copiarLink(link.url)}
                  >
                    <Ionicons name="copy-outline" size={18} color="#000" />
                  </TouchableOpacity>
                )}
              </View>
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
          Requisitos para Celular (opcional)
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
              <Text style={[styles.requisitosSectionTitle, { color: colors.text }]}>
                Requisitos Mínimos
              </Text>
            </View>
            <RequisitoInput 
              label="Sistema Operacional" 
              campo="osMinimo" 
              icon="📱" 
              placeholder="Ex: Android 8.0 ou iOS 13"
              value={requisitos.osMinimo}
              onChange={(text: string) => atualizarRequisito('osMinimo', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Processador" 
              campo="processadorMinimo" 
              icon="⚙️" 
              placeholder="Ex: Snapdragon 660 / A10"
              value={requisitos.processadorMinimo}
              onChange={(text: string) => atualizarRequisito('processadorMinimo', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Memória RAM" 
              campo="memoriaMinima" 
              icon="🧠" 
              placeholder="Ex: 3 GB"
              value={requisitos.memoriaMinima}
              onChange={(text: string) => atualizarRequisito('memoriaMinima', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Armazenamento Livre" 
              campo="armazenamentoMinimo" 
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
              <Text style={[styles.requisitosSectionTitle, { color: colors.text }]}>
                Requisitos Recomendados
              </Text>
            </View>
            <RequisitoInput 
              label="Sistema Operacional" 
              campo="osRecomendado" 
              icon="📱" 
              placeholder="Ex: Android 12 ou iOS 16"
              value={requisitos.osRecomendado}
              onChange={(text: string) => atualizarRequisito('osRecomendado', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Processador" 
              campo="processadorRecomendado" 
              icon="⚙️" 
              placeholder="Ex: Snapdragon 870 / A15"
              value={requisitos.processadorRecomendado}
              onChange={(text: string) => atualizarRequisito('processadorRecomendado', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Memória RAM" 
              campo="memoriaRecomendada" 
              icon="🧠" 
              placeholder="Ex: 6 GB"
              value={requisitos.memoriaRecomendada}
              onChange={(text: string) => atualizarRequisito('memoriaRecomendada', text)}
              editable={!carregando}
              colors={colors}
            />
            <RequisitoInput 
              label="Armazenamento Livre" 
              campo="armazenamentoRecomendado" 
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

      <TouchableOpacity
        style={[styles.botao, { backgroundColor: colors.primary }, carregando && styles.botaoDisabled]}
        onPress={criarFangame}
        disabled={carregando}
        activeOpacity={carregando ? 1 : 0.7}
      >
        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#000" size="small" />
            <Text style={styles.botaoTexto}>Criando fangame...</Text>
          </View>
        ) : (
          <Text style={styles.botaoTexto}>Criar Fangame</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 12, borderWidth: 1 },
  textArea: { height: 100, textAlignVertical: 'top' },
  label: { marginBottom: 8, fontSize: 16, fontWeight: '600' },
  categoriaList: { marginBottom: 16 },
  categoriaBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  categoriaText: { fontSize: 14 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  previewContainer: { position: 'relative', marginRight: 10, marginBottom: 10, borderWidth: 1, borderRadius: 8 },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#1b1b2f', borderRadius: 12 },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  toggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  toggleText: { flex: 1, fontSize: 15, fontWeight: '600' },

  // LINKS
  linksContainer: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  linksHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  linksInfo: { fontSize: 12, flex: 1 },
  linkItem: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  linkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  linkNumber: { fontSize: 14, fontWeight: 'bold' },
  linkInput: { borderRadius: 8, padding: 10, fontSize: 14, borderWidth: 1, marginBottom: 8 },
  linkUrlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkUrlInput: { flex: 1, marginBottom: 0 },
  copyBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  addLinkText: { fontSize: 14, fontWeight: '600' },

  // REQUISITOS
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

  botao: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10, minHeight: 54, justifyContent: 'center' },
  botaoDisabled: { opacity: 0.6 },
  botaoTexto: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});