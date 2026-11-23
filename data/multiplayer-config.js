// Multiplayer backend (Supabase). Both values are public by design: the anon key only lets a
// signed-in anonymous player call the room functions in supabase/multiplayer.sql, which check
// every action (no table can be written directly). Never put the service_role key here.
// Empty = "Play with friends" says multiplayer isn't set up yet. Set up: docs/multijugador.md
window.WALKBCN_MP = {
  url: 'https://bbeeuykvrmpixztjtvod.supabase.co',
  anonKey: 'sb_publishable_rzmMM9GGOyZd5Lbwd3_3Gg_FOm0K5Mv',    // Project Settings → API → anon public key
};
