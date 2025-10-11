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
let timePerQuestion = 30; // segundos por pregunta
let timeLeft = timePerQuestion;

// Decodificar entidades HTML
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// Cargar preguntas desde la API
async function loadQuestions() {
  try {
    loadingEl.classList.remove("hidden");

    // API alternativa en español (preguntas de cultura general)
    const response = await fetch('https://api.quiz-contest.xyz/questions?limit=10&page=1&category=entertainment&lang=es', {
      headers: {
        'Authorization': '$2b$12$sahD/xfgTpdu57/oK/xWAuV8w4YPH66P.zX9JO0IDjX0yyBjO1Hdi'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const rawQuestions = data.questions || data;

    questions = rawQuestions.map(q => ({
      question: q.question,
      answers: [...q.incorrectAnswers, q.correctAnswer].sort(() => Math.random() - 0.5),
      correct: q.correctAnswer
    }));

    loadingEl.classList.add("hidden");
    showQuestion();
    startTimer();
  } catch (error) {
    console.error("Error cargando preguntas:", error);

    // Fallback: preguntas locales en caso de error
    questions = getLocalQuestions();
    loadingEl.classList.add("hidden");
    showQuestion();
    startTimer();
  }
}

// Preguntas locales de respaldo
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

// Mostrar pregunta
function showQuestion() {
  resetState();
  let q = questions[currentQuestion];
  questionEl.innerHTML = q.question;

  // Actualizar progreso
  progressText.textContent = `Pregunta ${currentQuestion + 1} de ${questions.length}`;
  progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;

  // Actualizar puntuación actual
  currentScoreEl.textContent = `Puntuación: ${score}/${currentQuestion}`;

  // Reiniciar temporizador
  timeLeft = timePerQuestion;
  updateTimerDisplay();

  // Crear botones de respuestas
  q.answers.forEach(ans => {
    const btn = document.createElement("button");
    btn.classList.add("answer-btn");
    btn.innerHTML = ans;
    btn.addEventListener("click", () => selectAnswer(btn, q.correct));
    answersEl.appendChild(btn);
  });
}

// Reset de estado
function resetState() {
  nextBtn.disabled = true;
  answersEl.innerHTML = "";
  clearInterval(timerInterval);
}

// Iniciar temporizador
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

// Actualizar display del temporizador
function updateTimerDisplay() {
  timerEl.textContent = `Tiempo: ${timeLeft}s`;

  // Cambiar color cuando queda poco tiempo
  if (timeLeft <= 10) {
    timerEl.style.color = "#f44336";
    timerEl.style.fontWeight = "bold";
  } else {
    timerEl.style.color = "";
    timerEl.style.fontWeight = "";
  }
}

// Selección automática cuando se acaba el tiempo
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

// Selección de respuesta
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

// Botón siguiente
nextBtn.addEventListener("click", () => {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
    startTimer();
  } else {
    endQuiz();
  }
});

// Botón reiniciar
restartBtn.addEventListener("click", () => {
  currentQuestion = 0;
  score = 0;
  nextBtn.style.display = "block";
  restartBtn.style.display = "none";
  loadQuestions();
});

// Terminar quiz
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
loadQuestions();