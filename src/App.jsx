import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('easyGuitarTabs-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('easyGuitarTabs-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem('easyGuitarTabs');
    return saved ? JSON.parse(saved) : [];
  });

  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState(25);
  const [grid, setGrid] = useState(() => Array(6).fill(null).map(() => Array(25).fill('')));
  const gridRefs = useRef([]);
  const stringOrder = ['e', 'B', 'G', 'D', 'A', 'E'];

  useEffect(() => {
    localStorage.setItem('easyGuitarTabs', JSON.stringify(tabs));
  }, [tabs]);

  const handleKeyDown = (row, col, e) => {
    if (['Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    let newRow = row, newCol = col;
    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) newCol = col < columns - 1 ? col + 1 : (addColumn(), col + 1);
    if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) newCol = col > 0 ? col - 1 : 0;
    if (e.key === 'ArrowDown' || e.key === 'Enter') newRow = row < 5 ? row + 1 : row;
    if (e.key === 'ArrowUp') newRow = row > 0 ? row - 1 : 0;
    setTimeout(() => gridRefs.current[newRow][newCol]?.focus(), 0);
  };

  const updateNote = (row, col, value) => {
    const clean = value.replace(/[^0-9hpbr~\\\/.|]/gi, '').slice(0, 5);
    setGrid(prev => { const g = prev.map(r => [...r]); g[row][col] = clean; return g; });
  };

  const addColumn = () => {
    setGrid(prev => prev.map(row => [...row, '']));
    setColumns(c => c + 1);
  };

  const saveTab = () => {
    if (!title.trim()) return alert('Enter song title!');
    const tabLines = stringOrder.map((str, i) => str + '|' + grid[i].map(n => n || '-').join('-')).join('\n');
    setTabs(prev => [{ id: Date.now(), title: title.trim(), tab: tabLines, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }, ...prev]);
    setTitle(''); setGrid(Array(6).fill(null).map(() => Array(25).fill(''))); setColumns(25);
    alert('Tab saved!');
  };

  const deleteTab = (id) => setTabs(prev => prev.filter(t => t.id !== id));

  const exportAll = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(tabs, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `easy-guitar-tabs-${new Date().toISOString().slice(0,10)}.json`; a.click();
  };

  const shareTabs = () => {
    const text = tabs.length > 0
      ? `Check out my guitar tabs!\n\n${tabs.map(t => t.title).join(', ')}\n\nMade with Easy Guitar Tabs → https://reevchris100.github.io/easy-guitar-tabs/`
      : 'Check out this free guitar tab editor by an Indian dev!\nhttps://reevchris100.github.io/easy-guitar-tabs/';

    if (navigator.share) {
      navigator.share({ title: 'My Guitar Tabs', text, url: 'https://reevchris100.github.io/easy-guitar-tabs/' });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied! Paste in WhatsApp/Instagram');
    }
  };

  const restoreFromBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data) && confirm(`Restore ${data.length} tabs?`)) { setTabs(data); alert('Restored!'); }
      } catch { alert('Invalid file'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const filteredTabs = tabs.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      {/* Dark/Light Toggle — Only Sun/Moon Icons */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-6 right-6 z-50 w-14 h-14 bg-gray-800/90 backdrop-blur-lg rounded-full flex items-center justify-center text-2xl shadow-2xl hover:scale-110 transition-all border border-gray-700"
        aria-label="Toggle dark/light mode"
      >
        {isDark ? 'Dark' : 'Light'}
      </button>

      <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-gradient-to-b from-black via-gray-900 to-black' : 'bg-gradient-to-b from-gray-50 via-white to-gray-100'} text-${isDark ? 'white' : 'gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <header className="text-center mb-16">
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r ${isDark ? 'from-green-400 via-cyan-400 to-blue-500' : 'from-green-600 via-cyan-600 to-blue-700'} bg-clip-text text-transparent tracking-tight`}>
              Easy Guitar Tabs
            </h1>
            <p className={`text-${isDark ? 'gray-400' : 'gray-600'} text-xl mt-6 font-medium`}>Made in India</p>
          </header>

          <div className={`${isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/95 border-gray-300'} backdrop-blur-xl rounded-3xl shadow-2xl border overflow-hidden`}>
            <div className="p-6 pb-4">
              <input
                type="text"
                placeholder="Enter song title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={`w-full px-6 py-5 ${isDark ? 'bg-gray-800/80 placeholder-gray-500' : 'bg-gray-100 placeholder-gray-600'} rounded-2xl text-2xl font-semibold text-center focus:outline-none focus:ring-4 focus:ring-cyan-500 transition-all`}
              />
            </div>

            <div className="overflow-x-auto scrollbar-hide px-6 pb-8">
              <div className="inline-block min-w-full">
                <div className="space-y-5">
                  {stringOrder.map((str, row) => (
                    <div key={str} className="flex items-center gap-4">
                      <div className={`w-16 text-right font-black text-2xl sticky left-0 ${isDark ? 'text-green-400 bg-gray-900/90' : 'text-green-600 bg-white/95'} backdrop-blur z-10 -ml-6 pl-4 pr-2`}>
                        {str}|
                      </div>
                      <div className="flex gap-4">
                        {grid[row].map((note, col) => (
                          <input
                            key={col}
                            ref={el => { if (!gridRefs.current[row]) gridRefs.current[row] = []; gridRefs.current[row][col] = el; }}
                            type="text"
                            value={note}
                            onChange={e => updateNote(row, col, e.target.value)}
                            onKeyDown={e => handleKeyDown(row, col, e)}
                            className={`w-16 h-16 ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-gray-100 border-gray-400'} border-2 rounded-xl text-center text-xl font-bold font-mono focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-md`}
                            placeholder="—"
                            maxLength="5"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 Clean Buttons — "+ Column" → "Add Tab" */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-t ${isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-300 bg-gray-50'}`}>
              <button onClick={saveTab} className="py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl font-bold text-xl shadow-lg transition transform active:scale-95 text-white">
                Save Tab
              </button>
              <button onClick={addColumn} className="py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-2xl font-bold text-xl shadow-lg transition transform active:scale-95 text-white">
                Add Tab
              </button>
              <button onClick={exportAll} className="py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl font-bold text-xl shadow-lg transition transform active:scale-95 text-white">
                Export All
              </button>
              <label className="py-5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-2xl font-bold text-xl cursor-pointer text-center shadow-lg transition transform active:scale-95 text-white">
                Restore
                <input type="file" accept=".json" onChange={restoreFromBackup} className="hidden" />
              </label>
            </div>
          </div>

          <div className="mt-10">
            <input
              type="text"
              placeholder="Search your tabs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full px-6 py-5 ${isDark ? 'bg-gray-800/80' : 'bg-gray-200'} rounded-2xl text-xl font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500 transition-all`}
            />
          </div>

          <div className="mt-10 space-y-6">
            {filteredTabs.length === 0 ? (
              <div className="text-center py-20">
                <p className={`text-2xl font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  {search ? 'No tabs found' : 'Your first masterpiece awaits!'}
                </p>
              </div>
            ) : (
              filteredTabs.map(tab => (
                <div key={tab.id} className={`${isDark ? 'bg-gray-900/80 border-gray-700 hover:border-cyan-600' : 'bg-white/80 border-gray-300 hover:border-cyan-500'} backdrop-blur rounded-2xl p-6 border transition-all`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-3xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{tab.title}</h3>
                    <button onClick={() => deleteTab(tab.id)} className="text-red-500 hover:text-red-400 text-3xl font-bold">×</button>
                  </div>
                  <pre className={`${isDark ? 'bg-black/50 text-gray-300' : 'bg-gray-100 text-gray-800'} p-6 rounded-xl font-mono text-lg overflow-x-auto`}>
                    {tab.tab}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Floating Share Button — Only Icon */}
        <button
          onClick={shareTabs}
          className="fixed bottom-8 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-3xl shadow-2xl z-50 hover:scale-110 active:scale-95 transition-all"
          aria-label="Share"
        >
          Share
        </button>
      </div>
    </>
  );
}

export default App;