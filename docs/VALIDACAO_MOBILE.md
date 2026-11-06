# Validação mobile — Fase 4

## Configuração preparada

- Expo 58, React Native e MapLibre Native continuam preservados; Router usa scheme `nareal`.
- IDs `com.example.nareal` são provisórios. Não presumir disponibilidade ou enviar às lojas.
- `npm run mobile:check` carrega a configuração Expo real e verifica scheme, IDs, plugins e perfis; não testa aparelho, assinatura ou conectividade.
- `eas.json` fixa Node 24.22.1, perfis development/preview/production e development-simulator (iOS sem aparelho). Production exige URL/chave pública configuradas via `NA_REAL_REQUIRE_SERVICES=1`; segredos administrativos são rejeitados no app config.
- Configuração HTTP local só com `NA_REAL_ALLOW_LOCAL_HTTP=1`, nunca como default em produção. Chaves não são impressas pelo checker.

## Gerar projetos e testar desenvolvimento

```sh
npm ci
npm run mobile:check
EXPO_OFFLINE=1 npx expo prebuild --no-install
npm run android
# Em macOS com Xcode e CocoaPods:
npm run ios
```

Prebuild gera projetos ignorados, não APK/IPA. Android precisa de JDK/SDK/emulador ou USB; iOS precisa macOS/Xcode. EAS remoto exige conta e projeto vinculado, certificados/provisionamento e revisão de custos antes de executar. Exemplos a usar somente após configuração/autorização de build:

```sh
eas build --profile development --platform android
eas build --profile development-simulator --platform ios
```

Não foi feita submissão. Development client é necessário para módulos nativos; Expo Go não valida MapLibre.

## Permissões e deep links

Localização apenas após gesto em Perto de mim, sem permissão de background. Câmera/fotos são opcionais; microfone desabilitado. Conferir manifesto e Info.plist após prebuild. Não exigir localização/fotos para busca manual. Verificar permissão negada, limitada e revogada em aparelhos.

Configure redirects de Auth para o scheme do development build e URL web de `/auth-callback`. PKCE precisa do contexto que iniciou a solicitação. Links `nareal://place/ID` só funcionam em aparelho com app compatível instalado; Universal/App Links HTTPS exigem domínio, associação e testes próprios, ainda ausentes.

## Roteiro em aparelhos (não executado nesta máquina)

1. Instalar development build e conectar a Supabase de desenvolvimento acessível ao aparelho.
2. Criar A/B e confirmar e-mails; manter sessão, alternar background e recuperar senha.
3. Mercado criado por A fica pending; operador revisa; B pesquisa e abre pela lista/mapa.
4. Review/foto pending não vaza a B; após aprovação, B lê conteúdo e média correta.
5. B pergunta; A responde; aprovação dispara atualização e notificação interna com opt-in.
6. A/B escrevem na mesma sala; responder mensagem e simular timeout/retry sem duplicação.
7. Negar localização/fotos; testar busca manual, modo avião, reconexão e rascunho retido.
8. Bloquear/denunciar e confirmar isolamento; usuário comum não acessa administração.
9. Excluir conta com reautenticação recente; confirmar remoção física de mídia e dados associados.
10. Conferir leitores de tela, texto grande, safe areas, telas pequenas e desempenho Android intermediário.

Registrar versão do build, modelo/SO, passos, resultado e falhas. Nenhum teste físico foi realizado. Sem EAS/SDK/Xcode e aparelhos, configuração e bundle não equivalem a build instalado.
