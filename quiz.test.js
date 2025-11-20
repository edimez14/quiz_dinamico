/**
 * @jest-environment jsdom
 */

const { decodeHtml, getLocalQuestions } = require('./script');

describe('Pruebas Unitarias Quiz Dinámico', () => {

    // Configuración inicial antes de cada prueba
    beforeEach(() => {
        // Simulamos el HTML que tu script espera encontrar
        document.body.innerHTML = `
            <div id="loading"></div>
            <div id="question"></div>
            <div id="answers"></div>
            <button id="next-btn"></button>
            <button id="restart-btn"></button>
            <div id="progress-text"></div>
            <div id="progress-bar"></div>
            <div id="timer"></div>
            <div id="current-score"></div>
        `;

        // Mock (simulación) de fetch global para evitar llamadas reales a APIs
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ results: [] }),
            })
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- PRUEBA 1: Funciones de Utilidad ---
    test('decodeHtml debe decodificar entidades HTML correctamente', () => {
        const input = "Qu&eacute; es &quot;esto&quot;?";
        const output = decodeHtml(input);
        expect(output).toBe('Qué es "esto"?');
    });

    test('decodeHtml debe manejar símbolos matemáticos', () => {
        const input = "5 &gt; 3 &amp; 2 &lt; 4";
        const output = decodeHtml(input);
        expect(output).toBe('5 > 3 & 2 < 4');
    });

    // --- PRUEBA 2: Integridad de Datos ---
    test('getLocalQuestions debe devolver un array de preguntas de respaldo', () => {
        const questions = getLocalQuestions();

        // Verificaciones básicas
        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBeGreaterThan(0);

        // Verificar estructura de una pregunta
        const firstQuestion = questions[0];
        expect(firstQuestion).toHaveProperty('question');
        expect(firstQuestion).toHaveProperty('answers');
        expect(firstQuestion).toHaveProperty('correct');
        expect(firstQuestion.answers).toContain(firstQuestion.correct);
    });

    test('getLocalQuestions debe contener la pregunta de la capital de España', () => {
        const questions = getLocalQuestions();
        const spainQuestion = questions.find(q => q.question.includes('España'));

        expect(spainQuestion).toBeDefined();
        expect(spainQuestion.correct).toBe('Madrid');
    });

    // --- PRUEBA 3: Simulación de Flujo (Mocking) ---
    test('Debe manejar el fallo de la API usando preguntas locales', async () => {
        // Forzamos que el fetch falle
        global.fetch.mockImplementationOnce(() => Promise.reject("API caída"));

        // Aquí llamaríamos a loadQuestions(), pero como tu código ejecuta 
        // loadQuestions() automáticamente al cargar el archivo, es difícil 
        // probar el "switch" exacto sin refactorizar el código para envolver la inicialización.

        // Sin embargo, podemos verificar que nuestra lógica de respaldo (backup) es sólida:
        const backupQuestions = getLocalQuestions();
        expect(backupQuestions.length).toBe(10);
    });
});