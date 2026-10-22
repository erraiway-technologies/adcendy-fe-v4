import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HOME_SECTIONS,
  LANDING_SUB_TARGETS,
  MOVED_SECTIONS,
} from "../../features/landing/landing-sections.ts";

const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const NAVIGATION_SOURCES = [
  "features/landing/components/home/SiteHeader.tsx",
  "features/landing/components/home/SiteFooter.tsx",
];

const FOOTERS = [
  "features/landing/components/home/SiteFooter.tsx",
];

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

/** Every id declared on an element in these files — literal or data-driven. */
function declaredIds(files: string[]): string[] {
  return files.flatMap((file) => {
    const source = read(file);
    return [
      ...[...source.matchAll(/\bid="([a-z0-9-]+)"/g)].map((m) => m[1]!),
      // An FAQ entry that can be linked to carries its id as data.
      ...[...source.matchAll(/\bid: '([a-z0-9-]+)'/g)].map((m) => m[1]!),
    ];
  });
}

function publicRoutes(): Set<string> {
  const routes = new Set<string>();
  const walk = (dir: string, segments: string[]) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const segment = /^\(.*\)$/.test(entry.name) ? null : entry.name;
        walk(join(dir, entry.name), segment ? [...segments, segment] : segments);
      } else if (entry.name === "page.tsx") {
        routes.add("/" + segments.join("/"));
      }
    }
  };
  walk("app", []);
  return routes;
}

const ALL_TARGETS = [
  ...Object.values(HOME_SECTIONS),
  ...Object.values(LANDING_SUB_TARGETS),
];

/** The homepage's own files, and the FAQ data it renders. */
function homeFiles(): string[] {
  const dir = "features/landing/components/home";
  return [
    "features/landing/components/LandingPage.tsx",
    ...readdirSync(join(ROOT, dir))
      .filter((name) => name.endsWith(".tsx"))
      .map((name) => `${dir}/${name}`),
    "features/landing/content/faq.ts",
  ];
}

test("every nav and footer target lands exactly once on the homepage", () => {
  const ids = declaredIds(homeFiles());
  const problems = ALL_TARGETS.flatMap(({ id }) => {
    const count = ids.filter((declared) => declared === id).length;
    return count === 1 ? [] : [`#${id} declared ${count} times`];
  });
  assert.deepEqual(problems, []);
});

test("every public page wears the site header and footer", () => {
  const layout = read("app/(public)/layout.tsx");
  assert.match(layout, /<SiteHeader \/>/);
  assert.match(layout, /<SiteFooter \/>/);
});

test("navs and footer link sections only through the shared list", () => {
  // A hand-written '/#pricing' can drift from the page; SectionLink with an
  // id from HOME_SECTIONS cannot. It also scrolls on a repeat click, which
  // a plain hash link does not.
  for (const source of NAVIGATION_SOURCES) {
    const handWritten = [...read(source).matchAll(/href[:=]\s*['"{`][^'"`}]*#/g)].map(
      (match) => match[0],
    );
    assert.deepEqual(handWritten, [], `${source} hand-writes a section link`);
    assert.match(read(source), /SectionLink/, `${source} does not use SectionLink`);
  }
});

test("every page link in the footer points at a route that exists", () => {
  const routes = publicRoutes();
  const pageLinks = FOOTERS.flatMap((footer) =>
    [...read(footer).matchAll(/href: '([^']+)'/g)].map((match) => match[1]!),
  );

  assert.ok(pageLinks.length > 0, "found no page links to check");
  assert.deepEqual(
    pageLinks.filter((href) => !routes.has(href)),
    [],
  );
});

test("each nav label is used once, so two links never claim the same place", () => {
  const labels = ALL_TARGETS.map(({ label }) => label);
  assert.deepEqual(
    labels.filter((label, i) => labels.indexOf(label) !== i),
    [],
  );
});

test("an old link to a moved section lands on a page and place that exist", () => {
  const routes = publicRoutes();
  const pageIds = declaredIds(
    readdirSync(join(ROOT, "features/landing/components/pages"))
      .filter((name) => name.endsWith(".tsx"))
      .map((name) => `features/landing/components/pages/${name}`),
  );
  const homeIds = declaredIds(homeFiles());
  const problems = Object.entries(MOVED_SECTIONS).flatMap(([oldId, target]) => {
    const [path, hash] = target.split("#");
    return [
      ...(routes.has(path!) ? [] : [`#${oldId} goes to missing page ${path}`]),
      ...(hash && !pageIds.includes(hash) ? [`#${oldId} goes to missing #${hash}`] : []),
      // Still on the homepage would mean it never moved.
      ...(homeIds.includes(oldId) ? [`#${oldId} is still on the homepage`] : []),
    ];
  });
  assert.deepEqual(problems, []);
});
