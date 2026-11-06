import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  Screen,
  Title,
  Copy,
  Field,
  PrimaryButton,
  ErrorState,
} from "../components/ui";
import { db } from "../services/supabase";
export default function Callback() {
  const { code, error_description } = useLocalSearchParams<{
    code?: string;
    error_description?: string;
  }>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    async function complete() {
      try {
        if (error_description) throw new Error(error_description);
        if (code) {
          const r = await db().auth.exchangeCodeForSession(code);
          if (r.error) throw r.error;
        }
        const r = await db().auth.getSession();
        if (!r.data.session)
          throw new Error(
            "Link expirado ou sessão ausente. Solicite um novo e-mail neste dispositivo.",
          );
        if (active) setReady(true);
      } catch (e) {
        if (active) setError(e);
      }
    }
    void complete();
    return () => {
      active = false;
    };
  }, [code, error_description]);
  return (
    <Screen>
      <Title>Acesso à conta</Title>
      {!ready ? (
        <Copy>Verificando link…</Copy>
      ) : (
        <>
          <Copy>
            E-mail confirmado ou sessão recuperada. Você pode continuar ou
            definir uma nova senha.
          </Copy>
          <Field
            label="Nova senha (mínimo 8 caracteres)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <PrimaryButton
            title="Salvar nova senha"
            disabled={busy || password.length < 8}
            onPress={async () => {
              setBusy(true);
              setError(undefined);
              try {
                const r = await db().auth.updateUser({ password });
                if (r.error) throw r.error;
                setPassword("");
                setNotice("Senha atualizada.");
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          />
          <PrimaryButton
            title="Continuar"
            onPress={() => router.replace("/(tabs)")}
          />
        </>
      )}
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
    </Screen>
  );
}
