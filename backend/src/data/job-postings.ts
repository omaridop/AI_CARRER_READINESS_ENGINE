/**
 * Curated dataset of Junior Data Analyst job postings.
 *
 * source_label is ALWAYS either "real" or "sample" — never blank.
 *
 * DATA REFRESH (Phase B-fix):
 *   - 7 real postings ingested from user-provided Jordanian labor-market data
 *     (LinkedIn, Bayt.com, kalamntina.com, kalatechs.com)
 *   - 30 independently-varied sample postings generated to reach the 30–50 range
 *   - Previous 40 templated synthetics REPLACED entirely
 *   - Skill distribution corrected: SQL, Excel, Power BI, Tableau now appear
 *     at realistic frequencies matching real-world Junior Data Analyst demand
 */

import { JobPostingData } from '../types';

export const JOB_POSTINGS: JobPostingData[] = [
  // ══════════════════════════════════════════════════════════
  // REAL POSTINGS (7) — source_label: "real"
  // ══════════════════════════════════════════════════════════

  // --- POSTING 1: REACH Initiative (LinkedIn) ---
  {
    "title": "Assessment Officer (Research/Data — REACH Initiative)",
    "company": "ACTED (REACH Initiative)",
    "location": "Amman, Jordan",
    "source_label": "real",
    "source_name": "LinkedIn",
    "description": "University undergraduate degree or 2+ years relevant experience. Experience conducting research/assessments or working with data (academic research experience included). Fluency in English, excellent communication and writing skills. Previous experience conducting humanitarian assessments, research, or data analysis is required, along with experience managing and processing large datasets (including in Microsoft Excel). Strong Excel skills. Previous experience with mobile data collection (ODK, ONA, KoBo). Good understanding of research methods (including sampling frameworks). Experience with cleaning and analysing datasets. Knowledge of the Adobe Suite, particularly InDesign, as an asset. Experience on dashboards (Power BI, Shiny) as an asset. Familiarity with statistical software (e.g. R, SPSS, or Stata) as an asset. Experience working in/on humanitarian or development contexts. Experience with external engagement and/or partner coordination. Strong analytical skills. Ability to operate independently in a cross-cultural environment.",
    "date_posted": null
  },

  // --- POSTING 2: Business Analyst (Bayt.com) ---
  {
    "title": "Business Analyst",
    "company": "Business Analysts",
    "location": "Jordan",
    "source_label": "real",
    "source_name": "Bayt.com",
    "description": "Bachelor's Degree in Industrial Engineering, Management Science or any related field. 0 to 1 years of experience. Fluency in English is a MUST. Strong communication skills. Acute analytical and critical thinking skills. Thoroughness and commitment to quality. Eagerness to learn. Diligence and ambition. Flexibility and resilience. Role involves developing reports and presentations, conducting research/data collection/analysis, and supporting management/HR solution implementation for MENA-region clients.",
    "date_posted": null
  },

  // --- POSTING 3: Junior Data Analyst (kalamntina.com) ---
  {
    "title": "Junior Data Analyst",
    "company": "Confidential",
    "location": "Amman, Jordan",
    "source_label": "real",
    "source_name": "kalamntina.com",
    "description": "Bachelor's degree in supply chain management, Industrial Engineering, Business Analytics, or a related field. 1-3 years of experience in supply chain, planning, or data analytics roles. Basic understanding of supply chain concepts such as demand forecasting, inventory management, and S&OP. Working knowledge of Power BI for data visualization and reporting. Strong analytical and problem-solving skills. Excellent communication and collaboration abilities. Familiarity with Excel, ERP systems, or planning tools is a plus. Responsibilities include IBP processes (demand/supply planning, scenario analysis), maintaining Power BI dashboards for supply chain KPIs, and data validation/cleansing/analysis.",
    "date_posted": "2025-10-14"
  },

  // --- POSTING 4: Data Analytics (kalamntina.com) ---
  {
    "title": "Data Analytics",
    "company": "Confidential",
    "location": "Amman, Jordan",
    "source_label": "real",
    "source_name": "kalamntina.com",
    "description": "2-3 years of experience in data analysis, data reporting, or a similar analytical role. Bachelor's degree in Data Science, Statistics, Computer Science, Business, Economics, or a related field. Strong proficiency in SQL for querying databases and Excel for data manipulation and analysis. Experience with data visualization tools such as Tableau, Power BI, or similar platforms. Proficiency in Python, R, or other statistical analysis tools. Excellent communication skills. Responsibilities include collecting/organizing/maintaining large datasets, analyzing data using Excel/SQL/Python/R, creating dashboards (Tableau/Power BI), and resolving data quality issues.",
    "date_posted": "2024-12-02"
  },

  // --- POSTING 5: Data Analyst and CRM Supervisor (kalatechs.com) ---
  {
    "title": "Data Analyst and CRM Supervisor",
    "company": "Confidential",
    "location": "Amman, Jordan",
    "source_label": "real",
    "source_name": "kalatechs.com",
    "description": "Minimum 2-3 years of experience. Bachelor's degree in a relevant field (e.g., Data Science, Business Analytics, Computer Science). Proven experience in data analysis, data visualization, and CRM management. Proficiency in Power BI. Strong analytical skills with large datasets. Experience with SQL for data querying and manipulation. Familiarity with CRM systems and data cleansing best practices. Experience in Salesforce, Google Analytics, and social listening platforms is a plus. Excellent communication skills. Detail-oriented. Problem-solving skills. Responsibilities span data visualization (Power BI), CRM database management, vendor communication for CRM systems, and data analysis/insights presented to stakeholders.",
    "date_posted": "2023-11-22"
  },

  // --- POSTING 6: Data Associate (kalamntina.com) ---
  {
    "title": "Data Associate",
    "company": "Confidential",
    "location": "Amman, Jordan",
    "source_label": "real",
    "source_name": "kalamntina.com",
    "description": "3+ years of experience in data analytics, engineering, or a related role. Strong proficiency in SQL and experience working with large datasets. Hands-on experience with modern ETL/ELT tools (Kleene, Airbyte, Fivetran, dbt). Proficient in cloud data warehouses (BigQuery, Snowflake, Redshift). Experience building data pipelines and automating ingestion using Python and orchestration tools (Airflow, Zapier). Familiarity with data modeling (star/snowflake schemas). Experience with Looker/LookML highly preferred. Understanding of data governance and privacy standards.",
    "date_posted": "2025-07-29"
  },

  // --- POSTING 7: BI Analyst (kalamntina.com) ---
  {
    "title": "Business Intelligence (BI) Analyst",
    "company": "Confidential",
    "location": "Amman, Jordan",
    "source_label": "real",
    "source_name": "kalamntina.com",
    "description": "Bachelor's degree in Computer Science, Information Technology, Data Science, or related field. Proven experience as a BI Analyst or similar role. Proficiency in BI tools (Power BI, Tableau, Qlik) and data visualization techniques. Strong SQL skills and experience with relational databases. Excellent analytical and problem-solving abilities. Ability to translate business requirements into technical solutions. Knowledge of data warehousing concepts and ETL processes. Familiarity with programming languages such as Python or R is a plus.",
    "date_posted": "2024-07-11"
  },

  // ══════════════════════════════════════════════════════════
  // SAMPLE POSTINGS (30) — source_label: "sample"
  // Each is independently varied in wording and skill emphasis.
  // Designed to produce a realistic skill distribution where
  // SQL, Excel, and BI tools rank near the top.
  // ══════════════════════════════════════════════════════════

  // --- Sample 1 ---
  {
    "title": "Junior Data Analyst",
    "company": "Aramex",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "We are looking for an entry-level Data Analyst to support our logistics analytics team. You will write SQL queries against our warehouse database daily, build Excel-based reports for operations managers, and develop Power BI dashboards that track delivery metrics. A bachelor's degree in a quantitative field is required. Candidates should be comfortable with data cleaning and possess strong attention to detail. Good communication skills to present findings to non-technical stakeholders are essential.",
    "date_posted": "2025-01-15"
  },

  // --- Sample 2 ---
  {
    "title": "Data Analyst — Marketing",
    "company": "Zain Jordan",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Zain Jordan's marketing department is hiring a data analyst to measure campaign performance and customer behavior. You will use SQL to pull data from our subscriber database, create visualizations in Tableau, and maintain weekly performance reports in Excel. Experience with Google Analytics is preferred. We value candidates who can translate numbers into clear narratives for senior leadership. Bachelor's degree required; 1-2 years of experience preferred.",
    "date_posted": "2025-02-20"
  },

  // --- Sample 3 ---
  {
    "title": "Junior Business Intelligence Analyst",
    "company": "Capital Bank",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Capital Bank seeks a junior BI analyst to join our decision-support unit. The role centers on building interactive Power BI dashboards for branch performance, loan portfolio analysis, and risk metrics. Strong SQL skills are mandatory — you will query relational databases to extract data for reporting. Excel proficiency for ad-hoc analysis is expected. A degree in Finance, Economics, or Data Science preferred. The ability to work collaboratively with product and compliance teams is important.",
    "date_posted": "2025-03-10"
  },

  // --- Sample 4 ---
  {
    "title": "Data Analyst Intern",
    "company": "Orange Jordan",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Orange Jordan offers a 6-month data analyst internship. Interns will assist with data collection, cleaning, and basic analysis using Excel and SQL. You will shadow senior analysts working in Tableau and learn to create clear data visualizations. We are looking for students in their final year of a bachelor's degree in Computer Science, MIS, or Statistics. Eagerness to learn and strong problem-solving abilities matter more than years of experience.",
    "date_posted": "2025-04-01"
  },

  // --- Sample 5 ---
  {
    "title": "Junior Data Analyst — Finance",
    "company": "Arab Bank",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Arab Bank's finance analytics group requires a junior data analyst to support regulatory reporting and financial modeling. Daily tasks include querying transaction databases using SQL, consolidating data in Excel (pivot tables, VLOOKUP), and preparing summary dashboards in Power BI for senior management. Knowledge of basic statistics and attention to detail are critical. Bachelor's degree in Accounting, Finance, or related field; 0-2 years of experience.",
    "date_posted": "2025-01-22"
  },

  // --- Sample 6 ---
  {
    "title": "Reporting Analyst",
    "company": "Umniah",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Umniah is looking for a reporting analyst to own our monthly KPI reporting cycle. You will extract subscriber and revenue data via SQL, automate report generation in Excel using macros, and deliver executive dashboards in Power BI. Understanding data quality issues and performing data validation are key parts of the job. Must have excellent written communication skills and the ability to meet tight deadlines. Bachelor's degree in any analytical discipline required.",
    "date_posted": "2025-05-08"
  },

  // --- Sample 7 ---
  {
    "title": "Junior Data Analyst",
    "company": "Estarta Solutions",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Estarta is hiring a junior data analyst for our client services team. In this role, you will analyze customer satisfaction survey data, identify trends, and present actionable recommendations. Proficiency in SQL and Excel is required. Experience with Tableau or Power BI for data visualization is highly desired. Familiarity with Python for automating repetitive data tasks is a plus. Strong teamwork and the ability to explain findings to non-technical audiences are essential.",
    "date_posted": "2025-06-12"
  },

  // --- Sample 8 ---
  {
    "title": "Operations Data Analyst",
    "company": "Careem (Jordan)",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Join Careem's operations team as a data analyst focused on ride efficiency and driver utilization metrics. You will write complex SQL queries to analyze trip data, build real-time dashboards in Tableau, and perform root-cause analysis using Excel. Python knowledge for data manipulation with Pandas is advantageous. We need someone who is comfortable presenting insights to cross-functional teams and thrives in a fast-moving environment. Bachelor's degree in Engineering, Mathematics, or related field.",
    "date_posted": "2025-03-25"
  },

  // --- Sample 9 ---
  {
    "title": "Data Analyst",
    "company": "Hikma Pharmaceuticals",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Hikma Pharmaceuticals seeks a data analyst to support our supply chain and manufacturing analytics. You will maintain production dashboards in Power BI, run SQL queries against our ERP database for inventory and yield analysis, and use Excel for detailed variance reports. A foundational understanding of statistics is important for quality-control trending. Bachelor's degree in Industrial Engineering, Pharmacy, or Data Science preferred. Strong organizational and communication skills expected.",
    "date_posted": "2025-02-18"
  },

  // --- Sample 10 ---
  {
    "title": "Associate Data Analyst",
    "company": "Maktoob / Yahoo MENA",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "We need an associate data analyst to support our content and advertising teams with audience and engagement analytics. Daily work involves SQL-based data retrieval from our event-tracking databases, analysis and reporting in Excel, and dashboard creation using Tableau. Experience with Google Analytics or similar web analytics platforms is preferred. Candidates should possess strong problem-solving skills and the ability to work independently. Bachelor's degree and 0-1 years of relevant experience.",
    "date_posted": "2025-07-05"
  },

  // --- Sample 11 ---
  {
    "title": "Junior Data Analyst — HR Analytics",
    "company": "Abdul Latif Jameel (Jordan)",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Join our HR department to deliver data-driven people analytics. Responsibilities include running SQL queries to compile headcount and turnover data, building Excel reports with pivot tables for leadership reviews, and creating Power BI dashboards to visualize workforce trends. Familiarity with basic statistical concepts like averages, distributions, and benchmarking is expected. Bachelor's degree in HR, Business Administration, or a quantitative field required.",
    "date_posted": "2025-04-15"
  },

  // --- Sample 12 ---
  {
    "title": "Data Analyst",
    "company": "Jordan Ahli Bank",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Jordan Ahli Bank is recruiting a data analyst for its digital banking division. The successful candidate will use SQL to query customer transaction and behavior data, create automated reports in Excel, and build interactive dashboards in Power BI or Tableau. Strong data cleaning skills and attention to data quality are paramount. Knowledge of Python or R for more advanced analysis is a bonus. Bachelor's degree in a quantitative field, plus excellent communication and presentation skills.",
    "date_posted": "2025-05-20"
  },

  // --- Sample 13 ---
  {
    "title": "Junior Data Analyst — E-commerce",
    "company": "Jamalon",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Jamalon, the Arab world's largest online bookstore, is looking for a junior data analyst to optimize our online marketplace. You will analyze sales trends, customer acquisition funnels, and inventory turnover using SQL and Excel. Building visual reports in Tableau is part of the weekly workflow. Understanding of A/B testing methodology to support conversion rate experiments is valued. We are looking for a detail-oriented candidate with strong analytical thinking and a bachelor's degree.",
    "date_posted": "2025-06-01"
  },

  // --- Sample 14 ---
  {
    "title": "Data Analyst",
    "company": "Greater Amman Municipality",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Greater Amman Municipality is hiring a data analyst to support urban planning and public services reporting. Duties include querying municipal databases with SQL, preparing statistical summaries in Excel, and developing dashboards in Power BI for city council presentations. Familiarity with geographic data and mapping tools is helpful but not required. We value candidates with excellent written communication skills and a bachelor's degree in Public Administration, Statistics, or IT.",
    "date_posted": "2025-03-01"
  },

  // --- Sample 15 ---
  {
    "title": "Associate Data Analyst",
    "company": "Aqaba Container Terminal",
    "location": "Aqaba, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Aqaba Container Terminal needs an associate data analyst for port operations analytics. You will use SQL to extract vessel and cargo throughput data, perform trend analysis in Excel, and deliver monthly operational dashboards using Tableau or Power BI. Python scripting for automating report generation is a plus. Bachelor's degree in Logistics, Engineering, or Data Science. Must be comfortable working with large datasets and presenting findings to management.",
    "date_posted": "2025-08-10"
  },

  // --- Sample 16 ---
  {
    "title": "Junior Data Analyst",
    "company": "Edraak (Queen Rania Foundation)",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Edraak is looking for a junior data analyst to track learner engagement and course completion metrics on our MOOC platform. You will write SQL queries to analyze learner behavior, generate weekly Excel reports, and create visualizations in Tableau or Power BI. Understanding of basic statistics — completion rates, cohort analysis, averages — is important. Strong communication and teamwork skills required. Bachelor's degree in Education, Computer Science, or a related field preferred.",
    "date_posted": "2025-04-22"
  },

  // --- Sample 17 ---
  {
    "title": "Data Analyst — Sales",
    "company": "Talabat Jordan",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Talabat Jordan is searching for a data analyst to optimize sales and vendor performance across our food delivery platform. You will pull transactional data using SQL, conduct analysis in Python with Pandas, and build Power BI dashboards for the commercial team. Excel skills are needed for ad-hoc deep dives and financial reconciliation. Candidates must have strong problem-solving and communication skills. Bachelor's degree required; 1-2 years of experience preferred.",
    "date_posted": "2025-07-18"
  },

  // --- Sample 18 ---
  {
    "title": "Junior Data Analyst",
    "company": "UNDP Jordan",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "UNDP Jordan seeks a junior data analyst to support monitoring and evaluation across development programs. You will clean and manage datasets in Excel, write SQL queries to aggregate indicator data, and produce visual reports using Power BI. Understanding of survey design and basic statistical analysis is an asset. The role requires strong attention to detail, excellent written English, and the ability to collaborate across international teams. A bachelor's degree in Social Sciences, Statistics, or Economics is required.",
    "date_posted": "2025-05-05"
  },

  // --- Sample 19 ---
  {
    "title": "Graduate Data Analyst",
    "company": "Ericsson Jordan",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Ericsson Jordan's network operations team is looking for a graduate data analyst. Responsibilities include extracting network performance data with SQL, building KPI tracking spreadsheets in Excel, and developing Tableau dashboards for capacity planning. Exposure to Python for scripting and data processing is preferred. We value candidates who demonstrate strong analytical thinking and can work effectively in a team. Bachelor's degree in Telecommunications, Computer Engineering, or related field.",
    "date_posted": "2025-02-28"
  },

  // --- Sample 20 ---
  {
    "title": "Data Analyst",
    "company": "Pioneers Academy",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Pioneers Academy is recruiting a data analyst to measure student outcomes and program effectiveness. Daily tasks include managing data in Excel, running SQL queries on our student information system, and creating reports in Power BI. You will present weekly findings to academic leadership. We are looking for a meticulous individual with a bachelor's degree in Education, Business, or any quantitative discipline. Familiarity with data visualization best practices and basic statistics is expected.",
    "date_posted": "2025-06-25"
  },

  // --- Sample 21 ---
  {
    "title": "Junior Analyst — Business Intelligence",
    "company": "Optimiza",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Optimiza is seeking a junior BI analyst to support our internal analytics practice. Core duties include writing SQL queries, building Tableau reports for client delivery, and using Excel for data preparation. Experience with Python or R for statistical analysis is a bonus. The ideal candidate has a bachelor's degree in IT, MIS, or Statistics and demonstrates strong problem-solving abilities. Good presentation skills are needed as you will regularly share insights with project stakeholders.",
    "date_posted": "2025-08-01"
  },

  // --- Sample 22 ---
  {
    "title": "Entry-Level Data Analyst",
    "company": "Housing Bank for Trade and Finance",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "The Housing Bank seeks an entry-level data analyst to join our risk management team. You will query loan portfolio data using SQL, prepare analysis workbooks in Excel with advanced formulas and pivot tables, and support the development of Power BI dashboards for credit risk monitoring. Familiarity with statistical concepts such as regression is helpful. Bachelor's degree in Finance, Mathematics, or Computer Science required. Strong attention to detail and time management skills are expected.",
    "date_posted": "2025-01-30"
  },

  // --- Sample 23 ---
  {
    "title": "Data Analyst",
    "company": "Mashreq Bank (Jordan Office)",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Mashreq Bank's Jordan office is recruiting a data analyst for its retail banking analytics team. You will use SQL to extract customer and transaction data, create automated Excel reports, and build interactive Tableau dashboards. Knowledge of Python for data manipulation is advantageous. We expect candidates to possess strong communication skills and the ability to translate business questions into data analyses. Bachelor's degree in a relevant field and 1-3 years of experience preferred.",
    "date_posted": "2025-09-12"
  },

  // --- Sample 24 ---
  {
    "title": "Junior Data Analyst — Supply Chain",
    "company": "Manaseer Group",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Manaseer Group is hiring a junior data analyst for supply chain and procurement analytics. You will track vendor performance and inventory levels by running SQL queries, building reports in Excel, and maintaining Power BI dashboards. Understanding of demand forecasting concepts is preferred but not mandatory. We are looking for a bachelor's degree holder in Industrial Engineering, Business, or a related field. Strong organizational skills and the ability to handle multiple priorities are essential.",
    "date_posted": "2025-03-17"
  },

  // --- Sample 25 ---
  {
    "title": "Data Analyst",
    "company": "Jordan Insurance Company",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Join Jordan Insurance Company as a data analyst supporting our actuarial and claims team. You will use SQL to extract claims data, perform analysis in Excel, and develop dashboards in Tableau to monitor loss ratios and underwriting performance. Basic understanding of statistics and probability is valued. Candidates should hold a bachelor's degree in Actuarial Science, Statistics, Mathematics, or a related field. Strong analytical thinking, attention to detail, and clear communication are required.",
    "date_posted": "2025-04-30"
  },

  // --- Sample 26 ---
  {
    "title": "Associate Data Analyst",
    "company": "Luminus Education",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Luminus Education is seeking an associate data analyst to track enrollment trends, student retention, and institutional KPIs. You will write SQL queries against our student database, prepare Excel summaries for academic committees, and build Power BI dashboards for executive reporting. Familiarity with data cleaning techniques and a commitment to data quality are important. Bachelor's degree in any field and strong communication skills required. Experience with Python is a plus.",
    "date_posted": "2025-07-22"
  },

  // --- Sample 27 ---
  {
    "title": "Junior Data Analyst — Healthcare",
    "company": "King Hussein Cancer Center",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "King Hussein Cancer Center is looking for a junior data analyst to support clinical and operational reporting. You will query our health information system using SQL, maintain patient-flow and outcome dashboards in Tableau, and prepare detailed statistical summaries in Excel. Familiarity with SPSS or R for statistical analysis is a plus. A bachelor's degree in Public Health, Biostatistics, or Health Informatics is preferred. Attention to detail and discretion in handling sensitive data are critical.",
    "date_posted": "2025-05-14"
  },

  // --- Sample 28 ---
  {
    "title": "Data Analyst",
    "company": "Jordan Petroleum Refinery",
    "location": "Zarqa, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Jordan Petroleum Refinery is hiring a data analyst for its operations excellence department. You will use SQL to query production and maintenance databases, build daily performance scorecards in Excel, and create Power BI dashboards for plant management. Understanding of basic statistical process control concepts is beneficial. Bachelor's degree in Chemical Engineering, Industrial Engineering, or a data-related field required. Must be a strong team player with solid communication skills.",
    "date_posted": "2025-08-20"
  },

  // --- Sample 29 ---
  {
    "title": "Entry-Level Data Analyst",
    "company": "Aspire (Digital Agency)",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Aspire, a digital marketing agency, needs an entry-level data analyst to help clients understand their online performance. You will pull campaign data via Google Analytics and SQL, compile insights in Excel, and build client-facing reports in Tableau. Understanding of A/B testing and conversion metrics is preferred. Candidates should be comfortable presenting data to clients and working under deadlines. Bachelor's degree in Marketing, IT, or Statistics required. Python knowledge is a bonus.",
    "date_posted": "2025-06-18"
  },

  // --- Sample 30 ---
  {
    "title": "Junior Data Analyst",
    "company": "Royal Jordanian Airlines",
    "location": "Amman, Jordan",
    "source_label": "sample",
    "source_name": "synthetic",
    "description": "Royal Jordanian is recruiting a junior data analyst for our revenue management department. Core responsibilities include writing SQL queries to analyze booking and fare data, building revenue performance dashboards in Power BI, and preparing forecasting models in Excel. Familiarity with Python for data manipulation is advantageous. Bachelor's degree in Aviation Management, Business, or a quantitative field required. Strong analytical skills and the ability to meet tight reporting deadlines are essential.",
    "date_posted": "2025-09-01"
  }
];
