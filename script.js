// JARVIS Interface
const jarvisInterface = document.getElementById("jarvisInterface");
const statustext = document.getElementById('statustext');
const hudCircle = document.getElementById('hudCircle');
const hudCore = document.querySelector(".hud-core");
const hudSegments = document.querySelector(".hud-ring-segments");
const responseButtons = document.querySelector(".response-buttons");
const initializeBtn = document.getElementById('initializeBtn');
const movieTitle = document.getElementById('movieTitle');

// Outer Ring animation
const ringOuter = document.querySelector(".hud-ring-outer");
const ringAnimations = ringOuter.getAnimations();
const outerRotation = ringAnimations[0];

//Trailer Interface
const trailerInterface = document.getElementById("trailerInterface");
const trailerVideo = document.getElementById("trailerVideo");

// Audio Analyzer
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();

analyser.connect(audioContext.destination);

analyser.fftSize = 2048;
const audioData = new Uint8Array(analyser.fftSize);

// Speech Recognition
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let restartCounter = 0;
const maxRestarts = 5;
let listeningAllowed = false;
let listeningTimer = null;

const recognition = SpeechRecognition
    ? new SpeechRecognition()
    : null;

    if (recognition) {
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = function() {
            console.log("Speech recognition started successfully");
    };

    recognition.onerror = function(event) {

        if (event.error === "aborted" && !listeningAllowed) {
            console.log("Speech recognition intentionally terminated");
            return;
        }

        console.error("Speech recognition error:", event.error);

        if (event.error !== "no-speech") {
            listeningAllowed = false;

            clearTimeout(listeningTimer);
            listeningTimer = null;
        }
    };

    recognition.onend = function() {
        console.log("Speech recognition ended");

        if (conversationStage === 1 && listeningAllowed && restartCounter < maxRestarts) {

            setTimeout(function() {

                if (conversationStage === 1 && listeningAllowed && restartCounter < maxRestarts) {

                    restartCounter += 1;

                    try {
                        recognition.start();
                        console.log("Restart attempt:", restartCounter);

                    } catch (error) {
                        console.error("Restart failed:", error);
                    }
                }

            }, 500);
        }
    };

    recognition.onspeechstart = function() {
        console.log("Speech detected");
    };

    recognition.onspeechend = function() {
        console.log("Speech has stopped");
    };

    recognition.onaudiostart = function() {
        console.log("Microphone audio capture started");
    };

    recognition.onsoundstart = function() {
        console.log("Sound detected by microphone");
    };



    recognition.onresult = function(event) {
        if (conversationStage !== 1 || !listeningAllowed) {
            return;
        }

        console.log("Result index:", event.resultIndex);
        console.log("Total results:", event.results.length);
        console.log("Final result:", event.results[event.resultIndex].isFinal);

        const transcript = event.results[event.resultIndex][0].transcript;
        console.log("Recognized speech:", transcript);

        const answer = transcript.toLowerCase().trim();

        const detectedYes = /\byes\b/.test(answer);
        const detectedNo = /\bno\b/.test(answer);

        if (detectedYes && !detectedNo) {
            document.getElementById("YesBtn").click();

        } else if (detectedNo && !detectedYes) {
            document.getElementById("NoBtn").click();

        } else {
            console.log("Answer not recognized or ambiguous");
        }

        console.log("Latest transcript:", event.results[event.resultIndex][0].transcript);
    };
};

let dialogue;
initializeBtn.disabled = true;

fetch("Dialogue/en.json")
    .then(function(response) {
        if (!response.ok) {
            throw new Error("Dialogue file could not be loaded");
        }

        return response.json();
    })
    .then(function(data) {
        dialogue = data;
        initializeBtn.classList.add("reveal");
        initializeBtn.disabled = false;
        
    })
    .catch(function(error) {
        console.error("Failed to load dialogue:", error);
        statustext.textContent = "ERROR: Dialogue system unavailable.";
    });
    
function voice(key, onFinished) {
    const audio = new Audio(`Audio/en/${key}.mp3`);
    audio.playbackRate = 1;

    const source = audioContext.createMediaElementSource(audio);

    source.connect(analyser);

    audio.addEventListener("playing", function() {
        hudCircle.classList.add("speaking");
        outerRotation.playbackRate = 3;

        hudCircle.classList.remove("settling");

        if (!isMonitoring) {
            isMonitoring = true;
            monitorVoice();
        }
        console.log(`Playing event fired: ${key}`);
    });

    audio.addEventListener("ended", function() {
        console.log(`Finished speaking: ${key}`);

        source.disconnect();

        isMonitoring = false;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        
        hudCircle.classList.remove("speaking");
        if (!hudCircle.classList.contains("reveal")) {
            outerRotation.playbackRate = 1;
        }

        hudCircle.classList.add("settling");

        hudCircle.style.setProperty("--hud-scale", 1);
        hudSegments.style.setProperty("--segment-scale", 1);
        hudCore.style.setProperty("--voice-scale", 1);
        hudCore.style.setProperty("--voice-glow", "30px");

        if (onFinished) {
            onFinished();
        }

    });

    audio.play()
    .then(function() {
        console.log(`Audio started: ${key}`);
    })
    .catch(function(error) {
        console.error(`Audio failed: ${key}`, error);
    });
}

let conversationStage = 0;

initializeBtn.addEventListener('click', function() {
    statustext.textContent = dialogue.initialization;
    audioContext.resume();
    voice("initialization", function() {
        console.log("Audio completed, ready for the next audio");

        changeDialogue(dialogue.greeting);
         voice("greeting", function() {
            console.log("Audio completed, ready for the next audio");

            changeDialogue(dialogue.introduction);
            voice("introduction", function() {
                console.log("Audio completed, ready for the next audio");

                changeDialogue(dialogue.q1);
                voice("q1", function() {
                    console.log("Audio completed, ready for the next audio");

                    setTimeout(function() {
                        conversationStage = 1;
                        responseButtons.classList.add("visible");
                        if (recognition) {
                            listeningAllowed = true;
                            restartCounter = 0;

                            listeningTimer = setTimeout(function() {
                                listeningAllowed = false;
                                listeningTimer = null;

                                recognition.abort();

                                console.log("Maximum listening duration reached");

                            }, 30000);

                            console.log("Attempting to start speech recognition");

                            try {
                                recognition.start();

                            } catch (error) {
                                console.error("Failed to start recognition:", error);

                                listeningAllowed = false;
                                clearTimeout(listeningTimer);
                                listeningTimer = null;
                            }
                        }
                    }, 250);
                });
            });
        });
    });

    initializeBtn.textContent = "System Initialized";
    initializeBtn.style.visibility = "hidden";

    hudCircle.classList.add("active");
});

responseButtons.addEventListener('click', function(event) {
    if (event.target.id !== 'YesBtn' && event.target.id !== 'NoBtn') {
    return;
    }

    if (conversationStage !== 1) {
        return;
    }

    conversationStage = 0;
        listeningAllowed = false;

        clearTimeout(listeningTimer);
        listeningTimer = null;

        responseButtons.classList.remove("visible");

        if (recognition) {
            recognition.stop();
        }

    if (event.target.id === 'YesBtn') {
        changeDialogue(dialogue.yes1);
        voice("yes1", function() {
            console.log("Audio completed, ready for the next audio");

            changeDialogue(dialogue.yes2);
            voice("yes2", function() {
                console.log("Audio completed, ready for the next audio");

                changeDialogue(dialogue.yes3);
                voice("yes3", function() {
                    console.log("Audio completed, ready for the next audio");

                    hudCircle.classList.add("reveal");
                    outerRotation.playbackRate = 3;
                    document.body.classList.add("reveal");

                    setTimeout(function() {
                        changeDialogue("");
                        voice("title", function() {
                            console.log("Audio completed, ready for the next audio");
                        
                            setTimeout(function() {
                                jarvisInterface.addEventListener("transitionend", function(event) {
                                    if (event.target === jarvisInterface &&
                                        event.propertyName === "opacity" &&
                                        jarvisInterface.classList.contains("fade-out")) {

                                        jarvisInterface.style.display = "none";
                                    }
                                }, { once: true });

                                jarvisInterface.classList.add("fade-out");

                                setTimeout(function() {
                                    trailerInterface.classList.add("visible");

                                    trailerVideo.src = "https://www.youtube.com/embed/X1aFkAkFASk?autoplay=1&controls=1";

                                }, 1000);

                            }, 500);
                        })    

                    }, 1000);
                })
            });
        });

    } else if (event.target.id === 'NoBtn') {
        changeDialogue(dialogue.no1);
        voice("no1", function() {
            console.log("Audio completed, ready for the next audio");

            changeDialogue(dialogue.no2);
            voice("no2", function() {
                console.log("Audio completed, ready for the next audio");

                changeDialogue(dialogue.no3);
                voice("no3", function() {
                    console.log("Audio completed, ready for the next audio");

                    hudCircle.classList.add("reveal");
                    outerRotation.playbackRate = 3;
                    document.body.classList.add("reveal");

                    setTimeout(function() {
                        changeDialogue("");
                        voice("title", function() {
                            console.log("Audio completed, ready for the next audio");
                        
                            setTimeout(function() {
                                jarvisInterface.addEventListener("transitionend", function(event) {
                                    if (event.target === jarvisInterface &&
                                        event.propertyName === "opacity" &&
                                        jarvisInterface.classList.contains("fade-out")) {

                                        jarvisInterface.style.display = "none";
                                    }
                                }, { once: true });

                                jarvisInterface.classList.add("fade-out");

                                setTimeout(function() {
                                    trailerInterface.classList.add("visible");

                                    trailerVideo.src = "https://www.youtube.com/embed/X1aFkAkFASk?autoplay=1&controls=1";

                                }, 1000);

                            }, 500);
                        });

                    }, 1000);
                });
            });
        });
    }
})

function changeDialogue(message) {
    statustext.classList.add("fade-out");

    setTimeout(function() {
        statustext.textContent = message;

        statustext.classList.remove("fade-out");
    }, 250);
}

function getVoiceIntensity() {
    analyser.getByteTimeDomainData(audioData);
    
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
       const norm = (audioData[i] - 128)/128;

        sum += norm**2;

    };

    const RMS = Math.sqrt(sum / audioData.length);

    return RMS;

}

let isMonitoring = false;
let animationFrameId = null;

function monitorVoice() {
    if (!isMonitoring) {
        return;
    }

    const intensity = getVoiceIntensity();

    const scale = 1 + 2 * intensity;
    const hudScale = 1 + 0.5 * intensity;
    const segmentScale = 1 + 0.5 * intensity;
    const glow = 30 + 200 * intensity;

    hudCore.style.setProperty("--voice-scale", scale);
    hudCircle.style.setProperty("--hud-scale", hudScale);
    hudSegments.style.setProperty("--segment-scale", segmentScale);
    hudCore.style.setProperty("--voice-glow", `${glow}px`);

    animationFrameId = requestAnimationFrame(monitorVoice);
}

