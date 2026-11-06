import { useState } from "react";
import { Card, Field, PrimaryButton, Copy, ErrorState } from "./ui";
import { db } from "../services/supabase";
import { userId } from "../services/catalog";
export function PlaceActions({ id }: { id: string }) {
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(report: boolean) {
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      const uid = await userId();
      if (report) {
        const r = await db().from("ugc_reports").insert({
          reporter_id: uid,
          target_type: "places",
          target_id: id,
          reason: reason.trim(),
        });
        if (r.error) throw r.error;
        setNotice("Denúncia enviada para revisão.");
        setReason("");
      } else {
        const exists = await db()
          .from("favorites")
          .select("place_id")
          .eq("user_id", uid)
          .eq("place_id", id)
          .maybeSingle();
        if (exists.error) throw exists.error;
        const r = exists.data
          ? await db()
              .from("favorites")
              .delete()
              .eq("user_id", uid)
              .eq("place_id", id)
          : await db().from("favorites").insert({ user_id: uid, place_id: id });
        if (r.error) throw r.error;
        setNotice(
          exists.data ? "Removido dos favoritos." : "Salvo nos favoritos.",
        );
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function follow() {
    setBusy(true);
    setError(undefined);
    try {
      const uid = await userId();
      const old = await db()
        .from("place_follows")
        .select("place_id")
        .eq("user_id", uid)
        .eq("place_id", id)
        .maybeSingle();
      if (old.error) throw old.error;
      const result = old.data
        ? await db()
            .from("place_follows")
            .delete()
            .eq("user_id", uid)
            .eq("place_id", id)
        : await db()
            .from("place_follows")
            .insert({ user_id: uid, place_id: id });
      if (result.error) throw result.error;
      setNotice(
        old.data
          ? "Você deixou de seguir este lugar."
          : "Lugar seguido. Preferências controlam atualizações; push ainda não habilitado.",
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <PrimaryButton
        title="Seguir / deixar de seguir"
        disabled={busy}
        onPress={() => void follow()}
      />
      <PrimaryButton
        title="Salvar / remover favorito"
        disabled={busy}
        onPress={() => void act(false)}
      />
      <Field
        label="Motivo da denúncia do lugar"
        value={reason}
        onChangeText={setReason}
        maxLength={500}
      />
      <PrimaryButton
        title="Enviar denúncia"
        disabled={busy || reason.trim().length < 5}
        onPress={() => void act(true)}
      />
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
    </Card>
  );
}
