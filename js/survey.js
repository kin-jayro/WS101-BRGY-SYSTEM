import { supa, requireAuth } from "./supabase.js";
let role;

async function init() {
    role = await requireAuth();

    if (role === "Level 1") {
        createSurveyBtn.style.display = "none";
    }

    await loadSurveys();
}

init();
const surveyModal = document.getElementById("surveyModal");

const createSurveyBtn = document.getElementById("createSurveyBtn");
const closeSurveyModal = document.getElementById("closeSurveyModal");

const questionsContainer = document.getElementById("questionsContainer");

const addQuestionBtn = document.getElementById("addQuestionBtn");
const saveSurveyBtn = document.getElementById("saveSurveyBtn");

const answerSurveyModal = document.getElementById("answerSurveyModal");
const answerSurveyTitle = document.getElementById("answerSurveyTitle");
const answerSurveyQuestions = document.getElementById("answerSurveyQuestions");

document.getElementById("closeAnswerSurvey").onclick = () => {
    answerSurveyModal.classList.remove("show");
};

let currentSurvey = null;

createSurveyBtn.onclick = () => {

    surveyModal.classList.add("show");

};

closeSurveyModal.onclick = () => {

    surveyModal.classList.remove("show");

};

function addQuestion(value = "") {

    const div = document.createElement("div");

    div.className = "survey-question";

    div.innerHTML = `
        <input
            type="text"
            class="questionInput"
            placeholder="Question"
            value="${value}">

        <button
            class="removeQuestionBtn"
            type="button">
            🗑
        </button>
    `;

    div.querySelector(".removeQuestionBtn")
        .onclick = () => div.remove();

    questionsContainer.appendChild(div);

}

addQuestionBtn.onclick = () => {

    addQuestion();

};

saveSurveyBtn.onclick = async () => {

    const title = surveyTitle.value.trim();

    if (!title) {

        alert("Enter a survey title.");

        return;

    }

    const { data: survey, error } = await supa
        .from("surveys")
        .insert({

            title,
            description: surveyDescription.value

        })
        .select()
        .single();

    if (error) {

        alert(error.message);

        return;

    }

    const rows = [];

    document
        .querySelectorAll(".questionInput")
        .forEach((input, index) => {

            if (!input.value.trim())
                return;

            rows.push({

                survey_id: survey.survey_id,
                question_text: input.value.trim(),
                display_order: index + 1

            });

        });

    if (rows.length) {

        await supa
            .from("survey_questions")
            .insert(rows);

    }

    alert("Survey created!");

    surveyModal.classList.remove("show");

    surveyTitle.value = "";
    surveyDescription.value = "";

    questionsContainer.innerHTML = "";

    addQuestion();

};

async function loadSurveys() {

    const surveyList = document.getElementById("surveyList");

    surveyList.innerHTML = "";

    const { data: surveys, error } = await supa
        .from("surveys")
        .select(`
            *,
            survey_questions (
                question_id,
                question_text,
                display_order
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    for (const survey of surveys) {

        survey.survey_questions.sort(
            (a, b) => a.display_order - b.display_order
        );

        // Get all ratings for this survey
        const { data: answers } = await supa
            .from("survey_answers")
            .select("rating")
            .eq("survey_id", survey.survey_id);

        let average = "No Ratings";

        if (answers && answers.length > 0) {
            const total = answers.reduce((sum, a) => sum + a.rating, 0);
            average = (total / answers.length).toFixed(1) + " ⭐";
        }

        const card = document.createElement("div");
        card.className = "survey-card";

        card.innerHTML = `
    <div class="survey-header">
        <h3>${survey.title}</h3>

        ${role !== "Level 1"
                ? `<span class="survey-rating">${average}</span>`
                : ""
            }
    </div>

    <p>${survey.description ?? ""}</p>

    <button
        class="answerSurveyBtn"
        data-id="${survey.survey_id}">
        Answer Survey
    </button>
`;

        surveyList.appendChild(card);

    }

}
document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("answerSurveyBtn"))
        return;

    const surveyId = e.target.dataset.id;

    const { data: survey, error } = await supa
        .from("surveys")
        .select(`
            *,
            survey_questions(
                question_id,
                question_text,
                display_order
            )
        `)
        .eq("survey_id", surveyId)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    currentSurvey = survey;

    answerSurveyTitle.textContent = survey.title;

    answerSurveyQuestions.innerHTML = "";

    survey.survey_questions
        .sort((a, b) => a.display_order - b.display_order)
        .forEach(question => {

            answerSurveyQuestions.innerHTML += `
                <div class="survey-answer">

                    <p>${question.question_text}</p>

                    <div class="rating-group">

                        ${[1, 2, 3, 4, 5].map(num => `
                            <label>
                                <input
                                    type="radio"
                                    name="q${question.question_id}"
                                    value="${num}">
                                ${num}
                            </label>
                        `).join("")}

                    </div>

                </div>
            `;

        });

    answerSurveyModal.classList.add("show");

});

document.getElementById("submitSurveyAnswers").onclick = async () => {

    const {
        data: { user }
    } = await supa.auth.getUser();

    const rows = [];

    currentSurvey.survey_questions.forEach(question => {

        const selected = document.querySelector(
            `input[name="q${question.question_id}"]:checked`
        );

        if (!selected)
            return;

        rows.push({

            survey_id: currentSurvey.survey_id,
            question_id: question.question_id,
            respondent_id: user.id,
            rating: Number(selected.value)

        });

    });

    if (rows.length !== currentSurvey.survey_questions.length) {

        alert("Please answer every question.");

        return;

    }

    const { error } = await supa
        .from("survey_answers")
        .insert(rows);

    if (error) {

        alert(error.message);

        return;

    }

    alert("Thank you for your response!");

    answerSurveyModal.classList.remove("show");

};
