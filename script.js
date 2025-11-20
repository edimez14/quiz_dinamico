const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");
const timerEl = document.getElementById("timer");
const currentScoreEl = document.getElementById("current-score");
const loadingEl = document.getElementById("loading");

let currentQuestion = 0;
let score = 0;
let questions = [];
let timerInterval;
let timePerQuestion = 30;
let timeLeft = timePerQuestion;

// Función mejorada para traducir texto con timeout
async function translateToSpanish(text) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve(text); // Devuelve texto original si se demora
        }, 3000);

        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`)
            .then(response => response.json())
            .then(data => {
                clearTimeout(timeout);
                resolve(data.responseData?.translatedText || text);
            })
            .catch(error => {
                clearTimeout(timeout);
                console.error('Error en traducción:', error);
                resolve(text);
            });
    });
}

// Cargar preguntas - Versión optimizada
async function loadQuestions() {
    try {
        loadingEl.style.display = "block";
        questionEl.style.display = "none";
        answersEl.style.display = "none";
        nextBtn.style.display = "none";

        loadingEl.innerHTML = "Cargando preguntas...";

        // Intentar cargar de API con timeout
        const apiPromise = fetch("https://opentdb.com/api.php?amount=10&category=9&difficulty=medium&type=multiple");
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000)
        );

        const res = await Promise.race([apiPromise, timeoutPromise]);

        if (!res.ok) throw new Error("Error al cargar preguntas");

        const data = await res.json();

        if (data.results && data.results.length > 0) {
            loadingEl.innerHTML = "Traduciendo preguntas...<br><small>Esto puede tomar unos segundos</small>";

            // Traducir máximo 10 preguntas para no saturar
            const questionsToTranslate = data.results.slice(0, 10);
            const translatedQuestions = [];

            for (const q of questionsToTranslate) {
                try {
                    const question = await translateToSpanish(decodeHtml(q.question));
                    const correct = await translateToSpanish(decodeHtml(q.correct_answer));
                    const incorrect = await Promise.all(
                        q.incorrect_answers.map(ans => translateToSpanish(decodeHtml(ans)))
                    );

                    const allAnswers = [...incorrect, correct].sort(() => Math.random() - 0.5);

                    translatedQuestions.push({
                        question: question,
                        answers: allAnswers,
                        correct: correct
                    });
                } catch (error) {
                    console.error("Error traduciendo pregunta:", error);
                    // Continuar con la siguiente pregunta
                }
            }

            if (translatedQuestions.length > 0) {
                questions = translatedQuestions;
            } else {
                throw new Error("No se pudieron traducir las preguntas");
            }
        } else {
            throw new Error("No questions returned");
        }

        currentQuestion = 0;
        score = 0;
        showQuizInterface();

    } catch (error) {
        console.error("Error cargando preguntas:", error);
        // Usar preguntas locales inmediatamente
        questions = getLocalQuestions();
        showQuizInterface();
    }
}

// Decodificar entidades HTML
function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// Mostrar la interfaz del quiz
function showQuizInterface() {
    loadingEl.style.display = "none";
    questionEl.style.display = "block";
    answersEl.style.display = "grid";
    nextBtn.style.display = "block";
    showQuestion();
    startTimer();
}

// Preguntas locales EN ESPAÑOL - Ampliadas (se mantiene igual)
function getLocalQuestions() {
    return [
        {
            question: "¿Cuál es la capital de España?",
            answers: ["Barcelona", "Madrid", "Valencia", "Sevilla"],
            correct: "Madrid"
        },
        {
            question: "¿En qué año llegó el hombre a la Luna?",
            answers: ["1965", "1969", "1972", "1958"],
            correct: "1969"
        },
        {
            question: "¿Cuál es el río más largo del mundo?",
            answers: ["Nilo", "Amazonas", "Misisipi", "Yangtsé"],
            correct: "Amazonas"
        },
        {
            question: "¿Quién pintó 'El Guernica'?",
            answers: ["Pablo Picasso", "Salvador Dalí", "Diego Velázquez", "Francisco de Goya"],
            correct: "Pablo Picasso"
        },
        {
            question: "¿Cuál es el elemento químico con símbolo 'O'?",
            answers: ["Oro", "Osmio", "Oxígeno", "Oganesón"],
            correct: "Oxígeno"
        },
        {
            question: "¿En qué continente se encuentra Egipto?",
            answers: ["Asia", "Europa", "África", "América"],
            correct: "África"
        },
        {
            question: "¿Cuál es el planeta más grande del sistema solar?",
            answers: ["Tierra", "Marte", "Júpiter", "Saturno"],
            correct: "Júpiter"
        },
        {
            question: "¿Quién escribió 'Cien años de soledad'?",
            answers: ["Gabriel García Márquez", "Mario Vargas Llosa", "Julio Cortázar", "Pablo Neruda"],
            correct: "Gabriel García Márquez"
        },
        {
            question: "¿Cuál es el océano más grande del mundo?",
            answers: ["Atlántico", "Índico", "Pacífico", "Ártico"],
            correct: "Pacífico"
        },
        {
            question: "¿En qué año comenzó la Segunda Guerra Mundial?",
            answers: ["1939", "1941", "1935", "1945"],
            correct: "1939"
        }
    ];
}

// El resto de las funciones se mantienen igual...
function showQuestion() {
    resetState();
    let q = questions[currentQuestion];
    questionEl.innerHTML = q.question;

    progressText.textContent = `Pregunta ${currentQuestion + 1} de ${questions.length}`;
    progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
    currentScoreEl.textContent = `Puntuación: ${score}/${currentQuestion}`;

    timeLeft = timePerQuestion;
    updateTimerDisplay();

    q.answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.classList.add("answer-btn");
        btn.innerHTML = ans;
        btn.addEventListener("click", () => selectAnswer(btn, q.correct));
        answersEl.appendChild(btn);
    });
}

function resetState() {
    nextBtn.disabled = true;
    answersEl.innerHTML = "";
    clearInterval(timerInterval);
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = timePerQuestion;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoSelectAnswer();
        }
    }, 1000);
}

function updateTimerDisplay() {
    timerEl.textContent = `Tiempo: ${timeLeft}s`;
    if (timeLeft <= 10) {
        timerEl.style.color = "#f44336";
        timerEl.style.fontWeight = "bold";
    } else {
        timerEl.style.color = "";
        timerEl.style.fontWeight = "";
    }
}

function autoSelectAnswer() {
    const buttons = document.querySelectorAll(".answer-btn");
    const correctButton = Array.from(buttons).find(btn =>
        btn.innerHTML === questions[currentQuestion].correct
    );

    buttons.forEach(b => {
        b.disabled = true;
        if (b === correctButton) {
            b.classList.add("correct");
        } else {
            b.classList.add("incorrect");
        }
    });

    nextBtn.disabled = false;
}

function selectAnswer(btn, correct) {
    clearInterval(timerInterval);

    const buttons = document.querySelectorAll(".answer-btn");
    buttons.forEach(b => {
        b.disabled = true;
        if (b.innerHTML === correct) {
            b.classList.add("correct");
        } else if (b === btn) {
            b.classList.add("incorrect");
        }
    });

    if (btn.innerHTML === correct) {
        score++;
    }

    nextBtn.disabled = false;
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        currentQuestion++;
        if (currentQuestion < questions.length) {
            showQuestion();
            startTimer();
        } else {
            endQuiz();
        }
    });
}

if (restartBtn) {
    restartBtn.addEventListener("click", () => {
        currentQuestion = 0;
        score = 0;
        nextBtn.style.display = "block";
        restartBtn.style.display = "none";
        loadQuestions();
    });
}

function endQuiz() {
    clearInterval(timerInterval);
    questionEl.innerHTML = "¡Quiz terminado!";
    answersEl.innerHTML = "";

    const percentage = (score / questions.length) * 100;
    let message = "";

    if (percentage >= 90) {
        message = "¡Excelente! Eres un experto en este tema.";
    } else if (percentage >= 70) {
        message = "¡Muy bien! Tienes un buen conocimiento.";
    } else if (percentage >= 50) {
        message = "Buen trabajo, pero hay espacio para mejorar.";
    } else {
        message = "Sigue practicando para mejorar tu puntuación.";
    }

    questionEl.innerHTML = `
        <div class="final-score">Tu puntuación final es: ${score} de ${questions.length}</div>
        <div class="performance-message">${message}</div>
    `;

    nextBtn.style.display = "none";
    restartBtn.style.display = "block";
    progressBar.style.width = "100%";
    progressText.textContent = "Quiz completado";
    timerEl.textContent = "";
    currentScoreEl.textContent = `Puntuación final: ${score}/${questions.length}`;
}

// Iniciar la aplicación
if (typeof module === 'undefined') {
    loadQuestions();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        decodeHtml,
        getLocalQuestions,
        translateToSpanish,
    };
}