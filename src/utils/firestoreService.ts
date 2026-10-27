import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, Scheduler, Schedule, Invitation, SystemStats, SchedulerRole } from '../types';

const TOKEN_KEY = 'cozyschedule_token';
const CURRENT_USER_KEY = 'cozyschedule_user_cache';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

// Initial Seed Data
function getSeedData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const today = `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`;
  const d1 = `${year}-${month}-04`;
  const d2 = `${year}-${month}-12`;
  const d3 = `${year}-${month}-15`;
  const d5 = `${year}-${month}-25`;

  const users: (User & { password?: string })[] = [
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
      color: '#FEF08A',
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
      color: '#BAE6FD',
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
      color: '#DDD6FE',
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
    },
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
  ];

  const schedules: Schedule[] = [
    {
      id: 'sc_1',
      scheduler_id: 'sch_dev_team',
      scheduler_name: '프로젝트 Dev팀',
      scheduler_color: '#BAE6FD',
      scheduler_icon: '💻',
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
      is_shared: true,
      repeat_type: 'none',
      color: '#BAE6FD',
      category: '업무/회의',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sc_2',
      scheduler_id: 'sch_dev_team',
      scheduler_name: '프로젝트 Dev팀',
      scheduler_color: '#BAE6FD',
      scheduler_icon: '💻',
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
      scheduler_name: '개인 일상 & 루틴',
      scheduler_color: '#FEF08A',
      scheduler_icon: '🌸',
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
      is_shared: false,
      repeat_type: 'none',
      color: '#FBCFE8',
      category: '개인/건강',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sc_4',
      scheduler_id: 'sch_personal_soyeon',
      scheduler_name: '개인 일상 & 루틴',
      scheduler_color: '#FEF08A',
      scheduler_icon: '🌸',
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
      scheduler_name: '주말 보드게임 동아리',
      scheduler_color: '#DDD6FE',
      scheduler_icon: '🎲',
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
      scheduler_name: '프로젝트 Dev팀',
      scheduler_color: '#BAE6FD',
      scheduler_icon: '💻',
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

  return { users, schedulers, schedules, invitations };
}

let seedInitialized = false;

// Ensure Firestore has initial seed data
export async function ensureFirestoreSeeded(): Promise<void> {
  if (seedInitialized) return;
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);

    if (snapshot.empty) {
      console.log('🌱 Seeding initial CozySchedule data to Cloud Firestore...');
      const { users, schedulers, schedules, invitations } = getSeedData();

      // Seed users
      for (const u of users) {
        await setDoc(doc(db, 'users', u.id), u);
      }
      // Seed schedulers
      for (const s of schedulers) {
        await setDoc(doc(db, 'schedulers', s.id), s);
      }
      // Seed schedules
      for (const sc of schedules) {
        await setDoc(doc(db, 'schedules', sc.id), sc);
      }
      // Seed invitations
      for (const inv of invitations) {
        await setDoc(doc(db, 'invitations', inv.id), inv);
      }
      console.log('✅ Firestore seeding complete!');
    }
    seedInitialized = true;
  } catch (err) {
    console.warn('Seeding check warning:', err);
    seedInitialized = true;
  }
}

// ----------------- AUTHENTICATION ----------------- //

export async function getDemoUsers(): Promise<{ demoUsers: User[] }> {
  await ensureFirestoreSeeded();
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          username: data.username,
          name: data.name,
          avatar: data.avatar || '😊',
          role: data.role || 'user',
          status: data.status || 'active',
          created_at: data.created_at || new Date().toISOString(),
        } as User;
      });
      return { demoUsers: list };
    }
  } catch (err) {
    console.error('getDemoUsers error:', err);
  }
  const defaultList = getSeedData().users.map(({ password: _, ...safe }) => safe);
  return { demoUsers: defaultList };
}

export async function login(usernameInput: string, passwordInput: string): Promise<{ token: string; user: User }> {
  await ensureFirestoreSeeded();
  const cleanUsername = usernameInput.trim().toLowerCase();

  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('username', '==', cleanUsername));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error(`존재하지 않는 아이디입니다. '회원가입' 탭에서 먼저 계정을 만들어주세요!`);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.password && userData.password !== passwordInput.trim()) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    if (userData.status === 'suspended') {
      throw new Error('관리자에 의해 이용이 정지된 계정입니다.');
    }

    const user: User = {
      id: userDoc.id,
      username: userData.username,
      name: userData.name,
      avatar: userData.avatar || '😊',
      role: userData.role || 'user',
      status: userData.status || 'active',
      created_at: userData.created_at || new Date().toISOString(),
    };

    const token = `token_${user.username}_${Date.now()}`;
    setStoredToken(token);
    setCachedUser(user);

    return { token, user };
  } catch (err: any) {
    // If it's our own thrown error, pass it through!
    if (err.message.includes('존재하지 않는') || err.message.includes('비밀번호') || err.message.includes('정지된')) {
      throw err;
    }
    console.error('Login error:', err);
    throw new Error(err.message || '로그인 처리 중 오류가 발생했습니다.');
  }
}

export async function register(data: {
  username: string;
  password: string;
  name: string;
  avatar?: string;
}): Promise<{ token: string; user: User }> {
  await ensureFirestoreSeeded();
  const cleanUsername = data.username.trim().toLowerCase();

  if (!cleanUsername || !data.password || !data.name) {
    throw new Error('아이디, 비밀번호, 이름을 모두 입력해주세요.');
  }

  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('username', '==', cleanUsername));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser = {
      id: userId,
      username: cleanUsername,
      name: data.name.trim(),
      avatar: data.avatar || '😊',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      password: data.password.trim(),
    };

    await setDoc(doc(db, 'users', userId), newUser);

    // Automatically create default personal scheduler
    const personalScheduler: Scheduler = {
      id: `sch_${Date.now()}_personal`,
      name: `${newUser.name}의 개인 캘린더`,
      description: '나만의 프라이빗한 개인 일정 관리',
      icon: '✨',
      color: '#FEF08A',
      owner_id: userId,
      members: [
        {
          user_id: userId,
          username: newUser.username,
          name: newUser.name,
          avatar: newUser.avatar,
          role: 'owner',
          joined_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
    };

    await setDoc(doc(db, 'schedulers', personalScheduler.id), personalScheduler);

    const user: User = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      avatar: newUser.avatar,
      role: 'user',
      status: 'active',
      created_at: newUser.created_at,
    };

    const token = `token_${user.username}_${Date.now()}`;
    setStoredToken(token);
    setCachedUser(user);

    return { token, user };
  } catch (err: any) {
    if (err.message.includes('이미 사용') || err.message.includes('모두 입력')) {
      throw err;
    }
    console.error('Register error:', err);
    throw new Error(err.message || '회원가입 처리 중 오류가 발생했습니다.');
  }
}

export async function demoLogin(usernameInput: string): Promise<{ token: string; user: User }> {
  await ensureFirestoreSeeded();
  const cleanUsername = usernameInput.trim().toLowerCase();

  try {
    const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const user: User = {
        id: userDoc.id,
        username: userData.username,
        name: userData.name,
        avatar: userData.avatar || '😊',
        role: userData.role || 'user',
        status: userData.status || 'active',
        created_at: userData.created_at || new Date().toISOString(),
      };
      const token = `token_${user.username}_${Date.now()}`;
      setStoredToken(token);
      setCachedUser(user);
      return { token, user };
    }
  } catch (err) {
    console.warn('demoLogin Firestore fallback:', err);
  }

  // Fallback to seed match
  const match = getSeedData().users.find((u) => u.username === cleanUsername) || getSeedData().users[1];
  const { password: _, ...safeUser } = match;
  const token = `token_${safeUser.username}_${Date.now()}`;
  setStoredToken(token);
  setCachedUser(safeUser);
  return { token, user: safeUser };
}

export async function getMe(): Promise<{ user: User }> {
  const cached = getCachedUser();
  if (cached) {
    return { user: cached };
  }
  const token = getStoredToken();
  if (!token) {
    throw new Error('인증 토큰이 없습니다.');
  }
  // Try extracting username from token
  const parts = token.split('_');
  if (parts.length >= 2) {
    const res = await demoLogin(parts[1]);
    return { user: res.user };
  }
  const defaultUser = getSeedData().users[1];
  const { password: _, ...safe } = defaultUser;
  return { user: safe };
}

export async function updateProfile(data: { name?: string; avatar?: string; password?: string }): Promise<{ user: User }> {
  const current = getCachedUser();
  if (!current) throw new Error('로그인이 필요합니다.');

  const userRef = doc(db, 'users', current.id);
  const updates: any = {};
  if (data.name) updates.name = data.name.trim();
  if (data.avatar) updates.avatar = data.avatar;
  if (data.password && data.password.trim().length >= 4) updates.password = data.password.trim();

  try {
    await updateDoc(userRef, updates);
  } catch (err) {
    console.warn('updateProfile warning:', err);
  }

  const updatedUser: User = {
    ...current,
    name: data.name ? data.name.trim() : current.name,
    avatar: data.avatar || current.avatar,
  };
  setCachedUser(updatedUser);
  return { user: updatedUser };
}

export async function searchUsers(qStr: string): Promise<{ users: { id: string; username: string; name: string; avatar: string }[] }> {
  const q = qStr.trim().toLowerCase();
  if (!q) return { users: [] };

  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const matched = snapshot.docs
      .map((d) => d.data())
      .filter((u: any) => u.username && u.username.toLowerCase().includes(q) && u.status !== 'suspended')
      .slice(0, 10)
      .map((u: any) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        avatar: u.avatar || '😊',
      }));
    return { users: matched };
  } catch (err) {
    console.error('searchUsers error:', err);
    return { users: [] };
  }
}

// ----------------- SCHEDULERS ----------------- //

export async function getSchedulers(): Promise<{ schedulers: Scheduler[] }> {
  await ensureFirestoreSeeded();
  const current = getCachedUser();
  if (!current) return { schedulers: [] };

  try {
    const snapshot = await getDocs(collection(db, 'schedulers'));
    const list: Scheduler[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as Scheduler;
      const isMember = data.members && data.members.some((m) => m.user_id === current.id);
      if (isMember || current.role === 'admin') {
        list.push({ ...data, id: d.id });
      }
    });
    return { schedulers: list };
  } catch (err) {
    console.error('getSchedulers error:', err);
    return { schedulers: [] };
  }
}

export async function createScheduler(data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}): Promise<{ scheduler: Scheduler }> {
  const current = getCachedUser();
  if (!current) throw new Error('로그인이 필요합니다.');

  const id = `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newScheduler: Scheduler = {
    id,
    name: data.name.trim(),
    description: (data.description || '').trim(),
    icon: data.icon || '📁',
    color: data.color || '#BAE6FD',
    owner_id: current.id,
    members: [
      {
        user_id: current.id,
        username: current.username,
        name: current.name,
        avatar: current.avatar,
        role: 'owner',
        joined_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
  };

  await setDoc(doc(db, 'schedulers', id), newScheduler);
  return { scheduler: newScheduler };
}

export async function updateScheduler(
  id: string,
  data: { name?: string; description?: string; icon?: string; color?: string }
): Promise<{ scheduler: Scheduler }> {
  const schRef = doc(db, 'schedulers', id);
  const snap = await getDoc(schRef);
  if (!snap.exists()) throw new Error('스케줄러를 찾을 수 없습니다.');

  const currentData = snap.data() as Scheduler;
  const updated: Scheduler = {
    ...currentData,
    name: data.name ? data.name.trim() : currentData.name,
    description: data.description !== undefined ? data.description.trim() : currentData.description,
    icon: data.icon || currentData.icon,
    color: data.color || currentData.color,
  };

  await setDoc(schRef, updated);
  return { scheduler: updated };
}

export async function deleteScheduler(id: string): Promise<{ message: string }> {
  await deleteDoc(doc(db, 'schedulers', id));
  // Clean up associated schedules
  try {
    const q = query(collection(db, 'schedules'), where('scheduler_id', '==', id));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('cleanup schedules warning:', err);
  }
  return { message: '스케줄러가 삭제되었습니다.' };
}

export async function inviteMember(
  schedulerId: string,
  targetUsername: string,
  role: string = 'editor'
): Promise<{ invitation: Invitation; message: string }> {
  const current = getCachedUser();
  if (!current) throw new Error('로그인이 필요합니다.');

  const schRef = doc(db, 'schedulers', schedulerId);
  const schSnap = await getDoc(schRef);
  if (!schSnap.exists()) throw new Error('스케줄러를 찾을 수 없습니다.');
  const scheduler = schSnap.data() as Scheduler;

  const usersQ = query(collection(db, 'users'), where('username', '==', targetUsername.trim().toLowerCase()));
  const userSnap = await getDocs(usersQ);
  if (userSnap.empty) throw new Error('초대할 사용자를 찾을 수 없습니다.');

  const targetUser = userSnap.docs[0].data();
  if (targetUser.id === current.id) throw new Error('자기 자신은 초대할 수 없습니다.');
  if (scheduler.members.some((m) => m.user_id === targetUser.id)) {
    throw new Error('이미 참여 중인 멤버입니다.');
  }

  const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const invitation: Invitation = {
    id,
    scheduler_id: scheduler.id,
    scheduler_name: scheduler.name,
    scheduler_icon: scheduler.icon,
    scheduler_color: scheduler.color,
    from_user_id: current.id,
    from_username: current.username,
    from_user_name: current.name,
    to_user_id: targetUser.id,
    to_username: targetUser.username,
    role: role as SchedulerRole,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  await setDoc(doc(db, 'invitations', id), invitation);
  return { invitation, message: `${targetUser.name}(@${targetUser.username})님께 초대를 보냈습니다!` };
}

export async function updateMemberRole(
  schedulerId: string,
  userId: string,
  role: string
): Promise<{ scheduler: Scheduler }> {
  const schRef = doc(db, 'schedulers', schedulerId);
  const snap = await getDoc(schRef);
  if (!snap.exists()) throw new Error('스케줄러를 찾을 수 없습니다.');
  const scheduler = snap.data() as Scheduler;

  const member = scheduler.members.find((m) => m.user_id === userId);
  if (!member) throw new Error('멤버를 찾을 수 없습니다.');
  member.role = role as SchedulerRole;

  await setDoc(schRef, scheduler);
  return { scheduler };
}

export async function removeMember(schedulerId: string, userId: string): Promise<{ message: string }> {
  const schRef = doc(db, 'schedulers', schedulerId);
  const snap = await getDoc(schRef);
  if (!snap.exists()) throw new Error('스케줄러를 찾을 수 없습니다.');
  const scheduler = snap.data() as Scheduler;

  scheduler.members = scheduler.members.filter((m) => m.user_id !== userId);
  await setDoc(schRef, scheduler);
  return { message: '멤버가 제거되었습니다.' };
}

// ----------------- INVITATIONS ----------------- //

export async function getInvitations(): Promise<{ invitations: Invitation[] }> {
  const current = getCachedUser();
  if (!current) return { invitations: [] };

  try {
    const q = query(
      collection(db, 'invitations'),
      where('to_user_id', '==', current.id),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const list: Invitation[] = [];
    snap.forEach((d) => list.push({ ...(d.data() as Invitation), id: d.id }));
    return { invitations: list };
  } catch (err) {
    console.error('getInvitations error:', err);
    return { invitations: [] };
  }
}

export async function respondInvitation(
  id: string,
  action: 'accept' | 'reject'
): Promise<{ message: string; invitation: Invitation }> {
  const current = getCachedUser();
  if (!current) throw new Error('로그인이 필요합니다.');

  const invRef = doc(db, 'invitations', id);
  const snap = await getDoc(invRef);
  if (!snap.exists()) throw new Error('초대장을 찾을 수 없습니다.');
  const invitation = snap.data() as Invitation;

  invitation.status = action === 'accept' ? 'accepted' : 'rejected';
  await setDoc(invRef, invitation);

  if (action === 'accept') {
    const schRef = doc(db, 'schedulers', invitation.scheduler_id);
    const schSnap = await getDoc(schRef);
    if (schSnap.exists()) {
      const schData = schSnap.data() as Scheduler;
      if (!schData.members.some((m) => m.user_id === current.id)) {
        schData.members.push({
          user_id: current.id,
          username: current.username,
          name: current.name,
          avatar: current.avatar,
          role: invitation.role,
          joined_at: new Date().toISOString(),
        });
        await setDoc(schRef, schData);
      }
    }
  }

  return {
    message: action === 'accept' ? '초대를 수락했습니다. 캘린더가 공유됩니다!' : '초대를 거절했습니다.',
    invitation,
  };
}

// ----------------- SCHEDULES ----------------- //

export async function getSchedules(schedulerIds?: string[]): Promise<{ schedules: Schedule[] }> {
  await ensureFirestoreSeeded();
  const current = getCachedUser();
  if (!current) return { schedules: [] };

  try {
    // Fetch all schedulers map for metadata
    const schedulersSnap = await getDocs(collection(db, 'schedulers'));
    const schMap = new Map<string, Scheduler>();
    schedulersSnap.forEach((d) => schMap.set(d.id, d.data() as Scheduler));

    const snap = await getDocs(collection(db, 'schedules'));
    const list: Schedule[] = [];

    snap.forEach((d) => {
      const sc = d.data() as Schedule;
      const sch = schMap.get(sc.scheduler_id);

      // Filter by schedulerIds if specified
      if (schedulerIds && schedulerIds.length > 0 && !schedulerIds.includes(sc.scheduler_id)) {
        return;
      }

      // Check if current user is member of this scheduler
      const isMember = sch?.members?.some((m) => m.user_id === current.id);
      if (!isMember && current.role !== 'admin') {
        return;
      }

      // PRIVACY RULE: Show if author or if is_shared is true
      if (sc.author_id === current.id || sc.is_shared === true) {
        list.push({
          ...sc,
          id: d.id,
          scheduler_name: sch?.name || sc.scheduler_name,
          scheduler_color: sch?.color || sc.scheduler_color,
          scheduler_icon: sch?.icon || sc.scheduler_icon,
        });
      }
    });

    return { schedules: list };
  } catch (err) {
    console.error('getSchedules error:', err);
    return { schedules: [] };
  }
}

export async function createSchedule(data: Partial<Schedule>): Promise<{ schedule: Schedule }> {
  const current = getCachedUser();
  if (!current) throw new Error('로그인이 필요합니다.');

  const id = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const schRef = doc(db, 'schedulers', data.scheduler_id!);
  const schSnap = await getDoc(schRef);
  const scheduler = schSnap.exists() ? (schSnap.data() as Scheduler) : null;

  const newSchedule: Schedule = {
    id,
    scheduler_id: data.scheduler_id!,
    scheduler_name: scheduler?.name,
    scheduler_color: scheduler?.color,
    scheduler_icon: scheduler?.icon,
    author_id: current.id,
    author_name: current.name,
    author_username: current.username,
    title: data.title!.trim(),
    description: (data.description || '').trim(),
    start_date: data.start_date!,
    end_date: data.end_date || data.start_date!,
    start_time: data.is_all_day ? undefined : data.start_time,
    end_time: data.is_all_day ? undefined : data.end_time,
    is_all_day: Boolean(data.is_all_day),
    is_shared: Boolean(data.is_shared),
    repeat_type: data.repeat_type || 'none',
    color: data.color || scheduler?.color || '#BAE6FD',
    category: data.category || '일반',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await setDoc(doc(db, 'schedules', id), newSchedule);
  return { schedule: newSchedule };
}

export async function updateSchedule(id: string, data: Partial<Schedule>): Promise<{ schedule: Schedule }> {
  const scRef = doc(db, 'schedules', id);
  const snap = await getDoc(scRef);
  if (!snap.exists()) throw new Error('일정을 찾을 수 없습니다.');

  const existing = snap.data() as Schedule;
  const updated: Schedule = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  await setDoc(scRef, updated);
  return { schedule: updated };
}

export async function deleteSchedule(id: string): Promise<{ message: string }> {
  await deleteDoc(doc(db, 'schedules', id));
  return { message: '일정이 삭제되었습니다.' };
}

// ----------------- ADMIN PORTAL ----------------- //

export async function getAdminStats(): Promise<{ stats: SystemStats }> {
  const [usersSnap, schSnap, scSnap, invSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'schedulers')),
    getDocs(collection(db, 'schedules')),
    getDocs(collection(db, 'invitations')),
  ]);

  const stats: SystemStats = {
    totalUsers: usersSnap.size,
    activeUsers: usersSnap.docs.filter((d) => d.data().status === 'active').length,
    totalSchedulers: schSnap.size,
    totalSchedules: scSnap.size,
    pendingInvitations: invSnap.docs.filter((d) => d.data().status === 'pending').length,
  };

  return { stats };
}

export async function getAdminUsers(): Promise<{
  users: (User & { ownedSchedulers: number; memberSchedulers: number; scheduleCount: number })[];
}> {
  const [usersSnap, schSnap, scSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'schedulers')),
    getDocs(collection(db, 'schedules')),
  ]);

  const schedulers = schSnap.docs.map((d) => d.data() as Scheduler);
  const schedules = scSnap.docs.map((d) => d.data() as Schedule);

  const list = usersSnap.docs.map((d) => {
    const u = d.data() as User;
    const owned = schedulers.filter((s) => s.owner_id === u.id).length;
    const member = schedulers.filter((s) => s.members && s.members.some((m) => m.user_id === u.id)).length;
    const scCount = schedules.filter((s) => s.author_id === u.id).length;
    return {
      ...u,
      id: d.id,
      ownedSchedulers: owned,
      memberSchedulers: member,
      scheduleCount: scCount,
    };
  });

  return { users: list };
}

export async function updateAdminUser(
  id: string,
  data: { role?: string; status?: string; newPassword?: string }
): Promise<{ user: User; message: string }> {
  const userRef = doc(db, 'users', id);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('사용자를 찾을 수 없습니다.');

  const updates: any = {};
  if (data.role) updates.role = data.role;
  if (data.status) updates.status = data.status;
  if (data.newPassword) updates.password = data.newPassword.trim();

  await updateDoc(userRef, updates);
  const updatedUser = { ...(snap.data() as User), ...updates };
  return { user: updatedUser, message: '사용자 정보가 변경되었습니다.' };
}

export async function deleteAdminUser(id: string): Promise<{ message: string }> {
  await deleteDoc(doc(db, 'users', id));
  return { message: '사용자가 삭제되었습니다.' };
}

export async function getAdminSchedulers(): Promise<{
  schedulers: (Scheduler & { owner_username?: string; owner_name?: string; schedule_count: number })[];
}> {
  const [schSnap, usersSnap, scSnap] = await Promise.all([
    getDocs(collection(db, 'schedulers')),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'schedules')),
  ]);

  const userMap = new Map<string, any>();
  usersSnap.forEach((d) => userMap.set(d.id, d.data()));

  const schedules = scSnap.docs.map((d) => d.data() as Schedule);

  const list = schSnap.docs.map((d) => {
    const sch = d.data() as Scheduler;
    const owner = userMap.get(sch.owner_id);
    const count = schedules.filter((s) => s.scheduler_id === d.id).length;
    return {
      ...sch,
      id: d.id,
      owner_username: owner?.username,
      owner_name: owner?.name,
      schedule_count: count,
    };
  });

  return { schedulers: list };
}

export async function deleteAdminScheduler(id: string): Promise<{ message: string }> {
  await deleteDoc(doc(db, 'schedulers', id));
  return { message: '스케줄러가 삭제되었습니다.' };
}
