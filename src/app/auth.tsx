import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { createURL } from "expo-linking";
import { useState } from "react";
import {
  Screen,
  Title,
  Copy,
  Field,
  PrimaryButton,
  ErrorState,
} from "../components/ui";
import { db } from "../services/supabase";
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(action: "login" | "signup" | "reset") {
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      const client = db();
      const result =
        action === "login"
          ? await client.auth.signInWithPassword({ email, password })
          : action === "signup"
            ? await client.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: createURL("auth-callback") },
              })
            : await client.auth.resetPasswordForEmail(email, {
                redirectTo: createURL("auth-callback", {
                  queryParams: { recovery: "1" },
                }),
              });
      if (result.error) throw result.error;
      if (action === "login") {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)");
        return;
      }
      setNotice("Verifique seu e-mail para continuar.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <View style={{ alignItems: "center", paddingVertical: 24, gap: 16 }}>
        <Ionicons name="location" size={58} color="#0F766E" />
        <Title>na real.</Title>
      </View>
      <Copy>Crie sua conta. É rápido e gratuito.</Copy>
      <Field
        label="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error != null && <ErrorState error={error} />}
      <Copy>{notice}</Copy>
      {(["login", "signup", "reset"] as const).map((a, i) => (
        <PrimaryButton
          key={a}
          disabled={busy}
          title={["Entrar", "Criar conta", "Recuperar acesso"][i]}
          onPress={() => void run(a)}
        />
      ))}
      <Copy>
        Google e Apple não configurados. Recuperação de senha requer redirect
        web configurado no Supabase.
      </Copy>
    </Screen>
  );
}
