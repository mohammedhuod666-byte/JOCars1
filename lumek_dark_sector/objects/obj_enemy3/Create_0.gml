// ============================================================
//  Enemy3 — السّجّان القرمزي (The Jailer)
//  Create — full AI state machine + light-hunting + stomp-kill
// ============================================================
state = "patrol";

// patrol
patrol_dir   = 1;
patrol_spd   = 2.2;
turn_gap     = 18;

// detection
sight_range  = 380;
lost_range   = 580;

// chase
chase_spd    = 5.5;
vsp          = 0;
grav         = 0.5;
jump_speed   = -11.5;

// timers
alert_timer   = 0;
message_timer = 0;

// health
hp       = 100;
max_hp   = 100;

// visual
hit_flash = 0;
float_y   = 0;
float_phase = random(1000);

// taunts (Arabic)
taunts[0] = "سأقتلك قريباً!";
taunts[1] = "ضوئك ينتهي!";
taunts[2] = "لا أتوقف!";
taunts[3] = "الظلام سيهزمك!";
taunts[4] = "لن تهرب!";
taunt_index = 0;
message_timer = 0;

// death
die_pop = 0;
die_timer = 0;
