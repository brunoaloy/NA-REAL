import { useRef, useState } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { createURL } from "expo-linking";
import { db } from "../services/supabase";
import { errorMessage } from "../validation/errors";
import { authInput, type AuthMode } from "../validation/auth";
import {
  AuthButton,
  AuthField,
  AuthNotice,
  AuthShell,
  Brand,
  styles,
} from "./auth-design";
export default function AuthForm({ mode }: { mode: AuthMode }) {
  const params = useLocalSearchParams<{ start?: string }>();
  const start = params.start === "1" ? "1" : undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const locked = useRef(false);
  const signup = mode === "signup",
    reset = mode === "reset";
  function go(pathname: "/auth" | "/signup") {
    if (reset && pathname === "/auth" && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({ pathname, params: start ? { start } : {} });
  }
  function edit(setter: (v: string) => void, value: string) {
    setError("");
    setter(value);
  }
  async function submit() {
    if (locked.current) return;
    setError("");
    let input;
    try {
      input = authInput(mode, { email, password, confirmation });
    } catch (e) {
      setError(errorMessage(e));
      return;
    }
    Keyboard.dismiss();
    locked.current = true;
    setBusy(true);
    try {
      const client = db();
      const result =
        mode === "login"
          ? await client.auth.signInWithPassword({
              email: input.email,
              password: input.password,
            })
          : signup
            ? await client.auth.signUp({
                email: input.email,
                password: input.password,
                options: { emailRedirectTo: createURL("auth-callback") },
              })
            : await client.auth.resetPasswordForEmail(input.email, {
                redirectTo: createURL("auth-callback", {
                  queryParams: { recovery: "1" },
                }),
              });
      if (result.error) throw result.error;
      setPassword("");
      setConfirmation("");
      if (
        mode === "login" ||
        (signup && "session" in result.data && result.data.session)
      ) {
        if (start || !router.canGoBack()) router.replace("/(tabs)");
        else router.back();
        return;
      }
      setEmail(input.email);
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthShell>
      <Brand />
      {sent ? (
        <>
          <Text accessibilityRole="header" style={styles.heading}>
            Confira seu e-mail.
          </Text>
          <Text style={styles.subtitle}>
            {reset
              ? "Se houver uma conta com esse e-mail, você receberá instruções para recuperar o acesso."
              : "Abra a mensagem de confirmação e siga as instruções. Depois, volte ao app para entrar."}
          </Text>
          <View style={{ gap: 20, marginTop: 30 }}>
            <AuthNotice success>
              {reset
                ? "Solicitação recebida. Confira também a pasta de spam."
                : `Confira a caixa de entrada de ${email}.`}
            </AuthNotice>
            <AuthButton
              title={signup ? "Já confirmei, entrar" : "Voltar para entrar"}
              onPress={() => go("/auth")}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSent(false);
                setError("");
              }}
              style={styles.switchRow}
            >
              <Text style={styles.link}>Usar outro e-mail</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.heading}>
            {signup
              ? "Seu olhar faz a diferença."
              : reset
                ? "Vamos recuperar seu acesso."
                : "Que bom ter você aqui."}
          </Text>
          <Text style={styles.subtitle}>
            {signup
              ? "Crie sua conta e faça parte da comunidade."
              : reset
                ? "Informe seu e-mail para receber as instruções."
                : "Entre para continuar suas descobertas."}
          </Text>
          <View style={styles.form}>
            <AuthField
              label="E-mail"
              placeholder="voce@exemplo.com"
              value={email}
              onChangeText={(v) => edit(setEmail, v)}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              maxLength={254}
              editable={!busy}
              returnKeyType={reset ? "send" : "next"}
              onSubmitEditing={reset ? () => void submit() : undefined}
            />
            {!reset && (
              <View style={{ gap: 5 }}>
                <AuthField
                  label="Senha"
                  password
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(v) => edit(setPassword, v)}
                  textContentType={signup ? "newPassword" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  editable={!busy}
                  returnKeyType={signup ? "next" : "go"}
                  onSubmitEditing={!signup ? () => void submit() : undefined}
                />
                {signup && (
                  <Text style={styles.helper}>
                    Use pelo menos 8 caracteres.
                  </Text>
                )}
              </View>
            )}
            {signup && (
              <AuthField
                label="Confirmar senha"
                password
                confirmation
                placeholder="••••••••"
                value={confirmation}
                onChangeText={(v) => edit(setConfirmation, v)}
                textContentType="newPassword"
                autoComplete="new-password"
                editable={!busy}
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
              />
            )}
            {mode === "login" && (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/recover",
                    params: start ? { start } : {},
                  })
                }
                disabled={busy}
                style={{
                  alignSelf: "flex-end",
                  paddingVertical: 6,
                  minHeight: 32,
                }}
              >
                <Text style={styles.link}>Esqueci minha senha</Text>
              </Pressable>
            )}
            {signup && (
              <Text
                style={[
                  styles.helper,
                  {
                    fontSize: 12,
                    lineHeight: 20,
                    textAlign: "center",
                    marginVertical: 2,
                  },
                ]}
              >
                Ao criar sua conta, você concorda com os{" "}
                <Text
                  accessibilityRole="link"
                  onPress={() =>
                    router.push({
                      pathname: "/legal",
                      params: { kind: "terms" },
                    })
                  }
                  style={[
                    styles.link,
                    { fontSize: 12, textDecorationLine: "underline" },
                  ]}
                >
                  Termos de Uso
                </Text>{" "}
                e a{" "}
                <Text
                  accessibilityRole="link"
                  onPress={() =>
                    router.push({
                      pathname: "/legal",
                      params: { kind: "privacy" },
                    })
                  }
                  style={[
                    styles.link,
                    { fontSize: 12, textDecorationLine: "underline" },
                  ]}
                >
                  Política de Privacidade.
                </Text>
              </Text>
            )}
            {error !== "" && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}
            <View style={{ marginTop: signup ? 0 : 12 }}>
              <AuthButton
                title={
                  signup
                    ? "Criar minha conta"
                    : reset
                      ? "Enviar instruções"
                      : "Entrar"
                }
                onPress={() => void submit()}
                busy={busy}
              />
            </View>
            {signup && (
              <AuthNotice>Confirme seu e-mail para começar.</AuthNotice>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={signup || reset ? "Entrar" : "Criar conta"}
            disabled={busy}
            onPress={() => go(signup || reset ? "/auth" : "/signup")}
            style={styles.switchRow}
          >
            <Text style={styles.switchText}>
              {signup
                ? "Já tem uma conta? "
                : reset
                  ? "Lembrou sua senha? "
                  : "Ainda não tem conta? "}
              <Text style={styles.link}>
                {signup || reset ? "Entrar" : "Criar conta"}
              </Text>
            </Text>
          </Pressable>
        </>
      )}
      {!signup && (
        <Text style={styles.footer}>
          Descubra lugares. Compartilhe experiências.
        </Text>
      )}
    </AuthShell>
  );
}
