import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Brand, AuthButton, AuthField, AuthShell, styles } from "./auth-design";
import { Copy, ErrorState } from "./ui";
import { GentleNote, QuietButton, m } from "./member-design";
import { ModerationPanel } from "../app/admin";
import { useSession } from "../hooks/use-session";
import { useModerator } from "../hooks/use-moderator";
import { db, configured } from "../services/supabase";
import { authInput } from "../validation/auth";
import { moderationAccess } from "../validation/moderation-access";

export default function ModerationPortal() {
  const session = useSession();
  const role = useModerator(session?.user.id);
  const access = moderationAccess(Boolean(session), role);
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const locked = useRef(false);

  async function login() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const input = authInput("login", { email, password });
      const result = await db().auth.signInWithPassword(input);
      if (result.error) throw result.error;
      setPassword("");
      // Role and queue access are checked on the server for this session.
      await qc.invalidateQueries({ queryKey: ["moderator-access"] });
    } catch (e) {
      setError(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const r = await db().auth.signOut({ scope: "local" });
      if (r.error) throw r.error;
      qc.clear();
      setPassword("");
    } catch (e) {
      setError(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  if (session && access === "granted") {
    return (
      <View style={{ flex: 1 }}>
        {error != null && <ErrorState error={error} />}
        <ModerationPanel
          key={session.user.id}
          onSignOut={() => void logout()}
        />
      </View>
    );
  }
  return (
    <AuthShell hideBack>
      <View style={{ alignItems: "center", paddingTop: 48 }}>
        <Brand />
      </View>
      <Text style={styles.heading}>Cuidar também é descobrir.</Text>
      <Text style={styles.subtitle}>
        O mesmo NA REAL. Um espaço para revisar as descobertas da comunidade.
      </Text>
      <View style={styles.form}>
        <Text style={[styles.label, { textAlign: "center", color: "#0F766E" }]}>
          PAINEL DE MODERAÇÃO
        </Text>
        {!configured ? (
          <GentleNote>
            O painel ainda precisa da conexão com o NA REAL. Configure a URL e a
            chave publicável antes de iniciar.
          </GentleNote>
        ) : session ? (
          <>
            <Copy>
              Conta conectada: {session.user.email ?? "conta NA REAL"}
            </Copy>
            {access === "checking" ? (
              <Copy>Verificando sua permissão…</Copy>
            ) : access === "unavailable" ? (
              <ErrorState error={role.error} />
            ) : (
              <GentleNote>
                Sua conta está conectada, mas ainda não foi autorizada para
                moderação. O responsável pelo projeto precisa liberar seu
                usuário no Supabase.
              </GentleNote>
            )}
            <QuietButton
              title="Verificar permissão novamente"
              disabled={role.isFetching || busy}
              onPress={() => void role.refetch()}
            />
            <QuietButton
              title="Sair desta conta"
              disabled={busy}
              onPress={() => void logout()}
            />
          </>
        ) : (
          <>
            <Copy>
              Entre com sua conta atual do NA REAL. Apenas moderadores
              autorizados podem acessar a fila.
            </Copy>
            <AuthField
              label="E-mail"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
            />
            <AuthField
              label="Senha"
              password
              autoComplete="current-password"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              editable={!busy}
              onSubmitEditing={() => void login()}
            />
            <AuthButton
              title="Entrar na moderação"
              busy={busy}
              onPress={() => void login()}
            />
            <Copy>
              Esqueceu a senha? Use “Esqueci minha senha” na tela de entrada do
              aplicativo NA REAL.
            </Copy>
          </>
        )}
        {error != null && <ErrorState error={error} />}
      </View>
      <Text style={m.small}>
        Acesso reservado à equipe de moderação do NA REAL.
      </Text>
    </AuthShell>
  );
}
