import { useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Switch, Text, View } from "react-native";
import { useSession } from "../../hooks/use-session";
import { db } from "../../services/supabase";
import {
  Screen,
  Field,
  PrimaryButton,
  ErrorState,
  Card,
} from "../../components/ui";
import { AppHeader, CategoryChips, PlaceCard } from "../../components/design";
import { PhotoPicker } from "../../components/photos";
import {
  GentleNote,
  QuietButton,
  WarmIntro,
  m,
} from "../../components/member-design";
import { addPlace, type Place } from "../../services/catalog";
import { findAddress } from "../../services/geocoding";
import {
  addressQuery,
  brazilPoint,
  type MapPoint,
} from "../../validation/geocoding";
import { placeInput } from "../../validation/domain";
import {
  mapCenter,
  normalizeFilters,
  emptyFilters,
} from "../../validation/explore";
export default function Add() {
  const session = useSession();
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    locationKey?: string;
  }>();
  const [form, setForm] = useState({
    name: "",
    category: "Comer",
    city: "",
    state: "",
    address: "",
    description: "",
  });
  const centerFromRoute = mapCenter(params);
  const routePoint = centerFromRoute
    ? brazilPoint({
        longitude: centerFromRoute[0],
        latitude: centerFromRoute[1],
      })
    : undefined;
  const locationKey = [
    params.latitude,
    params.longitude,
    params.locationKey,
  ].join(":");
  const [pointDraft, setPointDraft] = useState<{
    key: string;
    point?: MapPoint;
  }>();
  const point = pointDraft?.key === locationKey ? pointDraft.point : routePoint;
  function setPoint(value?: MapPoint) {
    setPointDraft({ key: locationKey, point: value });
  }
  const [isPublic, setPublic] = useState(false),
    [busy, setBusy] = useState(false),
    [locating, setLocating] = useState(false);
  const [error, setError] = useState<unknown>(),
    [created, setCreated] = useState("");
  const [duplicates, setDuplicates] = useState<Place[] | null>(null);
  const locked = useRef(false);
  function edit(key: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [key]: key === "state" ? value.toUpperCase() : value,
    }));
    setError(undefined);
    if (["name", "city", "state"].includes(key)) setDuplicates(null);
    if (["city", "state", "address"].includes(key)) setPoint(undefined);
  }
  async function locateAddress() {
    if (locating || busy) return;
    setError(undefined);
    try {
      normalizeFilters({ ...emptyFilters, city: form.city, state: form.state });
      if (form.address.trim().length < 5 || form.city.trim().length < 2)
        throw new Error(
          "Preencha o endereço e a cidade para encontrar a entrada.",
        );
      setLocating(true);
      setPoint(
        await findAddress(addressQuery(form.address, form.city, form.state)),
      );
    } catch (e) {
      setError(e);
    } finally {
      setLocating(false);
    }
  }
  async function submit(allowSimilar = false) {
    if (locked.current || !session) return;
    setError(undefined);
    setBusy(true);
    locked.current = true;
    try {
      const value = placeInput.parse({
        ...form,
        is_public_venue: isPublic,
        ...(point ?? {}),
      });
      const result = await db().rpc("duplicate_candidates", {
        term: value.name,
        city_input: value.city,
        state_input: value.state,
      });
      if (result.error) throw result.error;
      if (result.data?.length && !allowSimilar) {
        setDuplicates(result.data);
        return;
      }
      const id = await addPlace(value);
      setCreated(id);
      router.push({ pathname: "/place/[id]", params: { id } });
    } catch (e) {
      setError(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  if (!session)
    return (
      <Screen>
        <AppHeader title="Adicionar um lugar" />
        <WarmIntro
          eyebrow="UMA DESCOBERTA SUA. DE TODOS."
          title="Tem um cantinho especial?"
          body="Entre para compartilhar aquele lugar que merece ser conhecido e acompanhar as novidades."
        />
        <PrimaryButton
          title="Entrar para adicionar lugar"
          onPress={() => router.push("/auth")}
        />
      </Screen>
    );
  if (created)
    return (
      <Screen>
        <AppHeader title="Seu lugar foi enviado" />
        <WarmIntro
          eyebrow="OBRIGADO POR COMPARTILHAR"
          title="Uma descoberta que vai mais longe."
          body="Recebemos o cadastro. Ele passa por uma revisão antes de aparecer para a comunidade."
        />
        <Card>
          <Text style={m.section}>Uma foto conta um pouquinho mais</Text>
          <PhotoPicker placeId={created} />
        </Card>
        <QuietButton
          title="Abrir lugar cadastrado"
          onPress={() =>
            router.push({ pathname: "/place/[id]", params: { id: created } })
          }
        />
        <PrimaryButton
          title="Adicionar outro lugar"
          onPress={() => {
            setCreated("");
            setForm({
              name: "",
              category: "Comer",
              city: "",
              state: "",
              address: "",
              description: "",
            });
            setPoint(undefined);
            setPublic(false);
            setDuplicates(null);
            setError(undefined);
          }}
        />
      </Screen>
    );
  return (
    <Screen>
      <AppHeader title="Adicionar um lugar" />
      <WarmIntro
        eyebrow="COMPARTILHE UMA BOA DESCOBERTA"
        title="Qual lugar ganhou seu coração?"
        body="Conte o básico. A gente confere se ele já está por aqui antes de enviar para análise."
      />
      <Card>
        <Field
          label="Nome do lugar"
          placeholder="Como ele se chama?"
          value={form.name}
          onChangeText={(v) => edit("name", v)}
          maxLength={120}
          editable={!busy && !locating}
        />
        <Text style={m.label}>O que você encontra por lá?</Text>
        <CategoryChips
          includeAll={false}
          compact
          value={form.category}
          onChange={(v) => {
            if (v !== "Todos" && !busy) edit("category", v);
          }}
        />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Cidade"
              placeholder="Sua cidade"
              value={form.city}
              onChangeText={(v) => edit("city", v)}
              maxLength={100}
              editable={!busy && !locating}
            />
          </View>
          <View style={{ width: 78 }}>
            <Field
              label="UF"
              placeholder="MG"
              value={form.state}
              onChangeText={(v) => edit("state", v)}
              autoCapitalize="characters"
              maxLength={2}
              editable={!busy && !locating}
            />
          </View>
        </View>
        <Field
          label="Endereço público"
          placeholder="Rua, número e bairro"
          value={form.address}
          onChangeText={(v) => edit("address", v)}
          maxLength={240}
          editable={!busy && !locating}
        />
      </Card>
      <Card>
        <Text style={m.section}>Vamos encontrar a entrada?</Text>
        <Text style={m.body}>
          {point
            ? "Endereço marcado. Confira a entrada no mapa e ajuste o pino, se precisar."
            : "Busque pelo endereço ou toque no mapa para escolher a entrada."}
        </Text>
        <QuietButton
          title={locating ? "Encontrando endereço…" : "Encontrar pelo endereço"}
          disabled={busy || locating}
          onPress={() => void locateAddress()}
        />
        <QuietButton
          title={point ? "Conferir entrada no mapa" : "Marcar entrada no mapa"}
          disabled={busy || locating}
          onPress={() =>
            router.push({
              pathname: "/map",
              params: {
                pick: "1",
                city: form.city,
                state: form.state,
                address: form.address,
                ...(point
                  ? {
                      latitude: String(point.latitude),
                      longitude: String(point.longitude),
                    }
                  : {}),
              },
            })
          }
        />
        {!point && (
          <Text style={m.small}>
            A marcação é opcional. O endereço continua disponível para quem
            procurar o lugar.
          </Text>
        )}
      </Card>
      <Field
        label="O que torna esse lugar especial? (opcional)"
        style={{ minHeight: 90, textAlignVertical: "top" }}
        placeholder="Uma dica, um detalhe, algo que você adora…"
        value={form.description}
        onChangeText={(v) => edit("description", v)}
        multiline
        maxLength={1000}
        editable={!busy}
      />
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Switch
          accessibilityLabel="Confirmo que é estabelecimento público"
          value={isPublic}
          onValueChange={setPublic}
          disabled={busy}
        />
        <Text style={[m.body, { flex: 1, fontSize: 13, lineHeight: 21 }]}>
          Este lugar é aberto ao público. Não é uma residência privada.
        </Text>
      </View>
      {duplicates?.length ? (
        <Card>
          <Text style={m.section}>Será que já conhecemos esse lugar?</Text>
          <Text style={m.body}>
            Encontramos lugares parecidos. Confira antes de criar outro
            cadastro.
          </Text>
          {duplicates.map((item) => (
            <PlaceCard key={item.id} place={item} />
          ))}
          <QuietButton
            title="Vou conferir os dados"
            onPress={() => setDuplicates(null)}
          />
        </Card>
      ) : null}
      {error != null && <ErrorState error={error} />}
      <PrimaryButton
        title={
          busy
            ? "Conferindo seu lugar…"
            : duplicates?.length
              ? "É outro lugar, enviar para revisão"
              : "Enviar para revisão"
        }
        disabled={busy || locating || !isPublic}
        onPress={() => void submit(Boolean(duplicates?.length))}
      />
      <GentleNote>
        As boas descobertas ficam melhores quando a gente compartilha. Cadastros
        e fotos passam por uma revisão antes de aparecer para a comunidade.
      </GentleNote>
    </Screen>
  );
}
