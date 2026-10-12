"use strict";
/* sql-cartographer v3.2.0 — evidence-linked diagnostic views.
   All messages and hints enter the DOM as text; analysis and counts are never
   changed by this presentation layer. */
function diagnosticHint(code) {
    switch (code) {
        case 'dynamic_sql':
            return 'Review the expression that builds this statement; static analysis cannot claim its generated relationships.';
        case 'dialect_ambiguous':
        case 'dialect_low_confidence':
            return 'Choose a dialect explicitly and compare the result with the source.';
        case 'source_opaque':
        case 'column_opaque':
        case 'column_flow_opaque':
            return 'Review this SQL region in the source; relationships inside it may remain unresolved.';
        case 'temp_flow_ambiguous':
            return 'Compare each branch that writes the temporary table with the later reads.';
        case 'catalogue_empty':
        case 'catalogue_partial':
        case 'catalogue_conflict':
            return 'Check the supplied catalogue entries and their object names.';
        case 'schema_unresolved_reference':
        case 'schema_ambiguous_reference':
            return 'Check the referenced table name and include its declaration when available.';
        case 'report_dataset_unresolved':
            return 'Check the dataset name and whether its shared definition is included.';
        case 'unconsumed_input':
        case 'missing_end':
        case 'unexpected_end':
            return 'Check the highlighted statement boundary and its surrounding block.';
        default:
            return '';
    }
}
function diagnosticScopeLabel(diagnostic) {
    return diagnostic.scope === 'document' || (!diagnostic.scope && !diagnostic.span)
        ? 'Document' : 'Region';
}
function renderDiagnosticPanel(summary, details, list, diagnostics, onSource) {
    var doc = list.ownerDocument, values = diagnostics || [], errors = 0, warnings = 0, notes = 0;
    list.textContent = '';
    values.forEach(function (diagnostic) {
        if (diagnostic.severity === 'error')
            errors++;
        else if (diagnostic.severity === 'warning')
            warnings++;
        else
            notes++;
        var item = doc.createElement('li');
        item.className = 'diagnostic-item';
        item.dataset.severity = diagnostic.severity;
        item.dataset.code = diagnostic.code;
        item.dataset.scope = diagnosticScopeLabel(diagnostic).toLowerCase();
        var severity = doc.createElement('span');
        severity.className = 'diagnostic-kind';
        severity.textContent = diagnostic.severity === 'info' ? 'Note' : diagnostic.severity;
        item.appendChild(severity);
        var body = doc.createElement('div');
        body.className = 'diagnostic-detail';
        var code = doc.createElement('code');
        code.className = 'diagnostic-code';
        code.textContent = diagnostic.code;
        body.appendChild(code);
        var scope = doc.createElement('span');
        scope.className = 'diagnostic-scope';
        scope.textContent = diagnosticScopeLabel(diagnostic);
        body.appendChild(scope);
        var message = doc.createElement('p');
        message.className = 'diagnostic-message';
        message.textContent = diagnostic.message;
        body.appendChild(message);
        var hint = diagnosticHint(diagnostic.code);
        if (hint) {
            var tip = doc.createElement('p');
            tip.className = 'diagnostic-hint';
            tip.textContent = hint;
            body.appendChild(tip);
        }
        if (diagnostic.span) {
            var location = doc.createElement('p');
            location.className = 'diagnostic-location';
            location.textContent = 'Source characters ' + diagnostic.span.start + '–' + diagnostic.span.end + '.';
            body.appendChild(location);
        }
        item.appendChild(body);
        var span = diagnostic.span;
        if (span && onSource && Number.isFinite(span.start) && Number.isFinite(span.end) &&
            span.start >= 0 && span.end > span.start) {
            var sourceSpan = span;
            var actions = doc.createElement('div');
            actions.className = 'diagnostic-actions';
            var locate = doc.createElement('button');
            locate.type = 'button';
            locate.className = 'btn';
            locate.dataset.action = 'source';
            locate.textContent = 'Go to source';
            locate.setAttribute('aria-label', 'Go to source at character ' + span.start);
            locate.addEventListener('click', function () { onSource(sourceSpan); });
            actions.appendChild(locate);
            item.appendChild(actions);
        }
        list.appendChild(item);
    });
    var counts = [];
    if (errors)
        counts.push(errors + ' error' + (errors === 1 ? '' : 's'));
    if (warnings)
        counts.push(warnings + ' warning' + (warnings === 1 ? '' : 's'));
    if (notes)
        counts.push(notes + ' note' + (notes === 1 ? '' : 's'));
    var label = values.length + ' diagnostic' + (values.length === 1 ? '' : 's');
    summary.textContent = values.length ? label + ' · ' + counts.join(' · ') : '';
    summary.setAttribute('aria-live', 'polite');
    details.hidden = values.length === 0;
    details.dataset.hasErrors = String(errors > 0);
    if (!values.length)
        details.open = false;
}
function diagnosticSelectSource(sql, gutter, span) {
    var start = Math.max(0, Math.min(sql.value.length, span.start));
    var end = Math.max(start, Math.min(sql.value.length, span.end));
    if (end <= start)
        return;
    sql.focus();
    sql.setSelectionRange(start, end);
    var line = sql.value.slice(0, start).split('\n').length - 1;
    sql.scrollTop = Math.max(0, line * 20 - 80);
    gutter.scrollTop = sql.scrollTop;
}
//# sourceMappingURL=diagnostics.js.map