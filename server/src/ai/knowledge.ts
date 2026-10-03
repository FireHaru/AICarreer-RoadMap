import type { Lang } from '../i18n.js';

/** Lower-case, collapse whitespace and strip Vietnamese diacritics so "Đại số" and "dai so" match alike. */
export function normalize(text: string) {
  return ` ${text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')} `;
}

/** Short, factual notes on why each skill matters — used by PathGPT's local engine. */
export const SKILL_WHY: Record<Lang, Record<string, string>> = {
  en: {
    python: 'Python is the working language of data science, ML research and scientific computing — almost every library you will use (NumPy, pandas, PyTorch, scikit-learn) is Python-first.',
    cpp: 'C/C++ gives you control over memory and timing. Firmware, robotics, game engines and fast inference runtimes are written in it.',
    dsa: 'Data structures and algorithms decide whether code scales. They are also the backbone of technical interviews for internships.',
    swe: 'Software engineering habits — version control, tests, code review — are what turn a notebook into something a team can trust and ship.',
    sql: 'Most real-world data lives in relational databases; SQL is how you get it out.',
    webdev: 'APIs and web front-ends are how users and other services reach what you build.',
    systems: 'Operating-systems knowledge explains processes, memory and concurrency — essential when performance or reliability matters.',
    cloud: 'Cloud and distributed-systems skills let you run services that stay up and scale beyond a single machine.',
    calculus: 'Calculus describes change. Gradient descent — how every neural network learns — is calculus applied to a loss function.',
    linalg: 'Linear algebra is the language of ML: data are vectors, layers are matrix multiplications, and tools like PCA, SVD and embeddings are pure linear algebra.',
    probstat: 'Probability and statistics let you reason about uncertainty: loss functions, evaluation metrics, A/B tests and Bayesian models all come from here.',
    optimization: 'Optimization is the engine of training: choosing learning rates, understanding convergence and why Adam behaves differently from SGD.',
    discrete: 'Discrete maths — logic, graphs, combinatorics — underpins algorithms, complexity and correctness proofs.',
    data_analysis: 'Data analysis is how you understand a dataset before modelling it; most ML failures are data problems found too late.',
    ml: 'Machine learning is the core of the AI toolbox: framing problems, training models and — crucially — evaluating them honestly.',
    dl: 'Deep learning powers modern vision, language and speech systems; it is where most current AI products and research live.',
    cv: 'Computer vision teaches machines to interpret images and video — detection, segmentation, tracking and 3D understanding.',
    nlp: 'NLP covers how machines represent and generate language, from embeddings to large language models.',
    rl: 'Reinforcement learning trains agents through interaction — the basis of robotics control, game-playing agents and RLHF.',
    mlops: 'MLOps is what makes models useful after training: reproducible pipelines, serving, monitoring and safe updates.',
    image_proc: 'Classical image processing (filters, transforms, features) explains what CNNs learn and is still used for preprocessing and fast pipelines.',
    circuits: 'Circuit analysis is the foundation for reading schematics, choosing components and debugging hardware.',
    digital: 'Digital logic and computer architecture explain how processors execute your code — critical for firmware and chip design.',
    embedded: 'Embedded systems skills let you program the microcontrollers inside almost every modern device.',
    signals: 'Signals and DSP let you filter, transform and interpret sensor, audio and radio data.',
    networking: 'Networking and IoT protocols are how devices talk to each other and to the cloud.',
    semiconductor: 'Semiconductor device physics explains how transistors work — the basis of every chip.',
    vlsi: 'VLSI design is how billions of transistors become a working, manufacturable chip.',
    physics: 'Physics foundations give you modelling intuition and the mathematical maturity that transfers to engineering and ML.',
    quantum: 'Quantum mechanics underpins semiconductors, lasers and quantum computing.',
    comp_physics: 'Scientific computing lets you simulate systems that cannot be solved on paper — and is the bridge to physics-informed ML.',
    robotics: 'Robotics combines kinematics, control and perception so machines can act in the physical world.',
    research: 'Research methods — reading papers, designing experiments, writing — are what get you into a lab and turn projects into publications.',
  },
  vi: {
    python: 'Python là ngôn ngữ làm việc chính của khoa học dữ liệu, nghiên cứu ML và tính toán khoa học — hầu hết thư viện bạn sẽ dùng (NumPy, pandas, PyTorch, scikit-learn) đều ưu tiên Python.',
    cpp: 'C/C++ cho bạn quyền kiểm soát bộ nhớ và thời gian thực thi. Firmware, robot, game engine và các runtime suy luận tốc độ cao đều được viết bằng nó.',
    dsa: 'Cấu trúc dữ liệu và giải thuật quyết định mã của bạn có mở rộng được hay không. Đây cũng là xương sống của các vòng phỏng vấn kỹ thuật khi xin thực tập.',
    swe: 'Thói quen kỹ nghệ phần mềm — quản lý phiên bản, kiểm thử, review mã — là thứ biến một notebook thành sản phẩm mà cả nhóm tin tưởng và phát hành được.',
    sql: 'Phần lớn dữ liệu thực tế nằm trong cơ sở dữ liệu quan hệ; SQL là cách bạn lấy chúng ra.',
    webdev: 'API và giao diện web là cách người dùng và các dịch vụ khác tiếp cận sản phẩm bạn xây dựng.',
    systems: 'Kiến thức hệ điều hành giải thích tiến trình, bộ nhớ và đồng thời — thiết yếu khi cần hiệu năng hoặc độ tin cậy.',
    cloud: 'Kỹ năng đám mây và hệ phân tán giúp bạn vận hành dịch vụ luôn sẵn sàng và mở rộng vượt một máy chủ.',
    calculus: 'Giải tích mô tả sự thay đổi. Gradient descent — cách mọi mạng nơ-ron học — chính là giải tích áp dụng lên hàm mất mát.',
    linalg: 'Đại số tuyến tính là ngôn ngữ của ML: dữ liệu là vectơ, mỗi lớp mạng là phép nhân ma trận, còn PCA, SVD hay embedding đều thuần túy là đại số tuyến tính.',
    probstat: 'Xác suất và thống kê giúp bạn lập luận về sự bất định: hàm mất mát, chỉ số đánh giá, A/B test và mô hình Bayes đều bắt nguồn từ đây.',
    optimization: 'Tối ưu hóa là động cơ của quá trình huấn luyện: chọn learning rate, hiểu sự hội tụ và vì sao Adam khác SGD.',
    discrete: 'Toán rời rạc — logic, đồ thị, tổ hợp — là nền móng của thuật toán, độ phức tạp và chứng minh tính đúng.',
    data_analysis: 'Phân tích dữ liệu giúp bạn hiểu tập dữ liệu trước khi mô hình hóa; phần lớn thất bại của ML là vấn đề dữ liệu bị phát hiện quá muộn.',
    ml: 'Học máy là cốt lõi của bộ công cụ AI: định hình bài toán, huấn luyện mô hình và — quan trọng nhất — đánh giá chúng một cách trung thực.',
    dl: 'Học sâu là nền tảng của các hệ thống thị giác, ngôn ngữ và giọng nói hiện đại; phần lớn sản phẩm và nghiên cứu AI hiện nay nằm ở đây.',
    cv: 'Thị giác máy tính dạy máy hiểu hình ảnh và video — phát hiện, phân đoạn, theo vết và hiểu không gian 3D.',
    nlp: 'NLP nghiên cứu cách máy biểu diễn và sinh ngôn ngữ, từ embedding đến mô hình ngôn ngữ lớn.',
    rl: 'Học tăng cường huấn luyện tác tử qua tương tác — nền tảng của điều khiển robot, tác tử chơi game và RLHF.',
    mlops: 'MLOps giúp mô hình hữu ích sau khi huấn luyện: pipeline tái lập được, phục vụ, giám sát và cập nhật an toàn.',
    image_proc: 'Xử lý ảnh cổ điển (bộ lọc, phép biến đổi, đặc trưng) giải thích những gì CNN học được và vẫn được dùng cho tiền xử lý và pipeline tốc độ cao.',
    circuits: 'Phân tích mạch là nền tảng để đọc sơ đồ, chọn linh kiện và gỡ lỗi phần cứng.',
    digital: 'Logic số và kiến trúc máy tính giải thích cách bộ xử lý thực thi mã của bạn — rất quan trọng cho firmware và thiết kế chip.',
    embedded: 'Kỹ năng hệ thống nhúng giúp bạn lập trình vi điều khiển bên trong hầu hết thiết bị hiện đại.',
    signals: 'Tín hiệu và DSP giúp bạn lọc, biến đổi và diễn giải dữ liệu cảm biến, âm thanh và vô tuyến.',
    networking: 'Mạng và giao thức IoT là cách các thiết bị giao tiếp với nhau và với đám mây.',
    semiconductor: 'Vật lý linh kiện bán dẫn giải thích transistor hoạt động thế nào — nền tảng của mọi con chip.',
    vlsi: 'Thiết kế VLSI là cách hàng tỉ transistor trở thành một con chip hoạt động và sản xuất được.',
    physics: 'Nền tảng vật lý mang lại trực giác mô hình hóa và sự trưởng thành về toán học, có thể chuyển sang kỹ thuật và ML.',
    quantum: 'Cơ học lượng tử là nền tảng của bán dẫn, laser và máy tính lượng tử.',
    comp_physics: 'Tính toán khoa học giúp bạn mô phỏng những hệ không giải được trên giấy — và là cầu nối tới học máy thông tin vật lý.',
    robotics: 'Robot học kết hợp động học, điều khiển và cảm nhận để máy móc hành động trong thế giới thực.',
    research: 'Phương pháp nghiên cứu — đọc bài báo, thiết kế thí nghiệm, viết — là thứ giúp bạn vào phòng thí nghiệm và biến dự án thành công bố khoa học.',
  },
};

/** Phrases (on normalised text, without diacritics) that map to skills. Order matters: longer phrases first. */
export const SKILL_ALIASES: [RegExp, string][] = [
  [/\bmachine learning\b|\bml\b|\bhoc may\b/, 'ml'],
  [/\bdeep learning\b|\bdl\b|\bneural net(work)?s?\b|\bhoc sau\b|\bmang no-?ron\b/, 'dl'],
  [/\blinear algebra\b|\blinalg\b|\bmatri(x|ces)\b|\bdai so tuyen tinh\b|\bma tran\b/, 'linalg'],
  [/\bprobability\b|\bstatistics\b|\bstats?\b|\bxac suat\b|\bthong ke\b/, 'probstat'],
  [/\bcalculus\b|\bderivatives?\b|\bgiai tich\b|\bdao ham\b|\btich phan\b/, 'calculus'],
  [/\boptimi[sz]ation\b|\btoi uu\b/, 'optimization'],
  [/\bdiscrete math(s|ematics)?\b|\btoan roi rac\b/, 'discrete'],
  [/\bdata structures?\b|\balgorithms?\b|\bdsa\b|\bcau truc du lieu\b|\bgiai thuat\b|\bthuat toan\b/, 'dsa'],
  [/\bpython\b/, 'python'],
  [/\bc\+\+|\bcpp\b|\bc programming\b|\bin c\b|\blap trinh c\b/, 'cpp'],
  [/\bsoftware engineering\b|\bgit\b|\btesting\b|\bky nghe phan mem\b|\bkiem thu\b/, 'swe'],
  [/\bsql\b|\bdatabases?\b|\bco so du lieu\b/, 'sql'],
  [/\bweb\b|\bapis?\b|\bfront-?end\b|\bback-?end\b/, 'webdev'],
  [/\boperating systems?\b|\bos\b|\bconcurrency\b|\bhe dieu hanh\b/, 'systems'],
  [/\bcloud\b|\bdistributed\b|\bdam may\b|\bhe phan tan\b/, 'cloud'],
  [/\bdata analysis\b|\bpandas\b|\bvisuali[sz]ation\b|\beda\b|\bphan tich du lieu\b|\btruc quan hoa\b/, 'data_analysis'],
  [/\bcomputer vision\b|\bcv\b|\bvision\b|\bthi giac may tinh\b|\bthi giac\b/, 'cv'],
  [/\bimage processing\b|\bopencv\b|\bxu ly anh\b/, 'image_proc'],
  [/\bnlp\b|\bnatural language\b|\blanguage models?\b|\bllms?\b|\bxu ly ngon ngu\b|\bngon ngu tu nhien\b/, 'nlp'],
  [/\breinforcement learning\b|\brl\b|\bhoc tang cuong\b/, 'rl'],
  [/\bmlops\b|\bdeploy(ment|ing)?\b|\bserving\b|\btrien khai mo hinh\b/, 'mlops'],
  [/\bcircuits?\b|\belectronics\b|\bmach dien\b/, 'circuits'],
  [/\bdigital logic\b|\bcomputer architecture\b|\blogic so\b|\bkien truc may tinh\b/, 'digital'],
  [/\bembedded\b|\bmicrocontrollers?\b|\bfirmware\b|\brtos\b|\bhe thong nhung\b|\bvi dieu khien\b|\bc nhung\b/, 'embedded'],
  [/\bsignals?\b|\bdsp\b|\btin hieu\b/, 'signals'],
  [/\bnetwork(s|ing)?\b|\bmqtt\b|\biot protocols?\b|\bmang may tinh\b/, 'networking'],
  [/\bsemiconductors?\b|\btransistors?\b|\bmosfet\b|\bban dan\b/, 'semiconductor'],
  [/\bvlsi\b|\bverilog\b|\bfpga\b|\bchip design\b|\bvi mach\b|\bthiet ke chip\b/, 'vlsi'],
  [/\bquantum\b|\bluong tu\b/, 'quantum'],
  [/\bscientific computing\b|\bcomputational physics\b|\bsimulation\b|\bmo phong\b|\bvat ly tinh toan\b|\btinh toan khoa hoc\b/, 'comp_physics'],
  [/\brobotics?\b|\brobots?\b|\bkinematics\b|\bdong hoc\b/, 'robotics'],
  [/\bphysics\b|\bvat ly\b/, 'physics'],
  [/\bresearch methods?\b|\bpapers?\b|\bscientific writing\b|\bphuong phap nghien cuu\b|\bbai bao\b/, 'research'],
];

/** Phrases that point at a specific course rather than a skill. */
export const COURSE_ALIASES: [RegExp, string][] = [
  [/\bcnns?\b|\bconvolutional\b|\btich chap\b/, 'CV210'],
  [/\btransformers?\b|\bgenerative models?\b|\bdiffusion\b|\bmo hinh sinh\b/, 'DL301'],
  [/\bpinns?\b|\bphysics[- ]informed\b|\bthong tin vat ly\b/, 'RM310'],
  [/\bcapstone\b|\bfinal project\b|\bdo an tot nghiep\b/, 'PJ401'],
];

/** One-line tips for common transitions, keyed by "<major>|<career slug>" or "<major>|*". */
export const TRANSITION_TIPS: Record<Lang, Record<string, string>> = {
  en: {
    'Physics|*': 'Physics students usually arrive with strong maths and modelling intuition — the main gap is software. Front-load Python and data structures, and you will move fast through the ML courses.',
    'Physics|ai-engineer': 'Your calculus and linear algebra are a real advantage for ML theory. Close the programming gap first, then consider the Research Path: Physics-Informed ML (RM310) is a natural bridge between both worlds.',
    'Physics|semiconductor-engineer': 'Semiconductors are applied solid-state physics — your quantum and physics background maps almost directly. Focus on circuits and digital design to become industry-ready.',
    'Mathematics|*': 'A maths background makes the theory easy; invest early in programming and software-engineering habits so you can turn ideas into working systems.',
    'Electrical Engineering|*': 'Your circuits and signals background is valuable — programming depth (Python, data structures) is usually the piece to add.',
    'Computer Science|*': 'You already have the programming foundations; the roadmap concentrates on the domain maths and specialised courses.',
    'Economics|*': 'Your statistics intuition transfers well. Build programming and linear-algebra foundations before the ML courses.',
    '*|*': 'Start with the foundations your roadmap marks as current, and pair every course with a small project so the skills stick.',
  },
  vi: {
    'Physics|*': 'Sinh viên Vật lý thường có nền toán và trực giác mô hình hóa tốt — khoảng trống chính là phần mềm. Hãy ưu tiên Python và cấu trúc dữ liệu trước, bạn sẽ đi rất nhanh qua các học phần ML.',
    'Physics|ai-engineer': 'Giải tích và đại số tuyến tính của bạn là lợi thế thật sự cho lý thuyết ML. Hãy lấp khoảng trống lập trình trước, sau đó cân nhắc Lộ trình nghiên cứu: Học máy thông tin vật lý (RM310) là cầu nối tự nhiên giữa hai lĩnh vực.',
    'Physics|semiconductor-engineer': 'Bán dẫn chính là vật lý chất rắn ứng dụng — nền tảng lượng tử và vật lý của bạn gần như khớp trực tiếp. Hãy tập trung vào mạch điện tử và thiết kế số để sẵn sàng cho doanh nghiệp.',
    'Mathematics|*': 'Nền tảng toán giúp phần lý thuyết trở nên dễ dàng; hãy sớm đầu tư vào lập trình và thói quen kỹ nghệ phần mềm để biến ý tưởng thành hệ thống chạy được.',
    'Electrical Engineering|*': 'Nền tảng mạch và tín hiệu của bạn rất giá trị — phần thường cần bổ sung là chiều sâu lập trình (Python, cấu trúc dữ liệu).',
    'Computer Science|*': 'Bạn đã có nền tảng lập trình; lộ trình tập trung vào toán chuyên ngành và các học phần chuyên sâu.',
    'Economics|*': 'Trực giác thống kê của bạn rất hữu ích. Hãy xây nền lập trình và đại số tuyến tính trước khi vào các học phần ML.',
    '*|*': 'Hãy bắt đầu với những học phần nền tảng mà lộ trình đánh dấu là đang học, và kết hợp mỗi học phần với một dự án nhỏ để kỹ năng được củng cố.',
  },
};

export const STARTERS: Record<Lang, string[]> = {
  en: [
    'What should I learn next?',
    'I only have 6 months. What should I prioritize?',
    'Suggest a project based on my current skills.',
    'How long until I finish my roadmap?',
  ],
  vi: [
    'Tôi nên học gì tiếp theo?',
    'Tôi chỉ có 6 tháng. Nên ưu tiên gì?',
    'Gợi ý dự án phù hợp với kỹ năng hiện tại của tôi.',
    'Bao lâu nữa tôi hoàn thành lộ trình?',
  ],
};
