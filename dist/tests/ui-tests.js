"use strict";
(function () {
    var frame = document.getElementById('app'), output = document.getElementById('results');
    function finish(results) {
        var passed = results.filter(function (r) { return r.pass; }).length;
        document.body.className = passed === results.length ? 'pass' : 'fail';
        document.getElementById('summary').textContent = passed + '/' + results.length + ' tests passed';
        output.textContent = JSON.stringify(results, null, 2);
        /* Named result for scripts/test-all.mjs, which reads this instead of
           scraping the DOM. Named suites (parity, schema, ...) publish their own
           SQL_CARTOGRAPHER_*_PASS globals; UI suites publish this one. */
        window.SQL_CARTOGRAPHER_UI_PASS = passed === results.length;
    }
    frame.addEventListener('load', function () { run(); });
    // The iframe may already have fired 'load' before this script ran (a fast
    // local machine races the off-screen frame), but its document may still be
    // the initial about:blank. Only start once the real page is present, and
    // let the 'load' listener handle the normal case.
    function pageLoaded() {
        try {
            return !!frame.contentDocument && frame.contentDocument.readyState === 'complete' &&
                frame.contentDocument.location.href.indexOf('about:blank') < 0;
        }
        catch (err) {
            return false;
        }
    }
    if (pageLoaded())
        run();
    function run() {
        if (frame.__sqlCartographerRan)
            return;
        frame.__sqlCartographerRan = true;
        var w = frame.contentWindow, d = frame.contentDocument, results = [];
        var get = function (id) { return d.getElementById(id); };
        results.push({ name: 'compact local-processing header',
            pass: !!d.querySelector('.top .privacy-disclosure') &&
                !d.querySelector('.privacy-note') &&
                !!get('btn-draw').closest('.editor-head') &&
                !get('btn-draw').closest('.top') });
        results.push({ name: 'settings and export menus group secondary controls',
            pass: !!get('view-settings-menu').querySelector('#opt-group') &&
                !!get('view-settings-menu').querySelector('#opt-fanin') &&
                !!get('export-menu').querySelector('#btn-copy') &&
                !!get('export-menu').querySelector('#btn-drawio') });
        get('btn-analysis-details').click();
        results.push({ name: 'analysis details expand accessibly',
            pass: !get('analysis-details').hidden &&
                get('btn-analysis-details').getAttribute('aria-expanded') === 'true' });
        get('btn-analysis-details').click();
        var pastedSource = [
            'CREATE OR ALTER PROCEDURE dbo.pasted_once AS',
            'BEGIN',
            '  SELECT 1;',
            'END'
        ].join('\n');
        get('sql').value = pastedSource;
        get('sql').dispatchEvent(new Event('input'));
        get('btn-draw').click();
        results.push({ name: 'single modified CREATE paste remains one clean source',
            pass: get('object-select').options.length === 1 && get('sql').value === pastedSource,
            detail: { objectCount: get('object-select').options.length, source: get('sql').value } });
        var selectedBeforeLesson = get('object-select').value;
        var panelBeforeLesson = get('guided-lesson-panel').hidden;
        get('guided-lesson-menu').querySelector('[data-guided-lesson="branch"]').click();
        var lessonDialog = get('lesson-confirm');
        var lessonCancelOpened = lessonDialog.open;
        get('lesson-confirm-cancel').click();
        results.push({ name: 'cancelling a lesson preserves SQL and selected object',
            pass: lessonCancelOpened && get('sql').value === pastedSource &&
                get('object-select').value === selectedBeforeLesson &&
                get('guided-lesson-panel').hidden === panelBeforeLesson });
        get('guided-lesson-menu').querySelector('[data-guided-lesson="branch"]').click();
        get('lesson-confirm-apply').click();
        results.push({ name: 'a guided branch lesson loads its view, goal, and inspection steps',
            pass: /CREATE PROCEDURE dbo\.CheckCapacity/.test(get('sql').value) &&
                get('opt-dialect').value === 'tsql' && get('opt-view').value === 'flow' &&
                !get('guided-lesson-panel').hidden &&
                get('guided-lesson-steps').children.length === 3 });
        get('opt-scope').value = 'dependencies';
        get('opt-scope').dispatchEvent(new Event('change'));
        get('guided-lesson-menu').querySelector('[data-guided-lesson="temp-flow"]').click();
        get('lesson-confirm-apply').click();
        results.push({ name: 'the temporary-flow lesson opens control flow with a temp-table example',
            pass: /INTO #ActiveCustomer/.test(get('sql').value) && get('opt-view').value === 'flow' &&
                get('opt-scope').value === 'internal' &&
                /temporary-table/.test(get('guided-lesson-goal').textContent) });
        get('guided-lesson-menu').querySelector('[data-guided-lesson="query-pipeline"]').click();
        get('lesson-confirm-apply').click();
        results.push({ name: 'the query-pipeline lesson opens the query view with two CTEs',
            pass: /ActiveOrders/.test(get('sql').value) && /CustomerTotals/.test(get('sql').value) &&
                get('opt-view').value === 'query' &&
                /named query steps/.test(get('guided-lesson-goal').textContent) });
        get('sql').value = 'SELECT 99;';
        get('sql').dispatchEvent(new Event('input'));
        get('btn-sample').click();
        var advancedDialog = get('lesson-confirm');
        var advancedPrompted = advancedDialog.open;
        get('lesson-confirm-cancel').click();
        results.push({ name: 'the representative dialect sample also asks before replacement',
            pass: advancedPrompted && get('sql').value === 'SELECT 99;' });
        var source = [
            'CREATE VIEW dbo.export_students AS SELECT id FROM dbo.student;',
            'GO',
            'CREATE PROCEDURE dbo.refresh_students AS',
            'BEGIN',
            '  EXEC dbo.audit_refresh;',
            '  UPDATE dbo.student SET refreshed = 1;',
            '  SELECT id FROM dbo.export_students;',
            'END'
        ].join('\n');
        get('sql').value = source;
        get('sql').dispatchEvent(new Event('input'));
        get('btn-draw').click();
        results.push({ name: 'multi-object picker',
            pass: get('object-select').options.length === 2 && !get('lbl-object').hidden });
        var scope = get('opt-scope');
        scope.value = 'dependencies';
        scope.dispatchEvent(new Event('change'));
        results.push({ name: 'dependency diagram',
            pass: /reads|writes|calls/.test(get('mermaid-out').textContent) &&
                /Estate/.test(get('proc-name').textContent) });
        var picker = get('object-select');
        picker.value = picker.options[1].value;
        picker.dispatchEvent(new Event('change'));
        scope.value = 'internal';
        scope.dispatchEvent(new Event('change'));
        results.push({ name: 'linked object selection',
            pass: /refresh_students/i.test(get('proc-name').textContent) &&
                /refresh_students/i.test(get('sql').value) });
        get('proc-name').textContent = 'Shortcut pending';
        get('sql').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
        results.push({ name: 'Ctrl+Enter refresh shortcut',
            pass: get('proc-name').textContent !== 'Shortcut pending' &&
                /refresh_students/i.test(get('proc-name').textContent) });
        try {
            var beforeLargeInput = get('mermaid-out').textContent;
            var largeSource = 'SELECT 1;\n' + new Array(w.SQL_CARTOGRAPHER_LARGE_INPUT_THRESHOLD + 16).join(' ');
            get('sql').value = largeSource;
            get('sql').dispatchEvent(new Event('input'));
            results.push({ name: 'large input pauses automatic analysis without losing SQL',
                pass: !get('large-input-notice').hidden &&
                    get('large-input-notice').textContent.indexOf('Automatic analysis is paused') >= 0 &&
                    get('mermaid-out').textContent === beforeLargeInput && get('sql').value === largeSource,
                detail: { length: largeSource.length, notice: get('large-input-notice').textContent } });
            get('btn-draw').click();
            results.push({ name: 'large input still analyses on explicit Refresh',
                pass: get('mermaid-out').textContent !== beforeLargeInput &&
                    get('sql').value === largeSource });
            /* Restore the multi-object source used by the remaining interaction
               checks; the large-input fixture must not change their baseline. */
            get('sql').value = source;
            get('sql').dispatchEvent(new Event('input'));
            get('btn-draw').click();
            if (get('object-select').options.length > 1) {
                get('object-select').value = get('object-select').options[1].value;
                get('object-select').dispatchEvent(new Event('change'));
            }
        }
        catch (err) {
            results.push({ name: 'large input safeguard interaction', pass: false,
                detail: String(err && err.stack || err) });
        }
        results.push({ name: 'confidence and coverage display',
            pass: get('coverage-val').textContent === '100%' &&
                /%$/.test(get('confidence-val').textContent) &&
                /^\d+$/.test(get('diagnostic-val').textContent) });
        results.push({ name: 'analysis health defines its measures and limits',
            pass: /dialect certainty/.test(get('health-note').textContent) &&
                /body tokens/.test(get('health-note').textContent) &&
                /semantic correctness/.test(get('health-note').textContent) });
        results.push({ name: 'analysis health data-band derives from the confidence formula',
            pass: (function () {
                var pct = parseInt(get('confidence-val').textContent, 10);
                var expected = pct >= 85 ? 'high' : pct >= 60 ? 'medium' : 'low';
                return get('analysis-health').getAttribute('data-band') === expected;
            })(),
            detail: { band: get('analysis-health').getAttribute('data-band'),
                pct: get('confidence-val').textContent } });
        results.push({ name: 'construct coverage display',
            pass: /^\d+\/\d+$/.test(get('construct-val').textContent) &&
                /\d+ detected · \d+ resolved · \d+ opaque/.test(get('construct-note').textContent),
            detail: { val: get('construct-val').textContent,
                note: get('construct-note').textContent } });
        var view = get('opt-view');
        view.value = 'flow';
        view.dispatchEvent(new Event('change'));
        var flowCode = get('mermaid-out').textContent;
        view.value = 'query';
        view.dispatchEvent(new Event('change'));
        var queryCode = get('mermaid-out').textContent;
        results.push({ name: 'control flow and query structure selector',
            pass: flowCode !== queryCode && /dbo\.export_students/.test(queryCode) &&
                get('cc-label').textContent === 'Moving parts' });
        view.value = 'flow';
        view.dispatchEvent(new Event('change'));
        setTimeout(function () {
            var node = d.querySelector('#stage .node[data-source-start]'), beforeStart = get('sql').selectionStart, beforeEnd = get('sql').selectionEnd, viewportBeforeSelect = get('stage').style.transform, diagramBeforeSelect = get('mermaid-out').textContent, relationships = Array.prototype.slice.call(d.querySelectorAll('#stage .edgePath,#stage .edgePaths path,#stage .flowchart-link')), beforeEdges = relationships.map(function (edge) { return edge.getAttribute('class'); }).join('|');
            var visualLabel = d.querySelector('#stage .node .label');
            var visualFont = visualLabel ? parseFloat(w.getComputedStyle(visualLabel).fontSize) : 0;
            var scaleMatch = /scale\(([-\d.]+)\)/.exec(get('stage').style.transform);
            var visualScale = scaleMatch ? Number(scaleMatch[1]) : 1;
            results.push({ name: 'flow labels remain at least 12 CSS pixels at the default view scale',
                pass: !!visualLabel && visualFont * visualScale >= 12,
                detail: { font: visualFont, scale: visualScale, rendered: visualFont * visualScale } });
            if (node)
                node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            results.push({ name: 'Enter selects a keyboard-reachable flow step',
                pass: !!node && !get('flow-inspector').hidden &&
                    get('flow-inspector-title').textContent.length > 0 });
            if (!get('flow-clear-focus').hidden)
                get('flow-clear-focus').click();
            if (node)
                node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            var inspector = get('flow-inspector'), sourceAction = d.querySelector('#flow-source-actions button[data-action="source"]');
            results.push({ name: 'selecting a flow node opens its evidence without moving the editor',
                pass: !!node && !!inspector && !inspector.hidden &&
                    get('sql').selectionStart === beforeStart && get('sql').selectionEnd === beforeEnd &&
                    !!sourceAction && get('flow-inspector-title').textContent.length > 0,
                detail: { nodeCount: d.querySelectorAll('#stage .node').length,
                    linkedCount: d.querySelectorAll('#stage .node[data-source-start]').length,
                    inspector: !!inspector && !inspector.hidden,
                    start: get('sql').selectionStart, end: get('sql').selectionEnd,
                    beforeStart: beforeStart, beforeEnd: beforeEnd } });
            if (sourceAction)
                sourceAction.click();
            results.push({ name: 'flow inspector source action selects the exact step',
                pass: !!sourceAction && get('sql').selectionEnd > get('sql').selectionStart &&
                    get('sql').selectionStart === Number(node.getAttribute('data-source-start')) &&
                    get('sql').selectionEnd === Number(node.getAttribute('data-source-end')) });
            var overviewButton = get('z-fit');
            results.push({ name: 'overview control names the view it opens',
                pass: !!overviewButton && /overview/i.test(overviewButton.textContent) &&
                    /overview/i.test(overviewButton.getAttribute('aria-label') || ''),
                detail: overviewButton ? overviewButton.outerHTML : '' });
            var constrainScale = w.flowDiagramConstrainScale;
            results.push({ name: 'default view keeps labels readable while overview fits a large graph',
                pass: typeof constrainScale === 'function' &&
                    constrainScale(0.2, 'reading') >= 0.93 &&
                    constrainScale(0.2, 'overview') <= 0.2 });
            var clearFocus = get('flow-clear-focus');
            results.push({ name: 'selecting a node can highlight its modelled neighbours',
                pass: !!clearFocus && !clearFocus.hidden &&
                    !!d.querySelector('#stage .node.flow-node-selected[data-selected="true"]') &&
                    relationships.some(function (edge) { return /flow-edge-connected/.test(edge.getAttribute('class') || ''); }),
                detail: { clearHidden: clearFocus && clearFocus.hidden,
                    selectedCount: d.querySelectorAll('#stage .node.flow-node-selected[data-selected="true"]').length,
                    edges: relationships.map(function (edge) { return { id: edge.id, cls: edge.getAttribute('class') }; }) } });
            var neighborhood = Array.prototype.slice.call(d.querySelectorAll('#stage .node:not(.flow-node-muted)'));
            var focusBounds = neighborhood.map(function (item) { return item.getBoundingClientRect(); });
            var focusCenter = focusBounds.length ? focusBounds.reduce(function (rect, next) {
                return { left: Math.min(rect.left, next.left), right: Math.max(rect.right, next.right),
                    top: Math.min(rect.top, next.top), bottom: Math.max(rect.bottom, next.bottom) };
            }, { left: focusBounds[0].left, right: focusBounds[0].right,
                top: focusBounds[0].top, bottom: focusBounds[0].bottom }) : null;
            var canvasRect = get('canvas').getBoundingClientRect();
            var focusSafeRight = Math.min(canvasRect.right, get('flow-inspector').getBoundingClientRect().left - 12);
            if (focusSafeRight - canvasRect.left <= 120)
                focusSafeRight = canvasRect.right;
            results.push({ name: 'selecting a step frames its immediate neighbourhood',
                pass: !!focusCenter &&
                    Math.abs((focusCenter.left + focusCenter.right) / 2 - (canvasRect.left + focusSafeRight) / 2) < 8 &&
                    Math.abs((focusCenter.top + focusCenter.bottom) / 2 - (canvasRect.top + canvasRect.bottom) / 2) < 8,
                detail: focusCenter && { bounds: focusCenter, canvas: canvasRect.toJSON() } });
            var selectedSvg = d.querySelector('#stage svg');
            var cleanSvg = w.flowDiagramCloneForExport(selectedSvg);
            results.push({ name: 'temporary focus styling is removed from SVG export without changing the view',
                pass: !!cleanSvg && !cleanSvg.querySelector('.flow-node-selected,.flow-node-muted,.flow-edge-connected,.flow-edge-muted') &&
                    !Array.prototype.some.call(cleanSvg.querySelectorAll('.node'), function (item) {
                        return item.hasAttribute('data-selected') || item.hasAttribute('aria-pressed');
                    }) && !!d.querySelector('#stage .node.flow-node-selected') &&
                    get('mermaid-out').textContent === diagramBeforeSelect });
            var flowLegend = get('flow-legend-items').textContent || '';
            results.push({ name: 'diagram key names provenance and relationship kinds in the view',
                pass: !get('flow-legend').hidden && /Node evidence/.test(flowLegend) &&
                    /source/i.test(flowLegend) && /Relationship kinds/.test(flowLegend) &&
                    /control/i.test(flowLegend), detail: flowLegend });
            if (clearFocus)
                clearFocus.click();
            results.push({ name: 'clearing focus restores every relationship',
                pass: !!clearFocus && clearFocus.hidden &&
                    get('stage').style.transform === viewportBeforeSelect &&
                    Array.prototype.slice.call(d.querySelectorAll('#stage .edgePath,#stage .edgePaths path,#stage .flowchart-link'))
                        .map(function (edge) { return edge.getAttribute('class'); }).join('|') === beforeEdges });
            var inspectorGraph = { nodes: [], edges: [], stats: {} };
            var synthetic = { id: 'lesson-generated', shape: 'rect', text: 'Generated exit',
                cls: 'flowctl', source: null, provenance: 'synthetic', reason: 'procedure ends here' };
            inspectorGraph.nodes = [synthetic];
            w.flowDiagramRenderInspector(inspector, inspectorGraph, synthetic, 100, function () { }, null);
            results.push({ name: 'synthetic nodes explain their reason without a fake source action',
                pass: /Generated by SQL Cartographer: procedure ends here/.test(get('flow-inspector-body').textContent) &&
                    d.querySelectorAll('#flow-source-actions button[data-action="source"]').length === 0 });
            var grouped = { id: 'lesson-grouped', shape: 'rect', text: 'Grouped statements',
                cls: 'src', source: null, provenance: 'source', sources: [{ start: 0, end: 6 }, { start: 7, end: 13 }] };
            inspectorGraph.nodes = [grouped];
            var navigatedSpans = 0;
            w.flowDiagramRenderInspector(inspector, inspectorGraph, grouped, 100, function () { navigatedSpans++; }, null);
            Array.prototype.forEach.call(d.querySelectorAll('#flow-source-actions button[data-action="source"]'), function (button) { button.click(); });
            results.push({ name: 'grouped nodes offer one source action per recorded span',
                pass: navigatedSpans === 2 &&
                    d.querySelectorAll('#flow-source-actions button[data-action="source"]').length === 2 });
            var objectNode = { id: 'lesson-object', shape: 'rect', text: 'dbo.Other',
                cls: 'src', source: null, provenance: 'external', objectId: 'known-object' };
            inspectorGraph.nodes = [objectNode];
            var openedObject = false;
            w.flowDiagramRenderInspector(inspector, inspectorGraph, objectNode, 0, function () { }, function () { openedObject = true; });
            var openObject = d.querySelector('#flow-source-actions button[data-action="object"]');
            results.push({ name: 'known objects open only through the inspector action',
                pass: !!openObject && !openedObject });
            if (openObject)
                openObject.click();
            results.push({ name: 'the explicit object action invokes the controller callback',
                pass: openedObject });
            var external = { id: 'lesson-external', shape: 'rect', text: 'dbo.Customer',
                cls: 'src', source: null, provenance: 'external', resolvedName: 'catalogue.dbo.Customer' };
            inspectorGraph.nodes = [external];
            w.flowDiagramRenderInspector(inspector, inspectorGraph, external, 100, function () { }, null);
            results.push({ name: 'external nodes distinguish a referenced object from supplied source',
                pass: /catalogue resolves it as catalogue\.dbo\.Customer/.test(get('flow-inspector-body').textContent) &&
                    d.querySelectorAll('#flow-source-actions button[data-action="source"]').length === 0 });
            var invalidSpan = { id: 'lesson-invalid-span', shape: 'rect', text: 'No evidence',
                cls: 'src', source: { start: -1, end: 2 }, provenance: 'source' };
            inspectorGraph.nodes = [invalidSpan];
            w.flowDiagramRenderInspector(inspector, inspectorGraph, invalidSpan, 10, function () { }, null);
            results.push({ name: 'invalid node ranges never get a source action',
                pass: d.querySelectorAll('#flow-source-actions button[data-action="source"]').length === 0 });
            get('sql').value = 'END SELECT (1;';
            get('sql').dispatchEvent(new Event('input'));
            get('opt-dialect').value = 'tsql';
            get('btn-draw').click();
            results.push({ name: 'malformed input health warning',
                pass: parseInt(get('coverage-val').textContent, 10) < 100 &&
                    parseInt(get('diagnostic-val').textContent, 10) >= 2 &&
                    get('analysis-health').getAttribute('data-band') === 'low' });
            var diagnosticRows = Array.prototype.slice.call(d.querySelectorAll('#analysis-diagnostic-list li'));
            results.push({ name: 'flow diagnostics keep severity, code, scope, and source actions',
                pass: !get('analysis-diagnostics').hidden && diagnosticRows.length >= 2 &&
                    diagnosticRows.every(function (row) {
                        return !!row.dataset.severity && !!row.dataset.code && !!row.dataset.scope;
                    }) && !!get('analysis-diagnostic-summary').textContent,
                detail: { summary: get('analysis-diagnostic-summary').textContent,
                    rows: diagnosticRows.map(function (row) { return row.outerHTML.slice(0, 200); }) } });
            var diagnosticSource = d.querySelector('#analysis-diagnostic-list button[data-action="source"]');
            if (diagnosticSource)
                diagnosticSource.click();
            results.push({ name: 'a flow diagnostic selects its reported source span',
                pass: !!diagnosticSource && get('sql').selectionEnd > get('sql').selectionStart &&
                    get('sql').selectionStart >= 0 && get('sql').selectionEnd <= get('sql').value.length });
            get('opt-dialect').value = 'tsql';
            get('sql').value = [
                'CREATE PROC dbo.rec_ui AS',
                'BEGIN',
                '  WITH r(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM r WHERE n<10)',
                '  SELECT n FROM r;',
                'END'
            ].join('\n');
            get('sql').dispatchEvent(new Event('input'));
            get('btn-draw').click();
            results.push({ name: 'informational annotations do not inflate findings count',
                pass: get('diagnostic-val').textContent === '0' &&
                    parseInt(get('confidence-val').textContent, 10) >= 85,
                detail: { diag: get('diagnostic-val').textContent,
                    conf: get('confidence-val').textContent } });
            results.push({ name: 'local Mermaid runtime',
                pass: !!w.mermaid && !Array.prototype.some.call(d.scripts, function (s) {
                    return /^https?:/i.test(s.getAttribute('src') || '');
                }) });
            /* The flowchart inserts Mermaid SVG via innerHTML; that is safe only
               under the strict security level. Fail loudly if it is ever relaxed. */
            var mermaidRuntime = w.mermaid;
            var mermaidConfig = (function () {
                try {
                    return mermaidRuntime && mermaidRuntime.mermaidAPI && mermaidRuntime.mermaidAPI.getConfig();
                }
                catch (e) {
                    return null;
                }
            })();
            results.push({ name: 'Mermaid renders under strict security level',
                pass: !!mermaidConfig && mermaidConfig.securityLevel === 'strict',
                detail: { securityLevel: mermaidConfig ? mermaidConfig.securityLevel : 'unavailable' } });
            /* v1.8.0 usable local workspace — dependency filtering and opt-in
               persistence (save → restore identical, explicit clear). */
            w.clearWorkspace();
            var depSource = [
                'CREATE VIEW dbo.dep_view AS SELECT id FROM dbo.student;',
                'GO',
                'CREATE PROC dbo.dep_proc AS',
                'BEGIN',
                '  EXEC dbo.dep_callee;',
                '  UPDATE dbo.student SET x = 1;',
                '  SELECT id FROM dbo.dep_view;',
                'END'
            ].join('\n');
            get('sql').value = depSource;
            get('sql').dispatchEvent(new Event('input'));
            get('btn-draw').click();
            get('object-select').options.length; /* analyse estate */
            get('opt-scope').value = 'dependencies';
            get('opt-scope').dispatchEvent(new Event('change'));
            var filterShown = get('filter-menu').style.display !== 'none';
            var fullDep = get('mermaid-out').textContent;
            get('f-w').checked = false;
            get('f-w').dispatchEvent(new Event('change'));
            var filteredDep = get('mermaid-out').textContent;
            get('btn-filter-reset').click();
            var resetDep = get('mermaid-out').textContent;
            results.push({ name: 'dependency filter panel shows only in dependency scope',
                pass: filterShown && fullDep.length > 0,
                detail: { shown: filterShown, full: fullDep.slice(0, 80) } });
            results.push({ name: 'dependency filtering is presentation-only in the UI',
                pass: fullDep !== filteredDep && filteredDep.length < fullDep.length &&
                    resetDep === fullDep,
                detail: { full: fullDep.slice(0, 120), filtered: filteredDep.slice(0, 120),
                    reset: resetDep.slice(0, 120) } });
            var persistenceSource = [
                'CREATE PROC dbo.ws_persist AS',
                'BEGIN',
                '  SELECT 1;',
                'END'
            ].join('\n');
            get('opt-scope').value = 'internal';
            get('opt-scope').dispatchEvent(new Event('change'));
            get('opt-dialect').value = 'tsql';
            get('sql').value = persistenceSource;
            get('sql').dispatchEvent(new Event('input'));
            get('btn-draw').click();
            var capturedCode = get('mermaid-out').textContent;
            get('btn-ws-save').click();
            get('sql').value = 'SELECT changed;';
            get('sql').dispatchEvent(new Event('input'));
            get('btn-draw').click();
            get('btn-ws-restore').click();
            var restoredCode = get('mermaid-out').textContent;
            results.push({ name: 'opt-in save then restore reproduces identical analysis',
                pass: get('sql').value.indexOf('ws_persist') >= 0 && capturedCode === restoredCode,
                detail: { captured: capturedCode.slice(0, 80), restored: restoredCode.slice(0, 80),
                    sql: get('sql').value.slice(0, 60) } });
            get('btn-ws-forget').click();
            results.push({ name: 'forgetting a saved workspace is explicit',
                pass: w.hasSavedWorkspace() === false &&
                    /No workspace is saved/i.test(get('ws-status').textContent || ''),
                detail: { saved: w.hasSavedWorkspace(), status: get('ws-status').textContent } });
            /* v1.9.0 resolve by catalogue — paste catalogue metadata, Apply, and
               verify the dependency view shows the verified object (no external
               label) while an unproven three-part name stays external. */
            get('opt-scope').value = 'internal';
            get('opt-dialect').value = 'tsql';
            get('sql').value = [
                'CREATE PROC dbo.cat_ui AS',
                'BEGIN',
                '  SELECT id FROM salesdb.dbo.orders;',
                '  SELECT id FROM readme.dbo.ghost;',
                'END'
            ].join('\n');
            get('sql').dispatchEvent(new Event('input'));
            get('catalogue-text').value = 'salesdb.dbo.orders TABLE';
            get('btn-catalogue-apply').click();
            get('opt-scope').value = 'dependencies';
            get('opt-scope').dispatchEvent(new Event('change'));
            var catalogued = get('mermaid-out').textContent;
            results.push({ name: 'catalogue verification in the dependency view',
                pass: catalogued.indexOf('salesdb.dbo.orders') >= 0 &&
                    catalogued.indexOf('external: salesdb.dbo.orders') < 0 &&
                    catalogued.indexOf('external: readme.dbo.ghost') >= 0 &&
                    /Loaded: 1 object/i.test(get('catalogue-status').textContent || ''),
                detail: { code: catalogued.slice(0, 160),
                    status: get('catalogue-status').textContent } });
            get('btn-catalogue-clear').click();
            results.push({ name: 'clearing the catalogue resets its status',
                pass: /No catalogue loaded/i.test(get('catalogue-status').textContent || ''),
                detail: { status: get('catalogue-status').textContent } });
            /* v1.12.0 report import — paste an SSRS/RDL definition, Apply, verify the
               status summary distinguishes embedded/shared/unresolved datasets, and
               select an embedded dataset so its SQL loads and analyses. */
            get('opt-scope').value = 'internal';
            get('opt-dialect').value = 'tsql';
            var rdlText = '<Report xmlns="http' + '://schemas.microsoft.com/sqlserver/reporting/2008/01/reportdefinition">\n' +
                '<DataSets>\n' +
                '  <DataSet Name="Students"><Query>\n' +
                '    <DataSourceName>SchoolDB</DataSourceName>\n' +
                '    <CommandText>SELECT StudentId FROM dbo.Student</CommandText>\n' +
                '  </Query></DataSet>\n' +
                '  <DataSet Name="Rollup"><SharedDataSet>\n' +
                '    <SharedDataSetReference>Shared/Rollup</SharedDataSetReference>\n' +
                '  </SharedDataSet></DataSet>\n' +
                '  <DataSet Name="Broken"></DataSet>\n' +
                '</DataSets>\n</Report>';
            get('report-text').value = rdlText;
            get('btn-report-apply').click();
            var reportStatus = get('report-status').textContent || '';
            var datasetOptions = Array.prototype.map.call(get('report-dataset-select').options, function (o) { return String(o.textContent); });
            results.push({ name: 'report import distinguishes embedded, shared, and unresolved datasets',
                pass: /1 report · 3 datasets · 1 embedded · 1 shared · 1 unresolved/i.test(reportStatus) &&
                    datasetOptions.length === 3 &&
                    datasetOptions.some(function (t) { return /Students — embedded/i.test(t); }) &&
                    datasetOptions.some(function (t) { return /Rollup — shared/i.test(t); }) &&
                    datasetOptions.some(function (t) { return /Broken — unresolved/i.test(t); }),
                detail: { status: reportStatus, options: datasetOptions } });
            var beforeCode = get('mermaid-out').textContent;
            Array.prototype.forEach.call(get('report-dataset-select').options, function (o) {
                if (/Students/.test(o.textContent))
                    get('report-dataset-select').value = o.value;
            });
            get('report-dataset-select').dispatchEvent(new Event('change'));
            var afterCode = get('mermaid-out').textContent;
            results.push({ name: 'selecting an embedded dataset loads and analyses its SQL',
                pass: get('sql').value.indexOf('SELECT StudentId FROM dbo.Student') >= 0 &&
                    afterCode !== beforeCode && /dbo\.Student/i.test(afterCode) &&
                    /Students — embedded/.test(get('report-dataset-select').selectedOptions[0].textContent || ''),
                detail: { sql: get('sql').value.slice(0, 80),
                    code: afterCode.slice(0, 120), before: beforeCode.slice(0, 120) } });
            get('btn-report-clear').click();
            results.push({ name: 'clearing the report resets its status and picker',
                pass: /No report definition loaded/i.test(get('report-status').textContent || '') &&
                    get('report-dataset-select').disabled === true,
                detail: { status: get('report-status').textContent } });
            /* v1.13.0 report intelligence — the Report dependencies scope renders the
               report → dataset → object → column chain and its presentation-only
               filter hides the column layer without changing the underlying graph. */
            get('report-text').value = rdlText;
            get('btn-report-apply').click();
            get('opt-scope').value = 'report';
            get('opt-scope').dispatchEvent(new Event('change'));
            var reportGraphCode = get('mermaid-out').textContent;
            var reportStats = get('stats').textContent || '';
            results.push({ name: 'report dependencies scope renders the report chain',
                pass: reportGraphCode.indexOf('Report') >= 0 &&
                    reportGraphCode.indexOf('Students') >= 0 &&
                    reportGraphCode.indexOf('dbo.Student') >= 0 &&
                    reportGraphCode.indexOf('StudentId') >= 0 &&
                    /Reports · 1 report/i.test(get('proc-name').textContent || '') &&
                    /Reports/.test(reportStats) &&
                    get('report-filter-menu').style.display !== 'none',
                detail: { code: reportGraphCode.slice(0, 160), stats: reportStats,
                    name: get('proc-name').textContent } });
            var fullReportCode = get('mermaid-out').textContent;
            get('rf-cols').checked = false;
            get('rf-cols').dispatchEvent(new Event('change'));
            var filteredReportCode = get('mermaid-out').textContent;
            results.push({ name: 'report filter hides columns presentation-only in the UI',
                pass: filteredReportCode.indexOf('StudentId') < 0 &&
                    fullReportCode.indexOf('StudentId') >= 0 &&
                    filteredReportCode.length < fullReportCode.length,
                detail: { full: fullReportCode.slice(0, 120),
                    filtered: filteredReportCode.slice(0, 120) } });
            get('btn-report-filter-reset').click();
            get('rf-cols').checked = true;
            get('btn-report-clear').click();
            get('opt-scope').value = 'internal';
            get('opt-scope').dispatchEvent(new Event('change'));
            /* Exercise the debounce boundary after a real wait. The earlier checks
               validate the immediate notice and explicit refresh; this second pass
               proves no automatic run appears after the normal 350 ms delay. */
            var delayedLargeSource = 'SELECT 1;\n' +
                new Array(w.SQL_CARTOGRAPHER_LARGE_INPUT_THRESHOLD + 16).join(' ');
            var delayedBefore = get('mermaid-out').textContent;
            get('sql').value = delayedLargeSource;
            get('sql').dispatchEvent(new Event('input'));
            setTimeout(function () {
                results.push({ name: 'large input remains paused beyond debounce',
                    pass: !get('large-input-notice').hidden &&
                        get('mermaid-out').textContent === delayedBefore &&
                        get('sql').value === delayedLargeSource });
                get('btn-draw').click();
                results.push({ name: 'delayed large input refreshes explicitly',
                    pass: get('mermaid-out').textContent !== delayedBefore &&
                        get('sql').value === delayedLargeSource });
                finish(results);
            }, 500);
        }, 1200);
    }
})();
//# sourceMappingURL=ui-tests.js.map