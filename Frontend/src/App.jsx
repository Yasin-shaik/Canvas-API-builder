import React, { useState, useRef } from 'react';
import axios from 'axios';

function App() {
  // --- REFS & STATE (Logic remains the same) ---
  const canvasRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState('rectangle');
  
  // Inputs
  const [initWidth, setInitWidth] = useState(800);
  const [initHeight, setInitHeight] = useState(600);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [radius, setRadius] = useState(50);
  const [color, setColor] = useState('#000000');
  const [text, setText] = useState('Hello World');
  const [fontSize, setFontSize] = useState(20);
  const [imageFile, setImageFile] = useState(null);

  // --- HELPERS ---
  const getContext = () => canvasRef.current.getContext('2d');

  // --- API HANDLERS ---
  const handleInitialize = async () => {
    try {
      const res = await axios.post('/api/initialize', { width: initWidth, height: initHeight });
      setSessionId(res.data.id);
      setDimensions({ width: initWidth, height: initHeight });
      const ctx = getContext();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, initWidth, initHeight);
    } catch (err) {
      alert('Failed to initialize canvas');
    }
  };

  const handleDrawRect = async () => {
    try {
      await axios.post('/api/draw/rectangle', { id: sessionId, x, y, width, height, color });
      const ctx = getContext();
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
    } catch (err) { alert('Error drawing rectangle'); }
  };

  const handleDrawCircle = async () => {
    try {
      await axios.post('/api/draw/circle', { id: sessionId, x, y, radius, color });
      const ctx = getContext();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } catch (err) { alert('Error drawing circle'); }
  };

  const handleDrawText = async () => {
    try {
      await axios.post('/api/draw/text', { id: sessionId, text, x, y, fontSize, color });
      const ctx = getContext();
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    } catch (err) { alert('Error drawing text'); }
  };

  const handleDrawImage = async () => {
    if (!imageFile) return alert('Select an image');
    const formData = new FormData();
    formData.append('id', sessionId);
    formData.append('x', x);
    formData.append('y', y);
    formData.append('width', width);
    formData.append('height', height);
    formData.append('imageFile', imageFile);

    try {
      await axios.post('/api/draw/image', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => getContext().drawImage(img, x, y, width, height);
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    } catch (err) { alert('Error uploading image'); }
  };

  const handleExport = () => {
    if (sessionId) window.location.href = `/api/export/${sessionId}`;
  };

  // --- UI RENDER ---
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">Canvas Builder</h1>
          <p className="text-xs text-gray-400 mt-1">v1.0.0 API Integration</p>
        </div>

        <div className="flex-1 p-6 space-y-8">
          
          {/* 1. SETUP SECTION */}
          {!sessionId && (
            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold">1. Setup Canvas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                  <input type="number" value={initWidth} onChange={e => setInitWidth(Number(e.target.value))} 
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                  <input type="number" value={initHeight} onChange={e => setInitHeight(Number(e.target.value))} 
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
                </div>
              </div>
              <button onClick={handleInitialize} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all active:scale-95">
                Initialize Canvas
              </button>
            </div>
          )}

          {/* 2. TOOLS SECTION */}
          {sessionId && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold">2. Select Tool</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['rectangle', 'circle', 'text', 'image'].map(tool => (
                    <button 
                      key={tool} 
                      onClick={() => setActiveTool(tool)}
                      className={`py-2 px-3 text-sm font-medium rounded-md transition-all capitalize
                        ${activeTool === tool 
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500 shadow-sm' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. PROPERTIES SECTION */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">3. Configure</h3>
                
                {/* GLOBAL POS & COLOR */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="block text-xs text-gray-500 mb-1">X Pos</label>
                     <input type="number" value={x} onChange={e => setX(Number(e.target.value))} className="w-full p-1.5 text-sm border rounded" />
                  </div>
                  <div>
                     <label className="block text-xs text-gray-500 mb-1">Y Pos</label>
                     <input type="number" value={y} onChange={e => setY(Number(e.target.value))} className="w-full p-1.5 text-sm border rounded" />
                  </div>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                      <span className="text-xs text-gray-500 font-mono">{color}</span>
                    </div>
                </div>

                {/* DYNAMIC INPUTS */}
                {activeTool === 'rectangle' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="W" value={width} onChange={e => setWidth(Number(e.target.value))} className="p-2 text-sm border rounded" />
                    <input type="number" placeholder="H" value={height} onChange={e => setHeight(Number(e.target.value))} className="p-2 text-sm border rounded" />
                  </div>
                )}
                
                {activeTool === 'circle' && (
                   <input type="number" placeholder="Radius" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full p-2 text-sm border rounded" />
                )}

                {activeTool === 'text' && (
                  <div className="space-y-2">
                    <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full p-2 text-sm border rounded" placeholder="Type text..." />
                    <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full p-2 text-sm border rounded" placeholder="Font Size" />
                  </div>
                )}

                {activeTool === 'image' && (
                   <div className="space-y-2">
                     <input type="file" onChange={e => setImageFile(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                     <div className="grid grid-cols-2 gap-3">
                        <input type="number" placeholder="W" value={width} onChange={e => setWidth(Number(e.target.value))} className="p-2 text-sm border rounded" />
                        <input type="number" placeholder="H" value={height} onChange={e => setHeight(Number(e.target.value))} className="p-2 text-sm border rounded" />
                     </div>
                   </div>
                )}

                {/* ACTION BUTTON */}
                <button 
                  onClick={activeTool === 'rectangle' ? handleDrawRect : activeTool === 'circle' ? handleDrawCircle : activeTool === 'text' ? handleDrawText : handleDrawImage}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded shadow-sm transition active:scale-95 mt-2"
                >
                  {activeTool === 'image' ? 'Upload & Draw' : `Add ${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* FOOTER: EXPORT */}
        {sessionId && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* MAIN PREVIEW AREA */}
      <div className="flex-1 bg-gray-200 overflow-auto flex items-center justify-center p-10 relative">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#999 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* CANVAS */}
        <div className="relative z-10 shadow-2xl rounded-sm overflow-hidden bg-white border border-gray-300">
           {!sessionId && <div className="p-10 text-gray-400 font-medium">Initialize canvas to start...</div>}
           <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className={!sessionId ? 'hidden' : 'block'} />
        </div>
      </div>

    </div>
  );
}

export default App;