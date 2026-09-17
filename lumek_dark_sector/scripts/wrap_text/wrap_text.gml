function wrap_text(){
/// @function wrap_text(str, max_width)
/// @param str النص الكامل
/// @param max_width أقصى عرض مسموح به للسطر

function wrap_text(str, max_width) {
    var words = string_split(str, " ");
    var lines = [];
    var line = "";

    for (var i = 0; i < array_length(words); i++) {
        var test_line = line;
        if (test_line != "") test_line += " ";
        test_line += words[i];

        if (string_width(test_line) > max_width) {
            array_push(lines, line);
            line = words[i];
        } else {
            line = test_line;
        }
    }

    if (line != "") {
        array_push(lines, line);
    }

    return lines;
}
}