import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import { registrationParams } from "../validation/registration-context";
export function startRegistration(
  value: {
    city?: string;
    state?: string;
    name?: string;
  },
  fromMap = false,
) {
  if (fromMap && router.canGoBack()) router.back();
  router.navigate({
    pathname: "/(tabs)/add",
    params: registrationParams(value, randomUUID()),
  });
}
