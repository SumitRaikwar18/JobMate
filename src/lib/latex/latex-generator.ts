/**
 * Deterministic LaTeX ATS Resume Generator for JobMate
 * Converts structured ResumeData into clean, compilable, ATS-first LaTeX (.tex).
 * Complies with single-column ATS parsers and Overleaf/TeX compilers.
 */

export interface LatexResumeInput {
  personal: {
    name: string;
    headline?: string | undefined;
    email: string;
    phone?: string | undefined;
    location?: string | undefined;
    targetRole?: string | undefined;
    linkedin?: string | undefined;
    github?: string | undefined;
    portfolio?: string | undefined;
  };
  summary?: string | undefined;
  skills: {
    languages?: string[] | undefined;
    frameworks?: string[] | undefined;
    tools?: string[] | undefined;
    softSkills?: string[] | undefined;
    aiSkills?: string[] | undefined;
    backendSkills?: string[] | undefined;
    dataSkills?: string[] | undefined;
    frontendSkills?: string[] | undefined;
    reliabilitySkills?: string[] | undefined;
  };
  experiences?: Array<{
    id: string;
    role: string;
    company: string;
    location?: string | undefined;
    startDate: string;
    endDate: string;
    current?: boolean | undefined;
    bullets: string[];
  }> | undefined;
  projects?: Array<{
    id: string;
    name: string;
    subtitle?: string | undefined;
    technologies?: string | undefined;
    githubLink?: string | undefined;
    liveLink?: string | undefined;
    link?: string | undefined;
    bullets: string[];
  }> | undefined;
  education?: Array<{
    id: string;
    degree: string;
    institution: string;
    location?: string | undefined;
    startDate?: string | undefined;
    endDate: string;
    score?: string | undefined;
  }> | undefined;
  achievements?: string[] | undefined;
  templateId?: string | undefined;
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

  const tid = data.templateId || "modern-clean";

  // Customize layout parameters based on template ID
  let geometryStr = "left=0.60in,right=0.60in,top=0.32in,bottom=0.30in";
  let fontPkg = "\\usepackage{lmodern}";
  let itemSep = "1.5pt";
  let lineSpread = "0.95";
  let sectionTitleFormat = "\\titleformat{\\section}{\\bfseries\\large}{}{0em}{}[\\titlerule]";

  if (tid === "tech-minimalist" || tid === "minimal") {
    geometryStr = "left=0.50in,right=0.50in,top=0.25in,bottom=0.25in";
    itemSep = "1.0pt";
    lineSpread = "0.92";
    sectionTitleFormat = "\\titleformat{\\section}{\\bfseries\\normalsize\\scshape}{}{0em}{}[\\titlerule]";
  } else if (tid === "ivy-classic" || tid === "classic") {
    geometryStr = "left=0.65in,right=0.65in,top=0.40in,bottom=0.38in";
    fontPkg = "\\usepackage{mathpazo}";
    itemSep = "1.8pt";
    lineSpread = "0.98";
    sectionTitleFormat = "\\titleformat{\\section}{\\bfseries\\large\\scshape}{}{0em}{}[\\titlerule]";
  } else if (tid === "executive-pro") {
    geometryStr = "left=0.60in,right=0.60in,top=0.35in,bottom=0.35in";
    fontPkg = "\\usepackage{lmodern}";
    itemSep = "1.6pt";
    lineSpread = "0.96";
    sectionTitleFormat = "\\titleformat{\\section}{\\bfseries\\large}{}{0em}{}[\\vspace{-2pt}\\rule{\\textwidth}{1pt}]";
  } else if (tid === "ai-researcher" || tid === "technical") {
    geometryStr = "left=0.55in,right=0.55in,top=0.30in,bottom=0.30in";
    fontPkg = "\\usepackage{lmodern}";
    itemSep = "1.2pt";
    lineSpread = "0.94";
    sectionTitleFormat = "\\titleformat{\\section}{\\bfseries\\large}{}{0em}{}[\\titlerule]";
  }

  let latex = `%-------------------------
% JobMate ATS-First Single-Column Resume (Template: ${escapeLatex(tid)})
% Generated dynamically via JobMate Deterministic LaTeX Engine
%-------------------------

\\documentclass[letterpaper,11pt]{article}

%----------PACKAGES----------
\\usepackage[letterpaper,${geometryStr}]{geometry}
${fontPkg}
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
\\linespread{${lineSpread}}

%----------SECTION STYLE----------
${sectionTitleFormat}
\\titlespacing*{\\section}{0pt}{3.5pt}{2pt}

%----------LIST SPACING----------
\\setlist[itemize]{
  leftmargin=0.20in,
  itemsep=${itemSep},
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
