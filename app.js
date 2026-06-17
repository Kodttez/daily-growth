const STORAGE_KEY = "daily-growth-data-v1";
const AUTH_MEMORY_KEY = "daily-growth-auth-memory-v1";
const SUPABASE_URL = "https://dupafcuqsaxwkbwnhker.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_7QdttccZ5yJgQwp4CtxWhQ_oIJ3zyOi";
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) || null;

const defaultState = {
  days: {},
  points: 0,
  lastActiveDate: null,
  reasonLogs: [],
  profile: {
    nickname: "",
    email: "",
    authProvider: "local",
    avatarId: "sunny",
    createdAt: null,
    nicknameUpdatedAt: null,
  },
};

const avatars = [
  { id: "sunny", label: "โมจิ", skin: "#F5CDB1", hair: "#55433D", shirt: "#7DB8A3", accent: "#FFD37B", style: "mushroom", accessory: "sprout" },
  { id: "brave", label: "ใบชา", skin: "#9D674B", hair: "#302827", shirt: "#78A2D2", accent: "#A9D7C0", style: "fluffy", accessory: "glasses" },
  { id: "bloom", label: "ลูน่า", skin: "#E9B28D", hair: "#75503E", shirt: "#DB91A7", accent: "#F8C8D6", style: "twin", accessory: "flower" },
  { id: "spark", label: "ซันนี่", skin: "#704A3C", hair: "#282326", shirt: "#B78DCE", accent: "#FFCF68", style: "buns", accessory: "stars" },
  { id: "pride", label: "มินต์", skin: "#D99B74", hair: "#3D3545", shirt: "#F2A16F", accent: "#A98BD2", style: "rainbow", accessory: "heart" },
  { id: "trans", label: "พุดดิ้ง", skin: "#F1C4A5", hair: "#A45E75", shirt: "#77BDCA", accent: "#F4ACC2", style: "beret", accessory: "beret" },
  { id: "free", label: "สกาย", skin: "#B97A58", hair: "#3C302F", shirt: "#E1AB5C", accent: "#83C8C1", style: "cloud", accessory: "headphones" },
  { id: "tonkla", label: "ต้นกล้า", skin: "#E8B58E", hair: "#403530", shirt: "#6FA58D", accent: "#B8D99C", style: "quiff", accessory: "bandage" },
  { id: "phupha", label: "ภูผา", skin: "#8F5D45", hair: "#292526", shirt: "#6588B5", accent: "#E9B36E", style: "cap", accessory: "cap" },
  { id: "natee", label: "นที", skin: "#F0C5A4", hair: "#6A4B3D", shirt: "#70AFC0", accent: "#A6D8E2", style: "buzz", accessory: "freckles" },
  { id: "kaopan", label: "ข้าวปั้น", skin: "#C98562", hair: "#322A29", shirt: "#D98970", accent: "#F4C68A", style: "wavy", accessory: "earring" },
  { id: "arthit", label: "อาทิตย์", skin: "#E2A77F", hair: "#2E292A", shirt: "#C99255", accent: "#FFD268", style: "undercut", accessory: "brow" },
  { id: "copper", label: "คอปเปอร์", skin: "#A96D50", hair: "#713F2F", shirt: "#8975B2", accent: "#D7B8E8", style: "beanie", accessory: "beanie" },
  { id: "ray", label: "เรย์", skin: "#F3CBB0", hair: "#4C3B35", shirt: "#6E9C9F", accent: "#F0A9A1", style: "sidepart", accessory: "scarf" },
];

const categoryColors = {
  "สุขภาพ": "#7eab8e",
  "การเรียนรู้": "#7faab0",
  "งาน": "#ee9b62",
  "ความสัมพันธ์": "#e98870",
  "ดูแลตัวเอง": "#c29acb",
  "อื่น ๆ": "#a9aaa4",
};

const moodEmoji = {
  "เบิกบาน": "😊",
  "สงบ": "😌",
  "เฉย ๆ": "😐",
  "เหนื่อย": "😮‍💨",
  "เศร้า": "😔",
};

let state = loadState();
let editingTaskId = null;
let saveTimers = {};
let pendingTaskAction = null;
let overdueQueue = [];
let overdueIndex = 0;

const todayKey = getDateKey(new Date());
let selectedDateKey = todayKey;
ensureDay(todayKey);
markActiveDay();

const elements = {
  landingPage: document.querySelector("#landingPage"),
  authForm: document.querySelector("#authForm"),
  authNameInput: document.querySelector("#authNameInput"),
  authEmailInput: document.querySelector("#authEmailInput"),
  authPasswordInput: document.querySelector("#authPasswordInput"),
  rememberLoginInput: document.querySelector("#rememberLoginInput"),
  googleLoginBtn: document.querySelector("#googleLoginBtn"),
  fullDate: document.querySelector("#fullDate"),
  pageTitle: document.querySelector("#pageTitle"),
  progressPercent: document.querySelector("#progressPercent"),
  progressRing: document.querySelector("#progressRing"),
  progressMessage: document.querySelector("#progressMessage"),
  completedCount: document.querySelector("#completedCount"),
  remainingCount: document.querySelector("#remainingCount"),
  streakCount: document.querySelector("#streakCount"),
  growthPoints: document.querySelector("#growthPoints"),
  growthLevel: document.querySelector("#growthLevel"),
  expLevel: document.querySelector("#expLevel"),
  expBar: document.querySelector("#expBar"),
  expProgressText: document.querySelector("#expProgressText"),
  sidebarExpBar: document.querySelector("#sidebarExpBar"),
  sidebarExpText: document.querySelector("#sidebarExpText"),
  taskList: document.querySelector("#taskList"),
  taskEmpty: document.querySelector("#taskEmpty"),
  taskModal: document.querySelector("#taskModal"),
  taskForm: document.querySelector("#taskForm"),
  modalTitle: document.querySelector("#modalTitle"),
  taskTitleInput: document.querySelector("#taskTitleInput"),
  taskCategoryInput: document.querySelector("#taskCategoryInput"),
  saveTaskBtn: document.querySelector("#saveTaskBtn"),
  goodThingsInputs: document.querySelector("#goodThingsInputs"),
  improvementsInputs: document.querySelector("#improvementsInputs"),
  goodSaved: document.querySelector("#goodSaved"),
  improveSaved: document.querySelector("#improveSaved"),
  moodOptions: document.querySelector("#moodOptions"),
  toast: document.querySelector("#toast"),
  confettiLayer: document.querySelector("#confettiLayer"),
  insightRange: document.querySelector("#insightRange"),
  weeklyChart: document.querySelector("#weeklyChart"),
  patternList: document.querySelector("#patternList"),
  timelineList: document.querySelector("#timelineList"),
  timelineEmpty: document.querySelector("#timelineEmpty"),
  selectedDateInput: document.querySelector("#selectedDateInput"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  backToTodayBtn: document.querySelector("#backToTodayBtn"),
  yearSelect: document.querySelector("#yearSelect"),
  yearMonths: document.querySelector("#yearMonths"),
  importMessage: document.querySelector("#importMessage"),
  taskReasonModal: document.querySelector("#taskReasonModal"),
  taskReasonForm: document.querySelector("#taskReasonForm"),
  moveDateField: document.querySelector("#moveDateField"),
  moveDateInput: document.querySelector("#moveDateInput"),
  overdueModal: document.querySelector("#overdueModal"),
  overdueForm: document.querySelector("#overdueForm"),
  onboardingModal: document.querySelector("#onboardingModal"),
  onboardingChoice: document.querySelector("#onboardingChoice"),
  onboardingStartBtn: document.querySelector("#onboardingStartBtn"),
  nicknameForm: document.querySelector("#nicknameForm"),
  nicknameInput: document.querySelector("#nicknameInput"),
  onboardingAvatarPicker: document.querySelector("#onboardingAvatarPicker"),
  profileButton: document.querySelector("#profileButton"),
  logoutBtn: document.querySelector("#logoutBtn"),
  profileModal: document.querySelector("#profileModal"),
  profileForm: document.querySelector("#profileForm"),
  profileNameInput: document.querySelector("#profileNameInput"),
  saveProfileButton: document.querySelector("#saveProfileButton"),
  profileCooldown: document.querySelector("#profileCooldown"),
  profileAvatarPicker: document.querySelector("#profileAvatarPicker"),
};

init();

function init() {
  renderDate();
  renderSelectedDate();
  renderDashboard();
  renderTasks();
  renderReflectionInputs();
  renderMood();
  renderInsights();
  renderTimeline();
  renderYearOverview();
  renderAvatarPickers();
  renderProfile();
  prepareAuthForm();
  bindEvents();
  showLanding();
  initializeAuth();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    const migrated = {
      ...defaultState,
      ...saved,
      days: saved.days || {},
      reasonLogs: Array.isArray(saved.reasonLogs) ? saved.reasonLogs : [],
      profile: normalizeProfile(saved.profile),
    };
    migrated.points = countCompletedTasks(migrated.days);
    return migrated;
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return structuredClone(defaultState.profile);
  }
  return {
    nickname: typeof profile.nickname === "string" ? profile.nickname.trim().slice(0, 24) : "",
    email: typeof profile.email === "string" ? profile.email.trim().slice(0, 120) : "",
    authProvider: typeof profile.authProvider === "string" ? profile.authProvider : "local",
    avatarId: avatars.some((avatar) => avatar.id === profile.avatarId) ? profile.avatarId : defaultState.profile.avatarId,
    createdAt: typeof profile.createdAt === "string" ? profile.createdAt : null,
    nicknameUpdatedAt: typeof profile.nicknameUpdatedAt === "string" ? profile.nicknameUpdatedAt : null,
  };
}

function hasProfile() {
  return Boolean(state.profile?.nickname);
}

function countCompletedTasks(days) {
  return Object.values(days || {}).reduce((total, day) => {
    return total + (day.tasks || []).filter((task) => task.completed).length;
  }, 0);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureDay(key) {
  if (!state.days[key]) {
    state.days[key] = {
      tasks: [],
      goodThings: ["", "", ""],
      improvements: ["", "", ""],
      mood: "",
      visited: false,
    };
  }
  return state.days[key];
}

function markActiveDay() {
  const day = ensureDay(todayKey);
  day.visited = true;
  state.lastActiveDate = todayKey;
  saveState();
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function renderDate() {
  const now = new Date();
  elements.fullDate.textContent = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

function renderSelectedDate() {
  const date = parseDateKey(selectedDateKey);
  const isToday = selectedDateKey === todayKey;
  const isFuture = date > parseDateKey(todayKey);
  const dayReference = isToday ? "วันนี้" : "วันที่เลือก";
  elements.selectedDateInput.value = selectedDateKey;
  elements.selectedDateLabel.textContent = isToday
    ? "วันนี้"
    : new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit" }).format(date);
  elements.backToTodayBtn.classList.toggle("hidden", isToday);
  document.querySelector(".progress-card .card-label").textContent = `ความก้าวหน้า${dayReference}`;
  document.querySelector(".tasks-panel .panel-heading h2").textContent = `ก้าวเล็ก ๆ ของ${dayReference}`;
  document.querySelector("#taskEmpty h3").textContent = isToday
    ? "วันนี้อยากขยับเรื่องไหนบ้าง?"
    : "อยากวางก้าวไหนไว้สำหรับวันที่เลือก?";

  const welcomeTitle = document.querySelector("#todayView .welcome-row h2");
  const welcomeText = document.querySelector("#todayView .welcome-row p");
  if (isToday) {
    welcomeTitle.textContent = "ค่อย ๆ เติบโตไปด้วยกันนะ";
    welcomeText.textContent = "ทุกสิ่งเล็ก ๆ ที่คุณทำในวันนี้ มีความหมายเสมอ";
  } else if (isFuture) {
    welcomeTitle.textContent = "วางก้าวเล็ก ๆ ไว้ล่วงหน้า";
    welcomeText.textContent = "เตรียมสิ่งที่อยากทำไว้แบบพอดี โดยไม่ต้องกดดันตัวเอง";
  } else {
    welcomeTitle.textContent = "ย้อนดูวันของคุณ";
    welcomeText.textContent = "ทุกวันที่ผ่านมา มีบางอย่างให้เราเรียนรู้เสมอ";
  }
}

function selectDate(key) {
  if (!key) return;
  selectedDateKey = key;
  ensureDay(selectedDateKey);
  saveState();
  renderSelectedDate();
  renderDashboard();
  renderTasks();
  renderReflectionInputs();
  renderMood();
}

function changeSelectedDate(offset) {
  const date = parseDateKey(selectedDateKey);
  date.setDate(date.getDate() + offset);
  selectDate(getDateKey(date));
}

function renderDashboard() {
  const tasks = ensureDay(selectedDateKey).tasks;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const totalExp = countCompletedTasks(state.days);
  const level = Math.floor(totalExp / 10) + 1;
  const levelExp = totalExp % 10;

  elements.progressPercent.textContent = percent;
  elements.progressRing.style.setProperty("--progress", percent);
  elements.completedCount.textContent = completed;
  elements.remainingCount.textContent = tasks.length - completed;
  state.points = totalExp;
  elements.growthPoints.textContent = levelExp;
  elements.growthLevel.textContent = level;
  elements.expLevel.textContent = level;
  elements.expProgressText.textContent = `${levelExp} / 10 EXP`;
  elements.expBar.style.width = `${levelExp * 10}%`;
  elements.sidebarExpText.textContent = `${levelExp} / 10`;
  elements.sidebarExpBar.style.width = `${levelExp * 10}%`;
  renderProfile(level);
  elements.streakCount.textContent = calculateStreak();

  if (!tasks.length) {
    elements.progressMessage.textContent = "เริ่มจากก้าวเล็ก ๆ สักก้าว";
  } else if (percent === 100) {
    elements.progressMessage.textContent = selectedDateKey === todayKey ? "วันนี้คุณทำได้ดีมาก" : "ทุกก้าวของวันนี้สำเร็จแล้ว";
  } else if (percent >= 50) {
    elements.progressMessage.textContent = "มาไกลเกินครึ่งทางแล้ว";
  } else {
    elements.progressMessage.textContent = "กำลังเติบโตอย่างสวยงาม";
  }
}

function calculateStreak() {
  const activeDates = Object.entries(state.days)
    .filter(([, day]) => hasGrowthActivity(day))
    .map(([key]) => key);

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  while (activeDates.includes(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function hasGrowthActivity(day) {
  return (day.tasks || []).some((task) => task.completed)
    || (day.goodThings || []).some(Boolean)
    || (day.improvements || []).some(Boolean)
    || Boolean(day.mood);
}

function renderTasks() {
  const tasks = ensureDay(selectedDateKey).tasks;
  elements.taskList.innerHTML = "";
  elements.taskEmpty.classList.toggle("hidden", tasks.length > 0);

  tasks.forEach((task) => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " completed" : ""}`;
    item.dataset.id = task.id;
    item.innerHTML = `
      <button class="task-check" data-action="toggle" aria-label="${task.completed ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}">
        <svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"/></svg>
      </button>
      <div class="task-copy">
        <span class="task-title"></span>
        <span class="task-category"></span>
      </div>
      <div class="task-actions">
        <button class="task-action" data-action="edit" aria-label="แก้ไขงาน">
          <svg viewBox="0 0 24 24"><path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z"/><path d="m13.5 7 3.5 3.5"/></svg>
        </button>
        <button class="task-action delete" data-action="delete" aria-label="ลบงาน">
          <svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m2 0-1 13H8L7 7m3 4v5m4-5v5"/></svg>
        </button>
      </div>
    `;
    item.querySelector(".task-title").textContent = task.title;
    const category = item.querySelector(".task-category");
    category.textContent = task.category;
    category.style.setProperty("--category-color", categoryColors[task.category] || categoryColors["อื่น ๆ"]);
    category.style.color = categoryColors[task.category] || categoryColors["อื่น ๆ"];
    elements.taskList.appendChild(item);
  });
}

function renderReflectionInputs() {
  const day = ensureDay(selectedDateKey);
  createReflectionRows(elements.goodThingsInputs, day.goodThings, "เรื่องดี ๆ ที่เกิดขึ้น", "goodThings");
  createReflectionRows(elements.improvementsInputs, day.improvements, "สิ่งที่อยากลองปรับ", "improvements");
}

function createReflectionRows(container, values, placeholder, field) {
  container.innerHTML = "";
  for (let index = 0; index < 3; index += 1) {
    const row = document.createElement("label");
    row.className = "reflection-row";
    row.innerHTML = `<span>${index + 1}</span><input type="text" maxlength="120" data-field="${field}" data-index="${index}" placeholder="${placeholder}">`;
    row.querySelector("input").value = values[index] || "";
    container.appendChild(row);
  }
}

function renderMood() {
  const currentMood = ensureDay(selectedDateKey).mood;
  elements.moodOptions.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === currentMood);
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelector("#openTaskModal").addEventListener("click", openNewTaskModal);
  document.querySelector("#emptyAddTask").addEventListener("click", openNewTaskModal);
  elements.taskForm.addEventListener("submit", handleTaskSubmit);
  elements.taskList.addEventListener("click", handleTaskAction);

  [elements.goodThingsInputs, elements.improvementsInputs].forEach((container) => {
    container.addEventListener("input", handleReflectionInput);
  });

  elements.moodOptions.addEventListener("click", handleMoodSelect);
  elements.insightRange.addEventListener("change", renderInsights);
  elements.selectedDateInput.addEventListener("change", (event) => selectDate(event.target.value));
  document.querySelector("#previousDayBtn").addEventListener("click", () => changeSelectedDate(-1));
  document.querySelector("#nextDayBtn").addEventListener("click", () => changeSelectedDate(1));
  elements.backToTodayBtn.addEventListener("click", () => selectDate(todayKey));
  elements.yearSelect.addEventListener("change", renderYearOverview);
  elements.yearMonths.addEventListener("click", (event) => {
    const dayButton = event.target.closest("button[data-date]");
    if (!dayButton) return;
    selectDate(dayButton.dataset.date);
    switchView("today");
  });
  elements.authForm.addEventListener("submit", handleSupabaseAuthSubmit);
  elements.googleLoginBtn.addEventListener("click", handleSupabaseGoogleLogin);
  elements.onboardingStartBtn.addEventListener("click", showNicknameStep);
  elements.nicknameForm.addEventListener("submit", saveInitialNickname);
  elements.onboardingModal.addEventListener("cancel", (event) => event.preventDefault());
  elements.profileButton.addEventListener("click", openProfileModal);
  elements.logoutBtn.addEventListener("click", logoutSupabaseProfile);
  elements.profileForm.addEventListener("submit", saveProfileNickname);
  elements.taskReasonForm.addEventListener("change", handleDeleteReasonChange);
  elements.taskReasonForm.addEventListener("submit", handleTaskReasonSubmit);
  elements.overdueForm.addEventListener("submit", handleOverdueReasonSubmit);
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-dialog]");
    if (!closeButton) return;
    closeButton.closest("dialog")?.close();
  });
}

function prepareAuthForm() {
  try {
    const memory = JSON.parse(localStorage.getItem(AUTH_MEMORY_KEY));
    if (!memory || typeof memory !== "object") return;
    elements.authEmailInput.value = typeof memory.email === "string" ? memory.email : "";
    elements.rememberLoginInput.checked = Boolean(memory.rememberEmail);
  } catch {
    localStorage.removeItem(AUTH_MEMORY_KEY);
  }
}

function showLanding() {
  document.body.classList.remove("is-authenticated");
  elements.onboardingModal.close();
}

function showApp() {
  document.body.classList.add("is-authenticated");
  if (elements.onboardingModal.open) elements.onboardingModal.close();
}

async function initializeAuth() {
  if (!supabaseClient) {
    showImportMessage("ไม่พบตัวเชื่อม Supabase กรุณาตรวจสอบการโหลดหน้าเว็บ", "error");
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    showImportMessage(error.message, "error");
    return;
  }

  applySupabaseSession(data.session);
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    applySupabaseSession(session);
  });
}

function applySupabaseSession(session) {
  if (!session?.user) {
    showLanding();
    return;
  }

  syncProfileFromUser(session.user);
  renderProfile();
  showApp();
  prepareOverdueCheck();
}

function syncProfileFromUser(user) {
  const metadata = user.user_metadata || {};
  const fallbackName = user.email?.split("@")[0] || "Daily Grower";
  const displayName = metadata.name || metadata.full_name || state.profile.nickname || fallbackName;
  state.profile = {
    ...state.profile,
    nickname: String(displayName).trim().slice(0, 24) || fallbackName,
    email: user.email || state.profile.email || "",
    authProvider: user.app_metadata?.provider || "email",
    avatarId: state.profile.avatarId || defaultState.profile.avatarId,
    createdAt: state.profile.createdAt || user.created_at || new Date().toISOString(),
    nicknameUpdatedAt: state.profile.nicknameUpdatedAt || null,
  };
  saveState();
}

function rememberLoginEmail(email) {
  if (elements.rememberLoginInput.checked) {
    localStorage.setItem(AUTH_MEMORY_KEY, JSON.stringify({
      email,
      rememberEmail: true,
    }));
  } else {
    localStorage.removeItem(AUTH_MEMORY_KEY);
  }
}

function setAuthBusy(isBusy) {
  elements.authForm.querySelectorAll("input, button").forEach((control) => {
    control.disabled = isBusy;
  });
}

async function handleSupabaseAuthSubmit(event) {
  event.preventDefault();
  const email = elements.authEmailInput.value.trim().toLowerCase();
  const password = elements.authPasswordInput.value;
  if (!email || password.length < 6) return;

  if (!supabaseClient) {
    showImportMessage("ไม่พบตัวเชื่อม Supabase กรุณารีเฟรชหน้าเว็บ", "error");
    return;
  }

  rememberLoginEmail(email);
  setAuthBusy(true);

  try {
    const signInResult = await supabaseClient.auth.signInWithPassword({ email, password });
    if (!signInResult.error) {
      applySupabaseSession(signInResult.data.session);
      showImportMessage("เข้าสู่ระบบสำเร็จ", "success");
      return;
    }

    const fallbackName = email.split("@")[0] || "Daily Grower";
    const name = elements.authNameInput.value.trim() || fallbackName;
    const signUpResult = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });

    if (signUpResult.error) throw signUpResult.error;

    if (signUpResult.data.session) {
      applySupabaseSession(signUpResult.data.session);
      showImportMessage("สมัครสมาชิกและเข้าสู่ระบบสำเร็จ", "success");
    } else {
      showImportMessage("สมัครสมาชิกสำเร็จ กรุณาเช็กอีเมลเพื่อยืนยันบัญชี", "success");
    }
  } catch (error) {
    showImportMessage(error.message || "ไม่สามารถเข้าสู่ระบบได้", "error");
  } finally {
    setAuthBusy(false);
  }
}

async function handleSupabaseGoogleLogin() {
  if (!supabaseClient) {
    showImportMessage("ไม่พบตัวเชื่อม Supabase กรุณารีเฟรชหน้าเว็บ", "error");
    return;
  }

  rememberLoginEmail(elements.authEmailInput.value.trim().toLowerCase());
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  });

  if (error) showImportMessage(error.message, "error");
}

async function logoutSupabaseProfile() {
  if (supabaseClient) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      showImportMessage(error.message, "error");
      return;
    }
  }

  state.profile = structuredClone(defaultState.profile);
  saveState();
  renderProfile();
  showLanding();
  showImportMessage("ออกจากระบบแล้ว ข้อมูลกิจกรรมเดิมยังอยู่ในเครื่องนี้", "success");
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const email = elements.authEmailInput.value.trim().toLowerCase();
  const password = elements.authPasswordInput.value;
  if (!email || password.length < 6) return;

  if (elements.rememberLoginInput.checked) {
    localStorage.setItem(AUTH_MEMORY_KEY, JSON.stringify({
      email,
      rememberEmail: true,
    }));
  } else {
    localStorage.removeItem(AUTH_MEMORY_KEY);
  }

  const now = new Date().toISOString();
  const fallbackName = email.split("@")[0] || "Daily Grower";
  state.profile = {
    ...state.profile,
    nickname: (elements.authNameInput.value.trim() || fallbackName).slice(0, 24),
    email,
    authProvider: "email",
    avatarId: state.profile.avatarId || defaultState.profile.avatarId,
    createdAt: state.profile.createdAt || now,
    nicknameUpdatedAt: state.profile.nicknameUpdatedAt || null,
  };
  saveState();
  renderProfile();
  showApp();
  showImportMessage(`ยินดีต้อนรับ ${state.profile.nickname}`, "success");
  prepareOverdueCheck();
}

function handleGoogleLogin() {
  showImportMessage("ปุ่ม Google พร้อมด้านดีไซน์แล้ว แต่ต้องเชื่อม OAuth/Supabase ก่อนใช้งานจริง", "error");
}

function showOnboardingChoice() {
  elements.onboardingChoice.classList.add("active");
  elements.nicknameForm.classList.remove("active");
  if (!elements.onboardingModal.open) elements.onboardingModal.showModal();
}

function showNicknameStep() {
  elements.onboardingChoice.classList.remove("active");
  elements.nicknameForm.classList.add("active");
  requestAnimationFrame(() => elements.nicknameInput.focus());
}

function logoutProfile() {
  state.profile = structuredClone(defaultState.profile);
  saveState();
  renderProfile();
  showLanding();
  showImportMessage("ออกจากระบบแล้ว ข้อมูลกิจกรรมเดิมยังอยู่ในเครื่องนี้", "success");
}

function saveInitialNickname(event) {
  event.preventDefault();
  const nickname = elements.nicknameInput.value.trim();
  if (!nickname) return;
  const now = new Date().toISOString();
  state.profile = {
    nickname: nickname.slice(0, 24),
    avatarId: getSelectedAvatarId(elements.onboardingAvatarPicker),
    createdAt: now,
    nicknameUpdatedAt: null,
  };
  saveState();
  renderProfile();
  showApp();
  showImportMessage(`ยินดีต้อนรับ ${state.profile.nickname}`, "success");
  prepareOverdueCheck();
}

function getProfileLevel() {
  return Math.floor(countCompletedTasks(state.days) / 10) + 1;
}

function getAvatar(id) {
  return avatars.find((avatar) => avatar.id === id) || avatars[0];
}

function createAvatarSvg(avatarId) {
  const avatar = getAvatar(avatarId);
  const hairStyles = {
    mushroom: `<path d="M10 19C9 11 14 7 22 7s13 5 12 13c-5-1-9-3-12-7-2 4-6 6-12 6Z" fill="${avatar.hair}"/><path d="M11 17v7M33 17v7" stroke="${avatar.hair}" stroke-width="4" stroke-linecap="round"/>`,
    fluffy: `<circle cx="13" cy="14" r="5" fill="${avatar.hair}"/><circle cx="19" cy="10" r="5" fill="${avatar.hair}"/><circle cx="26" cy="10" r="5" fill="${avatar.hair}"/><circle cx="32" cy="15" r="5" fill="${avatar.hair}"/><path d="M10 20c0-7 5-12 12-12s12 5 12 12l-5-4-3 3-4-5-4 4-3-3-5 5Z" fill="${avatar.hair}"/>`,
    twin: `<path d="M9 22C8 12 13 7 22 7s14 5 13 15l-5 10H14L9 22Z" fill="${avatar.hair}"/><path d="M11 17c5-1 9-4 11-8 3 5 7 7 12 8" fill="none" stroke="${avatar.hair}" stroke-width="3"/>`,
    buns: `<circle cx="13" cy="10" r="6" fill="${avatar.hair}"/><circle cx="31" cy="10" r="6" fill="${avatar.hair}"/><path d="M10 20C10 11 15 7 22 7s12 5 12 13c-5-1-9-3-12-7-3 4-7 6-12 7Z" fill="${avatar.hair}"/>`,
    rainbow: `<path d="M9 20C9 11 14 6 22 6s13 5 13 14c-5-2-9-5-12-9-3 5-8 8-14 9Z" fill="${avatar.hair}"/><path d="M12 13c5-5 13-6 19 0" fill="none" stroke="#F08A8A" stroke-width="2"/><path d="M14 11c4-3 10-4 15 0" fill="none" stroke="#F3C36B" stroke-width="2"/><path d="M17 9c3-1 6-1 9 0" fill="none" stroke="#77BDA8" stroke-width="2"/>`,
    beret: `<path d="M10 20C10 11 15 7 22 7s12 5 12 14c-4-2-8-5-10-10-3 5-8 8-14 9Z" fill="${avatar.hair}"/><path d="M29 12c3 5 3 12 0 17" stroke="${avatar.hair}" stroke-width="4" stroke-linecap="round"/>`,
    cloud: `<circle cx="13" cy="14" r="5" fill="${avatar.hair}"/><circle cx="19" cy="10" r="5" fill="${avatar.hair}"/><circle cx="26" cy="10" r="5" fill="${avatar.hair}"/><circle cx="32" cy="14" r="5" fill="${avatar.hair}"/><path d="M10 20c3-6 7-9 12-9s9 3 12 9c-5-1-9-3-12-7-3 4-7 6-12 7Z" fill="${avatar.hair}"/>`,
    quiff: `<path d="M10 19c0-7 4-11 11-12-1-4 4-6 8-4-2 1-3 3-3 5 5 1 8 5 8 11-5-1-9-4-11-8-3 4-7 7-13 8Z" fill="${avatar.hair}"/>`,
    cap: `<path d="M10 20c0-8 5-12 12-12 6 0 11 4 12 11-5-1-9-4-12-7-3 4-7 7-12 8Z" fill="${avatar.hair}"/>`,
    buzz: `<path d="M11 17c1-7 5-10 11-10s10 3 11 10c-4-1-8-3-11-6-3 3-7 5-11 6Z" fill="${avatar.hair}"/><path d="M14 10c5-3 11-3 16 0" fill="none" stroke="${avatar.accent}" stroke-width="1.2" opacity=".65"/>`,
    wavy: `<path d="M9 20c0-8 5-13 13-13 7 0 12 5 12 13l-4-4-3 2-4-5-4 4-4-3-6 6Z" fill="${avatar.hair}"/>`,
    undercut: `<path d="M10 19c1-8 5-12 12-12 5 0 9 2 11 7-5 0-10-1-14-4-1 4-4 7-9 9Z" fill="${avatar.hair}"/><path d="M29 8c-2-3-7-5-11-2 5-5 12-5 15-1l-4 3Z" fill="${avatar.hair}"/>`,
    beanie: `<path d="M10 20c0-8 5-12 12-12s12 4 12 12c-5-1-9-4-12-8-3 4-7 7-12 8Z" fill="${avatar.hair}"/>`,
    sidepart: `<path d="M10 19c0-8 5-12 12-12 7 0 11 4 12 11-6 0-11-3-14-7-2 4-5 6-10 8Z" fill="${avatar.hair}"/><path d="M20 8c3-2 7-2 10 0" fill="none" stroke="${avatar.accent}" stroke-width="1.5"/>`,
  };
  const accessories = {
    sprout: `<path d="M22 7V3" stroke="#609B70" stroke-width="2" stroke-linecap="round"/><path d="M22 4c-4 0-5-2-5-4 3 0 5 1 5 4Zm0 0c4 0 5-2 5-4-3 0-5 1-5 4Z" fill="#78B987"/>`,
    glasses: `<circle cx="18" cy="20" r="3.5" fill="none" stroke="#64544C" stroke-width="1.4"/><circle cx="26" cy="20" r="3.5" fill="none" stroke="#64544C" stroke-width="1.4"/><path d="M21.5 20h1" stroke="#64544C" stroke-width="1.4"/>`,
    flower: `<circle cx="31" cy="10" r="2" fill="#F6C95F"/><circle cx="31" cy="6.5" r="2.3" fill="#F29AAD"/><circle cx="34.2" cy="9" r="2.3" fill="#F29AAD"/><circle cx="33" cy="12.5" r="2.3" fill="#F29AAD"/><circle cx="29" cy="12.5" r="2.3" fill="#F29AAD"/><circle cx="27.8" cy="9" r="2.3" fill="#F29AAD"/>`,
    stars: `<path d="m8 17 1 2.2 2.4.3-1.8 1.7.5 2.4L8 22.4l-2.1 1.2.5-2.4-1.8-1.7 2.4-.3L8 17Zm29-7 .8 1.7 1.9.3-1.4 1.3.3 1.9-1.6-.9-1.7.9.4-1.9-1.4-1.3 1.9-.3L37 10Z" fill="#FFD15C"/>`,
    heart: `<path d="M33 8c-2-3-7 0-3 4l3 3 3-3c4-4-1-7-3-4Z" fill="#EF82A1"/>`,
    beret: `<path d="M12 10c3-6 13-8 20-2l-2 4c-6-2-12-1-18 2v-4Z" fill="#E9829E"/><circle cx="23" cy="5" r="1.6" fill="#E9829E"/>`,
    headphones: `<path d="M10 21v-3c0-8 5-13 12-13s12 5 12 13v3" fill="none" stroke="#5A8799" stroke-width="2.5"/><rect x="8" y="18" width="5" height="9" rx="2.5" fill="#79BCCA"/><rect x="31" y="18" width="5" height="9" rx="2.5" fill="#79BCCA"/>`,
    bandage: `<rect x="27" y="16" width="6" height="2.6" rx="1.3" fill="#F4D4B7" transform="rotate(-18 30 17.3)"/><circle cx="29.3" cy="17.5" r=".35" fill="#D4AE91"/><circle cx="31.1" cy="17" r=".35" fill="#D4AE91"/>`,
    cap: `<path d="M11 11c3-6 15-8 21-1l-1 5c-7-3-13-3-20 0v-4Z" fill="#5578A5"/><path d="M29 13c4-1 7 0 9 2-4 1-7 1-10 0l1-2Z" fill="#45678F"/>`,
    freckles: `<circle cx="16" cy="23" r=".55" fill="#A66D55"/><circle cx="18" cy="23.7" r=".45" fill="#A66D55"/><circle cx="28" cy="23" r=".55" fill="#A66D55"/><circle cx="26" cy="23.7" r=".45" fill="#A66D55"/>`,
    earring: `<circle cx="32" cy="22" r="1.6" fill="none" stroke="#F1C35F" stroke-width="1.2"/>`,
    brow: `<path d="M16.5 17.2c1.4-.8 2.8-.8 4 0M23.5 17.2c1.4-.8 2.8-.8 4 0" fill="none" stroke="#3C302D" stroke-width="1.2" stroke-linecap="round"/>`,
    beanie: `<path d="M10 13C12 5 18 2 24 3c6 1 9 5 10 11-8-3-16-3-24-1Z" fill="#937BC0"/><path d="M10 12c8-2 16-2 24 1l-.5 4c-8-2-15-2-23 0l-.5-5Z" fill="#7D68AA"/><circle cx="23" cy="3" r="3" fill="#B9A5DB"/>`,
    scarf: `<path d="M14 31c5 3 11 3 16 0l2 5c-7 3-13 3-20 0l2-5Z" fill="#E58F88"/><path d="m28 34 5 8-5-1-2-6 2-1Z" fill="#D97D77"/>`,
  };
  return `
    <svg viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="21" fill="${avatar.accent}" opacity=".28"/>
      <circle cx="7" cy="8" r="2" fill="#fff" opacity=".55"/><circle cx="37" cy="31" r="3" fill="#fff" opacity=".4"/>
      <path d="M8 44c1-10 6-15 14-15s13 5 14 15H8Z" fill="${avatar.shirt}"/>
      ${hairStyles[avatar.style]}
      <ellipse cx="22" cy="20" rx="10" ry="11" fill="${avatar.skin}"/>
      <path d="M14 17c4-1 8-3 10-7 2 4 5 6 8 7" fill="none" stroke="${avatar.hair}" stroke-width="2.8" stroke-linecap="round"/>
      <ellipse cx="18.5" cy="20" rx="1.25" ry="1.7" fill="#443936"/><ellipse cx="25.5" cy="20" rx="1.25" ry="1.7" fill="#443936"/>
      <circle cx="18.1" cy="19.5" r=".4" fill="#fff"/><circle cx="25.1" cy="19.5" r=".4" fill="#fff"/>
      <path d="M19 25c2 2 4 2 6 0" fill="#fff" stroke="#9A5C5C" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="15.5" cy="23" rx="2" ry="1.3" fill="#F08F9C" opacity=".55"/><ellipse cx="28.5" cy="23" rx="2" ry="1.3" fill="#F08F9C" opacity=".55"/>
      ${accessories[avatar.accessory]}
    </svg>`;
}

function renderAvatarPickers() {
  [elements.onboardingAvatarPicker, elements.profileAvatarPicker].forEach((picker, pickerIndex) => {
    const selectedId = pickerIndex === 0 ? defaultState.profile.avatarId : state.profile.avatarId;
    picker.innerHTML = avatars.map((avatar) => `
      <label class="avatar-option" title="${avatar.label}">
        <input type="radio" name="${pickerIndex === 0 ? "onboardingAvatar" : "profileAvatar"}" value="${avatar.id}" ${avatar.id === selectedId ? "checked" : ""}>
        <span>${createAvatarSvg(avatar.id)}</span>
        <small>${avatar.label}</small>
      </label>
    `).join("");
  });
}

function getSelectedAvatarId(picker) {
  return picker.querySelector("input:checked")?.value || defaultState.profile.avatarId;
}

function renderProfile(level = getProfileLevel()) {
  if (!hasProfile()) {
    document.querySelector("#profileNickname").textContent = "Daily Grower";
    document.querySelector("#profileLevel").textContent = level;
    document.querySelector("#profileAvatar").innerHTML = createAvatarSvg(defaultState.profile.avatarId);
    document.querySelector("#profileModalName").textContent = "Daily Grower";
    document.querySelector("#profileModalLevel").textContent = level;
    document.querySelector("#profileModalAvatar").innerHTML = createAvatarSvg(defaultState.profile.avatarId);
    return;
  }
  const nickname = state.profile.nickname;
  document.querySelector("#profileNickname").textContent = nickname;
  document.querySelector("#profileLevel").textContent = level;
  document.querySelector("#profileAvatar").innerHTML = createAvatarSvg(state.profile.avatarId);
  document.querySelector("#profileModalName").textContent = nickname;
  document.querySelector("#profileModalLevel").textContent = level;
  document.querySelector("#profileModalAvatar").innerHTML = createAvatarSvg(state.profile.avatarId);
}

function openProfileModal() {
  if (!hasProfile()) {
    showOnboardingChoice();
    return;
  }
  const remaining = getNicknameCooldown();
  elements.profileNameInput.value = state.profile.nickname;
  const avatarInput = elements.profileAvatarPicker.querySelector(`[value="${state.profile.avatarId}"]`);
  if (avatarInput) avatarInput.checked = true;
  elements.profileNameInput.disabled = remaining > 0;
  elements.profileCooldown.textContent = remaining > 0
    ? `แก้ไขชื่อได้อีกครั้งใน ${formatCooldown(remaining)} แต่เปลี่ยน avatar ได้เสมอ`
    : "คุณสามารถแก้ไขชื่อได้ 1 ครั้งต่อ 2 วัน และเปลี่ยน avatar ได้เสมอ";
  renderProfile();
  elements.profileModal.showModal();
}

function getNicknameCooldown() {
  if (!state.profile?.nicknameUpdatedAt) return 0;
  const availableAt = new Date(state.profile.nicknameUpdatedAt).getTime() + (2 * 24 * 60 * 60 * 1000);
  return Math.max(0, availableAt - Date.now());
}

function formatCooldown(milliseconds) {
  const totalHours = Math.ceil(milliseconds / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (!days) return `${hours} ชั่วโมง`;
  return hours ? `${days} วัน ${hours} ชั่วโมง` : `${days} วัน`;
}

function saveProfileNickname(event) {
  event.preventDefault();
  if (getNicknameCooldown() === 0) {
    const nickname = elements.profileNameInput.value.trim();
    if (!nickname) return;
    if (nickname !== state.profile.nickname) {
      state.profile.nickname = nickname.slice(0, 24);
      state.profile.nicknameUpdatedAt = new Date().toISOString();
    }
  }
  state.profile.avatarId = getSelectedAvatarId(elements.profileAvatarPicker);
  saveState();
  renderProfile();
  elements.profileModal.close();
  showImportMessage("บันทึกโปรไฟล์แล้ว", "success");
}

function switchView(viewName) {
  const titles = {
    today: "วันของคุณ",
    insights: "มองเห็นตัวเอง",
    year: "ภาพรวมหนึ่งปี",
    timeline: "เส้นทางเติบโต",
  };

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#${viewName}View`).classList.add("active");
  document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  elements.pageTitle.textContent = titles[viewName];

  if (viewName === "insights") renderInsights();
  if (viewName === "year") renderYearOverview();
  if (viewName === "timeline") renderTimeline();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openNewTaskModal() {
  editingTaskId = null;
  elements.modalTitle.textContent = "เพิ่มก้าวใหม่";
  elements.saveTaskBtn.textContent = "เพิ่มก้าวนี้";
  elements.taskForm.reset();
  elements.taskModal.showModal();
  requestAnimationFrame(() => elements.taskTitleInput.focus());
}

function openEditTaskModal(task) {
  editingTaskId = task.id;
  elements.modalTitle.textContent = "ปรับรายละเอียด";
  elements.saveTaskBtn.textContent = "บันทึก";
  elements.taskTitleInput.value = task.title;
  elements.taskCategoryInput.value = task.category;
  elements.taskModal.showModal();
  requestAnimationFrame(() => elements.taskTitleInput.focus());
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const title = elements.taskTitleInput.value.trim();
  if (!title) return;

  const tasks = ensureDay(selectedDateKey).tasks;
  if (editingTaskId) {
    const task = tasks.find((item) => item.id === editingTaskId);
    if (task) {
      task.title = title;
      task.category = elements.taskCategoryInput.value;
    }
  } else {
    tasks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      title,
      category: elements.taskCategoryInput.value,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    });
  }

  saveState();
  elements.taskModal.close();
  renderTasks();
  renderDashboard();
  renderTimeline();
  renderYearOverview();
}

function handleTaskAction(event) {
  const actionButton = event.target.closest("[data-action]");
  const taskItem = event.target.closest(".task-item");
  if (!actionButton || !taskItem) return;

  const tasks = ensureDay(selectedDateKey).tasks;
  const task = tasks.find((item) => item.id === taskItem.dataset.id);
  if (!task) return;

  const action = actionButton.dataset.action;
  if (action === "toggle") {
    const previousLevel = Math.floor(countCompletedTasks(state.days) / 10) + 1;
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    const nextLevel = Math.floor(countCompletedTasks(state.days) / 10) + 1;
    if (task.completed) celebrate(actionButton, nextLevel > previousLevel);
  } else if (action === "edit") {
    openEditTaskModal(task);
    return;
  } else if (action === "delete") {
    openTaskReasonModal(task);
    return;
  }

  saveState();
  renderTasks();
  renderDashboard();
  renderInsights();
  renderTimeline();
  renderYearOverview();
}

function openTaskReasonModal(task) {
  pendingTaskAction = { taskId: task.id, sourceDate: selectedDateKey };
  elements.taskReasonForm.reset();
  elements.moveDateField.classList.add("hidden");
  elements.moveDateInput.required = false;
  elements.moveDateInput.min = getDateKey(new Date());
  elements.moveDateInput.value = getDateKey(addDays(parseDateKey(selectedDateKey), 1));
  document.querySelector("#reasonTaskName").textContent = task.title;
  elements.taskReasonModal.showModal();
}

function handleDeleteReasonChange(event) {
  if (event.target.name !== "deleteReason") return;
  const isMove = event.target.value === "เลื่อนวัน";
  elements.moveDateField.classList.toggle("hidden", !isMove);
  elements.moveDateInput.required = isMove;
}

function handleTaskReasonSubmit(event) {
  event.preventDefault();
  const reason = new FormData(elements.taskReasonForm).get("deleteReason");
  if (!reason || !pendingTaskAction) return;

  const sourceDay = ensureDay(pendingTaskAction.sourceDate);
  const taskIndex = sourceDay.tasks.findIndex((task) => task.id === pendingTaskAction.taskId);
  if (taskIndex < 0) return;
  const [task] = sourceDay.tasks.splice(taskIndex, 1);

  const log = {
    id: createId(),
    type: reason === "เลื่อนวัน" ? "rescheduled" : "deleted",
    reason,
    taskTitle: task.title,
    category: task.category,
    sourceDate: pendingTaskAction.sourceDate,
    createdAt: new Date().toISOString(),
  };

  if (reason === "เลื่อนวัน") {
    const targetDate = elements.moveDateInput.value;
    if (!targetDate) {
      sourceDay.tasks.splice(taskIndex, 0, task);
      return;
    }
    task.completed = false;
    task.completedAt = null;
    task.rescheduledFrom = pendingTaskAction.sourceDate;
    ensureDay(targetDate).tasks.push(task);
    log.targetDate = targetDate;
  }

  state.reasonLogs.push(log);
  pendingTaskAction = null;
  saveState();
  elements.taskReasonModal.close();
  refreshAllViews();
  showImportMessage(reason === "เลื่อนวัน" ? "เลื่อนภารกิจไปวันที่ใหม่แล้ว" : "นำรายการออกและบันทึกเหตุผลแล้ว", "success");
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function handleReflectionInput(event) {
  const input = event.target;
  if (!input.matches("input[data-field]")) return;

  const field = input.dataset.field;
  const index = Number(input.dataset.index);
  ensureDay(selectedDateKey)[field][index] = input.value.trim();
  saveState();

  clearTimeout(saveTimers[field]);
  const note = field === "goodThings" ? elements.goodSaved : elements.improveSaved;
  note.classList.remove("show");
  saveTimers[field] = setTimeout(() => {
    note.classList.add("show");
    setTimeout(() => note.classList.remove("show"), 1800);
    renderDashboard();
    renderInsights();
    renderTimeline();
    renderYearOverview();
  }, 450);
}

function handleMoodSelect(event) {
  const button = event.target.closest("button[data-mood]");
  if (!button) return;
  const day = ensureDay(selectedDateKey);
  day.mood = day.mood === button.dataset.mood ? "" : button.dataset.mood;
  saveState();
  renderMood();
  renderDashboard();
  renderTimeline();
  renderYearOverview();
}

function prepareOverdueCheck() {
  const yesterdayKey = getDateKey(addDays(parseDateKey(todayKey), -1));
  const yesterday = state.days[yesterdayKey];
  if (!yesterday) return;

  overdueQueue = (yesterday.tasks || [])
    .filter((task) => !task.completed && !task.missedReviewedAt)
    .map((task) => ({ task, dateKey: yesterdayKey }));
  overdueIndex = 0;

  if (overdueQueue.length) setTimeout(showCurrentOverdueTask, 500);
}

function showCurrentOverdueTask() {
  const current = overdueQueue[overdueIndex];
  if (!current) {
    if (elements.overdueModal.open) elements.overdueModal.close();
    refreshAllViews();
    return;
  }
  elements.overdueForm.reset();
  document.querySelector("#overdueCounter").textContent = `${overdueIndex + 1} จาก ${overdueQueue.length}`;
  document.querySelector("#overdueTaskName").textContent = current.task.title;
  if (!elements.overdueModal.open) elements.overdueModal.showModal();
}

function handleOverdueReasonSubmit(event) {
  event.preventDefault();
  const reason = new FormData(elements.overdueForm).get("overdueReason");
  const current = overdueQueue[overdueIndex];
  if (!reason || !current) return;

  current.task.missedReason = reason;
  current.task.missedReviewedAt = new Date().toISOString();
  state.reasonLogs.push({
    id: createId(),
    type: "missed",
    reason,
    taskTitle: current.task.title,
    category: current.task.category,
    sourceDate: current.dateKey,
    createdAt: new Date().toISOString(),
  });
  saveState();
  overdueIndex += 1;
  showCurrentOverdueTask();
}

function celebrate(origin, leveledUp = false) {
  const toastTitle = elements.toast.querySelector("strong");
  const toastText = elements.toast.querySelector("p");
  toastTitle.textContent = leveledUp ? "Level Up!" : "เยี่ยมมาก!";
  toastText.textContent = leveledUp
    ? "พลังการเติบโตของคุณเพิ่มขึ้นอีกหนึ่งระดับแล้ว"
    : "คุณขยับไปข้างหน้าอีกหนึ่งก้าวแล้ว";
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2600);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rect = origin.getBoundingClientRect();
  const colors = ["#ee9b62", "#7faab0", "#f3c869", "#7eab8e", "#e98870"];

  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = `${rect.left + rect.width / 2}px`;
    piece.style.top = `${rect.top + rect.height / 2}px`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--x", `${(Math.random() - 0.5) * 180}px`);
    piece.style.setProperty("--y", `${Math.random() * 150 - 60}px`);
    piece.style.animationDelay = `${Math.random() * 100}ms`;
    elements.confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 1100);
  }
}

function getDaysInRange() {
  const range = elements.insightRange?.value || "30";
  const entries = Object.entries(state.days);
  if (range === "all") return entries;

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - Number(range) + 1);
  return entries.filter(([key]) => parseDateKey(key) >= cutoff);
}

function renderInsights() {
  const days = getDaysInRange();
  const improvementCounts = countTexts(days.flatMap(([, day]) => day.improvements || []));
  const completedTasks = days.flatMap(([, day]) => (day.tasks || []).filter((task) => task.completed));
  const categoryCounts = countValues(completedTasks.map((task) => task.category));
  const topImprovement = improvementCounts[0];
  const topCategory = categoryCounts[0];

  document.querySelector("#topImprovement").textContent = topImprovement?.[0] || "ยังไม่มีข้อมูล";
  document.querySelector("#topImprovementCount").textContent = topImprovement
    ? `คุณบันทึกเรื่องนี้ ${topImprovement[1]} ครั้งในช่วงที่เลือก`
    : "ลองบันทึกสิ่งที่อยากปรับในแต่ละวัน";
  document.querySelector("#topCategory").textContent = topCategory?.[0] || "ยังไม่มีข้อมูล";
  document.querySelector("#topCategoryCount").textContent = topCategory
    ? `ทำสำเร็จแล้ว ${topCategory[1]} ก้าว`
    : "ความสำเร็จเล็ก ๆ จะค่อย ๆ ปรากฏที่นี่";
  document.querySelector("#totalWins").textContent = `${completedTasks.length} ก้าว`;

  renderWeeklyChart();
  renderPatterns(improvementCounts, categoryCounts, days);
}

function countTexts(items) {
  const groups = new Map();
  items.filter(Boolean).forEach((rawText) => {
    const text = rawText.trim();
    if (!text) return;
    const normalized = text.toLocaleLowerCase("th");
    const existing = groups.get(normalized) || { label: text, count: 0 };
    existing.count += 1;
    groups.set(normalized, existing);
  });
  return [...groups.values()]
    .map(({ label, count }) => [label, count])
    .sort((a, b) => b[1] - a[1]);
}

function countValues(items) {
  const counts = {};
  items.filter(Boolean).forEach((item) => {
    counts[item] = (counts[item] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function renderWeeklyChart() {
  const values = [];
  const formatter = new Intl.DateTimeFormat("th-TH", { weekday: "short" });

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const day = state.days[getDateKey(date)];
    values.push({
      label: formatter.format(date).replace(".", ""),
      count: day?.tasks?.filter((task) => task.completed).length || 0,
    });
  }

  const max = Math.max(...values.map((item) => item.count), 1);
  elements.weeklyChart.innerHTML = values.map((item) => `
    <div class="bar-column">
      <div class="bar" style="height: ${Math.max((item.count / max) * 100, 3)}%">
        <span class="bar-value">${item.count}</span>
      </div>
      <span class="bar-label">${item.label}</span>
    </div>
  `).join("");
}

function renderPatterns(improvements, categories, days) {
  const patterns = [];
  const dayKeys = new Set(days.map(([key]) => key));
  const relevantLogs = state.reasonLogs
    .filter((log) => !log.sourceDate || dayKeys.has(log.sourceDate));
  const missedReasonCounts = countValues(
    relevantLogs
      .filter((log) => log.type === "missed")
      .map((log) => log.reason)
  );
  const workflowReasonCounts = countValues(
    relevantLogs
      .filter((log) => log.type !== "missed")
      .map((log) => log.type === "rescheduled" ? "เลื่อนงานไปวันอื่น" : "ลบรายการเพราะกดผิด")
  );

  if (missedReasonCounts[0]) {
    patterns.push({
      label: `งานไม่สำเร็จเพราะ${missedReasonCounts[0][0]}`,
      count: missedReasonCounts[0][1],
      detail: "ใช้ข้อมูลนี้ปรับจำนวนงานและช่วงเวลาให้เหมาะกับพลังของคุณได้",
    });
  }

  workflowReasonCounts.slice(0, 1).forEach(([label, count]) => {
    patterns.push({
      label,
      count,
      detail: "รูปแบบนี้ถูกบันทึกไว้เพื่อช่วยให้วางแผนครั้งต่อไปได้ง่ายขึ้น",
    });
  });

  improvements.slice(0, patterns.length ? 1 : 2).forEach(([label, count]) => {
    patterns.push({
      label,
      count,
      detail: count > 1 ? "ปรากฏซ้ำ ลองสังเกตว่ามักเกิดขึ้นช่วงไหน" : "เพิ่งปรากฏครั้งแรก ลองสังเกตต่ออย่างอ่อนโยน",
    });
  });

  const incompleteByCategory = countValues(
    days.flatMap(([, day]) => (day.tasks || []).filter((task) => !task.completed).map((task) => task.category))
  );
  if (incompleteByCategory[0]) {
    patterns.push({
      label: `งานหมวด${incompleteByCategory[0][0]}ที่ยังค้าง`,
      count: incompleteByCategory[0][1],
      detail: "อาจลองย่อยงานให้เล็กลง หรือเลือกเวลาที่เหมาะกับคุณขึ้น",
    });
  }

  if (categories[0]) {
    patterns.push({
      label: `จุดแข็งด้าน${categories[0][0]}`,
      count: categories[0][1],
      detail: "นี่คือพื้นที่ที่คุณลงมือทำได้สม่ำเสมอที่สุด",
    });
  }

  if (!patterns.length) {
    elements.patternList.innerHTML = `
      <div class="pattern-empty">
        เมื่อมีข้อมูลเพิ่มขึ้น ระบบจะช่วยสะท้อนรูปแบบที่น่าสนใจให้คุณเห็นตรงนี้
      </div>
    `;
    return;
  }

  elements.patternList.innerHTML = patterns.slice(0, 4).map((pattern) => `
    <article class="pattern-item">
      <span class="pattern-number">${pattern.count}</span>
      <div>
        <strong></strong>
        <small></small>
      </div>
    </article>
  `).join("");

  elements.patternList.querySelectorAll(".pattern-item").forEach((item, index) => {
    item.querySelector("strong").textContent = patterns[index].label;
    item.querySelector("small").textContent = patterns[index].detail;
  });
}

function renderYearOverview() {
  const currentYear = new Date().getFullYear();
  const availableYears = new Set([currentYear]);
  Object.keys(state.days).forEach((key) => availableYears.add(parseDateKey(key).getFullYear()));

  const previousValue = Number(elements.yearSelect.value) || currentYear;
  const years = [...availableYears].sort((a, b) => b - a);
  elements.yearSelect.innerHTML = years
    .map((year) => `<option value="${year}">${year + 543}</option>`)
    .join("");
  elements.yearSelect.value = String(years.includes(previousValue) ? previousValue : currentYear);

  const selectedYear = Number(elements.yearSelect.value);
  const yearEntries = Object.entries(state.days)
    .filter(([key]) => parseDateKey(key).getFullYear() === selectedYear);
  const allTasks = yearEntries.flatMap(([, day]) => day.tasks || []);
  const completedTasks = allTasks.filter((task) => task.completed);
  const activeDays = yearEntries.filter(([, day]) => hasAnyDayActivity(day)).length;
  const completionRate = allTasks.length ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;
  const monthTotals = Array.from({ length: 12 }, () => 0);

  yearEntries.forEach(([key, day]) => {
    monthTotals[parseDateKey(key).getMonth()] += (day.tasks || []).filter((task) => task.completed).length;
  });
  const bestTotal = Math.max(...monthTotals);
  const bestMonthIndex = bestTotal ? monthTotals.indexOf(bestTotal) : -1;
  const bestMonth = bestMonthIndex >= 0
    ? new Intl.DateTimeFormat("th-TH", { month: "long" }).format(new Date(selectedYear, bestMonthIndex, 1))
    : "-";

  document.querySelector("#yearCompletedTasks").textContent = completedTasks.length;
  document.querySelector("#yearActiveDays").textContent = activeDays;
  document.querySelector("#yearCompletionRate").textContent = `${completionRate}%`;
  document.querySelector("#yearBestMonth").textContent = bestMonth;

  elements.yearMonths.innerHTML = Array.from({ length: 12 }, (_, month) => {
    return createMonthMap(selectedYear, month);
  }).join("");

  const insightTitle = document.querySelector("#yearInsightTitle");
  const insightText = document.querySelector("#yearInsightText");
  if (!allTasks.length) {
    insightTitle.textContent = "ปีนี้ยังมีพื้นที่ให้เรื่องราวใหม่ ๆ";
    insightText.textContent = "ลองเลือกวันที่จากแผนที่ แล้ววางก้าวเล็ก ๆ แรกของคุณไว้ได้เลย";
  } else if (completionRate >= 75) {
    insightTitle.textContent = "คุณรักษาคำสัญญาเล็ก ๆ กับตัวเองได้ดีมาก";
    insightText.textContent = `คุณทำสำเร็จแล้ว ${completedTasks.length} ก้าว และทุกก้าวกำลังสะสมเป็นความเปลี่ยนแปลง`;
  } else {
    insightTitle.textContent = "ความสม่ำเสมอกำลังค่อย ๆ เป็นรูปเป็นร่าง";
    insightText.textContent = `คุณมีวันที่ได้ลงมือทำ ${activeDays} วัน ไม่จำเป็นต้องเต็มทุกช่องเพื่อเรียกว่านี่คือการเติบโต`;
  }
}

function createMonthMap(year, month) {
  const monthName = new Intl.DateTimeFormat("th-TH", { month: "long" }).format(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const blanks = Array.from({ length: firstDayOffset }, () => '<i class="year-day blank"></i>').join("");
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const key = getDateKey(date);
    const day = state.days[key];
    const completed = (day?.tasks || []).filter((task) => task.completed).length;
    const planned = (day?.tasks || []).length;
    const level = completed === 0 ? 0 : Math.min(4, completed);
    const classes = [
      "year-day",
      key === todayKey ? "today" : "",
      planned > 0 && completed === 0 ? "pending" : "",
      planned > completed && completed > 0 ? "partial" : "",
    ].filter(Boolean).join(" ");
    const status = planned > 0 && completed === 0
      ? "ยังไม่ได้ทำ"
      : planned > completed ? "สำเร็จบางส่วน" : completed > 0 ? "สำเร็จทั้งหมด" : "ยังไม่มีรายการ";
    const label = `${index + 1} ${monthName}: ${status}${planned ? ` (${completed}/${planned} งาน)` : ""}`;
    return `<button class="${classes}" data-date="${key}" data-level="${level}" title="${label}" aria-label="${label}">${index + 1}</button>`;
  }).join("");

  return `
    <article class="month-map">
      <h3>${monthName}</h3>
      <div class="month-weekdays"><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span><span>อา</span></div>
      <div class="month-days">${blanks}${days}</div>
    </article>
  `;
}

function hasAnyDayActivity(day) {
  return (day.tasks || []).length > 0
    || (day.goodThings || []).some(Boolean)
    || (day.improvements || []).some(Boolean)
    || Boolean(day.mood);
}

function renderTimeline() {
  const entries = Object.entries(state.days)
    .filter(([, day]) => hasDayContent(day))
    .sort(([a], [b]) => b.localeCompare(a));

  elements.timelineList.innerHTML = "";
  elements.timelineEmpty.classList.toggle("hidden", entries.length > 0);

  entries.forEach(([key, day]) => {
    const date = parseDateKey(key);
    const completed = (day.tasks || []).filter((task) => task.completed);
    const goodThings = (day.goodThings || []).filter(Boolean);
    const improvements = (day.improvements || []).filter(Boolean);
    const entry = document.createElement("article");
    entry.className = "timeline-entry";
    entry.innerHTML = `
      <div class="timeline-date">
        <strong>${date.getDate()}</strong>
        <span>${new Intl.DateTimeFormat("th-TH", { month: "short" }).format(date)}</span>
      </div>
      <i class="timeline-dot"></i>
      <div class="timeline-card">
        <div class="timeline-card-head">
          <strong>${key === todayKey ? "วันนี้" : new Intl.DateTimeFormat("th-TH", { weekday: "long" }).format(date)}</strong>
          ${day.mood ? `<span class="timeline-mood">${moodEmoji[day.mood] || ""} ${day.mood}</span>` : ""}
        </div>
        ${createTimelineSection("ก้าวที่ทำสำเร็จ", completed.map((task) => task.title), "")}
        ${createTimelineSection("เรื่องดี ๆ", goodThings, "good")}
        ${createTimelineSection("สิ่งที่อยากลองปรับ", improvements, "improve")}
      </div>
    `;
    elements.timelineList.appendChild(entry);
  });
}

function hasDayContent(day) {
  return (day.tasks || []).some((task) => task.completed)
    || (day.goodThings || []).some(Boolean)
    || (day.improvements || []).some(Boolean)
    || Boolean(day.mood);
}

function createTimelineSection(title, items, className) {
  if (!items.length) return "";
  return `
    <div class="timeline-section">
      <h4>${escapeHtml(title)}</h4>
      <div class="timeline-tags">
        ${items.map((item) => `<span class="timeline-tag ${className}">${escapeHtml(item)}</span>`).join("")}
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function refreshAllViews() {
  state.points = countCompletedTasks(state.days);
  saveState();
  renderSelectedDate();
  renderDashboard();
  renderTasks();
  renderReflectionInputs();
  renderMood();
  renderInsights();
  renderTimeline();
  renderYearOverview();
  renderProfile();
}

async function importData(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    const normalized = normalizeImportedState(imported);
    if (!normalized.profile.nickname && hasProfile()) {
      normalized.profile = structuredClone(state.profile);
    }
    state = normalized;
    selectedDateKey = todayKey;
    ensureDay(todayKey);
    markActiveDay();
    refreshAllViews();
    showImportMessage("นำเข้าข้อมูลสำเร็จแล้ว", "success");
    if (hasProfile()) {
      if (elements.onboardingModal.open) elements.onboardingModal.close();
      prepareOverdueCheck();
    } else {
      if (!elements.onboardingModal.open) elements.onboardingModal.showModal();
      showNicknameStep();
    }
  } catch (error) {
    showImportMessage(error.message || "ไฟล์ JSON ไม่ถูกต้อง", "error");
  }
}

function normalizeImportedState(imported) {
  if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
    throw new Error("ไฟล์นี้ไม่ใช่ข้อมูลสำรองของ Daily Growth");
  }
  if (!imported.days || typeof imported.days !== "object" || Array.isArray(imported.days)) {
    throw new Error("ไม่พบข้อมูลรายวันในไฟล์ JSON");
  }

  const days = {};
  Object.entries(imported.days).forEach(([key, rawDay]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !rawDay || typeof rawDay !== "object") return;
    const tasks = Array.isArray(rawDay.tasks) ? rawDay.tasks : [];
    days[key] = {
      tasks: tasks
        .filter((task) => task && typeof task.title === "string")
        .map((task) => ({
          ...task,
          id: typeof task.id === "string" ? task.id : createId(),
          title: task.title.slice(0, 100),
          category: typeof task.category === "string" ? task.category : "อื่น ๆ",
          completed: Boolean(task.completed),
        })),
      goodThings: normalizeTextList(rawDay.goodThings),
      improvements: normalizeTextList(rawDay.improvements),
      mood: typeof rawDay.mood === "string" ? rawDay.mood : "",
      visited: Boolean(rawDay.visited),
    };
  });

  const reasonLogs = Array.isArray(imported.reasonLogs)
    ? imported.reasonLogs.filter((log) => log && typeof log.reason === "string")
    : [];
  return {
    ...structuredClone(defaultState),
    days,
    reasonLogs,
    profile: normalizeProfile(imported.profile),
    lastActiveDate: typeof imported.lastActiveDate === "string" ? imported.lastActiveDate : null,
    points: countCompletedTasks(days),
  };
}

function normalizeTextList(value) {
  const list = Array.isArray(value) ? value : [];
  return Array.from({ length: 3 }, (_, index) => {
    return typeof list[index] === "string" ? list[index].slice(0, 120) : "";
  });
}

function showImportMessage(message, type) {
  elements.importMessage.textContent = message;
  elements.importMessage.className = `import-message show ${type}`;
  clearTimeout(showImportMessage.timer);
  showImportMessage.timer = setTimeout(() => {
    elements.importMessage.classList.remove("show");
  }, 2800);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `daily-growth-backup-${todayKey}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
