const IMG_BB_KEY = '26d49e2bc40598c6501ff5949e5c66b1';

export async function uploadImageToImgBB(base64: string, tentativa = 1): Promise<string> {
    const MAX_TENTATIVAS = 3;
    
    try {
        // Remove prefixo se existir
        const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');

        const tamanhoKB = Math.round((cleanBase64.length * 3) / 4 / 1024);
        console.log(`📤 Upload (tentativa ${tentativa}/${MAX_TENTATIVAS}) — ${tamanhoKB} KB`);

        // Valida tamanho
        if (tamanhoKB > 32000) {
            throw new Error('Imagem muito grande (máx 32 MB)');
        }

        // Timeout de 30 segundos para evitar travamento
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const formData = new FormData();
        formData.append('image', cleanBase64);

        const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${IMG_BB_KEY}`,
            {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        const data = await response.json();
        console.log('📡 Status HTTP:', response.status);

        if (data.status_code === 403) {
            throw new Error('Chave da API do ImgBB inválida');
        }

        if (!data.success) {
            throw new Error(data.error?.message || 'Falha no upload');
        }

        console.log('✅ Upload OK:', data.data.url);
        return data.data.url;

    } catch (error: any) {
        console.error(`❌ Erro no upload (tentativa ${tentativa}):`, error.message);

        // Se for erro de rede e ainda tiver tentativas, tenta de novo
        const erroDeRede = 
            error.message?.includes('Connection reset') ||
            error.message?.includes('fetch failed') ||
            error.message?.includes('Network request failed') ||
            error.name === 'AbortError';

        if (erroDeRede && tentativa < MAX_TENTATIVAS) {
            console.log(`🔄 Tentando novamente em 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return uploadImageToImgBB(base64, tentativa + 1);
        }

        throw new Error(error.message || 'Falha no upload da imagem');
    }
}