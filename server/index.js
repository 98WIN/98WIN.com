// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const SECRET = 'CHANGE_THIS_SECRET_NOW'; // production: change

// lowdb init
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDB(){
  await db.read();
  db.data ||= { users: [], rounds: [], bets: [], requests: [] };
  if(!db.data.users.find(u=>u.phone==='0000000000')){
    const hash = bcrypt.hashSync('admin123',8);
    db.data.users.push({ id: nanoid(), username: 'admin', phone: '0000000000', passwordHash: hash, points: 1000000, role: 'admin', createdAt: Date.now()});
    await db.write();
    console.log('Admin user created: phone=0000000000 pass=admin123');
  }
}
initDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

// auth middleware
function authMiddleware(req,res,next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.split(' ')[1];
  try{
    const data = jwt.verify(token, SECRET);
    req.user = data;
    next();
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Signup
app.post('/api/signup', async (req,res)=>{
  const { phone, password, invitation } = req.body;
  if(!phone || !password) return res.status(400).json({ error: 'Invalid' });
  await db.read();
  if(db.data.users.find(u=>u.phone===phone)) return res.status(400).json({ error: 'Phone exists' });
  const hash = bcrypt.hashSync(password,8);
  const user = { id: nanoid(), username: 'user'+Date.now(), phone, passwordHash: hash, points: 5000, role: 'user', createdAt: Date.now(), invitation: invitation || null };
  db.data.users.push(user);
  await db.write();
  io.emit('new_user', { id: user.id, phone: user.phone });
  return res.json({ ok:true, user: { id: user.id, phone: user.phone, points: user.points }});
});

// Login
app.post('/api/login', async (req,res)=>{
  const { phone, password } = req.body;
  await db.read();
  const user = db.data.users.find(u=>u.phone===phone);
  if(!user) return res.status(400).json({ error: 'User not found' });
  if(!bcrypt.compareSync(password, user.passwordHash)) return res.status(400).json({ error: 'Wrong password' });
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
  return res.json({ ok:true, token, user: { id: user.id, phone: user.phone, points: user.points, role: user.role }});
});

// me
app.get('/api/me', authMiddleware, async (req,res)=>{
  await db.read();
  const u = db.data.users.find(x=>x.id===req.user.id);
  if(!u) return res.status(404).json({ error: 'Not found' });
  return res.json({ id: u.id, phone: u.phone, points: u.points, role: u.role });
});

// deposit request
app.post('/api/deposit', authMiddleware, async (req,res)=>{
  const { amount, utr } = req.body;
  if(!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  await db.read();
  const reqObj = { id: nanoid(), type: 'deposit', userId: req.user.id, amount, utr, status: 'pending', createdAt: Date.now() };
  db.data.requests.push(reqObj);
  await db.write();
  io.emit('request_created', reqObj);
  return res.json({ ok:true, request: reqObj });
});

// withdraw request
app.post('/api/withdraw', authMiddleware, async (req,res)=>{
  const { amount, accountNumber, ifsc, beneficiary } = req.body;
  if(!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  await db.read();
  const user = db.data.users.find(u=>u.id===req.user.id);
  if(!user) return res.status(400).json({ error: 'User not found' });
  if(user.points < amount) return res.status(400).json({ error: 'Insufficient funds' });
  user.points -= amount;
  const reqObj = { id: nanoid(), type: 'withdraw', userId: user.id, amount, accountNumber, ifsc, beneficiary, status: 'pending', createdAt: Date.now() };
  db.data.requests.push(reqObj);
  await db.write();
  io.emit('request_created', reqObj);
  return res.json({ ok:true, request: reqObj, points: user.points });
});

// admin endpoints
app.get('/api/admin/users', authMiddleware, async (req,res)=>{
  if(req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  return res.json(db.data.users);
});
app.get('/api/admin/requests', authMiddleware, async (req,res)=>{
  if(req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await db.read();
  return res.json(db.data.requests);
});
app.post('/api/admin/approve', authMiddleware, async (req,res)=>{
  if(req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { id, action } = req.body; // action: approve / deny
  await db.read();
  const r = db.data.requests.find(x=>x.id===id);
  if(!r) return res.status(404).json({ error: 'Not found' });
  if(action === 'approve'){
    r.status = 'approved';
    if(r.type === 'deposit'){
      const u = db.data.users.find(x=>x.id===r.userId); if(u) u.points += r.amount;
    }
    // withdraw already deducted when request created
  } else {
    r.status = 'denied';
    if(r.type === 'withdraw'){
      // refund to user if denied
      const u = db.data.users.find(x=>x.id===r.userId); if(u) u.points += r.amount;
    }
  }
  await db.write();
  io.emit('request_updated', r);
  return res.json({ ok:true, r });
});

// rounds & betting
let currentRound = null;
async function createRound(){
  await db.read();
  const r = { id: nanoid(), startAt: Date.now(), endAt: Date.now() + 30000, result: null };
  db.data.rounds.push(r);
  await db.write();
  currentRound = r;
  io.emit('round_created', r);
  // close after 30s
  setTimeout(async ()=>{
    const outcomes = ['SMALL','BIG'];
    const resOutcome = outcomes[Math.floor(Math.random()*outcomes.length)];
    r.result = resOutcome;
    // process bets
    await db.read();
    const bets = db.data.bets.filter(b => b.roundId === r.id);
    for(const b of bets){
      const user = db.data.users.find(u => u.id === b.userId);
      if(!user) continue;
      if(b.choice === resOutcome){
        const payout = b.amount * 2; // win double
        user.points += payout;
        b.status = 'won';
        b.payout = payout;
      } else {
        b.status = 'lost';
        b.payout = 0;
      }
    }
    await db.write();
    io.emit('round_result', r);
    // small delay then next round
    setTimeout(createRound, 3000);
  }, 30000);
}
createRound();

app.get('/api/rounds/current', async (req,res)=>{
  await db.read();
  return res.json(currentRound || {});
});

app.post('/api/rounds/:id/bet', authMiddleware, async (req,res)=>{
  const { id } = req.params;
  const { choice, amount } = req.body;
  if(!choice || !amount) return res.status(400).json({ error: 'Invalid' });
  await db.read();
  const user = db.data.users.find(u=>u.id===req.user.id);
  if(!user) return res.status(400).json({ error: 'User not found' });
  if(user.points < amount) return res.status(400).json({ error: 'Insufficient funds' });
  if(!currentRound || currentRound.id !== id) return res.status(400).json({ error: 'Round closed' });
  user.points -= amount;
  const bet = { id: nanoid(), userId: user.id, roundId: id, choice, amount, createdAt: Date.now(), status: 'pending' };
  db.data.bets.push(bet);
  await db.write();
  io.emit('new_bet', { bet, user: { id: user.id, phone: user.phone }});
  return res.json({ ok:true, bet, points: user.points });
});

app.get('/api/users/:id/bets', authMiddleware, async (req,res)=>{
  const { id } = req.params;
  await db.read();
  const bets = db.data.bets.filter(b=>b.userId===id).slice(-100);
  return res.json(bets);
});

io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.emit('current_round', currentRound);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, ()=> console.log('Server listening on', PORT));
