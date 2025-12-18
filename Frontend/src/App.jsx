import React, { useState, useRef } from 'react';
import axios from 'axios';

function App() {
  const canvasRef = useRef(null);

  const [sessionId, setSessionId] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  const [activeTool, setActiveTool] = useState('rectangle'); 
  const [loading, setLoading] = useState(false);
  
  const [initWidth, setInitWidth] = useState(800);
  const [initHeight, setInitHeight] = useState(600);

  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(150);
  const [radius, setRadius] = useState(50);
  const [color, setColor] = useState('#EC4186');
  const [text, setText] = useState('Neon Vibes');
  const [fontSize, setFontSize] = useState(24);
  const [imageFile, setImageFile] = useState(null);

  const getContext = () => canvasRef.current.getContext('2d');

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/initialize', { width: initWidth, height: initHeight });
      setSessionId(res.data.id);
      setDimensions({ width: initWidth, height: initHeight });
      const ctx = getContext();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, initWidth, initHeight);
    } catch (err) {
      console.error(err);
      alert('Failed to initialize canvas');
    } finally {
      setLoading(false);
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
    if (!imageFile) return alert('Please select an image first');
    const formData = new FormData();
    formData.append('id', sessionId);
    formData.append('x', x);
    formData.append('y', y);
    if(width) formData.append('width', width); 
    if(height) formData.append('height', height);
    formData.append('imageFile', imageFile);
    try {
      await axios.post('/api/draw/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => { getContext().drawImage(img, x, y, width || img.width, height || img.height); };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    } catch (err) { alert('Error uploading image'); }
  };

  const handleExport = () => {
    if (!sessionId) return;
    window.location.href = `/api/export/${sessionId}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#FFFFFF', letterSpacing: '1px' }}>NEON CANVAS</h2>
          <span style={{ fontSize: '0.8rem', opacity: 0.8, color: '#EC4186' }}>v1.0 API</span>
        </div>
        {!sessionId && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>1. Project Setup</h3>
            <div style={styles.inputGroup}>
              <div style={styles.halfInput}>
                <label style={styles.label}>Width</label>
                <input type="number" value={initWidth} onChange={e => setInitWidth(Number(e.target.value))} style={styles.input} />
              </div>
              <div style={styles.halfInput}>
                <label style={styles.label}>Height</label>
                <input type="number" value={initHeight} onChange={e => setInitHeight(Number(e.target.value))} style={styles.input} />
              </div>
            </div>
            <button onClick={handleInitialize} style={styles.primaryButton} disabled={loading}>
              {loading ? 'INITIALIZING...' : 'CREATE CANVAS'}
            </button>
          </div>
        )}
        {sessionId && (
          <>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>2. Select Tool</h3>
              <div style={styles.toolGrid}>
                {['rectangle', 'circle', 'text', 'image'].map(tool => (
                  <button 
                    key={tool} 
                    onClick={() => setActiveTool(tool)}
                    style={{
                      ...styles.toolButton,
                      background: activeTool === tool ? '#EC4186' : 'transparent',
                      color: activeTool === tool ? '#FFFFFF' : '#EC4186',
                      borderColor: '#EC4186'
                    }}
                  >
                    {tool.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>3. Configure {activeTool}</h3>
              <div style={styles.inputGroup}>
                <div style={styles.halfInput}>
                  <label style={styles.label}>X Position</label>
                  <input type="number" value={x} onChange={e => setX(Number(e.target.value))} style={styles.input} />
                </div>
                <div style={styles.halfInput}>
                  <label style={styles.label}>Y Position</label>
                  <input type="number" value={y} onChange={e => setY(Number(e.target.value))} style={styles.input} />
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                 <label style={styles.label}>Color Picker</label>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} style={styles.colorPicker} />
                    <span style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>{color}</span>
                 </div>
              </div>
              {activeTool === 'rectangle' && (
                <div style={styles.inputGroup}>
                  <div style={styles.halfInput}>
                    <label style={styles.label}>Width</label>
                    <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} style={styles.input} />
                  </div>
                  <div style={styles.halfInput}>
                    <label style={styles.label}>Height</label>
                    <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} style={styles.input} />
                  </div>
                  <button onClick={handleDrawRect} style={styles.actionButton}>ADD RECTANGLE</button>
                </div>
              )}
              {activeTool === 'circle' && (
                <div style={styles.inputGroup}>
                  <div style={styles.halfInput}>
                    <label style={styles.label}>Radius</label>
                    <input type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} style={styles.input} />
                  </div>
                  <button onClick={handleDrawCircle} style={styles.actionButton}>ADD CIRCLE</button>
                </div>
              )}
              {activeTool === 'text' && (
                <div style={styles.inputGroup}>
                   <div style={{width: '100%', marginBottom: '10px'}}>
                     <label style={styles.label}>Content</label>
                     <input type="text" value={text} onChange={e => setText(e.target.value)} style={styles.input} />
                   </div>
                   <div style={styles.halfInput}>
                     <label style={styles.label}>Font Size</label>
                     <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={styles.input} />
                   </div>
                   <button onClick={handleDrawText} style={styles.actionButton}>ADD TEXT</button>
                </div>
              )}
              {activeTool === 'image' && (
                <div style={styles.inputGroup}>
                  <div style={{width: '100%', marginBottom: '10px'}}>
                    <label style={styles.label}>Upload File</label>
                    <input type="file" onChange={e => setImageFile(e.target.files[0])} style={{...styles.input, padding: '5px'}} />
                  </div>
                  <div style={styles.halfInput}>
                    <label style={styles.label}>Width (Opt)</label>
                    <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} style={styles.input} />
                  </div>
                  <button onClick={handleDrawImage} style={styles.actionButton}>UPLOAD & DRAW</button>
                </div>
              )}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <button onClick={handleExport} style={styles.exportButton}>
                DOWNLOAD PDF
              </button>
            </div>
          </>
        )}
      </div>
      <div style={styles.mainArea}>
        <div style={styles.canvasWrapper}>
           {!sessionId && <div style={{color: '#38124A', fontWeight: 'bold'}}>No Canvas Initialized</div>}
           <canvas 
             ref={canvasRef}
             width={dimensions.width}
             height={dimensions.height}
             style={{ 
               ...styles.canvas,
               display: sessionId ? 'block' : 'none'
             }}
           />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0'
  },
  sidebar: {
    width: '340px',
    backgroundColor: '#38124A',
    color: '#FFFFFF',        
    display: 'flex',
    flexDirection: 'column',
    padding: '25px',
    boxShadow: '4px 0 15px rgba(56, 18, 74, 0.4)',
    zIndex: 10,
    overflowY: 'auto'
  },
  header: {
    borderBottom: '2px solid #EC4186',
    paddingBottom: '20px',
    marginBottom: '25px'
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#EE544A',
    marginBottom: '15px',
    marginTop: 0,
    fontWeight: 'bold'
  },
  inputGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '12px'
  },
  halfInput: {
    flex: 1,
    minWidth: '100px'
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    marginBottom: '6px',
    color: '#E0E0E0',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #5a2d7a',
    backgroundColor: '#2a0d38',
    color: '#FFFFFF',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    outline: 'none'
  },
  colorPicker: {
    border: '2px solid #fff',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    borderRadius: '4px'
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#EC4186',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px',
    letterSpacing: '1px',
    boxShadow: '0 4px 10px rgba(236, 65, 134, 0.3)',
    transition: 'transform 0.1s'
  },
  actionButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#EE544A',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '15px',
    textTransform: 'uppercase',
    fontSize: '0.85rem'
  },
  exportButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'transparent', 
    color: '#EC4186',
    border: '2px solid #EC4186',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '900',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    transition: 'all 0.3s'
  },
  toolGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  toolButton: {
    padding: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    textAlign: 'center',
    border: '2px solid transparent',
    fontSize: '0.8rem'
  },
  mainArea: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    overflow: 'auto'
  },
  canvasWrapper: {
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
    border: '2px solid #38124A',
    backgroundColor: '#fff'
  },
  canvas: {
    display: 'block',
    backgroundColor: '#ffffff'
  }
};

export default App;