import { describe, expect, test } from "bun:test";
import { createWindow } from "@mixmark-io/domino";
import { createContext, runInContext } from "node:vm";
import { bundleTestScripts } from "./bundle-test-scripts.mjs";
import {
  cleanRepoDescription,
  githubRepoFactsFromSource,
  githubRepoNoteMarkdown,
  githubRepoNoteTitle,
  githubRepoTarget,
  readmeLead,
} from "./src/github-repo.ts";

const labels = {
  capturedAt: "2026-10-01T00:00:00.000Z",
  sourceLabel: "来源",
  capturedAtLabel: "抓取时间",
  homepageLabel: "主页",
  languageLabel: "语言",
  licenseLabel: "许可证",
  topicsLabel: "话题",
};

const source = (overrides = {}) => ({
  pageUrl: "https://github.com/CottonChou/stillnote",
  openGraphDescription: "",
  embeddedJsonChunks: [],
  aboutText: "",
  homepage: "",
  topics: [],
  license: "",
  language: "",
  readmeParagraphs: [],
  ...overrides,
});

const sidebarPayload = (overrides = {}) => JSON.stringify({
  payload: {
    sidebarAbout: {
      description: "Open-source, AI-native knowledge base.",
      website: "https://stillnote.org",
      topics: [{ name: "notes" }, { name: "mcp" }, { name: "notes" }],
      ownerLogin: "CottonChou",
      repoName: "stillnote",
      stargazerCount: 1915,
      forksCount: 995,
      repo: { license: { spdxId: "AGPL-3.0", name: "GNU Affero General Public License v3.0" } },
      ...overrides,
    },
  },
});

describe("github repository addresses", () => {
  test("accepts a repository home and a code tree, and ignores other GitHub pages", () => {
    expect(githubRepoTarget("https://github.com/CottonChou/stillnote")).toEqual({
      owner: "CottonChou",
      name: "stillnote",
      canonicalUrl: "https://github.com/CottonChou/stillnote",
    });
    expect(githubRepoTarget("https://www.github.com/CottonChou/stillnote/?tab=readme-ov-file#readme")?.canonicalUrl)
      .toBe("https://github.com/CottonChou/stillnote");
    expect(githubRepoTarget("https://github.com/CottonChou/stillnote/tree/main")?.canonicalUrl)
      .toBe("https://github.com/CottonChou/stillnote");
    expect(githubRepoTarget("https://github.com/CottonChou/stillnote/tree/release/1.0/apps")?.canonicalUrl)
      .toBe("https://github.com/CottonChou/stillnote");
    expect(githubRepoTarget("https://github.com/CottonChou/stillnote/issues/12")).toBeNull();
    expect(githubRepoTarget("https://github.com/CottonChou/stillnote/pull/4")).toBeNull();
    expect(githubRepoTarget("https://github.com/CottonChou/stillnote/blob/main/README.md")).toBeNull();
    expect(githubRepoTarget("https://github.com/CottonChou/stillnote/tree")).toBeNull();
    expect(githubRepoTarget("https://github.com/CottonChou")).toBeNull();
    expect(githubRepoTarget("https://gist.github.com/CottonChou/stillnote")).toBeNull();
    expect(githubRepoTarget("https://example.com/CottonChou/stillnote")).toBeNull();
  });
});

describe("github repository card", () => {
  test("captures rendered repository facts when initial JSON is missing or too large", () => {
    const [script] = bundleTestScripts(["capture-github"]);
    for (const json of ["", JSON.stringify({ ownerLogin: "CottonChou", readme: "x".repeat(500_000) })]) {
      const window = createWindow(`
        <meta name="octolytics-dimension-repository_nwo" content="CottonChou/stillnote">
        <script type="application/json">${json}</script>
        <div class="sidebarSection__oqw6Y8">
          <h2>About</h2><p class="description__ej4leF">A portable notes workspace.</p>
          <div class="websiteRow__c4vvco"><a href="https://stillnote.org">stillnote.org</a></div>
          <a href="/topics/notes">notes</a>
          <a href="#license"><svg class="octicon-law"></svg>AGPL-3.0 license</a>
        </div>`, "https://github.com/CottonChou/stillnote/tree/main");
      Object.getPrototypeOf(window.document.querySelectorAll("span"))[Symbol.iterator] ??= Array.prototype[Symbol.iterator];
      let result;
      runInContext(script, createContext({
        document: window.document,
        location: window.location,
        __stillnoteGithubClipPayload: { requestId: "regression" },
        chrome: { runtime: { sendMessage: (message) => { result = message.result; } } },
      }));
      expect(result?.ok).toBe(true);
      expect(result.source.embeddedJsonChunks).toEqual([]);
      expect(githubRepoFactsFromSource(result.source)).toMatchObject({
        owner: "CottonChou", name: "stillnote", intro: "A portable notes workspace.",
        homepage: "https://stillnote.org/", topics: ["notes"], license: "AGPL-3.0",
      });
      expect(githubRepoFactsFromSource({ ...result.source, repositoryNwo: "other/repo" })).toBeNull();
      expect(githubRepoFactsFromSource({ ...result.source, repositoryNwo: undefined })).toBeNull();
      expect(githubRepoFactsFromSource({ ...result.source, pageUrl: "https://github.com/features/copilot" })).toBeNull();
    }
  });

  test("drops GitHub's generated description and the repository suffix", () => {
    expect(cleanRepoDescription(
      "Open-source notes. - CottonChou/stillnote",
      "CottonChou",
      "stillnote",
    )).toBe("Open-source notes.");
    expect(cleanRepoDescription(
      "Open-source notes &amp; sync. - stillnote/apps at main · CottonChou/stillnote",
      "CottonChou",
      "stillnote",
    )).toBe("Open-source notes & sync.");
    expect(cleanRepoDescription(
      "Contribute to CottonChou/stillnote development by creating an account on GitHub.",
      "CottonChou",
      "stillnote",
    )).toBe("");
  });

  test("uses the first real README paragraph when the about text is empty", () => {
    expect(readmeLead(["", "ok", "This is the project introduction."])).toBe("This is the project introduction.");
    expect(readmeLead(["字".repeat(900)]).endsWith("…")).toBe(true);
    expect(readmeLead(["字".repeat(900)]).length).toBe(801);
  });

  test("builds a card from the repository payload and leaves out live counters", () => {
    const facts = githubRepoFactsFromSource(source({
      pageUrl: "https://github.com/CottonChou/StillNote/tree/main/apps",
      openGraphDescription: "Open-source, AI-native knowledge base. - CottonChou/stillnote",
      embeddedJsonChunks: [sidebarPayload()],
      language: "TypeScript 62.1%",
      topics: ["notes", "sqlite"],
    }));
    expect(facts).toMatchObject({
      owner: "CottonChou",
      name: "stillnote",
      canonicalUrl: "https://github.com/CottonChou/stillnote",
      intro: "Open-source, AI-native knowledge base.",
      homepage: "https://stillnote.org/",
      language: "TypeScript",
      license: "AGPL-3.0",
      topics: ["notes", "mcp", "sqlite"],
    });
    const markdown = githubRepoNoteMarkdown({ ...facts, ...labels });
    expect(githubRepoNoteTitle(facts.owner, facts.name)).toBe("CottonChou/stillnote");
    expect(markdown.startsWith("Open-source, AI-native knowledge base.")).toBe(true);
    expect(markdown).toContain("主页: [stillnote.org](https://stillnote.org/)");
    expect(markdown).toContain("语言: TypeScript");
    expect(markdown).toContain("许可证: AGPL-3.0");
    expect(markdown).toContain("话题: notes, mcp, sqlite");
    expect(markdown).toContain("[https://github.com/CottonChou/stillnote](https://github.com/CottonChou/stillnote)");
    expect(markdown).toContain("抓取时间: 2026-10-01T00:00:00.000Z");
    expect(markdown).not.toContain("1915");
    expect(markdown).not.toContain("995");
  });

  test("reads a code tree that only identifies the repository, then uses the README lead", () => {
    const facts = githubRepoFactsFromSource(source({
      pageUrl: "https://github.com/CottonChou/stillnote/tree/main",
      openGraphDescription: "Contribute to CottonChou/stillnote development by creating an account on GitHub.",
      embeddedJsonChunks: [JSON.stringify({
        payload: {
          codeViewLayoutRoute: {
            repo: { ownerLogin: "CottonChou", name: "stillnote", defaultBranch: "main" },
          },
        },
      })],
      readmeParagraphs: ["Go", "A portable notes workspace for long-term writing."],
    }));
    expect(facts?.intro).toBe("A portable notes workspace for long-term writing.");
    expect(facts?.homepage).toBe("");
    expect(facts?.topics).toEqual([]);
    const markdown = githubRepoNoteMarkdown({ ...facts, ...labels });
    expect(markdown).not.toContain("主页:");
    expect(markdown).not.toContain("话题:");
    expect(markdown).toContain("来源: [https://github.com/CottonChou/stillnote](https://github.com/CottonChou/stillnote)");
  });

  test("does not treat an unrelated GitHub page as the repository in the address", () => {
    expect(githubRepoFactsFromSource(source({
      pageUrl: "https://github.com/features/copilot",
      openGraphDescription: "AI pair programmer.",
      embeddedJsonChunks: [sidebarPayload()],
    }))).toBeNull();
    expect(githubRepoFactsFromSource(source({
      pageUrl: "https://github.com/CottonChou/stillnote/issues/8",
      embeddedJsonChunks: [sidebarPayload()],
    }))).toBeNull();
  });
});
