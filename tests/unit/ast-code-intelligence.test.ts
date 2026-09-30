import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { LanguageDetector } from "../../src/lib/ai/code-intelligence/language-detector";
import { ASTAnalyzer } from "../../src/lib/ai/code-intelligence/ast-analyzer";
import { ASTEvidenceExtractor } from "../../src/lib/ai/code-intelligence/evidence-extractor";
import { CodeIntelligence } from "../../src/lib/ai/code-intelligence/parser";
import { GitHubEvidenceMiner } from "../../src/lib/ai/github/github-evidence-miner";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures/code-intelligence");

function readFixture(relPath: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, relPath), "utf-8");
}

describe("AST Code Intelligence - Multi-Language AST Analysis", () => {
  beforeEach(() => {
    ASTAnalyzer.clearCache();
  });

  describe("1. Language Detection", () => {
    it("detects TypeScript and TSX files correctly", () => {
      expect(LanguageDetector.detectLanguage("src/api/users.ts").language).toBe("typescript");
      expect(LanguageDetector.detectLanguage("src/components/Button.tsx").language).toBe("typescript");
    });

    it("detects JavaScript and JSX files correctly", () => {
      expect(LanguageDetector.detectLanguage("server.js").language).toBe("javascript");
      expect(LanguageDetector.detectLanguage("App.jsx").language).toBe("javascript");
    });

    it("detects Python files correctly", () => {
      expect(LanguageDetector.detectLanguage("backend/main.py").language).toBe("python");
    });

    it("detects Java files correctly", () => {
      expect(LanguageDetector.detectLanguage("src/main/java/App.java").language).toBe("java");
    });

    it("detects Go files correctly", () => {
      expect(LanguageDetector.detectLanguage("cmd/server/main.go").language).toBe("go");
    });

    it("detects Rust files correctly", () => {
      expect(LanguageDetector.detectLanguage("src/lib.rs").language).toBe("rust");
    });

    it("reports repository language distribution correctly", () => {
      const fileTree = [
        "src/app.ts",
        "src/index.ts",
        "backend/main.py",
        "services/user.go",
        "README.md",
      ];
      const distribution = LanguageDetector.detectRepositoryLanguages(fileTree);
      expect(distribution.length).toBe(3);
      expect(distribution[0]!.language).toBe("typescript");
      expect(distribution[0]!.fileCount).toBe(2);
    });
  });

  describe("2. TypeScript AST Extraction", () => {
    it("extracts interfaces, classes, methods, and Supabase calls", async () => {
      const tsCode = readFixture("typescript/api-user.ts");
      const result = await ASTAnalyzer.analyzeFile("src/api/users.ts", tsCode);

      expect(result.status).toBe("success");
      expect(result.language).toBe("typescript");

      // Interfaces
      const interfaceSym = result.facts.symbols.find((s) => s.name === "UserDTO");
      expect(interfaceSym).toBeDefined();
      expect(interfaceSym?.kind).toBe("interface");
      expect(interfaceSym?.range.startLine).toBeGreaterThan(0);

      // Classes
      const classSym = result.facts.symbols.find((s) => s.name === "UserService");
      expect(classSym).toBeDefined();
      expect(classSym?.kind).toBe("class");

      // Database Calls
      const dbCall = result.facts.databaseCalls.find((d) => d.technology === "Supabase");
      expect(dbCall).toBeDefined();
      expect(dbCall?.tableOrModel).toBe("users");

      // Frameworks
      const supabaseFw = result.facts.frameworks.find((f) => f.name === "Supabase");
      expect(supabaseFw).toBeDefined();
    });

    it("extracts React components and hooks from TSX", async () => {
      const tsxCode = readFixture("typescript/react-component.tsx");
      const result = await ASTAnalyzer.analyzeFile("src/components/UserProfile.tsx", tsxCode);

      expect(result.status).toBe("success");

      const hookSym = result.facts.symbols.find((s) => s.name === "useUserData");
      expect(hookSym).toBeDefined();
      expect(hookSym?.kind).toBe("react_hook");

      const compSym = result.facts.symbols.find((s) => s.name === "UserProfileCard");
      expect(compSym).toBeDefined();
      expect(compSym?.kind).toBe("react_component");

      const reactFw = result.facts.frameworks.find((f) => f.name === "React");
      expect(reactFw).toBeDefined();
    });
  });

  describe("3. JavaScript AST Extraction", () => {
    it("extracts Express routes and error handling", async () => {
      const jsCode = readFixture("javascript/service.js");
      const result = await ASTAnalyzer.analyzeFile("server/service.js", jsCode);

      expect(result.status).toBe("success");
      expect(result.language).toBe("javascript");

      // Routes
      expect(result.facts.httpEndpoints.length).toBeGreaterThanOrEqual(2);
      const getHealth = result.facts.httpEndpoints.find((e) => e.path === "/api/v1/health");
      expect(getHealth?.method).toBe("GET");
      expect(getHealth?.framework).toBe("Express");

      const postOrder = result.facts.httpEndpoints.find((e) => e.path === "/api/v1/orders");
      expect(postOrder?.method).toBe("POST");

      // Error handling
      expect(result.facts.errorHandlingCount).toBeGreaterThan(0);
    });
  });

  describe("4. Python AST Extraction", () => {
    it("extracts FastAPI endpoints and SQLAlchemy queries", async () => {
      const pyCode = readFixture("python/app.py");
      const result = await ASTAnalyzer.analyzeFile("backend/app.py", pyCode);

      expect(result.status).toBe("success");
      expect(result.language).toBe("python");

      // Endpoints
      const getUserEp = result.facts.httpEndpoints.find((e) => e.path === "/api/v1/users/{user_id}");
      expect(getUserEp).toBeDefined();
      expect(getUserEp?.method).toBe("GET");
      expect(getUserEp?.framework).toBe("FastAPI");

      // Database
      const dbCall = result.facts.databaseCalls.find((d) => d.technology === "SQLAlchemy");
      expect(dbCall).toBeDefined();

      // Classes
      const modelSym = result.facts.symbols.find((s) => s.name === "UserCreate");
      expect(modelSym).toBeDefined();
      expect(modelSym?.kind).toBe("class");
    });

    it("extracts Pytest test suites and assertions", async () => {
      const testPyCode = readFixture("python/test_service.py");
      const result = await ASTAnalyzer.analyzeFile("tests/test_service.py", testPyCode);

      expect(result.status).toBe("success");
      expect(result.facts.tests.length).toBeGreaterThan(0);
      expect(result.facts.tests[0]!.framework).toBe("Pytest");
      expect(result.facts.tests[0]!.testNames).toContain("test_user_creation_validation");
      expect(result.facts.tests[0]!.assertionsCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe("5. Java AST Extraction", () => {
    it("extracts Spring REST controller, routes, and JPA queries", async () => {
      const javaCode = readFixture("java/UserController.java");
      const result = await ASTAnalyzer.analyzeFile("src/main/java/UserController.java", javaCode);

      expect(result.status).toBe("success");
      expect(result.language).toBe("java");

      const classSym = result.facts.symbols.find((s) => s.name === "UserController");
      expect(classSym).toBeDefined();
      expect(classSym?.annotationsOrDecorators).toContain("@RestController");

      // Endpoints
      const getEp = result.facts.httpEndpoints.find((e) => e.method === "GET");
      expect(getEp).toBeDefined();
      expect(getEp?.framework).toBe("Spring");

      // Database
      const dbCall = result.facts.databaseCalls.find((d) => d.technology === "SpringData");
      expect(dbCall).toBeDefined();
    });

    it("extracts JUnit tests and assertions", async () => {
      const testJavaCode = readFixture("java/UserServiceTest.java");
      const result = await ASTAnalyzer.analyzeFile("src/test/java/UserServiceTest.java", testJavaCode);

      expect(result.status).toBe("success");
      expect(result.facts.tests.length).toBeGreaterThan(0);
      expect(result.facts.tests[0]!.framework).toBe("JUnit");
      expect(result.facts.tests[0]!.testNames).toContain("testUserCreationSuccess");
      expect(result.facts.tests[0]!.assertionsCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe("6. Go AST Extraction", () => {
    it("extracts Go structs, methods, Gin routes, and SQL queries", async () => {
      const goCode = readFixture("go/main.go");
      const result = await ASTAnalyzer.analyzeFile("cmd/main.go", goCode);

      expect(result.status).toBe("success");
      expect(result.language).toBe("go");

      const structSym = result.facts.symbols.find((s) => s.name === "UserRequest");
      expect(structSym).toBeDefined();
      expect(structSym?.kind).toBe("struct");

      const methodSym = result.facts.symbols.find((s) => s.name === "RegisterRoutes");
      expect(methodSym).toBeDefined();
      expect(methodSym?.kind).toBe("method");

      // Gin Routes
      const getRoute = result.facts.httpEndpoints.find((e) => e.path === "/api/v1/users" && e.method === "GET");
      expect(getRoute).toBeDefined();
      expect(getRoute?.framework).toBe("Gin");

      // Database
      const dbCall = result.facts.databaseCalls.find((d) => d.technology === "SQL");
      expect(dbCall).toBeDefined();
    });

    it("extracts Go test functions and assertions", async () => {
      const goTestCode = readFixture("go/main_test.go");
      const result = await ASTAnalyzer.analyzeFile("cmd/main_test.go", goTestCode);

      expect(result.status).toBe("success");
      expect(result.facts.tests.length).toBeGreaterThan(0);
      expect(result.facts.tests[0]!.framework).toBe("GoTest");
      expect(result.facts.tests[0]!.testNames).toContain("TestUserRequestValidation");
    });
  });

  describe("7. Rust AST Extraction", () => {
    it("extracts Rust structs, Actix Web handlers, and SQLx queries", async () => {
      const rustCode = readFixture("rust/main.rs");
      const result = await ASTAnalyzer.analyzeFile("src/main.rs", rustCode);

      expect(result.status).toBe("success");
      expect(result.language).toBe("rust");

      const structSym = result.facts.symbols.find((s) => s.name === "UserRecord");
      expect(structSym).toBeDefined();
      expect(structSym?.kind).toBe("struct");

      const fnSym = result.facts.symbols.find((s) => s.name === "get_user");
      expect(fnSym).toBeDefined();
      expect(fnSym?.isAsync).toBe(true);

      // Actix Routes
      const getRoute = result.facts.httpEndpoints.find((e) => e.method === "GET");
      expect(getRoute).toBeDefined();
      expect(getRoute?.framework).toBe("Actix");

      // SQLx
      const dbCall = result.facts.databaseCalls.find((d) => d.technology === "SQLx");
      expect(dbCall).toBeDefined();
    });

    it("extracts Rust test modules and assertions", async () => {
      const rustTestCode = readFixture("rust/lib_test.rs");
      const result = await ASTAnalyzer.analyzeFile("tests/lib_test.rs", rustTestCode);

      expect(result.status).toBe("success");
      expect(result.facts.tests.length).toBeGreaterThan(0);
      expect(result.facts.tests[0]!.framework).toBe("RustTest");
      expect(result.facts.tests[0]!.testNames).toContain("test_user_record_creation");
      expect(result.facts.tests[0]!.assertionsCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("8. Incremental Caching & Failure Isolation", () => {
    it("reuses cached AST result when content hash is unchanged", async () => {
      const code = "export function sample() { return 42; }";
      const res1 = await ASTAnalyzer.analyzeFile("src/sample.ts", code);
      const res2 = await ASTAnalyzer.analyzeFile("src/sample.ts", code);

      expect(res1.contentHash).toBe(res2.contentHash);
      expect(res1).toBe(res2); // identical object from memory cache
    });

    it("gracefully isolates malformed code without throwing an unhandled crash", async () => {
      const malformed = "const x = ;;; {{invalid syntax";
      const res = await ASTAnalyzer.analyzeFile("src/broken.ts", malformed);

      // TypeScript parser returns empty or partial AST gracefully
      expect(res).toBeDefined();
      expect(res.filePath).toBe("src/broken.ts");
    });
  });

  describe("9. AST Evidence Extraction & Provenance", () => {
    it("converts AST parse results into verifiable EvidenceItems with exact ranges", async () => {
      const tsCode = readFixture("typescript/api-user.ts");
      const { parseResult, evidenceItems } = await CodeIntelligence.extractEvidenceFromSource(
        "src/api/users.ts",
        tsCode,
        {
          candidateId: "cand_123",
          repository: "owner/repo",
          commitSha: "abc1234",
          author: "sumitraikwar",
        }
      );

      expect(parseResult.status).toBe("success");
      expect(evidenceItems.length).toBeGreaterThan(0);

      // Check L4 evidence item provenance
      const dbEv = evidenceItems.find((e) => e.title.includes("Database Operations"));
      expect(dbEv).toBeDefined();
      expect(dbEv?.evidenceLevel).toBe("L4_SOURCE_CODE");
      expect(dbEv?.repository).toBe("owner/repo");
      expect(dbEv?.commitSha).toBe("abc1234");
      expect(dbEv?.sourceUri).toContain("src/api/users.ts#L");
    });
  });

  describe("10. Multi-Signal GitHub Evidence Miner Integration", () => {
    it("mines AST source code evidence alongside manifest, commit, and CI signals", async () => {
      const items = await GitHubEvidenceMiner.mineRepositoryEvidence("cand_123", {
        owner: "JobMateCorp",
        repo: "CoreService",
        manifests: {
          "package.json": JSON.stringify({
            dependencies: { "@supabase/supabase-js": "^2.0.0", express: "^4.18.0" },
          }),
        },
        sourceFiles: {
          "src/users.ts": readFixture("typescript/api-user.ts"),
          "tests/test_service.py": readFixture("python/test_service.py"),
        },
        ciWorkflows: ["ci.yml"],
        recentCommits: [
          {
            sha: "commit_789",
            message: "feat: add user service",
            date: "2026-09-30T12:00:00Z",
            author: "sumitraikwar",
          },
        ],
      });

      expect(items.length).toBeGreaterThanOrEqual(5);

      const hasManifest = items.some((i) => i.evidenceLevel === "L3_MANIFEST_DEPENDENCY");
      const hasASTSource = items.some((i) => i.evidenceLevel === "L4_SOURCE_CODE");
      const hasASTTest = items.some((i) => i.evidenceLevel === "L6_TEST_CI");
      const hasCommits = items.some((i) => i.evidenceLevel === "L5_COMMIT_PR");

      expect(hasManifest).toBe(true);
      expect(hasASTSource).toBe(true);
      expect(hasASTTest).toBe(true);
      expect(hasCommits).toBe(true);
    });
  });
});
