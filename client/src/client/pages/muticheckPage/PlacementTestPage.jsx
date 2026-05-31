import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { useToast } from "../../../context/ToastContext";
import styles from "../../styles/MulticheckPages.module.css";

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
    <div className={styles.page}>
      <div className={styles.container}>
        
        {/* ================= STEP 1: THE QUIZ ================= */}
        {currentStep === 1 && (
          <div>
            {/* Top Navigation */}
            <div className={styles.quizHeader}>
              <button onClick={handleBack} className={styles.backButton} style={{ position: "static" }}>
                ←
              </button>
              <span className={styles.categoryBadge}>
                {currentQuestion.category}
              </span>
            </div>

            {/* Progress Bar */}
            <div className={styles.quizProgress}>
              <div className={styles.quizProgressBar}>
                <div
                  className={styles.quizProgressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={styles.quizCounter}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Question Card */}
            <div className={styles.questionCard}>
              <p className={styles.questionText}>
                {currentQuestion.question}
              </p>
            </div>

            {/* Options List */}
            <div className={styles.quizOptionList}>
              {currentQuestion.options.map((option, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedAnswers[currentQuestionIndex] === option;
                
                return (
                  <div
                    key={idx}
                    className={`${styles.quizOption} ${isSelected ? styles.quizOptionSelected : ""}`}
                    onClick={() => handleSelectOption(option)}
                  >
                    <span className={styles.quizOptionLabel}>{label}</span>
                    <span className={styles.quizOptionText}>{option}</span>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className={styles.quizNav}>
              <button
                className={styles.nextButton}
                disabled={!selectedAnswers[currentQuestionIndex]}
                onClick={handleNext}
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish Test" : "Next Question"}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: AI ANALYZING LOADER ================= */}
        {currentStep === 2 && (
          <div className={styles.analyzerContainer}>
            <div className={styles.analyzerOrb} />
            
            <h3 className={styles.analyzerTitle}>AI Language Proficiency Audit</h3>
            <p className={styles.analyzerText}>
              {loadingText}
            </p>

            <div className={styles.analyzerProgressBar}>
              <div
                className={styles.analyzerProgressFill}
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ================= STEP 3: RESULTS DASHBOARD ================= */}
        {currentStep === 3 && (
          <div className={styles.resultsContainer}>
            {/* Header / Celebration */}
            <div className={styles.resultsBadge}>{levelDetails.badge}</div>
            <h2 className={styles.resultsTitle}>Audit Results</h2>
            <p className={styles.resultsSubtitle}>
              We analyzed your skills and mapped your language proficiency level.
            </p>

            {/* Mapped Level Card */}
            <div className={styles.levelCard}>
              <div className={styles.levelBadge}>
                RECOMMENDED CEFR LEVEL
              </div>
              <h1 className={styles.levelName}>{levelDetails.name}</h1>
              <p className={styles.levelDesc}>
                {levelDetails.desc}
              </p>
            </div>

            {/* Score & Skill Breakdown Details */}
            <div className={styles.statsGrid}>
              {/* Score card */}
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Overall Accuracy</div>
                <div className={styles.statScore}>
                  <span className={styles.statScoreNumber}>{finalScore}</span>
                  <span className={styles.statScoreTotal}>/ {questions.length}</span>
                </div>
                <p className={styles.statDescription}>
                  You answered {finalScore} out of {questions.length} questions correctly.
                </p>
              </div>

              {/* Skills breakdown */}
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Skill Breakdown</div>
                
                {/* Skill 1: Grammar */}
                <div className={styles.skillRow}>
                  <div className={styles.skillHeader}>
                    <span className={styles.skillName}>Grammar & Structure</span>
                    <span className={`${styles.skillLevel} ${finalScore >= 7 ? styles.skillLevelHigh : finalScore >= 4 ? styles.skillLevelMedium : styles.skillLevelDeveloping}`}>
                      {finalScore >= 7 ? "High" : finalScore >= 4 ? "Medium" : "Developing"}
                    </span>
                  </div>
                  <div className={styles.skillBar}>
                    <div className={styles.skillBarFillGreen} style={{ width: `${Math.min(100, Math.max(30, finalScore * 10))}%` }} />
                  </div>
                </div>

                {/* Skill 2: Vocabulary */}
                <div className={styles.skillRow}>
                  <div className={styles.skillHeader}>
                    <span className={styles.skillName}>Vocabulary & Context</span>
                    <span className={`${styles.skillLevel} ${finalScore >= 8 ? styles.skillLevelHigh : finalScore >= 5 ? styles.skillLevelMedium : styles.skillLevelDeveloping}`}>
                      {finalScore >= 8 ? "High" : finalScore >= 5 ? "Medium" : "Developing"}
                    </span>
                  </div>
                  <div className={styles.skillBar}>
                    <div className={styles.skillBarFillCyan} style={{ width: `${Math.min(100, Math.max(35, (finalScore + 1) * 9))}%` }} />
                  </div>
                </div>

                {/* Skill 3: Reading */}
                <div className={styles.skillRow}>
                  <div className={styles.skillHeader}>
                    <span className={styles.skillName}>Comprehension & Context</span>
                    <span className={`${styles.skillLevel} ${finalScore >= 8 ? styles.skillLevelHigh : finalScore >= 5 ? styles.skillLevelMedium : styles.skillLevelDeveloping}`}>
                      {finalScore >= 8 ? "High" : finalScore >= 5 ? "Medium" : "Developing"}
                    </span>
                  </div>
                  <div className={styles.skillBar}>
                    <div className={styles.skillBarFillAmber} style={{ width: `${Math.min(100, Math.max(25, finalScore * 9.5))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className={styles.resultActions}>
              <div className={styles.resultActionsRow}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleFinishSetup}
                >
                  Finish Setup & Start Learning
                </button>
                <button
                  className={styles.btnOutline}
                  onClick={handleChooseManually}
                >
                  Choose Level Manually
                </button>
              </div>
              <button
                className={styles.btnLink}
                onClick={() => {
                  setCurrentStep(1);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                }}
              >
                ↺ Retake placement test
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PlacementTestPage;
