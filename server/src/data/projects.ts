export interface ProjectSeed {
  slug: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Research';
  hours: number;
  summary: string;
  description: string;
  outcomes: string[];
  /** Skill slug -> minimum level to start comfortably. */
  skills: Record<string, number>;
  courses: string[];
  careers: string[];
  research: string[];
}

export const PROJECTS: ProjectSeed[] = [
  // Beginner
  {
    slug: 'student-score-prediction', title: 'Student Score Prediction', level: 'Beginner', hours: 15,
    summary: 'Predict exam scores from study habits with linear regression.',
    description: 'Collect or download a student-performance dataset, explore which habits correlate with grades, and fit a first regression model. A gentle first ML project that teaches the full workflow.',
    outcomes: ['Clean a small tabular dataset', 'Visualise correlations', 'Fit and evaluate a regression model', 'Explain results in plain language'],
    skills: { python: 40, data_analysis: 30, probstat: 30 },
    courses: ['CS101', 'DS101'], careers: ['ai-engineer', 'ml-engineer', 'data-scientist'], research: ['data-science'],
  },
  {
    slug: 'campus-data-explorer', title: 'Campus Data Explorer', level: 'Beginner', hours: 12,
    summary: 'Analyse and visualise a public university dataset.',
    description: 'Pick an open dataset (course enrolments, library usage, transport) and produce an exploratory notebook with clear charts and three data-backed insights.',
    outcomes: ['Load and reshape data with pandas', 'Choose appropriate chart types', 'Write a short insight report'],
    skills: { python: 35, data_analysis: 25 },
    courses: ['CS101', 'DS101'], careers: ['data-scientist', 'ai-engineer'], research: ['data-science'],
  },
  {
    slug: 'weather-station', title: 'Microcontroller Weather Station', level: 'Beginner', hours: 20,
    summary: 'Read temperature and humidity sensors and log the data.',
    description: 'Wire a temperature/humidity sensor to a microcontroller, read it over I2C, show values on a display and log them to a computer over serial.',
    outcomes: ['Wire and read a digital sensor', 'Write simple firmware loops', 'Log and plot sensor data'],
    skills: { cpp: 35, circuits: 30 },
    courses: ['CS102', 'EE101'], careers: ['embedded-engineer', 'iot-engineer'], research: ['iot'],
  },
  {
    slug: 'cli-task-manager', title: 'Command-Line Task Manager', level: 'Beginner', hours: 15,
    summary: 'A tested CLI app that stores tasks in SQLite.',
    description: 'Build a small but well-structured command-line app with persistence, tests and a README — your first portfolio-quality repository.',
    outcomes: ['Structure a Python project', 'Persist data with SQL', 'Write unit tests'],
    skills: { python: 40, sql: 25 },
    courses: ['CS101', 'CS220'], careers: ['software-engineer'], research: [],
  },

  // Intermediate
  {
    slug: 'house-price-prediction', title: 'House Price Prediction', level: 'Intermediate', hours: 25,
    summary: 'Feature engineering and model comparison on real-estate data.',
    description: 'Predict house prices with feature engineering, regularised regression and gradient boosting. Compare models with cross-validation and explain which features matter.',
    outcomes: ['Engineer features from raw data', 'Compare models with cross-validation', 'Interpret feature importance', 'Avoid data leakage'],
    skills: { python: 55, ml: 50, probstat: 50, data_analysis: 55 },
    courses: ['ML201', 'DS101'], careers: ['ai-engineer', 'ml-engineer', 'data-scientist'], research: ['machine-learning', 'data-science'],
  },
  {
    slug: 'movie-recommender', title: 'Movie Recommender System', level: 'Intermediate', hours: 30,
    summary: 'Collaborative filtering with matrix factorisation.',
    description: 'Build a recommender using collaborative filtering and matrix factorisation, evaluate it with ranking metrics and serve recommendations from a simple API.',
    outcomes: ['Apply matrix factorisation', 'Evaluate with ranking metrics', 'Serve predictions from an API'],
    skills: { python: 60, ml: 55, linalg: 60 },
    courses: ['ML201', 'MA110'], careers: ['ml-engineer', 'data-scientist', 'ai-engineer'], research: ['machine-learning'],
  },
  {
    slug: 'review-sentiment', title: 'Review Sentiment Analysis', level: 'Intermediate', hours: 25,
    summary: 'Classify product reviews from TF-IDF to embeddings.',
    description: 'Build sentiment classifiers for product reviews, starting with TF-IDF baselines and moving to word embeddings, with careful error analysis.',
    outcomes: ['Preprocess text data', 'Train baseline and neural classifiers', 'Perform error analysis'],
    skills: { python: 55, ml: 55, nlp: 40 },
    courses: ['ML201', 'NL201'], careers: ['nlp-engineer', 'ai-engineer'], research: ['nlp'],
  },
  {
    slug: 'smart-home-dashboard', title: 'Smart Home IoT Dashboard', level: 'Intermediate', hours: 35,
    summary: 'MQTT sensors streaming to a live web dashboard.',
    description: 'Connect several sensor nodes over MQTT to a broker, store readings and show them on a live dashboard with alerts.',
    outcomes: ['Publish and subscribe with MQTT', 'Store time-series data', 'Build a live dashboard'],
    skills: { embedded: 50, networking: 55, python: 45 },
    courses: ['EM201', 'IO201'], careers: ['iot-engineer', 'embedded-engineer'], research: ['iot'],
  },
  {
    slug: 'course-planner-app', title: 'Full-Stack Course Planner', level: 'Intermediate', hours: 40,
    summary: 'A web app with auth, a REST API and a database.',
    description: 'Build and deploy a course-planning web app with authentication, a REST API, a relational database and a tested front-end.',
    outcomes: ['Design a REST API', 'Implement authentication', 'Deploy a full-stack app'],
    skills: { webdev: 55, sql: 55, swe: 55 },
    courses: ['CS230', 'CS220'], careers: ['software-engineer'], research: [],
  },
  {
    slug: 'fpga-alu', title: '8-bit ALU on FPGA', level: 'Intermediate', hours: 30,
    summary: 'Design, verify and run a small ALU in Verilog.',
    description: 'Write an 8-bit ALU in Verilog, verify it with a self-checking testbench and run it on an FPGA board with switches and LEDs.',
    outcomes: ['Write synthesisable Verilog', 'Build self-checking testbenches', 'Deploy to FPGA'],
    skills: { digital: 60, vlsi: 40 },
    courses: ['EE110', 'SC310'], careers: ['semiconductor-engineer', 'embedded-engineer'], research: ['semiconductor'],
  },

  // Advanced
  {
    slug: 'image-classification', title: 'Image Classification with CNNs', level: 'Advanced', hours: 40,
    summary: 'Train and fine-tune CNNs on a real image dataset.',
    description: 'Train a CNN from scratch, then fine-tune a pretrained model on a custom dataset. Use augmentation, track experiments and deploy a small demo.',
    outcomes: ['Train CNNs in PyTorch', 'Apply transfer learning', 'Track experiments', 'Ship a demo app'],
    skills: { python: 65, dl: 60, cv: 40 },
    courses: ['DL201', 'CV210'], careers: ['ai-engineer', 'cv-engineer', 'ml-engineer'], research: ['computer-vision', 'artificial-intelligence'],
  },
  {
    slug: 'edge-object-detection', title: 'Real-Time Object Detection on Edge', level: 'Advanced', hours: 50,
    summary: 'Optimise a detector to run on a Jetson or Raspberry Pi.',
    description: 'Train an object detector, quantise and optimise it, and run it in real time on an edge device with measured latency and accuracy.',
    outcomes: ['Train a detection model', 'Quantise and optimise inference', 'Benchmark latency vs accuracy'],
    skills: { dl: 75, cv: 70, mlops: 45 },
    courses: ['CV310', 'ML310'], careers: ['cv-engineer', 'ai-engineer', 'embedded-engineer'], research: ['computer-vision', 'robotics'],
  },
  {
    slug: 'rag-assistant', title: 'Retrieval-Augmented Study Assistant', level: 'Advanced', hours: 45,
    summary: 'An LLM assistant that answers questions over your notes.',
    description: 'Build a retrieval-augmented assistant over lecture notes with embeddings, a vector index and an evaluation set that measures answer quality.',
    outcomes: ['Build an embedding index', 'Implement retrieval-augmented generation', 'Evaluate answers systematically'],
    skills: { nlp: 70, dl: 70, python: 70 },
    courses: ['NL301'], careers: ['nlp-engineer', 'ai-engineer'], research: ['nlp', 'artificial-intelligence'],
  },
  {
    slug: 'ml-serving-pipeline', title: 'ML Model Serving Pipeline', level: 'Advanced', hours: 40,
    summary: 'CI/CD, containerised serving and drift monitoring.',
    description: 'Take a trained model to production: containerise it, add CI/CD, serve it behind an API with load tests and monitor for drift.',
    outcomes: ['Containerise and serve a model', 'Automate with CI/CD', 'Monitor drift and latency'],
    skills: { mlops: 65, swe: 65, ml: 60 },
    courses: ['ML310'], careers: ['ml-engineer', 'ai-engineer'], research: [],
  },
  {
    slug: 'rtos-flight-controller', title: 'RTOS Drone Flight Controller', level: 'Advanced', hours: 60,
    summary: 'Multi-task firmware with sensor fusion and PID control.',
    description: 'Write RTOS firmware for a small drone or balancing robot: IMU sensor fusion, PID control loops and telemetry under hard timing constraints.',
    outcomes: ['Design multi-task RTOS firmware', 'Implement sensor fusion', 'Tune PID loops'],
    skills: { embedded: 75, signals: 50, cpp: 70 },
    courses: ['EM301', 'EE210'], careers: ['embedded-engineer', 'iot-engineer'], research: ['robotics', 'iot'],
  },

  // Research
  {
    slug: 'pinn-heat-equation', title: 'Physics-Informed Neural Network', level: 'Research', hours: 60,
    summary: 'Solve the heat equation with a PINN and compare to a solver.',
    description: 'Train a physics-informed neural network that solves a PDE such as the heat or Burgers equation, compare it with a classical numerical solver and write up the findings.',
    outcomes: ['Embed PDE residuals in a loss', 'Compare PINNs with numerical solvers', 'Write a short research report'],
    skills: { dl: 60, comp_physics: 55, calculus: 70 },
    courses: ['DL201', 'PH210', 'RM310'], careers: ['ai-engineer', 'ml-engineer'], research: ['computational-physics', 'machine-learning'],
  },
  {
    slug: 'reproduce-vision-paper', title: 'Reproduce a Vision Paper', level: 'Research', hours: 70,
    summary: 'Re-implement a recent vision paper and run ablations.',
    description: 'Pick a recent computer-vision paper, re-implement its core method, reproduce a key table and run your own ablation study.',
    outcomes: ['Re-implement a published method', 'Reproduce reported results', 'Design ablations'],
    skills: { cv: 70, dl: 75, research: 55 },
    courses: ['CV310', 'RM301'], careers: ['cv-engineer', 'ai-engineer'], research: ['computer-vision', 'artificial-intelligence'],
  },
  {
    slug: 'mosfet-simulation', title: 'MOSFET Device Simulation Study', level: 'Research', hours: 50,
    summary: 'Simulate how channel length affects transistor behaviour.',
    description: 'Use device-simulation tools to study short-channel effects in MOSFETs, compare with analytical models and present the results as a poster.',
    outcomes: ['Run device simulations', 'Compare simulation with theory', 'Present a research poster'],
    skills: { semiconductor: 65, comp_physics: 40, research: 45 },
    courses: ['SC201', 'RM201'], careers: ['semiconductor-engineer'], research: ['semiconductor', 'computational-physics'],
  },
  {
    slug: 'variational-quantum-classifier', title: 'Variational Quantum Classifier', level: 'Research', hours: 55,
    summary: 'Train a hybrid quantum–classical model in Qiskit.',
    description: 'Build a variational quantum classifier, train it on a toy dataset with a simulator and analyse how noise affects accuracy.',
    outcomes: ['Build parameterised quantum circuits', 'Train hybrid models', 'Analyse the impact of noise'],
    skills: { quantum: 65, ml: 50, linalg: 70 },
    courses: ['QT301', 'ML201'], careers: [], research: ['quantum-technology', 'machine-learning'],
  },
];
