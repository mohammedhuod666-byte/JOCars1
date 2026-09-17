// obj_companion — Lumek's companion / narrative voice
// Smoothly follows Lumek at a slight offset and delivers contextual
// chatter in Arabic.  It also acts as a light-guide hint: it can tell
// the player to follow the Jailer's glow to reveal hidden platforms.

cx = x;
cy = y;
target = Obj_player;

chat_index = 0;
chat_timer = 0;
active_chat = "";
is_talking = false;
seconds_between_chatter = 12;  // tune pacing

// Companion messages (contextual hints + lore in Arabic).
// These are the "voice in your head" lines that introduce the world.
messages[0] = "القطاع المنسي... العودة إلى النور!";
messages[1] = "لا تستとしている في الظلام.";
messages[2] = "اتبع ضوء السجّان لترى ما يخفيه الظلام.";
messages[3] = "الشرارة الأخيرة معك... لا تفقدها!";
messages[4] = "السجّان القرمزي يطارد كل نور!";
messages[5] = "اركب على رأسه وتسلّق!";
messages[6] = "المياه السامة تبتلع الضوء.";
messages[7] = "هذات المنصات مخفية في الظلام.";
messages[8] = "اقفز الآنbefore تغرق!";
messages[9] = "لوميك لا يمكن أن يستسلم.";
messages[10] = "النجاة تحتاج سرعة ولياقة!";
messages[11] = "الظلام يخفي الطريق... استخدم الأعداء كضوء!";

follow_speed = 0.06;
min_dist_to_talk = 250;   // only chatter when reasonably close

// ---- Step ----
// Smoothly follow Lumek
if (instance_exists(target)) {
    var dest_x = target.x - 32 * sign(target.image_xscale);
    var dest_y = target.y - 55;
    x += (dest_x - x) * follow_speed;
    y += (dest_y - y) * follow_speed;
    cx = x;
    cy = y;
}

// Chat timing: speak every few seconds if near the player
if (!instance_exists(Obj_player)) {
    is_talking = false;
    exit;
}

var dist = point_distance(x, y, Obj_player.x, Obj_player.y);
if (dist > min_dist_to_talk) {
    is_talking = false;
    chat_timer = 0;
    exit;
}

if (chat_timer > 0) {
    chat_timer -= 1;
    if (chat_timer <= 0) is_talking = false;
} else {
    // chance to start a new line
    if (random(1000) < 2.2) {   // ~every ~4.5s while close
        if (chat_index >= array_length(messages)) {
            chat_index = 0;
        }
        active_chat = messages[chat_index];
        is_talking  = true;
        chat_timer  = 160;        // ~2.7s visible
        chat_index += 1;
    }
}
