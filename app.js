import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// 1) Completează valorile din Project Settings > API în Supabase.
const SUPABASE_URL = "https://nwqskiumnrzqdxwqxraj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cXNraXVtbnJ6cWR4d3F4cmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2ODIzMDUsImV4cCI6MjExMTI1ODMwNX0.uUIBmMIQyD8UCXBFjTX3OdjqRUqx2EbObUAw9iEMdJQ";

const $ = id => document.getElementById(id);
const roles = ["Vice President","Treasurer","Sergent","Enforcer","Road Captain","Membru","Prospect"];
let supabase = null, currentUser = null, isAdmin = false, members = [], records = {}, amount = 740000, loginMode = "admin", editingId = null;
const configured = !SUPABASE_URL.startsWith("PASTE_") && !SUPABASE_ANON_KEY.startsWith("PASTE_");

function notify(msg){const t=$("toast");t.textContent=msg;t.style.display="block";setTimeout(()=>t.style.display="none",2600)}
function weekNow(){const d=new Date();const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day+3);const first=new Date(d.getFullYear(),0,4);const w=1+Math.round(((d-first)/86400000-3+((first.getDay()+6)%7))/7);return `${d.getFullYear()}-W${String(w).padStart(2,"0")}`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function weekRecord(id){return records[id]||{status:"Activ",done:false,paid:false}}
function canEdit(){return isAdmin}
async function loadData(){
  const [{data:mem,error:me},{data:rec,error:re},{data:set,error:se}] = await Promise.all([
    supabase.from("members").select("*").order("name"),
    supabase.from("weekly_records").select("*").eq("week_key",$("week").value),
    supabase.from("app_settings").select("*").eq("id",1).maybeSingle()
  ]);
  if(me)throw me;if(re)throw re;if(se)throw se;
  members=mem||[];records={};(rec||[]).forEach(r=>records[r.member_id]=r);amount=set?.task_amount??740000;$("amount").value=amount;render();
}
async function render(){
  const body=$("membersBody");body.innerHTML="";const q=$("search").value.toLocaleLowerCase("ro"),filter=$("filter").value;
  const ordered=[...members].sort((a,b)=>roles.indexOf(a.grade)-roles.indexOf(b.grade)||a.name.localeCompare(b.name,"ro"));
  let active=0,done=0,paid=0,unpaid=0;
  for(const m of ordered){const r=weekRecord(m.id),status=r.status||"Activ";if(status==="Activ"){active++;if(r.done)done++;if(r.paid)paid+=amount;else unpaid+=amount}
    if((filter!=="all"&&status!==filter)||!m.name.toLocaleLowerCase("ro").includes(q))continue;
    const tr=document.createElement("tr");
    const statusClass=status==="Scutit"?"ex":status==="Inactivitate"?"in":"";
    tr.innerHTML=`<td><div class="name">${escapeHtml(m.name)}</div></td><td>${escapeHtml(m.grade)}</td><td><span class="status ${statusClass}">${escapeHtml(status)}</span></td><td></td><td></td><td class="admin-only"></td>`;
    const taskCell=tr.children[3],payCell=tr.children[4],actions=tr.children[5];
    if(status==="Activ"){
      const task=document.createElement("input");task.type="checkbox";task.className="check";task.checked=!!r.done;task.disabled=!canEdit();task.onchange=()=>updateRecord(m.id,{done:task.checked});taskCell.append(task,document.createTextNode(r.done?" Efectuat":" Restant"));
      const paidBox=document.createElement("input");paidBox.type="checkbox";paidBox.className="check";paidBox.checked=!!r.paid;paidBox.disabled=!canEdit();paidBox.onchange=()=>updateRecord(m.id,{paid:paidBox.checked});payCell.append(paidBox,document.createTextNode(r.paid?" Plătit":" Neplătit"));
    }else{taskCell.textContent="Nu se aplică";payCell.textContent="Nu se aplică"}
    if(canEdit()){actions.innerHTML=`<button class="smallbtn" data-edit="${m.id}">Editează</button><button class="smallbtn delete" data-delete="${m.id}">Șterge</button>`}
    body.append(tr);
  }
  body.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openMember(b.dataset.edit));body.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteMember(b.dataset.delete));
  $("empty").style.display=body.children.length?"none":"block";$("activeCount").textContent=active;$("doneCount").textContent=`${done} / ${active}`;$("paidTotal").textContent=money(paid);$("unpaidTotal").textContent=money(unpaid);
}
function money(n){return new Intl.NumberFormat("ro-RO").format(n)+" $"}
async function updateRecord(memberId,patch){
  if(!canEdit())return;const old=weekRecord(memberId);const payload={member_id:memberId,week_key:$("week").value,status:old.status||"Activ",done:old.done||false,paid:old.paid||false,...patch,updated_at:new Date().toISOString()};
  const {data,error}=await supabase.from("weekly_records").upsert(payload,{onConflict:"member_id,week_key"}).select().single();if(error){alert(error.message);return}records[memberId]=data;render();
}
async function setMemberStatus(memberId,status){await updateRecord(memberId,{status})}
function showApp(){ $("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("userArea").classList.remove("hidden");$("roleLabel").textContent=isAdmin?"ADMINISTRATOR":"DOAR VIZUALIZARE";$("accessText").textContent=isAdmin?"Ai acces complet de administrare.":"Ai acces doar pentru vizualizare.";document.body.classList.toggle("is-admin",isAdmin)}
async function startSession(){
 const {data:{user},error}=await supabase.auth.getUser();if(error||!user)return;
 currentUser=user;const {data:profile,error:pe}=await supabase.from("profiles").select("role").eq("id",user.id).single();if(pe){await supabase.auth.signOut();throw pe}
 isAdmin=profile.role==="admin";showApp();await loadData();
}
function openMember(id=null){editingId=id;const m=members.find(x=>x.id===id);$("dialogTitle").textContent=m?"Editează membru":"Adaugă membru";$("memberName").value=m?.name||"";$("memberRole").value=m?.grade||roles[0];$("memberStatus").value=weekRecord(id||"").status||"Activ";$("memberDialog").showModal()}
async function deleteMember(id){const m=members.find(x=>x.id===id);if(!confirm(`Ștergi membrul ${m.name}? Înregistrările săptămânale asociate vor fi șterse automat.`))return;const {error}=await supabase.from("members").delete().eq("id",id);if(error){alert(error.message);return}await loadData();notify("Membru șters")}
async function saveMember(e){e.preventDefault();if(!canEdit())return;const payload={name:$("memberName").value.trim(),grade:$("memberRole").value};let result;
 if(editingId)result=await supabase.from("members").update(payload).eq("id",editingId).select().single();else result=await supabase.from("members").insert(payload).select().single();
 if(result.error){alert(result.error.message);return}
 const id=editingId||result.data.id;await updateRecord(id,{status:$("memberStatus").value});$("memberDialog").close();await loadData();notify("Membru salvat")}
async function login(e){e.preventDefault();$("loginError").textContent="";const email=$("email").value.trim(),password=$("password").value;const {error}=await supabase.auth.signInWithPassword({email,password});if(error){$("loginError").textContent="Date de conectare incorecte sau cont neconfigurat.";return}try{await startSession()}catch(err){$("loginError").textContent=err.message}}
function setMode(mode){loginMode=mode;$("adminTab").classList.toggle("active",mode==="admin");$("viewerTab").classList.toggle("active",mode==="viewer");$("emailLabel").textContent=mode==="admin"?"E-mail administrator":"E-mail comun de vizualizare";$("email").placeholder=mode==="admin"?"adresa administratorului":"adresa contului comun";$("email").value=mode==="viewer"?"vizualizare@elburro.ro":""}
async function logout(){await supabase.auth.signOut();location.reload()}
$("adminTab").onclick=()=>setMode("admin");$("viewerTab").onclick=()=>setMode("viewer");$("loginForm").onsubmit=login;$("logoutBtn").onclick=logout;
$("addBtn").onclick=()=>openMember();$("memberForm").onsubmit=saveMember;$("cancelBtn").onclick=()=>$("memberDialog").close();
$("refreshBtn").onclick=()=>loadData().catch(e=>alert(e.message));$("week").value=weekNow();$("week").onchange=()=>loadData().catch(e=>alert(e.message));$("search").oninput=render;$("filter").onchange=render;
$("amount").onchange=async()=>{if(!canEdit())return;const v=Math.max(0,Number($("amount").value)||0);const {error}=await supabase.from("app_settings").upsert({id:1,task_amount:v});if(error){alert(error.message);return}amount=v;render();notify("Valoarea taskului a fost actualizată")};
if(!configured){$("loginError").textContent="Aplicația nu este încă legată la Supabase. Urmează pașii din README."; $("loginForm").querySelector("button").disabled=true}
else{supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);supabase.auth.onAuthStateChange((_event)=>{setTimeout(()=>startSession().catch(console.error),0)});startSession().catch(e=>{$("loginError").textContent=e.message})}
