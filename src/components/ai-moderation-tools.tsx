import { useCallback, useEffect, useRef, useState } from "react";
import { Switch, View, Text } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Copy, ErrorState, PrimaryButton, Title } from "./ui";
import { GentleNote, m } from "./member-design";
import { db } from "../services/supabase";
import { moderationRun } from "../validation/moderation-run";
export function AiModerationTools({
  available,
  onNotice,
}: {
  available: boolean;
  onNotice: (message: string) => void;
}) {
  const [automatic, setAutomatic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const lock = useRef(false),
    active = useRef(true);
  const qc = useQueryClient();
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const run = useCallback(async () => {
    if (!available || lock.current) return;
    lock.current = true;
    if (active.current) {
      setBusy(true);
      setError(undefined);
      onNotice("");
    }
    try {
      const r = await db().functions.invoke("moderate-pending", { body: {} });
      if (r.error) throw r.error;
      const result = moderationRun(r.data);
      await qc.invalidateQueries({ queryKey: ["admin-queue"] });
      if (active.current) {
        onNotice(result.message);
        if (result.failed) setAutomatic(false);
      }
    } catch (e) {
      if (active.current) {
        setError(e);
        setAutomatic(false);
      }
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  }, [available, onNotice, qc]);
  useEffect(() => {
    if (!automatic || !available) return;
    const timer = setInterval(() => void run(), 60000);
    return () => clearInterval(timer);
  }, [automatic, available, run]);
  return (
    <Card>
      <Title>Moderação com IA</Title>
      <Copy>
        A IA aprova textos sem sinalizadores e reprova sinais fortes de ameaça,
        assédio, discriminação ou outras violações previstas. Dúvidas ficam para
        você decidir. Lugares, perfis e fotos sem violações ainda precisam de
        aprovação humana.
      </Copy>
      {!available && (
        <GentleNote>
          O serviço de análise está indisponível. Você pode revisar lugares
          manualmente na aba Cadastros.
        </GentleNote>
      )}
      <PrimaryButton
        title={busy ? "Analisando envios…" : "Analisar fila com IA"}
        busy={busy}
        disabled={!available || busy}
        onPress={() => void run()}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={m.label}>Analisar novos envios automaticamente</Text>
          <Text style={m.small}>
            Enquanto Ferramentas estiver aberta, verifica a fila a cada minuto.
            Ao sair desta aba, o acompanhamento para. Uma análise já iniciada
            pode terminar no servidor.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Analisar novos envios automaticamente"
          value={automatic}
          onValueChange={(value) => {
            setAutomatic(value);
            if (value) void run();
          }}
          disabled={!available || busy}
          trackColor={{ true: "#0F766E", false: "#D6E4DF" }}
        />
      </View>
      {error != null && <ErrorState error={error} />}
      <Text style={m.small}>
        A análise envia os textos e, quando houver, cópias sanitizadas das fotos
        ao provedor de IA. Não envia e-mail de login nem tokens. Falhas mantêm o
        conteúdo pendente. As decisões podem ser contestadas pelo Perfil.
      </Text>
    </Card>
  );
}
