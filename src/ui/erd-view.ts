/* sql-cartographer v3.2.0 — stateless ERD card and inspector views.
   State changes remain callbacks owned by erd-page.ts. */
interface ErdCardViewOptions {
  compact: boolean;
  pinned: boolean;
  relationshipCount: number;
  queryPicking: boolean;
  isTeaching: () => boolean;
  isPicked: (entityId: string, columnName: string) => boolean;
  columnKeys: (entity: SchemaEntity, column: SchemaColumn) => string[];
  togglePin: (entity: SchemaEntity) => boolean;
  teachColumn: (entityId: string, columnName: string) => void;
  toggleColumn: (entityId: string, columnName: string, checked: boolean) => void;
  toggleSelection: (entityId: string) => void;
}

function erdCompactSummary(entity: SchemaEntity): string {
  var fkColumns: Record<string, 1>={}, pkCount=0;
  entity.keys.forEach(function(key){
    if(key.kind==='pk') pkCount++;
    if(key.kind==='fk') key.columns.forEach(function(name){fkColumns[name.toUpperCase()]=1;});
  });
  return entity.columns.length+' cols · '+pkCount+' PK · '+Object.keys(fkColumns).length+' FK';
}

function erdBuildCard(entity: SchemaEntity, options: ErdCardViewOptions): HTMLElement {
  var card=document.createElement('article');
  card.className='erd-card'+(entity.unresolved?' unresolved':'')+
    (entity.kind==='view'?' erd-view':'')+(options.compact?' compact':'')+
    (options.pinned?' pinned':'');
  card.setAttribute('data-entity-id',entity.id);
  var head=document.createElement('header');
  var kind=document.createElement('span');
  kind.className='erd-kind'; kind.textContent=entity.unresolved?'external':entity.kind;
  var title=document.createElement('h3'); title.textContent=entity.name;
  head.appendChild(kind); head.appendChild(title);
  if(options.relationshipCount){
    var badge=document.createElement('span');
    badge.className='erd-relcount';
    badge.title=options.relationshipCount+' declared relationship'+(options.relationshipCount===1?'':'s');
    badge.textContent=String(options.relationshipCount);
    head.appendChild(badge);
  }
  var pin=document.createElement('button');
  pin.type='button'; pin.className='erd-pin'+(options.pinned?' pinned':'');
  pin.textContent='◆';
  function updatePin(isPinned: boolean): void {
    pin.classList.toggle('pinned',isPinned);
    pin.title=isPinned?'Unpin position (Auto arrange may move it)'
                      :'Pin position (Auto arrange keeps it)';
    card.classList.toggle('pinned',isPinned);
  }
  updatePin(options.pinned);
  pin.addEventListener('click',function(event: MouseEvent){
    event.stopPropagation(); updatePin(options.togglePin(entity));
  });
  head.appendChild(pin); card.appendChild(head);

  if(options.compact){
    var summary=document.createElement('p');
    summary.className='erd-summary'; summary.textContent=erdCompactSummary(entity);
    card.appendChild(summary);
  } else {
    var list=document.createElement('ul'); list.className='erd-cols';
    if(entity.columns.length){
      var fragment=document.createDocumentFragment();
      entity.columns.forEach(function(column){
        var row=document.createElement('li'); row.setAttribute('data-column',column.name);
        if(options.queryPicking){
          var pick=document.createElement('input');
          pick.type='checkbox'; pick.className='qb-pick';
          pick.setAttribute('data-column',column.name);
          pick.setAttribute('data-entity-id',entity.id);
          pick.setAttribute('aria-label','Select '+entity.name+'.'+column.name+' for the query');
          pick.checked=options.isPicked(entity.id,column.name);
          pick.addEventListener('click',function(event: MouseEvent){
            event.stopPropagation();
            if(options.isTeaching()){event.preventDefault();options.teachColumn(entity.id,column.name);}
          });
          pick.addEventListener('change',function(){
            if(!options.isTeaching()) options.toggleColumn(entity.id,column.name,pick.checked);
          });
          row.appendChild(pick);
        }
        var name=document.createElement('span');
        name.className='erd-col-name'; name.textContent=column.name;
        var type=document.createElement('span');
        type.className='erd-col-type'; type.textContent=column.type||'—';
        type.title=column.type||'no declared type';
        var flags=document.createElement('span'); flags.className='erd-badges';
        options.columnKeys(entity,column).forEach(function(key){
          var tag=document.createElement('b');
          tag.className='erd-badge erd-badge-'+key.toLowerCase();
          tag.textContent=key; flags.appendChild(tag);
        });
        if(column.identity){
          var idTag=document.createElement('b');
          idTag.className='erd-badge erd-badge-id'; idTag.textContent='ID';
          idTag.title='identity / auto-increment'; flags.appendChild(idTag);
        }
        if(column.generated||column.computed){
          var genTag=document.createElement('b'); genTag.className='erd-badge erd-badge-gen';
          genTag.textContent=column.computed?'COMP':'GEN';
          genTag.title=column.computed?'computed column':'generated column';
          flags.appendChild(genTag);
        }
        if(!column.nullable){
          var nnTag=document.createElement('b');
          nnTag.className='erd-badge erd-badge-nn'; nnTag.textContent='NN';
          nnTag.title='not null'; flags.appendChild(nnTag);
        }
        row.appendChild(name); row.appendChild(type); row.appendChild(flags);
        fragment.appendChild(row);
      });
      list.appendChild(fragment);
    } else {
      var none=document.createElement('li'); none.className='erd-no-cols';
      none.textContent=entity.unresolved?'referenced but not declared':'no declared columns';
      list.appendChild(none);
    }
    card.appendChild(list);
  }
  card.tabIndex=0;
  card.addEventListener('click',function(event: MouseEvent){
    if(options.queryPicking){
      var target=event.target as HTMLElement;
      if(target&&target.closest&&target.closest('.qb-pick')) return;
      var row=target&&target.closest?target.closest('li[data-column]') as HTMLElement:null;
      if(row){
        if(options.isTeaching()) options.teachColumn(entity.id,row.getAttribute('data-column')||'');
        else {var checkbox=row.querySelector('input.qb-pick') as HTMLInputElement;if(checkbox) checkbox.click();}
        return;
      }
    }
    options.toggleSelection(entity.id);
  });
  card.addEventListener('keydown',function(event: KeyboardEvent){
    var target=event.target as HTMLElement;
    if(options.queryPicking&&target&&target.closest&&target.closest('.qb-pick')) return;
    if(event.key==='Enter'||event.key===' '){event.preventDefault();options.toggleSelection(entity.id);}
  });
  return card;
}

interface ErdInspectorOptions {
  selected: SchemaEntity;
  entities: SchemaEntity[];
  relationships: SchemaRelationship[];
  clear: () => void;
  select: (entityId: string) => void;
}

function erdRenderInspector(target: HTMLElement, options: ErdInspectorOptions): void {
  target.textContent='';
  var selected=options.selected, entities=options.entities, relationships=options.relationships;
  var head=document.createElement('header'), title=document.createElement('h4');
  title.textContent=selected.name;
  var clear=document.createElement('button');
  clear.type='button'; clear.className='erd-inspector-close'; clear.textContent='Clear';
  clear.addEventListener('click',options.clear);
  head.appendChild(title); head.appendChild(clear); target.appendChild(head);
  function group(label: string, rows: SchemaRelationship[], outgoing: boolean): void {
    if(!rows.length) return;
    var heading=document.createElement('p');
    heading.className='erd-inspector-group'; heading.textContent=label; target.appendChild(heading);
    rows.forEach(function(rel){
      var otherId=outgoing?rel.fromId:rel.toId;
      var other=entities.filter(function(entity){return entity.id===otherId;})[0];
      var row=document.createElement('button'); row.type='button'; row.className='erd-rel-row';
      var arrow=document.createElement('span'); arrow.className='erd-rel-arrow';
      arrow.textContent=outgoing?'→':'←';
      var name=document.createElement('span'); name.className='erd-rel-name';
      name.textContent=other?other.name:otherId;
      var detail=document.createElement('span'); detail.className='erd-rel-detail';
      detail.textContent=rel.toColumns.join(',')+' → '+(rel.fromColumns.join(',')||'PK');
      var meta=document.createElement('span'); meta.className='erd-rel-meta';
      meta.textContent=(rel.cardinality==='one-to-one'?'1:1':'1:N')+
        (rel.optional?' optional':'')+(rel.name?' · '+rel.name:'');
      row.appendChild(arrow); row.appendChild(name); row.appendChild(detail); row.appendChild(meta);
      row.title='Select '+name.textContent;
      row.addEventListener('click',function(){options.select(otherId);});
      target.appendChild(row);
    });
  }
  group('References (FK out)',relationships.filter(function(rel){return rel.toId===selected.id;}),true);
  group('Referenced by (FK in)',relationships.filter(function(rel){
    return rel.fromId===selected.id&&rel.toId!==selected.id;
  }),false);
  if(!relationships.some(function(rel){return rel.fromId===selected.id||rel.toId===selected.id;})){
    var none=document.createElement('p');
    none.className='erd-inspector-empty'; none.textContent='No declared foreign keys.';
    target.appendChild(none);
  }
}
