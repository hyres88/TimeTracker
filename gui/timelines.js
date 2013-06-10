// Functions to display the timelines

function display_blocks(output_elt, data, res, blocks, total) {
    output_elt.empty();

    var check_total = 0;

    for (var i in blocks) {
        var block = blocks[i];

        check_total += block[0];

        var obj = $("<div></div>");
        var name, cssname;
        switch (block[1]) {
            case "":  cssname = "none", name  = ""; break;
            case "?": cssname = name = "unmatched"; break;
            default: cssname = block[1], name  = res[block[1]]; break;
        }
        obj.attr("title", name);
        obj.css("width", (block[0] / total * 100) + "%");
        obj.data("start", block[2]);
        obj.data("end", block[3]);
        obj.on("click", { data: data }, click_block);
        obj.addClass("group-" + cssname);
        output_elt.append(obj);
    }

    if (total != check_total) {
        console.log("Error in checking total:", total, check_total);
        window.ERROR = {data: data, total: total, blocks: blocks, check: total};
    }
}

function seconds_to_human_time(sec) {
    function round_one_decimal_place(val) {
        return Math.round(val * 10) / 10;
    }

    if (sec < 60) {
        return sec + "s";
    } else if (sec < 60 * 60) {
        return round_one_decimal_place(sec / 60) + "min";
    } else {
        return round_one_decimal_place(sec / 60) + "hr";
    }
}

function click_block(evt) {
    var start = $(this).data("start");
    var end = $(this).data("end");
    var eventlist = slice_data(evt.data.data, start, end);

    $("#blockinfo").empty();
    var head = $("<h2></h2>").text(new Date(start * 1000).toTimeString() + " to " + new Date(end * 1000).toTimeString())
    $("#blockinfo").append(head);

    for (var i in eventlist) {
        var date = eventlist[i][0];
        var title = eventlist[i][1];
        var number = eventlist[i][2];

        var duration = seconds_to_human_time(number);
        var p = $("<p></p>").text(title + " ");
        p.append($("<span></span>").text(duration).addClass("counter"));
        $("#blockinfo").append(p);
    }
}

function draw_timeline(data, start_day, end_day, res) {
    function draw_blocks(output_elt, data, res) {
        var ret = select_blocks(data, res);
        var padding = pad_blocks_day(ret.blocks, start_day, end_day);
        display_blocks(output_elt, data, res, ret.blocks, ret.total + padding);
    }

    var output_elt = $("<div></div>").addClass("timeline");

    draw_blocks(output_elt, data, res);

    return output_elt;
}

function draw_timelines(data, res) {
    var last_record = data[data.length - 1];
    var start_time = data[0][0];
    var end_time = last_record[0] + last_record[2];

    $("#time").empty();
    var last_dots = false;
    mapPerDay(start_time, end_time, function(start_day, end_day) {
        var day = slice_data(data, start_day, end_day);

        if (day.length) {
            var elt = draw_timeline(day, start_day, end_day, res);
            last_dots = false;
            $("#time").append(elt);
        } else if (!last_dots) {
            var elt = $("<div></div>").addClass("empty-timeline");
            elt.text("1 day skipped");
            elt.data("days-skipped", 1);
            last_dots = elt;
            $("#time").append(elt);
        } else {
            var skipped = last_dots.data("days-skipped");
            last_dots.data("days-skipped", ++skipped);
            last_dots.text(skipped + " days skipped");
        }
    });
}
