import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownToLine, ArrowRight, BarChart3, Check, ChevronRight, Code2, Database, FileText, Hash, Layers3, LoaderCircle, Search, Sparkles, Terminal, Trash2, TrendingUp, Upload, X } from 'lucide-react';
import './styles.css';

const sample = ['wireless headphones','running shoes','smart watch','wireless headphones','laptop stand','running shoes','wireless headphones','coffee maker','smart watch','wireless headphones','running shoes','phone case','laptop stand','wireless headphones','smart watch','running shoes','coffee maker','wireless headphones','backpack','running shoes','smart watch','wireless headphones','phone case','laptop stand','running shoes','wireless headphones','coffee maker','smart watch','backpack','wireless headphones'];
const fmt = n => n.toLocaleString();
function App() {
  const [input, setInput] = useState(sample.join('\n'));
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('frequency');
  const [sort, setSort] = useState('ranked');
  const [filter, setFilter] = useState('');
  const [lastInput, setLastInput] = useState(null);
  const [help, setHelp] = useState(false);
  const lines = input.split('\n').filter(s => s.trim()).length;
  const stale = result && (lastInput.text !== input || lastInput.caseSensitive !== caseSensitive);
  async function analyze() {
    setBusy(true); setError('');
    const snapshot = { text: input, caseSensitive };
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queries: input, caseSensitive }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed.');
      setResult(data); setLastInput(snapshot);
    } catch (e) { setError(e.message === 'Failed to fetch' ? 'Cannot reach the API. Start the project with npm run dev.' : e.message); }
    finally { setBusy(false); }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5000000) setError('Please choose a text file smaller than 5 MB.');
      else { try { setInput(await file.text()); setError(''); } catch { setError('Could not read the file.'); } }
    }
    event.target.value = '';
  }
  function download() {
    const csv = 'Rank,Query,Frequency,Share (%)\n' + result.ranked.map((r, i) => `${i+1},"${(/^[=+@\-\t\r]/.test(r.term) ? "'" : '') + r.term.replaceAll('"','""')}",${r.count},${(r.count/result.total*100).toFixed(2)}`).join('\n');
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'querylens-frequency.csv'; a.click(); URL.revokeObjectURL(url);
  }
  const rows = result ? result[sort].filter(r => r.term.toLowerCase().includes(filter.toLowerCase())) : [];
  const top = result?.ranked[0];
  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="QueryLens home"><span className="brand-icon"><Layers3 size={22}/></span>QueryLens<span className="brand-dot">.</span></a>
      <div className="workspace-label">WORKSPACE</div>
      <button className="nav-item active" onClick={() => setTab('frequency')}><BarChart3 size={18}/> Query analyzer <span className="nav-dot"/></button>
      <div className="sidebar-card"><div className="little-icon"><Code2 size={19}/></div><strong>Small queries.<br/>Clearer insights.</strong><p>Turn customer searches into a picture of what matters.</p><span>C++ powered <ArrowRight size={14}/></span></div>
      <div className="sidebar-bottom"><span className="avatar">G3</span><div><strong>Group 03</strong><small>E-commerce analytics</small></div></div>
    </aside>
    <div className="main-shell">
      <header><div>Workspace <ChevronRight size={14}/><span>Query analyzer</span></div><button className="guide-button" onClick={() => setHelp(true)}><FileText size={15}/> Project guide</button></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow">SEARCH INTELLIGENCE</div><h1>Every search tells a story.</h1><p>Explore customer queries, uncover popular searches, and see the numbers behind them.</p></div><span className="engine-badge"><span/> C++17 engine</span></div>
        <div className="stats">
          <Stat label="Total searches" value={result ? fmt(result.total) : '—'} note="All queries in your dataset" icon={<Search size={19}/>}/>
          <Stat label="Unique queries" value={result ? fmt(result.unique) : '—'} note="Distinct search terms" icon={<Hash size={19}/>}/>
          <Stat label="Most searched" value={top?.term || '—'} note={top ? `${top.count} searches · ${(top.count/result.total*100).toFixed(1)}% of total` : 'Your top query will appear here'} icon={<TrendingUp size={19}/>} word/>
          <Stat label="Repeat searches" value={result ? `${result.total ? ((result.total-result.unique)/result.total*100).toFixed(1) : '0.0'}%` : '—'} note="Occurrences beyond the first" icon={<Activity size={19}/>}/>
        </div>
        <div className="work-grid">
          <section className="panel input-panel"><div className="panel-title"><div className="title-group"><span className="step">01</span><h2>Your search data</h2></div><span className="subtle">INPUT</span></div><p className="panel-description">Paste your search logs. One query per line.</p>
            <div className="input-actions"><button onClick={() => {setInput(sample.join('\n')); setError('');}}><Sparkles size={14}/> Load sample</button><label className="upload"><Upload size={14}/> Import .txt<input type="file" accept=".txt,text/plain" onChange={upload}/></label></div>
            <div className="editor"><div className="editor-header"><span><FileText size={13}/> search_queries.txt</span><button aria-label="Clear queries" title="Clear queries" onClick={() => setInput('')}><Trash2 size={14}/></button></div><textarea aria-label="Search queries, one per line" spellCheck="false" value={input} onChange={e => setInput(e.target.value)} placeholder={'wireless headphones\nrunning shoes\nsmart watch'}/><div className="editor-footer"><span><span className="green-dot"/> {fmt(lines)} queries</span><span>Plain text</span></div></div>
            <label className="check-row"><input type="checkbox" checked={!caseSensitive} onChange={e => setCaseSensitive(!e.target.checked)}/><span>Ignore letter case<small>“Shoes” and “shoes” count as one query</small></span></label>
            <button className="analyze-button" disabled={busy || !input.trim()} onClick={analyze}>{busy ? <LoaderCircle className="spin" size={17}/> : <BarChart3 size={17}/>} {busy ? 'Analyzing queries…' : 'Analyze queries'}<ArrowRight size={17}/></button>
            <div className="input-footnote"><Database size={12}/> Processed by std::map&lt;string, int&gt;</div>
            {error && <div className="error" role="alert">{error}</div>}
          </section>
          <section className="panel results-panel"><div className="panel-title"><div className="title-group"><span className="step">02</span><h2>The query breakdown</h2></div><button className="export-button" disabled={!result?.total} onClick={download}><ArrowDownToLine size={14}/> Export CSV</button></div>
            <div className="tabs"><button className={tab==='frequency'?'selected':''} onClick={() => setTab('frequency')}><BarChart3 size={15}/> Frequency table</button><button className={tab==='performance'?'selected':''} onClick={() => setTab('performance')}><Activity size={15}/> Performance</button><button className={tab==='console'?'selected':''} onClick={() => setTab('console')}><Terminal size={15}/> Console</button></div>
            {stale && <div className="stale">Input changed. Analyze again to refresh these results.</div>}
            {!result ? <div className="empty"><span><BarChart3 size={32}/></span><h3>Your next insight starts here</h3><p>Your sample data is ready. Run the analyzer<br/>to discover what customers are searching for.</p><button onClick={analyze} disabled={busy}>Analyze sample data <ArrowRight size={15}/></button></div> : tab === 'frequency' ? <><div className="table-tools"><div className="search-field"><Search size={15}/><input aria-label="Filter results" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Find a query…"/></div><select aria-label="Sort query table" value={sort} onChange={e=>setSort(e.target.value)}><option value="ranked">Most frequent</option><option value="alphabetical">Alphabetical A–Z</option></select></div><div className="table-scroll"><table><thead><tr><th>#</th><th>SEARCH QUERY</th><th>FREQUENCY</th><th>SHARE</th></tr></thead><tbody>{rows.map((row,i) => <tr key={row.term}><td><span className={sort === 'ranked' && i === 0 && !filter ? 'rank first' : 'rank'}>{result[sort].indexOf(row)+1}</span></td><td className="query-name">{row.term}{row.term===top?.term && <span className="top-tag">TOP</span>}</td><td><div className="frequency-cell"><strong>{row.count}</strong><div className="mini-track"><div style={{width:`${row.count/top.count*100}%`}}/></div></div></td><td>{(row.count/result.total*100).toFixed(1)}%</td></tr>)}</tbody></table>{!rows.length && <p className="no-results">No matching queries.</p>}</div><div className="table-footer"><span>Showing {rows.length} of {result.unique} unique queries</span><span><Check size={13}/> Analysis complete</span></div></> : tab === 'performance' ? <div className="performance"><h3>Same queries. Two lookup strategies.</h3><p>Measured in the C++ engine across {fmt(result.benchmark.operations)} successful lookups, cycling through unique queries alphabetically.</p>{[['std::map', 'O(log U)', result.benchmark.mapUs],['std::vector', 'O(U)', result.benchmark.vectorUs]].map(([name,complexity,time])=><div className="benchmark" key={name}><div><strong>{name}</strong><code>{complexity}</code><span>{(time/1000).toFixed(3)} ms</span></div><div className="benchmark-track"><div style={{width:`${Math.max(1,time/Math.max(result.benchmark.mapUs,result.benchmark.vectorUs,1)*100)}%`}}/></div></div>)}<div className="benchmark-note">U = number of unique queries. The vector uses an unsorted linear scan. These are single-run measurements; timings vary with hardware, cache, dataset size, and string length. Small datasets may favor vectors despite their linear growth.</div></div> : <div className="console-output"><div><span className="green-dot"/> C++ engine output · alphabetical order</div><pre>{`QUERYLENS | SEARCH FREQUENCY\nTotal: ${result.total}  Unique: ${result.unique}\n\n${result.alphabetical.map(r => `${r.term.padEnd(30)} ${r.count}`).join('\n')}\n\nVOLUME RANKING\n${result.ranked.map((r,i)=>`${i+1}. ${r.term} — ${r.count}`).join('\n')}\n\nmap lookup: O(log U) | vector lookup: O(U)`}</pre><small>Formatted from the C++ response. Run npm run console for direct terminal output.</small></div>}
          </section>
        </div>
        <section className="explanation"><div className="explanation-icon"><Code2 size={23}/></div><div><h3>Built on the basics. Designed for understanding.</h3><p>Each query becomes a key. Each occurrence adds to its count. C++ STL does the heavy lifting.</p></div><div className="concept-tags"><code>std::map</code><code>std::vector</code><code>std::string</code></div></section>
        <footer><span>QUERYLENS <span className="footer-divider">/</span> E-commerce query frequency & ranking analyzer</span><span>GROUP 03 <span className="footer-divider">·</span> C++ × React</span></footer>
      </main>
    </div>
    {help && <div className="modal-backdrop" onClick={()=>setHelp(false)}><section className="guide-modal" role="dialog" aria-modal="true" aria-label="Project guide" onClick={e=>e.stopPropagation()}><button className="close-modal" autoFocus aria-label="Close guide" onClick={()=>setHelp(false)}><X/></button><span className="eyebrow">PROJECT GUIDE</span><h2>From search logs to insight.</h2><ol><li>Paste queries, one per line, or import a .txt file.</li><li>Choose whether to combine uppercase and lowercase variants.</li><li>Analyze to count queries using C++ std::map.</li><li>Explore rankings, compare lookup timings, or export CSV.</li></ol><p>Whitespace is trimmed and repeated whitespace is collapsed. Case folding covers ASCII letters; other UTF-8 text is preserved. Ranking ties use alphabetical order.</p><p>This project counts full search queries, not individual words or actual customer orders. No customer identity is required.</p><code>npm run console &lt; queries.txt</code></section></div>}
  </div>;
}
function Stat({label,value,note,icon,word}) { return <section className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className={'stat-value'+(word?' word':'')}>{value}</div><small>{note}</small></section>; }

createRoot(document.getElementById('root')).render(<App/>);
