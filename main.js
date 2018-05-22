var first = true;
var spectrumCycle = true;
var draggable = false;

var songNames = [];
var songSources = [];
var songNamesToAdd = [];
var songSourcesToAdd = [];
var currentIndex = 0;

var currentColor;

var barID;
var particleID;
var colorID;
var seekbarID;
var timecodeID;

var globalAdd = 0;

var marginR = 2;

function start() {

    if (navigator.userAgent.includes("Chrome")) {

        var dz = document.getElementById("dz");

        window.addEventListener("dragenter", function(event) {
            event.preventDefault();
            document.getElementById("dz").className = "dropzoneOver";
        });

        dz.addEventListener("dragleave", function(event) {
            if (event.pageX == 0) {
                event.preventDefault();
                document.getElementById("dz").className = "dropzoneDefault";
            }
        });

        dz.addEventListener("dragenter", function(event) {
            event.preventDefault();
        });

        dz.addEventListener("dragover", function(event) {
            event.preventDefault();
        });

        document.addEventListener("contextmenu", function(event) {
            if (!first) {
                contextShow();
                event.preventDefault();
            }
        }, false);

        document.addEventListener("click", function(event) {
            if (!first) {
                contextHide(event);
            }
        }, false);

        document.addEventListener("mouseup", function(event) {
            if (draggable) {
                changeAudioPos();
                seekbarID = requestAnimationFrame(seekbarUpdater);
                draggable = false;
            }
        });

        document.addEventListener("mousemove", function(event) {
            move(event);
        });

    } else {

        $("#sub-header").html("Sorry, this site only works with <a href=\"https://www.google.com/chrome\">Google Chrome</a>");

    }

}


function contextShow() {

    var itemsRight = document.getElementsByClassName("contextRightItem");

    for (var i = 0; i < itemsRight.length; i++) {
        $(itemsRight[i]).css("display", "none");
    }

    var cw = getContextWidth();
    var ch = getContextHeight();

    if ( (cw > 5) && (ch > 5) ) {

        var bw = window.innerWidth;
        var bh = window.innerHeight;
        var mouseX = event.pageX;
        var mouseY = event.pageY;

        var left;
        var top;

        if ((bw - mouseX) < cw) {

            left = bw - cw - 1;

        } else {

            left = mouseX;

        }

        if ((bh - mouseY) < ch) {

            top= bh - ch - 1;

        } else {

            top = mouseY;

        }

        $("#context").css("display", "block");
        $("#context").css("left", left + "px");
        $("#context").css("top", top + "px");

    }

}


// function to get the width of the context menu
// a little difficult because elements are hidden
function getContextWidth() {

    var itemsRight = document.getElementsByClassName("contextRightItem");

    var largestRightWidth = 0;

    for (var i = 0; i < itemsRight.length; i++) {

        $("#context").css("display", "block");
        $(itemsRight[i]).css("display", "block");

        if ($("#contextRight").width() > largestRightWidth) {
            largestRightWidth = $("#contextRight").width();
        }

        $("#context").css("display", "none");
        $(itemsRight[i]).css("display", "none");

    }

    $("#context").css("display", "block");
    var leftWidth = $("#contextLeft").width();
    $("#context").css("display", "none");

    return largestRightWidth+leftWidth+5;

}


// function to get the height of the context menu
// a little difficult because elements are hidden
function getContextHeight() {

    var itemsRight = document.getElementsByClassName("contextRightItem");

    var largestRightHeight = 0;

    for (var i = 0; i < itemsRight.length; i++) {

        $("#context").css("display", "block");
        $(itemsRight[i]).css("display", "block");

        if ($("#contextRight").height() > largestRightHeight) {
            largestRightHeight = $("#contextRight").height();
        }

        $("#context").css("display", "none");
        $(itemsRight[i]).css("display", "none");

    }

    $("#context").css("display", "block");
    var leftHeight = $("#contextLeft").height();
    $("#context").css("display", "none");

    if (largestRightHeight > leftHeight) {
        return largestRightHeight;
    } else {
        return leftHeight;
    }

}


function contextHide(event) {

    if ($("#context").css("display") == "block") {

        if (event !== undefined) {

            var parents = [];
            parents = $(event.target).parents();

            var hide = true;

            for (var i = 0; i < parents.length; i++) {
                if (parents[i].id == "context") {
                    hide = false;
                }
            }

            if (hide) {
                $("#context").css("display", "none");
            }

        } else {
            $("#context").css("display", "none");
        }

    }

}


function contextClickLeft(event) {

    var itemsLeft = document.getElementsByClassName("contextLeftItem");
    var itemsRight = document.getElementsByClassName("contextRightItem");

    for (var i = 0; i < itemsLeft.length; i++) {

        if (event.target == itemsLeft[i]) {

            $(itemsRight[i]).css("display", "block");

        } else {

            $(itemsRight[i]).css("display", "none");

        }

    }

}


function contextClickRight(event) {

    if($(event.target).html() == "color fade") {

        if ($(event.target).hasClass("contextRightItemSubSelected")) {

            spectrumCycle = false;

            $(event.target).removeClass("contextRightItemSubSelected");
            $(event.target).addClass("contextRightItemSub");

        } else {

            spectrumCycle = true;

            $(event.target).removeClass("contextRightItemSub");
            $(event.target).addClass("contextRightItemSubSelected");

        }

    } else if (event.target.id == "leftArrow") {

        if (marginR >= 2) {

            marginR -= 2;

        }

    } else if (event.target.id == "rightArrow") {

        if (marginR <= 10) {

            marginR += 2;

        }

    }

}


function setup(audio) {

    playpause();

    if (first == true) {

        $("#songStuff").css("display", "block");
        $("#leftSong").css("display", "block");
        $("#rightSong").css("display", "block");
        $("#help").css("display", "block");

        var ctx = new AudioContext();
        var audioSrc = ctx.createMediaElementSource(audio);

        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.9;

        audioSrc.connect(analyser);
        audioSrc.connect(ctx.destination);

        array = new Uint8Array(analyser.frequencyBinCount);

        $("#title").css("display", "none");

        currentColor = 0;

        first = false;

        seekbarID = requestAnimationFrame(seekbarUpdater);
        timeID = requestAnimationFrame(timecodeUpdater);

    }

    resize();

}


function barUpdater() {

    analyser.getByteFrequencyData(array);

    var canvas = document.getElementById("canvasBars");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var canvasW = $("#canvasBars").width();
    var canvasH = $("#canvasBars").height();

    var factor = 1340 / canvasW;

    canvasW *= factor;

    var numOfBars = Math.round( (2/3) * array.length );

    var w = (canvasW - ((numOfBars+2) * marginR)) / (numOfBars+3);
    var h;
    var x;
    var y;

    var heightFactor = canvasH / 255;

    var sum = 0;

    for (var i = 0; i < numOfBars; i++) {

        sum += array[i+2];

        if (array[i+2] != 0) {
            h = array[i+2]*heightFactor*2;
        } else {
            h = 2;
        }

        x = i * (w + marginR);
        y = canvasH - h + canvasH;

        ctx.fillStyle = "hsla(" + currentColor + ", 100%, 50%, 0.85)";
        ctx.fillRect(x, y, w, h);

        if (array[i+2] >= 255) {

            ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
            ctx.fillRect(x, y, w, 4);

        }


    }

    sum /= numOfBars;

    barID = requestAnimationFrame(barUpdater);

}


function particleUpdater() {

    var canvas = document.getElementById("canvasParticles");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Math.random() > 0.9) {
        new Particle();
    }

    for (var i in particles) {
        particles[i].draw();
    }

    particleID = requestAnimationFrame(particleUpdater);

}


function colorUpdater() {

    if (spectrumCycle) {

        $(".bars").css("background-color", "hsl(" + currentColor + ", 100%, 50%)");
        $("#nowPlaying").css("border-color", "hsl(" + currentColor + ", 100%, 50%)");
        $("#statusBar").css("background-color", "hsl(" + currentColor + ", 100%, 50%)");
        $("#songIndex").css("background-color", "hsl(" + currentColor + ", 100%, 50%)");

        currentColor += 0.15;

        if (currentColor == 360) {
            currentColor = 0;
        }

    }

    colorID = requestAnimationFrame(colorUpdater);

}


function seekbarUpdater() {

    var audio = document.getElementById("myAudio");

    var percent = audio.currentTime / audio.duration;

    $("#statusBar").css("left", percent*100 + "%");

    seekbarID = requestAnimationFrame(seekbarUpdater);

}


function timecodeUpdater() {

    var audio = document.getElementById("myAudio");

    $("#time").html(formatTime(audio.currentTime));

    var size = 0;

    for (var i in particles) {
        size++;
    }

    document.getElementsByClassName("statssub")[0].innerHTML = "particle count: " + size;

    if (audio.currentTime == audio.duration) {

        cancelAnimationFrame(barID);
        cancelAnimationFrame(particleID);
        cancelAnimationFrame(colorID);

        incrementCurrentIndex();
        loadAudio();

    }

    timecodeID = requestAnimationFrame(timecodeUpdater);

}


// things to do:

// clean up code, comment, post on github?


function resize() {

    contextHide();

    $("#canvasParticles").attr("width", window.innerWidth + "px");
    $("#canvasParticles").attr("height", window.innerHeight + "px");

    var newWidth;

    if (window.innerWidth < 1488) {

        newWidth = 0.9 * window.innerWidth;

        $("#canvasBars").css("width", newWidth + "px");
        $("#timeBar").css("width", newWidth + "px");

    } else {

        newWidth = 1340;

        $("#canvasBars").css("width", newWidth + "px");
        $("#timeBar").css("width", newWidth + "px");

    }

    document.getElementsByClassName("statssub")[1].innerHTML = "canvas width: " + window.innerWidth + "px";
    document.getElementsByClassName("statssub")[2].innerHTML = "canvas height: " + window.innerHeight + "px";

}


function helpHoverOver() {
    if ($("#help").html() == "help") {
        $("#help").css("background-color", "black");
    }
}


function helpHoverOut() {
    if ($("#help").html() == "help") {
        $("#help").css("background-color", "rgba(0, 0, 0, 0.5)");
    }
}


function helpClick() {

    if ( ($("#help").html() == "help") && ($("#help").css("opacity") == 1) ) {

        $("#help").css("cursor", "default");

        $("#help").animate({opacity: 0}, 500, function() {
            $("#help").html("right click anywhere on the page");
            $("#help").css("background-color", "transparent");
            $("#help").animate({opacity: 1}, 500).delay(2000).animate({opacity: 0}, 500, function() {
                $("#help").html("help");
                $("#help").css("background-color", "rgba(0, 0, 0, 0.5)");
                $("#help").animate({opacity: 1}, 500, function() {
                    $("#help").css("cursor", "pointer");
                });
            });
        });

    }

}


function changeSong(element) {

    if (element.id.includes("left")) {

        decrementCurrentIndex();
        loadAudio();

    } else {

        incrementCurrentIndex();
        loadAudio();

    }

}

var delay = 0;
var able = true;

function volumeShow() {

    delay = 2000;

    var audio = document.getElementById("myAudio");

    var percent = Math.round(audio.volume * 100) + "%";
    $("#volumeBoxRight").html(percent);

    $("#volumeBox").css("display", "block");

    if (able) {
        able = false;
        hideIt();
    }

}


function hideIt() {

    var interval = setInterval(function() {

        delay -= 1000;

        if (delay == 0) {

            $("#volumeBox").css("display", "none");
            able = true;
            clearInterval(interval);

        }

    }, 1000);

}


function keyboard(event) {

    if (!first) {

        contextHide();

        var audio = document.getElementById("myAudio");

        if (event.which == 32) {

            // space bar

            playpause();

        } else if (event.which == 37) {

            // left arrow

            if ((audio.currentTime - 5) < 0) {
                audio.currentTime = 0;
            } else {
                audio.currentTime -= 5;
            }

        } else if (event.which == 39) {

            // right arrow

            if ((audio.currentTime + 5) > audio.duration) {
                audio.currentTime = audio.duration;
            } else {
                audio.currentTime += 5;
            }

        } else if (event.which == 40) {

            // down arrow

            if ((audio.volume - 0.05) < 0) {
                audio.volume = 0;
            } else {
                audio.volume -= 0.05;
            }

            volumeShow();

        } else if (event.which == 38) {

            // up arrow

            if ((audio.volume + 0.05) > 1) {
                audio.volume = 1;
            } else {
                audio.volume += 0.05;
            }

            volumeShow();

        }  else if (event.which == 36) {

            // home button

            audio.currentTime = 0;

        }

    }

}


function isPlaying() {
    var audio = document.getElementById("myAudio");
    return !audio.paused;
}


function playpause() {

    var audio = document.getElementById("myAudio");

    if (!isPlaying()) {

        barID = requestAnimationFrame(barUpdater);
        particleID = requestAnimationFrame(particleUpdater);
        colorID = requestAnimationFrame(colorUpdater);

        audio.play();

    } else {

        cancelAnimationFrame(barID);
        cancelAnimationFrame(particleID);
        cancelAnimationFrame(colorID);

        audio.pause();

    }

}


function changeSongTitle(name) {

    if ( $("#songTitle").html().replace(/"/g, "") != name ) {

        document.title = "\"" + name + "\"" + " - audio visualizer";

        if (!first) {

            $("#songTitle").animate({opacity: 0}, 500, function() {
                $("#songTitle").html("\"" + name + "\"");
                $("#songTitle").animate({opacity: 1}, 500);
            });

        } else {

            $("#songTitle").html("\"" + name + "\"");
            $("#songTitle").animate({opacity: 1}, 500);

        }

    }

}


function loadAudio() {

    if (isPlaying()) {
        playpause();
    }

    changeSongTitle(songNames[currentIndex]);

    var audio = document.getElementById("myAudio");

    audio.src = songSources[currentIndex];
    audio.load();

    setup(audio);

}


function drop(event) {

    event.preventDefault();

    document.getElementById("dz").className = "dropzoneDefault";

    uploadFiles(event.dataTransfer.files);

}


function uploadFiles(files) {

    songNamesToAdd = [];
    songSourcesToAdd = [];

    var extension = "";

    for (var i = 0; i < files.length; i++) {
        extension = files[i].name.substring(files[i].name.length-3, files[i].name.length);
        extension = extension.toLowerCase();
        if ( (extension == "mp3") || (extension == "mp4") || (extension == "wav") ) {
            songNamesToAdd.push(files[i].name);
            songSourcesToAdd.push(URL.createObjectURL(files[i]));
        }
    }

    if (songNamesToAdd.length > 0) {

        if (first) {

            songNames = songNamesToAdd;
            songSources = songSourcesToAdd;
            currentIndex = 0;
            updateSongIndex();
            loadAudio();

        } else {

            $("#questionBox").css("display", "block");

        }

    }

}


function question(element) {

    if ($(element).html() == "Add") {

        for (var i = 0; i < songNamesToAdd.length; i++) {
            songNames.push(songNamesToAdd[i]);
            songSources.push(songSourcesToAdd[i]);
        }

        updateSongIndex();

    } else if ($(element).html() == "Start fresh") {

        songNames = songNamesToAdd;
        songSources = songSourcesToAdd;
        currentIndex = 0;
        updateSongIndex();
        loadAudio();

    }

    $("#questionBox").css("display", "none");

}


function formatTime(time) {

    var sec_num = parseInt(time, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    var newTime = "";

    if (hours > 0) {
        if (hours < 10) {
            newTime += "0";
        }
		newTime += hours;
        newTime += ":";
	}

    if (minutes < 10) {
		newTime += "0" + minutes;
	} else {
        newTime += minutes;
    }

    newTime += ":";

    if (seconds < 10) {
		newTime += "0" + seconds;
	} else {
        newTime += seconds;
    }

    return newTime;

}












function mouseDown(event) {

    extra = $("#timeBar").offset().left;

    cancelAnimationFrame(seekbarID);

    draggable = true;

}


function changeAudioPos() {

    var total = parseInt($("#timeBar").width());
    var percent = parseInt($("#statusBar").css("left")) / total;
    var audio = document.getElementById("myAudio");

    audio.currentTime = audio.duration*percent;

}


function move(event) {

    if (draggable) {

        var newLeft = event.pageX - extra;

        var low = 0;
        var high = parseInt($("#timeBar").width());

        if (newLeft >= low) {

            if (newLeft <= high) {

                var width = (newLeft/high)*100;

                $("#statusBar").css("left", newLeft + "px");

            } else {

                $("#statusBar").css("left", high + "px");

            }

        } else {

            $("#statusBar").css("left", low);

        }

    }

}





function message(message) {

    $("#message").queue(function(next) {

        $("#message").html(message);
        $("#message").css("display", "block");
        $("#message").css("zoom", "90%");

        $("#message").animate({ opacity: 1 }, { duration: 250, queue: false });
        $("#message").animate({ zoom: "100%" }, 250, function() {
            $("#message").delay(2500).animate({ opacity: 0 }, 250, function() {
                $("#message").css("display", "none");
                $("#message").css("zoom", "90%");
            });
        });

        next();

    });

}

function incrementCurrentIndex() {

    if ( (currentIndex+1) == songNames.length ) {

        currentIndex = 0;

    } else {

        currentIndex++;

    }

    updateSongIndex();

}

function decrementCurrentIndex() {

    if ( (currentIndex-1) == -1 ) {

        currentIndex = songNames.length - 1;

    } else {

        currentIndex--;

    }

    updateSongIndex();

}

function updateSongIndex() {

    $("#songIndex").html( (currentIndex+1) + "/" + songNames.length);

}



var particles = {};
var particleIndex = 0;


function Particle() {

    var canvas = document.getElementById("canvasParticles");

    this.x = Math.random() * (canvas.width / 2);
    this.y = Math.random() * canvas.height;

    this.vx = Math.random() * 1 + 0.5;
    this.vy = Math.random() * 1 - 0.5;

    particleIndex++;
    particles[particleIndex] = this;
    this.id = particleIndex;
    this.life = 0;
    this.maxLife = 1500;

    if (Math.random() > 0.5) {
        this.color = true;
    } else {
        this.color = false;
    }

    this.size = Math.random() * 3;

}


Particle.prototype.draw = function() {

    analyser.getByteFrequencyData(array);

    var canvas = document.getElementById("canvasParticles");
    var ctx = canvas.getContext("2d");

    this.x += this.vx + globalAdd;
    this.y += this.vy + globalAdd;

    this.life++;

    if (this.color) {
        ctx.fillStyle = "hsla(" + currentColor + ", 100%, 50%, 0.5)";
    } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    }

    if ( (this.life >= this.maxLife) || (this.x > canvas.width) || (this.y > canvas.height) ) {
        delete particles[this.id];
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();

}
