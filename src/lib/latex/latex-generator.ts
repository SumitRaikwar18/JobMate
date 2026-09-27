/**
 * Deterministic LaTeX ATS Resume Generator for JobMate
 * Converts structured ResumeData into clean, compilable, ATS-first LaTeX (.tex).
 * Complies with single-column ATS parsers and Overleaf/TeX compilers.
 */

export interface LatexResumeInput {
  personal: {
    name: string;
    headline?: string;
    email: string;
    phone?: string;
    location?: string;
    targetRole?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  skills: {
    languages?: string[];
    frameworks?: string[];
    tools?: string[];
    softSkills?: string[];
    aiSkills?: string[];
    backendSkills?: string[];
    dataSkills?: string[];
    frontendSkills?: string[];
    reliabilitySkills?: string[];
  };
  experiences?: Array<{
    id: string;
    role: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    current?: boolean;
    bullets: string[];
  }>;
  projects?: Array<{
    id: string;
    name: string;
    subtitle?: string;
    technologies?: string;
    githubLink?: string;
    liveLink?: string;
    link?: string;
    bullets: string[];
  }>;
  education?: Array<{
    id: string;
    degree: string;
    institution: string;
    location?: string;
    startDate?: string;
    endDate: string;
    score?: string;
  }>;
  achievements?: string[];
}

/**
 * Escapes special LaTeX characters to prevent compile syntax errors
 */
export function escapeLatex(text: string | undefined | null): string {
  if (!text) return "";
  return String(text)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/**
 * Format markdown bold **word** to LaTeX \textbf{word}
 */
export function formatLatexText(text: string | undefined | null): string {
  if (!text) return "";
  // Split by bold pattern **...**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const inner = part.slice(2, -2);
        return `\\textbf{${escapeLatex(inner)}}`;
      }
      return escapeLatex(part);
    })
    .join("");
}

/**
 * Generate full ATS LaTeX source code
 */
export function generateLatexResumeSource(data: LatexResumeInput): string {
  const p = data.personal || {};
  const name = escapeLatex(p.name || "Candidate Name");
  const headline = escapeLatex(p.headline || p.targetRole || "Software Engineer | Applied AI");
  const location = escapeLatex(p.location || "");
  const phone = escapeLatex(p.phone || "");
  const email = escapeLatex(p.email || "");

  // Build header contacts row
  const contacts: string[] = [];
  if (location) contacts.push(location);
  if (phone) contacts.push(phone);
  if (email) contacts.push(`\\href{mailto:${p.email}}{${email}}`);

  const links: string[] = [];
  if (p.linkedin) {
    const cleanLinkedin = p.linkedin.replace(/^https?:\/\/(www\.)?/, "");
    links.push(`\\href{${p.linkedin}}{${escapeLatex(cleanLinkedin)}}`);
  }
  if (p.github) {
    const cleanGithub = p.github.replace(/^https?:\/\/(www\.)?/, "");
    links.push(`\\href{${p.github}}{${escapeLatex(cleanGithub)}}`);
  }
  if (p.portfolio) {
    const cleanPortfolio = p.portfolio.replace(/^https?:\/\/(www\.)?/, "");
    links.push(`\\href{${p.portfolio}}{${escapeLatex(cleanPortfolio)}}`);
  }

  // Build Skills categories
  const skillCategories: Array<{ label: string; items: string[] }> = [];

  const rawSkills = data.skills || {};
  if (rawSkills.aiSkills && rawSkills.aiSkills.length > 0) {
    skillCategories.push({ label: "AI & Generative AI", items: rawSkills.aiSkills });
  }
  if (rawSkills.backendSkills && rawSkills.backendSkills.length > 0) {
    skillCategories.push({ label: "Backend & APIs", items: rawSkills.backendSkills });
  }
  if (rawSkills.languages && rawSkills.languages.length > 0) {
    skillCategories.push({ label: "Languages", items: rawSkills.languages });
  }
  if (rawSkills.frameworks && rawSkills.frameworks.length > 0) {
    skillCategories.push({ label: "Frameworks & Libraries", items: rawSkills.frameworks });
  }
  if (rawSkills.dataSkills && rawSkills.dataSkills.length > 0) {
    skillCategories.push({ label: "Data & Databases", items: rawSkills.dataSkills });
  }
  if (rawSkills.tools && rawSkills.tools.length > 0) {
    skillCategories.push({ label: "Tools & Deployment", items: rawSkills.tools });
  }
  if (rawSkills.softSkills && rawSkills.softSkills.length > 0) {
    skillCategories.push({ label: "Core Competencies", items: rawSkills.softSkills });
  }

  let latex = `%-------------------------
% JobMate ATS-First Single-Column Resume
% Generated dynamically via JobMate Deterministic LaTeX Engine
%-------------------------

\\documentclass[letterpaper,11pt]{article}

%----------PACKAGES----------
\\usepackage[letterpaper,left=0.60in,right=0.60in,top=0.32in,bottom=0.30in]{geometry}
\\usepackage{lmodern}
\\usepackage{cmap}
\\usepackage[T1]{fontenc}
\\usepackage[english]{babel}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\input{glyphtounicode}

%----------ATS / PAGE STYLE----------
\\pagestyle{empty}
\\pdfgentounicode=1
\\urlstyle{same}
\\raggedright
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\linespread{0.95}

%----------SECTION STYLE----------
\\titleformat{\\section}
  {\\bfseries\\large}
  {}{0em}{}
  [\\titlerule]
\\titlespacing*{\\section}{0pt}{3.5pt}{2pt}

%----------LIST SPACING----------
\\setlist[itemize]{
  leftmargin=0.20in,
  itemsep=1.5pt,
  topsep=1.7pt,
  parsep=0pt,
  partopsep=0pt
}

\\newcommand{\\resumeItem}[1]{\\item \\small{#1}}
\\newcommand{\\project}[3]{%
  \\textbf{#1} - \\textit{#2}
  \\hfill
  \\small #3
  \\par\\vspace{1pt}
}

\\begin{document}

%===========================================
% HEADER
%===========================================
\\begin{center}
  {\\LARGE \\textbf{${name}}}\\\\[2pt]
  \\textbf{${headline}}\\\\[4pt]
  \\small
  ${contacts.join(" \\; | \\; ")}
  ${links.length > 0 ? `\\\\[2pt]\n  ${links.join(" \\; | \\; ")}` : ""}
\\end{center}
\\vspace{-3pt}
`;

  // Summary Section
  if (data.summary && data.summary.trim()) {
    latex += `
%===========================================
% SUMMARY
%===========================================
\\section{Summary}
\\small{
${formatLatexText(data.summary.trim())}
}
`;
  }

  // Technical Skills Section
  if (skillCategories.length > 0) {
    latex += `
%===========================================
% TECHNICAL SKILLS
%===========================================
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0in,label={},itemsep=2.0pt,topsep=0.5pt]
${skillCategories
  .map(
    (cat) =>
      `  \\item \\small{\\textbf{${escapeLatex(cat.label)}:} ${cat.items
        .map((i) => escapeLatex(i.trim()))
        .join(", ")}}`
  )
  .join("\n")}
\\end{itemize}
`;
  }

  // Experience Section
  if (data.experiences && data.experiences.length > 0) {
    latex += `
%===========================================
% EXPERIENCE
%===========================================
\\section{Experience}
`;
    data.experiences.forEach((exp) => {
      const dates = `${escapeLatex(exp.startDate)} - ${exp.current ? "Present" : escapeLatex(exp.endDate)}`;
      latex += `\\textbf{${escapeLatex(exp.role)}}
\\hfill
\\small ${dates} \\\\
\\textit{\\small ${escapeLatex(exp.company)}${exp.location ? ` | ${escapeLatex(exp.location)}` : ""}}
\\vspace{2pt}
\\begin{itemize}
${exp.bullets.map((b) => `  \\resumeItem{${formatLatexText(b)}}`).join("\n")}
\\end{itemize}
\\vspace{2pt}
`;
    });
  }

  // Selected Projects Section
  if (data.projects && data.projects.length > 0) {
    latex += `
%===========================================
% SELECTED PROJECTS
%===========================================
\\section{Selected Projects}
`;
    data.projects.forEach((proj) => {
      const projLinks: string[] = [];
      const gh = proj.githubLink || (proj.link?.includes("github.com") ? proj.link : undefined);
      const live = proj.liveLink || (proj.link && !proj.link.includes("github.com") ? proj.link : undefined);

      if (gh) projLinks.push(`\\href{${gh}}{GitHub}`);
      if (live) projLinks.push(`\\href{${live}}{Live}`);
      if (projLinks.length === 0 && proj.link) {
        projLinks.push(`\\href{${proj.link}}{Link}`);
      }

      const linkStr = projLinks.join(" \\; | \\; ");
      const subtitle = proj.subtitle || proj.technologies || "Technical Project";

      latex += `\\project{${escapeLatex(proj.name)}}{${escapeLatex(subtitle)}}{
  ${linkStr}
}
\\begin{itemize}
${proj.bullets.map((b) => `  \\resumeItem{${formatLatexText(b)}}`).join("\n")}
\\end{itemize}
\\vspace{3pt}
`;
    });
  }

  // Education Section
  if (data.education && data.education.length > 0) {
    latex += `
%===========================================
% EDUCATION
%===========================================
\\section{Education}
`;
    data.education.forEach((edu) => {
      const dates = edu.startDate ? `${escapeLatex(edu.startDate)} - ${escapeLatex(edu.endDate)}` : escapeLatex(edu.endDate);
      latex += `\\textbf{${escapeLatex(edu.degree)}}
\\hfill
\\small ${dates} \\\\
\\textit{\\small ${escapeLatex(edu.institution)}${edu.location ? `, ${escapeLatex(edu.location)}` : ""}${edu.score ? ` (${escapeLatex(edu.score)})` : ""}}
\\vspace{2pt}
`;
    });
  }

  // Achievements Section
  if (data.achievements && data.achievements.length > 0) {
    latex += `
%===========================================
% ACHIEVEMENTS
%===========================================
\\section{Achievements}
\\begin{itemize}
${data.achievements.map((ach) => `  \\resumeItem{${formatLatexText(ach)}}`).join("\n")}
\\end{itemize}
`;
  }

  latex += `
\\end{document}
`;

  return latex;
}
