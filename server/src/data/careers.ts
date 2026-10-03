/** Skill requirement: [skill slug, required level 0-100, weight 0-1 (1 = core, lower = supporting)] */
export type Req = [slug: string, required: number, weight: number];

export interface PathSeed {
  slug: string;
  name: string;
  kind: 'standard' | 'research' | 'specialization';
  description: string;
  /** How strongly the user's research direction shapes this path (0 = ignored, 1 = full requirements). */
  researchWeight: number;
  /** Extra or raised skill requirements on top of the career's own. */
  skills: Req[];
  /** Milestone courses (usually capstones) that every roadmap in this path ends with. */
  courses: string[];
}

export interface CareerSeed {
  slug: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  portfolio: string[];
  skills: Req[];
  core: string[];
  elective: string[];
  capstone: string;
  specialization: Omit<PathSeed, 'kind' | 'researchWeight'>;
}

export interface ResearchSeed {
  slug: string;
  name: string;
  icon: string;
  description: string;
  skills: Req[];
  core: string[];
  elective: string[];
}

export const CAREERS: CareerSeed[] = [
  {
    slug: 'ai-engineer', name: 'AI Engineer', icon: 'brain-circuit',
    tagline: 'Build and ship intelligent products.',
    description: 'AI Engineers turn machine-learning models into working products: they prepare data, train and evaluate models, and deploy them behind reliable APIs. The role blends strong Python engineering with solid ML and deep-learning fundamentals.',
    portfolio: [
      'An end-to-end ML app with a public demo and API',
      'A deep-learning model trained, evaluated and deployed with monitoring',
      'A well-documented GitHub repository with tests and CI',
      'A short technical blog post explaining a model trade-off',
    ],
    skills: [
      ['python', 80, 1], ['dsa', 60, 0.7], ['linalg', 70, 0.9], ['probstat', 70, 0.9], ['calculus', 60, 0.6],
      ['ml', 75, 1], ['dl', 70, 1], ['data_analysis', 60, 0.6], ['swe', 60, 0.6], ['mlops', 60, 0.7], ['optimization', 50, 0.5],
    ],
    core: ['CS101', 'CS201', 'CS301', 'MA110', 'MA201', 'ML201', 'DL201', 'ML310', 'PJ401'],
    elective: ['CV210', 'NL201', 'DL301', 'MA220', 'DS101', 'ML301'],
    capstone: 'PJ401',
    specialization: {
      slug: 'computer-vision', name: 'Computer Vision Path',
      description: 'Specialise in vision: CNNs, image processing and a computer-vision capstone.',
      skills: [['cv', 80, 1], ['image_proc', 65, 0.8], ['dl', 75, 1]],
      courses: ['PJ402'],
    },
  },
  {
    slug: 'ml-engineer', name: 'Machine Learning Engineer', icon: 'cpu',
    tagline: 'Make models reliable at scale.',
    description: 'ML Engineers own the full lifecycle of models in production: feature pipelines, training at scale, serving, monitoring and continuous improvement. They need deeper ML theory and stronger software engineering than most AI roles.',
    portfolio: [
      'A reproducible training pipeline with experiment tracking',
      'A model-serving service with load tests and monitoring dashboards',
      'A from-scratch implementation of a classic ML algorithm',
      'Contributions to an open-source ML library',
    ],
    skills: [
      ['python', 85, 1], ['dsa', 70, 0.8], ['linalg', 70, 0.8], ['probstat', 75, 0.9], ['optimization', 65, 0.7],
      ['ml', 90, 1], ['dl', 70, 0.8], ['mlops', 75, 1], ['swe', 70, 0.8], ['sql', 50, 0.5], ['cloud', 45, 0.5],
    ],
    core: ['CS101', 'CS201', 'CS301', 'MA110', 'MA201', 'MA220', 'ML201', 'ML301', 'DL201', 'ML310', 'PJ401'],
    elective: ['CS210', 'CS220', 'DL301', 'ML320', 'CS330'],
    capstone: 'PJ401',
    specialization: {
      slug: 'production-ml', name: 'Production ML Path',
      description: 'Go deep on platform skills: distributed systems, cloud and software architecture.',
      skills: [['cloud', 70, 0.9], ['swe', 80, 0.9], ['mlops', 75, 1]],
      courses: ['PJ401'],
    },
  },
  {
    slug: 'data-scientist', name: 'Data Scientist', icon: 'chart-scatter',
    tagline: 'Turn data into decisions.',
    description: 'Data Scientists answer questions with data: they design experiments, build statistical and ML models, and communicate insights that change decisions. Statistics and clear communication matter as much as code.',
    portfolio: [
      'An exploratory analysis notebook on a public dataset with clear storytelling',
      'An A/B test design and analysis report',
      'A predictive model with an honest evaluation and error analysis',
      'An interactive dashboard answering a real question',
    ],
    skills: [
      ['python', 75, 0.9], ['sql', 70, 0.9], ['probstat', 85, 1], ['linalg', 60, 0.6], ['calculus', 50, 0.4],
      ['data_analysis', 85, 1], ['ml', 75, 0.9], ['dl', 40, 0.4],
    ],
    core: ['CS101', 'DS101', 'CS220', 'MA201', 'DS201', 'MA301', 'ML201', 'PJ404'],
    elective: ['MA110', 'DL201', 'ML301', 'CS301'],
    capstone: 'PJ404',
    specialization: {
      slug: 'applied-ml', name: 'Applied ML Path',
      description: 'Lean towards modelling: advanced ML and deep learning on top of the statistics core.',
      skills: [['ml', 85, 1], ['dl', 60, 0.7]],
      courses: ['PJ404'],
    },
  },
  {
    slug: 'software-engineer', name: 'Software Engineer', icon: 'code-xml',
    tagline: 'Design and build reliable software.',
    description: 'Software Engineers design, build and maintain the systems everything else runs on. Strong fundamentals in algorithms, systems and software design let them work across web, backend and infrastructure.',
    portfolio: [
      'A deployed full-stack application with authentication and tests',
      'A system design document for a scalable service',
      'Solutions to a set of algorithmic challenges with complexity analysis',
      'Meaningful open-source pull requests',
    ],
    skills: [
      ['python', 70, 0.8], ['dsa', 85, 1], ['swe', 85, 1], ['sql', 65, 0.7], ['webdev', 70, 0.8],
      ['systems', 65, 0.8], ['cloud', 60, 0.6], ['discrete', 60, 0.5],
    ],
    core: ['CS101', 'CS201', 'CS210', 'CS220', 'CS230', 'CS310', 'CS320', 'CS340', 'PJ405'],
    elective: ['CS330', 'MA120', 'CS102'],
    capstone: 'PJ405',
    specialization: {
      slug: 'systems-cloud', name: 'Systems & Cloud Path',
      description: 'Specialise in infrastructure: operating systems, distributed systems and cloud.',
      skills: [['systems', 80, 1], ['cloud', 80, 1]],
      courses: ['PJ405'],
    },
  },
  {
    slug: 'cv-engineer', name: 'Computer Vision Engineer', icon: 'scan-eye',
    tagline: 'Teach machines to see.',
    description: 'Computer Vision Engineers build systems that understand images and video — detection, segmentation, tracking and 3D perception — for products from medical imaging to autonomous vehicles.',
    portfolio: [
      'An image classifier with augmentation and transfer learning',
      'A real-time object detector running on an edge device',
      'A segmentation model evaluated on a public benchmark',
      'A reproduced result from a recent vision paper',
    ],
    skills: [
      ['python', 80, 1], ['linalg', 75, 0.9], ['probstat', 65, 0.7], ['ml', 75, 0.9], ['dl', 75, 1],
      ['image_proc', 70, 0.9], ['cv', 85, 1], ['cpp', 50, 0.5], ['mlops', 50, 0.5],
    ],
    core: ['CS101', 'CS301', 'MA110', 'MA230', 'ML201', 'DL201', 'CV201', 'CV210', 'CV310', 'PJ402'],
    elective: ['DL301', 'RB301', 'ML310', 'CS202'],
    capstone: 'PJ402',
    specialization: {
      slug: 'robotics-vision', name: 'Robotics Vision Path',
      description: 'Combine vision with robotics: perception, SLAM and planning.',
      skills: [['robotics', 70, 0.9], ['cv', 85, 1]],
      courses: ['PJ402'],
    },
  },
  {
    slug: 'nlp-engineer', name: 'NLP Engineer', icon: 'messages-square',
    tagline: 'Build systems that understand language.',
    description: 'NLP Engineers build language technology — search, assistants, classifiers and LLM applications. They combine deep learning with careful evaluation of messy, human data.',
    portfolio: [
      'A fine-tuned text classifier with error analysis',
      'A retrieval-augmented question-answering assistant',
      'An evaluation harness for an LLM application',
      'A write-up comparing prompting and fine-tuning',
    ],
    skills: [
      ['python', 85, 1], ['probstat', 70, 0.8], ['linalg', 65, 0.7], ['ml', 75, 0.9], ['dl', 80, 1],
      ['nlp', 85, 1], ['data_analysis', 50, 0.5], ['mlops', 55, 0.6],
    ],
    core: ['CS101', 'CS301', 'MA201', 'ML201', 'DL201', 'NL201', 'NL301', 'PJ403'],
    elective: ['DL301', 'ML310', 'MA110'],
    capstone: 'PJ403',
    specialization: {
      slug: 'llm-apps', name: 'LLM Applications Path',
      description: 'Focus on shipping LLM products: Transformers in depth, MLOps and web APIs.',
      skills: [['dl', 90, 1], ['mlops', 75, 0.9], ['webdev', 60, 0.6]],
      courses: ['PJ403'],
    },
  },
  {
    slug: 'embedded-engineer', name: 'Embedded Engineer', icon: 'microchip',
    tagline: 'Program the hardware around us.',
    description: 'Embedded Engineers write the firmware inside cars, medical devices and consumer electronics. They work close to the hardware: microcontrollers, real-time constraints, peripherals and power budgets.',
    portfolio: [
      'A bare-metal firmware project with interrupts and peripherals',
      'An RTOS-based multi-task device',
      'A custom PCB or breakout with documented bring-up',
      'A device driver for an embedded Linux board',
    ],
    skills: [
      ['cpp', 85, 1], ['circuits', 60, 0.7], ['digital', 75, 0.9], ['embedded', 85, 1], ['systems', 60, 0.7],
      ['signals', 50, 0.5], ['dsa', 50, 0.5], ['networking', 40, 0.4],
    ],
    core: ['CS102', 'CS202', 'EE101', 'EE110', 'EE201', 'EM201', 'EM301', 'EE210', 'PJ406'],
    elective: ['IO201', 'CS320', 'SC310', 'EE310'],
    capstone: 'PJ406',
    specialization: {
      slug: 'embedded-ai', name: 'Embedded AI (TinyML) Path',
      description: 'Bring machine learning to microcontrollers and edge devices.',
      skills: [['ml', 60, 0.8], ['dl', 50, 0.7], ['python', 60, 0.6]],
      courses: ['PJ406'],
    },
  },
  {
    slug: 'iot-engineer', name: 'IoT Engineer', icon: 'router',
    tagline: 'Connect devices to the cloud.',
    description: 'IoT Engineers design connected systems end to end — sensors, firmware, wireless connectivity, gateways and the cloud services that make the data useful.',
    portfolio: [
      'A sensor network streaming data to a live dashboard',
      'A low-power BLE or LoRa device with measured battery life',
      'An MQTT-based home or lab automation system',
      'A fleet OTA-update demo',
    ],
    skills: [
      ['cpp', 70, 0.8], ['python', 60, 0.6], ['embedded', 75, 1], ['networking', 85, 1], ['cloud', 55, 0.7],
      ['circuits', 55, 0.6], ['sql', 45, 0.4], ['swe', 55, 0.5],
    ],
    core: ['CS101', 'CS102', 'EE101', 'EM201', 'IO201', 'IO301', 'PJ406'],
    elective: ['CS330', 'CS220', 'EE210', 'CS202'],
    capstone: 'PJ406',
    specialization: {
      slug: 'industrial-iot', name: 'Industrial IoT & Edge Path',
      description: 'Signal processing, edge analytics and cloud-scale ingestion for industrial systems.',
      skills: [['signals', 65, 0.8], ['cloud', 75, 0.9], ['data_analysis', 50, 0.6]],
      courses: ['PJ406'],
    },
  },
  {
    slug: 'semiconductor-engineer', name: 'Semiconductor Engineer', icon: 'cpu',
    tagline: 'Design the chips that power everything.',
    description: 'Semiconductor Engineers work on devices, processes and chip design — from transistor physics to VLSI layout and verification. A strong physics and electronics base is essential.',
    portfolio: [
      'A Verilog design verified with a testbench and run on FPGA',
      'A CMOS cell library layout with DRC/LVS-clean results',
      'A device simulation study (e.g. MOSFET characteristics)',
      'A report on a modern process technology node',
    ],
    skills: [
      ['physics', 70, 0.8], ['quantum', 60, 0.6], ['semiconductor', 85, 1], ['circuits', 70, 0.8], ['digital', 70, 0.8],
      ['vlsi', 80, 1], ['calculus', 65, 0.6], ['linalg', 55, 0.5], ['python', 40, 0.4],
    ],
    core: ['PH101', 'PH201', 'EE101', 'EE102', 'EE110', 'SC201', 'SC301', 'SC310', 'PJ407'],
    elective: ['PH301', 'SC330', 'MA102'],
    capstone: 'PJ407',
    specialization: {
      slug: 'chip-design', name: 'Digital Chip Design Path',
      description: 'Specialise in digital IC design: RTL, verification and the full ASIC flow.',
      skills: [['vlsi', 90, 1], ['digital', 85, 1]],
      courses: ['PJ407'],
    },
  },
];

export const RESEARCH: ResearchSeed[] = [
  {
    slug: 'machine-learning', name: 'Machine Learning', icon: 'sigma',
    description: 'Theory and algorithms for learning from data — generalisation, optimisation and probabilistic modelling.',
    skills: [['ml', 90, 1], ['probstat', 85, 1], ['linalg', 80, 0.9], ['optimization', 75, 0.9], ['dl', 70, 0.7], ['python', 75, 0.7], ['research', 75, 1]],
    core: ['ML301', 'MA301', 'MA220', 'RM301'], elective: ['DL301', 'MA310'],
  },
  {
    slug: 'artificial-intelligence', name: 'Artificial Intelligence', icon: 'sparkles',
    description: 'Building agents that perceive, reason and act — from deep learning to reinforcement learning.',
    skills: [['ml', 80, 1], ['dl', 80, 1], ['probstat', 75, 0.8], ['linalg', 70, 0.8], ['rl', 60, 0.8], ['python', 75, 0.7], ['research', 75, 1]],
    core: ['ML301', 'DL301', 'ML320', 'RM301'], elective: ['NL301', 'CV310'],
  },
  {
    slug: 'computer-vision', name: 'Computer Vision', icon: 'eye',
    description: 'Visual recognition, 3D understanding and generative models for images and video.',
    skills: [['cv', 85, 1], ['dl', 85, 1], ['image_proc', 70, 0.8], ['linalg', 75, 0.8], ['research', 75, 1]],
    core: ['CV310', 'DL301', 'RM301'], elective: ['CV201', 'RB301'],
  },
  {
    slug: 'nlp', name: 'Natural Language Processing', icon: 'languages',
    description: 'Language models, understanding, generation and evaluation of language technology.',
    skills: [['nlp', 85, 1], ['dl', 85, 1], ['probstat', 75, 0.8], ['research', 75, 1]],
    core: ['NL301', 'DL301', 'RM301'], elective: ['MA301'],
  },
  {
    slug: 'robotics', name: 'Robotics', icon: 'bot',
    description: 'Perception, planning and control for robots that operate in the physical world.',
    skills: [['robotics', 85, 1], ['linalg', 75, 0.8], ['calculus', 70, 0.7], ['cpp', 60, 0.6], ['cv', 50, 0.6], ['rl', 50, 0.6], ['physics', 55, 0.5], ['research', 70, 1]],
    core: ['RB201', 'RB301', 'ML320'], elective: ['CV210', 'EM201'],
  },
  {
    slug: 'data-science', name: 'Data Science', icon: 'database',
    description: 'Statistical methodology, causal inference and data-driven science.',
    skills: [['probstat', 90, 1], ['data_analysis', 85, 1], ['ml', 75, 0.8], ['sql', 55, 0.5], ['research', 70, 1]],
    core: ['MA301', 'DS201', 'ML301'], elective: ['RM301'],
  },
  {
    slug: 'semiconductor', name: 'Semiconductor', icon: 'microchip',
    description: 'Device physics, materials and fabrication for next-generation electronics.',
    skills: [['semiconductor', 85, 1], ['quantum', 75, 0.9], ['physics', 80, 0.9], ['vlsi', 60, 0.6], ['research', 75, 1]],
    core: ['PH301', 'SC201', 'SC301'], elective: ['QT301'],
  },
  {
    slug: 'computational-physics', name: 'Computational Physics', icon: 'atom',
    description: 'Simulation and scientific machine learning for physical systems.',
    skills: [['comp_physics', 85, 1], ['physics', 80, 0.9], ['calculus', 80, 0.8], ['linalg', 75, 0.8], ['python', 75, 0.8], ['dl', 50, 0.5], ['research', 75, 1]],
    core: ['PH210', 'MA230', 'RM310', 'MA102'], elective: ['DL201'],
  },
  {
    slug: 'iot', name: 'Internet of Things', icon: 'radio-tower',
    description: 'Networked sensing, edge intelligence and large-scale connected systems.',
    skills: [['networking', 85, 1], ['embedded', 80, 1], ['signals', 50, 0.6], ['cloud', 50, 0.6], ['research', 70, 1]],
    core: ['IO301', 'EE310', 'CS330'], elective: ['EM301'],
  },
  {
    slug: 'quantum-technology', name: 'Quantum Technology', icon: 'orbit',
    description: 'Quantum computing, information and sensing — from physics to algorithms.',
    skills: [['quantum', 90, 1], ['linalg', 85, 1], ['physics', 80, 0.8], ['python', 60, 0.6], ['research', 75, 1]],
    core: ['PH201', 'QT301', 'MA310'], elective: ['PH301'],
  },
];

/** Every career also gets a standard path (its own skills + capstone) and a research path built from the user's research direction. */
export function pathsFor(career: CareerSeed): PathSeed[] {
  return [
    {
      slug: 'standard', name: 'Standard Path', kind: 'standard', researchWeight: 0,
      description: `The most direct route to ${career.name}: core skills first, finished with an industry capstone.`,
      skills: [], courses: [career.capstone],
    },
    {
      slug: 'research', name: 'Research Path', kind: 'research', researchWeight: 1,
      description: 'Adds your research direction’s requirements, research methods and a research project you can publish.',
      skills: [['research', 80, 1]], courses: ['PJ410'],
    },
    { ...career.specialization, kind: 'specialization', researchWeight: 0 },
  ];
}
