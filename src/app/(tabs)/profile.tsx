import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Session } from "@supabase/supabase-js";
import {
  Screen,
  Copy,
  Field,
  Card,
  PrimaryButton,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { AppHeader } from "../../components/design";
import { AuthShell } from "../../components/auth-design";
import {
  ActionRow,
  GentleNote,
  ProfileCover,
  QuietButton,
  WarmIntro,
  m,
} from "../../components/member-design";
import {
  ContributionReview,
  ContributionStatus,
} from "../../components/contribution-tracking";
import { contributionTitle } from "../../validation/contributions";
import { ProfileAvatar } from "../../components/profile-avatar";
import { ModerationPhoto } from "../../components/moderation-photo";
import { useModerator } from "../../hooks/use-moderator";
import { useSession } from "../../hooks/use-session";
import { db, supabase } from "../../services/supabase";
import { loadMyProfile } from "../../services/profile";
import {
  preparePhoto,
  uploadPreparedPhoto,
  type PreparedPhoto,
} from "../../services/photos";
import { profileInput } from "../../validation/profile";
export default function Profile() {
  const session = useSession();
  const params = useLocalSearchParams<{
    section?: string;
    sectionKey?: string;
  }>();
  return (
    <ProfileContent
      key={[
        session?.user.id ?? "visitor",
        params.section,
        params.sectionKey,
      ].join(":")}
      session={session}
      initialSection={params.section}
    />
  );
}
function ProfileContent({
  session,
  initialSection,
}: {
  session: Session | null;
  initialSection?: string;
}) {
  const qc = useQueryClient();
  const moderator = useModerator(session?.user.id);
  const [editing, setEditing] = useState(false),
    [advanced, setAdvanced] = useState(false);
  const [name, setName] = useState(""),
    [handle, setHandle] = useState(""),
    [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [section, setSection] = useState<string | null>(
      initialSection === "places" ? "places" : null,
    ),
    [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>(),
    [editError, setEditError] = useState<unknown>();
  const [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [picking, setPicking] = useState(false);
  const locked = useRef(false),
    savedOwner = useRef<string | null>(null);
  const q = useQuery({
    queryKey: ["my-profile", session?.user.id],
    enabled: Boolean(session),
    queryFn: () => loadMyProfile(session!.user.id),
  });
  function openEditor() {
    if (!q.data) return;
    setName(q.data.profile?.display_name ?? "");
    setBio(q.data.profile?.bio ?? "");
    setHandle(q.data.profile?.handle ?? "");
    setPhoto(null);
    setEditError(undefined);
    setAdvanced(false);
    setEditing(true);
  }
  async function selectPhoto(camera = false) {
    if (busy || picking) return;
    setPicking(true);
    setEditError(undefined);
    try {
      const selected = await preparePhoto(camera, true);
      if (selected) setPhoto(selected);
    } catch (e) {
      setEditError(e);
    } finally {
      setPicking(false);
    }
  }
  async function save() {
    if (!session || locked.current) return;
    setEditError(undefined);
    setNotice("");
    let value;
    try {
      value = profileInput({ name, bio, handle });
    } catch (e) {
      setEditError(e);
      return;
    }
    locked.current = true;
    setBusy(true);
    let textSaved = false;
    try {
      const write =
        q.data?.profile || savedOwner.current === session.user.id
          ? db().from("profiles").update(value).eq("id", session.user.id)
          : db()
              .from("profiles")
              .insert({ id: session.user.id, ...value });
      const result = await write
        .select("display_name,handle,bio,moderation_state")
        .single();
      if (result.error) throw result.error;
      if (!result.data)
        throw new Error(
          "Não foi possível confirmar o salvamento do perfil. Tente novamente.",
        );
      textSaved = true;
      savedOwner.current = session.user.id;
      if (photo)
        await uploadPreparedPhoto({ profileId: session.user.id }, photo);
      setPhoto(null);
      setEditing(false);
      setNotice(
        "Pronto! Seu perfil foi salvo. As alterações públicas passam por uma revisão antes de aparecer para outras pessoas.",
      );
    } catch (e) {
      setEditError(
        textSaved
          ? new Error(
              "Seu nome e sua descrição foram salvos, mas não conseguimos enviar a foto. Sua seleção foi mantida para tentar novamente.",
            )
          : e,
      );
    } finally {
      await qc.invalidateQueries({ queryKey: ["my-profile", session.user.id] });
      await qc.invalidateQueries({
        queryKey: ["profile-avatar", session.user.id],
      });
      await qc.invalidateQueries({ queryKey: ["photos"] });
      locked.current = false;
      setBusy(false);
    }
  }
  async function removePhoto(id: string) {
    setBusy(true);
    setError(undefined);
    try {
      const r = await db().functions.invoke("delete-photo", { body: { id } });
      if (r.error) throw r.error;
      if (r.data?.deleted !== true)
        throw new Error("Não foi possível confirmar a remoção da foto.");
      await qc.invalidateQueries();
      setNotice("Foto removida.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  function confirmRemoval(id: string) {
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Remover esta foto do seu perfil e das suas contribuições?",
        )
      )
        void removePhoto(id);
    } else
      Alert.alert("Remover foto?", "Esta ação remove a foto e o arquivo.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => void removePhoto(id),
        },
      ]);
  }
  async function appeal(itemId?: string, message = reason): Promise<boolean> {
    if (!session || locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const r = itemId
        ? await db().from("moderation_appeals").insert({
            item_id: itemId,
            author_id: session.user.id,
            reason: message.trim(),
          })
        : await db()
            .from("account_appeals")
            .insert({ user_id: session.user.id, reason: message.trim() });
      if (r.error) throw r.error;
      setReason("");
      setNotice(
        "Seu pedido foi recebido para revisão. A decisão atual continua válida até a análise.",
      );
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  const toggle = (value: string) =>
    setSection(section === value ? null : value);
  return (
    <Screen
      onRefresh={session ? () => void q.refetch() : undefined}
      refreshing={q.isRefetching}
    >
      <AppHeader title="Meu perfil" />
      {!session ? (
        <>
          <WarmIntro
            eyebrow="SEU CANTINHO NO NA REAL"
            title="Sua cidade tem a sua cara."
            body="Entre para salvar seus lugares favoritos e compartilhar o que você gosta por aqui."
          />
          <PrimaryButton
            title="Entrar / cadastrar"
            onPress={() => router.push("/auth")}
          />
        </>
      ) : (
        <>
          {q.isPending && <ActivityIndicator color="#0F766E" />}
          {q.isError && (
            <>
              <ErrorState error={q.error} />
              <QuietButton
                title="Tentar novamente"
                onPress={() => void q.refetch()}
              />
            </>
          )}
          <ProfileCover>
            <Text style={m.eyebrow}>SEU CANTINHO NO NA REAL</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Alterar foto de perfil"
              disabled={!q.data || busy}
              onPress={openEditor}
            >
              <ProfileAvatar ownerId={session.user.id} />
              <View
                style={{
                  position: "absolute",
                  top: 67,
                  right: 0,
                  width: 29,
                  height: 29,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#0F766E",
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                }}
              >
                <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text
              accessibilityRole="header"
              style={[m.heading, { textAlign: "center" }]}
            >
              {q.data?.profile?.display_name ?? "Vamos deixar com a sua cara?"}
            </Text>
            {q.data?.profile?.handle && (
              <Text style={m.small}>@{q.data.profile.handle}</Text>
            )}
            <Text style={[m.body, { textAlign: "center" }]}>
              {q.data?.profile?.bio ||
                "Uma foto, seu nome e um pouquinho sobre você. Simples assim."}
            </Text>
            <View style={{ alignSelf: "stretch" }}>
              <PrimaryButton
                title="Editar perfil"
                disabled={!q.data || busy}
                onPress={openEditor}
              />
            </View>
          </ProfileCover>
          {notice !== "" && <GentleNote>{notice}</GentleNote>}
          {error != null && <ErrorState error={error} />}
          {q.data?.account?.suspended && (
            <Card>
              <Text style={m.section}>Vamos conversar sobre sua conta?</Text>
              <Copy>{q.data.account.reason}</Copy>
              <Field
                label="Conte por que devemos revisar"
                value={reason}
                onChangeText={setReason}
                multiline
                maxLength={1000}
              />
              <PrimaryButton
                title="Pedir revisão da conta"
                disabled={busy || reason.trim().length < 5}
                onPress={() => void appeal()}
              />
            </Card>
          )}
          <View style={{ gap: 4 }}>
            <Text
              accessibilityRole="header"
              style={[m.section, { marginTop: 4, marginBottom: 3 }]}
            >
              Suas descobertas
            </Text>
            <Text style={[m.small, { marginBottom: 8 }]}>
              Guarde os lugares. Compartilhe as histórias.
            </Text>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 22,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "#DFE9E3",
              }}
            >
              <ActionRow
                title="Lugares favoritos"
                detail="Para voltar sempre que der vontade"
                icon="heart-outline"
                expanded={section === "favorites"}
                onPress={() => toggle("favorites")}
              />
              {section === "favorites" && (
                <View style={{ gap: 12, paddingVertical: 14 }}>
                  {q.data?.favorites.length === 0 && (
                    <EmptyState
                      icon="heart-outline"
                      text="Salve um lugar no coração e ele aparece aqui."
                      action={{
                        title: "Encontrar um lugar",
                        onPress: () => router.push("/(tabs)"),
                      }}
                    />
                  )}
                  {q.data?.favorites.map((f) => (
                    <Card key={f.place_id}>
                      <Text style={m.label}>
                        {f.places?.name ?? "Lugar indisponível"}
                      </Text>
                      {f.places && (
                        <QuietButton
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
                </View>
              )}
              <ActionRow
                title="Lugares que compartilhei"
                detail="Abra seus cadastros, mesmo os que estão em análise"
                icon="location-outline"
                expanded={section === "places"}
                onPress={() => toggle("places")}
              />
              {section === "places" && (
                <View style={{ gap: 12, paddingVertical: 14 }}>
                  {q.data?.places.length === 0 && (
                    <EmptyState
                      icon="location-outline"
                      text="Sua próxima descoberta pode começar com um lugar que você conhece."
                      action={{
                        title: "Compartilhar um lugar",
                        onPress: () => router.push("/(tabs)/add"),
                      }}
                    />
                  )}
                  {q.data?.places.map((item) => (
                    <Card key={item.id}>
                      <Text style={m.label}>{item.name}</Text>
                      <Text style={m.small}>
                        {item.city}, {item.state}
                      </Text>
                      <ContributionStatus
                        state={item.moderation_state}
                        published={
                          item.verification_status === "approved" &&
                          !q.data?.account?.suspended
                        }
                      />
                      <QuietButton
                        title={"Abrir " + item.name}
                        onPress={() =>
                          router.push({
                            pathname: "/place/[id]",
                            params: { id: item.id },
                          })
                        }
                      />
                    </Card>
                  ))}
                </View>
              )}
              <ActionRow
                title="Minhas avaliações"
                detail="As experiências que você compartilhou"
                icon="star-outline"
                expanded={section === "reviews"}
                onPress={() => toggle("reviews")}
              />
              {section === "reviews" && (
                <View style={{ gap: 12, paddingVertical: 14 }}>
                  {q.data?.reviews.length === 0 && (
                    <EmptyState text="Sua primeira experiência pode ajudar muita gente." />
                  )}
                  {q.data?.reviews.map((review) => (
                    <Card key={review.id}>
                      <Copy>
                        {"★".repeat(review.rating)} · {review.body}
                      </Copy>
                      <ContributionStatus state={review.moderation_state} />
                      <QuietButton
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
                </View>
              )}
              <ActionRow
                title="Minhas fotos"
                detail="Suas memórias e descobertas"
                icon="images-outline"
                expanded={section === "photos"}
                onPress={() => toggle("photos")}
              />
              {section === "photos" && (
                <View style={{ gap: 12, paddingVertical: 14 }}>
                  {q.data?.photos.length === 0 && (
                    <EmptyState text="Você pode escolher sua foto tocando em Editar perfil." />
                  )}
                  {q.data?.photos.map((item) => (
                    <Card key={item.id}>
                      <ContributionStatus state={item.moderation_state} />
                      <ModerationPhoto path={item.object_path} />
                      <QuietButton
                        title="Remover minha foto"
                        disabled={busy}
                        onPress={() => confirmRemoval(item.id)}
                      />
                    </Card>
                  ))}
                </View>
              )}
              <ActionRow
                title="Acompanhar contribuições"
                detail="Veja o que foi publicado ou está em análise"
                icon="time-outline"
                expanded={section === "contributions"}
                onPress={() => toggle("contributions")}
              />
              {section === "contributions" && (
                <View style={{ gap: 12, paddingVertical: 14 }}>
                  {q.data?.items.length === 0 && (
                    <EmptyState text="Quando você compartilhar um lugar ou uma experiência, acompanhe por aqui." />
                  )}
                  {q.data?.items.map((item) => (
                    <Card key={item.id}>
                      <Text style={m.label}>{contributionTitle(item)}</Text>
                      <Text style={m.small}>
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </Text>
                      <ContributionReview
                        item={item}
                        busy={busy}
                        onAppeal={(value) => appeal(item.id, value)}
                      />
                      {item.target_type === "places" && item.target_id && (
                        <QuietButton
                          title="Ver cadastro"
                          onPress={() =>
                            router.push({
                              pathname: "/place/[id]",
                              params: { id: item.target_id! },
                            })
                          }
                        />
                      )}
                      {item.target_type === "reviews" && item.place_id && (
                        <QuietButton
                          title="Abrir lugar para editar avaliação"
                          onPress={() =>
                            router.push({
                              pathname: "/place/[id]",
                              params: { id: item.place_id!, tab: "Avaliações" },
                            })
                          }
                        />
                      )}
                      {item.target_type === "profiles" && (
                        <QuietButton
                          title="Editar meu perfil"
                          onPress={openEditor}
                        />
                      )}
                      {item.target_type === "photos" && (
                        <QuietButton
                          title="Ver minhas fotos"
                          onPress={() => setSection("photos")}
                        />
                      )}
                    </Card>
                  ))}
                </View>
              )}
            </View>
          </View>
        </>
      )}
      {moderator.data === true && (
        <ActionRow
          title="Moderação da comunidade"
          detail="Revisar lugares e contribuições pendentes"
          icon="shield-checkmark-outline"
          onPress={() => router.push("/admin")}
        />
      )}
      <ActionRow
        title="Privacidade e configurações"
        detail="Seu conforto e suas escolhas importam"
        icon="settings-outline"
        onPress={() => router.push("/settings")}
      />
      {session && (
        <QuietButton
          title="Sair da conta"
          onPress={async () => {
            const result = await supabase?.auth.signOut();
            if (result?.error) setError(result.error);
            else {
              qc.clear();
              setNotice("");
            }
          }}
        />
      )}
      <Modal
        visible={editing && Boolean(session)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!busy && !picking) setEditing(false);
        }}
      >
        <AuthShell
          onBack={() => {
            if (!busy && !picking) setEditing(false);
          }}
        >
          <WarmIntro
            eyebrow="DO SEU JEITINHO"
            title="Vamos deixar com a sua cara?"
            body="Escolha uma foto e conte um pouco sobre você. O resto vem com as descobertas."
          />
          {session && (
            <View style={{ alignItems: "center", gap: 12, marginVertical: 22 }}>
              <ProfileAvatar
                ownerId={session.user.id}
                preview={photo?.uri}
                size={108}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <QuietButton
                  title="Escolher foto"
                  disabled={busy || picking}
                  onPress={() => void selectPhoto()}
                />
                <QuietButton
                  title="Usar câmera"
                  disabled={busy || picking}
                  onPress={() => void selectPhoto(true)}
                />
              </View>
              {photo && (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => setPhoto(null)}
                  style={{ padding: 8 }}
                >
                  <Text style={m.small}>Desfazer seleção</Text>
                </Pressable>
              )}
            </View>
          )}
          <View style={{ gap: 18 }}>
            <Field
              label="Seu nome"
              placeholder="Como você quer ser chamado?"
              value={name}
              onChangeText={setName}
              maxLength={80}
              editable={!busy}
            />
            <Field
              label="Sobre você"
              style={{ minHeight: 90, textAlignVertical: "top" }}
              placeholder="O que você gosta de descobrir por aí?"
              value={bio}
              onChangeText={setBio}
              maxLength={300}
              multiline
              editable={!busy}
            />
            <Text style={[m.small, { textAlign: "right" }]}>
              {bio.length}/300
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: advanced }}
              onPress={() => setAdvanced(!advanced)}
              style={{ paddingVertical: 8 }}
            >
              <Text style={[m.small, { color: "#0F766E" }]}>
                Personalizar meu @ (opcional)
              </Text>
            </Pressable>
            {advanced && (
              <Field
                label="Nome de usuário (opcional)"
                value={handle}
                onChangeText={setHandle}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                editable={!busy}
                placeholder="seu_nome"
              />
            )}
            {editError != null && <ErrorState error={editError} />}
            <PrimaryButton
              title={busy ? "Salvando com carinho…" : "Salvar alterações"}
              disabled={busy || picking}
              onPress={() => void save()}
            />
            <GentleNote>
              Sua foto e seus textos passam por uma revisão antes de aparecer
              para outras pessoas. Você pode acompanhar por aqui.
            </GentleNote>
          </View>
        </AuthShell>
      </Modal>
    </Screen>
  );
}
