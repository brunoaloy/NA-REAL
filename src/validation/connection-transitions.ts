/** Platform events repeat frequently; reload only on a real return to online/foreground. */
export function connectionTransitions() {
  let online: boolean | undefined, foreground: boolean | undefined;
  return {
    network(next: boolean) {
      const returned = online === false && next;
      online = next;
      return returned;
    },
    app(next: boolean) {
      const returned = foreground === false && next;
      foreground = next;
      return returned;
    },
  };
}
