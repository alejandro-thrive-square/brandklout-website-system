// tokens.mjs — the site variables the v2 classes bind to. Kept in its own module so both
// gen-styles.mjs and styles-def.manual.mjs can import it without gen-styles' body (which
// reads process.argv and a per-slug measurement file) running as a side effect.
export const V = {
  white: "relume-variable--neutral-white",
  navy: "variable-082430ef-54c6-da46-1df1-6f43416b97f8",       // #002241 brand/bleu 900
  blue: "variable-0d6deade-46b8-3c60-cdab-5dddc296d8eb",       // #04669c brand/bleu 700
  sky: "variable-45699325-3755-4277-cdab-268a35ea5fb5",        // #abd6ff brand/bleu 500
  lpNavy: "variable-2797b6e3-6943-dbe5-7851-bd0d1d87c8c6",     // #0b2c41 brand/lp navy
  lpGold: "variable-6230b4fe-d250-e1ed-130c-5f50b2d183ac",     // #d3aa5a brand/lp gold
  lpCream: "variable-d9f70579-2b95-7d4a-2b39-abddcec7c3e2",    // #f6f3ee brand/lp cream
  lpLine: "variable-1dc0f261-73e0-ff99-d336-bed5e95ce4cf",     // #d8e0e4 brand/lp line
  lpLineSoft: "variable-b983816c-ab08-cbe9-51b9-3dbb155d0d83", // #e7ecf1 brand/lp line soft
  lpSlate: "variable-a08c1dc2-1c8a-38af-c270-e085dba04e4e",    // #376b7b brand/lp slate
  light: "variable-78da6909-408d-cc25-1658-2a1c99061c8b",      // #fcfcfc brand/light
  mist: "variable-a30d6549-3163-2836-bdc5-43b169a4671f",       // #f3f8fb brand/mist
  n1: "relume-variable--neutral-shade-1",                      // #eee
  n4: "relume-variable--neutral-shade-4",                      // #666
  n5: "relume-variable--neutral-shade-5",                      // #444
  n6: "relume-variable--neutral-shade-6",                      // #222
};
