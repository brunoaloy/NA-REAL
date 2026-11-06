import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { View, Pressable, Text } from "react-native";
import { db } from "../services/supabase";
import { userId } from "../services/catalog";
import { Card, Copy, Field, PrimaryButton, ErrorState } from "./ui";
export function PlaceSuggestions({
  id,
  revision,
}: {
  id: string;
  revision: string;
}) {
  const [field, setField] = useState("address");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const history = useQuery({
    queryKey: ["my-suggestions", id],
    queryFn: async () => {
      const uid = await userId();
      const r = await db()
        .from("place_change_suggestions")
        .select("id,field,status,decision_reason")
        .eq("place_id", id)
        .eq("author_id", uid)
        .order("created_at", { ascending: false })
        .limit(20);
      if (r.error) throw r.error;
      return r.data;
    },
    retry: false,
  });
  return (
    <Card>
      <Copy>
        Sugerir correção — alterações só são aplicadas após revisão humana. Não
        inclua endereços residenciais privados ou dados pessoais.
      </Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          ["name", "Nome"],
          ["address", "Endereço"],
          ["description", "Descrição"],
          ["city", "Cidade"],
          ["state", "UF"],
          ["category", "Categoria"],
        ].map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: field === key }}
            onPress={() => setField(key)}
            style={{
              padding: 12,
              backgroundColor: field === key ? "#D1FAE5" : "#F1F5F9",
              borderRadius: 14,
            }}
          >
            <Text>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Field
        label="Valor proposto"
        value={value}
        onChangeText={setValue}
        maxLength={1000}
      />
      <Field
        label="Por que corrigir?"
        value={reason}
        onChangeText={setReason}
        maxLength={500}
      />
      <PrimaryButton
        title="Enviar sugestão para revisão"
        disabled={busy || !value.trim() || reason.trim().length < 5}
        onPress={async () => {
          setError(undefined);
          setNotice("");
          setBusy(true);
          try {
            const author_id = await userId();
            const r = await db()
              .from("place_change_suggestions")
              .insert({
                place_id: id,
                author_id,
                expected_revision: revision,
                field,
                proposed_value: value.trim(),
                reason: reason.trim(),
              });
            if (r.error) throw r.error;
            setNotice(
              "Sugestão recebida. O cadastro público permanece igual até revisão.",
            );
            setValue("");
            await qc.invalidateQueries({ queryKey: ["my-suggestions", id] });
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      />
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
      {history.data?.map((s) => (
        <Copy key={s.id}>
          {s.field}: {s.status}
          {s.decision_reason ? " • " + s.decision_reason : ""}
        </Copy>
      ))}
    </Card>
  );
}
