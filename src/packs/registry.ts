import type { LanguagePack } from "./contract";
import { italianPack } from "./it";

const packs: Record<string, LanguagePack> = {
  it: italianPack,
};

export function getPack(code: string): LanguagePack {
  const pack = packs[code];
  if (!pack) throw new Error(`No language pack registered for code: ${code}`);
  return pack;
}

export function listPacks(): LanguagePack[] {
  return Object.values(packs);
}
