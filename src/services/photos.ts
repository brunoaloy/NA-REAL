import { localDiagnostics } from "../validation/diagnostics";
import { deliverPhoto } from "../validation/photo-delivery";
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
  avatar = false,
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
        allowsEditing: avatar,
        aspect: [1, 1],
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
        exif: false,
        allowsEditing: avatar,
        aspect: [1, 1],
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
const receipts = new WeakMap<PreparedPhoto, Map<string, string>>();
export async function uploadPreparedPhoto(
  target: { placeId?: string; reviewId?: string; profileId?: string },
  prepared: PreparedPhoto,
  expectedOwner?: string,
) {
  if (
    [target.placeId, target.reviewId, target.profileId].filter(Boolean)
      .length !== 1
  )
    throw new Error("Selecione um destino para a foto.");
  const bytes = prepared.bytes;
  if (!bytes.byteLength || bytes.byteLength > 5242880)
    throw new Error("A foto deve ter até 5 MB.");
  const uid = await userId(expectedOwner);
  const targetKey = JSON.stringify([
    uid,
    target.placeId,
    target.reviewId,
    target.profileId,
  ]);
  let targets = receipts.get(prepared);
  if (!targets) {
    targets = new Map();
    receipts.set(prepared, targets);
  }
  let path = targets.get(targetKey);
  if (!path) {
    path = uid + "/" + randomUUID() + ".jpg";
    targets.set(targetKey, path);
  }
  const objectPath = path;
  const findMetadata = () =>
    db()
      .from("photos")
      .select("id")
      .eq("owner_id", uid)
      .eq("object_path", objectPath)
      .maybeSingle();
  try {
    await deliverPhoto({
      ensureMetadata: async () => {
        const existing = await findMetadata();
        if (existing.error) throw existing.error;
        if (existing.data?.id) return;
        const row = await db()
          .from("photos")
          .insert({
            owner_id: uid,
            place_id: target.placeId,
            review_id: target.reviewId,
            profile_id: target.profileId,
            object_path: objectPath,
            byte_size: bytes.byteLength,
          })
          .select("id")
          .single();
        if (row.error) {
          const recovered = await findMetadata();
          if (recovered.error || !recovered.data?.id) throw row.error;
        }
      },
      upload: () =>
        db().storage.from("community-photos").upload(objectPath, bytes, {
          contentType: "image/jpeg",
          upsert: false,
        }),
      exists: async () => {
        const filename = objectPath.slice(uid.length + 1);
        const listed = await db()
          .storage.from("community-photos")
          .list(uid, { search: filename, limit: 10 });
        if (listed.error) throw listed.error;
        return listed.data.some(
          (file) =>
            file.name === filename &&
            Number(file.metadata?.size) === bytes.byteLength,
        );
      },
    });
  } catch (error) {
    localDiagnostics.record("photo_upload", error);
    throw error;
  }
  return true;
}
