function buildSearchBox(ph,onInput,val){const w=h('div',{className:'search-box'});w.appendChild(h('span',{className:'s-icon',innerHTML:I.search}));const inp=h('input',{placeholder:ph,value:val||''});inp.addEventListener('input',debounce(e=>onInput(e.target.value),250));w.appendChild(inp);return w}
function buildFilterChips(opts,active,onChange){const w=h('div',{className:'filter-chips'});opts.forEach(([v,l])=>w.appendChild(h('button',{className:`filter-chip ${active===v?'active':''}`,onClick:()=>onChange(v)},l)));return w}
function buildSelect(opts,val,onChange){const s=h('select',{className:'input select'});opts.forEach(([v,l])=>{const o=h('option',{value:v},l);if(v==val)o.selected=true;s.appendChild(o)});s.addEventListener('change',e=>onChange(e.target.value));return s}

// ═══ SORTABLE TABLE HEADERS ═══
// cols: [[label, sortKey], ...] — sortKey='' means not sortable
// f: filter object with f.sort and f.order
// onSort: callback(newSort, newOrder)
function buildSortableTable(cols, f, onSort) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  cols.forEach(([label, sortKey]) => {
    const th = document.createElement('th');
    if (sortKey) {
      th.style.cursor = 'pointer';
      th.style.userSelect = 'none';
      th.title = 'Ordenar por ' + label;
      const isActive = f.sort === sortKey;
      th.innerHTML = label + (isActive ? (f.order === 'DESC' ? ' <span style="opacity:.6">▼</span>' : ' <span style="opacity:.6">▲</span>') : ' <span style="opacity:.2">⇅</span>');
      th.addEventListener('click', () => {
        if (f.sort === sortKey) f.order = f.order === 'DESC' ? 'ASC' : 'DESC';
        else { f.sort = sortKey; f.order = 'ASC'; }
        onSort();
      });
    } else {
      th.textContent = label;
    }
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);
  return table;
}
