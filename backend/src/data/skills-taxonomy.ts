/**
 * Canonical skills taxonomy for the "Junior Data Analyst" role.
 *
 * Each skill has:
 *   - name:     The canonical display name (stored in the DB)
 *   - category: Grouping for organization and UI
 *   - aliases:  Alternative spellings/names that the extraction pipeline
 *               will normalize to this canonical skill.  Matching is
 *               case-insensitive with word-boundary enforcement.
 *
 * IMPORTANT — alias design rules:
 *   1. Every alias must be ≥ 2 characters to avoid single-letter
 *      false-positive traps (e.g., standalone "R").
 *   2. Multi-word aliases are matched with flexible whitespace.
 *   3. Aliases must NOT overlap across skills — if two skills could
 *      claim the same alias, pick the more specific one.
 */

import { SkillDefinition } from '../types';

export const SKILLS_TAXONOMY: SkillDefinition[] = [
  // ── Programming ──────────────────────────────────────────
  {
    name: 'SQL',
    category: 'programming',
    aliases: [
      'structured query language',
      'sql queries',
      'sql programming',
      't-sql',
      'tsql',
      'pl/sql',
      'plsql',
    ],
  },
  {
    name: 'Python',
    category: 'programming',
    aliases: [
      'python3',
      'python 3',
      'python programming',
      'python scripting',
    ],
  },
  {
    name: 'R Programming',
    category: 'programming',
    aliases: [
      'r programming',
      'r language',
      'rstudio',
      'r studio',
      'r software',
      'programming in r',
      'r statistical',
    ],
  },
  {
    name: 'VBA',
    category: 'programming',
    aliases: [
      'visual basic for applications',
      'visual basic',
      'excel vba',
      'vba macros',
      'vba programming',
    ],
  },
  {
    name: 'Pandas',
    category: 'programming',
    aliases: ['pandas library', 'python pandas'],
  },
  {
    name: 'NumPy',
    category: 'programming',
    aliases: ['numpy library', 'python numpy'],
  },

  // ── Analytics / BI ───────────────────────────────────────
  {
    name: 'Excel',
    category: 'analytics',
    aliases: [
      'microsoft excel',
      'ms excel',
      'advanced excel',
      'excel spreadsheets',
      'excel pivot tables',
      'pivot tables',
      'vlookup',
    ],
  },
  {
    name: 'Tableau',
    category: 'analytics',
    aliases: [
      'tableau desktop',
      'tableau server',
      'tableau public',
      'tableau software',
    ],
  },
  {
    name: 'Power BI',
    category: 'analytics',
    aliases: [
      'powerbi',
      'power-bi',
      'ms power bi',
      'microsoft power bi',
      'power bi desktop',
      'power bi service',
    ],
  },
  {
    name: 'Google Sheets',
    category: 'analytics',
    aliases: ['gsheets', 'google spreadsheets'],
  },
  {
    name: 'Looker',
    category: 'analytics',
    aliases: ['looker studio', 'google data studio', 'data studio'],
  },
  {
    name: 'SAS',
    category: 'analytics',
    aliases: ['sas programming', 'sas analytics', 'sas software'],
  },
  {
    name: 'SPSS',
    category: 'analytics',
    aliases: ['ibm spss', 'spss statistics'],
  },

  // ── Data ─────────────────────────────────────────────────
  {
    name: 'Data Cleaning',
    category: 'data',
    aliases: [
      'data cleansing',
      'data wrangling',
      'data preprocessing',
      'data preparation',
      'data scrubbing',
      'data quality',
    ],
  },
  {
    name: 'Data Visualization',
    category: 'data',
    aliases: [
      'data viz',
      'data visualisation',
      'visual analytics',
      'data charts',
      'visualizing data',
    ],
  },
  {
    name: 'Data Modeling',
    category: 'data',
    aliases: [
      'data modelling',
      'database design',
      'data architecture',
      'dimensional modeling',
      'dimensional modelling',
    ],
  },
  {
    name: 'ETL',
    category: 'data',
    aliases: [
      'extract transform load',
      'data pipelines',
      'data integration',
      'data extraction',
    ],
  },
  {
    name: 'Database Management',
    category: 'data',
    aliases: [
      'database administration',
      'dbms',
      'rdbms',
      'mysql',
      'postgresql',
      'postgres',
      'sql server',
      'microsoft sql server',
      'oracle database',
      'oracle db',
    ],
  },
  {
    name: 'Data Analysis',
    category: 'data',
    aliases: [
      'data analytics',
      'data interpretation',
      'analyze data',
      'analysing data',
      'data-driven',
    ],
  },
  {
    name: 'Reporting',
    category: 'data',
    aliases: [
      'report generation',
      'report writing',
      'business reporting',
      'dashboard development',
      'creating dashboards',
      'building dashboards',
      'dashboards',
    ],
  },

  // ── Statistics ───────────────────────────────────────────
  {
    name: 'Statistics',
    category: 'statistics',
    aliases: [
      'statistical analysis',
      'descriptive statistics',
      'inferential statistics',
      'statistical methods',
      'statistical modeling',
      'statistical modelling',
      'biostatistics',
      'statistical techniques',
    ],
  },
  {
    name: 'Machine Learning',
    category: 'statistics',
    aliases: [
      'ml algorithms',
      'predictive modeling',
      'predictive modelling',
      'supervised learning',
      'unsupervised learning',
      'machine-learning',
    ],
  },
  {
    name: 'A/B Testing',
    category: 'statistics',
    aliases: [
      'ab testing',
      'split testing',
      'hypothesis testing',
    ],
  },
  {
    name: 'Regression Analysis',
    category: 'statistics',
    aliases: [
      'linear regression',
      'logistic regression',
      'regression modeling',
      'regression modelling',
    ],
  },

  // ── Tools ────────────────────────────────────────────────
  {
    name: 'Google Analytics',
    category: 'tools',
    aliases: ['ga4', 'google analytics 4', 'web analytics'],
  },
  {
    name: 'BigQuery',
    category: 'tools',
    aliases: ['google bigquery'],
  },
  {
    name: 'Jupyter',
    category: 'tools',
    aliases: [
      'jupyter notebook',
      'jupyter notebooks',
      'jupyter lab',
      'jupyterlab',
    ],
  },

  // ── Soft Skills ──────────────────────────────────────────
  {
    name: 'Communication',
    category: 'soft_skill',
    aliases: [
      'communication skills',
      'written communication',
      'verbal communication',
      'interpersonal skills',
      'strong communication',
    ],
  },
  {
    name: 'Problem Solving',
    category: 'soft_skill',
    aliases: [
      'problem-solving',
      'analytical thinking',
      'critical thinking',
      'analytical skills',
    ],
  },
  {
    name: 'Teamwork',
    category: 'soft_skill',
    aliases: [
      'team work',
      'collaboration',
      'team player',
      'cross-functional',
      'cross functional',
      'collaborative',
    ],
  },
  {
    name: 'Attention to Detail',
    category: 'soft_skill',
    aliases: [
      'detail-oriented',
      'detail oriented',
      'meticulous',
      'keen eye for detail',
    ],
  },
  {
    name: 'Presentation Skills',
    category: 'soft_skill',
    aliases: [
      'presentation',
      'presenting',
      'public speaking',
      'storytelling with data',
      'data storytelling',
    ],
  },
  {
    name: 'Time Management',
    category: 'soft_skill',
    aliases: [
      'time-management',
      'deadline management',
      'prioritization',
      'managing priorities',
    ],
  },
];
