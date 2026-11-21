import { Question, Quiz, Round, Team } from '../types/quiz';

// SVG Visual Data URIs for pharmaceutical instruments, chemical structures, scientists, and apparatus
export const VISUAL_ASSETS = {
  dissolutionTester: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%230f172a"/><rect x="80" y="80" width="440" height="40" rx="6" fill="%23334155"/><circle cx="150" cy="100" r="12" fill="%2338bdf8"/><circle cx="250" cy="100" r="12" fill="%2338bdf8"/><circle cx="350" cy="100" r="12" fill="%2338bdf8"/><circle cx="450" cy="100" r="12" fill="%2338bdf8"/><rect x="120" y="140" width="60" height="150" rx="12" fill="%231e293b" stroke="%2364748b" stroke-width="3"/><rect x="220" y="140" width="60" height="150" rx="12" fill="%231e293b" stroke="%2364748b" stroke-width="3"/><rect x="320" y="140" width="60" height="150" rx="12" fill="%231e293b" stroke="%2364748b" stroke-width="3"/><rect x="420" y="140" width="60" height="150" rx="12" fill="%231e293b" stroke="%2364748b" stroke-width="3"/><line x1="150" y1="120" x2="150" y2="240" stroke="%23e2e8f0" stroke-width="4"/><path d="M135 240 Q150 255 165 240" stroke="%23e2e8f0" stroke-width="4" fill="none"/><line x1="250" y1="120" x2="250" y2="240" stroke="%23e2e8f0" stroke-width="4"/><path d="M235 240 Q250 255 265 240" stroke="%23e2e8f0" stroke-width="4" fill="none"/><line x1="350" y1="120" x2="350" y2="240" stroke="%23e2e8f0" stroke-width="4"/><path d="M335 240 Q350 255 365 240" stroke="%23e2e8f0" stroke-width="4" fill="none"/><line x1="450" y1="120" x2="450" y2="240" stroke="%23e2e8f0" stroke-width="4"/><path d="M435 240 Q450 255 465 240" stroke="%23e2e8f0" stroke-width="4" fill="none"/><rect x="60" y="310" width="480" height="50" rx="8" fill="%231e293b" stroke="%23475569" stroke-width="2"/><text x="300" y="342" fill="%2338bdf8" font-family="monospace" font-size="18" text-anchor="middle" font-weight="bold">USP DISSOLUTION TEST APPARATUS (TYPE II - PADDLE)</text></svg>`,

  betaLactamRing: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%230f172a"/><rect x="180" y="110" width="130" height="130" rx="8" stroke="%23f43f5e" stroke-width="6" fill="%23881337" fill-opacity="0.3"/><polygon points="310,135 410,100 450,175 390,230 310,215" stroke="%2338bdf8" stroke-width="5" fill="%230284c7" fill-opacity="0.2"/><text x="160" y="240" fill="%23f43f5e" font-family="sans-serif" font-size="28" font-weight="bold">N</text><text x="135" y="105" fill="%23f43f5e" font-family="sans-serif" font-size="28" font-weight="bold">O=</text><text x="400" y="145" fill="%2338bdf8" font-family="sans-serif" font-size="28" font-weight="bold">S</text><text x="300" y="310" fill="%23fbbf24" font-family="sans-serif" font-size="20" text-anchor="middle" font-weight="bold">IDENTIFY THE CORE 4-MEMBERED HETEROCYCLIC RING</text><text x="300" y="345" fill="%2394a3b8" font-family="sans-serif" font-size="15" text-anchor="middle">Found in Penicillins and Cephalosporins</text></svg>`,

  liposomeStructure: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%230f172a"/><circle cx="300" cy="180" r="130" stroke="%2338bdf8" stroke-width="4" stroke-dasharray="8 6" fill="%230369a1" fill-opacity="0.2"/><circle cx="300" cy="180" r="85" stroke="%23a855f7" stroke-width="4" stroke-dasharray="8 6" fill="%236b21a8" fill-opacity="0.3"/><circle cx="300" cy="180" r="45" fill="%2310b981" fill-opacity="0.4"/><text x="300" y="185" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Aqueous Core</text><text x="300" y="340" fill="%2338bdf8" font-family="sans-serif" font-size="19" text-anchor="middle" font-weight="bold">NOVEL DRUG DELIVERY SYSTEM (LIPID BILAYER VESICLE)</text><text x="300" y="370" fill="%2394a3b8" font-family="sans-serif" font-size="14" text-anchor="middle">Phospholipid concentric sphere encapsulating hydrophilic &amp; lipophilic drugs</text></svg>`,

  alexanderFleming: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%230f172a"/><circle cx="300" cy="150" r="80" fill="%23334155" stroke="%23e2e8f0" stroke-width="4"/><circle cx="300" cy="130" r="40" fill="%23f8fafc"/><path d="M250 200 C250 170 350 170 350 200" fill="%2364748b"/><rect x="220" y="240" width="160" height="50" rx="8" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><circle cx="430" cy="150" r="50" fill="%231e293b" stroke="%2310b981" stroke-width="3"/><circle cx="420" cy="145" r="10" fill="%2310b981"/><circle cx="440" cy="160" r="14" fill="%2310b981"/><text x="430" y="220" fill="%2310b981" font-family="sans-serif" font-size="13" text-anchor="middle">Petri Dish 1928</text><text x="300" y="330" fill="%23f8fafc" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">HISTORIC SCIENTIST &amp; NOBEL LAUREATE</text><text x="300" y="360" fill="%2394a3b8" font-family="sans-serif" font-size="15" text-anchor="middle">Accidental discovery of Penicillin from Penicillium notatum</text></svg>`,
};

export const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team_alpha',
    name: 'Team Alpha',
    institution: 'College of Pharmaceutical Sciences',
    department: 'Pharmaceutics & Formulation Tech',
    rollNo: 'EXP-101',
    color: '#3b82f6', // blue
    participants: [
      { name: 'Dr. Ananya Sharma', rollNo: 'PH-01' },
      { name: 'Rohan Deshmukh', rollNo: 'PH-02' },
    ],
    isOnline: false,
  },
  {
    id: 'team_beta',
    name: 'Team Beta',
    institution: 'Institute of Chemical Technology',
    department: 'Pharmaceutical Chemistry',
    rollNo: 'EXP-102',
    color: '#10b981', // emerald green
    participants: [
      { name: 'Priya Kulkarni', rollNo: 'PH-03' },
      { name: 'Aditya Patel', rollNo: 'PH-04' },
    ],
    isOnline: false,
  },
  {
    id: 'team_gamma',
    name: 'Team Gamma',
    institution: 'National Institute of Pharmaceutical Education',
    department: 'Pharmacology & Toxicology',
    rollNo: 'EXP-103',
    color: '#f59e0b', // amber
    participants: [
      { name: 'Siddharth Nair', rollNo: 'PH-05' },
      { name: 'Meera Iyer', rollNo: 'PH-06' },
    ],
    isOnline: false,
  },
  {
    id: 'team_delta',
    name: 'Team Delta',
    institution: 'University Department of Pharmaceutical Sciences',
    department: 'Regulatory Affairs & QA',
    rollNo: 'EXP-104',
    color: '#ec4899', // pink
    participants: [
      { name: 'Vikram Sengupta', rollNo: 'PH-07' },
      { name: 'Kavita Joshi', rollNo: 'PH-08' },
    ],
    isOnline: false,
  },
];

export const ROUND_1_MCQ_POOL: Question[] = [
  {
    id: 'q1_1',
    text: 'Which equation is fundamentally used to determine the rate of drug dissolution from pharmaceutical dosage forms?',
    type: 'mcq',
    category: 'Physical Pharmacy',
    difficulty: 'medium',
    options: [
      'Henderson-Hasselbalch Equation',
      'Noyes-Whitney Equation',
      'Michaelis-Menten Equation',
      'Arrhenius Equation',
    ],
    correctOptionIndex: 1,
    answer: 'Noyes-Whitney Equation',
    explanation: 'dM/dt = (D * S / h) * (Cs - C), where D is diffusion coefficient, S is surface area, h is diffusion layer thickness.',
  },
  {
    id: 'q1_2',
    text: 'What term describes a dosage form designed to resist gastric fluid and release the active drug substance in the intestinal fluid?',
    type: 'mcq',
    category: 'Pharmaceutics',
    difficulty: 'easy',
    options: [
      'Sustained-Release Matrix Tablet',
      'Sublingual Tablet',
      'Enteric Coated Tablet',
      'Effervescent Tablet',
    ],
    correctOptionIndex: 2,
    answer: 'Enteric Coated Tablet',
    explanation: 'Enteric polymers like cellulose acetate phthalate (CAP) or HPMC phthalate dissolve at alkaline intestinal pH (>5.5).',
  },
  {
    id: 'q1_3',
    text: 'In chromatography, what parameter represents the ratio of the distance moved by the solute to the distance moved by the solvent front?',
    type: 'mcq',
    category: 'Pharmaceutical Analysis',
    difficulty: 'easy',
    options: [
      'Capacity Factor (k\')',
      'Retention Factor (Rf value)',
      'Theoretical Plate Count (N)',
      'Resolution Factor (Rs)',
    ],
    correctOptionIndex: 1,
    answer: 'Retention Factor (Rf value)',
    explanation: 'Rf = Distance traveled by solute / Distance traveled by solvent front. Used in TLC and paper chromatography.',
  },
  {
    id: 'q1_4',
    text: 'What is the primary target receptor for the standard pharmaceutical antidote Naloxone in opioid toxicity management?',
    type: 'mcq',
    category: 'Pharmacology',
    difficulty: 'medium',
    options: [
      'GABA-A Receptor',
      'Beta-2 Adrenergic Receptor',
      'Mu (μ) Opioid Receptor',
      'NMDA Glutamate Receptor',
    ],
    correctOptionIndex: 2,
    answer: 'Mu (μ) Opioid Receptor',
    explanation: 'Naloxone competitively blocks mu, kappa, and delta receptors with high affinity for mu receptors, reversing respiratory depression.',
  },
  {
    id: 'q1_5',
    text: 'Which Schedule under the Drugs and Cosmetics Rules, 1945 in India specifically prescribes Good Manufacturing Practices (GMP)?',
    type: 'mcq',
    category: 'Jurisprudence & Regulatory',
    difficulty: 'easy',
    options: [
      'Schedule M',
      'Schedule H',
      'Schedule Y',
      'Schedule X',
    ],
    correctOptionIndex: 0,
    answer: 'Schedule M',
    explanation: 'Schedule M prescribes Good Manufacturing Practices and requirements of premises, plant, and equipment for pharmaceutical products.',
  },
  {
    id: 'q1_6',
    text: 'Which HLB (Hydrophile-Lipophile Balance) range is typically required for surfactants used to prepare stable oil-in-water (o/w) emulsions?',
    type: 'mcq',
    category: 'Physical Pharmacy',
    difficulty: 'medium',
    options: [
      '1 to 3',
      '4 to 6',
      '8 to 18',
      '20 to 25',
    ],
    correctOptionIndex: 2,
    answer: '8 to 18',
    explanation: 'According to Griffin\'s HLB scale, w/o emulsifiers have HLB 3–6 whereas o/w emulsifiers typically fall in the range 8–18.',
  },
  {
    id: 'q1_7',
    text: 'Which standard USP apparatus is officially designated as the "Paddle Apparatus" for tablet dissolution testing?',
    type: 'mcq',
    category: 'Biopharmaceutics',
    difficulty: 'easy',
    options: [
      'USP Type I',
      'USP Type II',
      'USP Type III',
      'USP Type IV',
    ],
    correctOptionIndex: 1,
    answer: 'USP Type II',
    explanation: 'USP Apparatus I is the Rotating Basket, while USP Apparatus II is the Paddle apparatus widely used for solid oral tablets.',
  },
  {
    id: 'q1_8',
    text: 'Which specific cytochrome P450 isoenzyme is primarily responsible for the metabolism of roughly 50% of clinically prescribed drugs?',
    type: 'mcq',
    category: 'Pharmacology',
    difficulty: 'medium',
    options: [
      'CYP1A2',
      'CYP2C9',
      'CYP2D6',
      'CYP3A4',
    ],
    correctOptionIndex: 3,
    answer: 'CYP3A4',
    explanation: 'CYP3A4 is the most abundant hepatic and intestinal CYP enzyme, metabolizing approximately half of marketed small-molecule drugs.',
  },
  {
    id: 'q1_9',
    text: 'Which Karl Fischer titration reagent component specifically reacts stoichiometrically with water in the presence of sulfur dioxide?',
    type: 'mcq',
    category: 'Pharmaceutical Analysis',
    difficulty: 'hard',
    options: [
      'Potassium Permanganate',
      'Iodine (I2)',
      'Silver Nitrate',
      'Ammonium Cerium Nitrate',
    ],
    correctOptionIndex: 1,
    answer: 'Iodine (I2)',
    explanation: 'In Karl Fischer moisture determination, I2 oxidizes SO2 in the presence of water, base (imidazole/pyridine), and methanol.',
  },
  {
    id: 'q1_10',
    text: 'Which tablet compression defect occurs when the upper or lower surface of a tablet separates horizontally from the main body?',
    type: 'mcq',
    category: 'Industrial Pharmacy',
    difficulty: 'easy',
    options: [
      'Mottling',
      'Picking',
      'Capping',
      'Sticking',
    ],
    correctOptionIndex: 2,
    answer: 'Capping',
    explanation: 'Capping refers to partial or complete separation of the top or bottom crown of a tablet due to air entrapment or elastic recovery.',
  },
  {
    id: 'q1_11',
    text: 'Which natural product class does Atropine, extracted from Atropa belladonna, chemically belong to?',
    type: 'mcq',
    category: 'Pharmacognosy',
    difficulty: 'easy',
    options: [
      'Indole Alkaloid',
      'Tropane Alkaloid',
      'Isoquinoline Alkaloid',
      'Purine Alkaloid',
    ],
    correctOptionIndex: 1,
    answer: 'Tropane Alkaloid',
    explanation: 'Atropine is a racemic mixture of d- and l-hyoscyamine belonging to the tropane alkaloid family.',
  },
  {
    id: 'q1_12',
    text: 'In ICH stability testing guidelines, which code specifically covers Stability Testing of New Drug Substances and Products?',
    type: 'mcq',
    category: 'Regulatory Affairs',
    difficulty: 'medium',
    options: [
      'ICH Q1A(R2)',
      'ICH Q2(R1)',
      'ICH Q6A',
      'ICH Q8(R2)',
    ],
    correctOptionIndex: 0,
    answer: 'ICH Q1A(R2)',
    explanation: 'ICH Q1A(R2) defines stability testing protocols (long-term, intermediate, accelerated) across climatic zones.',
  },
  {
    id: 'q1_13',
    text: 'Which neurotransmitter deficit in the nigrostriatal pathway is primarily responsible for the motor symptoms of Parkinson\'s disease?',
    type: 'mcq',
    category: 'Pharmacology',
    difficulty: 'easy',
    options: [
      'Serotonin',
      'Dopamine',
      'Norepinephrine',
      'Histamine',
    ],
    correctOptionIndex: 1,
    answer: 'Dopamine',
    explanation: 'Degeneration of dopaminergic neurons in the substantia nigra pars compacta leads to dopamine depletion in the striatum.',
  },
  {
    id: 'q1_14',
    text: 'Which law relates the absorbance of monochromatic light directly to the concentration of the absorbing species and path length?',
    type: 'mcq',
    category: 'Pharmaceutical Analysis',
    difficulty: 'easy',
    options: [
      'Fick\'s First Law',
      'Beer-Lambert Law',
      'Raoult\'s Law',
      'Stokes\' Law',
    ],
    correctOptionIndex: 1,
    answer: 'Beer-Lambert Law',
    explanation: 'A = ε * b * c, forming the quantitative foundation of UV-Visible spectrophotometric assays.',
  },
  {
    id: 'q1_15',
    text: 'What is the standard pore size of sterilizing-grade membrane filters used for aseptic filtration of heat-labile parenterals?',
    type: 'mcq',
    category: 'Pharmaceutical Microbiology',
    difficulty: 'easy',
    options: [
      '0.80 μm',
      '0.45 μm',
      '0.22 μm',
      '1.20 μm',
    ],
    correctOptionIndex: 2,
    answer: '0.22 μm',
    explanation: 'A 0.22 μm membrane filter retains Brevundimonas diminuta and ensures bacterial sterility for parenteral solutions.',
  },
  {
    id: 'q1_16',
    text: 'Which anti-arrhythmic drug belongs to Class III (potassium channel blocker) and contains iodine in its chemical structure?',
    type: 'mcq',
    category: 'Medicinal Chemistry',
    difficulty: 'medium',
    options: [
      'Lidocaine',
      'Propranolol',
      'Amiodarone',
      'Verapamil',
    ],
    correctOptionIndex: 2,
    answer: 'Amiodarone',
    explanation: 'Amiodarone is a benzofuran derivative containing ~37% iodine by weight and prolongs action potential duration.',
  },
  {
    id: 'q1_17',
    text: 'Which standard autoclave cycle (temperature and pressure) is recommended in pharmacopoeias for moist heat terminal sterilization?',
    type: 'mcq',
    category: 'Pharmaceutics',
    difficulty: 'easy',
    options: [
      '100°C at 5 psi for 15 min',
      '121°C at 15 psi for 15 min',
      '160°C at 0 psi for 120 min',
      '110°C at 10 psi for 10 min',
    ],
    correctOptionIndex: 1,
    answer: '121°C at 15 psi for 15 min',
    explanation: 'Saturated steam at 121°C (15 psi gauge pressure) for 15 minutes effectively destroys resistant bacterial endospores.',
  },
  {
    id: 'q1_18',
    text: 'Which biochemical test or assay is used pharmacopoeially to detect bacterial endotoxins in parenteral formulations?',
    type: 'mcq',
    category: 'Quality Control',
    difficulty: 'medium',
    options: [
      'Limulus Amebocyte Lysate (LAL) Test',
      'Ames Mutagenicity Test',
      'Chick Embryo Test',
      'Rideal-Walker Test',
    ],
    correctOptionIndex: 0,
    answer: 'Limulus Amebocyte Lysate (LAL) Test',
    explanation: 'The LAL test uses aqueous extract of horseshoe crab blood cells to detect nanogram quantities of Gram-negative endotoxins.',
  },
  {
    id: 'q1_19',
    text: 'Which heterocyclic ring is fused to a thiazolidine ring in the core chemical structure of Penicillins?',
    type: 'mcq',
    category: 'Medicinal Chemistry',
    difficulty: 'easy',
    options: [
      'Dihydrothiazine Ring',
      'Beta-Lactam Ring',
      'Imidazole Ring',
      'Pyrimidine Ring',
    ],
    correctOptionIndex: 1,
    answer: 'Beta-Lactam Ring',
    explanation: 'Penicillins share a 6-aminopenicillanic acid (6-APA) core consisting of a 4-membered beta-lactam ring fused to a thiazolidine ring.',
  },
  {
    id: 'q1_20',
    text: 'Which pharmacokinetic parameter represents the time required for the plasma drug concentration to decrease by 50% during elimination?',
    type: 'mcq',
    category: 'Biopharmaceutics',
    difficulty: 'easy',
    options: [
      'Volume of Distribution (Vd)',
      'Biological Half-Life (t1/2)',
      'Clearance (CL)',
      'Bioavailability (F)',
    ],
    correctOptionIndex: 1,
    answer: 'Biological Half-Life (t1/2)',
    explanation: 'For first-order kinetics, t1/2 = 0.693 / ke, guiding dosing interval selection to maintain steady-state therapeutic levels.',
  },
  {
    id: 'q1_21',
    text: 'Which specific antidote is administered clinically to reverse acute hepatotoxicity caused by Paracetamol (Acetaminophen) overdose?',
    type: 'mcq',
    category: 'Clinical Pharmacy',
    difficulty: 'easy',
    options: [
      'Flumazenil',
      'N-Acetylcysteine',
      'Atropine Sulfate',
      'Protamine Sulfate',
    ],
    correctOptionIndex: 1,
    answer: 'N-Acetylcysteine',
    explanation: 'N-Acetylcysteine replenishes hepatic glutathione stores, detoxifying the reactive metabolite NAPQI.',
  },
  {
    id: 'q1_22',
    text: 'Which size of hard gelatin capsule has the largest internal fill volume capacity among standard pharmaceutical capsule sizes?',
    type: 'mcq',
    category: 'Pharmaceutics',
    difficulty: 'medium',
    options: [
      'Size 0',
      'Size 000',
      'Size 2',
      'Size 5',
    ],
    correctOptionIndex: 1,
    answer: 'Size 000',
    explanation: 'Capsule sizes run inversely from 000 (largest, ~1.37 mL) down to 5 (smallest, ~0.13 mL).',
  },
  {
    id: 'q1_23',
    text: 'Which analytical technique separates ions based strictly on their mass-to-charge (m/z) ratio in the gas phase?',
    type: 'mcq',
    category: 'Pharmaceutical Analysis',
    difficulty: 'easy',
    options: [
      'Mass Spectrometry (MS)',
      'Infrared Spectroscopy (IR)',
      'Polarimetry',
      'Nephelometry',
    ],
    correctOptionIndex: 0,
    answer: 'Mass Spectrometry (MS)',
    explanation: 'Mass spectrometers ionize molecules and resolve fragment ions according to their m/z ratio for structural and quantitative analysis.',
  },
  {
    id: 'q1_24',
    text: 'Which herbal cardiac drug is derived from the dried leaves of Digitalis purpurea and inhibits the Na+/K+-ATPase pump?',
    type: 'mcq',
    category: 'Pharmacognosy',
    difficulty: 'easy',
    options: [
      'Vincristine',
      'Digoxin / Digitoxin',
      'Reserpine',
      'Quinine',
    ],
    correctOptionIndex: 1,
    answer: 'Digoxin / Digitoxin',
    explanation: 'Cardiac glycosides from Digitalis increase intracellular Ca2+ via Na+/K+-ATPase inhibition, producing a positive inotropic effect.',
  },
  {
    id: 'q1_25',
    text: 'Which Class of Biopharmaceutics Classification System (BCS) drugs exhibits both High Solubility and High Permeability?',
    type: 'mcq',
    category: 'Biopharmaceutics',
    difficulty: 'easy',
    options: [
      'BCS Class I',
      'BCS Class II',
      'BCS Class III',
      'BCS Class IV',
    ],
    correctOptionIndex: 0,
    answer: 'BCS Class I',
    explanation: 'BCS Class I drugs (e.g., propranolol, metoprolol) dissolve rapidly and absorb well, qualifying for biowaivers under strict criteria.',
  },
  {
    id: 'q1_26',
    text: 'Which vitamin deficiency is most commonly associated with prolonged Isoniazid antitubercular therapy unless supplemented?',
    type: 'mcq',
    category: 'Pharmacology',
    difficulty: 'medium',
    options: [
      'Vitamin B1 (Thiamine)',
      'Vitamin B6 (Pyridoxine)',
      'Vitamin B12 (Cyanocobalamin)',
      'Vitamin K',
    ],
    correctOptionIndex: 1,
    answer: 'Vitamin B6 (Pyridoxine)',
    explanation: 'Isoniazid forms hydrazones with pyridoxal phosphate, depleting Vitamin B6 and causing peripheral neuropathy.',
  },
  {
    id: 'q1_27',
    text: 'Which specific parameter measures the angle formed by a powder heap to evaluate powder flowability during tablet formulation?',
    type: 'mcq',
    category: 'Physical Pharmacy',
    difficulty: 'easy',
    options: [
      'Angle of Repose',
      'Carr\'s Index',
      'Hausner Ratio',
      'Contact Angle',
    ],
    correctOptionIndex: 0,
    answer: 'Angle of Repose',
    explanation: 'An angle of repose below 25–30° indicates excellent free-flowing powder behavior.',
  },
  {
    id: 'q1_28',
    text: 'Which preservative is most commonly known as Methylparaben in liquid oral and topical pharmaceutical formulations?',
    type: 'mcq',
    category: 'Formulation Science',
    difficulty: 'medium',
    options: [
      'Methyl 4-hydroxybenzoate',
      'Sodium Benzoate',
      'Benzalkonium Chloride',
      'Chlorocresol',
    ],
    correctOptionIndex: 0,
    answer: 'Methyl 4-hydroxybenzoate',
    explanation: 'Methylparaben (methyl p-hydroxybenzoate) is widely used with propylparaben for synergistic antimicrobial preservation.',
  },
  {
    id: 'q1_29',
    text: 'Which anticoagulant acts indirectly by potentiating Antithrombin III to inhibit thrombin (Factor IIa) and Factor Xa?',
    type: 'mcq',
    category: 'Pharmacology',
    difficulty: 'medium',
    options: [
      'Warfarin',
      'Heparin',
      'Clopidogrel',
      'Dabigatran',
    ],
    correctOptionIndex: 1,
    answer: 'Heparin',
    explanation: 'Unfractionated heparin binds Antithrombin III via a unique pentasaccharide sequence, accelerating inhibition of Factors Xa and IIa.',
  },
  {
    id: 'q1_30',
    text: 'Which regulatory form under India\'s Drugs and Cosmetics Act is issued for a license to manufacture drugs specified in Schedule C and C(1)?',
    type: 'mcq',
    category: 'Jurisprudence & Regulatory',
    difficulty: 'hard',
    options: [
      'Form 25',
      'Form 28',
      'Form 20',
      'Form 19',
    ],
    correctOptionIndex: 1,
    answer: 'Form 28',
    explanation: 'Form 28 grants manufacturing licenses for biological and special products listed under Schedule C and C(1), whereas Form 25 covers non-Schedule C/C(1) drugs.',
  },
];

/**
 * Ensures Round I (Basic Round) has exactly 5 questions per competing team
 * so every team faces 5 horizontal questions (not in one lot like Round 3).
 */
export function syncRoundOneQuestions(round: Round, teamCount: number): Round {
  const safeTeams = Math.max(1, teamCount);
  const targetCount = safeTeams * 5;
  const current = [...(round.questions || [])];

  if (current.length < targetCount) {
    const existingIds = new Set(current.map((q) => q.id));
    const existingTexts = new Set(current.map((q) => q.text.trim().toLowerCase()));

    for (const candidate of ROUND_1_MCQ_POOL) {
      if (current.length >= targetCount) break;
      if (!existingIds.has(candidate.id) && !existingTexts.has(candidate.text.trim().toLowerCase())) {
        current.push(JSON.parse(JSON.stringify(candidate)));
        existingIds.add(candidate.id);
        existingTexts.add(candidate.text.trim().toLowerCase());
      }
    }

    // Fallback if competition has >6 teams (>30 questions needed)
    let extraIdx = 0;
    while (current.length < targetCount) {
      const template = ROUND_1_MCQ_POOL[extraIdx % ROUND_1_MCQ_POOL.length];
      current.push({
        ...JSON.parse(JSON.stringify(template)),
        id: `q1_extra_${current.length + 1}_${Date.now()}`,
      });
      extraIdx += 1;
    }
  } else if (current.length > targetCount) {
    current.length = targetCount;
  }

  return {
    ...round,
    questions: current,
    maxMarksCalculated: targetCount * (round.scoring?.marksCorrect || 10),
  };
}

// 30 distinct short-answer Rapid Fire questions (supports up to 6 teams × 5 distinct questions each)
export const ROUND_2_RAPID_POOL: Question[] = [
  {
    id: 'q2_1',
    text: 'What is the natural source alkaloid of the cardiac glycoside Digoxin?',
    type: 'verbal',
    category: 'Pharmacognosy',
    difficulty: 'easy',
    answer: 'Digitalis purpurea (or Digitalis lanata / Foxglove)',
    explanation: 'Extracted from the leaves of foxglove plant, acts as Na+/K+ ATPase inhibitor.',
  },
  {
    id: 'q2_2',
    text: 'What is the official temperature range for "Cold Storage" specified in the Indian Pharmacopoeia?',
    type: 'verbal',
    category: 'Pharmaceutics',
    difficulty: 'medium',
    answer: '2°C to 8°C',
    explanation: 'IP defines Cold as 2°C to 8°C. Cool is 8°C to 25°C. Room temperature is 20°C to 30°C.',
  },
  {
    id: 'q2_3',
    text: 'Name the active metabolite formed when codeine undergoes O-demethylation via CYP2D6.',
    type: 'verbal',
    category: 'Medicinal Chemistry',
    difficulty: 'medium',
    answer: 'Morphine',
    explanation: 'Codeine (methylmorphine) is O-demethylated by CYP2D6 to form morphine, providing analgesic action.',
  },
  {
    id: 'q2_4',
    text: 'Which excipient class does Croscarmellose Sodium belong to in tablet manufacturing?',
    type: 'verbal',
    category: 'Formulation Science',
    difficulty: 'easy',
    answer: 'Superdisintegrant',
    explanation: 'Cross-linked sodium carboxymethylcellulose acts as a superdisintegrant via rapid swelling and water wicking.',
  },
  {
    id: 'q2_5',
    text: 'What term describes an adverse reaction caused directly by medical examination or drug treatment?',
    type: 'verbal',
    category: 'Clinical Pharmacy',
    difficulty: 'medium',
    answer: 'Iatrogenic (Iatrogenesis)',
    explanation: 'Iatrogenic conditions are inadvertently induced by a physician, surgeon, or pharmaceutical treatment.',
  },
  {
    id: 'q2_6',
    text: 'Which vitamin deficiency causes Wernicke-Korsakoff syndrome in chronic alcoholics?',
    type: 'verbal',
    category: 'Clinical Pharmacology',
    difficulty: 'easy',
    answer: 'Vitamin B1 (Thiamine)',
    explanation: 'Thiamine deficiency impairs cerebral energy metabolism leading to encephalopathy and psychosis.',
  },
  {
    id: 'q2_7',
    text: 'What is the specific antidote used in the emergency management of heparin overdose?',
    type: 'verbal',
    category: 'Pharmacology',
    difficulty: 'easy',
    answer: 'Protamine Sulfate',
    explanation: 'Positively charged protamine sulfate binds electrostatically to negatively charged heparin to neutralize anticoagulation.',
  },
  {
    id: 'q2_8',
    text: 'Which enzyme catalyzes the rate-limiting step of cholesterol biosynthesis inhibited by statins?',
    type: 'verbal',
    category: 'Medicinal Chemistry',
    difficulty: 'easy',
    answer: 'HMG-CoA Reductase',
    explanation: 'Statins competitively inhibit 3-hydroxy-3-methylglutaryl-coenzyme A reductase in hepatocytes.',
  },
  {
    id: 'q2_9',
    text: 'Which type of glass is also known as "Neutral Glass" or Borosilicate glass in parenteral packaging?',
    type: 'verbal',
    category: 'Pharmaceutics',
    difficulty: 'medium',
    answer: 'Type I Glass',
    explanation: 'USP/IP Type I borosilicate glass is highly resistant to hydrolytic attack and suitable for buffered or unbuffered parenterals.',
  },
  {
    id: 'q2_10',
    text: 'Name the biological source of the antihypertensive indole alkaloid Reserpine.',
    type: 'verbal',
    category: 'Pharmacognosy',
    difficulty: 'medium',
    answer: 'Rauwolfia serpentina (Sarpagandha)',
    explanation: 'Obtained from dried roots of Rauwolfia serpentina; depletes vesicular catecholamines and serotonin.',
  },
  {
    id: 'q2_11',
    text: 'Which chemical reagent is used to detect primary aromatic amines via diazotization-coupling titration?',
    type: 'verbal',
    category: 'Pharmaceutical Analysis',
    difficulty: 'medium',
    answer: 'Sodium Nitrite (NaNO2)',
    explanation: 'Sulfonamides and primary aromatic amines react with nitrous acid generated from NaNO2/HCl to form diazonium salts.',
  },
  {
    id: 'q2_12',
    text: 'Which Phase II drug metabolism conjugation reaction is deficient in neonates causing Gray Baby Syndrome with chloramphenicol?',
    type: 'verbal',
    category: 'Biopharmaceutics',
    difficulty: 'medium',
    answer: 'Glucuronidation',
    explanation: 'Immature hepatic UDP-glucuronosyltransferase in neonates prevents clearance of chloramphenicol.',
  },
  {
    id: 'q2_13',
    text: 'What is the HLB value range typically required for Oil-in-Water (O/W) emulsifying agents?',
    type: 'verbal',
    category: 'Physical Pharmacy',
    difficulty: 'easy',
    answer: '8 to 16 (or 8–18)',
    explanation: 'Griffin HLB scale assigns 3–6 to W/O emulsifiers and 8–16 to O/W emulsifiers.',
  },
  {
    id: 'q2_14',
    text: 'Name the Schedule under the Drugs and Cosmetics Rules that covers "List of Prescription Drugs" sold strictly against an RMP prescription.',
    type: 'verbal',
    category: 'Pharmaceutical Jurisprudence',
    difficulty: 'easy',
    answer: 'Schedule H',
    explanation: 'Schedule H drugs bear the "Rx" warning and require a Registered Medical Practitioner prescription.',
  },
  {
    id: 'q2_15',
    text: 'Which anti-tuberculosis drug notoriously causes red-orange discoloration of urine, sweat, and tears?',
    type: 'verbal',
    category: 'Pharmacology',
    difficulty: 'easy',
    answer: 'Rifampicin (Rifampin)',
    explanation: 'Rifampicin is an RNA polymerase inhibitor whose metabolites impart harmless orange-red color to body fluids.',
  },
  {
    id: 'q2_16',
    text: 'Which opioid antagonist is rapidly administered intranasally or intravenously to reverse respiratory depression?',
    type: 'verbal',
    category: 'Clinical Toxicology',
    difficulty: 'easy',
    answer: 'Naloxone',
    explanation: 'Naloxone is a competitive mu-opioid receptor antagonist with rapid onset for overdose reversal.',
  },
  {
    id: 'q2_17',
    text: 'What tablet coating defect manifests as microscopic cracks or peeling on the surface film?',
    type: 'verbal',
    category: 'Industrial Pharmacy',
    difficulty: 'medium',
    answer: 'Cracking (or Peeling)',
    explanation: 'Cracking occurs when internal stresses in the polymer film exceed its tensile strength.',
  },
  {
    id: 'q2_18',
    text: 'Which specific chromatographic detector responds to compounds that absorb light at selectable UV wavelengths?',
    type: 'verbal',
    category: 'Pharmaceutical Analysis',
    difficulty: 'easy',
    answer: 'UV-Visible (or PDA / Photodiode Array) Detector',
    explanation: 'UV/PDA detectors are the most widely used HPLC detectors for chromophore-containing pharmaceuticals.',
  },
  {
    id: 'q2_19',
    text: 'Name the first-line loop diuretic that inhibits the Na+-K+-2Cl- cotransporter in the thick ascending limb of Henle.',
    type: 'verbal',
    category: 'Pharmacology',
    difficulty: 'easy',
    answer: 'Furosemide',
    explanation: 'Furosemide is a high-ceiling loop diuretic acting on the NKCC2 symporter.',
  },
  {
    id: 'q2_20',
    text: 'What equation describes the diffusion rate of a drug across a biological membrane under steady-state concentration gradients?',
    type: 'verbal',
    category: 'Biopharmaceutics',
    difficulty: 'medium',
    answer: "Fick's First Law (of Diffusion)",
    explanation: "Fick's first law relates diffusive flux to the concentration gradient and membrane permeability.",
  },
  {
    id: 'q2_21',
    text: 'Which beta-lactamase inhibitor is co-formulated with Amoxicillin in Augmentin?',
    type: 'verbal',
    category: 'Medicinal Chemistry',
    difficulty: 'easy',
    answer: 'Clavulanic Acid (Clavulanate)',
    explanation: 'Clavulanic acid acts as a suicide inhibitor of bacterial beta-lactamases, protecting amoxicillin.',
  },
  {
    id: 'q2_22',
    text: 'What sterile filtration integrity test determines the minimum pressure needed to force gas through the largest membrane pore?',
    type: 'verbal',
    category: 'Pharmaceutical Microbiology',
    difficulty: 'hard',
    answer: 'Bubble Point Test',
    explanation: 'The bubble point pressure is inversely proportional to the largest pore diameter of a wetted sterilizing filter.',
  },
  {
    id: 'q2_23',
    text: 'Which cardiac glycoside toxicity antidote uses sheep-derived antigen-binding antibody fragments?',
    type: 'verbal',
    category: 'Clinical Toxicology',
    difficulty: 'hard',
    answer: 'Digoxin Immune Fab (Digibind / DigiFab)',
    explanation: 'Digoxin immune Fab binds free serum digoxin molecules for rapid renal clearance.',
  },
  {
    id: 'q2_24',
    text: 'What is the common name of the enteric coating polymer Cellulose Acetate Phthalate?',
    type: 'verbal',
    category: 'Formulation Science',
    difficulty: 'medium',
    answer: 'CAP (Cellacefate)',
    explanation: 'CAP remains insoluble in acidic gastric pH and dissolves above pH 6.0 in the small intestine.',
  },
  {
    id: 'q2_25',
    text: 'Which prostaglandin analogue is widely formulated in ophthalmic drops to reduce intraocular pressure in glaucoma?',
    type: 'verbal',
    category: 'Pharmacology',
    difficulty: 'medium',
    answer: 'Latanoprost (or Travoprost / Bimatoprost)',
    explanation: 'PGF2alpha analogues increase uveoscleral outflow of aqueous humor.',
  },
  {
    id: 'q2_26',
    text: 'What term refers to the ratio of LD50 to ED50 used to express a drug’s relative safety margin?',
    type: 'verbal',
    category: 'Pharmacology',
    difficulty: 'easy',
    answer: 'Therapeutic Index (TI)',
    explanation: 'TI = LD50 / ED50 in animal studies (or TD50 / ED50 clinically); higher values indicate wider safety margins.',
  },
  {
    id: 'q2_27',
    text: 'Which color test is classically used for the identification of Tropane Alkaloids such as Atropine?',
    type: 'verbal',
    category: 'Pharmacognosy',
    difficulty: 'medium',
    answer: 'Vitali-Morin Reaction',
    explanation: 'Fuming nitric acid followed by alcoholic KOH yields a characteristic violet color with tropane esters.',
  },
  {
    id: 'q2_28',
    text: 'What ICH guideline series specifically governs Analytical Method Validation?',
    type: 'verbal',
    category: 'Regulatory Affairs',
    difficulty: 'medium',
    answer: 'ICH Q2 (Q2(R1) / Q2(R2))',
    explanation: 'ICH Q2 defines specificity, linearity, accuracy, precision, LOD, LOQ, and robustness.',
  },
  {
    id: 'q2_29',
    text: 'Which monoclonal antibody targets HER2 receptors in HER2-positive breast cancer?',
    type: 'verbal',
    category: 'Biotechnology & Oncology',
    difficulty: 'easy',
    answer: 'Trastuzumab (Herceptin)',
    explanation: 'Trastuzumab binds the extracellular domain of the human epidermal growth factor receptor 2 (HER2).',
  },
  {
    id: 'q2_30',
    text: 'What unit expresses the biological potency of Heparin Sodium in pharmacopoeial assays?',
    type: 'verbal',
    category: 'Pharmaceutical Analysis',
    difficulty: 'medium',
    answer: 'International Units (IU) or USP Units',
    explanation: 'Heparin potency is standardized in IU/mg rather than simple gravimetric mass alone.',
  },
];

/**
 * Ensures Round II (Rapid Fire Round) has 5 distinct questions per competing team
 * so every team receives its own separate 5-question lot.
 */
export function syncRoundTwoQuestions(round: Round, teamCount: number): Round {
  const safeTeams = Math.max(1, teamCount);
  const targetCount = safeTeams * 5;
  const current = [...(round.questions || [])];

  if (current.length < targetCount) {
    const existingIds = new Set(current.map((q) => q.id));
    const existingTexts = new Set(current.map((q) => q.text.trim().toLowerCase()));

    for (const candidate of ROUND_2_RAPID_POOL) {
      if (current.length >= targetCount) break;
      if (!existingIds.has(candidate.id) && !existingTexts.has(candidate.text.trim().toLowerCase())) {
        current.push(JSON.parse(JSON.stringify(candidate)));
        existingIds.add(candidate.id);
        existingTexts.add(candidate.text.trim().toLowerCase());
      }
    }

    let extraIdx = 0;
    while (current.length < targetCount) {
      const template = ROUND_2_RAPID_POOL[extraIdx % ROUND_2_RAPID_POOL.length];
      current.push({
        ...JSON.parse(JSON.stringify(template)),
        id: `q2_extra_${current.length + 1}_${Date.now()}`,
      });
      extraIdx += 1;
    }
  } else if (current.length > targetCount) {
    current.length = targetCount;
  }

  return {
    ...round,
    questions: current,
    maxMarksCalculated: targetCount * (round.scoring?.marksCorrect || 10),
  };
}

export const DEFAULT_ROUNDS: Round[] = [
  // ROUND I – BASIC ROUND (5 questions per competing team, rotated horizontally)
  {
    id: 'round_1_basic',
    roundNumber: 1,
    name: 'Round I – Basic Round',
    type: 'basic',
    description: 'Fundamental subject knowledge questions presented horizontally: 5 questions per team across 5 rotation cycles (not in one lot).',
    instructionsForQuizmaster: `1. Welcome participants and audience to Round I – Basic Multiple Choice Round.
2. Each competing team faces a total of 5 questions, asked horizontally one by one across all teams (Cycle 1 through Cycle 5 — NOT in one lot like Round 3).
3. Initially, only the question text is displayed on stage while the Quizmaster dictates it.
4. Click "Reveal Options & Start Timer" to display all 4 options and start the 30-second countdown.
5. Listen to the participant's verbal answer, then click that option on your console.
6. Scoring: +10 marks for correct answer, 0 marks for incorrect or timeout.`,
    rulesSummary: '5 Questions Per Team (Horizontal Rotation) • 4 MCQ Options • 30s Timer • +10 Correct • 0 Incorrect',
    timing: {
      durationSeconds: 30,
      timerType: 'per_question',
    },
    scoring: {
      marksCorrect: 10,
      marksIncorrect: 0,
      marksUnanswered: 0,
      allowPass: false,
    },
    presentationOrder: 'horizontal',
    responseMode: 'verbal',
    isCompleted: false,
    maxMarksCalculated: DEFAULT_TEAMS.length * 5 * 10,
    questions: ROUND_1_MCQ_POOL.slice(0, DEFAULT_TEAMS.length * 5),
  },

  // ROUND II – RAPID FIRE ROUND (5 distinct questions per competing team)
  {
    id: 'round_2_rapid',
    roundNumber: 2,
    name: 'Round II – Rapid Fire Round',
    type: 'rapid_fire',
    description: 'High-speed round where each team faces a distinct set of 5 short-answer questions within 90 seconds.',
    instructionsForQuizmaster: `1. Each competing team receives its own distinct set of 5 questions and 90 SECONDS on the clock.
2. Click "Start" (beside Reveal Answer) to begin the team's 90s timer and display Q1 — the button converts to "Next Question".
3. Answers should be strictly 1 or 2 words. Award +10, 0, or Pass (0) — or click "Next Question" to advance.
4. Once all 5 questions of the team are completed (or time expires), the timer stops automatically.
5. Click "Next Team" to switch to the next team's distinct 5-question lot, reset the timer to 90s, and convert the button back to "Start".`,
    rulesSummary: '5 Distinct Qs Per Team • 90s Clock Per Team • Timer Stops After 5 Qs • +10 / 0 marks',
    timing: {
      durationSeconds: 90,
      timerType: 'per_participant_total',
    },
    scoring: {
      marksCorrect: 10,
      marksIncorrect: 0,
      marksUnanswered: 0,
      allowPass: true,
    },
    presentationOrder: 'consecutive',
    responseMode: 'verbal',
    isCompleted: false,
    maxMarksCalculated: DEFAULT_TEAMS.length * 5 * 10,
    questions: ROUND_2_RAPID_POOL.slice(0, DEFAULT_TEAMS.length * 5),
  },

  // ROUND III – STRAIGHTFORWARD ROUND
  {
    id: 'round_3_straight',
    roundNumber: 3,
    name: 'Round III – Straightforward Round',
    type: 'straightforward',
    description: 'Direct subject knowledge questions asked consecutively to each team with 30 seconds per question.',
    instructionsForQuizmaster: `1. Announce Round III – Straightforward Multiple Choice Round.
2. In this round, all 5 questions are asked one after the other in one lot to the selected team.
3. Initially, only the question text is displayed on stage while the Quizmaster dictates it.
4. Click "Reveal Options & Start Timer" to reveal all 4 options and start the 30-second timer.
5. Listen to the participant's verbal answer, then select that option on your console.
6. Scoring: +10 marks for correct, 0 marks for incorrect or timeout. Correct answer turns green; incorrect choice turns red.`,
    rulesSummary: 'Multiple Choice (4 options) • 5 Questions in One Lot for the Team • 30s per question • +10 Correct • 0 Incorrect',
    timing: {
      durationSeconds: 30,
      timerType: 'per_question',
    },
    scoring: {
      marksCorrect: 10,
      marksIncorrect: 0,
      marksUnanswered: 0,
      allowPass: false,
    },
    presentationOrder: 'consecutive',
    responseMode: 'verbal',
    isCompleted: false,
    maxMarksCalculated: 50,
    questions: [
      {
        id: 'q3_1',
        text: 'What is the Biopharmaceutics Classification System (BCS) class of a drug with High Solubility and Low Permeability?',
        type: 'mcq',
        category: 'Biopharmaceutics',
        difficulty: 'easy',
        options: [
          'BCS Class I (High Sol, High Perm)',
          'BCS Class II (Low Sol, High Perm)',
          'BCS Class III (High Sol, Low Perm)',
          'BCS Class IV (Low Sol, Low Perm)',
        ],
        correctOptionIndex: 2,
        answer: 'Class III',
        explanation: 'Class I = High Sol/High Perm; Class II = Low Sol/High Perm; Class III = High Sol/Low Perm; Class IV = Low Sol/Low Perm.',
      },
      {
        id: 'q3_2',
        text: 'Which specific enzyme is selectively inhibited by Methotrexate in the folate metabolic pathway?',
        type: 'mcq',
        category: 'Medicinal Chemistry',
        difficulty: 'medium',
        options: [
          'Dihydrofolate Reductase (DHFR)',
          'Thymidylate Synthase',
          'Ribonucleotide Reductase',
          'DNA Polymerase Alpha',
        ],
        correctOptionIndex: 0,
        answer: 'Dihydrofolate Reductase (DHFR)',
        explanation: 'Methotrexate competitively inhibits DHFR, preventing tetrahydrofolate formation and thymidylate synthesis.',
      },
      {
        id: 'q3_3',
        text: 'In parenteral manufacturing, which pyrogen test uses the amoebocyte lysate extracted from the horseshoe crab?',
        type: 'mcq',
        category: 'Quality Assurance',
        difficulty: 'easy',
        options: [
          'Rabbit Pyrogen Test',
          'Bacterial Endotoxin Test (BET / LAL Test)',
          'Monocyte Activation Test (MAT)',
          'Membrane Filtration Bioburden Assay',
        ],
        correctOptionIndex: 1,
        answer: 'Bacterial Endotoxin Test (BET) / LAL Test (Limulus Amebocyte Lysate)',
        explanation: 'LAL test detects bacterial endotoxins from gram-negative bacteria via gel clot formation with Limulus polyphemus lysate.',
      },
      {
        id: 'q3_4',
        text: 'What is the term for the irreversible separation of a creamed emulsion into two distinct layers?',
        type: 'mcq',
        category: 'Pharmaceutics',
        difficulty: 'medium',
        options: [
          'Flocculation',
          'Creaming',
          'Coalescence / Breaking (Cracking)',
          'Phase Inversion',
        ],
        correctOptionIndex: 2,
        answer: 'Breaking (or Cracking)',
        explanation: 'Creaming is reversible by shaking; Breaking (cracking) is irreversible destruction of the protective interfacial film.',
      },
      {
        id: 'q3_5',
        text: 'Which receptor subtype does the antiemetic drug Ondansetron selectively antagonize?',
        type: 'mcq',
        category: 'Pharmacology',
        difficulty: 'easy',
        options: [
          'Dopamine D2 Receptor',
          'Histamine H1 Receptor',
          'Serotonin 5-HT3 Receptor',
          'Neurokinin-1 (NK1) Receptor',
        ],
        correctOptionIndex: 2,
        answer: '5-HT3 Receptor (Serotonin 5-HT3)',
        explanation: 'Ondansetron is a selective 5-HT3 antagonist blocking vagal afferents in the gastrointestinal tract and chemoreceptor trigger zone.',
      },
    ],
  },

  // ROUND IV – VISUAL ROUND
  {
    id: 'round_4_visual',
    roundNumber: 4,
    name: 'Round IV – Visual Round',
    type: 'visual',
    description: 'High-contrast visual identification round containing instruments, dosage forms, molecular structures, and scientist portraits.',
    instructionsForQuizmaster: `1. Announce the commencement of Round IV – Visual Round.
2. Ensure the visual image is displayed clearly on the main projector screen.
3. Emphasize the scoring rule: Correct answer awards +10 marks; INCORRECT answer carries a penalty of -5 marks!
4. Unanswered questions carry 0 marks.
5. Give the team 30 seconds to analyze the visual before submitting their verbal answer.`,
    rulesSummary: '4 Visual Questions • 30s per question • +10 for Correct • -5 for Incorrect (Negative Marking!)',
    timing: {
      durationSeconds: 30,
      timerType: 'per_question',
    },
    scoring: {
      marksCorrect: 10,
      marksIncorrect: -5,
      marksUnanswered: 0,
      allowPass: true,
    },
    presentationOrder: 'horizontal',
    responseMode: 'verbal',
    isCompleted: false,
    maxMarksCalculated: 40,
    questions: [
      {
        id: 'q4_1',
        text: 'Identify this standard pharmacopoeial laboratory apparatus used for evaluating the release rate of active pharmaceutical ingredients from solid oral dosage forms.',
        type: 'visual',
        category: 'Pharmaceutical Instrumentation',
        difficulty: 'medium',
        mediaUrl: VISUAL_ASSETS.dissolutionTester,
        mediaType: 'image',
        answer: 'USP Dissolution Test Apparatus (Type II - Paddle Apparatus)',
        explanation: 'USP Type I is Basket; USP Type II is Paddle. It simulates in vivo gastrointestinal dissolution conditions.',
      },
      {
        id: 'q4_2',
        text: 'Identify the essential 4-membered cyclic amide ring highlighted in this chemical skeleton, which is responsible for inhibiting bacterial transpeptidase enzymes.',
        type: 'visual',
        category: 'Medicinal Chemistry',
        difficulty: 'medium',
        mediaUrl: VISUAL_ASSETS.betaLactamRing,
        mediaType: 'image',
        answer: 'Beta-Lactam Ring (2-Azetidinone ring)',
        explanation: 'The beta-lactam ring is the pharmacophore of penicillins, cephalosporins, carbapenems, and monobactams.',
      },
      {
        id: 'q4_3',
        text: 'Identify this specialized nano-sized vesicular drug delivery system composed of concentric phospholipid bilayers enclosing an aqueous core.',
        type: 'visual',
        category: 'Novel Drug Delivery Systems',
        difficulty: 'medium',
        mediaUrl: VISUAL_ASSETS.liposomeStructure,
        mediaType: 'image',
        answer: 'Liposome (or Lipid Bilayer Nanovesicle)',
        explanation: 'Discovered by Alec Bangham in 1961, liposomes encapsulate both water-soluble drugs in the core and lipid-soluble drugs in the bilayer.',
      },
      {
        id: 'q4_4',
        text: 'Identify this British bacteriologist and Nobel Prize laureate who accidentally discovered the first miraculous antibiotic in 1928.',
        type: 'visual',
        category: 'History of Pharmacy',
        difficulty: 'easy',
        mediaUrl: VISUAL_ASSETS.alexanderFleming,
        mediaType: 'image',
        answer: 'Sir Alexander Fleming',
        explanation: 'Fleming observed a zone of inhibition around Penicillium notatum mold on a staphylococci culture plate at St Mary Hospital, London.',
      },
    ],
  },

  // ROUND V – CURRENT AFFAIRS IN PHARMACEUTICAL SCIENCES
  {
    id: 'round_5_current',
    roundNumber: 5,
    name: 'Round V – Current Affairs in Pharmaceutical Sciences',
    type: 'current_affairs',
    description: 'Recent clinical trials, regulatory approvals, CDSCO updates, novel drug delivery breakthroughs, and WHO pharmacovigilance alerts.',
    instructionsForQuizmaster: `1. Announce Round V – Current Affairs in Pharmaceutical Sciences.
2. Questions are asked horizontally: Question 1 to Team Alpha, Question 2 to Team Beta, Question 3 to Team Gamma, Question 4 to Team Delta, Question 5 to Team Alpha.
3. Initially, only the question text is displayed on stage while the Quizmaster dictates it.
4. Click "Reveal Options & Start Timer" to reveal all 4 options and start the 30-second timer.
5. Listen to the participant's verbal answer, then select that option on your console.
6. Scoring: +10 marks for correct, 0 marks for incorrect or timeout. Correct option turns green; selected incorrect option turns red.`,
    rulesSummary: 'Multiple Choice (4 options) • Question dictated first • Options reveal triggers 30s timer • +10 Correct • 0 Incorrect',
    timing: {
      durationSeconds: 30,
      timerType: 'per_question',
    },
    scoring: {
      marksCorrect: 10,
      marksIncorrect: 0,
      marksUnanswered: 0,
      allowPass: false,
    },
    presentationOrder: 'horizontal',
    responseMode: 'verbal',
    isCompleted: false,
    maxMarksCalculated: 50,
    questions: [
      {
        id: 'q5_1',
        text: 'Which novel dual GLP-1 and GIP receptor agonist medication developed by Eli Lilly received landmark regulatory approval for both Type 2 diabetes and chronic weight management?',
        type: 'mcq',
        category: 'Recent Drug Approvals',
        difficulty: 'medium',
        options: [
          'Semaglutide (Ozempic / Wegovy)',
          'Tirzepatide (Mounjaro / Zepbound)',
          'Dulaglutide (Trulicity)',
          'Liraglutide (Victoza / Saxenda)',
        ],
        correctOptionIndex: 1,
        answer: 'Tirzepatide (Brand names: Mounjaro / Zepbound)',
        explanation: 'Tirzepatide is a first-in-class dual glucose-dependent insulinotropic polypeptide (GIP) and glucagon-like peptide-1 (GLP-1) receptor agonist.',
        sourceUrl: 'https://www.fda.gov/drugs/news-events-human-drugs',
        publicationDate: '2023-11-08',
      },
      {
        id: 'q5_2',
        text: 'What landmark gene-editing therapy based on CRISPR-Cas9 technology was granted the world’s first regulatory approvals by the UK MHRA and US FDA for sickle cell disease and transfusion-dependent beta-thalassemia?',
        type: 'mcq',
        category: 'Biotechnology & Gene Therapy',
        difficulty: 'medium',
        options: [
          'Zolgensma (Onasemnogene abeparvovec)',
          'Luxturna (Voretigene neparvovec)',
          'Casgevy (Exagamglogene autotemcel / Exa-cel)',
          'Kymriah (Tisagenlecleucel)',
        ],
        correctOptionIndex: 2,
        answer: 'Casgevy (Exagamglogene autotemcel / Exa-cel)',
        explanation: 'Casgevy edits the BCL11A gene in autologous CD34+ hematopoietic stem cells to reactivate fetal hemoglobin (HbF) production.',
        sourceUrl: 'https://www.who.int/news/item',
        publicationDate: '2023-12-08',
      },
      {
        id: 'q5_3',
        text: 'In 2024, the Indian Central Drugs Standard Control Organisation (CDSCO) made it mandatory for pharmaceutical companies to comply with Revised Schedule M. What international regulatory standard was this harmonized with?',
        type: 'mcq',
        category: 'Indian Regulatory Affairs',
        difficulty: 'hard',
        options: [
          'WHO-GMP (World Health Organization Good Manufacturing Practices)',
          'ICH Q10 Pharmaceutical Quality System',
          'ISO 9001 Quality Management System',
          'US FDA 21 CFR Part 211 GMP',
        ],
        correctOptionIndex: 0,
        answer: 'WHO-GMP (World Health Organization Good Manufacturing Practices)',
        explanation: 'The revised Schedule M introduces pharmaceutical quality systems (PQS), quality risk management (QRM), product quality reviews (PQR), and computerized systems validation.',
        sourceUrl: 'https://cdsco.gov.in/opencms/opencms/en/Notifications/',
        publicationDate: '2024-01-06',
      },
      {
        id: 'q5_4',
        text: 'Which breakthrough monoclonal antibody targeting amyloid-beta plaque aggregates received full FDA traditional approval for the treatment of early Alzheimer’s disease in July 2023?',
        type: 'mcq',
        category: 'Clinical Neuro-Pharmacology',
        difficulty: 'medium',
        options: [
          'Aducanumab (Aduhelm)',
          'Lecanemab (Leqembi)',
          'Donanemab (Kisunla)',
          'Gantenerumab',
        ],
        correctOptionIndex: 1,
        answer: 'Lecanemab (Leqembi)',
        explanation: 'Lecanemab binds with high affinity to soluble amyloid-beta protofibrils, demonstrating a 27% reduction in clinical cognitive decline in the Phase 3 Clarity AD trial.',
        sourceUrl: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2212948',
        publicationDate: '2023-07-06',
      },
      {
        id: 'q5_5',
        text: 'Which statutory body functions as the National Coordination Centre for the Pharmacovigilance Programme of India (PvPI) to monitor Adverse Drug Reactions?',
        type: 'mcq',
        category: 'Pharmacovigilance & Drug Safety',
        difficulty: 'medium',
        options: [
          'Indian Pharmacopoeia Commission (IPC), Ghaziabad',
          'National Institute of Biologicals (NIB), Noida',
          'Pharmacy Council of India (PCI), New Delhi',
          'Indian Council of Medical Research (ICMR)',
        ],
        correctOptionIndex: 0,
        answer: 'Indian Pharmacopoeia Commission (IPC), Ghaziabad',
        explanation: 'The IPC operates as the NCC for PvPI, collecting adverse drug event reports and reporting to the WHO Uppsala Monitoring Centre.',
        sourceUrl: 'https://ipc.gov.in/pvpi.html',
        publicationDate: '2024-01-15',
      },
    ],
  },

  // ROUND VI – BUZZER ROUND: FASTEST FINGER FIRST
  {
    id: 'round_6_buzzer',
    roundNumber: 6,
    name: 'Round VI – Buzzer Round (Fastest Finger First)',
    type: 'buzzer',
    description: 'High-adrenaline buzzer round! When the Quizmaster activates the buzzer, the first team to press on their mobile phone gets the answer opportunity.',
    instructionsForQuizmaster: `1. Display the question clearly on the main projector screen.
2. Read the question aloud to all participants.
3. Click "Activate Buzzer". The main screen and all participant mobile phones will immediately illuminate and vibrate.
4. The system automatically records the authoritative first press with millisecond precision and establishes the response queue.
5. Invite Team #1 to answer verbally within 10 seconds.
6. If correct: click "Correct (+10)".
7. If incorrect: click "Incorrect (-5)". If enabled, the next team in the queue automatically gets the chance!`,
    rulesSummary: 'Open to All Teams • Synchronized Mobile Buzzer • +10 Correct • -5 Incorrect • Passing Queue Enabled',
    timing: {
      durationSeconds: 15,
      timerType: 'per_question',
    },
    scoring: {
      marksCorrect: 10,
      marksIncorrect: -5,
      marksUnanswered: 0,
      allowPass: true,
      passToNextInQueue: true,
    },
    presentationOrder: 'buzzer_open',
    responseMode: 'mobile_buzzer',
    isCompleted: false,
    maxMarksCalculated: 50,
    questions: [
      {
        id: 'q6_1',
        text: 'Which physiological barrier in the central nervous system is primarily formed by brain capillary endothelial cells connected by continuous high-resistance tight junctions?',
        type: 'verbal',
        category: 'Pharmacology & Physiology',
        difficulty: 'medium',
        answer: 'Blood-Brain Barrier (BBB)',
        explanation: 'The BBB restricts the entry of hydrophilic substances and large molecules, regulated by astrocytic end-feet and pericytes.',
      },
      {
        id: 'q6_2',
        text: 'What is the generic international non-proprietary name (INN) of the widely prescribed analgesic and antipyretic drug chemically known as N-(4-hydroxyphenyl)acetamide?',
        type: 'verbal',
        category: 'Pharmaceutical Chemistry',
        difficulty: 'easy',
        answer: 'Paracetamol (Acetaminophen)',
        explanation: 'Paracetamol acts primarily through central inhibition of cyclooxygenase enzymes (COX-1/COX-2/COX-3) and indirect activation of cannabinoid CB1 receptors.',
      },
      {
        id: 'q6_3',
        text: 'Which statistical parameter in bioequivalence testing must fall within the 90% confidence interval of 80.00% to 125.00% for Cmax and AUC ratios?',
        type: 'verbal',
        category: 'Biopharmaceutics & Regulatory',
        difficulty: 'hard',
        answer: 'Bioequivalence Ratio (Geometric Mean Ratio / Two One-Sided Tests)',
        explanation: 'US FDA and CDSCO mandate that the 90% confidence interval for the geometric mean ratio of Test/Reference Cmax and AUC must fall strictly between 80.00% and 125.00%.',
      },
      {
        id: 'q6_4',
        text: 'Which specific enzyme is inhibited by Sildenafil to produce vascular smooth muscle relaxation through cyclic GMP accumulation?',
        type: 'verbal',
        category: 'Pharmacology',
        difficulty: 'medium',
        answer: 'Phosphodiesterase Type 5 (PDE5)',
        explanation: 'Inhibition of PDE5 prevents the breakdown of cGMP, sustaining nitric oxide-mediated vasodilation.',
      },
      {
        id: 'q6_5',
        text: 'What pharmaceutical dosage form terminology refers to a solid single-dose preparation consisting of a hard or soft shell enclosing medication?',
        type: 'verbal',
        category: 'Pharmaceutics',
        difficulty: 'easy',
        answer: 'Capsule (Gelatin or HPMC Capsule)',
        explanation: 'Hard gelatin capsules are two-piece (body and cap) filled with powder or pellets, whereas soft gelatin capsules are one-piece hermetically sealed shells.',
      },
    ],
  },
];

export const INITIAL_QUIZ: Quiz = {
  id: 'quiz_pharm_2026',
  code: 'MIND01',
  title: 'MIND EXPEDITION – Pharmaceutical Sciences Championship',
  subtitle: 'National Intercollegiate Live Quiz Competition',
  organizedBy: 'College of Pharmaceutical Sciences',
  description: 'A televised live quiz tournament exploring Pharmaceutics, Medicinal Chemistry, Pharmacology, Regulatory Affairs, and Clinical Innovations.',
  date: '2026-11-09',
  venue: 'Grand Auditorium, Golden Jubilee Campus',
  individualOrTeam: 'team',
  quizmasterName: 'Prof. Vikramaditya Joshi',
  status: 'active',
  teams: DEFAULT_TEAMS,
  rounds: DEFAULT_ROUNDS,
  currentRoundIndex: 0,
  currentQuestionIndex: 0,
  activeTeamId: 'team_alpha',
  isPaused: false,
  timer: {
    isRunning: false,
    remainingSeconds: 30,
    totalSeconds: 30,
    timerType: 'per_question',
  },
  buzzer: {
    isActive: false,
    activatedAt: null,
    queue: [],
    maxAttempts: 3,
    timeAllowedSeconds: 15,
    currentTurnParticipantId: null,
    locked: false,
  },
  answerRevealed: false,
  optionsRevealed: false,
  selectedOptionIndex: null,
  rapidFirePhase: 'ready',
  rapidFireLotResults: {},
  currentQuestionAnswers: {},
  manualScoreCorrections: [],
  roundScores: {
    team_alpha: { round_1_basic: 0, round_2_rapid: 0, round_3_straight: 0, round_4_visual: 0, round_5_current: 0, round_6_buzzer: 0 },
    team_beta: { round_1_basic: 0, round_2_rapid: 0, round_3_straight: 0, round_4_visual: 0, round_5_current: 0, round_6_buzzer: 0 },
    team_gamma: { round_1_basic: 0, round_2_rapid: 0, round_3_straight: 0, round_4_visual: 0, round_5_current: 0, round_6_buzzer: 0 },
    team_delta: { round_1_basic: 0, round_2_rapid: 0, round_3_straight: 0, round_4_visual: 0, round_5_current: 0, round_6_buzzer: 0 },
  },
  totalScores: {
    team_alpha: 0,
    team_beta: 0,
    team_gamma: 0,
    team_delta: 0,
  },
  displayScreen: 'welcome',
  createdAt: '2026-11-09T08:00:00Z',
  updatedAt: '2026-11-09T08:00:00Z',
};

// Second pre-loaded quiz to demonstrate multiple independent quiz competitions!
export const SECOND_QUIZ: Quiz = {
  id: 'quiz_general_pharm',
  code: 'MIND02',
  title: 'MIND EXPEDITION – General Pharmacy & Therapeutics',
  subtitle: 'Departmental Annual Quiz Challenge',
  organizedBy: 'Faculty of Pharmacy',
  description: 'Annual departmental competition focusing on hospital pharmacy, patient counseling, clinical therapeutics, and toxicology.',
  date: '2026-11-15',
  venue: 'Seminar Hall 3',
  individualOrTeam: 'team',
  quizmasterName: 'Dr. Radhika Iyer',
  status: 'scheduled',
  teams: [
    {
      id: 'team_sun',
      name: 'Sun Pharma Pioneers',
      institution: 'Faculty of Pharmacy',
      department: 'Clinical Pharmacy',
      color: '#f97316',
      participants: [{ name: 'Arun V' }, { name: 'Divya N' }],
      isOnline: false,
    },
    {
      id: 'team_cadila',
      name: 'Cadila Curators',
      institution: 'Faculty of Pharmacy',
      department: 'Biotechnology',
      color: '#06b6d4',
      participants: [{ name: 'Sameer K' }, { name: 'Pooja M' }],
      isOnline: false,
    },
  ],
  rounds: [
    syncRoundOneQuestions(
      {
        ...DEFAULT_ROUNDS[0],
        id: 'g_round_1',
        name: 'Round I – Clinical Basics',
      },
      2
    ),
    syncRoundTwoQuestions(
      {
        ...DEFAULT_ROUNDS[1],
        id: 'g_round_2',
        name: 'Round II – Speed Pharmacology',
      },
      2
    ),
  ],
  currentRoundIndex: 0,
  currentQuestionIndex: 0,
  activeTeamId: 'team_sun',
  isPaused: false,
  timer: {
    isRunning: false,
    remainingSeconds: 30,
    totalSeconds: 30,
    timerType: 'per_question',
  },
  buzzer: {
    isActive: false,
    activatedAt: null,
    queue: [],
    maxAttempts: 2,
    timeAllowedSeconds: 15,
    currentTurnParticipantId: null,
    locked: false,
  },
  answerRevealed: false,
  optionsRevealed: false,
  selectedOptionIndex: null,
  rapidFirePhase: 'ready',
  rapidFireLotResults: {},
  currentQuestionAnswers: {},
  manualScoreCorrections: [],
  roundScores: {
    team_sun: { g_round_1: 0, g_round_2: 0 },
    team_cadila: { g_round_1: 0, g_round_2: 0 },
  },
  totalScores: {
    team_sun: 0,
    team_cadila: 0,
  },
  displayScreen: 'welcome',
  createdAt: '2026-11-09T08:30:00Z',
  updatedAt: '2026-11-09T08:30:00Z',
};
