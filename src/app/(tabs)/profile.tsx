import { PhotoPicker, PhotoGallery } from "../../components/photos";
import { ModerationPhoto } from "../../components/moderation-photo";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Screen,
  Title,
  Copy,
  Field,
  Card,
  PrimaryButton,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { AppHeader, StatusChip } from "../../components/design";
import { useSession } from "../../hooks/use-session";
import { db, supabase } from "../../services/supabase";
export default function Profile() {
  const session = useSession();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["my-profile", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const uid = session!.user.id;
      const p = await db()
        .from("profiles")
        .select("display_name,handle,bio,moderation_state")
        .eq("id", uid)
        .maybeSingle();
      const favorites = await db()
        .from("favorites")
        .select("place_id,places(id,name,city)")
        .eq("user_id", uid)
        .limit(50);
      const reviews = await db()
        .from("reviews")
        .select("id,place_id,rating,body,moderation_state")
        .eq("author_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);
      const items = await db()
        .from("moderation_items")
        .select("id,target_type,state,created_at")
        .eq("author_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);
      const photos = await db()
        .from("photos")
        .select("id,object_path,moderation_state")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false })
        .limit(30);
      if (photos.error) throw photos.error;
      const account = await db()
        .from("safe_accounts")
        .select("suspended,reason")
        .eq("user_id", uid)
        .maybeSingle();
      if (
        p.error ||
        favorites.error ||
        reviews.error ||
        items.error ||
        account.error
      )
        throw (
          p.error ??
          favorites.error ??
          reviews.error ??
          items.error ??
          account.error
        );
      return {
        profile: p.data,
        favorites: favorites.data.map((f) => ({
          ...f,
          places: (Array.isArray(f.places) ? f.places[0] : f.places) as {
            id: string;
            name: string;
            city: string;
          } | null,
        })),
        reviews: reviews.data,
        items: items.data,
        account: account.data,
        photos: photos.data,
      };
    },
  });
  async function save() {
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      const uid = session!.user.id;
      const value = {
        display_name: name.trim(),
        handle: handle.trim().toLowerCase(),
        bio: bio.trim(),
      };
      const r = q.data?.profile
        ? await db().from("profiles").update(value).eq("id", uid)
        : await db()
            .from("profiles")
            .insert({ id: uid, ...value });
      if (r.error) throw r.error;
      setNotice(
        "Perfil salvo para análise. Novos textos não ficam públicos antes da revisão.",
      );
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <AppHeader title="Meu perfil" />
      {!session ? (
        <>
          <Copy>Entre para contribuir com a comunidade.</Copy>
          <PrimaryButton
            title="Entrar / cadastrar"
            onPress={() => router.push("/auth")}
          />
        </>
      ) : (
        <>
          {q.isError && <ErrorState error={q.error} />}
          {q.isPending && <Copy>Carregando contribuições…</Copy>}
          {q.data?.account?.suspended && (
            <Card>
              <Title>Conta suspensa</Title>
              <Copy>{q.data.account.reason}</Copy>
              <Field
                label="Motivo para revisar suspensão"
                value={reason}
                onChangeText={setReason}
                maxLength={1000}
              />
              <PrimaryButton
                title="Solicitar revisão da suspensão"
                disabled={busy || reason.trim().length < 5}
                onPress={async () => {
                  setBusy(true);
                  setError(undefined);
                  try {
                    const r = await db()
                      .from("account_appeals")
                      .insert({ user_id: session.user.id, reason });
                    if (r.error) throw r.error;
                    setNotice(
                      "Pedido de revisão registrado. A suspensão permanece até decisão humana.",
                    );
                  } catch (e) {
                    setError(e);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </Card>
          )}
          <Card>
            <PhotoGallery profileId={session.user.id} compact />
            <Title>{q.data?.profile?.display_name ?? "Seu perfil"}</Title>
            {q.data?.profile && (
              <StatusChip state={q.data.profile.moderation_state} />
            )}
            <Field
              label="Nome público"
              placeholder={q.data?.profile?.display_name ?? "Seu nome"}
              value={name}
              onChangeText={setName}
              maxLength={80}
            />
            <Field
              label="Identificador (3–30 letras, números ou _)"
              placeholder={q.data?.profile?.handle ?? "seu_nome"}
              autoCapitalize="none"
              value={handle}
              onChangeText={setHandle}
              maxLength={30}
            />
            <Field
              label="Sobre você (opcional)"
              value={bio}
              onChangeText={setBio}
              maxLength={300}
            />
            <PrimaryButton
              title="Carregar dados atuais para editar"
              onPress={() => {
                setName(q.data?.profile?.display_name ?? "");
                setHandle(q.data?.profile?.handle ?? "");
                setBio(q.data?.profile?.bio ?? "");
              }}
            />
            <PrimaryButton
              title="Salvar perfil para análise"
              disabled={
                busy ||
                name.trim().length < 1 ||
                !/^[a-z0-9_]{3,30}$/.test(handle)
              }
              onPress={() => void save()}
            />
          </Card>
          {q.data?.profile && <PhotoPicker profileId={session.user.id} />}
          <Title>Lugares favoritos</Title>
          {q.data?.favorites.length === 0 && (
            <EmptyState text="Você ainda não salvou lugares." />
          )}
          {q.data?.favorites.map((f) => (
            <Card key={f.place_id}>
              <Copy>{f.places?.name ?? "Lugar indisponível"}</Copy>
              {f.places && (
                <PrimaryButton
                  title="Ver lugar"
                  onPress={() =>
                    router.push({
                      pathname: "/place/[id]",
                      params: { id: f.place_id },
                    })
                  }
                />
              )}
            </Card>
          ))}
          <Title>Minhas avaliações</Title>
          {q.data?.reviews.map((review) => (
            <Card key={review.id}>
              <Copy>
                {"★".repeat(review.rating)} · {review.body}
              </Copy>
              <StatusChip state={review.moderation_state} />
              <PrimaryButton
                title="Abrir lugar para editar"
                onPress={() =>
                  router.push({
                    pathname: "/place/[id]",
                    params: { id: review.place_id },
                  })
                }
              />
            </Card>
          ))}
          <Title>Minhas fotos</Title>
          {q.data?.photos.map((photo) => (
            <Card key={photo.id}>
              <StatusChip state={photo.moderation_state} />
              <ModerationPhoto path={photo.object_path} />
              <PrimaryButton
                title="Remover minha foto e arquivo"
                disabled={busy}
                onPress={async () => {
                  setBusy(true);
                  setError(undefined);
                  try {
                    const r = await db().functions.invoke("delete-photo", {
                      body: { id: photo.id },
                    });
                    if (r.error) throw r.error;
                    if (r.data?.deleted !== true)
                      throw new Error("Remoção não confirmada");
                    await qc.invalidateQueries();
                  } catch (e) {
                    setError(e);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </Card>
          ))}
          <Title>Minhas contribuições e decisões</Title>
          <Field
            label="Motivo da contestação"
            value={reason}
            onChangeText={setReason}
            maxLength={1000}
          />
          {q.data?.items.map((i) => (
            <Card key={i.id}>
              <Copy>
                {i.target_type} ·{" "}
                {new Date(i.created_at).toLocaleString("pt-BR")}
              </Copy>
              <StatusChip state={i.state} />
              {["rejected", "removed"].includes(i.state) && (
                <PrimaryButton
                  title="Contestar decisão"
                  disabled={busy || reason.trim().length < 5}
                  onPress={async () => {
                    setError(undefined);
                    setBusy(true);
                    try {
                      const result = await db()
                        .from("moderation_appeals")
                        .insert({
                          item_id: i.id,
                          author_id: session.user.id,
                          reason,
                        });
                      if (result.error) throw result.error;
                      setNotice("Contestação registrada para revisão humana.");
                    } catch (e) {
                      setError(e);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}
            </Card>
          ))}
          <PrimaryButton
            title="Sair"
            onPress={async () => {
              await supabase?.auth.signOut();
              qc.clear();
            }}
          />
        </>
      )}
      {notice !== "" && <Copy>{notice}</Copy>}
      {error != null && <ErrorState error={error} />}
      <PrimaryButton
        title="Privacidade e configurações"
        onPress={() => router.push("/settings")}
      />
    </Screen>
  );
}
