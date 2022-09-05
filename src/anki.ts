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

export const getNotes = async(deckName: string) => {
    const noteData = await fetchAnki(`notes?shuffle=true&deck_name=${deckName}`)
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