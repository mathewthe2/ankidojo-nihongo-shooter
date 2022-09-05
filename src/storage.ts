import { maxLevel } from "./words";

const keys = {
  defaultLanguageKey: 'defaultLanguageKey',
}

function bestSpeedKeyOld(level: number) {
  return "best-speed-" + level;
}

function bestSpeedKey(lang: string, level: number) {
  return lang + "-best-speed-" + level;
}

function bestAnkiSpeedKey(deckName: string, deckSize: number) {
  return  deckName + "-best-speed-" + deckSize;
}

export const storage = {
  bestAnkiSpeed: {
    get(deckName: string, deckSize: number) {
      const value = localStorage.getItem(bestAnkiSpeedKey(deckName, deckSize));
      if (value) {
        return +value;
      } else {
        return undefined;
      }
    },
    set(deckName: string, deckSize: number, value: number) {
      localStorage.setItem(bestAnkiSpeedKey(deckName, deckSize), value.toString());
    }
  },
  bestSpeed: {
    get(lang: string, level: number) {
      const value = localStorage.getItem(bestSpeedKey(lang, level));
      if (value) {
        return +value;
      } else {
        return undefined;
      }
    },
    set(lang: string, level: number, value: number) {
      localStorage.setItem(bestSpeedKey(lang, level), value.toString());
    }
  },
  defaultLanguage: {
    get(): string | null {
      return localStorage.getItem(keys.defaultLanguageKey);
    },
    // set(lang: string) {
    //   localStorage.setItem(keys.defaultLanguageKey, lang);
    // }
  }
}

export function migrateStorage1() {
  for (let index = 0; index < maxLevel; index++) {
    const level = index + 1;
    const speed = localStorage.getItem(bestSpeedKeyOld(level));
    if (speed) {
      storage.bestSpeed.set('japanese', level, +speed);
      // don't overwrite the new score every time
      localStorage.removeItem(bestSpeedKeyOld(level));
    }
  }
}
