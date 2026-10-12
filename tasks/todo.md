# SQL Cartographer v3.2.0 task checklist

**Status:** Implementation is delivered and local automated gates pass. The
manual 200% browser-zoom review and public Git release remain pending.

**Read first:** [Release specification](../docs/plans/v3.2.0.md) and
[implementation plan](plan.md).

Dependencies refer to task numbers. File lists are primary authored files;
generated `dist/` output is rebuilt with source changes. Split slices that
exceed roughly five authored files or one focused session, including required
wiring, tests, and guide updates. Use the existing browser suite runner.

## 01. Establish the review baseline

- [ ] Choose five inputs and record the current reading problems.
  - Acceptance: Reproducible inputs, before images, five walkthrough actions,
    and sketches of the viewport/inspector at both desktop sizes. Confirm the
    bounded scope and interaction before implementation.
  - Verify: Review against R1–R5; separate observations from proposals.
  - Dependencies: None.
  - Files: `docs/plans/v3.2.0-review.md`; reuse bundled examples and images.
  - Size: Small.
  - Remaining: Five inputs and baseline problems are recorded, but the two
    available v3.1.0 images are approximate references rather than five paired
    captures of the exact fixtures.

### Checkpoint A — Direction

- [ ] The baseline, inspector layout, reading-scale policy, and bounded
  release scope have been reviewed before implementation begins.
  - Remaining: The chosen inspector, scale floor, and lesson scope are
    documented; the baseline review was not captured as five exact before
    images before implementation.

## 02. Isolate flow diagram presentation

- [x] Extract rendering decoration and viewport responsibilities.
  - Acceptance: Typed graph/SVG inputs and page callbacks; existing source and
    object actions remain identical. Register loading order and packaging.
  - Verify: `npm run typecheck`, `npm run build`,
    `npm test -- --suite ui`, `npm run test:file`.
  - Dependencies: 01.
  - Files: `src/app.ts`, `src/ui/flow-diagram.ts`, `index.html`,
    `scripts/package-runtime.mjs`, `tests/ui-tests.ts`.
  - Size: Medium; separate behaviour-preserving moves from features.

## 03. Isolate ERD card and inspector views

- [x] Extract DOM builders; keep state and events in the controller.
  - Acceptance: Cards, inspector, query decoration, selection, and layout
    behave identically; views consume explicit data rather than controller state.
  - Verify: `npm run typecheck`, `npm run build`,
    `npm test -- --suite erd-ui`, `npm run test:file`.
  - Dependencies: 01.
  - Files: `src/ui/erd-page.ts`, `src/ui/erd-view.ts`, `erd.html`,
    `scripts/package-runtime.mjs`, `tests/erd-ui.ts`.
  - Size: Medium; split card and inspector moves if necessary.

## 04. Open diagrams at a useful reading scale

- [x] Implement initial viewport and reversible neighbourhood focus.
  - Acceptance: Labels meet R1; explicit overview still fits the whole graph.
    Focus preserves graph/counts and clears without analysis or navigation loss.
  - Verify: `npm test -- --suite ui`; inspect small/realistic fixtures at both
    desktop sizes, then resize and repeat Refresh.
  - Dependencies: 02.
  - Files: `src/ui/flow-diagram.ts`, `src/app.ts`, `styles.css`,
    `tests/ui-tests.ts`, `docs/USER_GUIDE.md`.
  - Size: Medium.

## 05. Explain selected flow nodes

- [x] Add the evidence inspector and explicit source/object actions.
  - Acceptance: Explain provenance/resolution; expose grouped spans and
    incoming/outgoing kinds. Source actions resolve the correct input;
    inspection itself does not replace the current object.
  - Verify: `npm test -- --suite ui`; check grouped, synthetic, unresolved,
    and multi-file examples using keyboard and pointer.
  - Dependencies: 04.
  - Files: `src/ui/flow-diagram.ts`, `src/app.ts`, `index.html`,
    `tests/ui-tests.ts`, `docs/USER_GUIDE.md`.
  - Size: Medium; split evidence helpers from DOM integration if needed.

## 06. Make diagram styles and legends coherent

- [x] Refine labels, selection states, contrast, and contextual legends.
  - Acceptance: Complete identities remain available; meanings agree with
    canonical exporter styles; legends explain only the kinds present.
  - Verify: Focused UI/ERD suites, semantic parity, and light/dark visual review.
  - Dependencies: 03, 05.
  - Files: Flow slice: `src/exporters.ts`, `src/ui/flow-diagram.ts`,
    `styles.css`, `tests/ui-tests.ts`, `docs/USER_GUIDE.md`. ERD slice:
    `src/ui/erd-view.ts`, `styles.css`, `tests/erd-ui.ts`, `docs/QUERY_BUILDER.md`.
  - Size: Two separate medium slices.

### Checkpoint B — Reading

- [x] Fresh diagrams are legible, evidence is inspectable, focus clears,
  and graph facts and source ranges survive presentation changes.

## 07. Add shared diagnostic presentation

- [x] Build typed, text-safe summary/list helpers and code-specific hints.
  - Acceptance: Keep severity, code, scope, message, and optional span. Unknown
    codes retain their message; absent spans never receive a source action.
  - Verify: `npm run typecheck`, `npm run build`,
    `npm test -- --suite ui`; cover mixed severities and hostile messages.
  - Dependencies: 02.
  - Files: `src/ui/diagnostics.ts`, `index.html`,
    `scripts/package-runtime.mjs`, `tsconfig.strict.json`, `tests/ui-tests.ts`.
  - Size: Medium.

## 08. Make flow diagnostics actionable

- [x] Integrate summary, details, source actions, and readout explanations.
  - Acceptance: Preserve every diagnostic; select valid spans in their input;
    explain confidence/coverage without claiming compiler certainty.
  - Verify: `npm test -- --suite ui`; inspect a long list and a document-wide
    finding while retaining access to diagram controls.
  - Dependencies: 05, 07.
  - Files: `src/app.ts`, `index.html`, `styles.css`, `tests/ui-tests.ts`,
    `docs/USER_GUIDE.md`.
  - Size: Medium.

## 09. Apply the diagnostic rules to ERD

- [x] Integrate the shared presentation on the schema page.
  - Acceptance: Declared/unresolved findings remain distinct; valid DDL spans
    are navigable; the inspector and query window remain usable with details open.
  - Verify: `npm test -- --suite erd-ui`; check malformed DDL and unresolved
    references in both themes.
  - Dependencies: 03, 07.
  - Files: `src/ui/erd-page.ts`, `erd.html`, `styles.css`,
    `tests/erd-ui.ts`, `docs/USER_GUIDE.md`.
  - Size: Medium.

### Checkpoint C — Understanding problems

- [x] Both pages preserve severity/scope and useful source actions without
  inventing locations for document-wide uncertainty.

## 10. Define four introductory lessons

- [x] Add typed lesson metadata and small anonymised inputs.
  - Acceptance: Each has a goal, view/dialect, two or three steps, and a truthful
    takeaway. Advanced scripts remain available; introductory size limits hold.
  - Verify: Analyse inputs with existing fixtures; assert required relationships
    and forbid the unsupported claims described by the lesson.
  - Dependencies: 05, 08.
  - Files: `src/samples.ts`, `tests/ui-tests.ts`, `tests/erd-ui.ts`.
  - Size: Small.

## 11. Guide the first flow sample journey

- [x] Add the named chooser and local lesson instructions.
  - Acceptance: Open the intended view and show the next action; cancelling
    replacement preserves non-empty input/workspace state. No automatic save.
  - Verify: `npm test -- --suite ui`; record first-run and cancellation journeys
    with pasted input and imported workspace files.
  - Dependencies: 08, 10.
  - Files: `src/app.ts`, `index.html`, `styles.css`, `tests/ui-tests.ts`,
    `docs/USER_GUIDE.md`.
  - Size: Medium.

## 12. Guide the first schema lesson journey

- [x] Add the schema lesson beside existing ERD sample choices.
  - Acceptance: Point to a declared key, join, and row note; cancellation
    protects DDL/query/layout state. Reuse the flow lesson instruction pattern.
  - Verify: `npm test -- --suite erd-ui`; build and copy the lesson's query
    using page instructions alone.
  - Dependencies: 09, 10, 11.
  - Files: `src/ui/erd-page.ts`, `src/ui/erd-view.ts`, `erd.html`,
    `tests/erd-ui.ts`, `docs/QUERY_BUILDER.md`.
  - Size: Medium.

## 13. Clarify ERD names and relationship explanations

- [x] Refine existing cards and inspector for the review schema.
  - Acceptance: Clear long-name wrapping with complete identity available;
    readable composite mappings, self-references, and cardinality. Join notes
    expose row repetition and aggregate risk without changing SQL.
  - Verify: `npm test -- --suite erd-ui`; inspect composite/self/bridge cases
    without moving saved positions.
  - Dependencies: 03, 06, 12.
  - Files: `src/ui/erd-view.ts`, `src/ui/erd-page.ts`, `styles.css`,
    `tests/erd-ui.ts`, `docs/QUERY_BUILDER.md`.
  - Size: Medium.

### Checkpoint D — Learning

- [x] Four lessons demonstrate their evidence, protect current input, and
  lead a reviewer through the intended journey in five minutes.

## 14. Keep exports clean and complete

- [x] Exclude transient selection/focus decoration from SVG downloads.
  - Acceptance: Export before/after selection has identical graph facts and
    complete labels; Mermaid/draw.io retain provenance and stable ordering.
  - Verify: `npm test -- --suite ui`, `npm test -- --suite golden`; inspect
    SVG output and draw.io XML for a long-label fixture.
  - Dependencies: 06.
  - Files: `src/app.ts`, `src/ui/flow-diagram.ts`, `tests/ui-tests.ts`,
    `tests/parity.ts`, `docs/USER_GUIDE.md`.
  - Size: Medium.

## 15. Review keyboard access and responsive layouts

- [ ] Complete pointer/keyboard parity and layout review on both pages.
  - Acceptance: Visible focus, labels, predictable close/Escape, and source
    actions work without a pointer. Both themes, 200% zoom, and 768-pixel
    stacked views keep controls reachable without page overflow.
  - Verify: `npm test -- --suite ui`, `npm test -- --suite erd-ui`;
    complete lesson → inspector → diagnostic → export using the keyboard.
  - Dependencies: 11, 13, 14.
  - Files: `styles.css`, `index.html`, `erd.html`, `tests/ui-tests.ts`,
    `tests/erd-ui.ts`; split controller fixes into page-specific slices.
  - Size: Medium per page.
  - Remaining: The 200% browser-zoom walkthrough could not be run here. The
    automated suites cover Enter activation, Escape cancellation, and the
    source/navigation flows; screenshots cover both themes and responsive views.

## 16. Document the contributor's reading path

- [x] Explain how sample input becomes an inspectable diagram and export.
  - Acceptance: One walkthrough identifies analysis, graph, presentation,
    source actions, and fixtures. Architecture/loading order reflects the
    extracted modules and shows where to extend each responsibility.
  - Verify: Follow referenced functions/files, review links/terminology, and
    run documented focused commands during implementation.
  - Dependencies: 15.
  - Files: `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/README.md`,
    `docs/USER_GUIDE.md`, `README.md`.
  - Size: Medium.

## 17. Qualify strict helpers and compatibility

- [x] Extend the strict pilot and retain v3.1.0 saved-file fixtures.
  - Acceptance: New pure helpers pass strict checking; workspace/query/layout
    files retain their meaning. Scripts work as ordered globals, from local
    files, and in the runtime ZIP.
  - Verify: `npx tsc --project tsconfig.strict.json`, `npm test`,
    `npm run test:file`, `npm run package:smoke`, `npm run metrics`.
  - Dependencies: 16.
  - Files: `tsconfig.strict.json`, `tests/workspace.ts`, `tests/query.ts`,
    `tests/erd-ui.ts`, `docs/DEVELOPMENT.md`; split helper typing fixes.
  - Size: Medium.

## 18. Record experience evidence

- [ ] Complete the before/after review sheet and walkthrough results.
  - Acceptance: R1–R5 have observable evidence; record legibility/contrast,
    protected input, usability friction, and limits. Distinguish maintainer
    walkthroughs from any independent developer feedback.
  - Verify: Both desktop sizes, both themes, stacked view, keyboard journey;
    compare `npm run benchmark` with the same environment/inputs.
  - Dependencies: 17.
  - Files: `docs/plans/v3.2.0-review.md` and a bounded set of `docs/assets/` images.
  - Size: Small per scenario.
  - Remaining: Before images are approximate v3.1.0 references, not paired
    captures of all five fixtures. A timed first-time-user walkthrough and
    independent developer feedback remain outstanding.

### Checkpoint E — Ready to prepare the release

- [ ] R1–R5 pass, exports/saved files work, strict helpers and packaging pass,
  and recorded review has no unresolved release blocker.
  - Remaining: Local code and package gates pass. The 200% browser-zoom review
    and timed first-time-user walkthrough are not complete.

## 19. Promote version metadata and metrics

- [x] Bump package/lock together and generate the new metrics snapshot.
  - Acceptance: Matching v3.2.0 versions and measured snapshot; retain historical
    snapshots. Changelog and README claims are supported by checkpoint E.
  - Verify: `npm run metrics:write` after the bump, then `npm run metrics`;
    finish 20 before the complete release-document consistency gate.
  - Dependencies: 18.
  - Files: `package.json`, `package-lock.json`, `docs/metrics-v3.2.0.json`,
    `CHANGELOG.md`, `README.md`.
  - Size: Small; prepare with 20 in one release changeset.

## 20. Write canonical release evidence

- [x] Add the candidate release note and refresh current release documentation.
  - Acceptance: Link verification/experience evidence; record changed
    interactions and limits; claim only completed features. Current references
    agree with package versions.
  - Verify: Review correctness-workflow version checks, relative links,
    release-note path, and metrics path.
  - Dependencies: 19.
  - Files: `docs/releases/v3.2.0.md`, `docs/RELEASES.md`,
    `docs/USER_GUIDE.md`, `docs/ACCURACY.md`, `docs/README.md`.
  - Size: Small; complete with 19 before final gates.

## 21. Run final release qualification

- [ ] Complete local qualification and finish the repository release flow.
  - Acceptance: Every command passes; commit built `dist/` with the release
    changeset; the archive/checksum match the qualified runtime. PR/CI/tag and
    publication follow the authorised repository release flow.
  - Verify:

    ```text
    npm run lint
    npm run typecheck
    npx tsc --project tsconfig.strict.json
    npm run build
    npm test
    npm run test:file
    npm run metrics
    npm run package:smoke
    npm run benchmark
    ```

  - Dependencies: 19, 20.
  - Files: `docs/releases/v3.2.0.md`, `docs/plans/v3.2.0-review.md`;
    generated runtime/release artifacts follow the existing release flow.
  - Size: Small; fix failures in focused slices and rerun affected gates.
  - Local gates pass, package smoke passes, and the ZIP/checksum are prepared.
    Git commit, tag, and publication remain pending because `.git` is read-only
    in this workspace. The manual 200% zoom review is also open.

### Checkpoint F — Release complete

- [ ] Required outcomes are implemented/qualified, metadata/evidence agree,
  and any authorised publication is verified.
  - Remaining: This workspace cannot write Git metadata. The local commit,
    annotated tag, and public runtime release have not been created.
