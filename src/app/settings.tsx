import { useState } from "react";
import { Switch, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Screen,
  Copy,
  Title,
  Card,
  Field,
  PrimaryButton,
  ErrorState,
} from "../components/ui";
import { AppHeader } from "../components/design";
import { useSession } from "../hooks/use-session";
import { ActionRow } from "../components/member-design";
import { db } from "../services/supabase";
export default function Settings() {
  const session = useSession();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["preferences", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const p = await db()
        .from("notification_preferences")
        .select("answers,place_updates,push")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      const b = await db()
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", session!.user.id);
      if (p.error || b.error) throw p.error ?? b.error;
      return {
        preferences: p.data ?? {
          answers: true,
          place_updates: false,
          push: false,
        },
        blocks: b.data,
      };
    },
  });
  async function toggle(key: "answers" | "place_updates", value: boolean) {
    setError(undefined);
    try {
      const r = await db()
        .from("notification_preferences")
        .upsert({
          user_id: session!.user.id,
          ...q.data?.preferences,
          [key]: value,
        });
      if (r.error) throw r.error;
      await qc.invalidateQueries({ queryKey: ["preferences"] });
    } catch (e) {
      setError(e);
    }
  }
  return (
    <Screen>
      <AppHeader title="Privacidade e configurações" back />
      <PrimaryButton
        title="Política de privacidade"
        onPress={() =>
          router.push({ pathname: "/legal", params: { kind: "privacy" } })
        }
      />
      <PrimaryButton
        title="Termos e regras da comunidade"
        onPress={() =>
          router.push({ pathname: "/legal", params: { kind: "terms" } })
        }
      />
      <ActionRow
        title="Guia dos primeiros testes"
        detail="Um roteiro simples para experimentar esta versão"
        icon="compass-outline"
        onPress={() => router.push("/test-guide")}
      />
      <ActionRow
        title="Fontes e licenças"
        detail="Sobre os dados locais de cidades"
        icon="information-circle-outline"
        onPress={() =>
          router.push({ pathname: "/legal", params: { kind: "sources" } })
        }
      />
      {session ? (
        <>
          {q.isError && <ErrorState error={q.error} />}
          <Title>Notificações</Title>
          {(["answers", "place_updates"] as const).map((key, i) => (
            <View
              key={key}
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Switch
                accessibilityLabel={
                  [
                    "Respostas às minhas perguntas",
                    "Atualizações de lugares seguidos",
                  ][i]
                }
                value={q.data?.preferences[key] ?? false}
                onValueChange={(v) => void toggle(key, v)}
                disabled={!q.data}
              />
              <View style={{ flex: 1 }}>
                <Copy>
                  {
                    [
                      "Respostas às minhas perguntas",
                      "Atualizações de lugares seguidos (preparado; entrega ainda não habilitada)",
                    ][i]
                  }
                </Copy>
              </View>
            </View>
          ))}
          <Copy>
            Push ainda não configurado; nenhum token é coletado ou enviado nesta
            versão.
          </Copy>
          <Title>Usuários bloqueados</Title>
          {q.data?.blocks.map((b) => (
            <Card key={b.blocked_id}>
              <Copy>{b.blocked_id}</Copy>
              <PrimaryButton
                title="Desbloquear"
                onPress={async () => {
                  const r = await db()
                    .from("user_blocks")
                    .delete()
                    .eq("blocker_id", session.user.id)
                    .eq("blocked_id", b.blocked_id);
                  if (r.error) setError(r.error);
                  else await qc.invalidateQueries();
                }}
              />
            </Card>
          ))}
          <Card>
            <Title>Excluir minha conta</Title>
            <Copy>
              Exclui perfil, avaliações, conversas, fotos e dados pessoais
              associados. Cadastros de estabelecimentos podem permanecer sem sua
              autoria. Entre novamente nos últimos 10 minutos. A ação é
              permanente.
            </Copy>
            <Field
              label="Digite EXCLUIR para confirmar"
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="characters"
            />
            <PrimaryButton
              title="Excluir conta e dados"
              disabled={busy || confirm !== "EXCLUIR"}
              onPress={async () => {
                setBusy(true);
                setError(undefined);
                try {
                  const r = await db().functions.invoke("delete-account", {
                    body: { confirm },
                  });
                  if (r.error) throw r.error;
                  if (r.data?.deleted !== true)
                    throw new Error(r.data?.error ?? "Exclusão não confirmada");
                  await db().auth.signOut();
                  qc.clear();
                  setNotice("Conta excluída.");
                  router.replace("/");
                } catch (e) {
                  setError(e);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </Card>
        </>
      ) : (
        <PrimaryButton
          title="Entrar para gerenciar minha conta"
          onPress={() => router.push("/auth")}
        />
      )}
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
    </Screen>
  );
}
