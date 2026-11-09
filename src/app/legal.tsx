import cityLicense from "../data/cities-license.json";
import { useLocalSearchParams } from "expo-router";
import { Screen, Title, Copy } from "../components/ui";
import { AppHeader } from "../components/design";
export default function Legal() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  if (kind === "sources")
    return (
      <Screen>
        <AppHeader title="Fontes e licenças" back />
        <Title>Índice de cidades</Title>
        <Copy>
          Dados de municípios derivados de kelvins/municipios-brasileiros,
          obtidos em 08/11/2026. Os centros são aproximados e servem para
          explorar a região; não representam endereços de comércios.
        </Copy>
        <Copy>{cityLicense.source}</Copy>
        <Copy>{cityLicense.license}</Copy>
      </Screen>
    );
  return (
    <Screen>
      <AppHeader
        title={kind === "privacy" ? "Privacidade" : "Termos de uso"}
        back
      />
      <Copy>
        Versão preliminar para desenvolvimento. O responsável legal, contato de
        suporte e política de retenção precisam ser definidos antes de
        lançamento público.
      </Copy>
      {kind === "privacy" ? (
        <>
          <Title>Dados e finalidade</Title>
          <Copy>
            Conta e perfil permitem contribuições. Avaliações, mensagens e
            cadastros aprovados são públicos. E-mail do Auth e preferências não
            integram o perfil público. A localização é opcional, solicitada após
            gesto e usada para consultar lugares; não há rastreamento em segundo
            plano.
          </Copy>
          <Title>Moderação e fornecedores</Title>
          <Copy>
            Conteúdo enviado fica pendente até análise. Textos e fotos podem ser
            enviados ao provedor de moderação configurado para análise de
            segurança; as decisões podem ser contestadas pelo Perfil. Não envie
            dados pessoais de terceiros. Supabase armazena dados e mídia. O
            provedor de mapas recebe as consultas necessárias ao mapa.
          </Copy>
          <Title>Seus direitos</Title>
          <Copy>
            É possível editar contribuições próprias, bloquear usuários, ajustar
            notificações e solicitar exclusão dentro das configurações. Arquivos
            são removidos pelo backend antes de excluir a conta. Backups, prazos
            legais, transferência internacional e contato do controlador
            precisam de revisão jurídica e configuração antes de produção.
          </Copy>
        </>
      ) : (
        <>
          <Title>Comunidade responsável</Title>
          <Copy>
            Proibidos ameaças, assédio, discriminação, fraude, exposição de
            dados de terceiros, conteúdo sexual ilegal ou abusivo, instruções de
            autoagressão, spam e manipulação de avaliações. Cadastre somente
            estabelecimentos públicos. Não publique residências privadas,
            fotografias sem autorização ou conteúdo que viole direitos.
          </Copy>
          <Title>Relatos e decisões</Title>
          <Copy>
            Relatos são experiências pessoais com validade, não confirmação
            universal. Não há garantia de cobertura completa. Conteúdo pode ser
            mantido pendente, rejeitado ou removido com registro de motivo. A IA
            pode aprovar textos sem sinalizadores e reprovar violações claras;
            casos duvidosos e aprovação de lugares, perfis e fotos exigem
            revisão humana. Use denúncias e contestação de decisões; contas
            abusivas podem ser suspensas.
          </Copy>
          <Title>Direitos e emergência</Title>
          <Copy>
            Publique somente conteúdo que você pode compartilhar. O NA REAL não
            é um canal de emergência. Casos de risco imediato devem ser
            encaminhados aos serviços públicos competentes.
          </Copy>
        </>
      )}
    </Screen>
  );
}
