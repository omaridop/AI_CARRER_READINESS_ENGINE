/**
 * Deterministic fallback explanations for the Adaptive Tutor.
 *
 * Provides pre-written, hand-authored content for the top 5 skills
 * most likely to appear as gaps (SQL, Excel, Power BI, Tableau, Python)
 * across all 5 explanation styles.
 *
 * These are served when:
 *   1. ANTHROPIC_API_KEY is not set
 *   2. The API call fails or times out
 *   3. The model returns malformed JSON
 *
 * A generic fallback template is provided for any skill not in the top 5.
 */

import { TutorResponse, ExplanationStyle } from './schema-validator';

// ── Type for the fallback map ─────────────────────────────────────

type FallbackMap = Record<string, Partial<Record<ExplanationStyle, TutorResponse>>>;

// ── Fallback content ──────────────────────────────────────────────

const FALLBACKS: FallbackMap = {
  // ═══════════════════════════════════════════════════════════════
  // SQL
  // ═══════════════════════════════════════════════════════════════
  SQL: {
    simple: {
      skill: 'SQL',
      style: 'simple',
      explanation_text:
        'SQL stands for Structured Query Language. Think of it as the language you use to talk to databases — large organized collections of data stored in tables (like spreadsheets with rows and columns). When a company stores customer orders, employee records, or product inventory, that data lives in a database. SQL lets you ask questions like "show me all orders from last month" or "how many customers are in Amman?" You write a short command called a query, the database reads it, and gives you back exactly the data you asked for. Almost every data analyst job requires SQL because it is the standard way to retrieve and manipulate data.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'SQL',
      style: 'visual',
      explanation_text:
        'Picture a large filing cabinet with many drawers. Each drawer is a TABLE (e.g., "customers", "orders", "products"). Inside each drawer, every folder is a ROW (one record), and the tab labels on each folder are COLUMNS (name, email, date).\n\n┌─────────────────────────────────┐\n│         DATABASE                │\n│  ┌──────────┐  ┌──────────┐    │\n│  │ customers│  │  orders  │    │\n│  │──────────│  │──────────│    │\n│  │ id       │  │ id       │    │\n│  │ name     │  │ cust_id  │    │\n│  │ email    │  │ total    │    │\n│  │ city     │  │ date     │    │\n│  └──────────┘  └──────────┘    │\n└─────────────────────────────────┘\n\nSQL is the language that lets you open specific drawers, look through folders matching certain criteria, and pull out exactly what you need. SELECT chooses which columns, FROM picks the table, and WHERE filters the rows.',
      example: null,
      notes: null,
    },
    example: {
      skill: 'SQL',
      style: 'example',
      explanation_text:
        'Here is a practical SQL example. Imagine a company stores its orders in a table called "orders" with columns: order_id, customer_name, city, amount, and order_date.',
      example:
        '-- Find all orders from Amman over 100 JOD in the last 30 days\nSELECT order_id, customer_name, amount\nFROM orders\nWHERE city = \'Amman\'\n  AND amount > 100\n  AND order_date >= DATE(\'now\', \'-30 days\')\nORDER BY amount DESC;\n\n-- Result might look like:\n-- order_id | customer_name | amount\n-- 1042     | Sara Ahmad    | 250.00\n-- 1038     | Omar Khalil   | 175.50',
      notes: 'Try this on https://sqliteonline.com — paste the query and experiment with changing the WHERE conditions.',
    },
    step_by_step: {
      skill: 'SQL',
      style: 'step_by_step',
      explanation_text:
        'Follow these steps this week to start learning SQL:\n\n1. Go to sqliteonline.com or install DB Browser for SQLite on your computer.\n2. Create a simple table: CREATE TABLE students (id INTEGER, name TEXT, grade REAL);\n3. Insert 5-10 rows of sample data using INSERT INTO statements.\n4. Practice SELECT queries: retrieve all rows, then add WHERE to filter by grade > 80.\n5. Learn ORDER BY to sort results and LIMIT to show only the top 5.\n6. Try a GROUP BY query: count how many students have each grade range.\n7. Join two tables together — create an "enrollments" table and use JOIN to combine them.\n8. Write one query per day for a week, each slightly more complex than the last.',
      example: null,
      notes: 'Free resources: SQLBolt.com (interactive lessons), Mode Analytics SQL Tutorial, Khan Academy SQL course.',
    },
    arabic: {
      skill: 'SQL',
      style: 'arabic',
      explanation_text:
        'SQL هي لغة الاستعلام البنيوية، وهي الطريقة التي نتحدث بها مع قواعد البيانات. تخيّل أن لديك جدولاً كبيراً مثل جدول إكسل فيه أعمدة (مثل الاسم، البريد الإلكتروني، المدينة) وصفوف (كل صف يمثل سجلاً واحداً مثل عميل أو طلب). عندما تكتب استعلام SQL، أنت تطلب من قاعدة البيانات أن تعطيك بيانات محددة — مثلاً "أرني جميع العملاء في عمّان" أو "ما مجموع المبيعات الشهر الماضي؟". تقريباً كل وظيفة محلل بيانات تتطلب معرفة SQL لأنها المعيار العالمي للتعامل مع البيانات المخزنة.',
      example: null,
      notes: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Excel
  // ═══════════════════════════════════════════════════════════════
  Excel: {
    simple: {
      skill: 'Excel',
      style: 'simple',
      explanation_text:
        'Microsoft Excel is a spreadsheet program where data is organized in rows and columns on a grid. You can type numbers, text, or dates into cells, then use formulas to calculate totals, averages, or find patterns. For example, if column B has monthly sales figures, you can type =SUM(B2:B13) to get the yearly total instantly. Excel is the most commonly requested tool in data analyst job postings because it is fast for quick analyses, widely available, and understood by non-technical colleagues. Key skills include pivot tables (summarizing large data), VLOOKUP/XLOOKUP (finding matching data), conditional formatting, and chart creation.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'Excel',
      style: 'visual',
      explanation_text:
        'Think of Excel as a giant grid:\n\n     A          B          C          D\n  ┌──────────┬──────────┬──────────┬──────────┐\n1 │ Product  │ Region   │ Sales    │ Month    │\n  ├──────────┼──────────┼──────────┼──────────┤\n2 │ Widget A │ Amman    │ 1,200    │ Jan      │\n3 │ Widget B │ Irbid    │ 800      │ Jan      │\n4 │ Widget A │ Amman    │ 1,500    │ Feb      │\n  └──────────┴──────────┴──────────┴──────────┘\n\nFormulas live in cells and reference other cells:\n  Cell E2: =SUM(C2:C4)  →  3,500\n\nA Pivot Table collapses this grid into a summary:\n  ┌──────────┬──────────┐\n  │ Product  │ Total    │\n  ├──────────┼──────────┤\n  │ Widget A │ 2,700    │\n  │ Widget B │ 800      │\n  └──────────┴──────────┘\n\nThis is the core of Excel: raw data → formulas → summaries → charts.',
      example: null,
      notes: null,
    },
    example: {
      skill: 'Excel',
      style: 'example',
      explanation_text:
        'Here is a practical exercise you can do in Excel right now to practice core data analyst skills.',
      example:
        '1. Open a new Excel workbook.\n2. In row 1, type headers: Employee | Department | Salary | Start_Date\n3. Fill 10 rows with sample data (mix of departments like Sales, IT, HR).\n4. In cell F2, type: =AVERAGE(C2:C11)  — this gives you the average salary.\n5. In cell F3, type: =COUNTIF(B2:B11,"Sales")  — counts Sales employees.\n6. Select all data → Insert → Pivot Table → drag Department to Rows and Salary to Values.\n7. The pivot table instantly shows total salary per department.\n8. Click on the pivot table → Insert Chart → choose a bar chart.',
      notes: 'Practice keyboard shortcuts: Ctrl+T (create table), Alt+= (auto-sum), Ctrl+Shift+L (toggle filters).',
    },
    step_by_step: {
      skill: 'Excel',
      style: 'step_by_step',
      explanation_text:
        'Follow these steps to build practical Excel skills this week:\n\n1. Download a free sample dataset (e.g., from Kaggle — search "superstore sales CSV").\n2. Open it in Excel and convert the data range to a Table (Ctrl+T).\n3. Apply filters to each column — practice filtering by date range and category.\n4. Create 3 formulas: SUM, AVERAGE, and COUNTIF to summarize the data.\n5. Build a Pivot Table: drag Category to Rows, Sales to Values, Region to Columns.\n6. Create a Pivot Chart from your pivot table — try bar, line, and pie charts.\n7. Use Conditional Formatting to highlight cells where sales exceed a threshold.\n8. Practice VLOOKUP: create a lookup table and pull matching data from it.',
      example: null,
      notes: 'Free practice: Excel exercises at Chandoo.org, ExcelJet.net function reference.',
    },
    arabic: {
      skill: 'Excel',
      style: 'arabic',
      explanation_text:
        'إكسل هو برنامج جداول بيانات من مايكروسوفت. تخيّل ورقة كبيرة مقسمة إلى صفوف وأعمدة — كل مربع صغير يُسمى "خلية" ويمكنك كتابة أرقام أو نصوص فيها. القوة الحقيقية لإكسل تكمن في المعادلات: يمكنك كتابة =SUM(A1:A10) لجمع عشر خلايا تلقائياً، أو =AVERAGE لحساب المتوسط. الجداول المحورية (Pivot Tables) تلخص آلاف الصفوف في جدول صغير مفهوم. إكسل هو الأداة الأكثر طلباً في وظائف تحليل البيانات لأن الجميع يستخدمه — من المديرين إلى المحاسبين — وهو أسرع طريقة لتحليل البيانات دون برمجة.',
      example: null,
      notes: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Power BI
  // ═══════════════════════════════════════════════════════════════
  'Power BI': {
    simple: {
      skill: 'Power BI',
      style: 'simple',
      explanation_text:
        'Power BI is a free tool from Microsoft that turns raw data into interactive visual dashboards. Instead of staring at rows of numbers in a spreadsheet, Power BI lets you create charts, maps, and graphs that update automatically when the data changes. You connect it to your data source (an Excel file, a database, or an online service), drag fields onto a canvas, and it builds visualizations for you. Business leaders use these dashboards to monitor KPIs — key numbers like sales, revenue, or customer counts — at a glance. For a Junior Data Analyst in Jordan, Power BI is the most in-demand visualization tool.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'Power BI',
      style: 'visual',
      explanation_text:
        'Think of Power BI as a three-layer pipeline:\n\n┌────────────────┐    ┌────────────────┐    ┌────────────────┐\n│  DATA SOURCES  │ →  │  DATA MODEL    │ →  │  DASHBOARD     │\n│                │    │                │    │                │\n│ • Excel files  │    │ Tables linked  │    │ ┌────┐ ┌────┐  │\n│ • SQL database │    │ by relations   │    │ │Bar │ │Line│  │\n│ • CSV imports  │    │ (like a mini   │    │ │    │ │    │  │\n│ • Web APIs     │    │  database)     │    │ └────┘ └────┘  │\n│                │    │                │    │ ┌──────────┐   │\n│                │    │ DAX formulas   │    │ │  KPI Card│   │\n│                │    │ for measures   │    │ └──────────┘   │\n└────────────────┘    └────────────────┘    └────────────────┘\n\nYou connect sources on the left, model relationships in the middle, and build interactive visuals on the right. Users click on a chart and the whole dashboard cross-filters.',
      example: null,
      notes: null,
    },
    example: {
      skill: 'Power BI',
      style: 'example',
      explanation_text:
        'Here is a step-by-step exercise to create your first Power BI dashboard.',
      example:
        '1. Download Power BI Desktop (free) from Microsoft.\n2. Click "Get Data" → "Excel" → select a sales data spreadsheet.\n3. In the data model, ensure the Date and Product columns are correct types.\n4. Create a measure: Total Sales = SUM(Sales[Amount])\n5. Drag a "Clustered Bar Chart" onto the canvas.\n   - Axis: Product Category\n   - Values: Total Sales\n6. Add a "Card" visual showing the grand total.\n7. Add a Date Slicer so users can filter by month.\n8. Click on a bar in the chart — notice how the card updates (cross-filtering).\n9. Publish to Power BI Service to share with your team.',
      notes: 'Free practice data: Microsoft\'s AdventureWorks sample dataset.',
    },
    step_by_step: {
      skill: 'Power BI',
      style: 'step_by_step',
      explanation_text:
        'Follow these steps this week to start learning Power BI:\n\n1. Download and install Power BI Desktop (free from Microsoft).\n2. Complete the "Get started" tutorial built into the app (Help → Getting Started).\n3. Import a CSV file with at least 100 rows of data (try a Kaggle dataset).\n4. Create three different visualizations: a bar chart, a line chart, and a KPI card.\n5. Add a slicer (date or category filter) and test the cross-filtering behavior.\n6. Write your first DAX measure: a calculated column or a SUM/AVERAGE measure.\n7. Arrange your visuals on one page to create a coherent dashboard layout.\n8. Export the dashboard as a PDF or publish it to the free Power BI Service.',
      example: null,
      notes: 'Microsoft Learn has a free "Power BI Data Analyst" learning path with hands-on labs.',
    },
    arabic: {
      skill: 'Power BI',
      style: 'arabic',
      explanation_text:
        'Power BI هو أداة مجانية من مايكروسوفت لتحويل البيانات الخام إلى لوحات معلومات تفاعلية (داشبورد). بدلاً من النظر إلى آلاف الصفوف في جدول إكسل، يمكنك إنشاء رسوم بيانية وخرائط ومؤشرات أداء تتحدث تلقائياً عندما تتغير البيانات. تربط Power BI بمصدر بياناتك (ملف إكسل أو قاعدة بيانات)، ثم تسحب الحقول إلى لوحة الرسم وتختار نوع الرسم البياني. المديرون يستخدمون هذه اللوحات لمراقبة المبيعات والإيرادات وعدد العملاء بنظرة واحدة. في سوق العمل الأردني، Power BI هو أداة التصوير المرئي الأكثر طلباً.',
      example: null,
      notes: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Tableau
  // ═══════════════════════════════════════════════════════════════
  Tableau: {
    simple: {
      skill: 'Tableau',
      style: 'simple',
      explanation_text:
        'Tableau is a data visualization tool that lets you create interactive charts, graphs, and dashboards by dragging and dropping fields — no coding required. You connect Tableau to a data source (a spreadsheet, database, or cloud service), and it automatically recognizes the structure of your data. Then you drag a dimension (like "City") to one axis and a measure (like "Sales") to another, and Tableau instantly draws the chart. It is widely used in business intelligence roles because it makes it easy to explore data visually and share insights with colleagues through interactive dashboards.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'Tableau',
      style: 'visual',
      explanation_text:
        'Imagine Tableau as a workbench with shelves:\n\n┌─────────────────────────────────────────┐\n│  COLUMNS shelf:  [City]                 │\n│  ROWS shelf:     [SUM(Sales)]           │\n│                                         │\n│  ┌─────────────────────────────────┐    │\n│  │          CANVAS                 │    │\n│  │                                 │    │\n│  │  Amman    ████████████ 45,000   │    │\n│  │  Irbid    ██████      22,000    │    │\n│  │  Aqaba    ████        15,000    │    │\n│  │  Zarqa    ███         12,000    │    │\n│  │                                 │    │\n│  └─────────────────────────────────┘    │\n│                                         │\n│  FILTERS shelf:  [Year = 2025]          │\n│  COLOR shelf:    [Region]               │\n└─────────────────────────────────────────┘\n\nYou drag fields onto shelves. Columns and Rows define axes. Filters narrow the data. Color and Size add extra dimensions. Tableau draws the visualization automatically.',
      example: null,
      notes: null,
    },
    example: {
      skill: 'Tableau',
      style: 'example',
      explanation_text:
        'Here is a quick exercise to create your first Tableau visualization.',
      example:
        '1. Download Tableau Public (free) from public.tableau.com.\n2. Open it and click "Connect" → "Text file" → choose a CSV dataset.\n3. Tableau shows a preview of your data. Click "Sheet 1" at the bottom.\n4. From the left panel, drag "Category" to the Columns shelf.\n5. Drag "Sales" to the Rows shelf — a bar chart appears immediately.\n6. Drag "Region" to the Color mark — bars are now color-coded by region.\n7. Click "Show Me" in the top right to try different chart types (map, line, scatter).\n8. Right-click the sheet tab → "Rename" → "Sales by Category".\n9. Create a new Dashboard tab and drag your sheet onto it.',
      notes: 'Use Tableau\'s built-in "Superstore" sample data to practice without downloading anything.',
    },
    step_by_step: {
      skill: 'Tableau',
      style: 'step_by_step',
      explanation_text:
        'Follow these steps this week to learn Tableau:\n\n1. Download Tableau Public (free) and install it.\n2. Open the built-in Superstore sample dataset (File → Open → Superstore).\n3. Create a bar chart: drag Category to Columns, Sales to Rows.\n4. Create a line chart: drag Order Date to Columns (set to Month), Profit to Rows.\n5. Add a filter: drag Region to the Filters shelf and select specific regions.\n6. Create a map: drag State/Province to the canvas — Tableau auto-detects geography.\n7. Build a Dashboard: click "New Dashboard", drag your sheets onto the layout.\n8. Publish your dashboard to Tableau Public (free account required) and share the link.',
      example: null,
      notes: 'Tableau has free training videos at tabsoft.co/learning. Complete the "Getting Started" path.',
    },
    arabic: {
      skill: 'Tableau',
      style: 'arabic',
      explanation_text:
        'Tableau هو برنامج لتصوير البيانات بشكل مرئي. يتيح لك إنشاء رسوم بيانية تفاعلية ولوحات معلومات عن طريق السحب والإفلات — بدون كتابة أي كود. تربط Tableau بمصدر بياناتك (ملف إكسل أو قاعدة بيانات)، ثم تسحب حقلاً مثل "المدينة" إلى محور وحقلاً مثل "المبيعات" إلى المحور الآخر، ويرسم البرنامج الرسم البياني تلقائياً. يُستخدم Tableau كثيراً في وظائف الذكاء التجاري (BI) لأنه يسهّل استكشاف البيانات بصرياً ومشاركة النتائج مع الزملاء. النسخة المجانية Tableau Public متاحة للجميع.',
      example: null,
      notes: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Python
  // ═══════════════════════════════════════════════════════════════
  Python: {
    simple: {
      skill: 'Python',
      style: 'simple',
      explanation_text:
        'Python is a programming language — a way to give a computer step-by-step instructions. For data analysts, Python is used to automate repetitive tasks, clean messy data, and perform analysis that would be too complex for Excel. You write scripts (short programs) that read data files, transform the data, calculate statistics, and create charts. The most popular Python tools for data work are Pandas (for working with tables of data, like Excel but in code) and Matplotlib/Seaborn (for creating charts). Python is valuable because it can handle much larger datasets than Excel and lets you reproduce your analysis exactly by re-running the script.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'Python',
      style: 'visual',
      explanation_text:
        'Think of Python as an assembly line for data:\n\n┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐\n│ RAW DATA │ →  │   PANDAS     │ →  │  ANALYSIS    │ →  │  OUTPUT  │\n│          │    │              │    │              │    │          │\n│ CSV file │    │ df.read_csv()│    │ df.groupby() │    │ Chart    │\n│ Database │    │ df.dropna()  │    │ df.mean()    │    │ Report   │\n│ API      │    │ df.merge()   │    │ df.corr()    │    │ CSV file │\n└──────────┘    └──────────────┘    └──────────────┘    └──────────┘\n\nEach box is a stage. Pandas (a Python library) acts as the workhorse in the middle — it loads your data into a DataFrame (a table), lets you clean and reshape it, and passes it to analysis functions or visualization libraries.',
      example: null,
      notes: null,
    },
    example: {
      skill: 'Python',
      style: 'example',
      explanation_text:
        'Here is a short Python script you can run to analyze a dataset using Pandas.',
      example:
        'import pandas as pd\n\n# Load data from a CSV file\ndf = pd.read_csv("sales.csv")\n\n# Quick look at the data\nprint(df.head())         # First 5 rows\nprint(df.shape)          # (rows, columns)\n\n# Clean: remove rows with missing values\ndf = df.dropna()\n\n# Analyze: total sales by city\ncity_sales = df.groupby("city")["amount"].sum()\nprint(city_sales.sort_values(ascending=False))\n\n# Output:\n# city\n# Amman     45000\n# Irbid     22000\n# Aqaba     15000',
      notes: 'Install Python and Pandas: pip install pandas. Try it in Google Colab (free, runs in your browser).',
    },
    step_by_step: {
      skill: 'Python',
      style: 'step_by_step',
      explanation_text:
        'Follow these steps this week to start learning Python for data analysis:\n\n1. Go to colab.research.google.com — it runs Python in your browser, no installation needed.\n2. In a new notebook, type: print("Hello, Data Analyst!") and press Shift+Enter.\n3. Learn variables and basic math: x = 10; y = 3; print(x / y).\n4. Install Pandas: in a cell type !pip install pandas, then import pandas as pd.\n5. Load a CSV: df = pd.read_csv("https://raw.githubusercontent.com/...sample.csv").\n6. Explore: try df.head(), df.describe(), df.columns, df.shape.\n7. Filter data: df[df["city"] == "Amman"] — returns only Amman rows.\n8. Group and summarize: df.groupby("category")["sales"].mean() — average sales per category.',
      example: null,
      notes: 'Free courses: Kaggle Learn Python, Google\'s Python Class, Coursera "Python for Everybody".',
    },
    arabic: {
      skill: 'Python',
      style: 'arabic',
      explanation_text:
        'بايثون هي لغة برمجة — طريقة لإعطاء الحاسوب تعليمات خطوة بخطوة. لمحللي البيانات، بايثون تُستخدم لأتمتة المهام المتكررة وتنظيف البيانات الفوضوية وإجراء تحليلات معقدة لا يمكن لإكسل التعامل معها. تكتب نصوصاً برمجية (سكربتات) قصيرة تقرأ ملفات البيانات وتحولها وتحسب الإحصائيات وتنشئ رسوماً بيانية. أشهر أدوات بايثون لتحليل البيانات هي مكتبة Pandas (للتعامل مع جداول البيانات) ومكتبة Matplotlib (لإنشاء الرسوم البيانية). بايثون قيّمة لأنها تتعامل مع كميات بيانات أكبر بكثير من إكسل.',
      example: null,
      notes: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Reporting
  // ═══════════════════════════════════════════════════════════════
  Reporting: {
    simple: {
      skill: 'Reporting',
      style: 'simple',
      explanation_text:
        'Reporting is the process of organizing data into summaries to help managers and teams make decisions. Instead of just giving someone a raw spreadsheet, a data analyst creates a report that highlights key metrics like total sales, monthly growth, or performance targets. A good report is clear, accurate, and easy to read. It answers specific business questions quickly so that leaders do not have to guess what the data means.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'Reporting',
      style: 'visual',
      explanation_text:
        'Think of Reporting as a bridge between raw data and business action:\n\n┌──────────────┐     ┌──────────────┐     ┌──────────────┐\n│ RAW DATA     │     │ THE REPORT   │     │ BUSINESS     │\n│ (Messy,      │ ──► │ (Structured, │ ──► │ DECISION     │\n│  Complex)    │     │  Visual)     │     │ (Clear, Fast)│\n└──────────────┘     └──────────────┘     └──────────────┘\n\nA solid report structure includes:\n1. Executive Summary (The "TL;DR")\n2. Key Metrics (KPIs in large text)\n3. Detailed Breakdown (Tables or charts)\n4. Recommendations (What to do next)',
      example: null,
      notes: null,
    },
    example: {
      skill: 'Reporting',
      style: 'example',
      explanation_text:
        'Here is an example of transforming a raw data question into a structured report.',
      example:
        'Business Question: "How did our marketing campaigns perform last month?"\n\nPoor Reporting (Raw Data):\n"Campaign A got 4500 clicks. Campaign B got 3200 clicks. A cost $500, B cost $300."\n\nGood Reporting:\nMonthly Marketing Performance (October)\n----------------------------------------\nTotal Spend: $800\nTotal Clicks: 7,700\n\nWinner: Campaign B\n- While Campaign A drove more total volume, Campaign B was much more efficient, costing only $0.09 per click compared to Campaign A\'s $0.11 per click. Recommendation: Shift 20% of budget to Campaign B next month.',
      notes: 'Always provide context. A number alone means nothing without a comparison or a benchmark.',
    },
    step_by_step: {
      skill: 'Reporting',
      style: 'step_by_step',
      explanation_text:
        'Follow these steps to improve your reporting skills:\n\n1. Define the Audience: Ask who will read this report and what decisions they need to make.\n2. Choose the Metrics: Select 3-5 Key Performance Indicators (KPIs) that actually matter.\n3. Pull the Data: Use SQL or Excel to extract the relevant numbers.\n4. Draft an Executive Summary: Write a 2-3 sentence summary of the main takeaway.\n5. Structure the Layout: Put the most important numbers at the very top.\n6. Add Context: Include month-over-month comparisons or targets so numbers have meaning.\n7. Review for Clarity: Remove any unnecessary jargon or overly complex charts.',
      example: null,
      notes: 'Remember the "3-second rule": A stakeholder should understand the main point of your report within 3 seconds of opening it.',
    },
    arabic: {
      skill: 'Reporting',
      style: 'arabic',
      explanation_text:
        'إعداد التقارير (Reporting) هو عملية تنظيم البيانات في ملخصات لمساعدة المديرين وفرق العمل على اتخاذ القرارات. بدلاً من تسليم جدول بيانات خام، يقوم محلل البيانات بإنشاء تقرير يسلط الضوء على المقاييس الرئيسية مثل إجمالي المبيعات أو النمو الشهري. التقرير الجيد يكون واضحاً ودقيقاً وسهل القراءة، ويجيب على أسئلة العمل المحددة بسرعة حتى لا يضطر القادة إلى تخمين ما تعنيه البيانات.',
      example: null,
      notes: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Communication
  // ═══════════════════════════════════════════════════════════════
  Communication: {
    simple: {
      skill: 'Communication',
      style: 'simple',
      explanation_text:
        'For a Data Analyst, communication means translating complex data into a language that non-technical people can understand. It is not just about speaking clearly; it is about knowing your audience. If you find a brilliant insight using advanced statistics, it is useless if you cannot explain it to the marketing or sales team. Good communication involves writing clear emails, designing easy-to-read charts, and summarizing your findings without hiding behind confusing technical jargon.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'Communication',
      style: 'visual',
      explanation_text:
        'Data Communication is a translation process:\n\n[ Analyst Brain ]                 [ Stakeholder Brain ]\n  p-value < 0.05        ────►       "We are confident"\n  R² = 0.85             ────►       "Strong trend"\n  SQL JOIN              ────►       "Combined data"\n  Outlier detected      ────►       "Unusual event"\n\nEffective communication acts as the filter in the middle. It strips away the complex methodology (the HOW) and delivers the actionable insight (the WHAT and WHY).',
      example: null,
      notes: null,
    },
    example: {
      skill: 'Communication',
      style: 'example',
      explanation_text:
        'Here is an example of adjusting your communication style for different audiences based on the same data finding.',
      example:
        'Finding: A churn model shows users who don\'t upload a profile picture within 2 days have a 70% higher drop-off rate.\n\nCommunicating to another Analyst:\n"Our logistic regression indicates profile picture absence at day 2 is a highly significant predictor of churn (p<0.01)."\n\nCommunicating to the Product Manager:\n"We found a major drop-off point: users who skip the profile picture step are leaving the app. If we add a prompt on day 2 reminding them to upload a photo, we could retain significantly more users."',
      notes: 'Always focus on the "So What?" when speaking to business leaders.',
    },
    step_by_step: {
      skill: 'Communication',
      style: 'step_by_step',
      explanation_text:
        'Follow these steps to improve your data communication:\n\n1. Know Your Audience: Before presenting, ask yourself what the audience\'s goals and technical levels are.\n2. Start with the Conclusion: Do not build suspense. State the most important finding first.\n3. Use the "ELI5" Technique: Practice explaining your analysis as if speaking to a 5-year-old.\n4. Remove Technical Jargon: Replace terms like "heteroscedasticity" or "inner join" with plain English.\n5. Anticipate Questions: Think about what the business will ask next ("Why did this drop?", "What should we do?").\n6. Use Analogies: Compare complex data concepts to everyday situations.\n7. Ask for Feedback: After a presentation, ask a trusted colleague if your main point was clear.',
      example: null,
      notes: 'Practice writing a 1-paragraph summary of every technical project you complete.',
    },
    arabic: {
      skill: 'Communication',
      style: 'arabic',
      explanation_text:
        'بالنسبة لمحلل البيانات، التواصل يعني ترجمة البيانات المعقدة إلى لغة يمكن للأشخاص غير التقنيين فهمها. لا يقتصر الأمر على التحدث بوضوح، بل يتعلق بمعرفة جمهورك. إذا توصلت إلى استنتاج رائع باستخدام إحصاءات متقدمة، فلن يكون له فائدة إذا لم تتمكن من شرحه لفريق التسويق أو المبيعات. التواصل الجيد يشمل كتابة رسائل بريد إلكتروني واضحة، وتصميم رسوم بيانية سهلة القراءة، وتلخيص نتائجك دون الاختباء خلف المصطلحات التقنية المعقدة.',
      example: null,
      notes: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Statistics
  // ═══════════════════════════════════════════════════════════════
  Statistics: {
    simple: {
      skill: 'Statistics',
      style: 'simple',
      explanation_text:
        'Statistics is the science of collecting, analyzing, and interpreting data to make informed decisions. For a Junior Data Analyst, you don\'t need a PhD in math, but you do need to understand the basics. This includes knowing the difference between average (mean) and median, understanding percentages and distributions, and knowing when a trend is real versus just a random coincidence. Statistics stops you from making false claims and helps you prove that your data insights are actually reliable.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'Statistics',
      style: 'visual',
      explanation_text:
        'A core concept in statistics is understanding distribution shapes rather than just averages:\n\nNORMAL DISTRIBUTION (Bell Curve)\n      . ─── .\n    /         \\\n  /             \\\n ─┴──────┴──────┴─\n Low    Avg    High\n\nSKEWED DISTRIBUTION (e.g., Income)\n  . ─ .\n/       \\\n│         \\ . . . . .\n┴─────────┴─────────┴─\nLow      Avg       High\n\nIf you only report the "Average" on a skewed distribution, it will be misleadingly high because of a few extreme outliers. Statistics teaches you to look at the whole shape of the data, not just a single number.',
      example: null,
      notes: null,
    },
    example: {
      skill: 'Statistics',
      style: 'example',
      explanation_text:
        'Here is a real-world example of why basic statistics (Mean vs. Median) matters.',
      example:
        'Scenario: You are calculating the average salary of 5 employees.\nSalaries: $40k, $45k, $50k, $55k, and the CEO makes $900k.\n\nCalculation 1 (Mean/Average):\nTotal = $1,090,000 / 5 = $218,000.\nIf you report "The average salary is $218,000", it is technically true but highly misleading.\n\nCalculation 2 (Median/Middle Value):\nOrder: 40k, 45k, [50k], 55k, 900k.\nThe median is $50,000.\n\nStatistical Insight: Whenever data has extreme outliers (like the CEO), use the Median instead of the Mean to represent the "typical" experience accurately.',
      notes: 'Always check for outliers before calculating averages.',
    },
    step_by_step: {
      skill: 'Statistics',
      style: 'step_by_step',
      explanation_text:
        'Follow these steps to build a practical foundation in Statistics for Data Analysis:\n\n1. Master Descriptive Statistics: Learn how to calculate Mean, Median, Mode, and Standard Deviation.\n2. Understand Distributions: Learn how to read a histogram and identify Normal vs. Skewed data.\n3. Learn about Outliers: Practice identifying extreme values and deciding whether to remove or keep them.\n4. Study Probability Basics: Understand concepts like independent events and basic percentages.\n5. Grasp Correlation vs. Causation: Learn why two trends moving together does not mean one caused the other.\n6. Introduction to A/B Testing: Learn the concept of a control group and a test group.\n7. Apply in Excel/Python: Practice using functions like =MEDIAN() or df.describe() on real datasets.',
      example: null,
      notes: 'The free "Crash Course Statistics" YouTube series is an excellent, math-light way to learn these concepts.',
    },
    arabic: {
      skill: 'Statistics',
      style: 'arabic',
      explanation_text:
        'الإحصاء هو علم جمع البيانات وتحليلها وتفسيرها لاتخاذ قرارات مستنيرة. بصفتك محلل بيانات مبتدئ، لا تحتاج إلى درجة الدكتوراه في الرياضيات، ولكن يجب أن تفهم الأساسيات. يشمل ذلك معرفة الفرق بين المتوسط (Mean) والوسيط (Median)، وفهم النسب المئوية وتوزيعات البيانات، ومعرفة متى يكون الاتجاه حقيقياً مقابل مجرد صدفة عشوائية. الإحصاء يمنعك من تقديم ادعاءات خاطئة ويساعدك على إثبات أن استنتاجاتك مبنية على أساس موثوق.',
      example: null,
      notes: null,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Data Cleaning
  // ═══════════════════════════════════════════════════════════════
  'Data Cleaning': {
    simple: {
      skill: 'Data Cleaning',
      style: 'simple',
      explanation_text:
        'Data Cleaning (or data wrangling) is the process of fixing or removing incorrect, corrupted, incorrectly formatted, duplicate, or incomplete data within a dataset. In the real world, data is almost never perfectly organized. You might find dates formatted in five different ways, missing values, or typos in customer names. If you try to analyze messy data, your results will be wrong ("garbage in, garbage out"). Data Analysts spend a large portion of their time just cleaning data using tools like Excel, SQL, or Python before they ever create a chart or dashboard.',
      example: null,
      notes: null,
    },
    visual: {
      skill: 'Data Cleaning',
      style: 'visual',
      explanation_text:
        'Think of Data Cleaning as a filtering and fixing process:\n\n[ MESSY DATA ]\n ├── "Amman " (trailing space)\n ├── "2023-14-01" (invalid date)\n ├── NULL (missing age)\n ├── "Jorda" (typo)\n │\n ▼ (Cleaning Operations)\n ├── Trim spaces\n ├── Standardize formats\n ├── Impute or drop missing\n ├── Correct spelling\n │\n ▼\n[ CLEAN DATA ]\n ├── "Amman"\n ├── "2023-01-14"\n ├── 25 (median age inserted)\n ├── "Jordan"\n\nOnly clean data can safely enter your reports and dashboards.',
      example: null,
      notes: null,
    },
    example: {
      skill: 'Data Cleaning',
      style: 'example',
      explanation_text:
        'Here is a common data cleaning scenario and how you fix it.',
      example:
        'Scenario: You have a column of Phone Numbers, but users entered them differently:\n- 0791234567\n- +962 79 123 4567\n- 791234567\n- N/A\n\nCleaning Steps (in SQL or Excel):\n1. Handle nulls: Filter out "N/A" or convert to a standard blank.\n2. Remove spaces and symbols: Strip out "+" and " " so only digits remain.\n3. Standardize format: Add the "0" prefix to numbers starting with "79".\n\nResult:\nAll valid numbers now match the standard 10-digit format (0791234567), allowing you to accurately count unique customers.',
      notes: 'Always keep a copy of your raw data before you start cleaning, in case you make a mistake.',
    },
    step_by_step: {
      skill: 'Data Cleaning',
      style: 'step_by_step',
      explanation_text:
        'Follow this checklist when cleaning a new dataset:\n\n1. Remove Duplicates: Identify and delete exact duplicate rows.\n2. Standardize Text: Convert text columns to a consistent case (e.g., all lowercase or Title Case) and trim extra spaces.\n3. Check Data Types: Ensure dates are actually recognized as dates, and numbers are recognized as numbers, not text.\n4. Handle Missing Values: Decide whether to delete rows with missing data or fill them in (impute) with an average or default value.\n5. Fix Structural Errors: Correct consistent typos (like changing "N.Y." to "NY").\n6. Identify Outliers: Look for impossible values (like an age of 200 or a negative price) and correct or remove them.\n7. Validate: Run a quick summary on each column to ensure the data looks correct before starting analysis.',
      example: null,
      notes: 'In Excel, tools like "Remove Duplicates", "Text to Columns", and the TRIM() function are essential for this.',
    },
    arabic: {
      skill: 'Data Cleaning',
      style: 'arabic',
      explanation_text:
        'تنظيف البيانات (Data Cleaning) هو عملية إصلاح أو إزالة البيانات الخاطئة، التالفة، المكررة، أو غير المكتملة داخل مجموعة البيانات. في العالم الحقيقي، نادراً ما تكون البيانات منظمة بشكل مثالي. قد تجد تواريخ مكتوبة بخمس طرق مختلفة، أو قيماً مفقودة، أو أخطاء إملائية. إذا حاولت تحليل بيانات فوضوية، فستكون نتائجك خاطئة ("القمامة التي تدخل هي قمامة تخرج"). يقضي محللو البيانات جزءاً كبيراً من وقتهم في تنظيف البيانات باستخدام أدوات مثل Excel أو SQL أو Python قبل إنشاء أي تقرير.',
      example: null,
      notes: null,
    },
  },
};

// ── Generic fallback for skills not in the top 5 ──────────────────

function genericFallback(skill: string, style: ExplanationStyle): TutorResponse {
  const templates: Record<ExplanationStyle, TutorResponse> = {
    simple: {
      skill,
      style: 'simple',
      explanation_text: `${skill} is a valuable skill for Junior Data Analysts. It helps you work more effectively with data and produce better insights for your team. To get started, search for beginner tutorials online and practice with sample datasets. Many free resources are available on YouTube, Coursera, and Kaggle. The key is consistent practice — spend 30 minutes a day and you will see progress within a few weeks.`,
      example: null,
      notes: null,
    },
    visual: {
      skill,
      style: 'visual',
      explanation_text: `Think of ${skill} as a tool in your data analyst toolkit:\n\n┌─────────────────────────────┐\n│     DATA ANALYST TOOLKIT    │\n│  ┌───────┐  ┌───────┐       │\n│  │ SQL   │  │ Excel │       │\n│  └───────┘  └───────┘       │\n│  ┌───────┐  ┌───────────┐   │\n│  │${skill.padEnd(7)}│  │ Power BI  │   │\n│  └───────┘  └───────────┘   │\n└─────────────────────────────┘\n\nEach tool serves a specific purpose. ${skill} fits into this picture by helping you handle specific data tasks more efficiently.`,
      example: null,
      notes: null,
    },
    example: {
      skill,
      style: 'example',
      explanation_text: `Here is how ${skill} applies in a real data analyst scenario: imagine you receive a dataset with thousands of rows of customer data and need to find patterns. ${skill} helps you process, analyze, or visualize that data efficiently.`,
      example: `To practice ${skill}, find a sample dataset on Kaggle.com, load it into your tool of choice, and try to answer a simple business question like "Which category has the highest revenue?"`,
      notes: `Search for "${skill} tutorial for beginners" to find step-by-step guides.`,
    },
    step_by_step: {
      skill,
      style: 'step_by_step',
      explanation_text: `Follow these steps to start learning ${skill}:\n\n1. Search for "${skill} beginner tutorial" and watch a 15-minute overview video.\n2. Install or access the tool/software required for ${skill}.\n3. Find a sample dataset to practice with (Kaggle.com has many free options).\n4. Follow along with a guided tutorial, reproducing each step yourself.\n5. Try modifying the tutorial to answer a slightly different question.\n6. Practice for 30 minutes daily for one week.\n7. Build a small portfolio project demonstrating your ${skill} ability.`,
      example: null,
      notes: `Consistency matters more than intensity. Regular practice builds lasting skills.`,
    },
    arabic: {
      skill,
      style: 'arabic',
      explanation_text: `${skill} هي مهارة مهمة لمحللي البيانات المبتدئين. تساعدك على العمل بفعالية أكبر مع البيانات وإنتاج رؤى أفضل لفريقك. للبدء، ابحث عن دروس للمبتدئين على الإنترنت وتدرب باستخدام بيانات تجريبية. هناك العديد من الموارد المجانية المتاحة على يوتيوب وكورسيرا وكاغل. المفتاح هو الممارسة المستمرة — خصص 30 دقيقة يومياً وستلاحظ تقدماً خلال أسابيع قليلة.`,
      example: null,
      notes: null,
    },
  };

  return templates[style] ?? templates.simple;
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Get a deterministic fallback explanation for a skill+style combination.
 * Always returns a valid TutorResponse — never null.
 */
export function getFallback(skill: string, style: ExplanationStyle): TutorResponse {
  const skillFallbacks = FALLBACKS[skill];
  if (skillFallbacks && skillFallbacks[style]) {
    return skillFallbacks[style]!;
  }
  return genericFallback(skill, style);
}
