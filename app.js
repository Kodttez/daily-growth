// Replace these two values with your Supabase project values before deploy.
// Use only the anon public / publishable key here. Never put a service role key in frontend code.
const SUPABASE_URL = "https://dupafcuqsaxwkbwnhker.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7QdttccZ5yJgQwp4CtxWhQ_oIJ3zyOi";
const isSupabaseConfigured = !SUPABASE_URL.includes("YOUR_PROJECT_REF")
  && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_PUBLIC_KEY");
const supabaseClient = isSupabaseConfigured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
const SELF_NOTE_CATEGORY = "__self_note__";

const defaultState = {
  days: {},
  points: 0,
  lastActiveDate: null,
  reasonLogs: [],
  profile: {
    nickname: "",
    createdAt: null,
    nicknameUpdatedAt: null,
  },
};

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

let state = structuredClone(defaultState);
let editingTaskId = null;
let saveTimers = {};
let pendingTaskAction = null;
let overdueQueue = [];
let overdueIndex = 0;
let importFromOnboarding = false;
let currentUser = null;
let saveTimer = null;
let saveInFlight = false;
let pendingSave = false;

const todayKey = getDateKey(new Date());
let selectedDateKey = todayKey;
ensureDay(todayKey);
markActiveDay();

const elements = {
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
  importInput: document.querySelector("#importInput"),
  importMessage: document.querySelector("#importMessage"),
  taskReasonModal: document.querySelector("#taskReasonModal"),
  taskReasonForm: document.querySelector("#taskReasonForm"),
  moveDateField: document.querySelector("#moveDateField"),
  moveDateInput: document.querySelector("#moveDateInput"),
  overdueModal: document.querySelector("#overdueModal"),
  overdueForm: document.querySelector("#overdueForm"),
  overdueOtherNote: document.querySelector("#overdueOtherNote"),
  selfNoteForm: document.querySelector("#selfNoteForm"),
  noteEventInput: document.querySelector("#noteEventInput"),
  noteBodyInput: document.querySelector("#noteBodyInput"),
  selfNotesList: document.querySelector("#selfNotesList"),
  selfNotesEmpty: document.querySelector("#selfNotesEmpty"),
  onboardingModal: document.querySelector("#onboardingModal"),
  onboardingChoice: document.querySelector("#onboardingChoice"),
  nicknameForm: document.querySelector("#nicknameForm"),
  nicknameInput: document.querySelector("#nicknameInput"),
  profileButton: document.querySelector("#profileButton"),
  topbarProfileButton: document.querySelector("#topbarProfileButton"),
  profileModal: document.querySelector("#profileModal"),
  profileForm: document.querySelector("#profileForm"),
  profileNameInput: document.querySelector("#profileNameInput"),
  saveProfileButton: document.querySelector("#saveProfileButton"),
  profileCooldown: document.querySelector("#profileCooldown"),
  authGate: document.querySelector("#authGate"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authMessage: document.querySelector("#authMessage"),
  googleLoginButton: document.querySelector("#googleLoginButton"),
  signUpButton: document.querySelector("#signUpButton"),
  logoutBtn: document.querySelector("#logoutBtn"),
  syncStatus: document.querySelector("#syncStatus"),
  supabaseSetupWarning: document.querySelector("#supabaseSetupWarning"),
};

init();

async function init() {
  renderDate();
  renderSelectedDate();
  renderDashboard();
  renderTasks();
  renderReflectionInputs();
  renderMood();
  renderInsights();
  renderSelfNotes();
  renderTimeline();
  renderYearOverview();
  renderProfile();
  bindEvents();
  await initAuth();
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return structuredClone(defaultState.profile);
  }
  return {
    nickname: typeof profile.nickname === "string" ? profile.nickname.trim().slice(0, 24) : "",
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
  queueCloudSave();
}

async function initAuth() {
  if (!supabaseClient) {
    elements.supabaseSetupWarning.classList.remove("hidden");
    elements.authGate.classList.remove("hidden");
    setSyncStatus("Setup needed", "error");
    return;
  }

  setSyncStatus("Loading", "loading");
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    showAuthMessage(error.message, "error");
    setSyncStatus("Auth error", "error");
  }

  currentUser = data.session?.user || null;
  if (currentUser) {
    await loadUserCloudState();
    showAppForUser();
  } else {
    showAuthGate();
  }

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (currentUser) {
      await loadUserCloudState();
      showAppForUser();
    } else {
      state = structuredClone(defaultState);
      currentUser = null;
      refreshAllViews();
      showAuthGate();
    }
  });
}

function bindAuthEvents() {
  elements.authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await signInWithEmail();
  });
  elements.signUpButton.addEventListener("click", signUpWithEmail);
  elements.googleLoginButton.addEventListener("click", signInWithGoogle);
  elements.logoutBtn.addEventListener("click", async () => {
    await supabaseClient?.auth.signOut();
  });
}

function showAuthGate() {
  elements.authGate.classList.remove("hidden");
  setSyncStatus("Signed out", "offline");
}

function showAppForUser() {
  elements.authGate.classList.add("hidden");
  setSyncStatus("Saved", "saved");
  if (hasProfile()) {
    prepareOverdueCheck();
  } else {
    showOnboardingChoice();
  }
}

async function signInWithEmail() {
  if (!supabaseClient) return;
  showAuthMessage("กำลังเข้าสู่ระบบ...", "loading");
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: elements.authEmail.value.trim(),
    password: elements.authPassword.value,
  });
  if (error) showAuthMessage(error.message, "error");
}

async function signUpWithEmail() {
  if (!supabaseClient) return;
  showAuthMessage("กำลังสมัครสมาชิก...", "loading");
  const { error } = await supabaseClient.auth.signUp({
    email: elements.authEmail.value.trim(),
    password: elements.authPassword.value,
    options: { emailRedirectTo: window.location.href },
  });
  if (error) {
    showAuthMessage(error.message, "error");
  } else {
    showAuthMessage("สมัครสำเร็จแล้ว กรุณาตรวจอีเมลเพื่อยืนยันบัญชี", "success");
  }
}

async function signInWithGoogle() {
  if (!supabaseClient) return;
  showAuthMessage("กำลังเปิด Google Login...", "loading");
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  if (error) showAuthMessage(error.message, "error");
}

function showAuthMessage(message, type = "") {
  elements.authMessage.textContent = message;
  elements.authMessage.className = `auth-message ${type}`;
}

async function loadUserCloudState() {
  if (!currentUser || !supabaseClient) return;
  setSyncStatus("Loading", "loading");

  const [profileResult, daysResult, logsResult] = await Promise.all([
    supabaseClient.from("profiles").select("*").eq("user_id", currentUser.id).maybeSingle(),
    supabaseClient.from("daily_entries").select("*").eq("user_id", currentUser.id),
    supabaseClient.from("reason_logs").select("*").eq("user_id", currentUser.id),
  ]);

  if (profileResult.error || daysResult.error || logsResult.error) {
    const message = profileResult.error?.message || daysResult.error?.message || logsResult.error?.message;
    showImportMessage(`โหลดข้อมูลไม่สำเร็จ: ${message}`, "error");
    setSyncStatus("Load failed", "error");
    return;
  }

  const days = {};
  (daysResult.data || []).forEach((entry) => {
    days[entry.entry_date] = {
      tasks: entry.tasks || [],
      goodThings: normalizeTextList(entry.good_things),
      improvements: normalizeTextList(entry.improvements),
      mood: entry.mood || "",
      visited: Boolean(entry.visited),
    };
  });

  state = {
    ...structuredClone(defaultState),
    days,
    reasonLogs: (logsResult.data || []).map((log) => ({
      id: log.id,
      type: log.type,
      reason: log.reason,
      taskTitle: log.task_title,
      category: log.category,
      sourceDate: log.source_date,
      targetDate: log.target_date,
      createdAt: log.created_at,
    })),
    profile: normalizeProfile(profileResult.data ? {
      nickname: profileResult.data.nickname,
      createdAt: profileResult.data.created_at,
      nicknameUpdatedAt: profileResult.data.nickname_updated_at,
    } : null),
  };
  state.points = countCompletedTasks(state.days);
  ensureDay(todayKey);
  markActiveDay();
  refreshAllViews();
  setSyncStatus("Saved", "saved");
}

function queueCloudSave() {
  if (!currentUser || !supabaseClient) return;
  setSyncStatus("Saving", "saving");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveStateToSupabase, 350);
}

async function saveStateToSupabase() {
  if (!currentUser || !supabaseClient) return;
  if (saveInFlight) {
    pendingSave = true;
    return;
  }

  saveInFlight = true;
  pendingSave = false;
  setSyncStatus("Saving", "saving");

  try {
    const profilePayload = {
      user_id: currentUser.id,
      nickname: state.profile.nickname || null,
      nickname_updated_at: state.profile.nicknameUpdatedAt,
      total_exp: countCompletedTasks(state.days),
      current_streak: calculateStreak(),
      updated_at: new Date().toISOString(),
    };
    if (state.profile.createdAt) profilePayload.created_at = state.profile.createdAt;

    const dayRows = Object.entries(state.days).map(([key, day]) => ({
      user_id: currentUser.id,
      entry_date: key,
      tasks: day.tasks || [],
      good_things: normalizeTextList(day.goodThings),
      improvements: normalizeTextList(day.improvements),
      mood: day.mood || "",
      visited: Boolean(day.visited),
      updated_at: new Date().toISOString(),
    }));

    const logRows = state.reasonLogs.map((log) => ({
      id: log.id || createId(),
      user_id: currentUser.id,
      type: log.type,
      reason: log.reason,
      task_title: log.taskTitle,
      category: log.category,
      source_date: log.sourceDate || null,
      target_date: log.targetDate || null,
      created_at: log.createdAt || new Date().toISOString(),
    }));

    const profileSave = supabaseClient.from("profiles").upsert(profilePayload, { onConflict: "user_id" });
    const daysSave = dayRows.length
      ? supabaseClient.from("daily_entries").upsert(dayRows, { onConflict: "user_id,entry_date" })
      : Promise.resolve({ error: null });
    const logsSave = logRows.length
      ? supabaseClient.from("reason_logs").upsert(logRows, { onConflict: "id" })
      : Promise.resolve({ error: null });

    const results = await Promise.all([profileSave, daysSave, logsSave]);
    const error = results.find((result) => result.error)?.error;
    if (error) throw error;
    setSyncStatus("Saved", "saved");
  } catch (error) {
    console.error(error);
    setSyncStatus("Save failed", "error");
    showImportMessage(`บันทึกไม่สำเร็จ: ${error.message}`, "error");
  } finally {
    saveInFlight = false;
    if (pendingSave) saveStateToSupabase();
  }
}

function setSyncStatus(text, status) {
  if (!elements.syncStatus) return;
  elements.syncStatus.textContent = text;
  elements.syncStatus.className = `sync-status ${status}`;
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
  const completedDates = new Set(Object.entries(state.days)
    .filter(([, day]) => hasCompletedTask(day))
    .map(([key]) => key));

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);

  while (completedDates.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function hasCompletedTask(day) {
  return (day?.tasks || []).some((task) => task.completed);
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
  bindAuthEvents();
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
  document.querySelector("#importBtn").addEventListener("click", () => {
    importFromOnboarding = false;
    elements.importInput.click();
  });
  elements.importInput.addEventListener("change", importData);
  document.querySelector("#onboardingImportBtn").addEventListener("click", () => {
    importFromOnboarding = true;
    elements.importInput.click();
  });
  document.querySelector("#onboardingNewBtn").addEventListener("click", showNicknameStep);
  elements.nicknameForm.addEventListener("submit", saveInitialNickname);
  elements.onboardingModal.addEventListener("cancel", (event) => event.preventDefault());
  elements.profileButton.addEventListener("click", openProfileModal);
  elements.topbarProfileButton.addEventListener("click", openProfileModal);
  elements.profileForm.addEventListener("submit", saveProfileNickname);
  elements.taskReasonForm.addEventListener("change", handleDeleteReasonChange);
  elements.taskReasonForm.addEventListener("submit", handleTaskReasonSubmit);
  elements.overdueForm.addEventListener("submit", handleOverdueReasonSubmit);
  elements.overdueForm.addEventListener("change", handleOverdueReasonChange);
  elements.selfNoteForm.addEventListener("submit", handleSelfNoteSubmit);
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-dialog]");
    if (!closeButton) return;
    closeButton.closest("dialog")?.close();
  });
  document.querySelector("#exportBtn").addEventListener("click", exportData);
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

function saveInitialNickname(event) {
  event.preventDefault();
  const nickname = elements.nicknameInput.value.trim();
  if (!nickname) return;
  const now = new Date().toISOString();
  state.profile = {
    nickname: nickname.slice(0, 24),
    createdAt: now,
    nicknameUpdatedAt: null,
  };
  saveState();
  renderProfile();
  elements.onboardingModal.close();
  showImportMessage(`ยินดีต้อนรับ ${state.profile.nickname}`, "success");
  prepareOverdueCheck();
}

function getProfileLevel() {
  return Math.floor(countCompletedTasks(state.days) / 10) + 1;
}

function getInitials(nickname) {
  return [...(nickname || "DG").trim()].slice(0, 2).join("").toUpperCase();
}

function renderProfile(level = getProfileLevel()) {
  if (!hasProfile()) return;
  const nickname = state.profile.nickname;
  document.querySelector("#profileNickname").textContent = nickname;
  document.querySelector("#profileLevel").textContent = level;
  document.querySelector("#profileAvatar").textContent = getInitials(nickname);
  document.querySelector("#profileModalName").textContent = nickname;
  document.querySelector("#profileModalLevel").textContent = level;
  document.querySelector("#profileModalAvatar").textContent = getInitials(nickname);
}

function openProfileModal() {
  if (!hasProfile()) {
    showOnboardingChoice();
    return;
  }
  const remaining = getNicknameCooldown();
  elements.profileNameInput.value = state.profile.nickname;
  elements.profileNameInput.disabled = remaining > 0;
  elements.saveProfileButton.disabled = remaining > 0;
  elements.profileCooldown.textContent = remaining > 0
    ? `แก้ไขชื่อได้อีกครั้งใน ${formatCooldown(remaining)}`
    : "คุณสามารถแก้ไขชื่อได้ 1 ครั้งต่อ 2 วัน";
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
  if (getNicknameCooldown() > 0) return;
  const nickname = elements.profileNameInput.value.trim();
  if (!nickname) return;
  state.profile.nickname = nickname.slice(0, 24);
  state.profile.nicknameUpdatedAt = new Date().toISOString();
  saveState();
  renderProfile();
  elements.profileModal.close();
  showImportMessage("บันทึกชื่อเล่นใหม่แล้ว", "success");
}

function switchView(viewName) {
  const titles = {
    today: "วันนี้ของคุณ",
    insights: "มองเห็นตัวเอง",
    year: "ภาพรวมหนึ่งปี",
    notes: "บันทึกตัวเอง",
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
  if (viewName === "notes") renderSelfNotes();
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
  elements.overdueOtherNote.classList.add("hidden");
  elements.overdueOtherNote.querySelector("textarea").required = false;
  document.querySelector("#overdueCounter").textContent = `${overdueIndex + 1} จาก ${overdueQueue.length}`;
  document.querySelector("#overdueTaskName").textContent = current.task.title;
  if (!elements.overdueModal.open) elements.overdueModal.showModal();
}

function handleOverdueReasonChange(event) {
  if (event.target.name !== "overdueReason") return;
  const isOther = event.target.value === "อื่น ๆ";
  const textarea = elements.overdueOtherNote.querySelector("textarea");
  elements.overdueOtherNote.classList.toggle("hidden", !isOther);
  textarea.required = isOther;
  if (!isOther) textarea.value = "";
}

function handleOverdueReasonSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.overdueForm);
  const selectedReason = formData.get("overdueReason");
  const detail = String(formData.get("overdueReasonDetail") || "").trim();
  const reason = selectedReason === "อื่น ๆ" && detail ? `อื่น ๆ: ${detail}` : selectedReason;
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

function handleSelfNoteSubmit(event) {
  event.preventDefault();
  const eventText = elements.noteEventInput.value.trim();
  const noteText = elements.noteBodyInput.value.trim();
  if (!eventText || !noteText) return;

  state.reasonLogs.push({
    id: createId(),
    type: "missed",
    reason: noteText.slice(0, 1000),
    taskTitle: eventText.slice(0, 120),
    category: SELF_NOTE_CATEGORY,
    sourceDate: selectedDateKey,
    createdAt: new Date().toISOString(),
  });

  elements.selfNoteForm.reset();
  saveState();
  renderSelfNotes();
  renderTimeline();
  showImportMessage("บันทึกข้อความถึงตัวเองแล้ว", "success");
}

function getSelfNotes() {
  return state.reasonLogs
    .filter((log) => log.category === SELF_NOTE_CATEGORY)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function renderSelfNotes() {
  if (!elements.selfNotesList) return;
  const notes = getSelfNotes();
  elements.selfNotesList.innerHTML = "";
  elements.selfNotesEmpty.classList.toggle("hidden", notes.length > 0);

  notes.forEach((note) => {
    const date = note.createdAt ? new Date(note.createdAt) : parseDateKey(note.sourceDate || todayKey);
    const card = document.createElement("article");
    card.className = "self-note-card";
    card.innerHTML = `
      <div class="self-note-meta">
        <span>${new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date)}</span>
        <small>${note.sourceDate ? escapeHtml(note.sourceDate) : ""}</small>
      </div>
      <h3>${escapeHtml(note.taskTitle || "บันทึกถึงตัวเอง")}</h3>
      <p>${escapeHtml(note.reason || "")}</p>
    `;
    elements.selfNotesList.appendChild(card);
  });
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
    .filter((log) => log.category !== SELF_NOTE_CATEGORY)
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
    const selfNotes = getSelfNotesForDate(key);
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
        ${createTimelineSection("บันทึกตัวเอง", selfNotes.map((note) => note.taskTitle || "บันทึกถึงตัวเอง"), "note")}
      </div>
    `;
    elements.timelineList.appendChild(entry);
  });
}

function hasDayContent(day) {
  const dateKey = Object.entries(state.days).find(([, value]) => value === day)?.[0];
  return (day.tasks || []).some((task) => task.completed)
    || (day.goodThings || []).some(Boolean)
    || (day.improvements || []).some(Boolean)
    || Boolean(day.mood)
    || (dateKey ? getSelfNotesForDate(dateKey).length > 0 : false);
}

function getSelfNotesForDate(dateKey) {
  return state.reasonLogs.filter((log) => log.category === SELF_NOTE_CATEGORY && log.sourceDate === dateKey);
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
  renderSelfNotes();
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
    if (!normalized.profile.nickname && !importFromOnboarding && hasProfile()) {
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
    importFromOnboarding = false;
  } catch (error) {
    importFromOnboarding = false;
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
