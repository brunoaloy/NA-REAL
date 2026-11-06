import { randomUUID } from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { Platform } from "react-native";
import { db } from "./supabase";
import { userId } from "./catalog";
export type PreparedPhoto = { uri: string; bytes: ArrayBuffer };
export async function preparePhoto(
  camera = false,
): Promise<PreparedPhoto | null> {
  await userId();
  const permission = camera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted)
    throw new Error("Permissão negada. Você pode continuar sem fotografia.");
  const selected = camera
    ? await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
        exif: false,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        exif: false,
      });
  if (selected.canceled) return null;
  const source = selected.assets[0];
  const context = ImageManipulator.manipulate(source.uri);
  context.resize(
    source.width >= source.height
      ? { width: Math.min(source.width, 1600) }
      : { height: Math.min(source.height, 1600) },
  );
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.75,
  });
  // Re-encode pixels, never copy source EXIF/location metadata.
  const bytes =
    Platform.OS === "web"
      ? await (await fetch(saved.uri)).arrayBuffer()
      : await new File(saved.uri).arrayBuffer();
  if (bytes.byteLength > 5242880)
    throw new Error("A foto excede 5 MB após compressão.");
  return { uri: saved.uri, bytes };
}
export async function uploadPreparedPhoto(
  target: { placeId?: string; reviewId?: string; profileId?: string },
  prepared: PreparedPhoto,
) {
  if (
    [target.placeId, target.reviewId, target.profileId].filter(Boolean)
      .length !== 1
  )
    throw new Error("Selecione um destino para a foto.");
  const bytes = prepared.bytes;
  if (!bytes.byteLength || bytes.byteLength > 5242880)
    throw new Error("A foto deve ter até 5 MB.");
  const uid = await userId();
  const path = uid + "/" + randomUUID() + ".jpg";
  const row = await db()
    .from("photos")
    .insert({
      owner_id: uid,
      place_id: target.placeId,
      review_id: target.reviewId,
      profile_id: target.profileId,
      object_path: path,
      byte_size: bytes.byteLength,
    })
    .select("id")
    .single();
  if (row.error) throw row.error;
  const uploaded = await db()
    .storage.from("community-photos")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (uploaded.error) {
    await db().from("photos").delete().eq("id", row.data.id);
    throw uploaded.error;
  }
  return true;
}
