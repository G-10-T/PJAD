// JARVIS Interface
const jarvisInterface = document.getElementById("jarvisInterface");
const statustext = document.getElementById('statustext');
const hudCircle = document.getElementById('hudCircle');
const responseButtons = document.querySelector(".response-buttons");
const initializeBtn = document.getElementById('initializeBtn');
const movieTitle = document.getElementById('movieTitle');

//Trailer Interface
const trailerInterface = document.getElementById("trailerInterface");
const trailerVideo = document.getElementById("trailerVideo");

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
    

    audio.addEventListener("ended", function() {
        console.log(`Finished speaking: ${key}`)

        if (onFinished) {
            onFinished();
        }
    });

    audio.play();
}

let conversationStage = 1;

initializeBtn.addEventListener('click', function() {
    statustext.textContent = dialogue.initialization;
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
                        responseButtons.classList.add("visible");

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

    if (conversationStage === 1) {
        if (event.target.id === 'YesBtn') {
            changeDialogue(dialogue.ans1_yes);
            voice("ans1_yes", function() {
                console.log("Audio completed, ready for the next audio");

                changeDialogue(dialogue.q2);
                voice("q2", function() {
                    console.log("Audio completed, ready for the next audio");

                    setTimeout(function() {
                        responseButtons.classList.add("visible");
                    }, 250)
                });
            });
            
            responseButtons.classList.remove("visible");
            conversationStage = 2;

        } else if (event.target.id === 'NoBtn') {
            changeDialogue(dialogue.ans1_no);
            voice("ans1_no", function() {
                console.log("Audio completed, ready for the next audio");

                changeDialogue(dialogue.goodbye);
                voice("goodbye", function() {
                    console.log("Audio completed, ready for the next audio");

                });
            });

            responseButtons.classList.remove("visible");
            conversationStage = 0;
        }

    } else if (conversationStage === 2) {
        if (event.target.id === 'YesBtn') {
            changeDialogue(dialogue.ans2_yes1);
            voice("ans2_yes1", function() {
                console.log("Audio completed, ready for the next audio");

                changeDialogue(dialogue.ans2_yes2);
                voice("ans2_yes2", function() {
                    console.log("Audio completed, ready for the next audio");

                    hudCircle.classList.add("reveal");
                    document.body.classList.add("reveal");

                    setTimeout(function() {
                        movieTitle.classList.add("reveal");
                        
                        setTimeout(function() {
                            jarvisInterface.classList.add("fade-out");
                            
                            setTimeout(function() {
                                trailerInterface.classList.add("visible");
                                trailerVideo.src = "https://www.youtube.com/embed/X1aFkAkFASk?autoplay=1&controls=1";
                            }, 2000);
                        }, 5000);
                            
                    }, 500)
                });
            });

            responseButtons.classList.remove("visible");
            conversationStage = 3;

        } else if (event.target.id === 'NoBtn') {
            changeDialogue(dialogue.sd);
            voice("sd", function() {
                console.log("Audio completed, ready for the next audio");

            });

            responseButtons.classList.remove("visible");
            conversationStage = 0;
        }
    } 
});

function changeDialogue(message) {
    statustext.classList.add("fade-out");

    setTimeout(function() {
        statustext.textContent = message;

        statustext.classList.remove("fade-out");
    }, 250);
}

