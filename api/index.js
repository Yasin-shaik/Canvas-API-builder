const express = require('express');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const multer = require('multer');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const path = require('path'); 

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../client/dist')));

const canvasStore = {};

app.post('/api/initialize', (req, res) => {
    const { width, height } = req.body;
    if (!width || !height) {
        return res.status(400).json({ error: 'Width and height are required.' });
    }
    try {
        const canvas = createCanvas(parseInt(width), parseInt(height));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        const id = crypto.randomUUID();
        canvasStore[id] = { 
            canvas, 
            ctx, 
            width, 
            height,
            drawHistory: [],
        };
        console.log(`Canvas initialized: ID ${id} (${width}x${height})`);
        res.status(201).json({
            message: 'Canvas initialized successfully',
            id: id,
            dimensions: { width, height }
        });

    } catch (error) {
        console.error('Error initializing canvas:', error);
        res.status(500).json({ error: 'Failed to initialize canvas' });
    }
});

app.post('/api/draw/rectangle', (req, res) => {
    const { id, x, y, width, height, color } = req.body;
    if (!id || !canvasStore[id]) {
        return res.status(404).json({ error: 'Canvas session not found. Please initialize first.' });
    }
    const { ctx, drawHistory } = canvasStore[id];
    ctx.fillStyle = color || '#000000';
    ctx.fillRect(x, y, width, height);
    drawHistory.push({
        type: 'rectangle',
        params: { x, y, width, height, color: ctx.fillStyle }
    });
    res.json({ message: 'Rectangle drawn successfully' });
});

app.post('/api/draw/circle', (req, res) => {
    const { id, x, y, radius, color } = req.body;
    if (!id || !canvasStore[id]) {
        return res.status(404).json({ error: 'Canvas session not found.' });
    }
    const { ctx, drawHistory } = canvasStore[id];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = color || '#000000';
    ctx.fill();
    ctx.closePath();
    drawHistory.push({
        type: 'circle',
        params: { x, y, radius, color: ctx.fillStyle }
    });
    res.json({ message: 'Circle drawn successfully' });
});

app.post('/api/draw/text', (req, res) => {
    const { id, text, x, y, fontSize, color, fontFamily } = req.body;
    if (!id || !canvasStore[id]) {
        return res.status(404).json({ error: 'Canvas session not found.' });
    }
    const { ctx, drawHistory } = canvasStore[id];
    const size = fontSize || 20;
    const family = fontFamily || 'Arial';
    ctx.font = `${size}px "${family}"`;
    ctx.fillStyle = color || '#000000';
    ctx.fillText(text, x, y);
    drawHistory.push({
        type: 'text',
        params: { text, x, y, fontSize: size, fontFamily: family, color: ctx.fillStyle }
    });
    res.json({ message: 'Text added successfully' });
});

app.post('/api/draw/image', upload.single('imageFile'), async (req, res) => {
    const { id, imageUrl, x, y, width, height } = req.body;
    const file = req.file;

    if (!id || !canvasStore[id]) {
        return res.status(404).json({ error: 'Canvas session not found.' });
    }

    try {
        let imageSource;
        let storageSource; 
        if (file) {
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            imageSource = base64Image;
            storageSource = base64Image; 
        } else if (imageUrl) {
            imageSource = imageUrl;
            storageSource = imageUrl;
        } else {
            return res.status(400).json({ error: 'Provide either "imageUrl" or "imageFile".' });
        }
        const img = await loadImage(imageSource);
        const { ctx, drawHistory } = canvasStore[id];
        const w = width ? parseInt(width) : img.width;
        const h = height ? parseInt(height) : img.height;
        ctx.drawImage(img, parseInt(x), parseInt(y), w, h);
        drawHistory.push({
            type: 'image',
            params: { 
                src: storageSource, 
                x: parseInt(x), 
                y: parseInt(y), 
                width: w, 
                height: h 
            }
        });
        res.json({ message: 'Image added successfully' });
    } catch (error) {
        console.error('Image Error:', error);
        res.status(500).json({ error: 'Failed to load or draw image.' });
    }
});

app.get('/api/export/:id', async (req, res) => {
    const { id } = req.params;
    if (!canvasStore[id]) {
        return res.status(404).send('Canvas session not found');
    }
    const { width, height, drawHistory } = canvasStore[id];
    try {
        const doc = new PDFDocument({ 
            size: [width, height], 
            compress: true,
            info: { Title: `Canvas Export ${id}`, Author: 'Canvas Builder API' } 
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="canvas-${id}.pdf"`);
        doc.pipe(res);
        for (const cmd of drawHistory) {
            switch (cmd.type) {
                case 'rectangle':
                    doc.rect(cmd.params.x, cmd.params.y, cmd.params.width, cmd.params.height)
                       .fill(cmd.params.color);
                    break;
                case 'circle':
                    doc.circle(cmd.params.x, cmd.params.y, cmd.params.radius)
                       .fill(cmd.params.color);
                    break;
                case 'text':
                    doc.fontSize(cmd.params.fontSize)
                       .font(cmd.params.fontFamily === 'Arial' ? 'Helvetica' : 'Times-Roman')
                       .fillColor(cmd.params.color)
                       .text(cmd.params.text, cmd.params.x, cmd.params.y);
                    break;
                case 'image':
                    try {
                        let imgBuffer;
                        const src = cmd.params.src;
                        if (src.startsWith('data:')) {
                            const base64Data = src.split(',')[1];
                            imgBuffer = Buffer.from(base64Data, 'base64');
                        } else {
                            const response = await axios.get(src, { responseType: 'arraybuffer' });
                            imgBuffer = response.data;
                        }
                        doc.image(imgBuffer, cmd.params.x, cmd.params.y, {
                            width: cmd.params.width,
                            height: cmd.params.height
                        });
                    } catch (err) { console.error('Failed to add image to PDF:', err.message); }
                    break;
            }
        }
        doc.end();
    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) res.status(500).send('Failed to generate PDF');
    }
});

app.get('/api/debug/:id', (req, res) => {
    const { id } = req.params;
    if (!canvasStore[id]) return res.status(404).json({ error: 'Session not found' });
    res.json(canvasStore[id].drawHistory);
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});