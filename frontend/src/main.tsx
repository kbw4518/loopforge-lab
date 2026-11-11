import { useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
type Status = 'todo' | 'in_progress' | 'done'
type Priority = 'low' | 'medium' | 'high'
type Draft = { title: string; description: string; priority: Priority; status: Status }
type Task = Draft & { id: number }
const statuses: Record<Status,string> = {todo:'待办',in_progress:'进行中',done:'已完成'}
const priorities: Record<Priority,string> = {low:'低',medium:'中',high:'高'}
const blank: Draft = {title:'',description:'',priority:'medium',status:'todo'}
async function api(path='', method='GET', body?: Draft) {
 const response = await fetch('/api/tasks'+path,{method,headers:{'Content-Type':'application/json'},body:body ? JSON.stringify(body):undefined})
 if (!response.ok) throw new Error('请求失败（'+response.status+'），请重试。')
 return response.status===204 ? undefined : response.json()
}
function App(){
 const [tasks,setTasks]=useState<Task[]>([])
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [search,setSearch]=useState('')
 const [filter,setFilter]=useState('')
 const [form,setForm]=useState<Draft>(blank)
 const [editing,setEditing]=useState<number|null>(null)
 async function load(){
  setLoading(true);setError('')
  try{setTasks(await api())}catch(e){setError((e as Error).message)}finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[])
 async function mutate(action:()=>Promise<unknown>){
  setBusy(true);setError('')
  try{await action();setTasks(await api());return true}catch(e){setError((e as Error).message);return false}finally{setBusy(false)}
 }
 async function save(e:FormEvent){
  e.preventDefault()
  const title=form.title.trim()
  if(!title || [...title].length>100){setError('标题去除首尾空格后须为 1～100 字符');return}
  if(await mutate(()=>api(editing===null?'':'/'+editing,editing===null?'POST':'PUT',{...form,title}))){setForm(blank);setEditing(null)}
 }
 const shown=tasks.filter(t=>t.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())&&(!filter||t.priority===filter))
 const keys=Object.keys(statuses) as Status[]
 return <main>
 <header><div><small>FORGEBOARD / 工作空间</small><h1>让每一步，都有进展。</h1><p>整理想法，专注执行，记录完成。</p></div><span className="total">共 {tasks.length} 项任务</span></header>
 <section className="stats" aria-label="任务统计">{keys.map(s=><div key={s}>{statuses[s]}<strong>{tasks.filter(t=>t.status===s).length}</strong></div>)}</section>
 {error&&<div className="error" role="alert">{error} <button disabled={busy||loading} onClick={()=>void load()}>重新加载</button></div>}
 <section className="composer"><h2>{editing===null?'新建任务':'编辑任务'}</h2><form onSubmit={save}>
 <label>标题<input required placeholder="下一件要完成的事…" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
 <label>描述（可选）<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
 <div className="row"><label>优先级<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as Priority})}>{Object.entries(priorities).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><button className="primary" disabled={busy||loading}>{busy?'保存中…':editing===null?'＋ 添加任务':'保存修改'}</button>{editing!==null&&<button type="button" onClick={()=>{setEditing(null);setForm(blank)}}>取消编辑</button>}</div>
 </form></section>
 <section className="toolbar"><label>标题搜索<input type="search" value={search} placeholder="搜索任务…" onChange={e=>setSearch(e.target.value)}/></label><label>优先级筛选<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">全部优先级</option>{Object.entries(priorities).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><span>显示 {shown.length} 项</span></section>
 {loading?<p role="status">正在加载任务…</p>:<div className="board">{keys.map(s=><section className={'column '+s} key={s}><h2>{statuses[s]} <span>{shown.filter(t=>t.status===s).length}</span></h2>
 {!shown.some(t=>t.status===s)&&<p className="empty">{tasks.length===0?'还没有任务，添加第一项吧。':'暂无符合条件的任务'}</p>}
 {shown.filter(t=>t.status===s).map(t=><article key={t.id}><span className={'badge '+t.priority}>{priorities[t.priority]}优先级</span><h3>{t.title}</h3>{t.description&&<p className="description">{t.description}</p>}
 <div className="actions">{keys.filter(next=>next!==t.status).map(next=><button disabled={busy} key={next} onClick={()=>void mutate(()=>api('/'+t.id,'PUT',{...t,status:next}))}>移至{statuses[next]}</button>)}</div>
 <div className="actions"><button disabled={busy} onClick={()=>{setEditing(t.id);setForm({title:t.title,description:t.description,priority:t.priority,status:t.status});window.scrollTo({top:0,behavior:'smooth'})}}>编辑</button><button className="danger" disabled={busy} onClick={async()=>{if(window.confirm('确认删除“'+t.title+'”？')){if(await mutate(()=>api('/'+t.id,'DELETE'))&&editing===t.id){setEditing(null);setForm(blank)}}}}>删除</button></div></article>)}
 </section>)}</div>}
 </main>
}
createRoot(document.getElementById('root')!).render(<App/>)
