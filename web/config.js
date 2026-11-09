// Where the page fetches the latest data. The weekly update writes matches.json, venues.json and site.json there.
// Leave remoteData empty to use only the copies in the data/ folder next to this page.
window.PC_CONFIG = {
  remoteData: 'https://raw.githubusercontent.com/ahaepc/pugliacalcio/main/data/',
  localData: 'data/',
  timeoutMs: 8000,
};
