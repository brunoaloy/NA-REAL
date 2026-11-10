import { useSession } from "../hooks/use-session";
import {
  localDiagnostics,
  diagnosticReport,
  type Diagnostic,
} from "../validation/diagnostics";
import { useRef, useState } from "react";
import { Platform, Share, Text, View, Switch } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { AppHeader } from "../components/design";
import {
  Screen,
  Card,
  Field,
  PrimaryButton,
  ErrorState,
} from "../components/ui";
import { WarmIntro, GentleNote, m } from "../components/member-design";
import { feedbackReport } from "../validation/feedback";
export default function Feedback() {
  const session = useSession();
  return <FeedbackContent key={session?.user.id ?? "guest"} />;
}
function FeedbackContent() {
  const [screen, setScreen] = useState(""),
    [description, setDescription] = useState(""),
    [expected, setExpected] = useState("");
  const [error, setError] = useState<unknown>(),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [includeDiagnostics, setIncludeDiagnostics] = useState(false);
  const [diagnosticPreview, setDiagnosticPreview] = useState<Diagnostic[]>([]);
  const context = {
    version: Constants.expoConfig?.version ?? "0.1.0",
    build:
      Constants.executionEnvironment === "storeClient"
        ? "Expo Go"
        : (Constants.nativeBuildVersion ?? "Desenvolvimento"),
    platform: Platform.OS,
    os: Device.osVersion ?? "Não informado",
    model:
      Device.modelName ??
      (Platform.OS === "web" ? "Navegador" : "Não informado"),
  };
  async function share() {
    if (locked.current) return;
    setError(undefined);
    setNotice("");
    let message;
    try {
      message = feedbackReport({ screen, description, expected }, context);
      if (includeDiagnostics)
        message += "\n\n" + diagnosticReport(diagnosticPreview);
    } catch (e) {
      setError(e);
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      const result = await Share.share({
        title: "NA REAL — Relato de teste",
        message,
      });
      setNotice(
        result?.action === Share.dismissedAction
          ? "Compartilhamento cancelado. Seu rascunho foi mantido."
          : "Relato preparado. O envio depende do aplicativo que você escolheu; não recebemos uma confirmação de entrega.",
      );
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError")
        setNotice("Compartilhamento cancelado. Seu rascunho foi mantido.");
      else
        setError(
          new Error(
            "Não foi possível abrir o compartilhamento neste aparelho. Seu rascunho foi mantido para tentar novamente.",
          ),
        );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen>
      <AppHeader title="Enviar feedback" back />
      <WarmIntro
        title="Sua impressão faz diferença."
        body="Conte o que aconteceu e compartilhe o relato com quem convidou você para testar."
      />
      <Card>
        <Text style={m.label}>Informações que vão no relato</Text>
        <Text style={m.small}>
          NA REAL {context.version} · {context.build}
        </Text>
        <Text style={m.small}>
          {context.model} · {context.platform} {context.os}
        </Text>
      </Card>
      <View style={{ gap: 18 }}>
        <Field
          label="Em qual tela?"
          placeholder="Ex.: Cadastro de lugar"
          value={screen}
          onChangeText={setScreen}
          maxLength={120}
          editable={!busy}
        />
        <Field
          label="O que aconteceu?"
          placeholder="O que você tentou fazer e qual foi o resultado?"
          value={description}
          onChangeText={setDescription}
          maxLength={2000}
          multiline
          style={{ minHeight: 140, textAlignVertical: "top" }}
          editable={!busy}
        />
        <Field
          label="O que você esperava? (opcional)"
          value={expected}
          onChangeText={setExpected}
          maxLength={1000}
          multiline
          style={{ minHeight: 90, textAlignVertical: "top" }}
          editable={!busy}
        />
      </View>
      <Card>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Text style={[m.label, { flex: 1 }]}>
            Incluir diagnóstico técnico (opcional)
          </Text>
          <Switch
            accessibilityLabel="Incluir diagnóstico técnico"
            value={includeDiagnostics}
            disabled={busy}
            onValueChange={(value) => {
              setIncludeDiagnostics(value);
              setDiagnosticPreview(value ? localDiagnostics.snapshot() : []);
            }}
          />
        </View>
        <Text style={m.small}>
          Somente horário, tipo de operação e categoria de falha. Sem textos
          enviados, fotos, e-mail, localização ou tokens. Os registros ficam na
          memória desta sessão.
        </Text>
        {includeDiagnostics && (
          <Text style={m.small}>{diagnosticReport(diagnosticPreview)}</Text>
        )}
      </Card>
      <GentleNote>
        Você escolhe por qual aplicativo compartilhar e para quem enviar. O
        relato contém os textos acima, o diagnóstico opcional exibido e as
        informações do aparelho. Não inclua senhas ou dados pessoais.
      </GentleNote>
      {error != null && <ErrorState error={error} />}
      {notice !== "" && <GentleNote>{notice}</GentleNote>}
      <PrimaryButton
        title={busy ? "Preparando relato…" : "Compartilhar relato"}
        disabled={busy}
        onPress={() => void share()}
      />
    </Screen>
  );
}
