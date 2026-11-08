import { useState } from "react";
import { Text, View } from "react-native";
import { Field } from "./ui";
import { QuietButton, m } from "./member-design";
import {
  contributionStatus,
  contributionDecision,
  type Contribution,
} from "../validation/contributions";
export function ContributionStatus({
  state,
  published = false,
}: {
  state: string;
  published?: boolean;
}) {
  const status = contributionStatus(state);
  return (
    <Text
      style={{
        alignSelf: "flex-start",
        backgroundColor: status.background,
        color: status.color,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 7,
        fontFamily: "Inter_600SemiBold",
        fontSize: 12,
      }}
    >
      {published && state === "approved" ? "Publicado" : status.label}
    </Text>
  );
}
export function ContributionReview({
  item,
  busy,
  onAppeal,
}: {
  item: Contribution;
  busy: boolean;
  onAppeal: (value: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  const decision = contributionDecision(item),
    status = contributionStatus(item.state);
  return (
    <View style={{ gap: 12 }}>
      <ContributionStatus state={item.state} />
      <Text style={m.body}>{status.body}</Text>
      {decision !== "" && (
        <View style={{ gap: 5 }}>
          <Text style={m.label}>Motivo da revisão</Text>
          <Text style={m.body}>{decision}</Text>
        </View>
      )}
      {["rejected", "removed"].includes(item.state) && (
        <>
          <Field
            label="Conte por que devemos revisar"
            placeholder="Explique a correção ou por que discorda da decisão"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={1000}
            editable={!busy}
          />
          <QuietButton
            title="Pedir revisão"
            disabled={busy || reason.trim().length < 5}
            onPress={() => {
              void onAppeal(reason).then((ok) => {
                if (ok) setReason("");
              });
            }}
          />
        </>
      )}
    </View>
  );
}
