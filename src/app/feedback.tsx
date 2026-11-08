import { useRef, useState } from "react";
import { Platform, Share, Text, View } from "react-native";
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
  const [screen, setScreen] = useState(""),
    [description, setDescription] = useState(""),
    [expected, setExpected] = useState("");
  const [error, setError] = useState<unknown>(),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const locked = useRef(false);
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
      <GentleNote>
        Você escolhe por qual aplicativo compartilhar e para quem enviar. O
        relato contém somente os textos acima e as informações exibidas do
        aparelho. Não inclua senhas ou dados pessoais.
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
