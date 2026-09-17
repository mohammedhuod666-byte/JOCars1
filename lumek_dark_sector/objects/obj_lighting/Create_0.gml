// ============================================================
//  obj_lighting — Create
//  Surface used for the cinematic subtractive light mask.
//  Created lazily by the player if missing; this Create ensures it
//  exists and is kept at depth -9999.
// ============================================================
surf = -1;
depth = -9999;

// We do NOT create the surface here — the Draw event lazily
// creates it to match the current view size.  This avoids
// mismatches when the game window is resized.
