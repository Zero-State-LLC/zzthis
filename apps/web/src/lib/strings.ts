import copy from "../../../../design/copy.json";

export type StringKey = keyof typeof copy.strings;

// Every sentence a person reads comes from design/copy.json (spec 005
// FR-014). {provider} and {email} are filled in at run time.
export function t(
  key: StringKey,
  values: Readonly<Record<string, string>> = {},
): string {
  return copy.strings[key].text.replace(
    /\{(\w+)\}/g,
    (_, name: string) => values[name] ?? "",
  );
}
