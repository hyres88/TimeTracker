
MINTIME = new Date("Sat May 07 2013 00:00:00");
MAXTIME = new Date("Sat May 07 2013 23:59:59");

RES = []

function load_data(lines) {
    window.data = [];
    for (var i in lines) {
        var parts = lines[i];
        var date = new Date(parts[0]);
        var title = parts[1];
        window.data.push([date, title]);
    }
}

var ms = 1000;
function select_blocks(res) {
    var blocks = [];
    var total = 0;
    var last_time = 0;

    function push(time, type) {
        if (!blocks.length) {
            last_time = time;
            blocks.push([1, type, time, void(0)]);
            total += 1;
        } else {
            if (time - last_time <= 30*ms) {
                var last = blocks[blocks.length - 1];
                if (last[1] == type) {
                    last[0]++;
                    total += 1;
                } else {
                    last[3] = time + "";
                    blocks.push([1, type, time, void(0)]);
                    total += 1;
                }
            } else {
                var skip = Math.round((time - last_time - 1*ms) / 1000);
                blocks[blocks.length - 1][3] = last_time + 1*ms + "";
                blocks.push([skip, "", last_time + 1*ms + "", time + ""]);
                blocks.push([1, type, time, void(0)]);
                total += skip + 1;
            }

            last_time = time;
        }
    }
    
    for (var i in window.data) {
        var date = window.data[i][0];
        var title = window.data[i][1];

        if (date < MINTIME || date >= MAXTIME) {
            continue;
        }

        var found = false;
        for (var j in res) {
            if (title.search(res[j]) > -1) {
                push(date, j);
                found = true;
                break;
            }
        }

        if (!found) {
            push(date, "?");
        }
    }

    return {blocks: blocks, total: total}
}

function display_blocks(res, blocks, total) {
    $("#time").empty();

    for (var i in blocks) {
        var block = blocks[i];

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
        obj.on("click", click_block);
        obj.addClass("group-" + cssname);
        $("#time").append(obj);
    }
}

function click_block() {
    var start = new Date($(this).data("start"));
    var end = new Date($(this).data("end"));

    $("#blockinfo").empty();
    var last_title = void(0);
    var last_count = 0;
    for (var i in window.data) {
        var date = window.data[i][0];
        var title = window.data[i][1];

        if (date < start || date >= end) {
            continue;
        }

        if (last_title == title) {
            last_count ++;
        } else {
            if (last_title) {
                var p = $("<p></p>").text(last_title + " ");
                p.append($("<span>(" + last_count + "s)</span>").addClass("counter"));
                $("#blockinfo").append(p);
                last_count = 1;
            }
            last_title = title;
        }
    }

    var p = $("<p></p>").text(title);
    p.append($("<span>(" + last_count + "s)</span>").addClass("counter"));
    $("#blockinfo").append(p);
}

function draw_blocks(res) {
    var ret = select_blocks(res);
    display_blocks(res, ret.blocks, ret.total);
    // helper text on hover
    $("#time div").hover(function() { $("#legend").html("<span class='" + $(this).attr('class') + "'>&nbsp;&nbsp;&nbsp;&nbsp;</span><span> " + this.title + "</span>");});
}

$(function() {
    // handle regex search
    $("#regex-search").select2({
        tags:["Gmail", "Facebook", "Google Calendar", " says…", "iTerm", "StartMATLAB","TeXworks","PowerPoint","Google Chrome"],
    });
    $("#regex-search").on("change", function(e) {
        console.log("change "+JSON.stringify({val:e.val, added:e.added, removed:e.removed})); 
        if (e.added) {
            $("#blockinfo").empty();
            RES.push(new RegExp(e.added.text));
            draw_blocks(RES);
        }
        else if (e.removed) {
            for(var i=0; i<RES.length; i++) {
                if (RES[i].toString() == new RegExp(e.removed.text)) {
                    RES.splice(i,1);
                    break;
                }
            }
            draw_blocks(RES);
        }
    });

    // draw initial blocks
    draw_blocks([/.*/]);
    // load all the data
    $.getJSON('static/timetracker.cathy-wus-MacBook-Pro.local.json', function(lines) {
        load_data(lines);
        draw_blocks([/.*/]);
    });
});