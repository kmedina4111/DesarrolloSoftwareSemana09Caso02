'use strict';
(() => {
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => {const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const shift = n => {const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const money = n => 'S/ '+Number(n).toFixed(2);
const key='biblioteca-digital-saber-v1';
const page=document.body.dataset.page;
const pageUrl = id => id === 'index' ? (page === 'index' ? 'index.html' : '../../index.html') : (page === 'index' ? 'src/pags/' : '') + id + '.html';
const nav=[['index','Inicio'],['libros','Libros'],['autores','Autores'],['lectores','Lectores'],['prestamos','Préstamos'],['devoluciones','Devoluciones'],['sanciones','Sanciones'],['reportes','Reportes']];
function seed(){return {
libros:[{id_libro:'L001',ISBN:'9788437604947',titulo:'Don Quijote',autor:'Miguel de Cervantes',categoria:'Novela',anio_publicacion:1605,editorial:'Cátedra',cantidad_ejemplares:8,estado:'Activo'},{id_libro:'L002',ISBN:'9788420471839',titulo:'Cien años de soledad',autor:'Gabriel García Márquez',categoria:'Literatura',anio_publicacion:1967,editorial:'Alfaguara',cantidad_ejemplares:5,estado:'Activo'}],
autores:[{id_autor:'A001',nombres:'Gabriel',apellidos:'García Márquez',nacionalidad:'Colombiana'},{id_autor:'A002',nombres:'Miguel',apellidos:'de Cervantes',nacionalidad:'Española'}],
lectores:[{id_lector:'LE001',nombres:'Ana',apellidos:'Torres',DNI:'12345678',correo:'ana@example.com',telefono:'987654321',tipo_lector:'Estudiante',estado:'Activo'},{id_lector:'LE002',nombres:'Luis',apellidos:'Pérez',DNI:'87654321',correo:'luis@example.com',telefono:'912345678',tipo_lector:'Docente',estado:'Activo'}],
prestamos:[{id_prestamo:'P001',id_lector:'LE001',id_libro:'L001',fecha_prestamo:shift(-8),fecha_vencimiento:shift(2),estado:'Vigente'},{id_prestamo:'P002',id_lector:'LE002',id_libro:'L002',fecha_prestamo:shift(-15),fecha_vencimiento:shift(-3),estado:'Vigente'}],
devoluciones:[],sanciones:[{id_sancion:'S001',id_lector:'LE002',id_prestamo:'P002',motivo:'Retraso',monto:10,estado:'Pendiente'}]};}
let db,storageOK=true;
try{db=JSON.parse(localStorage.getItem(key))||seed();for(const k of Object.keys(seed()))if(!Array.isArray(db[k]))throw Error('Datos inválidos');localStorage.setItem(key,JSON.stringify(db));}catch{db=seed();storageOK=false;}
function save(next){try{localStorage.setItem(key,JSON.stringify(next));db=next;return true;}catch{notice('No se pudieron guardar los datos. El almacenamiento del navegador está bloqueado o lleno.','danger');return false;}}
function notice(message,type='success',target='#avisos'){const node=$(target);node.innerHTML='<div class="alert alert-'+type+'" role="alert">'+esc(message)+'</div>';}
const loanStatus=p=>p.estado==='Devuelto'?'Devuelto':p.fecha_vencimiento<today()?'Vencido':'Vigente';
const available=id=>{const b=db.libros.find(b=>b.id_libro===id);return b?Number(b.cantidad_ejemplares)-db.prestamos.filter(p=>p.id_libro===id&&p.estado!=='Devuelto').length:0;};
const reader=id=>{const r=db.lectores.find(r=>r.id_lector===id);return r?r.nombres+' '+r.apellidos:id;};
const book=id=>db.libros.find(b=>b.id_libro===id)?.titulo||id;
const pending=id=>db.sanciones.some(s=>s.id_lector===id&&s.estado==='Pendiente');
const badge=s=>'<span class="badge '+(['Activo','Disponible','Subsanada','Devuelto'].includes(s)?'text-bg-success':['Vencido','Sancionado'].includes(s)?'text-bg-danger':'text-bg-warning')+'">'+esc(s)+'</span>';
const f=(name,label,type='text',options)=>({name,label,type,options});
const defs={
libros:{title:'Gestión de libros y catálogo',sub:'R1–R3 · Registra ejemplares y mantén el catálogo actualizado.',singular:'libro',id:'id_libro',prefix:'L',fields:[f('id_libro','ID libro'),f('ISBN','ISBN'),f('titulo','Título'),f('anio_publicacion','Año de publicación','number'),f('editorial','Editorial'),f('cantidad_ejemplares','Cantidad de ejemplares','number'),f('estado','Estado','select',['Activo','Inactivo']),f('autor','Autor'),f('categoria','Categoría')],columns:['id_libro','ISBN','titulo','editorial','anio_publicacion','cantidad_ejemplares','estado']},
autores:{title:'Gestión de autores',sub:'R4 · Organiza el catálogo de autores.',singular:'autor',id:'id_autor',prefix:'A',fields:[f('id_autor','ID autor'),f('nombres','Nombres'),f('apellidos','Apellidos'),f('nacionalidad','Nacionalidad','select',['Peruana','Colombiana','Española','Argentina','Chilena','Mexicana','Otra'])],columns:['id_autor','nombres','apellidos','nacionalidad']},
lectores:{title:'Gestión de lectores',sub:'R5 · Administra los usuarios de la biblioteca.',singular:'lector',id:'id_lector',prefix:'LE',fields:[f('id_lector','ID lector'),f('nombres','Nombres'),f('apellidos','Apellidos'),f('DNI','DNI'),f('correo','Correo electrónico','email'),f('telefono','Teléfono','tel'),f('tipo_lector','Tipo de lector','select',['Estudiante','Docente','Investigador']),f('estado','Estado','select',['Activo','Inactivo'])],columns:['id_lector','nombres','apellidos','DNI','correo','telefono','tipo_lector','estado']},
prestamos:{title:'Gestión de préstamos',sub:'R6 y R8 · Disponibilidad, préstamos y vencimientos.',singular:'préstamo',id:'id_prestamo',prefix:'P',fields:[f('id_prestamo','ID préstamo'),f('id_lector','Lector','readers'),f('id_libro','Libro','books'),f('fecha_prestamo','Fecha de préstamo','date'),f('fecha_vencimiento','Fecha de vencimiento','date'),f('estado','Estado','select',['Vigente'])],columns:['id_prestamo','id_lector','id_libro','fecha_prestamo','fecha_vencimiento','estado']},
sanciones:{title:'Gestión de sanciones',sub:'R9 · Historial y seguimiento de penalizaciones.',singular:'sanción',id:'id_sancion',prefix:'S',fields:[f('id_sancion','ID sanción'),f('id_lector','Lector','readers'),f('id_prestamo','Préstamo','loans'),f('motivo','Motivo','select',['Retraso','Daño','Pérdida']),f('monto','Monto (S/.)','number'),f('estado','Estado','select',['Pendiente','Subsanada'])],columns:['id_sancion','id_lector','id_prestamo','motivo','monto','estado']}
};
function heading(title,sub,action=''){return '<div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><p class="eyebrow mb-2">Biblioteca / Operaciones</p><h1 class="h2">'+esc(title)+'</h1><p class="text-secondary mb-0">'+esc(sub)+'</p></div>'+action+'</div>';}
function cards(labels,values){return '<div class="row g-3 mb-4">'+labels.map((l,i)=>'<div class="col-sm-6 col-xl-3"><section class="card h-100"><div class="card-body"><h2 class="h6 text-secondary">'+esc(l)+'</h2><p class="kpi mb-0">'+esc(values[i])+'</p></div></section></div>').join('')+'</div>';}
function table(headers,rows){return '<div class="table-responsive"><table class="table table-hover table-striped mb-0"><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(row=>'<tr>'+row.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join(''):'<tr><td class="empty" colspan="'+headers.length+'">No se encontraron registros.</td></tr>')+'</tbody></table></div>';}
const returnLink=p=>'<a class="btn btn-sm btn-outline-success" href="'+pageUrl('devoluciones')+'?prestamo='+encodeURIComponent(p.id_prestamo)+'">Registrar Devolución</a>';
function dashboard(){
const active=db.prestamos.filter(p=>p.estado!=='Devuelto'),critical=active.filter(p=>p.fecha_vencimiento>=today()&&p.fecha_vencimiento<=shift(3)).sort((a,b)=>a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));
$('#vista').innerHTML=heading('Una biblioteca en movimiento','Resumen de hoy · '+today(),'<a class="btn btn-primary" href="'+pageUrl('prestamos')+'">+ Registrar préstamo</a>')+cards(['Total libros (ejemplares)','Préstamos activos','Préstamos vencidos','Sanciones vigentes'],[db.libros.reduce((n,b)=>n+Number(b.cantidad_ejemplares),0),active.length,active.filter(p=>loanStatus(p)==='Vencido').length,db.sanciones.filter(s=>s.estado==='Pendiente').length])+'<section class="card"><div class="card-body border-bottom"><h2 class="h5 mb-1">Próximos vencimientos</h2><p class="text-secondary mb-0">Préstamos que vencen entre hoy y los próximos 3 días.</p></div>'+table(['Préstamo','Lector','Libro','Vencimiento','Acción'],critical.map(p=>[esc(p.id_prestamo),esc(reader(p.id_lector)),esc(book(p.id_libro)),esc(p.fecha_vencimiento),returnLink(p)]))+'</section>';
}
let editing=null,modal=null;
const nextId=d=>{let n=1;while(db[page].some(r=>r[d.id]===d.prefix+String(n).padStart(3,'0')))n++;return d.prefix+String(n).padStart(3,'0');};
function modalField(field,row){
let value=row[field.name]??'';
const attrs=' id="field-'+field.name+'" name="'+field.name+'" required ';
let input;
let options=field.options;
if(field.type==='readers')options=db.lectores.map(r=>[r.id_lector,reader(r.id_lector)+(r.estado!=='Activo'?' · Inactivo':'')]);
if(field.type==='books')options=db.libros.map(b=>[b.id_libro,b.titulo+' · '+available(b.id_libro)+' disponibles']);
if(field.type==='loans')options=db.prestamos.map(p=>[p.id_prestamo,p.id_prestamo+' · '+reader(p.id_lector)]);
if(options)input='<select class="form-select"'+attrs+'><option value="">Selecciona…</option>'+options.map(o=>{let [v,t]=Array.isArray(o)?o:[o,o];return '<option value="'+esc(v)+'" '+(String(v)===String(value)?'selected':'')+'>'+esc(t)+'</option>';}).join('')+'</select>';
else input='<input class="form-control"'+attrs+' type="'+field.type+'" value="'+esc(value)+'" '+(field.name===defs[page].id?'readonly':'')+(field.name==='DNI'?'pattern="[0-9]{8}" inputmode="numeric" maxlength="8" title="El DNI debe tener 8 dígitos"':'')+(field.type==='number'?'min="'+(field.name==='anio_publicacion'?'1':'0')+'" step="'+(field.name==='monto'?'0.01':'1')+'"':'')+(field.name==='anio_publicacion'?' max="'+new Date().getFullYear()+'"':'')+(field.type==='tel'?'pattern="[+0-9 ()-]{7,20}"':'')+'>';
return '<div class="col-md-6"><label class="form-label" for="field-'+field.name+'">'+esc(field.label)+'</label>'+input+'</div>';
}
function openModal(id){
const d=defs[page];editing=id||null;
let row=id?db[page].find(r=>r[d.id]===id):{[d.id]:nextId(d),estado:page==='prestamos'?'Vigente':page==='sanciones'?'Pendiente':'Activo',fecha_prestamo:today(),fecha_vencimiento:shift(7)};
$('#modal-container').innerHTML='<div class="modal fade" id="editor" tabindex="-1" aria-labelledby="editor-title" aria-hidden="true"><div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><form id="record-form"><div class="modal-header"><h2 class="modal-title fs-5" id="editor-title">'+(id?'Modificar':'Registrar')+' '+esc(d.singular)+'</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body"><div id="form-alert" aria-live="polite"></div><div class="row g-3">'+d.fields.map(f=>modalField(f,row)).join('')+'</div><div id="reader-warning" class="mt-3" aria-live="polite"></div></div><div class="modal-footer"><button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button><button class="btn btn-primary" type="submit">Guardar</button></div></form></div></div></div>';
modal=new bootstrap.Modal($('#editor'));modal.show();
$('#editor').addEventListener('shown.bs.modal',()=>$('#record-form input:not([readonly]), #record-form select')?.focus());
$('#record-form').addEventListener('submit',submitRecord);
if(page==='prestamos'){
const warn=()=>$('#reader-warning').innerHTML=pending($('#field-id_lector').value)?'<div class="alert alert-warning">El lector tiene sanciones pendientes. Revisa las restricciones antes de prestar.</div>':'';
$('#field-id_lector').addEventListener('change',warn);warn();
$('#field-fecha_prestamo').addEventListener('change',()=>{const d=new Date($('#field-fecha_prestamo').value+'T12:00:00');if(!Number.isNaN(d.getTime())){d.setDate(d.getDate()+7);$('#field-fecha_vencimiento').value=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}});
}
}
function submitRecord(event){
event.preventDefault();const form=event.target;if(!form.reportValidity())return;
const d=defs[page],r=Object.fromEntries(new FormData(form));for(const k in r)r[k]=r[k].trim();
if(Object.values(r).some(v=>!v))return notice('Completa todos los campos.','warning','#form-alert');
for(const f of d.fields)if(f.type==='number')r[f.name]=Number(r[f.name]);
if(page==='libros'){
if(!/^(?:\d{10}|\d{13}|\d{9}X)$/.test(r.ISBN.replace(/[- ]/g,'')))return notice('El ISBN debe tener 10 o 13 caracteres válidos.','warning','#form-alert');
r.ISBN=r.ISBN.replace(/[- ]/g,'');
if(db.libros.some(b=>b.id_libro!==editing&&b.ISBN===r.ISBN))return notice('Ya existe un libro con ese ISBN.','warning','#form-alert');
const borrowed=db.prestamos.filter(p=>p.id_libro===editing&&p.estado!=='Devuelto').length;
if(r.cantidad_ejemplares<borrowed)return notice('La cantidad no puede ser menor a los ejemplares actualmente prestados.','warning','#form-alert');
}
if(page==='lectores'&&db.lectores.some(l=>l.id_lector!==editing&&l.DNI===r.DNI))return notice('El DNI ya pertenece a otro lector.','warning','#form-alert');
if(page==='prestamos'){
const l=db.lectores.find(l=>l.id_lector===r.id_lector),b=db.libros.find(b=>b.id_libro===r.id_libro);
if(!l||l.estado!=='Activo')return notice('Selecciona un lector activo.','warning','#form-alert');
if(!b||b.estado!=='Activo'||available(r.id_libro)<1)return notice('No hay ejemplares disponibles para este libro.','warning','#form-alert');
if(pending(r.id_lector))return notice('Resuelve las sanciones pendientes del lector antes de registrar el préstamo.','warning','#form-alert');
if(r.fecha_vencimiento<r.fecha_prestamo)return notice('El vencimiento no puede ser anterior al préstamo.','warning','#form-alert');
}
if(page==='sanciones'&&!db.prestamos.some(p=>p.id_prestamo===r.id_prestamo&&p.id_lector===r.id_lector))return notice('El préstamo debe pertenecer al lector seleccionado.','warning','#form-alert');
let next=structuredClone(db);if(editing)next[page]=next[page].map(o=>o[d.id]===editing?r:o);else next[page].push(r);
if(!save(next))return;
modal.hide();renderRows();notice((editing?'Registro actualizado':'Registro creado')+' correctamente.');
}
function filters(){
const select=(id,label,opts)=>'<div class="col-md-3"><label class="form-label" for="'+id+'">'+label+'</label><select id="'+id+'" class="form-select"><option value="">Todos</option>'+opts.map(o=>'<option>'+o+'</option>').join('')+'</select></div>';
let html='<div class="col-md-6"><label for="search" class="form-label">'+(page==='libros'?'Buscar por ISBN, título, categoría o autor':page==='lectores'?'Buscar por DNI o nombre':'Buscar registros')+'</label><input id="search" type="search" class="form-control" placeholder="Escribe para filtrar…"></div>';
if(page==='lectores')html+=select('filter','Tipo de lector',['Estudiante','Docente','Investigador']);
if(page==='libros')html+=select('filter','Disponibilidad',['Disponible','Prestado']);
if(page==='sanciones')html+=select('filter','Estado',['Pendiente','Subsanada']);
if(page==='prestamos')html=select('filter','Estado',['Vigente','Vencido','Devuelto'])+'<div class="col-md-3"><label for="from" class="form-label">Vencimiento desde</label><input id="from" type="date" class="form-control"></div><div class="col-md-3"><label for="to" class="form-label">Vencimiento hasta</label><input id="to" type="date" class="form-control"></div><div class="col-md-3"><label for="search" class="form-label">Lector, libro o ID</label><input id="search" type="search" class="form-control"></div>';
return '<div class="toolbar mb-4"><div class="row g-3">'+html+'</div></div>';
}
function crud(){
const d=defs[page];$('#vista').innerHTML=heading(d.title,d.sub,'<button class="btn btn-primary" id="new-record">+ Registrar '+esc(d.singular)+'</button>')+filters()+'<section class="card"><div class="card-body d-flex justify-content-between"><h2 class="h6 mb-0">Listado de '+nav.find(n=>n[0]===page)[1].toLowerCase()+'</h2><span class="text-secondary small" id="count"></span></div><div id="records"></div></section>';
$('#new-record').onclick=()=>openModal();document.querySelectorAll('#search,#filter,#from,#to').forEach(e=>e.addEventListener('input',renderRows));renderRows();
}
function renderRows(){
const d=defs[page],q=($('#search')?.value||'').toLocaleLowerCase(),filter=$('#filter')?.value;
let rows=db[page].filter(r=>Object.values(r).concat(reader(r.id_lector),book(r.id_libro)).join(' ').toLocaleLowerCase().includes(q));
if(filter)rows=rows.filter(r=>page==='lectores'?r.tipo_lector===filter:page==='prestamos'?loanStatus(r)===filter:page==='libros'?(filter==='Disponible'?available(r.id_libro)>0&&r.estado==='Activo':available(r.id_libro)<=0):r.estado===filter);
if(page==='prestamos')rows=rows.filter(r=>(!$('#from').value||r.fecha_vencimiento>=$('#from').value)&&(!$('#to').value||r.fecha_vencimiento<=$('#to').value));
$('#count').textContent=rows.length+' registros';
const labels=d.columns.map(k=>d.fields.find(f=>f.name===k)?.label||k);
$('#records').innerHTML=table([...labels,...(page==='libros'?['Disponibilidad']:[]),'Acciones'],rows.map(r=>{
let cells=d.columns.map(k=>k==='estado'?badge(page==='prestamos'?loanStatus(r):r.estado):k==='id_lector'?esc(reader(r[k])):k==='id_libro'&&page==='prestamos'?esc(book(r[k])):k==='monto'?esc(money(r[k])):esc(r[k]));
if(page==='libros')cells.push(badge(r.estado==='Activo'&&available(r.id_libro)>0?'Disponible':'Prestado')+' <small>'+available(r.id_libro)+' libres</small>');
const id=esc(r[d.id]);cells.push(page==='prestamos'?(r.estado!=='Devuelto'?returnLink(r):'<span class="text-secondary">Completado</span>'):'<div class="d-flex gap-2 flex-wrap"><button class="btn btn-sm btn-outline-success" data-edit="'+id+'">Modificar</button>'+(page==='sanciones'?'':'<button class="btn btn-sm btn-outline-danger" data-delete="'+id+'">Eliminar</button>')+'</div>');return cells;}));
$('#records').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openModal(b.dataset.edit));
$('#records').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteRecord(b.dataset.delete));
}
function deleteRecord(id){
const d=defs[page];if(page==='lectores'&&(db.prestamos.some(p=>p.id_lector===id)||db.sanciones.some(s=>s.id_lector===id)))return notice('Este lector tiene historial asociado. Modifica su estado en lugar de eliminarlo.','warning');
if(page==='libros'&&db.prestamos.some(p=>p.id_libro===id))return notice('Este libro tiene préstamos asociados. Modifica su estado en lugar de eliminarlo.','warning');
if(!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.'))return;
const next=structuredClone(db);next[page]=next[page].filter(r=>r[d.id]!==id);if(save(next)){renderRows();notice('Registro eliminado.');}
}
let selectedLoan=null;
function returns(){
$('#vista').innerHTML=heading('Gestión de devoluciones','R7 · Localiza un préstamo activo antes de registrar su devolución.')+'<section class="toolbar mb-4"><form id="loan-search" class="row g-3 align-items-end"><div class="col-md-8"><label for="loan-query" class="form-label">ID de préstamo o DNI del lector</label><input id="loan-query" class="form-control" required placeholder="P001 o 12345678"></div><div class="col-md-4"><button class="btn btn-primary w-100">Buscar Préstamo Activo</button></div></form></section><div id="loan-results"></div><section id="return-section" hidden class="card"><div class="card-body"><h2 class="h5">Registrar devolución</h2><form id="return-form"><div class="row g-3"><div class="col-md-4"><label for="return-date" class="form-label">Fecha de devolución</label><input type="date" id="return-date" class="form-control" required value="'+today()+'"></div><div class="col-md-8"><label for="observations" class="form-label">Observaciones</label><textarea id="observations" class="form-control" rows="3" placeholder="Estado del ejemplar y observaciones"></textarea></div></div><div id="late-alert" class="alert alert-danger mt-3" hidden role="alert">Retraso detectado: aplicar sanción. Tras guardar podrás registrar la penalización.</div><button class="btn btn-primary mt-3">Registrar devolución</button></form></div></section><section class="card mt-4"><div class="card-body"><h2 class="h5">Devoluciones registradas</h2></div><div id="return-history"></div></section>';
$('#return-history').innerHTML=table(['ID devolución','Préstamo','Fecha','Observaciones'],db.devoluciones.map(r=>[esc(r.id_devolucion),esc(r.id_prestamo),esc(r.fecha_devolucion),esc(r.observaciones)]));
$('#loan-search').onsubmit=e=>{e.preventDefault();selectedLoan=null;$('#return-section').hidden=true;const q=$('#loan-query').value.trim().toLowerCase();const matches=db.prestamos.filter(p=>p.estado!=='Devuelto'&&(p.id_prestamo.toLowerCase()===q||db.lectores.find(l=>l.id_lector===p.id_lector)?.DNI===q));$('#loan-results').innerHTML=matches.length?matches.map(p=>'<section class="card mb-3"><div class="card-body d-flex justify-content-between flex-wrap gap-3"><div><h2 class="h5">'+esc(p.id_prestamo)+' · '+esc(book(p.id_libro))+'</h2><p class="mb-0">'+esc(reader(p.id_lector))+' · Fecha límite: '+esc(p.fecha_vencimiento)+'</p></div><button class="btn btn-outline-success" data-select="'+esc(p.id_prestamo)+'">Seleccionar préstamo</button></div></section>').join(''):'<p class="alert alert-warning">No se encontraron préstamos activos para esta búsqueda.</p>';document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>selectLoan(b.dataset.select));if(matches.length===1)selectLoan(matches[0].id_prestamo);};
$('#return-date').onchange=lateWarning;$('#return-form').onsubmit=e=>{e.preventDefault();if(!selectedLoan)return;const date=$('#return-date').value;if(date<selectedLoan.fecha_prestamo||date>today())return notice('La devolución debe estar entre la fecha de préstamo y hoy.','warning');
const late=date>selectedLoan.fecha_vencimiento;const next=structuredClone(db);next.prestamos.find(p=>p.id_prestamo===selectedLoan.id_prestamo).estado='Devuelto';next.devoluciones.push({id_devolucion:'D'+String(db.devoluciones.length+1).padStart(3,'0'),id_prestamo:selectedLoan.id_prestamo,fecha_devolucion:date,observaciones:$('#observations').value.trim()});if(save(next)){returns();notice(late?'Devolución registrada con retraso. Registra la sanción correspondiente en Sanciones.':'Devolución registrada. El ejemplar ya está disponible.',late?'warning':'success');}};
const id=new URLSearchParams(location.search).get('prestamo');if(id){$('#loan-query').value=id;$('#loan-search').requestSubmit();}
}
function selectLoan(id){selectedLoan=db.prestamos.find(p=>p.id_prestamo===id);$('#return-section').hidden=false;$('#return-date').min=selectedLoan.fecha_prestamo;$('#return-date').max=today();lateWarning();}
function lateWarning(){$('#late-alert').hidden=!selectedLoan||$('#return-date').value<=selectedLoan.fecha_vencimiento;}
let report=null;
function reports(){
$('#vista').innerHTML=heading('Reportes bibliotecarios','R10 · Consolida la actividad de la biblioteca por periodo.')+'<form id="report-form" class="toolbar row g-3 mx-0 mb-4 align-items-end"><div class="col-md-4"><label for="period-start" class="form-label">Inicio del periodo</label><input id="period-start" type="date" class="form-control" value="'+today().slice(0,8)+'01" required></div><div class="col-md-4"><label for="period-end" class="form-label">Fin del periodo</label><input id="period-end" type="date" class="form-control" value="'+today()+'" required></div><div class="col-md-4"><button class="btn btn-primary w-100">Generar Reporte</button></div></form><div id="report-output"><p class="text-secondary">Selecciona un periodo y genera el reporte.</p></div>';
$('#report-form').onsubmit=e=>{e.preventDefault();const start=$('#period-start').value,end=$('#period-end').value;if(end<start)return notice('El fin del periodo debe ser igual o posterior al inicio.','warning');const inRange=d=>d>=start&&d<=end;report={inicio:start,fin:end,libros_prestados:db.prestamos.filter(p=>inRange(p.fecha_prestamo)).length,devoluciones:db.devoluciones.filter(d=>inRange(d.fecha_devolucion)).length,prestamos_vencidos:db.prestamos.filter(p=>inRange(p.fecha_vencimiento)&&p.fecha_vencimiento<today()&&!db.devoluciones.some(d=>d.id_prestamo===p.id_prestamo&&d.fecha_devolucion<=p.fecha_vencimiento)).length};
$('#report-output').innerHTML=cards(['Libros prestados','Devoluciones','Préstamos vencidos'],[report.libros_prestados,report.devoluciones,report.prestamos_vencidos])+'<section class="card mb-4"><div class="card-body"><h2 class="h5">Actividad del periodo</h2><p class="text-secondary">'+esc(start)+' — '+esc(end)+'</p>'+['libros_prestados','devoluciones','prestamos_vencidos'].map(k=>'<div class="mb-3">'+esc(k.replaceAll('_',' '))+' · '+report[k]+'<div class="report-bar mt-2"><span style="width:'+Math.round(report[k]/Math.max(1,report.libros_prestados,report.devoluciones,report.prestamos_vencidos)*100)+'%"></span></div></div>').join('')+'<p class="small text-secondary">Vencidos: préstamos con vencimiento en el periodo, vencidos a hoy y sin devolución puntual.</p></div></section><div class="d-flex gap-3 flex-wrap"><button id="export-pdf" class="btn btn-primary">Descargar PDF</button><button id="export-excel" class="btn btn-outline-success">Descargar Excel</button></div><p class="small text-secondary mt-2">Exportación simulada: descarga un resumen de texto. No genera documentos PDF o Excel reales.</p>';
$('#export-pdf').onclick=()=>exportReport('PDF');$('#export-excel').onclick=()=>exportReport('Excel');notice('Reporte generado correctamente.');};
}
function exportReport(format){const content='SIMULACIÓN DE EXPORTACIÓN '+format+'\nBiblioteca Digital del Saber\n'+Object.entries(report).map(([k,v])=>k+': '+v).join('\n');const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='reporte-'+format.toLowerCase()+'-simulado.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Simulación de '+format+' descargada como resumen de texto.');}
$('#cabecera').innerHTML='<nav class="navbar navbar-expand-xl navbar-dark px-lg-4 py-3" aria-label="Navegación principal"><div class="container-fluid"><a class="navbar-brand me-4" href="'+pageUrl('index')+'">Biblioteca Digital del Saber</a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navigation" aria-controls="navigation" aria-expanded="false" aria-label="Abrir menú"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse" id="navigation"><ul class="navbar-nav gap-xl-1 me-auto">'+nav.map(([id,label])=>'<li class="nav-item"><a class="nav-link px-2 '+(id===page?'active':'')+'" '+(id===page?'aria-current="page"':'')+' href="'+pageUrl(id)+'">'+label+'</a></li>').join('')+'</ul><span class="navbar-text ms-xl-3">Bibliotecario</span></div></div></nav>';
if(page==='index')dashboard();else if(page==='devoluciones')returns();else if(page==='reportes')reports();else crud();
if(!storageOK)notice('El navegador no permite guardar datos locales. Habilita el almacenamiento para conservar los cambios.','warning');
if(!window.bootstrap)notice('No se pudo cargar Bootstrap. Comprueba tu conexión a Internet para usar los modales y el menú.','warning');
})();

