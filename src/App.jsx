import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem('easyGuitarTabs');
    return saved ? JSON.parse(saved) : [];
  });

  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState(20);

  const [grid, setGrid] = useState(() =>
    Array(6).fill(null).map(() => Array(20).fill(''))
  );

  const gridRefs = useRef([]);
  const stringOrder = ['e', 'B', 'G', 'D', 'A', 'E'];

  useEffect(() => {
    localStorage.setItem('easyGuitarTabs', JSON.stringify(tabs));
  }, [tabs]);

  const handleKeyDown = (row, col, e) => {
    if (['Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    let newRow = row;
    let newCol = col;

    if (e.key === 'Tab' || e.key === 'ArrowRight') {
      newCol = e.shiftKey ? col - 1 : (col < columns - 1 ? col + 1 : columns);
      if (newCol === columns) {
        addColumn();
        setTimeout(() => gridRefs.current[row][newCol]?.focus(), 50);
      }
    }
    if (e.key === 'ArrowLeft') newCol = col > 0 ? col - 1 : 0;
    if (e.key === 'Enter' || e.key === 'ArrowDown') newRow = row < 5 ? row + 1 : row;
    if (e.key === 'ArrowUp') newRow = row > 0 ? row - 1 : 0;

    gridRefs.current[newRow][newCol]?.focus();
  };

  const updateNote = (row, col, value) => {
    const clean = value.replace(/[^0-9hpbr~\\\/.|]/gi, '').slice(0, 5);
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = clean;
      return newGrid;
    });
  };

  const addColumn = () => {
    setGrid(prev => prev.map(row => [...row, '']));
    setColumns(c => c + 1);
  };

  const saveTab = () => {
    if (!title.trim()) return alert('Enter song title!');
    const tabLines = stringOrder.map((str, i) =>
      str + '|' + grid[i].map(note => note || '-').join('-')
    ).join('\n');

    setTabs(prev => [{
      id: Date.now(),
      title: title.trim(),
      tab: tabLines,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }, ...prev]);

    setTitle('');
    setGrid(Array(6).fill(null).map(() => Array(20).fill('')));
    setColumns(20);
    alert('Tab saved!');
  };

  const deleteTab = (id) => setTabs(prev => prev.filter(t => t.id !== id));

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(tabs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easy-guitar-tabs-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreFromBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data) && confirm(`Restore ${data.length} tabs?`)) {
          setTabs(data);
          alert('Backup restored!');
        }
      } catch { alert('Invalid file'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const filteredTabs = tabs.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <header className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
            Easy Guitar Tabs
          </h1>
        </header>

        <div className="bg-gray-900/80 backdrop-blur rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-5">
            <input
              type="text"
              placeholder="Song Title (e.g. Tum Hi Ho)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-5 py-4 bg-gray-800/80 rounded-2xl text-xl text-center focus:outline-none focus:ring-4 focus:ring-green-500"
            />
          </div>

          {/* Mobile-Optimized Grid */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="min-w-max px-5 pb-6">
              <div className="space-y-4">
                {stringOrder.map((str, row) => (
                  <div key={str} className="flex items-center gap-3">
                    <div className="w-14 text-right text-green-400 font-bold text-xl sticky left-0 bg-gray-900/80 backdrop-blur z-20 -ml-5 pl-3 pr-1 shadow-2xl">
                      {str}|
                    </div>
                    <div className="flex gap-2">
                      {grid[row].map((note, col) => (
                        <input
                          key={col}
                          ref={el => {
                            if (!gridRefs.current[row]) gridRefs.current[row] = [];
                            gridRefs.current[row][col] = el;
                          }}
                          type="text"
                          value={note}
                          onChange={e => updateNote(row, col, e.target.value)}
                          onKeyDown={e => handleKeyDown(row, col, e)}
                          className="w-16 md:w-20 h-16 bg-gray-800/90 border border-gray-700 rounded-xl text-center text-xl font-mono focus:outline-none focus:ring-4 focus:ring-green-500 transition-all"
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

          {/* Floating + Button (Mobile Bottom Right) */}
          <button
            onClick={addColumn}
            className="fixed bottom-6 right-6 w-16 h-16 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl z-50 transition transform active:scale-90"
          >
            +
          </button>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:flex md:justify-center gap-4 p-6 border-t border-gray-800 bg-gray-900/90">
            <button onClick={saveTab} className="px-8 py-5 bg-green-600 hover:bg-green-700 rounded-2xl font-bold text-lg transition transform active:scale-95">
              Save Tab
            </button>
            <button onClick={exportAll} className="px-8 py-5 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-lg transition transform active:scale-95">
              Export All
            </button>
            <label className="px-8 py-5 bg-orange-600 hover:bg-orange-700 rounded-2xl font-bold text-lg cursor-pointer text-center transition transform active:scale-95">
              Restore
              <input type="file" accept=".json" onChange={restoreFromBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="mt-8">
          <input
            type="text"
            placeholder="Search tabs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-6 py-4 bg-gray-800/80 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-green-500"
          />
        </div>

        {/* Saved Tabs */}
        <div className="mt-8 space-y-5">
          {filteredTabs.length === 0 ? (
            <p className="text-center text-gray-500 text-xl py-20">
              {search ? 'No tabs found' : 'Your first tab awaits!'}
            </p>
          ) : (
            filteredTabs.map(tab => (
              <div key={tab.id} className="bg-gray-900/80 backdrop-blur rounded-2xl p-6 border border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-2xl font-bold text-green-400">{tab.title}</h3>
                  <button onClick={() => deleteTab(tab.id)} className="text-red-500 text-lg">Delete</button>
                </div>
                <pre className="bg-black/50 p-5 rounded-xl font-mono text-sm overflow-x-auto">
                  {tab.tab}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;