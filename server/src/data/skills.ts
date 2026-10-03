export interface SkillSeed {
  slug: string;
  name: string;
  category: SkillCategory;
  description: string;
}

export type SkillCategory =
  | 'Programming'
  | 'Mathematics'
  | 'AI & Data'
  | 'Hardware & Systems'
  | 'Science'
  | 'Research';

export const SKILLS: SkillSeed[] = [
  // Programming
  { slug: 'python', name: 'Python', category: 'Programming', description: 'Writing idiomatic Python, from scripts to scientific and ML codebases.' },
  { slug: 'cpp', name: 'C / C++', category: 'Programming', description: 'Low-level programming, memory management and performance-critical code.' },
  { slug: 'dsa', name: 'Data Structures & Algorithms', category: 'Programming', description: 'Choosing and analysing data structures and algorithms for real problems.' },
  { slug: 'swe', name: 'Software Engineering', category: 'Programming', description: 'Version control, testing, code review, design patterns and maintainable architecture.' },
  { slug: 'sql', name: 'Databases & SQL', category: 'Programming', description: 'Relational modelling, SQL querying and working with data stores.' },
  { slug: 'webdev', name: 'Web & API Development', category: 'Programming', description: 'Building HTTP APIs and web front-ends.' },
  { slug: 'systems', name: 'Operating Systems', category: 'Programming', description: 'Processes, memory, concurrency and how software meets hardware.' },
  { slug: 'cloud', name: 'Cloud & Distributed Systems', category: 'Programming', description: 'Designing and operating services across machines and cloud platforms.' },

  // Mathematics
  { slug: 'calculus', name: 'Calculus', category: 'Mathematics', description: 'Limits, derivatives, integrals, multivariable calculus and differential equations.' },
  { slug: 'linalg', name: 'Linear Algebra', category: 'Mathematics', description: 'Vectors, matrices, eigen-decomposition and linear transformations.' },
  { slug: 'probstat', name: 'Probability & Statistics', category: 'Mathematics', description: 'Random variables, distributions, estimation and statistical inference.' },
  { slug: 'optimization', name: 'Optimization', category: 'Mathematics', description: 'Convex optimization, gradient methods and constrained problems.' },
  { slug: 'discrete', name: 'Discrete Mathematics', category: 'Mathematics', description: 'Logic, sets, combinatorics, graphs and proofs.' },

  // AI & Data
  { slug: 'data_analysis', name: 'Data Analysis', category: 'AI & Data', description: 'Cleaning, exploring and visualising data to answer questions.' },
  { slug: 'ml', name: 'Machine Learning', category: 'AI & Data', description: 'Supervised and unsupervised learning, model evaluation and generalisation.' },
  { slug: 'dl', name: 'Deep Learning', category: 'AI & Data', description: 'Neural networks, backpropagation, CNNs, RNNs and Transformers.' },
  { slug: 'cv', name: 'Computer Vision', category: 'AI & Data', description: 'Teaching machines to understand images and video.' },
  { slug: 'nlp', name: 'Natural Language Processing', category: 'AI & Data', description: 'Text representation, language models and language understanding.' },
  { slug: 'rl', name: 'Reinforcement Learning', category: 'AI & Data', description: 'Agents that learn by interacting with an environment.' },
  { slug: 'mlops', name: 'MLOps & Deployment', category: 'AI & Data', description: 'Shipping, serving and monitoring ML models in production.' },
  { slug: 'image_proc', name: 'Image Processing', category: 'AI & Data', description: 'Filtering, transforms, features and classical image analysis.' },

  // Hardware & Systems
  { slug: 'circuits', name: 'Electronic Circuits', category: 'Hardware & Systems', description: 'Analog circuit analysis, amplifiers and mixed-signal basics.' },
  { slug: 'digital', name: 'Digital Logic & Architecture', category: 'Hardware & Systems', description: 'Logic design, processors, memory hierarchy and computer organisation.' },
  { slug: 'embedded', name: 'Embedded Systems', category: 'Hardware & Systems', description: 'Programming microcontrollers, peripherals, RTOS and firmware.' },
  { slug: 'signals', name: 'Signals & DSP', category: 'Hardware & Systems', description: 'Signals and systems, transforms, filtering and digital signal processing.' },
  { slug: 'networking', name: 'Networking & IoT Protocols', category: 'Hardware & Systems', description: 'TCP/IP, wireless and IoT protocols such as MQTT and BLE.' },
  { slug: 'semiconductor', name: 'Semiconductor Devices', category: 'Hardware & Systems', description: 'Physics and operation of diodes, transistors and modern devices.' },
  { slug: 'vlsi', name: 'VLSI & IC Design', category: 'Hardware & Systems', description: 'Designing, verifying and fabricating integrated circuits.' },

  // Science
  { slug: 'physics', name: 'Physics Foundations', category: 'Science', description: 'Mechanics, electromagnetism and modern physics.' },
  { slug: 'quantum', name: 'Quantum Mechanics', category: 'Science', description: 'Wavefunctions, operators and quantum systems.' },
  { slug: 'comp_physics', name: 'Scientific Computing', category: 'Science', description: 'Numerical simulation of physical systems and scientific ML.' },
  { slug: 'robotics', name: 'Robotics & Control', category: 'Science', description: 'Kinematics, dynamics, control and planning for robots.' },

  // Research
  { slug: 'research', name: 'Research Methods', category: 'Research', description: 'Reading papers, designing experiments and scientific writing.' },
];
