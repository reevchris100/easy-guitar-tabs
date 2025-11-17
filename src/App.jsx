import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem('easyGuitarTabs');
    return saved ? JSON.parse(saved) : [];
  });

  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState(30);

  const [grid, setGrid] = useState(() =>
    Array(6).fill(null).map(() => Array(30).fill(''))
  );

  const gridRefs = useRef([]);
  const stringOrder = ['e', 'B', 'G', 'D', 'A', 'E'];

  useEffect(() => {
    localStorage.setItem('easyGuitarTabs', JSON.stringify(tabs));
  }, [tabs]);

  const handleKeyDown = (row, col, e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = e.shiftKey ? col - 1 : col + 1;
      if (nextCol >= 0 && nextCol < columns) {
        gridRefs.current[row][nextCol]?.focus();
      } else if (!e.shiftKey && col === columns - 1) {
        addColumn();
        setTimeout(() => gridRefs.current[row][nextCol + 1]?.focus(), 0);
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const nextRow = row + 1;
      if (nextRow < 6) {
        gridRefs.current[nextRow][col]?.focus();
      }
    }

    // ARROW KEY NAVIGATION (Up/Down/Left/Right)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      let newRow = row;
      let newCol = col;

      if (e.key === 'ArrowUp' && row > 0) newRow = row - 1;
      if (e.key === 'ArrowDown' && row < 5) newRow = row + 1;
      if (e.key === 'ArrowLeft' && col > 0) newCol = col - 1;
      if (e.key === 'ArrowRight') {
        if (col < columns - 1) newCol = col + 1;
        else {
          addColumn();
          setTimeout(() => gridRefs.current[row][newCol + 1]?.focus(), 0);
        }
      }

      gridRefs.current[newRow][newCol]?.focus();
    }
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
    const tabLines = stringOrder.map((str, i) => {
      return str + '|' + grid[i].map(note => note || '-').join('-');
    }).join('\n');

    const newTab = {
      id: Date.now(),
      title: title.trim(),
      tab: tabLines,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    setTabs(prev => [newTab, ...prev]);
    setTitle('');
    setGrid(Array(6).fill(null).map(() => Array(30).fill('')));
    setColumns(30);
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
      } catch { alert('Invalid backup file'); }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const filteredTabs = tabs.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
            Easy Guitar Tabs
          </h1>
          {/* Subheader removed as requested */}
        </header>

        <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">
          <div className="p-8 pb-4">
            <input
              type="text"
              placeholder="Song Title (Required)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-6 py-4 mb-6 bg-gray-800 rounded-xl text-2xl text-center focus:outline-none focus:ring-4 focus:ring-green-500"
            />
          </div>

          <div className="overflow-x-auto relative">
            <div className="min-w-max">
              <div className="space-y-3 px-8 pb-8">
                {stringOrder.map((str, row) => (
                  <div key={str} className="flex items-center gap-3">
                    <div className="w-16 text-right text-green-400 font-bold text-xl sticky left-0 bg-gray-900 z-20 pr-2 -ml-8 pl-2">
                      {str}|
                    </div>
                    <div className="flex gap-1">
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
                          className="w-20 h-14 bg-gray-800 border border-gray-700 rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          placeholder="-----"
                          maxLength="5"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 p-8 justify-center flex-wrap items-center border-t border-gray-800 bg-gray-900">
            <button onClick={saveTab} className="px-10 py-5 bg-green-600 hover:bg-green-700 rounded-xl text-xl font-bold transition transform hover:scale-105">
              Save Tab
            </button>
            <button onClick={exportAll} className="px-8 py-5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xl font-bold">
              Export All
            </button>
            <label className="px-8 py-5 bg-orange-600 hover:bg-orange-700 rounded-xl text-xl font-bold cursor-pointer">
              Restore Backup
              <input type="file" accept=".json" onChange={restoreFromBackup} className="hidden" />
            </label>
            <button
              onClick={addColumn}
              className="w-16 h-16 bg-green-600 hover:bg-green-700 rounded-xl flex items-center justify-center text-4xl font-bold shadow-lg transition transform hover:scale-110"
              title="Add new column"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-10">
          <input
            type="text"
            placeholder="Search your tabs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-6 py-4 bg-gray-800 rounded-xl text-xl focus:outline-none focus:ring-4 focus:ring-green-500"
          />
        </div>

        <div className="mt-8 space-y-6">
          {filteredTabs.length === 0 ? (
            <p className="text-center text-gray-500 text-2xl py-20">
              {search ? 'No tabs found' : 'Start creating your first tab!'}
            </p>
          ) : (
            filteredTabs.map(tab => (
              <div key={tab.id} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-green-600 transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-3xl font-bold text-green-400">{tab.title}</h3>
                  <button onClick={() => deleteTab(tab.id)} className="text-red-500 hover:text-red-400 text-xl">Delete</button>
                </div>
                <pre className="bg-black p-6 rounded-xl font-mono text-lg overflow-x-auto">
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