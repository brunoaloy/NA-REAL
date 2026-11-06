import { router } from "expo-router";
import { Screen, Title, Copy, PrimaryButton } from "../components/ui";
export default function DeleteAccountPage() {
  return (
    <Screen>
      <Title>Exclusão de conta NA REAL</Title>
      <Copy>
        Entre com sua conta, abra Perfil → Privacidade e configurações → Excluir
        minha conta. A mesma operação funciona nesta interface web e no
        aplicativo, após autenticação recente. Perfil, contribuições pessoais e
        fotos são excluídos. Estabelecimentos podem permanecer anonimizados.
        Esta página precisa ser hospedada em domínio público antes de informar
        sua URL ao Google Play.
      </Copy>
      <PrimaryButton
        title="Entrar para solicitar exclusão"
        onPress={() => router.push("/auth")}
      />
      <PrimaryButton
        title="Abrir configurações"
        onPress={() => router.push("/settings")}
      />
    </Screen>
  );
}
