import { useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Switch, Text, View, Image, Keyboard } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { useSession } from "../../hooks/use-session";
import { usePreferredCity } from "../../hooks/use-preferred-city";
import { db } from "../../services/supabase";
import {
  Screen,
  Field,
  PrimaryButton,
  ErrorState,
  Card,
} from "../../components/ui";
import { AppHeader, CategoryChips, PlaceCard } from "../../components/design";
import { CityFields } from "../../components/city-fields";
import { PhotoPicker } from "../../components/photos";
import {
  GentleNote,
  QuietButton,
  WarmIntro,
  m,
} from "../../components/member-design";
import { addPlace, type Place } from "../../services/catalog";
import {
  preparePhoto,
  uploadPreparedPhoto,
  type PreparedPhoto,
} from "../../services/photos";
import { findAddress } from "../../services/geocoding";
import {
  addressQuery,
  brazilPoint,
  type MapPoint,
} from "../../validation/geocoding";
import { placeInput } from "../../validation/domain";
import { registrationContext } from "../../validation/registration-context";
import { validatePlaceStep } from "../../validation/add-journey";
import {
  mapCenter,
  normalizeFilters,
  emptyFilters,
} from "../../validation/explore";
const blank = {
  name: "",
  category: "Comer",
  city: "",
  state: "",
  address: "",
  description: "",
};
const steps = ["Lugar", "Endereço", "Foto", "Conferir"];
export default function Add() {
  const session = useSession();
  return <AddContent key={session?.user.id ?? "guest"} session={session} />;
}
function AddContent({ session }: { session: Session | null }) {
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    locationKey?: string;
    requestKey?: string;
    city?: string;
    state?: string;
    suggestedName?: string;
  }>();
  const context = registrationContext(params);
  const [handledContext, setHandledContext] = useState(context?.key);
  const incoming = context && context.key !== handledContext;
  const touched = useRef(false);
  const [form, setForm] = useState({
      ...blank,
      name: context?.name ?? "",
      city: context?.city ?? "",
      state: context?.state ?? "",
    }),
    [step, setStep] = useState(0);
  const preference = usePreferredCity((value) => {
    if (value && !touched.current && !context?.city)
      setForm((current) => ({
        ...current,
        city: value.city,
        state: value.state,
      }));
  });
  const seed = mapCenter(params),
    routePoint = seed
      ? brazilPoint({ longitude: seed[0], latitude: seed[1] })
      : undefined;
  const locationKey = [
    params.latitude,
    params.longitude,
    params.locationKey,
  ].join(":");
  const [location, setLocation] = useState<{ key: string; point?: MapPoint }>({
    key: locationKey,
    point: routePoint,
  });
  if (!incoming && location.key !== locationKey)
    setLocation({ key: locationKey, point: routePoint });
  const point = location.point;
  const setPoint = (value?: MapPoint) =>
    setLocation({ key: locationKey, point: value });
  const [isPublic, setPublic] = useState(false),
    [busy, setBusy] = useState(false),
    [locating, setLocating] = useState(false),
    [picking, setPicking] = useState(false);
  const [error, setError] = useState<unknown>(),
    [created, setCreated] = useState(""),
    [photo, setPhoto] = useState<PreparedPhoto | null>(null),
    [photoSent, setPhotoSent] = useState(false);
  const [duplicates, setDuplicates] = useState<Place[] | null>(null);
  const locked = useRef(false);
  function edit(key: keyof typeof form, value: string) {
    touched.current = true;
    setForm((current) => ({
      ...current,
      [key]: key === "state" ? value.toUpperCase() : value,
    }));
    setError(undefined);
    if (["name", "city", "state"].includes(key)) setDuplicates(null);
    if (["city", "state", "address"].includes(key)) setPoint(undefined);
  }
  function selectCity(value: { city: string; state: string }) {
    touched.current = true;
    setForm((current) => ({
      ...current,
      city: value.city,
      state: value.state,
    }));
    setPoint(undefined);
    setDuplicates(null);
    setError(undefined);
  }
  function next() {
    try {
      validatePlaceStep(step, form);
      Keyboard.dismiss();
      setStep(step + 1);
      setError(undefined);
    } catch (e) {
      setError(e);
    }
  }
  async function locateAddress() {
    if (locating || busy) return;
    setError(undefined);
    try {
      normalizeFilters({ ...emptyFilters, city: form.city, state: form.state });
      validatePlaceStep(1, form);
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
  async function choosePhoto(camera: boolean) {
    if (picking || busy) return;
    setPicking(true);
    setError(undefined);
    try {
      const value = await preparePhoto(camera);
      if (value) setPhoto(value);
    } catch (e) {
      setError(e);
    } finally {
      setPicking(false);
    }
  }
  async function sendPhoto(id: string) {
    if (!photo) return;
    await uploadPreparedPhoto({ placeId: id }, photo);
    setPhoto(null);
    setPhotoSent(true);
  }
  async function retryPhoto() {
    if (!created || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await sendPhoto(created);
    } catch {
      setError(
        new Error(
          "O lugar já foi recebido, mas a foto não foi enviada. Você pode tentar novamente sem criar outro cadastro.",
        ),
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function submit(allowSimilar = false) {
    if (locked.current || !session || created) return;
    setError(undefined);
    setBusy(true);
    locked.current = true;
    try {
      const value = placeInput.parse({
        ...form,
        state: form.state.trim().toUpperCase(),
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
      if (photo)
        try {
          await sendPhoto(id);
        } catch {
          setError(
            new Error(
              "Seu cadastro foi recebido para análise, mas a foto não foi enviada. Tente reenviar a foto abaixo; não precisa cadastrar o lugar de novo.",
            ),
          );
        }
    } catch (e) {
      setError(e);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function applyContext() {
    if (!context) return;
    touched.current = true;
    setHandledContext(context.key);
    setForm({
      ...blank,
      name: context.name ?? "",
      city: context.city ?? "",
      state: context.state ?? "",
    });
    setPoint(undefined);
    setStep(0);
    setCreated("");
    setPublic(false);
    setDuplicates(null);
    setError(undefined);
    setPhoto(null);
    setPhotoSent(false);
  }
  if (session && incoming)
    return (
      <Screen>
        <AppHeader title="Cadastrar um lugar" />
        <WarmIntro
          title="Recebemos os dados da sua busca."
          body={`Novo cadastro${context.city ? ` em ${context.city}, ${context.state}` : ""}${context.name ? `: ${context.name}` : ""}. Você pode continuar o cadastro anterior ou começar este. Começar outro descarta os textos e a foto ainda não enviados.`}
        />
        <PrimaryButton
          title="Começar cadastro desta busca"
          disabled={busy || locating || picking}
          onPress={applyContext}
        />
        <QuietButton
          title="Continuar meu cadastro anterior"
          disabled={busy || locating || picking}
          onPress={() => {
            setHandledContext(context.key);
            setLocation((current) => ({ ...current, key: locationKey }));
          }}
        />
      </Screen>
    );
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
      <Screen scrollKey={created}>
        <AppHeader title="Seu lugar foi enviado" />
        <WarmIntro
          eyebrow="OBRIGADO POR COMPARTILHAR"
          title="Uma descoberta que vai mais longe."
          body="Recebemos o cadastro. Ele passa por uma revisão antes de aparecer para a comunidade."
        />
        <GentleNote>
          Você pode acompanhar a aprovação em Perfil → Lugares que compartilhei.
          O envio ainda não publica o lugar.
        </GentleNote>
        {error != null && <ErrorState error={error} />}
        {busy && <Text style={m.body}>Enviando sua foto…</Text>}
        {photo && !busy ? (
          <Card>
            <Image
              source={{ uri: photo.uri }}
              accessibilityLabel="Foto aguardando reenvio"
              style={{ height: 180, width: "100%", borderRadius: 16 }}
            />
            <QuietButton
              title="Reenviar somente a foto"
              onPress={() => void retryPhoto()}
            />
          </Card>
        ) : photoSent ? (
          <GentleNote>Foto recebida para revisão.</GentleNote>
        ) : (
          !busy && (
            <Card>
              <Text style={m.section}>Uma foto conta um pouquinho mais</Text>
              <PhotoPicker placeId={created} />
            </Card>
          )
        )}
        <PrimaryButton
          title="Acompanhar aprovação"
          disabled={busy}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/profile",
              params: { section: "places", sectionKey: String(Date.now()) },
            })
          }
        />
        <QuietButton
          title="Abrir lugar cadastrado"
          disabled={busy}
          onPress={() =>
            router.push({ pathname: "/place/[id]", params: { id: created } })
          }
        />
        <QuietButton
          title="Adicionar outro lugar"
          disabled={busy}
          onPress={() => {
            setCreated("");
            setForm({ ...blank, ...(preference.city ?? {}) });
            setStep(0);
            setPoint(undefined);
            setPublic(false);
            setDuplicates(null);
            setError(undefined);
            setPhoto(null);
            setPhotoSent(false);
          }}
        />
      </Screen>
    );
  return (
    <Screen scrollKey={step}>
      <AppHeader title="Adicionar um lugar" />
      <View
        accessibilityLabel={`Etapa ${step + 1} de 4: ${steps[step]}`}
        style={{ gap: 10 }}
      >
        <Text style={m.eyebrow}>
          PASSO {step + 1} DE 4 · {steps[step].toLocaleUpperCase("pt-BR")}
        </Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {steps.map((label, i) => (
            <View
              key={label}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 3,
                backgroundColor: i <= step ? "#0F766E" : "#DFE9E3",
              }}
            />
          ))}
        </View>
      </View>
      <WarmIntro
        title={
          [
            "Qual lugar ganhou seu coração?",
            "Onde fica esse cantinho?",
            "Uma foto conta uma história.",
            "Tudo certo para compartilhar?",
          ][step]
        }
        body={
          [
            "Comece pelo nome e pelo que você encontra por lá.",
            "Informe o endereço. Marcar a entrada no mapa é opcional.",
            "Se quiser, escolha uma imagem sua. Ela só será enviada com o cadastro.",
            "Confira os dados antes de enviar para revisão.",
          ][step]
        }
      />
      {step === 0 && (
        <Card>
          <Field
            label="Nome do lugar"
            placeholder="Como ele se chama?"
            value={form.name}
            onChangeText={(v) => edit("name", v)}
            maxLength={120}
          />
          <Text style={m.label}>O que você encontra por lá?</Text>
          <CategoryChips
            compact
            includeAll={false}
            value={form.category}
            onChange={(v) => edit("category", v)}
          />
          <Field
            label="O que torna esse lugar especial? (opcional)"
            placeholder="Uma dica, um detalhe, algo que você adora…"
            value={form.description}
            onChangeText={(v) => edit("description", v)}
            multiline
            maxLength={1000}
            style={{ minHeight: 90, textAlignVertical: "top" }}
          />
        </Card>
      )}
      {step === 1 && (
        <>
          <Card>
            <CityFields
              city={form.city}
              state={form.state}
              onCity={(v) => edit("city", v)}
              onState={(v) => edit("state", v)}
              onSelect={selectCity}
              disabled={locating}
            />
            <Field
              label="Endereço público"
              placeholder="Rua, número e bairro"
              value={form.address}
              onChangeText={(v) => edit("address", v)}
              maxLength={240}
              editable={!locating}
            />
          </Card>
          <Card>
            <Text style={m.section}>Vamos encontrar a entrada?</Text>
            <Text style={m.body}>
              {point
                ? "Entrada marcada. Confira o pino no mapa, se precisar."
                : "O endereço já ajuda a encontrar o lugar. Se quiser, marque a entrada exata."}
            </Text>
            <QuietButton
              title={
                locating ? "Encontrando endereço…" : "Encontrar pelo endereço"
              }
              disabled={locating}
              onPress={() => void locateAddress()}
            />
            <QuietButton
              title={
                point ? "Conferir entrada no mapa" : "Marcar entrada no mapa"
              }
              disabled={locating}
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
            {point && (
              <QuietButton
                title="Continuar apenas com endereço"
                onPress={() => setPoint(undefined)}
              />
            )}
          </Card>
        </>
      )}
      {step === 2 && (
        <Card>
          {photo ? (
            <>
              <Image
                source={{ uri: photo.uri }}
                accessibilityLabel="Prévia da foto do lugar"
                style={{ width: "100%", height: 200, borderRadius: 16 }}
              />
              <QuietButton
                title="Retirar foto"
                disabled={picking}
                onPress={() => setPhoto(null)}
              />
            </>
          ) : (
            <GentleNote>
              A foto é opcional. Você também pode adicioná-la depois.
            </GentleNote>
          )}
          <QuietButton
            title="Escolher foto"
            disabled={picking}
            onPress={() => void choosePhoto(false)}
          />
          <QuietButton
            title="Tirar foto"
            disabled={picking}
            onPress={() => void choosePhoto(true)}
          />
          <Text style={m.small}>
            Use uma foto sua do lugar. Ela passa por revisão antes de aparecer
            para outras pessoas.
          </Text>
        </Card>
      )}
      {step === 3 && (
        <>
          <Card>
            <Text style={m.section}>{form.name.trim()}</Text>
            <Text style={m.body}>
              {form.category} · {form.city.trim()},{" "}
              {form.state.trim().toUpperCase()}
            </Text>
            <Text style={m.body}>{form.address.trim()}</Text>
            {form.description.trim() !== "" && (
              <Text style={m.body}>{form.description.trim()}</Text>
            )}
            <Text style={m.small}>
              {point
                ? "Entrada marcada no mapa"
                : "Endereço informado; entrada ainda não marcada"}
            </Text>
            {photo && (
              <Image
                source={{ uri: photo.uri }}
                accessibilityLabel="Foto a enviar com o cadastro"
                style={{ width: "100%", height: 160, borderRadius: 16 }}
              />
            )}
          </Card>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Switch
              accessibilityLabel="Confirmo que é estabelecimento público"
              value={isPublic}
              onValueChange={setPublic}
              disabled={busy}
            />
            <Text style={[m.body, { flex: 1 }]}>
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
                onPress={() => {
                  setDuplicates(null);
                  setStep(0);
                }}
              />
            </Card>
          ) : null}
        </>
      )}
      {error != null && <ErrorState error={error} />}
      {step < 3 ? (
        <PrimaryButton
          title={step === 2 && !photo ? "Continuar sem foto" : "Continuar"}
          disabled={locating || picking}
          onPress={next}
        />
      ) : (
        <PrimaryButton
          title={
            busy
              ? "Conferindo seu lugar…"
              : duplicates?.length
                ? "É outro lugar, enviar para revisão"
                : "Enviar para revisão"
          }
          disabled={busy || !isPublic}
          onPress={() => void submit(Boolean(duplicates?.length))}
        />
      )}
      {step > 0 && (
        <QuietButton
          title="Voltar uma etapa"
          disabled={busy || locating || picking}
          onPress={() => {
            setStep(step - 1);
            setError(undefined);
          }}
        />
      )}
      <Text style={m.small}>
        Cadastros e fotos aparecem para a comunidade após aprovação.
      </Text>
    </Screen>
  );
}
