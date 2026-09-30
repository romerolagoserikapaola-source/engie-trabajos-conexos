
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'engie_trabajos_conexos_v1';
let registros = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function nowLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const hh = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return {date:`${yyyy}-${mm}-${dd}`, time:`${hh}:${mi}`};
}

function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  $('view-'+name).classList.remove('hidden');
  if(name==='registros') renderAll();
  $('mainNav').classList.remove('open');
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showView(b.dataset.go));
$('btnMenu').onclick=()=>$('mainNav').classList.toggle('open');

function addEmpresa(data={}){
  const frag = $('empresaTemplate').content.cloneNode(true);
  const item = frag.querySelector('.empresa-item');
  item.querySelector('.ec-empresa').value = data.empresa || '';
  item.querySelector('.ec-actividad').value = data.actividad || '';
  item.querySelector('.ec-responsable').value = data.responsable || '';
  item.querySelector('.ec-contacto').value = data.contacto || '';
  item.querySelector('.remove-btn').onclick = ()=>item.remove();
  $('empresasConexas').appendChild(frag);
}
$('btnAddEmpresa').onclick=()=>addEmpresa();

function toast(msg){
  $('toast').textContent = msg;
  $('toast').classList.remove('hidden');
  setTimeout(()=>$('toast').classList.add('hidden'),2500);
}

function collectEmpresas(){
  return [...document.querySelectorAll('.empresa-item')].map(item=>({
    empresa:item.querySelector('.ec-empresa').value.trim(),
    actividad:item.querySelector('.ec-actividad').value.trim(),
    responsable:item.querySelector('.ec-responsable').value.trim(),
    contacto:item.querySelector('.ec-contacto').value.trim()
  }));
}

$('coordForm').addEventListener('submit', e=>{
  e.preventDefault();
  const empresas = collectEmpresas();
  if(!empresas.length){
    alert('Agregue al menos una empresa conexa.');
    return;
  }
  const file = $('evidencia').files[0];
  const rec = {
    id:'TC-'+String(registros.length+1).padStart(4,'0'),
    fecha:$('fecha').value,
    hora:$('hora').value,
    empresaPropia:$('empresaPropia').value,
    actividad:$('actividad').value.trim(),
    jefeArea:$('jefeArea').value.trim(),
    supervisorSsoma:$('supervisorSsoma').value.trim(),
    empresas,
    acuerdos:$('acuerdos').value.trim(),
    sector:$('sector').value,
    referencia:$('referencia').value.trim(),
    evidencia:file ? file.name : ''
  };
  registros.push(rec);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  e.target.reset();
  $('empresasConexas').innerHTML='';
  addEmpresa();
  const n=nowLocal(); $('fecha').value=n.date; $('hora').value=n.time;
  toast('Coordinación registrada correctamente.');
  renderAll();
});

function renderKPIs(){
  const today=nowLocal().date;
  const month=today.slice(0,7);
  const hoy=registros.filter(r=>r.fecha===today).length;
  const mes=registros.filter(r=>r.fecha?.startsWith(month)).length;
  const emp = new Set(registros.flatMap(r=>r.empresas.map(e=>e.empresa)).filter(Boolean));
  const evid=registros.length ? Math.round(registros.filter(r=>r.evidencia).length/registros.length*100) : 0;

  $('kpiHoy').textContent=hoy;
  $('kpiMes').textContent=mes;
  $('kpiEmpresas').textContent=emp.size;
  $('kpiEvidencia').textContent=evid+'%';

  $('dTotal').textContent=registros.length;
  $('dEmpresas').textContent=emp.size;
  $('dEvidencia').textContent=evid+'%';
  $('dHoy').textContent=hoy;
}

function fillEmpresaFilter(){
  const all = [...new Set(registros.flatMap(r=>r.empresas.map(e=>e.empresa)).filter(Boolean))].sort();
  const old=$('fEmpresa').value;
  $('fEmpresa').innerHTML='<option value="">Todas las empresas</option>'+all.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
  $('fEmpresa').value=old;
}

function getFiltered(){
  const emp=$('fEmpresa').value.toLowerCase();
  const fecha=$('fFecha').value;
  const q=$('fTexto').value.toLowerCase().trim();
  return registros.filter(r=>{
    if(emp && !r.empresas.some(e=>e.empresa.toLowerCase()===emp)) return false;
    if(fecha && r.fecha!==fecha) return false;
    if(q){
      const bag=[r.actividad,r.sector,r.jefeArea,r.supervisorSsoma,r.referencia,r.acuerdos,...r.empresas.flatMap(e=>[e.empresa,e.actividad,e.responsable,e.contacto])].join(' ').toLowerCase();
      if(!bag.includes(q)) return false;
    }
    return true;
  });
}

function renderTable(){
  const rows=getFiltered();
  const tbody=$('tabla').querySelector('tbody');
  tbody.innerHTML=rows.map(r=>`
    <tr>
      <td>${escapeHtml(r.id)}</td>
      <td>${escapeHtml(formatDate(r.fecha))}</td>
      <td>${escapeHtml(r.hora)}</td>
      <td>${escapeHtml(r.empresaPropia)}</td>
      <td>${escapeHtml(r.actividad)}</td>
      <td>${escapeHtml(r.sector)}</td>
      <td>${escapeHtml(r.empresas.map(e=>e.empresa).join(', '))}</td>
      <td>${escapeHtml(r.jefeArea)}</td>
      <td>${escapeHtml(r.supervisorSsoma)}</td>
      <td>${r.evidencia ? '<span class="badge">Sí</span>' : 'No'}</td>
      <td><button class="secondary" onclick="verRegistro('${r.id}')">Ver</button></td>
    </tr>`).join('') || '<tr><td colspan="11">Sin registros para los filtros seleccionados.</td></tr>';
}

function renderAll(){
  renderKPIs(); fillEmpresaFilter(); renderTable();
}
['fEmpresa','fFecha','fTexto'].forEach(id=>$(id).addEventListener('input',renderTable));
$('btnLimpiarFiltros').onclick=()=>{
  $('fEmpresa').value=''; $('fFecha').value=''; $('fTexto').value=''; renderTable();
};
$('btnExport').onclick=()=>window.print();

window.verRegistro = function(id){
  const r=registros.find(x=>x.id===id);
  if(!r) return;
  const empresas=r.empresas.map((e,i)=>`${i+1}. ${e.empresa} | ${e.actividad} | Responsable: ${e.responsable}`).join('\n');
  alert(
    `${r.id}\nFecha: ${formatDate(r.fecha)} ${r.hora}\nActividad: ${r.actividad}\nSector: ${r.sector}\n\nEmpresas conexas:\n${empresas}\n\nAcuerdos:\n${r.acuerdos}`
  );
};

function formatDate(v){
  if(!v) return '';
  const [y,m,d]=v.split('-');
  return `${d}/${m}/${y}`;
}
function escapeHtml(v){
  return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

const n=nowLocal();
$('fecha').value=n.date;
$('hora').value=n.time;
addEmpresa();
renderAll();


// V1.2 - mapa de sectorización ENGIE
let mapScale = 1;
const mapCanvas = $('mapCanvas');
const mapViewport = $('mapViewport');

function applyMapScale(){
  mapCanvas.style.width = `${mapScale * 100}%`;
  $('mapReset').textContent = `${Math.round(mapScale * 100)}%`;
}
$('mapZoomIn').addEventListener('click', ()=>{
  mapScale = Math.min(2.5, +(mapScale + 0.2).toFixed(1));
  applyMapScale();
});
$('mapZoomOut').addEventListener('click', ()=>{
  mapScale = Math.max(0.6, +(mapScale - 0.2).toFixed(1));
  applyMapScale();
});
$('mapReset').addEventListener('click', ()=>{
  mapScale = 1;
  applyMapScale();
  mapViewport.scrollTo({top:0,left:0,behavior:'smooth'});
});
$('mapFullscreen').addEventListener('click', ()=>{
  mapViewport.classList.toggle('fullscreen-map');
  document.body.style.overflow = mapViewport.classList.contains('fullscreen-map') ? 'hidden' : '';
});
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape' && mapViewport.classList.contains('fullscreen-map')){
    mapViewport.classList.remove('fullscreen-map');
    document.body.style.overflow = '';
  }
});

document.querySelectorAll('.sector-chip').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $('sector').value = btn.dataset.sector;
    document.querySelectorAll('.sector-chip').forEach(b=>b.classList.toggle('active', b===btn));
  });
});
$('sector').addEventListener('change', ()=>{
  document.querySelectorAll('.sector-chip').forEach(b=>{
    b.classList.toggle('active', b.dataset.sector === $('sector').value);
  });
});
applyMapScale();
