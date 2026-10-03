export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface CourseSeed {
  code: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  credits: number;
  hours: number;
  kind?: 'course' | 'project';
  summary: string;
  description: string;
  outcomes: string[];
  /** Course codes that must be completed first. */
  prereqs: string[];
  /** Skill slug -> level (0-100) a learner reaches after finishing the course. */
  skills: Record<string, number>;
}

export const COURSE_CATEGORIES = [
  'Programming',
  'Mathematics',
  'Data Science',
  'Machine Learning',
  'Deep Learning',
  'Computer Vision',
  'NLP',
  'Embedded Systems',
  'IoT',
  'Semiconductor',
  'Physics',
  'Robotics',
  'Research Methods',
  'Projects',
] as const;

export const COURSES: CourseSeed[] = [
  // ───────────── Programming ─────────────
  {
    code: 'CS101', title: 'Python Fundamentals', category: 'Programming', difficulty: 'Beginner', credits: 3, hours: 45,
    summary: 'Variables, control flow, functions and files in Python.',
    description: 'A first programming course using Python. You learn to break problems into steps, write functions, work with lists and dictionaries, read files and debug your own code. Every later AI, data and scientific course in the catalogue builds on this.',
    outcomes: ['Write and debug multi-file Python programs', 'Use core data types: lists, dicts, sets, tuples', 'Read and write files and parse simple data', 'Apply functions and modules to structure code'],
    prereqs: [], skills: { python: 50 },
  },
  {
    code: 'CS102', title: 'Programming in C', category: 'Programming', difficulty: 'Beginner', credits: 3, hours: 50,
    summary: 'Pointers, memory and the machine model behind C.',
    description: 'Learn how programs actually run: memory layout, pointers, arrays, structs and manual memory management. The foundation for embedded firmware, operating systems and high-performance code.',
    outcomes: ['Reason about stack vs heap memory', 'Use pointers, arrays and structs safely', 'Compile, link and debug C programs', 'Write small command-line tools in C'],
    prereqs: [], skills: { cpp: 50 },
  },
  {
    code: 'CS201', title: 'Data Structures & Algorithms', category: 'Programming', difficulty: 'Intermediate', credits: 4, hours: 60,
    summary: 'Lists, trees, graphs, hashing and complexity analysis.',
    description: 'Classic data structures and algorithms implemented in Python: stacks, queues, trees, heaps, hash tables, graphs, sorting and searching, plus Big-O analysis. Essential for technical interviews and for writing efficient ML and data code.',
    outcomes: ['Analyse time and space complexity', 'Implement trees, heaps, hash maps and graphs', 'Choose the right structure for a problem', 'Solve interview-style algorithmic problems'],
    prereqs: ['CS101'], skills: { dsa: 70, python: 60 },
  },
  {
    code: 'CS202', title: 'Object-Oriented Programming in C++', category: 'Programming', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'Classes, RAII, templates and the STL.',
    description: 'Modern C++ for building larger systems: classes, inheritance, RAII, smart pointers, templates and the standard library. Used heavily in embedded, robotics, game engines and performance-critical vision code.',
    outcomes: ['Design class hierarchies in modern C++', 'Manage resources with RAII and smart pointers', 'Use STL containers and algorithms', 'Write generic code with templates'],
    prereqs: ['CS102'], skills: { cpp: 75, swe: 40 },
  },
  {
    code: 'CS210', title: 'Software Engineering Practices', category: 'Programming', difficulty: 'Intermediate', credits: 3, hours: 40,
    summary: 'Git, testing, code review and clean code.',
    description: 'How professional teams build software: Git workflows, unit and integration testing, code review, packaging, CI and refactoring. Turns "code that works" into code that others can maintain.',
    outcomes: ['Collaborate with Git branches and pull requests', 'Write unit and integration tests', 'Set up continuous integration', 'Refactor code using common design principles'],
    prereqs: ['CS101'], skills: { swe: 65, python: 65 },
  },
  {
    code: 'CS220', title: 'Databases & SQL', category: 'Programming', difficulty: 'Intermediate', credits: 3, hours: 40,
    summary: 'Relational modelling, SQL and transactions.',
    description: 'Design relational schemas, write SQL from simple selects to window functions, and understand indexes and transactions. Every data and backend role uses this daily.',
    outcomes: ['Model data with normalised schemas', 'Write joins, aggregations and window functions', 'Understand indexes and query plans', 'Use transactions correctly'],
    prereqs: ['CS101'], skills: { sql: 70 },
  },
  {
    code: 'CS230', title: 'Web & API Development', category: 'Programming', difficulty: 'Intermediate', credits: 3, hours: 50,
    summary: 'REST APIs, authentication and modern front-ends.',
    description: 'Build a full web application: HTTP and REST, authentication, a backend service with a database, and a component-based front-end. Ship something real that others can use.',
    outcomes: ['Design and document REST APIs', 'Implement authentication and authorisation', 'Build a component-based front-end', 'Deploy a full-stack application'],
    prereqs: ['CS210', 'CS220'], skills: { webdev: 70, swe: 70 },
  },
  {
    code: 'CS301', title: 'Advanced Python for Data & AI', category: 'Programming', difficulty: 'Intermediate', credits: 3, hours: 40,
    summary: 'NumPy, vectorisation, profiling and packaging.',
    description: 'Write fast, clean, production-quality Python for data and AI work: NumPy vectorisation, typing, generators, profiling, packaging and working with large datasets.',
    outcomes: ['Vectorise numerical code with NumPy', 'Profile and optimise Python programs', 'Package and type-check libraries', 'Process data that does not fit in memory'],
    prereqs: ['CS201'], skills: { python: 85 },
  },
  {
    code: 'CS310', title: 'Algorithm Design & Analysis', category: 'Programming', difficulty: 'Advanced', credits: 4, hours: 55,
    summary: 'Dynamic programming, greedy, graph and NP-hardness.',
    description: 'Design techniques — divide and conquer, dynamic programming, greedy, network flow — and the theory of what cannot be solved efficiently. Sharpens problem solving for senior engineering interviews.',
    outcomes: ['Apply dynamic programming and greedy strategies', 'Solve graph and flow problems', 'Prove correctness and complexity bounds', 'Recognise NP-hard problems'],
    prereqs: ['CS201', 'MA120'], skills: { dsa: 90, discrete: 75 },
  },
  {
    code: 'CS320', title: 'Operating Systems', category: 'Programming', difficulty: 'Advanced', credits: 3, hours: 50,
    summary: 'Processes, scheduling, memory and concurrency.',
    description: 'How an operating system manages processes, threads, memory and files, and how to write correct concurrent programs. Core knowledge for systems, backend and embedded engineers.',
    outcomes: ['Explain scheduling and virtual memory', 'Write concurrent programs with locks and channels', 'Debug race conditions and deadlocks', 'Use system calls effectively'],
    prereqs: ['CS102', 'CS201'], skills: { systems: 70, cpp: 60 },
  },
  {
    code: 'CS330', title: 'Distributed Systems & Cloud', category: 'Programming', difficulty: 'Advanced', credits: 3, hours: 50,
    summary: 'Scalability, replication and cloud-native services.',
    description: 'Design services that scale beyond one machine: replication, consistency, message queues, containers and cloud platforms. Learn the trade-offs behind every large system.',
    outcomes: ['Reason about consistency and availability trade-offs', 'Deploy containerised services to the cloud', 'Design with queues, caches and load balancers', 'Monitor and debug distributed services'],
    prereqs: ['CS320', 'CS230'], skills: { cloud: 80, systems: 80, swe: 75 },
  },
  {
    code: 'CS340', title: 'Software Architecture & Design', category: 'Programming', difficulty: 'Advanced', credits: 3, hours: 40,
    summary: 'Design patterns, modularity and system design.',
    description: 'Structure large codebases and systems: design patterns, domain modelling, modular architecture, API design and system design interviews.',
    outcomes: ['Apply common design patterns appropriately', 'Decompose systems into clear modules', 'Write design docs with trade-off analysis', 'Pass system-design interviews'],
    prereqs: ['CS210', 'CS201'], skills: { swe: 85 },
  },

  // ───────────── Mathematics ─────────────
  {
    code: 'MA101', title: 'Calculus I & II', category: 'Mathematics', difficulty: 'Beginner', credits: 4, hours: 60,
    summary: 'Limits, derivatives, integrals and series.',
    description: 'Single-variable calculus: limits, derivatives, integrals, series and their applications. The language of change used across physics, engineering and machine learning.',
    outcomes: ['Differentiate and integrate common functions', 'Apply calculus to optimisation problems', 'Work with sequences and series', 'Model rates of change'],
    prereqs: [], skills: { calculus: 60 },
  },
  {
    code: 'MA102', title: 'Multivariable Calculus & ODEs', category: 'Mathematics', difficulty: 'Intermediate', credits: 4, hours: 55,
    summary: 'Gradients, multiple integrals and differential equations.',
    description: 'Partial derivatives, gradients, multiple integrals, vector calculus and ordinary differential equations — the toolkit behind physical models, control and gradient-based learning.',
    outcomes: ['Compute gradients, Jacobians and Hessians', 'Evaluate multiple and line integrals', 'Solve linear ODEs', 'Model dynamic systems'],
    prereqs: ['MA101'], skills: { calculus: 80 },
  },
  {
    code: 'MA110', title: 'Linear Algebra', category: 'Mathematics', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'Vectors, matrices, eigenvalues and SVD.',
    description: 'Vector spaces, matrices, linear maps, eigenvalues and the singular value decomposition. Every ML model, graphics pipeline and quantum system is written in this language.',
    outcomes: ['Manipulate vectors and matrices fluently', 'Compute eigen-decompositions and SVD', 'Interpret linear transformations geometrically', 'Solve linear systems'],
    prereqs: ['MA101'], skills: { linalg: 70 },
  },
  {
    code: 'MA120', title: 'Discrete Mathematics', category: 'Mathematics', difficulty: 'Beginner', credits: 3, hours: 40,
    summary: 'Logic, proofs, combinatorics and graphs.',
    description: 'Logic, proof techniques, sets, combinatorics, recurrences and graph theory — the mathematical foundation of computer science.',
    outcomes: ['Write rigorous proofs', 'Solve counting and combinatorics problems', 'Reason about graphs and trees', 'Solve recurrence relations'],
    prereqs: [], skills: { discrete: 65 },
  },
  {
    code: 'MA201', title: 'Probability & Statistics', category: 'Mathematics', difficulty: 'Intermediate', credits: 3, hours: 50,
    summary: 'Random variables, distributions and estimation.',
    description: 'Probability spaces, random variables, common distributions, expectation, the central limit theorem and statistical estimation. Machine learning is applied probability.',
    outcomes: ['Model uncertainty with distributions', 'Compute expectations and variances', 'Estimate parameters and confidence intervals', 'Run basic hypothesis tests'],
    prereqs: ['MA101'], skills: { probstat: 70 },
  },
  {
    code: 'MA220', title: 'Optimization for Machine Learning', category: 'Mathematics', difficulty: 'Advanced', credits: 3, hours: 40,
    summary: 'Convexity, gradient descent and constrained problems.',
    description: 'Convex sets and functions, gradient descent and its variants, Lagrangian duality and stochastic optimisation — the engine that trains every model.',
    outcomes: ['Identify convex problems', 'Implement gradient-based optimisers', 'Use Lagrange multipliers and duality', 'Tune optimisers for training models'],
    prereqs: ['MA110', 'MA102'], skills: { optimization: 70, calculus: 80 },
  },
  {
    code: 'MA230', title: 'Numerical Methods', category: 'Mathematics', difficulty: 'Intermediate', credits: 3, hours: 40,
    summary: 'Numerical linear algebra, ODE solvers and error analysis.',
    description: 'Solve mathematical problems on a computer: floating point, numerical linear algebra, interpolation, numerical integration and ODE solvers.',
    outcomes: ['Implement stable numerical algorithms', 'Solve large linear systems numerically', 'Integrate ODEs with Runge–Kutta methods', 'Analyse numerical error'],
    prereqs: ['MA110', 'CS101'], skills: { linalg: 75, comp_physics: 45 },
  },
  {
    code: 'MA301', title: 'Statistical Inference & Bayesian Methods', category: 'Mathematics', difficulty: 'Advanced', credits: 3, hours: 45,
    summary: 'Likelihood, Bayesian inference and causal thinking.',
    description: 'Maximum likelihood, Bayesian inference, MCMC, regression theory and an introduction to causal inference — the statistics that separates great data scientists from good ones.',
    outcomes: ['Fit models with maximum likelihood', 'Perform Bayesian inference with MCMC', 'Diagnose regression assumptions', 'Reason about causal effects'],
    prereqs: ['MA201'], skills: { probstat: 90 },
  },
  {
    code: 'MA310', title: 'Advanced Linear Algebra & Matrix Methods', category: 'Mathematics', difficulty: 'Advanced', credits: 3, hours: 40,
    summary: 'Spectral theory, tensors and matrix analysis.',
    description: 'Inner product spaces, spectral theorem, matrix decompositions, tensor products and matrix calculus. Required depth for ML theory and quantum information.',
    outcomes: ['Apply the spectral theorem', 'Work with tensor products', 'Use matrix calculus', 'Analyse low-rank approximations'],
    prereqs: ['MA110'], skills: { linalg: 90 },
  },

  // ───────────── Data Science ─────────────
  {
    code: 'DS101', title: 'Data Analysis with Python', category: 'Data Science', difficulty: 'Beginner', credits: 3, hours: 40,
    summary: 'pandas, visualisation and exploratory analysis.',
    description: 'Load, clean, explore and visualise real datasets with pandas and plotting libraries. Learn to ask good questions of data and communicate the answers.',
    outcomes: ['Clean and reshape data with pandas', 'Create clear visualisations', 'Run exploratory data analysis', 'Communicate findings in a notebook'],
    prereqs: ['CS101'], skills: { data_analysis: 65, python: 55 },
  },
  {
    code: 'DS201', title: 'Applied Statistics & Experimentation', category: 'Data Science', difficulty: 'Intermediate', credits: 3, hours: 40,
    summary: 'A/B testing, regression and metrics.',
    description: 'Design experiments and A/B tests, choose metrics, fit regression models and avoid common statistical traps in real product and research data.',
    outcomes: ['Design and analyse A/B tests', 'Fit and interpret regression models', 'Define meaningful metrics', 'Avoid p-hacking and leakage'],
    prereqs: ['DS101', 'MA201'], skills: { probstat: 80, data_analysis: 85 },
  },

  // ───────────── Machine Learning ─────────────
  {
    code: 'ML201', title: 'Machine Learning Foundations', category: 'Machine Learning', difficulty: 'Intermediate', credits: 4, hours: 60,
    summary: 'Regression, classification, trees and model evaluation.',
    description: 'The core of machine learning: linear and logistic regression, decision trees, ensembles, clustering, regularisation, cross-validation and the bias–variance trade-off, implemented from scratch and with scikit-learn.',
    outcomes: ['Train and evaluate supervised models', 'Diagnose over- and under-fitting', 'Engineer features and pipelines', 'Apply clustering and dimensionality reduction'],
    prereqs: ['CS201', 'MA110', 'MA201'], skills: { ml: 75, data_analysis: 60 },
  },
  {
    code: 'ML301', title: 'Advanced Machine Learning', category: 'Machine Learning', difficulty: 'Advanced', credits: 3, hours: 50,
    summary: 'Kernels, probabilistic models and boosting.',
    description: 'Kernel methods, Gaussian processes, probabilistic graphical models, gradient boosting and learning theory. The depth expected of ML engineers and researchers.',
    outcomes: ['Apply kernel methods and Gaussian processes', 'Build probabilistic models', 'Tune gradient-boosted ensembles', 'Reason about generalisation bounds'],
    prereqs: ['ML201', 'MA220'], skills: { ml: 90, optimization: 75 },
  },
  {
    code: 'ML310', title: 'MLOps & Model Deployment', category: 'Machine Learning', difficulty: 'Advanced', credits: 3, hours: 45,
    summary: 'Serving, monitoring and reproducible ML pipelines.',
    description: 'Take models from notebook to production: experiment tracking, reproducible pipelines, model serving, containerisation, monitoring and data drift.',
    outcomes: ['Package and serve models behind an API', 'Track experiments reproducibly', 'Build CI/CD for ML', 'Monitor drift in production'],
    prereqs: ['ML201', 'CS210'], skills: { mlops: 75, swe: 75, cloud: 45 },
  },
  {
    code: 'ML320', title: 'Reinforcement Learning', category: 'Machine Learning', difficulty: 'Advanced', credits: 3, hours: 50,
    summary: 'MDPs, Q-learning and policy gradients.',
    description: 'Markov decision processes, dynamic programming, Q-learning, policy gradients and deep RL — how agents learn from interaction.',
    outcomes: ['Formulate problems as MDPs', 'Implement Q-learning and policy gradients', 'Train deep RL agents', 'Evaluate agents fairly'],
    prereqs: ['DL201'], skills: { rl: 70 },
  },

  // ───────────── Deep Learning ─────────────
  {
    code: 'DL201', title: 'Deep Learning', category: 'Deep Learning', difficulty: 'Advanced', credits: 4, hours: 60,
    summary: 'Neural networks, backprop, CNNs and RNNs in PyTorch.',
    description: 'Neural networks from first principles: backpropagation, optimisation, regularisation, CNNs, RNNs and an introduction to attention, implemented in PyTorch.',
    outcomes: ['Implement and train neural networks in PyTorch', 'Debug training with loss curves', 'Build CNNs and RNNs', 'Use transfer learning'],
    prereqs: ['ML201'], skills: { dl: 70 },
  },
  {
    code: 'DL301', title: 'Transformers & Generative Models', category: 'Deep Learning', difficulty: 'Expert', credits: 3, hours: 55,
    summary: 'Attention, diffusion and large-scale training.',
    description: 'State-of-the-art deep learning: Transformers, self-supervised learning, VAEs, GANs and diffusion models, plus the engineering of large-scale training.',
    outcomes: ['Implement a Transformer from scratch', 'Train generative models', 'Apply self-supervised pre-training', 'Scale training across GPUs'],
    prereqs: ['DL201', 'MA220'], skills: { dl: 90 },
  },

  // ───────────── Computer Vision ─────────────
  {
    code: 'CV201', title: 'Digital Image Processing', category: 'Computer Vision', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'Filtering, transforms, features and segmentation.',
    description: 'Classical image processing: colour spaces, filtering, Fourier methods, edges, morphology, feature detectors and segmentation using OpenCV.',
    outcomes: ['Filter and enhance images', 'Apply Fourier-domain processing', 'Detect edges, corners and features', 'Segment images with classical methods'],
    prereqs: ['CS101', 'MA110'], skills: { image_proc: 70, cv: 25 },
  },
  {
    code: 'CV210', title: 'CNNs for Visual Recognition', category: 'Computer Vision', difficulty: 'Advanced', credits: 3, hours: 45,
    summary: 'Convolutional networks for classification and detection.',
    description: 'Convolutional neural networks in depth: architectures from LeNet to ResNet and ViT, data augmentation, transfer learning and object detection basics.',
    outcomes: ['Design and train CNN architectures', 'Use augmentation and transfer learning', 'Fine-tune pretrained vision models', 'Evaluate classifiers and detectors'],
    prereqs: ['DL201'], skills: { cv: 55, dl: 75 },
  },
  {
    code: 'CV310', title: 'Computer Vision', category: 'Computer Vision', difficulty: 'Expert', credits: 4, hours: 60,
    summary: 'Detection, segmentation, tracking and 3D vision.',
    description: 'Modern computer vision systems: object detection, semantic and instance segmentation, tracking, multi-view geometry and 3D reconstruction.',
    outcomes: ['Build detection and segmentation pipelines', 'Track objects in video', 'Apply multi-view geometry', 'Deploy vision models efficiently'],
    prereqs: ['CV210', 'CV201'], skills: { cv: 85, image_proc: 75 },
  },

  // ───────────── NLP ─────────────
  {
    code: 'NL201', title: 'Foundations of NLP', category: 'NLP', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'Tokenisation, embeddings and text classification.',
    description: 'Text processing, n-gram and neural language models, word embeddings, sequence labelling and text classification.',
    outcomes: ['Preprocess and tokenise text', 'Train word embeddings', 'Build text classifiers', 'Evaluate NLP systems'],
    prereqs: ['ML201'], skills: { nlp: 50 },
  },
  {
    code: 'NL301', title: 'NLP with Transformers & LLMs', category: 'NLP', difficulty: 'Expert', credits: 4, hours: 60,
    summary: 'Pre-trained language models, fine-tuning and RAG.',
    description: 'Transformers for language: BERT and GPT families, fine-tuning, prompting, retrieval-augmented generation and evaluation of large language models.',
    outcomes: ['Fine-tune pre-trained language models', 'Build retrieval-augmented generation systems', 'Evaluate LLM outputs', 'Optimise inference cost'],
    prereqs: ['NL201', 'DL201'], skills: { nlp: 85, dl: 80 },
  },

  // ───────────── Embedded Systems & electronics ─────────────
  {
    code: 'EE101', title: 'Electronic Circuits', category: 'Embedded Systems', difficulty: 'Beginner', credits: 3, hours: 50,
    summary: 'Circuit laws, RLC circuits and transistors.',
    description: 'Ohm and Kirchhoff laws, RC/RL/RLC circuits, diodes, transistors and operational amplifiers, with lab work on real breadboards.',
    outcomes: ['Analyse DC and AC circuits', 'Use diodes, transistors and op-amps', 'Read schematics and datasheets', 'Measure circuits with lab instruments'],
    prereqs: [], skills: { circuits: 60 },
  },
  {
    code: 'EE102', title: 'Analog & Mixed-Signal Electronics', category: 'Embedded Systems', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'Amplifiers, ADCs/DACs and noise.',
    description: 'Amplifier design, feedback, frequency response, data converters and noise — the analog side of every sensor, radio and chip.',
    outcomes: ['Design amplifier stages', 'Analyse frequency response and stability', 'Select ADCs and DACs', 'Reduce noise in measurements'],
    prereqs: ['EE101'], skills: { circuits: 80 },
  },
  {
    code: 'EE110', title: 'Digital Logic Design', category: 'Embedded Systems', difficulty: 'Beginner', credits: 3, hours: 45,
    summary: 'Boolean logic, sequential circuits and FSMs.',
    description: 'Boolean algebra, combinational and sequential logic, finite state machines and timing — the building blocks of every processor.',
    outcomes: ['Design combinational circuits', 'Build sequential circuits and FSMs', 'Reason about timing', 'Prototype logic on simulators'],
    prereqs: [], skills: { digital: 60 },
  },
  {
    code: 'EE201', title: 'Computer Architecture', category: 'Embedded Systems', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'Instruction sets, pipelines and memory hierarchy.',
    description: 'How processors work: instruction set architectures, datapaths, pipelining, caches, memory hierarchy and I/O.',
    outcomes: ['Explain how instructions execute', 'Analyse pipeline hazards', 'Reason about cache performance', 'Write simple assembly programs'],
    prereqs: ['EE110', 'CS102'], skills: { digital: 80, systems: 40 },
  },
  {
    code: 'EE210', title: 'Signals & Systems', category: 'Embedded Systems', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'Convolution, Fourier and Laplace transforms.',
    description: 'Continuous and discrete signals, LTI systems, convolution, Fourier, Laplace and Z transforms, and sampling.',
    outcomes: ['Analyse LTI systems', 'Apply Fourier and Z transforms', 'Understand sampling and aliasing', 'Design simple filters'],
    prereqs: ['MA101', 'MA110'], skills: { signals: 65 },
  },
  {
    code: 'EE310', title: 'Digital Signal Processing', category: 'Embedded Systems', difficulty: 'Advanced', credits: 3, hours: 45,
    summary: 'FIR/IIR filters, FFT and real-time DSP.',
    description: 'Design and implement digital filters, spectral analysis with the FFT, multirate processing and real-time DSP on embedded targets.',
    outcomes: ['Design FIR and IIR filters', 'Perform spectral analysis with FFT', 'Implement real-time DSP', 'Process audio and sensor signals'],
    prereqs: ['EE210'], skills: { signals: 85, image_proc: 35 },
  },
  {
    code: 'EM201', title: 'Microcontrollers & Embedded C', category: 'Embedded Systems', difficulty: 'Intermediate', credits: 4, hours: 60,
    summary: 'GPIO, timers, interrupts and serial buses.',
    description: 'Program ARM microcontrollers in C: GPIO, timers, interrupts, ADC, UART/SPI/I2C, low-power modes and debugging on real hardware.',
    outcomes: ['Program microcontroller peripherals', 'Write interrupt-driven firmware', 'Interface sensors over I2C/SPI/UART', 'Debug firmware with a hardware debugger'],
    prereqs: ['CS102', 'EE110', 'EE101'], skills: { embedded: 65, cpp: 60 },
  },
  {
    code: 'EM301', title: 'Real-Time & Embedded Linux Systems', category: 'Embedded Systems', difficulty: 'Advanced', credits: 3, hours: 50,
    summary: 'RTOS, drivers and embedded Linux.',
    description: 'Real-time operating systems, scheduling guarantees, device drivers, bootloaders and embedded Linux for complex devices.',
    outcomes: ['Build multi-task firmware on an RTOS', 'Write a simple device driver', 'Configure embedded Linux', 'Meet real-time deadlines'],
    prereqs: ['EM201', 'CS202'], skills: { embedded: 85, cpp: 85, systems: 60 },
  },

  // ───────────── IoT ─────────────
  {
    code: 'IO201', title: 'Computer Networks & IoT Protocols', category: 'IoT', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'TCP/IP, wireless, MQTT and BLE.',
    description: 'Networking from the physical layer to applications, with a focus on IoT: Wi-Fi, BLE, LoRa, MQTT, CoAP and network security basics.',
    outcomes: ['Explain the TCP/IP stack', 'Connect devices with MQTT and BLE', 'Choose wireless technologies for IoT', 'Secure device communication'],
    prereqs: ['CS101'], skills: { networking: 70 },
  },
  {
    code: 'IO301', title: 'IoT Systems Design', category: 'IoT', difficulty: 'Advanced', credits: 3, hours: 50,
    summary: 'Sensors to cloud: edge computing and fleets.',
    description: 'Design end-to-end IoT systems: sensor nodes, gateways, edge computing, cloud ingestion, dashboards and fleet management.',
    outcomes: ['Architect sensor-to-cloud systems', 'Process data at the edge', 'Manage device fleets and OTA updates', 'Build real-time dashboards'],
    prereqs: ['IO201', 'EM201'], skills: { networking: 85, embedded: 75, cloud: 60 },
  },

  // ───────────── Semiconductor ─────────────
  {
    code: 'SC201', title: 'Semiconductor Device Physics', category: 'Semiconductor', difficulty: 'Advanced', credits: 3, hours: 50,
    summary: 'Band theory, p–n junctions and MOSFETs.',
    description: 'Energy bands, carrier transport, p–n junctions, BJTs and MOSFETs — how the transistor really works.',
    outcomes: ['Explain band diagrams', 'Model carrier transport', 'Analyse p–n junctions and MOSFETs', 'Read device datasheets critically'],
    prereqs: ['PH201', 'EE101'], skills: { semiconductor: 70 },
  },
  {
    code: 'SC301', title: 'VLSI Design & Fabrication', category: 'Semiconductor', difficulty: 'Expert', credits: 4, hours: 60,
    summary: 'CMOS design, layout and process technology.',
    description: 'CMOS logic, layout, design rules, timing, power and the fabrication process from wafer to packaged chip.',
    outcomes: ['Design CMOS gates and layouts', 'Analyse timing and power', 'Explain the fabrication flow', 'Run DRC/LVS checks'],
    prereqs: ['SC201', 'EE110'], skills: { vlsi: 80, semiconductor: 85 },
  },
  {
    code: 'SC310', title: 'HDL & FPGA Design', category: 'Semiconductor', difficulty: 'Intermediate', credits: 3, hours: 45,
    summary: 'Verilog, simulation and FPGA prototyping.',
    description: 'Describe hardware in Verilog/SystemVerilog, simulate and verify designs, and implement them on FPGAs.',
    outcomes: ['Write synthesisable Verilog', 'Build testbenches', 'Implement designs on FPGA', 'Meet timing constraints'],
    prereqs: ['EE110'], skills: { vlsi: 50, digital: 75 },
  },
  {
    code: 'SC330', title: 'Advanced Digital IC Design', category: 'Semiconductor', difficulty: 'Expert', credits: 3, hours: 55,
    summary: 'RTL-to-GDS flow, verification and low-power design.',
    description: 'The full ASIC flow: RTL design, verification, synthesis, place and route, static timing analysis and low-power techniques.',
    outcomes: ['Run an RTL-to-GDS flow', 'Write verification plans', 'Close timing with STA', 'Apply low-power design'],
    prereqs: ['SC301', 'SC310'], skills: { vlsi: 90, digital: 85 },
  },

  // ───────────── Physics ─────────────
  {
    code: 'PH101', title: 'Physics I & II', category: 'Physics', difficulty: 'Beginner', credits: 4, hours: 60,
    summary: 'Mechanics, waves and electromagnetism.',
    description: 'Newtonian mechanics, energy, waves, electricity and magnetism with calculus-based problem solving.',
    outcomes: ['Solve mechanics problems', 'Analyse electric and magnetic fields', 'Model waves and oscillations', 'Apply conservation laws'],
    prereqs: ['MA101'], skills: { physics: 60 },
  },
  {
    code: 'PH201', title: 'Quantum Mechanics', category: 'Physics', difficulty: 'Advanced', credits: 4, hours: 60,
    summary: 'Wavefunctions, operators and the hydrogen atom.',
    description: 'Postulates of quantum mechanics, the Schrödinger equation, operators, angular momentum, spin and approximation methods.',
    outcomes: ['Solve the Schrödinger equation for simple systems', 'Use operators and commutators', 'Explain spin and angular momentum', 'Apply perturbation theory'],
    prereqs: ['PH101', 'MA110'], skills: { quantum: 70, physics: 75 },
  },
  {
    code: 'PH210', title: 'Computational Physics', category: 'Physics', difficulty: 'Advanced', credits: 3, hours: 50,
    summary: 'Simulating physical systems in Python.',
    description: 'Simulate physical systems numerically: ODE and PDE solvers, Monte Carlo methods, molecular dynamics and visualisation with Python.',
    outcomes: ['Simulate ODE/PDE systems', 'Apply Monte Carlo methods', 'Validate simulations against theory', 'Visualise simulation results'],
    prereqs: ['PH101', 'MA230'], skills: { comp_physics: 75, python: 60 },
  },
  {
    code: 'PH301', title: 'Solid State Physics', category: 'Physics', difficulty: 'Advanced', credits: 3, hours: 45,
    summary: 'Crystals, band structure and electronic properties.',
    description: 'Crystal structure, lattice vibrations, electronic band structure and the electrical and optical properties of materials.',
    outcomes: ['Describe crystal lattices', 'Compute simple band structures', 'Explain conduction in materials', 'Connect theory to device behaviour'],
    prereqs: ['PH201'], skills: { physics: 85, quantum: 75, semiconductor: 50 },
  },
  {
    code: 'QT301', title: 'Quantum Computing & Information', category: 'Physics', difficulty: 'Expert', credits: 3, hours: 50,
    summary: 'Qubits, gates, algorithms and error correction.',
    description: 'Qubits, quantum gates and circuits, entanglement, quantum algorithms (Grover, Shor, VQE), noise and error correction, with hands-on Qiskit.',
    outcomes: ['Build quantum circuits', 'Explain key quantum algorithms', 'Run experiments on simulators', 'Understand error correction basics'],
    prereqs: ['PH201', 'MA310'], skills: { quantum: 90 },
  },

  // ───────────── Robotics ─────────────
  {
    code: 'RB201', title: 'Robotics: Kinematics & Control', category: 'Robotics', difficulty: 'Advanced', credits: 4, hours: 55,
    summary: 'Kinematics, dynamics and feedback control.',
    description: 'Rigid-body transforms, forward and inverse kinematics, dynamics, PID and state-space control, simulated in ROS.',
    outcomes: ['Compute forward and inverse kinematics', 'Design feedback controllers', 'Simulate robots in ROS', 'Tune controllers on hardware'],
    prereqs: ['MA110', 'MA102', 'PH101', 'CS101'], skills: { robotics: 65 },
  },
  {
    code: 'RB301', title: 'Robot Perception & Planning', category: 'Robotics', difficulty: 'Expert', credits: 3, hours: 50,
    summary: 'SLAM, motion planning and learning-based control.',
    description: 'State estimation, SLAM, motion planning and learning-based perception that let robots act in the real world.',
    outcomes: ['Implement Kalman filters and SLAM', 'Plan collision-free motion', 'Fuse camera and sensor data', 'Combine perception with control'],
    prereqs: ['RB201', 'CV210'], skills: { robotics: 85, cv: 50 },
  },

  // ───────────── Research Methods ─────────────
  {
    code: 'RM201', title: 'Research Methods & Scientific Writing', category: 'Research Methods', difficulty: 'Intermediate', credits: 2, hours: 30,
    summary: 'Literature review, experiment design and writing.',
    description: 'How research works: finding and reading literature, forming hypotheses, designing experiments, and writing and presenting scientific work.',
    outcomes: ['Run a structured literature review', 'Design controlled experiments', 'Write a research proposal', 'Present findings clearly'],
    prereqs: [], skills: { research: 60 },
  },
  {
    code: 'RM301', title: 'Reading & Reproducing Research Papers', category: 'Research Methods', difficulty: 'Advanced', credits: 2, hours: 35,
    summary: 'Critically read papers and reproduce results.',
    description: 'Read papers critically, reproduce published results, run ablations and write a reproducibility report — the fastest way into a research lab.',
    outcomes: ['Critically evaluate papers', 'Reproduce published experiments', 'Design ablation studies', 'Write a reproducibility report'],
    prereqs: ['RM201'], skills: { research: 80 },
  },
  {
    code: 'RM310', title: 'Physics-Informed Machine Learning', category: 'Research Methods', difficulty: 'Expert', credits: 3, hours: 45,
    summary: 'PINNs, neural operators and scientific ML.',
    description: 'Combine physical laws with neural networks: physics-informed neural networks, neural operators and differentiable simulation for science and engineering.',
    outcomes: ['Train physics-informed neural networks', 'Embed PDE constraints in losses', 'Compare PINNs with classical solvers', 'Apply scientific ML to a research problem'],
    prereqs: ['DL201', 'PH210'], skills: { comp_physics: 85, dl: 75 },
  },

  // ───────────── Capstone projects (milestones, added by roadmap paths) ─────────────
  {
    code: 'PJ401', title: 'AI Engineering Capstone', category: 'Projects', difficulty: 'Advanced', credits: 4, hours: 80, kind: 'project',
    summary: 'Build and deploy an end-to-end AI product.',
    description: 'Scope, build, evaluate and deploy a complete AI application — data pipeline, model, API and monitoring — and present it as a portfolio piece.',
    outcomes: ['Deliver an end-to-end AI system', 'Write a technical report', 'Present trade-offs to reviewers', 'Publish a portfolio-ready repository'],
    prereqs: ['DL201', 'ML310'], skills: { ml: 80, dl: 75, mlops: 70 },
  },
  {
    code: 'PJ402', title: 'Computer Vision Capstone', category: 'Projects', difficulty: 'Expert', credits: 4, hours: 80, kind: 'project',
    summary: 'Ship a real-world vision system.',
    description: 'Build a production-grade vision system — detection, segmentation or tracking — on a real dataset, optimised for deployment.',
    outcomes: ['Collect and label a vision dataset', 'Train and benchmark vision models', 'Optimise inference for deployment', 'Document results professionally'],
    prereqs: ['CV310'], skills: { cv: 85, dl: 80 },
  },
  {
    code: 'PJ403', title: 'NLP Capstone', category: 'Projects', difficulty: 'Expert', credits: 4, hours: 80, kind: 'project',
    summary: 'Build an LLM-powered application.',
    description: 'Design, build and evaluate a language application — retrieval-augmented assistant, classifier or summariser — with rigorous evaluation.',
    outcomes: ['Build an LLM application end-to-end', 'Design an evaluation suite', 'Control cost and latency', 'Present a portfolio demo'],
    prereqs: ['NL301'], skills: { nlp: 85, dl: 80 },
  },
  {
    code: 'PJ404', title: 'Data Science Capstone', category: 'Projects', difficulty: 'Advanced', credits: 4, hours: 70, kind: 'project',
    summary: 'Answer a real question with data.',
    description: 'Take a real, messy dataset from question to decision: cleaning, analysis, modelling, experimentation and a stakeholder-ready report.',
    outcomes: ['Frame an ambiguous business or science question', 'Model and analyse real data', 'Communicate to non-experts', 'Publish a reproducible analysis'],
    prereqs: ['DS201', 'ML201'], skills: { data_analysis: 85, ml: 75 },
  },
  {
    code: 'PJ405', title: 'Software Engineering Capstone', category: 'Projects', difficulty: 'Advanced', credits: 4, hours: 80, kind: 'project',
    summary: 'Ship a production-quality application as a team.',
    description: 'Work in a small team to design, build, test and deploy a production-quality application with real users and a maintained codebase.',
    outcomes: ['Deliver software in iterations', 'Maintain a tested codebase', 'Operate a deployed service', 'Write design and post-mortem docs'],
    prereqs: ['CS230', 'CS340'], skills: { swe: 85, webdev: 75 },
  },
  {
    code: 'PJ406', title: 'Embedded & IoT Capstone', category: 'Projects', difficulty: 'Advanced', credits: 4, hours: 80, kind: 'project',
    summary: 'Build a connected device from board to cloud.',
    description: 'Design and build a connected embedded device — hardware, firmware, connectivity and a cloud dashboard — and document it like a product.',
    outcomes: ['Integrate hardware and firmware', 'Connect a device to the cloud', 'Test reliability and power', 'Document a product-quality build'],
    prereqs: ['EM201', 'IO201'], skills: { embedded: 80, networking: 75 },
  },
  {
    code: 'PJ407', title: 'Chip Design Capstone', category: 'Projects', difficulty: 'Expert', credits: 4, hours: 80, kind: 'project',
    summary: 'Tape-out-style digital IC project.',
    description: 'Design, verify and lay out a small digital block through an open-source ASIC flow, producing a tape-out-ready design and report.',
    outcomes: ['Complete an ASIC design flow', 'Verify a design thoroughly', 'Close timing and DRC', 'Write a design report'],
    prereqs: ['SC301'], skills: { vlsi: 85, digital: 80 },
  },
  {
    code: 'PJ410', title: 'Research Project & Paper', category: 'Projects', difficulty: 'Expert', credits: 4, hours: 90, kind: 'project',
    summary: 'Original research written up as a paper.',
    description: 'Carry out a supervised research project in your direction — question, method, experiments, results — and write it up as a workshop-style paper.',
    outcomes: ['Formulate an original research question', 'Run rigorous experiments', 'Write a workshop-style paper', 'Present to a research group'],
    prereqs: ['RM301'], skills: { research: 90 },
  },
];
