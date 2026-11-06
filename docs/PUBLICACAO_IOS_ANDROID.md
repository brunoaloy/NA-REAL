# Publicação iOS e Android — bloqueada

`app.json` usa identidade provisória `com.example.nareal`. `eas.json` prepara perfis development, preview e production; não foram produzidos binários, não há projeto EAS vinculado nem submissão.

Antes de build/distribuição:

- Definir disponibilidade legal da marca, bundle/package definitivos, domínio, contato e URLs públicas.
- Criar contas Expo/EAS, Apple Developer e Play Console; configurar assinatura e credenciais sem colocá-las no repositório.
- Implementar exclusão interna e página externa, política LGPD, termos, denúncia de todo UGC, bloqueio e revisão administrativa.
- Integrar mapas licenciados com atribuição; não copiar avaliações/fotos do Google, nem presumir licença de dados OSM derivados.
- Finalizar assets originais, ícones/splash, fotos aprovadas, screenshots, descrição pt-BR, faixa etária, Data Safety e App Privacy.
- Testar acessibilidade, texto grande, offline, dispositivos Android/iOS e dois usuários reais, incluindo revisão das permissões.
- Configurar crash reporting sem dados sensíveis e contas para revisão das lojas.

Mapas nativos e push requerem development build apropriado. Expo Go não foi validado. Build EAS remoto pode gerar custos e não deve ser iniciado sem autorização do proprietário. Nenhuma publicação foi efetuada.

## Evidência da Fase 2

Prebuild iOS/Android gerado com MapLibre, localização e seleção de fotos; development client instalado como dependência. `npm run android`/`npm run ios` usam Expo run. Nenhum APK/IPA foi compilado nesta máquina sem SDK Android completo/Xcode. Fluxos de exclusão e documentos agora existem no código, mas exigem teste real e revisão jurídica antes de substituir itens deste checklist por aprovados.
