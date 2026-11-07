import { Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { db } from "../services/supabase";
export function ProfileAvatar({
  ownerId,
  preview,
  size = 96,
}: {
  ownerId: string;
  preview?: string;
  size?: number;
}) {
  const q = useQuery({
    queryKey: ["profile-avatar", ownerId],
    queryFn: async () => {
      const result = await db()
        .from("photos")
        .select(
          "id,object_path,moderation_state,owner_id,content_revision,sanitized_at",
        )
        .eq("profile_id", ownerId)
        .eq("owner_id", ownerId)
        .in("moderation_state", ["approved", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return null;
      const photo = result.data;
      const approved =
        photo.moderation_state === "approved" && photo.sanitized_at;
      const signed = await db()
        .storage.from(approved ? "reviewed-photos" : "community-photos")
        .createSignedUrl(
          approved
            ? `${ownerId}/${photo.content_revision}.jpg`
            : photo.object_path,
          120,
        );
      if (signed.error) throw signed.error;
      return {
        uri: signed.data.signedUrl,
        pending: photo.moderation_state === "pending",
      };
    },
    staleTime: 90000,
  });
  const uri = preview || q.data?.uri;
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#DDEFE4",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {uri ? (
          <Image
            accessibilityLabel={
              preview ? "Prévia da sua foto" : "Sua foto de perfil"
            }
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Ionicons name="person-outline" size={size * 0.43} color="#0F766E" />
        )}
      </View>
      {q.data?.pending && !preview && (
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            color: "#64748B",
          }}
        >
          Foto em análise
        </Text>
      )}
    </View>
  );
}
