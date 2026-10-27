import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { User, Scheduler, Schedule, Invitation, SystemStats, SchedulerRole } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Persistent database path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

interface DatabaseSchema {
  users: User[];
  schedulers: Scheduler[];
  schedules: Schedule[];
  invitations: Invitation[];
  sessions: Record<string, string>; // token -> userId
}

// Seed helper
function getSeedData(): DatabaseSchema {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const today = `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`;
  
  // create some dates around this month
  const d1 = `${year}-${month}-04`;
  const d2 = `${year}-${month}-12`;
  const d3 = `${year}-${month}-15`;
  const d4 = `${year}-${month}-20`;
  const d5 = `${year}-${month}-25`;

  const users: User[] = [
    {
      id: 'usr_admin',
      username: 'admin',
      name: '시스템 관리자',
      avatar: '👑',
      role: 'admin',
      status: 'active',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      password: 'admin'
    },
    {
      id: 'usr_soyeon',
      username: 'soyeon',
      name: '이소연',
      avatar: '🐱',
      role: 'user',
      status: 'active',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      password: '1234'
    },
    {
      id: 'usr_minwoo',
      username: 'minwoo',
      name: '강민우',
      avatar: '🐶',
      role: 'user',
      status: 'active',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      password: '1234'
    },
    {
      id: 'usr_jiwon',
      username: 'jiwon',
      name: '박지원',
      avatar: '🐰',
      role: 'user',
      status: 'active',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      password: '1234'
    }
  ];

  const schedulers: Scheduler[] = [
    {
      id: 'sch_personal_soyeon',
      name: '개인 일상 & 루틴',
      description: '나만의 프라이빗한 개인 일정과 일상 메모',
      icon: '🌸',
      color: '#FEF08A', // Butter Yellow
      owner_id: 'usr_soyeon',
      members: [
        {
          user_id: 'usr_soyeon',
          username: 'soyeon',
          name: '이소연',
          avatar: '🐱',
          role: 'owner',
          joined_at: new Date(Date.now() - 20 * 86400000).toISOString()
        }
      ],
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'sch_dev_team',
      name: '프로젝트 Dev팀',
      description: '웹 프론트엔드/백엔드 스프린트 및 릴리즈 캘린더',
      icon: '💻',
      color: '#BAE6FD', // Pastel Blue
      owner_id: 'usr_soyeon',
      members: [
        {
          user_id: 'usr_soyeon',
          username: 'soyeon',
          name: '이소연',
          avatar: '🐱',
          role: 'owner',
          joined_at: new Date(Date.now() - 18 * 86400000).toISOString()
        },
        {
          user_id: 'usr_minwoo',
          username: 'minwoo',
          name: '강민우',
          avatar: '🐶',
          role: 'editor',
          joined_at: new Date(Date.now() - 14 * 86400000).toISOString()
        },
        {
          user_id: 'usr_jiwon',
          username: 'jiwon',
          name: '박지원',
          avatar: '🐰',
          role: 'viewer',
          joined_at: new Date(Date.now() - 9 * 86400000).toISOString()
        }
      ],
      created_at: new Date(Date.now() - 18 * 86400000).toISOString()
    },
    {
      id: 'sch_boardgame',
      name: '주말 보드게임 동아리',
      description: '토요일 정기 보드게임 모임 및 파티 일정',
      icon: '🎲',
      color: '#DDD6FE', // Pastel Purple
      owner_id: 'usr_minwoo',
      members: [
        {
          user_id: 'usr_minwoo',
          username: 'minwoo',
          name: '강민우',
          avatar: '🐶',
          role: 'owner',
          joined_at: new Date(Date.now() - 12 * 86400000).toISOString()
        },
        {
          user_id: 'usr_soyeon',
          username: 'soyeon',
          name: '이소연',
          avatar: '🐱',
          role: 'editor',
          joined_at: new Date(Date.now() - 11 * 86400000).toISOString()
        }
      ],
      created_at: new Date(Date.now() - 12 * 86400000).toISOString()
    }
  ];

  const schedules: Schedule[] = [
    {
      id: 'sc_1',
      scheduler_id: 'sch_dev_team',
      author_id: 'usr_soyeon',
      author_name: '이소연',
      author_username: 'soyeon',
      title: '스프린트 24회차 킥오프 회의',
      description: '2분기 핵심 기능 리뷰 및 파스텔 3D 디자인 시스템 배포 계획 수립',
      start_date: today,
      end_date: today,
      start_time: '14:00',
      end_time: '15:30',
      is_all_day: false,
      is_shared: true, // Shared to team!
      repeat_type: 'none',
      color: '#BAE6FD',
      category: '업무/회의',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sc_2',
      scheduler_id: 'sch_dev_team',
      author_id: 'usr_minwoo',
      author_name: '강민우',
      author_username: 'minwoo',
      title: 'API 백엔드 성능 튜닝 및 DB 마이그레이션',
      description: '데이터베이스 쿼리 최적화 및 세션 캐싱 테스트',
      start_date: today,
      end_date: today,
      start_time: '16:00',
      end_time: '18:00',
      is_all_day: false,
      is_shared: true,
      repeat_type: 'none',
      color: '#BBF7D0',
      category: '개발/작업',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sc_3',
      scheduler_id: 'sch_personal_soyeon',
      author_id: 'usr_soyeon',
      author_name: '이소연',
      author_username: 'soyeon',
      title: '치과 정기 검진 (사랑니)',
      description: '강남역 2번 출구 밝은치과의원 예약. [비공개 개인 일정]',
      start_date: d2,
      end_date: d2,
      start_time: '10:30',
      end_time: '11:30',
      is_all_day: false,
      is_shared: false, // PRIVATE! Only soyeon can see
      repeat_type: 'none',
      color: '#FBCFE8',
      category: '개인/건강',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sc_4',
      scheduler_id: 'sch_personal_soyeon',
      author_id: 'usr_soyeon',
      author_name: '이소연',
      author_username: 'soyeon',
      title: '주 3회 필라테스 & 유산소 운동',
      description: '매주 꾸준히 운동하기! 스트레칭 필수',
      start_date: d1,
      end_date: d1,
      start_time: '19:30',
      end_time: '20:30',
      is_all_day: false,
      is_shared: false,
      repeat_type: 'weekly',
      color: '#FEF08A',
      category: '운동/루틴',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sc_5',
      scheduler_id: 'sch_boardgame',
      author_id: 'usr_minwoo',
      author_name: '강민우',
      author_username: 'minwoo',
      title: '홍대 아지트 보드게임 정모 🎲',
      description: '스플렌더 마블 & 카탄 토너먼트. 신규 회원 환영!',
      start_date: d3,
      end_date: d3,
      start_time: '15:00',
      end_time: '19:00',
      is_all_day: false,
      is_shared: true,
      repeat_type: 'none',
      color: '#DDD6FE',
      category: '모임/취미',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sc_6',
      scheduler_id: 'sch_dev_team',
      author_id: 'usr_soyeon',
      author_name: '이소연',
      author_username: 'soyeon',
      title: '매월 말 스프린트 회고 및 티타임 ☕',
      description: '한 달간 배포된 기능 리뷰와 KPT 회고',
      start_date: d5,
      end_date: d5,
      start_time: '16:00',
      end_time: '17:30',
      is_all_day: false,
      is_shared: true,
      repeat_type: 'monthly',
      color: '#FED7AA',
      category: '회고',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const invitations: Invitation[] = [
    {
      id: 'inv_camping_soyeon',
      scheduler_id: 'sch_camping',
      scheduler_name: '힐링 캠핑 & 피크닉 ⛺',
      scheduler_icon: '⛺',
      scheduler_color: '#BBF7D0',
      from_user_id: 'usr_minwoo',
      from_username: 'minwoo',
      from_user_name: '강민우',
      to_user_id: 'usr_soyeon',
      to_username: 'soyeon',
      role: 'editor',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  return {
    users,
    schedulers: [
      ...schedulers,
      {
        id: 'sch_camping',
        name: '힐링 캠핑 & 피크닉 ⛺',
        description: '자연으로 떠나는 캠핑과 야외 바베큐 일정 공유방',
        icon: '⛺',
        color: '#BBF7D0',
        owner_id: 'usr_minwoo',
        members: [
          {
            user_id: 'usr_minwoo',
            username: 'minwoo',
            name: '강민우',
            avatar: '🐶',
            role: 'owner',
            joined_at: new Date().toISOString()
          }
        ],
        created_at: new Date().toISOString()
      }
    ],
    schedules,
    invitations,
    sessions: {
      'token_demo_soyeon': 'usr_soyeon',
      'token_demo_minwoo': 'usr_minwoo',
      'token_demo_jiwon': 'usr_jiwon',
      'token_demo_admin': 'usr_admin',
    }
  };
}

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error loading database, resetting to seeds:', err);
    const initial = getSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

let db = loadDatabase();

// Middleware: Authentication
interface AuthenticatedRequest extends Request {
  user?: User;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰이 제공되지 않았습니다.' });
  }

  const token = authHeader.substring(7);
  const userId = db.sessions[token];
  if (!userId) {
    return res.status(401).json({ error: '유효하지 않거나 만료된 세션입니다.' });
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: '관리자에 의해 정지된 계정입니다.' });
  }

  req.user = user;
  next();
}

function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
}

// ----------------- AUTH ROUTES ----------------- //

// Demo users list for 1-click test switching
app.get('/api/auth/demo-users', (req: Request, res: Response) => {
  const list = db.users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    avatar: u.avatar,
    role: u.role,
    status: u.status,
  }));
  res.json({ demoUsers: list });
});

// Quick switch demo user
app.post('/api/auth/demo-login', (req: Request, res: Response) => {
  const { username } = req.body;
  const user = db.users.find((u) => u.username === username);
  if (!user) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: '정지된 계정입니다.' });
  }
  const token = `token_${user.username}_${Date.now()}`;
  db.sessions[token] = user.id;
  saveDatabase(db);

  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, name, avatar } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: '아이디, 비밀번호, 이름을 모두 입력해주세요.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    name: name.trim(),
    avatar: avatar || '😊',
    role: 'user',
    status: 'active',
    created_at: new Date().toISOString(),
    password: password.trim()
  };

  db.users.push(newUser);

  // Automatically create a default personal scheduler for new user
  const personalScheduler: Scheduler = {
    id: `sch_${Date.now()}_personal`,
    name: `${newUser.name}의 개인 캘린더`,
    description: '나만의 프라이빗한 개인 일정 관리',
    icon: '✨',
    color: '#FEF08A',
    owner_id: newUser.id,
    members: [
      {
        user_id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        avatar: newUser.avatar,
        role: 'owner',
        joined_at: new Date().toISOString()
      }
    ],
    created_at: new Date().toISOString()
  };

  db.schedulers.push(personalScheduler);

  const token = `token_${newUser.username}_${Date.now()}`;
  db.sessions[token] = newUser.id;
  saveDatabase(db);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === cleanUsername && u.password === password.trim()
  );

  if (!user) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: '관리자에 의해 이용이 정지된 계정입니다.' });
  }

  const token = `token_${user.username}_${Date.now()}`;
  db.sessions[token] = user.id;
  saveDatabase(db);

  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Current user profile
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { password: _, ...safeUser } = req.user!;
  res.json({ user: safeUser });
});

// Update profile
app.put('/api/auth/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, avatar, password } = req.body;
  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

  if (name) user.name = name.trim();
  if (avatar) user.avatar = avatar;
  if (password && password.trim().length >= 4) user.password = password.trim();

  // Also update member records in all schedulers
  for (const sch of db.schedulers) {
    const member = sch.members.find((m) => m.user_id === user.id);
    if (member) {
      if (name) member.name = user.name;
      if (avatar) member.avatar = user.avatar;
    }
  }

  saveDatabase(db);
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Search user by username
app.get('/api/users/search', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ users: [] });

  const matched = db.users
    .filter((u) => u.status === 'active' && u.username.toLowerCase().includes(q))
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar
    }));

  res.json({ users: matched });
});

// ----------------- SCHEDULER ROUTES ----------------- //

// Get schedulers the current user is a member of
app.get('/api/schedulers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userSchedulers = db.schedulers.filter((s) =>
    s.members.some((m) => m.user_id === userId)
  );
  res.json({ schedulers: userSchedulers });
});

// Create new scheduler
app.post('/api/schedulers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, description, icon, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '스케줄러 이름을 입력해주세요.' });
  }

  const newScheduler: Scheduler = {
    id: `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    description: (description || '').trim(),
    icon: icon || '📁',
    color: color || '#BAE6FD',
    owner_id: req.user!.id,
    members: [
      {
        user_id: req.user!.id,
        username: req.user!.username,
        name: req.user!.name,
        avatar: req.user!.avatar,
        role: 'owner',
        joined_at: new Date().toISOString()
      }
    ],
    created_at: new Date().toISOString()
  };

  db.schedulers.push(newScheduler);
  saveDatabase(db);
  res.status(201).json({ scheduler: newScheduler });
});

// Update scheduler (Owner only)
app.put('/api/schedulers/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, icon, color } = req.body;
  const scheduler = db.schedulers.find((s) => s.id === id);

  if (!scheduler) {
    return res.status(404).json({ error: '스케줄러를 찾을 수 없습니다.' });
  }

  // Check if owner or admin
  if (scheduler.owner_id !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: '스케줄러 방장(Owner)만 설정을 변경할 수 있습니다.' });
  }

  if (name) scheduler.name = name.trim();
  if (description !== undefined) scheduler.description = description.trim();
  if (icon) scheduler.icon = icon;
  if (color) scheduler.color = color;

  saveDatabase(db);
  res.json({ scheduler });
});

// Delete scheduler (Owner only)
app.delete('/api/schedulers/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.schedulers.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '스케줄러를 찾을 수 없습니다.' });
  }

  const scheduler = db.schedulers[index];
  if (scheduler.owner_id !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: '스케줄러 방장(Owner)만 삭제할 수 있습니다.' });
  }

  db.schedulers.splice(index, 1);
  // Also clean up schedules and invitations for this scheduler
  db.schedules = db.schedules.filter((sc) => sc.scheduler_id !== id);
  db.invitations = db.invitations.filter((inv) => inv.scheduler_id !== id);

  saveDatabase(db);
  res.json({ message: '스케줄러가 삭제되었습니다.' });
});

// Invite member to scheduler
app.post('/api/schedulers/:id/invite', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { targetUsername, role = 'editor' } = req.body;

  const scheduler = db.schedulers.find((s) => s.id === id);
  if (!scheduler) {
    return res.status(404).json({ error: '스케줄러를 찾을 수 없습니다.' });
  }

  // Must be owner to invite
  if (scheduler.owner_id !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: '스케줄러 방장만 새로운 멤버를 초대할 수 있습니다.' });
  }

  const target = db.users.find((u) => u.username.toLowerCase() === String(targetUsername).trim().toLowerCase());
  if (!target) {
    return res.status(404).json({ error: '초대할 사용자를 찾을 수 없습니다. 아이디를 확인해주세요.' });
  }

  if (target.id === req.user!.id) {
    return res.status(400).json({ error: '자기 자신은 초대할 수 없습니다.' });
  }

  if (scheduler.members.some((m) => m.user_id === target.id)) {
    return res.status(409).json({ error: '이미 스케줄러에 참여 중인 멤버입니다.' });
  }

  const existingPending = db.invitations.find(
    (inv) => inv.scheduler_id === id && inv.to_user_id === target.id && inv.status === 'pending'
  );
  if (existingPending) {
    return res.status(409).json({ error: '이미 해당 사용자에게 초대가 전송되었습니다.' });
  }

  const invitation: Invitation = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    scheduler_id: scheduler.id,
    scheduler_name: scheduler.name,
    scheduler_icon: scheduler.icon,
    scheduler_color: scheduler.color,
    from_user_id: req.user!.id,
    from_username: req.user!.username,
    from_user_name: req.user!.name,
    to_user_id: target.id,
    to_username: target.username,
    role: role as SchedulerRole,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  db.invitations.push(invitation);
  saveDatabase(db);

  res.status(201).json({ invitation, message: `${target.name}(@${target.username})님께 초대를 보냈습니다!` });
});

// Update member role (Owner only)
app.put('/api/schedulers/:id/members/:userId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id, userId } = req.params;
  const { role } = req.body;

  const scheduler = db.schedulers.find((s) => s.id === id);
  if (!scheduler) {
    return res.status(404).json({ error: '스케줄러를 찾을 수 없습니다.' });
  }

  if (scheduler.owner_id !== req.user!.id && req.user!.role !== 'admin') {
    return res.status(403).json({ error: '스케줄러 방장(Owner)만 멤버 권한을 변경할 수 있습니다.' });
  }

  if (scheduler.owner_id === userId) {
    return res.status(400).json({ error: '방장의 권한은 직접 변경할 수 없습니다.' });
  }

  const member = scheduler.members.find((m) => m.user_id === userId);
  if (!member) {
    return res.status(404).json({ error: '해당 멤버를 찾을 수 없습니다.' });
  }

  if (!['editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: '올바른 권한 등급을 지정해주세요 (editor / viewer).' });
  }

  member.role = role as SchedulerRole;
  saveDatabase(db);
  res.json({ scheduler, member });
});

// Remove member (Kick by Owner, or leave by member)
app.delete('/api/schedulers/:id/members/:userId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id, userId } = req.params;

  const scheduler = db.schedulers.find((s) => s.id === id);
  if (!scheduler) {
    return res.status(404).json({ error: '스케줄러를 찾을 수 없습니다.' });
  }

  const isSelfLeaving = req.user!.id === userId;
  const isOwner = scheduler.owner_id === req.user!.id || req.user!.role === 'admin';

  if (!isSelfLeaving && !isOwner) {
    return res.status(403).json({ error: '멤버를 강퇴할 권한이 없습니다.' });
  }

  if (scheduler.owner_id === userId) {
    return res.status(400).json({ error: '방장은 스케줄러를 나갈 수 없습니다. 스케줄러를 삭제하거나 권한을 위임해야 합니다.' });
  }

  const idx = scheduler.members.findIndex((m) => m.user_id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: '스케줄러의 멤버가 아닙니다.' });
  }

  scheduler.members.splice(idx, 1);
  saveDatabase(db);
  res.json({ message: isSelfLeaving ? '스케줄러에서 퇴장했습니다.' : '멤버를 강퇴했습니다.' });
});

// ----------------- INVITATIONS ----------------- //

// Get pending invitations for logged-in user
app.get('/api/invitations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const pending = db.invitations.filter((i) => i.to_user_id === userId && i.status === 'pending');
  res.json({ invitations: pending });
});

// Respond to invitation (accept / reject)
app.post('/api/invitations/:id/respond', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'reject'

  const invitation = db.invitations.find((i) => i.id === id && i.to_user_id === req.user!.id);
  if (!invitation) {
    return res.status(404).json({ error: '초대장을 찾을 수 없습니다.' });
  }

  if (invitation.status !== 'pending') {
    return res.status(400).json({ error: '이미 처리된 초대장입니다.' });
  }

  if (action === 'accept') {
    invitation.status = 'accepted';
    const scheduler = db.schedulers.find((s) => s.id === invitation.scheduler_id);
    if (scheduler) {
      if (!scheduler.members.some((m) => m.user_id === req.user!.id)) {
        scheduler.members.push({
          user_id: req.user!.id,
          username: req.user!.username,
          name: req.user!.name,
          avatar: req.user!.avatar,
          role: invitation.role,
          joined_at: new Date().toISOString()
        });
      }
    }
  } else if (action === 'reject') {
    invitation.status = 'rejected';
  } else {
    return res.status(400).json({ error: '올바른 액션(accept / reject)을 지정하세요.' });
  }

  saveDatabase(db);
  res.json({
    message: action === 'accept' ? '초대를 수락했습니다. 캘린더가 공유됩니다!' : '초대를 거절했습니다.',
    invitation
  });
});

// ----------------- SCHEDULES ----------------- //

// Helper to check user permission for a schedule in a scheduler
function getUserRoleInScheduler(scheduler: Scheduler, userId: string): SchedulerRole | null {
  const member = scheduler.members.find((m) => m.user_id === userId);
  return member ? member.role : null;
}

// Get schedules with privacy & multi-scheduler filter
app.get('/api/schedules', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const schedulerIdsParam = req.query.schedulerIds as string;

  // Schedulers the user is a member of
  const mySchedulers = db.schedulers.filter((s) =>
    s.members.some((m) => m.user_id === userId)
  );
  const mySchedulerMap = new Map(mySchedulers.map((s) => [s.id, s]));

  let targetSchedulerIds = Array.from(mySchedulerMap.keys());
  if (schedulerIdsParam) {
    const requested = schedulerIdsParam.split(',').filter(Boolean);
    targetSchedulerIds = targetSchedulerIds.filter((id) => requested.includes(id));
  }

  // Filter schedules:
  // 1. Must belong to one of targetSchedulerIds
  // 2. PRIVACY RULE (선택적 공유):
  //    - If author_id === userId: Always include (both personal is_shared=false and shared=true)
  //    - If author_id !== userId: ONLY include IF is_shared === true!
  const visibleSchedules = db.schedules
    .filter((sc) => targetSchedulerIds.includes(sc.scheduler_id))
    .filter((sc) => sc.author_id === userId || sc.is_shared === true)
    .map((sc) => {
      const sch = mySchedulerMap.get(sc.scheduler_id);
      return {
        ...sc,
        scheduler_name: sch?.name,
        scheduler_color: sch?.color,
        scheduler_icon: sch?.icon,
      };
    });

  res.json({ schedules: visibleSchedules });
});

// Create schedule
app.post('/api/schedules', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const {
    scheduler_id,
    title,
    description = '',
    start_date,
    end_date,
    start_time,
    end_time,
    is_all_day = true,
    is_shared = true,
    repeat_type = 'none',
    color = '#BAE6FD',
    category = '일반'
  } = req.body;

  if (!title || !title.trim() || !start_date || !scheduler_id) {
    return res.status(400).json({ error: '필수 항목(제목, 시작 날짜, 스케줄러)을 입력해주세요.' });
  }

  const scheduler = db.schedulers.find((s) => s.id === scheduler_id);
  if (!scheduler) {
    return res.status(404).json({ error: '스케줄러를 찾을 수 없습니다.' });
  }

  const userRole = getUserRoleInScheduler(scheduler, req.user!.id);
  if (!userRole && req.user!.role !== 'admin') {
    return res.status(403).json({ error: '스케줄러의 멤버만 일정을 등록할 수 있습니다.' });
  }

  const newSchedule: Schedule = {
    id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    scheduler_id,
    author_id: req.user!.id,
    author_name: req.user!.name,
    author_username: req.user!.username,
    title: title.trim(),
    description: description.trim(),
    start_date,
    end_date: end_date || start_date,
    start_time: is_all_day ? undefined : start_time,
    end_time: is_all_day ? undefined : end_time,
    is_all_day,
    is_shared: Boolean(is_shared),
    repeat_type: repeat_type || 'none',
    color,
    category: category.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.schedules.push(newSchedule);
  saveDatabase(db);

  res.status(201).json({
    schedule: {
      ...newSchedule,
      scheduler_name: scheduler.name,
      scheduler_color: scheduler.color,
      scheduler_icon: scheduler.icon
    }
  });
});

// Update schedule (Permission Enforced)
// 방장 (Owner): 전체 수정 권한
// 편집자 (Editor): 본인 일정 & 다른 편집자의 공유 일정 수정 가능
// 조회자 (Viewer): 본인이 작성한 일정만 수정 가능
app.put('/api/schedules/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const schedule = db.schedules.find((s) => s.id === id);

  if (!schedule) {
    return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
  }

  const scheduler = db.schedulers.find((s) => s.id === schedule.scheduler_id);
  if (!scheduler) {
    return res.status(404).json({ error: '해당 스케줄러를 찾을 수 없습니다.' });
  }

  const currentUserId = req.user!.id;
  const userRole = getUserRoleInScheduler(scheduler, currentUserId);
  const isAuthor = schedule.author_id === currentUserId;
  const isAdmin = req.user!.role === 'admin';

  let canEdit = false;
  if (isAdmin || userRole === 'owner') {
    canEdit = true;
  } else if (userRole === 'editor') {
    // Editor can edit their own schedules or shared schedules in this scheduler
    if (isAuthor || schedule.is_shared) {
      canEdit = true;
    }
  } else if (userRole === 'viewer') {
    // Viewer can ONLY edit their own schedule
    if (isAuthor) {
      canEdit = true;
    }
  }

  if (!canEdit) {
    return res.status(403).json({
      error: '이 일정을 수정할 권한이 없습니다. (조회자는 본인 일정만 수정 가능합니다)'
    });
  }

  const {
    title,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    is_all_day,
    is_shared,
    repeat_type,
    color,
    category
  } = req.body;

  if (title) schedule.title = title.trim();
  if (description !== undefined) schedule.description = description.trim();
  if (start_date) schedule.start_date = start_date;
  if (end_date) schedule.end_date = end_date;
  if (is_all_day !== undefined) {
    schedule.is_all_day = is_all_day;
    schedule.start_time = is_all_day ? undefined : start_time;
    schedule.end_time = is_all_day ? undefined : end_time;
  } else {
    if (start_time !== undefined) schedule.start_time = start_time;
    if (end_time !== undefined) schedule.end_time = end_time;
  }
  if (is_shared !== undefined) schedule.is_shared = Boolean(is_shared);
  if (repeat_type !== undefined) schedule.repeat_type = repeat_type;
  if (color) schedule.color = color;
  if (category) schedule.category = category;
  schedule.updated_at = new Date().toISOString();

  saveDatabase(db);
  res.json({
    schedule: {
      ...schedule,
      scheduler_name: scheduler.name,
      scheduler_color: scheduler.color,
      scheduler_icon: scheduler.icon
    }
  });
});

// Delete schedule (Permission Enforced)
app.delete('/api/schedules/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.schedules.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
  }

  const schedule = db.schedules[index];
  const scheduler = db.schedulers.find((s) => s.id === schedule.scheduler_id);
  if (!scheduler) {
    return res.status(404).json({ error: '해당 스케줄러를 찾을 수 없습니다.' });
  }

  const currentUserId = req.user!.id;
  const userRole = getUserRoleInScheduler(scheduler, currentUserId);
  const isAuthor = schedule.author_id === currentUserId;
  const isAdmin = req.user!.role === 'admin';

  let canDelete = false;
  if (isAdmin || userRole === 'owner') {
    canDelete = true;
  } else if (userRole === 'editor') {
    if (isAuthor || schedule.is_shared) {
      canDelete = true;
    }
  } else if (userRole === 'viewer') {
    if (isAuthor) {
      canDelete = true;
    }
  }

  if (!canDelete) {
    return res.status(403).json({
      error: '이 일정을 삭제할 권한이 없습니다. (조회자는 본인 일정만 삭제 가능합니다)'
    });
  }

  db.schedules.splice(index, 1);
  saveDatabase(db);
  res.json({ message: '일정이 삭제되었습니다.' });
});

// ----------------- ADMIN PORTAL ROUTES ----------------- //

// Admin Stats
app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const stats: SystemStats = {
    totalUsers: db.users.length,
    activeUsers: db.users.filter((u) => u.status === 'active').length,
    totalSchedulers: db.schedulers.length,
    totalSchedules: db.schedules.length,
    pendingInvitations: db.invitations.filter((i) => i.status === 'pending').length
  };
  res.json({ stats });
});

// Admin User List
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const usersWithCounts = db.users.map((u) => {
    const ownedSchedulers = db.schedulers.filter((s) => s.owner_id === u.id).length;
    const memberSchedulers = db.schedulers.filter((s) => s.members.some((m) => m.user_id === u.id)).length;
    const scheduleCount = db.schedules.filter((sc) => sc.author_id === u.id).length;
    return {
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
      ownedSchedulers,
      memberSchedulers,
      scheduleCount
    };
  });
  res.json({ users: usersWithCounts });
});

// Admin Update User (Role, Status, Reset Password)
app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role, status, newPassword } = req.body;

  const target = db.users.find((u) => u.id === id);
  if (!target) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  // Prevent self suspension or self demotion of the last admin
  if (target.id === req.user!.id && (status === 'suspended' || role === 'user')) {
    return res.status(400).json({ error: '자신의 관리자 권한을 해제하거나 계정을 정지할 수 없습니다.' });
  }

  if (role && ['admin', 'user'].includes(role)) {
    target.role = role;
  }
  if (status && ['active', 'suspended'].includes(status)) {
    target.status = status;
  }
  if (newPassword && newPassword.trim().length >= 4) {
    target.password = newPassword.trim();
  }

  saveDatabase(db);
  const { password: _, ...safeUser } = target;
  res.json({ user: safeUser, message: '사용자 정보가 성공적으로 업데이트되었습니다.' });
});

// Admin Delete User
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    return res.status(400).json({ error: '현재 로그인된 관리자 계정은 삭제할 수 없습니다.' });
  }

  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  // Remove user
  db.users.splice(index, 1);

  // Remove memberships
  for (const sch of db.schedulers) {
    sch.members = sch.members.filter((m) => m.user_id !== id);
  }
  // Delete schedulers where this user was owner
  db.schedulers = db.schedulers.filter((s) => s.owner_id !== id);
  // Delete schedules authored by this user
  db.schedules = db.schedules.filter((sc) => sc.author_id !== id);
  // Remove invitations
  db.invitations = db.invitations.filter((inv) => inv.from_user_id !== id && inv.to_user_id !== id);

  saveDatabase(db);
  res.json({ message: '사용자 및 관련 데이터가 정상적으로 삭제되었습니다.' });
});

// Admin All Schedulers
app.get('/api/admin/schedulers', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const detailedSchedulers = db.schedulers.map((sch) => {
    const owner = db.users.find((u) => u.id === sch.owner_id);
    const scheduleCount = db.schedules.filter((sc) => sc.scheduler_id === sch.id).length;
    return {
      ...sch,
      owner_username: owner?.username,
      owner_name: owner?.name,
      schedule_count: scheduleCount
    };
  });
  res.json({ schedulers: detailedSchedulers });
});

// Admin Delete Any Scheduler
app.delete('/api/admin/schedulers/:id', authMiddleware, adminMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.schedulers.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '스케줄러를 찾을 수 없습니다.' });
  }

  db.schedulers.splice(index, 1);
  db.schedules = db.schedules.filter((sc) => sc.scheduler_id !== id);
  db.invitations = db.invitations.filter((i) => i.scheduler_id !== id);
  saveDatabase(db);

  res.json({ message: '스케줄러가 강제 삭제되었습니다.' });
});

// ----------------- VITE SETUP ----------------- //

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 CozySchedule Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
