// Shared Mystery: pre-recorded narrations of the final story (e.g. made with ElevenLabs).
// Empty on purpose: no recording exists yet, and the page reads the text with the device voice.
// To add one (see docs/shared-mystery-audio.md):
//   1. Put the file in audio/shared-mystery/<adventure id>.<lang>.mp3
//   2. Run `node scripts/sm-audio.mjs` and copy the textHash it prints for that adventure + language
//   3. Add an entry below. The page plays the file only while textHash matches the story text shown;
//      if the text is edited later, the hash changes, the page goes back to the device voice and
//      `node scripts/sm-audio.mjs` lists the recording as "outdated" so it can be recorded again.
// Example (not real):
//   'sm-port-sea': { en: { file: 'audio/shared-mystery/sm-port-sea.en.mp3', textHash: '1a2b3c4d',
//     source: 'ElevenLabs', voice: '<voice name>', licence: '<terms of use / plan>', by: '<who made it>', added: '2026-12-01' } },
window.WALKBCN_SM_AUDIO = {
};
