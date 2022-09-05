import AnkiNote from "./ankiNote";
const ANKI_HOST = 'http://127.0.0.1:5008'

const fetchAnki = async (endpoint: string, isJson: boolean = true) => {
  const requestHeaders: HeadersInit = new Headers();
  requestHeaders.set("xc-auth", ANKI_HOST as string);
  const response = await fetch(`${ANKI_HOST}/api/${endpoint}`, {
    method: "GET",
    headers: requestHeaders,
  });
  if (!isJson) {
    return response;
  } else {
    try {
      const content = await response.json();
      return content;
    } catch (e) {
      console.warn(e);
    }
  }
};

export const getNotes = async(deckName: string, size: number) => {
  const searchObject:Record<string, string> = {
    'deck_name': deckName,
    'shuffle': 'true',
    'limit': size.toString()
  }
    const searchParams =  new URLSearchParams(searchObject).toString();
    const noteData = await fetchAnki(`notes?${searchParams}`)
    const data:AnkiNote[] = noteData.data.map((note:any) => {
      return {
        ...note,
        fields: new Map(Object.entries(note['fields'])),
      }
    })
    return {
      ...noteData,
      data
    }
  };

export const getDeckNames = async () => await fetchAnki('decks');
export const getPrimaryDeck = async () => await fetchAnki('primary_deck');

export enum FieldValueType {
  Expression = "Expression",
  Reading = "Reading",
  Glossary = "Glossary",
  GlossaryBrief = "Glossary Brief",
  Audio = "Audio",
  Sentence = "Sentence",
  SentenceAudio = "Sentence Audio",
  SentenceTranslation = "Sentence Translation",
  Picture = "Picture",
  PitchAccent = "Pitch Accent",
  Frequencies = "Frequencies"
}
