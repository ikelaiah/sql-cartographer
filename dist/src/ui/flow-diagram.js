"use strict";
function flowDiagramConstrainScale(fit, mode = 'reading') {
    var floor = mode === 'overview' ? 0.15 : 0.93;
    return Math.max(floor, Math.min(1, Number.isFinite(fit) ? fit : 1));
}
function flowDiagramApply(stage, view) {
    stage.style.transform = 'translate(' + view.panX + 'px,' + view.panY + 'px) scale(' + view.scale + ')';
}
function flowDiagramCloneForExport(svg) {
    var clone = svg.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.flow-node-selected,.flow-node-muted,.flow-edge-connected,.flow-edge-muted'), function (element) {
        element.classList.remove('flow-node-selected', 'flow-node-muted', 'flow-edge-connected', 'flow-edge-muted');
    });
    Array.prototype.forEach.call(clone.querySelectorAll('.node'), function (element) {
        element.removeAttribute('data-selected');
        element.removeAttribute('aria-pressed');
        element.removeAttribute('tabindex');
        element.removeAttribute('role');
    });
    return clone;
}
function flowDiagramFit(stage, canvas, view, mode = 'reading') {
    stage.style.transform = 'none';
    view.scale = 1;
    view.panX = 0;
    view.panY = 0;
    var svg = stage.querySelector('svg');
    if (!svg) {
        flowDiagramApply(stage, view);
        return;
    }
    var drawing = svg.getBoundingClientRect(), frame = canvas.getBoundingClientRect();
    var width = drawing.width || svg.viewBox.baseVal.width || 1;
    var height = drawing.height || svg.viewBox.baseVal.height || 1;
    var fit = Math.min(1, Math.max(1, frame.width - 40) / width, Math.max(1, frame.height - 40) / height);
    view.scale = flowDiagramConstrainScale(fit, mode);
    if (mode === 'overview' || fit >= 0.92) {
        view.panX = Math.max(0, (frame.width - width * view.scale) / 2 - (drawing.left - frame.left));
        view.panY = Math.max(0, (frame.height - height * view.scale) / 2 - (drawing.top - frame.top));
    }
    flowDiagramApply(stage, view);
}
function flowDiagramHighlightSource(sql, gutter, span) {
    if (!span || span.start === undefined || span.end === undefined)
        return;
    diagnosticSelectSource(sql, gutter, span);
}
function flowDiagramFindNode(element, graph) {
    return (graph.nodes || []).filter(function (node) {
        return element.id === node.id || element.id.indexOf('-' + node.id + '-') >= 0;
    })[0] || null;
}
function flowDiagramAttachNodes(stage, graph, onAction) {
    Array.prototype.forEach.call(stage.querySelectorAll('.node'), function (element) {
        var node = flowDiagramFindNode(element, graph);
        if (!node)
            return;
        var selectedNode = node;
        element.setAttribute('data-provenance', selectedNode.provenance || 'source');
        if (selectedNode.source) {
            element.setAttribute('data-source-start', String(selectedNode.source.start));
            element.setAttribute('data-source-end', String(selectedNode.source.end));
        }
        if (selectedNode.objectId)
            element.setAttribute('data-object-id', selectedNode.objectId);
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', 'Select diagram step: ' + selectedNode.text);
        element.setAttribute('aria-pressed', 'false');
        element.addEventListener('click', function (event) {
            event.stopPropagation();
            onAction(selectedNode, event);
        });
        element.addEventListener('keydown', function (event) {
            var keyEvent = event;
            if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                keyEvent.preventDefault();
                onAction(selectedNode, event);
            }
        });
    });
}
function flowDiagramEdgeForElement(element, graph) {
    return (graph.edges || []).filter(function (edge) {
        return (element.id || '').indexOf('-' + edge.from + '-' + edge.to + '-') >= 0;
    })[0] || null;
}
function flowDiagramSetFocus(stage, graph, selectedId) {
    var relatedNodes = {}, relatedEdges = {};
    if (selectedId) {
        relatedNodes[selectedId] = 1;
        (graph.edges || []).forEach(function (edge) {
            if (edge.from === selectedId || edge.to === selectedId) {
                relatedNodes[edge.from] = 1;
                relatedNodes[edge.to] = 1;
                relatedEdges[edge.from + '\u001f' + edge.to] = 1;
            }
        });
    }
    Array.prototype.forEach.call(stage.querySelectorAll('.node'), function (element) {
        var node = flowDiagramFindNode(element, graph);
        if (!node)
            return;
        var selected = node.id === selectedId;
        element.classList.toggle('flow-node-selected', selected);
        element.classList.toggle('flow-node-muted', !!selectedId && !relatedNodes[node.id]);
        element.setAttribute('data-selected', String(selected));
        element.setAttribute('aria-pressed', String(selected));
    });
    Array.prototype.forEach.call(stage.querySelectorAll('.edgePath,.edgePaths path,.flowchart-link'), function (element) {
        var edge = flowDiagramEdgeForElement(element, graph);
        var connected = !!(selectedId && edge && relatedEdges[edge.from + '\u001f' + edge.to]);
        element.classList.toggle('flow-edge-connected', connected);
        element.classList.toggle('flow-edge-muted', !!selectedId && !connected);
    });
}
function flowDiagramFrameFocus(stage, canvas, view, graph, selectedId, inspector) {
    var related = {};
    related[selectedId] = 1;
    (graph.edges || []).forEach(function (edge) {
        if (edge.from === selectedId || edge.to === selectedId) {
            related[edge.from] = 1;
            related[edge.to] = 1;
        }
    });
    /* Measure before the frame transform so repeated selections do not compound
       offsets or scale. A 93% floor keeps the default 13px labels at 12px. */
    stage.style.transform = 'none';
    var focusRects = [];
    Array.prototype.forEach.call(stage.querySelectorAll('.node'), function (element) {
        var node = flowDiagramFindNode(element, graph);
        if (!node || !related[node.id])
            return;
        focusRects.push(element.getBoundingClientRect());
    });
    if (!focusRects.length) {
        flowDiagramApply(stage, view);
        return;
    }
    var bounds = focusRects.reduce(function (current, rect) {
        return { left: Math.min(current.left, rect.left), right: Math.max(current.right, rect.right),
            top: Math.min(current.top, rect.top), bottom: Math.max(current.bottom, rect.bottom) };
    }, { left: focusRects[0].left, right: focusRects[0].right,
        top: focusRects[0].top, bottom: focusRects[0].bottom });
    var frame = canvas.getBoundingClientRect(), width = Math.max(1, bounds.right - bounds.left), height = Math.max(1, bounds.bottom - bounds.top);
    var availableRight = frame.right;
    if (inspector && !inspector.hidden) {
        var inspectorLeft = inspector.getBoundingClientRect().left;
        var candidateRight = Math.min(frame.right, inspectorLeft - 12);
        if (candidateRight - frame.left > 120)
            availableRight = candidateRight;
    }
    var focusCenterX = (frame.left + availableRight) / 2;
    var focusWidth = Math.max(1, availableRight - frame.left);
    view.scale = flowDiagramConstrainScale(Math.min(1, (focusWidth * 0.84) / width, (frame.height * 0.72) / height), 'reading');
    view.panX = focusCenterX - frame.left - ((bounds.left + bounds.right) / 2 - frame.left) * view.scale;
    view.panY = frame.height / 2 - ((bounds.top + bounds.bottom) / 2 - frame.top) * view.scale;
    flowDiagramApply(stage, view);
}
function flowDiagramRenderLegend(panel, target, graph) {
    target.textContent = '';
    var nodes = graph && graph.nodes ? graph.nodes : [], edges = graph && graph.edges ? graph.edges : [];
    var provenances = {}, kinds = {};
    nodes.forEach(function (node) { provenances[node.provenance || 'source'] = 1; });
    edges.forEach(function (edge) { kinds[edge.kind || 'dependency'] = 1; });
    var provenanceNames = {
        source: 'From supplied SQL', external: 'Referenced object', synthetic: 'Generated analysis step'
    };
    var kindNames = {
        control: 'Possible control order', exception: 'Possible handler transfer',
        data: 'Producer-to-consumer data flow', dependency: 'Static object dependency',
        call: 'Static invocation'
    };
    function addGroup(title, values, names) {
        var keys = Object.keys(values);
        if (!keys.length)
            return;
        var heading = document.createElement('h4');
        heading.textContent = title;
        target.appendChild(heading);
        var list = document.createElement('ul');
        keys.sort().forEach(function (key) {
            var item = document.createElement('li');
            var label = document.createElement('strong');
            label.textContent = key;
            item.appendChild(label);
            item.appendChild(document.createTextNode(' · ' + (names[key] || 'Relationship shown in the graph')));
            list.appendChild(item);
        });
        target.appendChild(list);
    }
    addGroup('Node evidence', provenances, provenanceNames);
    addGroup('Relationship kinds', kinds, kindNames);
    panel.hidden = nodes.length === 0 && edges.length === 0;
}
function flowDiagramRenderInspector(panel, graph, node, sourceLength, onSource, onOpenObject) {
    var doc = panel.ownerDocument;
    var body = doc.getElementById('flow-inspector-body');
    var title = doc.getElementById('flow-inspector-title');
    if (!body || !title)
        return;
    title.textContent = node.text || node.cls;
    body.textContent = '';
    var type = doc.createElement('p');
    type.className = 'flow-inspector-type';
    type.textContent = [node.cls, node.provenance || 'source'].filter(Boolean).join(' · ');
    body.appendChild(type);
    var evidence = doc.createElement('p');
    evidence.className = 'flow-inspector-evidence';
    if (node.provenance === 'synthetic')
        evidence.textContent = node.reason
            ? 'Generated by SQL Cartographer: ' + node.reason
            : 'Generated by SQL Cartographer; no source statement is claimed.';
    else if (node.provenance === 'external')
        evidence.textContent = (node.resolution === 'verified' || (!node.resolution && !!node.resolvedName)) && node.resolvedName
            ? 'Referenced here; the supplied catalogue resolves it as ' + node.resolvedName + '.'
            : node.resolution === 'conflict'
                ? 'Catalogue entries conflict for this name; the object identity remains uncertain.'
                : node.resolution === 'external'
                    ? 'Referenced here; no supplied definition or catalogue entry verifies its identity.'
                    : 'Referenced here; its definition is not included in this input.';
    else if (node.resolvedName)
        evidence.textContent = 'Resolved as ' + node.resolvedName + '.';
    else
        evidence.textContent = 'This step comes from the supplied SQL.';
    body.appendChild(evidence);
    var related = (graph.edges || []).filter(function (edge) {
        return edge.from === node.id || edge.to === node.id;
    });
    var heading = doc.createElement('h4');
    heading.textContent = 'Connections';
    body.appendChild(heading);
    var list = doc.createElement('ul');
    list.className = 'flow-inspector-connections';
    related.forEach(function (edge) {
        var peerId = edge.from === node.id ? edge.to : edge.from;
        var peer = (graph.nodes || []).filter(function (candidate) { return candidate.id === peerId; })[0];
        var item = doc.createElement('li');
        var kind = doc.createElement('span');
        kind.className = 'flow-edge-kind';
        kind.textContent = edge.kind || edge.label || 'connection';
        var direction = edge.from === node.id ? 'to' : 'from';
        item.appendChild(kind);
        item.appendChild(doc.createTextNode(' ' + direction + ' '));
        item.appendChild(doc.createTextNode(peer ? peer.text : peerId));
        list.appendChild(item);
    });
    if (!related.length) {
        var none = doc.createElement('li');
        none.textContent = 'No connected steps in this view.';
        list.appendChild(none);
    }
    body.appendChild(list);
    var spans = node.sources && node.sources.length ? node.sources :
        node.source ? [node.source] : [];
    spans = spans.filter(function (span) {
        return Number.isFinite(span.start) && Number.isFinite(span.end) &&
            span.start >= 0 && span.end > span.start && span.end <= sourceLength;
    });
    var actions = doc.getElementById('flow-source-actions');
    if (actions) {
        var actionPanel = actions;
        actionPanel.textContent = '';
        spans.forEach(function (span, index) {
            var sourceSpan = span;
            var button = doc.createElement('button');
            button.type = 'button';
            button.className = 'btn';
            button.dataset.action = 'source';
            button.dataset.sourceStart = String(sourceSpan.start);
            button.dataset.sourceEnd = String(sourceSpan.end);
            button.textContent = spans.length > 1 ? 'Go to source ' + (index + 1) : 'Go to source';
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                onSource(sourceSpan);
            });
            actionPanel.appendChild(button);
        });
        if (onOpenObject) {
            var open = doc.createElement('button');
            open.type = 'button';
            open.className = 'btn';
            open.textContent = 'Open object';
            open.dataset.action = 'object';
            var openObject = onOpenObject;
            open.addEventListener('click', openObject);
            actionPanel.appendChild(open);
        }
    }
}
function flowDiagramRender(stage, source, graph, renderer, isCurrent, onRendered, onError) {
    try {
        renderer.render('flow-' + Date.now(), source).then(function (result) {
            if (!isCurrent())
                return;
            stage.classList.remove('empty-stage');
            /* Rendered SQL labels stay safe only under Mermaid's strict security
               level. The security suite guards this insertion boundary. */
            stage.innerHTML = result.svg;
            onRendered();
        }).catch(function (error) {
            if (isCurrent())
                onError(error instanceof Error ? error.message : String(error));
        });
    }
    catch (error) {
        onError(error instanceof Error ? error.message : String(error));
    }
}
//# sourceMappingURL=flow-diagram.js.map