import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "../services/supabase";
import { userId } from "../services/catalog";
import { Field, PrimaryButton, Copy, ErrorState } from "./ui";
export function ContentActions({
  type,
  id,
  author,
}: {
  type: string;
  id: string;
  author?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  async function act(block: boolean) {
    setBusy(true);
    setError(undefined);
    try {
      const uid = await userId();
      const r = block
        ? await db()
            .from("user_blocks")
            .insert({ blocker_id: uid, blocked_id: author })
        : await db().from("ugc_reports").insert({
            reporter_id: uid,
            target_type: type,
            target_id: id,
            reason: reason.trim(),
          });
      if (r.error) throw r.error;
      setNotice(
        block
          ? "Usuário bloqueado. Interações ocultadas para esta conta."
          : "Denúncia registrada para revisão humana.",
      );
      setReason("");
      await qc.invalidateQueries();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          open ? "Fechar opções de segurança" : "Denunciar / bloquear"
        }
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{
          alignSelf: "flex-end",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          padding: 10,
          minHeight: 40,
        }}
      >
        <Ionicons name="ellipsis-horizontal" size={19} color="#64748B" />
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#64748B",
          }}
        >
          {open ? "Fechar opções" : "Mais opções"}
        </Text>
      </Pressable>
      {open && (
        <>
          <Field
            label="Motivo da denúncia"
            value={reason}
            onChangeText={setReason}
            maxLength={500}
          />
          <PrimaryButton
            title="Registrar denúncia"
            disabled={busy || reason.trim().length < 5}
            onPress={() => void act(false)}
          />
          {author && (
            <PrimaryButton
              title="Bloquear autor"
              disabled={busy}
              onPress={() => void act(true)}
            />
          )}
        </>
      )}
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
    </>
  );
}
