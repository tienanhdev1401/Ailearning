import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { useToast } from "../../../context/ToastContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const questions = [
  // --- LEVEL A1 ---
  {
    id: 1,
    category: "Vocabulary (Beginner A1)",
    question: "What is the opposite of the word 'hot'?",
    options: ["Warm", "Cold", "Sunny", "Dry"],
    correct: "Cold",
    explanation: "The opposite of 'hot' is 'cold'."
  },
  {
    id: 2,
    category: "Grammar (Beginner A1)",
    question: "Complete the sentence: 'Hello, my ________ is Sarah. Nice to meet you.'",
    options: ["name", "age", "job", "friend"],
    correct: "name",
    explanation: "We introduce ourselves saying 'my name is'."
  },
  {
    id: 3,
    category: "Grammar (Beginner A1)",
    question: "Choose the correct pronoun: 'This is my brother. ________ is a student.'",
    options: ["She", "He", "They", "It"],
    correct: "He",
    explanation: "'Brother' refers to a male, so the singular pronoun 'He' is correct."
  },
  // --- LEVEL A2 ---
  {
    id: 4,
    category: "Grammar (Elementary A2)",
    question: "Complete the sentence: 'Where ________ you go for your vacation last summer?'",
    options: ["do", "did", "have", "were"],
    correct: "did",
    explanation: "'Last summer' requires the past simple question auxiliary verb 'did'."
  },
  {
    id: 5,
    category: "Vocabulary (Elementary A2)",
    question: "Complete the sentence: 'I usually go to work ________ bus because it is cheap and convenient.'",
    options: ["by", "on", "with", "in"],
    correct: "by",
    explanation: "We use 'by + mode of transport' (by bus, by car, by train)."
  },
  {
    id: 6,
    category: "Conversational English (Elementary A2)",
    question: "Choose the most appropriate response: 'Excuse me, could you tell me the way to the post office?' - '________'",
    options: [
      "Go straight and turn left at the corner.",
      "Yes, I like post offices.",
      "No, I cannot write letters.",
      "It is very expensive."
    ],
    correct: "Go straight and turn left at the corner.",
    explanation: "The question asks for directions, so giving instructions is the correct response."
  },
  // --- LEVEL B1 ---
  {
    id: 7,
    category: "Grammar (Intermediate B1)",
    question: "Complete the sentence: 'She ________ English for three years before she moved to London.'",
    options: ["is studying", "has studied", "had been studying", "studies"],
    correct: "had been studying",
    explanation: "An action happening continuously before another action in the past requires Past Perfect Continuous ('had been studying')."
  },
  {
    id: 8,
    category: "Prepositions (Intermediate B1)",
    question: "Complete the sentence: 'Are you interested ________ joining our new photography club?'",
    options: ["on", "at", "in", "about"],
    correct: "in",
    explanation: "The adjective 'interested' is followed by the preposition 'in'."
  },
  {
    id: 9,
    category: "Vocabulary (Intermediate B1)",
    question: "Complete the sentence: 'I cannot afford to buy that house. The price is much too ________.'",
    options: ["tall", "high", "expensive", "big"],
    correct: "high",
    explanation: "Prices are described as 'high' or 'low', while items are 'expensive' or 'cheap'."
  },
  // --- LEVEL B2 ---
  {
    id: 10,
    category: "Grammar (Upper Intermediate B2)",
    question: "Complete the conditional sentence: 'If you ________ harder, you would have passed the exam last week.'",
    options: ["studied", "had studied", "would study", "would have studied"],
    correct: "had studied",
    explanation: "This is a Third Conditional sentence referring to past regrets: 'If + had + past participle, would have + past participle'."
  },
  {
    id: 11,
    category: "Idioms (Upper Intermediate B2)",
    question: "Complete the sentence: 'Since we are running out of time, let's ________ and discuss the main issue.'",
    options: ["beat around the bush", "cut to the chase", "hit the nail on the head", "break the ice"],
    correct: "cut to the chase",
    explanation: "'Cut to the chase' means to get straight to the point without wasting time."
  },
  {
    id: 12,
    category: "Relative Clauses (Upper Intermediate B2)",
    question: "Complete the sentence: 'The woman ________ car was stolen yesterday reported the incident to the police.'",
    options: ["who", "whom", "whose", "which"],
    correct: "whose",
    explanation: "We use 'whose' as a possessive relative pronoun referencing 'the woman's car'."
  },
  // --- LEVEL C1 ---
  {
    id: 13,
    category: "Grammar (Advanced C1)",
    question: "Complete the inverted sentence: 'Seldom ________ such a brilliant performance by a young pianist.'",
    options: ["we have heard", "have we heard", "did we heard", "we heard"],
    correct: "have we heard",
    explanation: "Negative adverbs like 'Seldom' require inversion: 'Seldom + auxiliary verb + subject + verb'."
  },
  {
    id: 14,
    category: "Vocabulary (Advanced C1)",
    question: "Complete the collocation: 'The government took ________ measures to curb the rising inflation rate.'",
    options: ["drastic", "severe", "hard", "heavy"],
    correct: "drastic",
    explanation: "'Drastic measures' is a very strong and natural English collocation."
  },
  {
    id: 15,
    category: "Reading Comprehension (Advanced C1)",
    question: "Read the sentence: 'The author's latest novel, far from being a failure, was a tour de force of narrative innovation.' The phrase 'tour de force' implies the novel was:",
    options: [
      "A forced and unnatural story.",
      "An outstanding creative masterpiece.",
      "A commercial disaster.",
      "A simple and easy read."
    ],
    correct: "An outstanding creative masterpiece.",
    explanation: "A 'tour de force' is an exceptional achievement or masterpiece of skill."
  },
  // --- LEVEL C2 ---
  {
    id: 16,
    category: "Grammar (Proficient C2)",
    question: "Complete the subjunctive clause: 'It is imperative that the proposal ________ submitted to the board before tomorrow's meeting.'",
    options: ["be", "is", "should", "will be"],
    correct: "be",
    explanation: "Adjectives expressing necessity like 'imperative' require a subjunctive bare infinitive ('be') in the dependent clause."
  },
  {
    id: 17,
    category: "Vocabulary (Proficient C2)",
    question: "Complete the sentence: 'His brilliant presentation ________ any doubts the investors had about the project.'",
    options: ["dispelled", "dissolved", "scattered", "deleted"],
    correct: "dispelled",
    explanation: "'Dispelled' is the correct high-level verb meaning to make a doubt, feeling, or belief disappear."
  },
  {
    id: 18,
    category: "Vocabulary (Proficient C2)",
    question: "Complete the idiom: 'After years of dedicated research, the scientist was finally ________ of a major breakthrough.'",
    options: ["on the verge", "at the edge", "on the fringe", "in the vicinity"],
    correct: "on the verge",
    explanation: "'On the verge of' is the correct idiom to express being very close to experiencing or discovering something."
  }
];

// Map scores to CEFR Levels
const getLevelFromScore = (score) => {
  if (score <= 3) return { name: "Beginner A1", badge: "🌱", desc: "You're just starting your language journey! A1 is the perfect place to build a strong, clear foundation." };
  if (score <= 6) return { name: "Elementary A2", badge: "🌿", desc: "You understand simple expressions! A2 will help you build confidence and speak more naturally." };
  if (score <= 10) return { name: "Intermediate B1", badge: "🪴", desc: "You have a solid base! B1 will help you express opinions and handle real-world conversations." };
  if (score <= 13) return { name: "Upper Intermediate B2", badge: "🌳", desc: "Excellent command! B2 will help you master fluent discussions and professional environments." };
  if (score <= 16) return { name: "Advanced C1", badge: "🌸", desc: "Outstanding! C1 will help you express complex ideas fluently and spontaneously with precision." };
  return { name: "Proficient C2", badge: "🌟", desc: "Native-like mastery! C2 will keep your skills exceptionally sharp and fluid in any domain." };
};

const PlacementTestPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(0); // 0: intro, 1: quiz, 2: analyzing, 3: results
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing analyzer...");
  const [finalScore, setFinalScore] = useState(0);
  const [recommendedLevel, setRecommendedLevel] = useState("Beginner A1");

  // Start the quiz
  useEffect(() => {
    // Directly start the quiz step when component loads (since FindLevelPage acts as the intro)
    setCurrentStep(1);
  }, []);

  // Loading Screen simulation
  useEffect(() => {
    if (currentStep === 2) {
      const texts = [
        "Analyzing grammar and tense accuracy...",
        "Evaluating advanced vocabulary range...",
        "Assessing reading comprehension skills...",
        "Mapping language fluency to CEFR standards...",
        "Synthesizing your custom curriculum..."
      ];
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 4;
        setLoadingProgress(progress);
        
        const textIndex = Math.min(Math.floor(progress / 20), texts.length - 1);
        setLoadingText(texts[textIndex]);

        if (progress >= 100) {
          clearInterval(interval);
          // Calculate score and switch to results
          let score = 0;
          questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correct) {
              score += 1;
            }
          });
          setFinalScore(score);
          setRecommendedLevel(getLevelFromScore(score).name);
          setCurrentStep(3);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [currentStep, selectedAnswers]);

  const handleSelectOption = (option) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: option
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Transition to analyzing phase
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // Go back to the placement landing page
      navigate("/welcome/placement");
    }
  };

  const handleFinishSetup = async () => {
    const reason = sessionStorage.getItem("reason");
    const goal = sessionStorage.getItem("goal");
    const parsedGoal = goal ? JSON.parse(goal) : null;
    const topics = sessionStorage.getItem("topics");
    const parsedTopics = topics ? JSON.parse(topics) : [];

    const confirmData = {
      reason,
      goal: parsedGoal,
      topics: parsedTopics,
      proficiency: `Tested Level (${recommendedLevel})`,
      level: recommendedLevel
    };

    try {
      const response = await api.post("/confirm/", confirmData);
      console.log("Setup data submitted successfully:", response.data);
      toast.success("Welcome aboard! Your proficiency profile has been recorded successfully.");
    } catch (error) {
      console.error("Error submitting setup data:", error);
      toast.error("Failed to sync your preferences. Please try again.");
    }

    // Clear session storage and route to main page
    sessionStorage.clear();
    navigate("/");
  };

  const handleChooseManually = () => {
    sessionStorage.setItem("proficiency", `Tested Level (${recommendedLevel})`);
    sessionStorage.setItem("level", recommendedLevel);
    navigate("/welcome/level");
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
  const levelDetails = getLevelFromScore(finalScore);

  return (
    <div className="min-vh-100 bg-white text-dark d-flex align-items-center py-5" data-bs-theme="light">
      <div className="container" style={{ maxWidth: "720px", position: "relative" }}>
        
        {/* ================= STEP 1: THE QUIZ ================= */}
        {currentStep === 1 && (
          <div>
            {/* Top Navigation */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <button
                onClick={handleBack}
                className="btn btn-light border d-flex align-items-center justify-content-center"
                style={{
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                }}
              >
                <i className="bi bi-arrow-left fs-5 text-primary"></i>
              </button>
              
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fw-semibold">
                Category: {currentQuestion.category}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="d-flex align-items-center mb-5 gap-3">
              <div className="progress flex-grow-1" style={{ height: "10px", borderRadius: "10px" }}>
                <div
                  className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${progressPercent}%`, transition: "width 0.3s ease" }}
                ></div>
              </div>
              <span className="text-secondary fw-semibold" style={{ fontSize: "0.9rem", minWidth: "90px" }}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Question Card */}
            <div className="card border-0 bg-light p-4 rounded-4 mb-4 shadow-sm">
              <h4 className="fw-bold mb-0 lh-base text-dark-emphasis">
                {currentQuestion.question}
              </h4>
            </div>

            {/* Options List */}
            <div className="d-flex flex-column gap-3 mb-4">
              {currentQuestion.options.map((option, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedAnswers[currentQuestionIndex] === option;
                
                return (
                  <button
                    key={idx}
                    className={`btn d-flex align-items-center border rounded-4 py-3 px-4 text-start transition-all ${
                      isSelected
                        ? "border-primary bg-primary-subtle shadow-sm"
                        : "border-light-subtle bg-white hover-card"
                    }`}
                    onClick={() => handleSelectOption(option)}
                    style={{
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <span 
                      className={`badge rounded-circle me-3 d-flex align-items-center justify-content-center ${
                        isSelected ? "bg-primary text-white" : "bg-light text-secondary border"
                      }`}
                      style={{ width: "32px", height: "32px", fontSize: "0.95rem" }}
                    >
                      {label}
                    </span>
                    <span className={`fs-5 fw-semibold ${isSelected ? "text-primary" : "text-dark"}`}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-end mt-5">
              <button
                className="btn btn-primary px-5 py-3 rounded-pill fw-bold fs-5 shadow"
                disabled={!selectedAnswers[currentQuestionIndex]}
                onClick={handleNext}
                style={{ minWidth: "160px" }}
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish Test" : "Next Question"}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: AI ANALYZING LOADER ================= */}
        {currentStep === 2 && (
          <div className="text-center py-5">
            <div className="mb-5 position-relative d-inline-block">
              <div 
                className="spinner-border text-primary" 
                role="status"
                style={{ width: "120px", height: "120px", borderWidth: "8px" }}
              ></div>
              <div 
                className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center"
                style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#f8f9fa" }}
              >
                <span className="fs-3 fw-bold text-primary">{loadingProgress}%</span>
              </div>
            </div>
            
            <h3 className="fw-bold text-dark mb-3">AI Language Proficiency Audit</h3>
            <p className="text-muted fs-5 mb-5 px-4" style={{ maxWidth: "500px", margin: "0 auto" }}>
              {loadingText}
            </p>

            <div className="progress mx-auto shadow-sm" style={{ height: "8px", maxWidth: "400px", borderRadius: "10px" }}>
              <div 
                className="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: RESULTS DASHBOARD ================= */}
        {currentStep === 3 && (
          <div className="text-center">
            {/* Header / Celebration */}
            <div className="mb-4">
              <span className="display-1">{levelDetails.badge}</span>
              <h2 className="fw-extrabold mt-3 display-6 text-dark">Audit Results</h2>
              <p className="text-secondary fs-5">We analyzed your skills and mapped your language proficiency level.</p>
            </div>

            {/* Mapped Level Card */}
            <div 
              className="card border-0 p-5 rounded-4 mb-4 shadow"
              style={{
                background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)",
                color: "#ffffff"
              }}
            >
              <div className="badge bg-white text-primary px-3 py-2 rounded-pill fw-bold mb-3 d-inline-block" style={{ width: "fit-content", margin: "0 auto" }}>
                RECOMMENDED CEFR LEVEL
              </div>
              <h1 className="fw-extrabold display-4 mb-3">{levelDetails.name}</h1>
              <p className="fs-5 opacity-90 mb-0 px-md-4">
                {levelDetails.desc}
              </p>
            </div>

            {/* Score & Skill Breakdown Details */}
            <div className="row g-3 mb-5">
              {/* Score card */}
              <div className="col-12 col-md-6">
                <div className="card border border-light-subtle rounded-4 p-4 h-100 bg-light shadow-sm text-start">
                  <h6 className="text-muted fw-bold text-uppercase mb-2">Overall Accuracy</h6>
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="display-4 fw-extrabold text-primary">{finalScore}</span>
                    <span className="fs-3 text-secondary">/ {questions.length}</span>
                  </div>
                  <p className="text-secondary mt-3 mb-0">
                    You answered {finalScore} out of {questions.length} questions correctly. 
                    This is in line with the standard benchmarks for **{levelDetails.name}**.
                  </p>
                </div>
              </div>

              {/* Skills breakdown */}
              <div className="col-12 col-md-6">
                <div className="card border border-light-subtle rounded-4 p-4 h-100 bg-light shadow-sm text-start">
                  <h6 className="text-muted fw-bold text-uppercase mb-3">Skill Breakdown</h6>
                  
                  {/* Skill 1: Grammar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                      <span>Grammar & Structure</span>
                      <span className="text-primary">{finalScore >= 7 ? "High" : finalScore >= 4 ? "Medium" : "Developing"}</span>
                    </div>
                    <div className="progress" style={{ height: "6px" }}>
                      <div 
                        className="progress-bar bg-primary" 
                        style={{ width: `${Math.min(100, Math.max(30, finalScore * 10))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Skill 2: Vocabulary */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                      <span>Vocabulary & Context</span>
                      <span className="text-success">{finalScore >= 8 ? "High" : finalScore >= 5 ? "Medium" : "Developing"}</span>
                    </div>
                    <div className="progress" style={{ height: "6px" }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${Math.min(100, Math.max(35, (finalScore + 1) * 9))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Skill 3: Reading */}
                  <div>
                    <div className="d-flex justify-content-between fw-semibold mb-1" style={{ fontSize: "0.85rem" }}>
                      <span>Comprehension & Context</span>
                      <span className="text-warning">{finalScore >= 8 ? "High" : finalScore >= 5 ? "Medium" : "Developing"}</span>
                    </div>
                    <div className="progress" style={{ height: "6px" }}>
                      <div 
                        className="progress-bar bg-warning" 
                        style={{ width: `${Math.min(100, Math.max(25, (finalScore) * 9.5))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="d-flex flex-column gap-3 justify-content-center align-items-center mt-4">
              <div className="d-flex flex-column flex-sm-row gap-3 w-100 justify-content-center">
                <button
                  className="btn btn-primary px-5 py-2.5 rounded-pill fw-semibold fs-5 shadow"
                  onClick={handleFinishSetup}
                >
                  Finish Setup & Start Learning
                </button>
                <button
                  className="btn btn-outline-primary px-5 py-2.5 rounded-pill fw-semibold fs-5"
                  onClick={handleChooseManually}
                >
                  Choose Level Manually
                </button>
              </div>
              <button
                className="btn btn-link text-secondary fw-semibold mt-2"
                onClick={() => {
                  setCurrentStep(1);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Retake placement test
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .transition-all {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-card:hover {
          transform: translateY(-2px);
          border-color: #0d6efd !important;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.08);
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
};

export default PlacementTestPage;
