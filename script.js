const cheeringMessages = [
  "오늘의 작은 한 걸음도 분명히 당신을 앞으로 데려가고 있어요.",
  "천천히 해도 괜찮아요. 꾸준함은 생각보다 아주 강해요.",
  "오늘 해야 할 일을 하나씩 해내는 당신은 이미 충분히 멋져요.",
  "조금 부족한 하루여도 괜찮아요. 다시 시작할 힘은 늘 남아 있어요.",
  "당신이 피워낼 꽃의 계절은 반드시 가장 아름답게 피어날 거예요.",
  "완벽하지 않아도 괜찮아요. 시작한 것만으로도 충분히 의미 있어요.",
  "작은 체크 하나가 오늘의 리듬을 만들어줄 거예요.",
  "급하지 않아도 돼요. 나만의 속도로 예쁘게 가면 돼요.",
  "오늘도 당신의 하루가 조금 더 가벼워지길 바라요.",
  "할 수 있는 만큼만 해도 괜찮아요. 그만큼도 정말 소중해요."
];

const TODO_STORAGE_KEY = "esPlannerTodos";
const DIARY_STORAGE_KEY = "esSecretDiary";

const cover = document.getElementById("cover");
const app = document.getElementById("app");
const calendar = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

const calendarView = document.getElementById("calendarView");
const detailView = document.getElementById("detailView");
const backBtn = document.getElementById("backBtn");
const selectedDateEl = document.getElementById("selectedDate");
const todoInput = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");
const dailyMessage = document.getElementById("dailyMessage");

const secretLogo = document.getElementById("secretLogo");
const fakeError = document.getElementById("fakeError");
const secretWorld = document.getElementById("secretWorld");
const secretBack = document.getElementById("secretBack");
const lightCord = document.getElementById("lightCord");
const diaryDate = document.getElementById("diaryDate");
const diaryText = document.getElementById("diaryText");
const saveStatus = document.getElementById("saveStatus");
const secretErrorCode = document.getElementById("secretErrorCode");

const diaryArchiveWindow = document.getElementById("diaryArchiveWindow");
const diaryArchive = document.getElementById("diaryArchive");
const archiveClose = document.getElementById("archiveClose");
const archiveList = document.getElementById("archiveList");

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();

let selectedKey = null;
let draggedIndex = null;
let currentDiaryKey = null;
let saveTimer = null;

let touchDragging = false;
let dragOriginalItem = null;
let dragGhost = null;
let dragPlaceholder = null;
let dragStartIndex = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragPointerId = null;
let dragMoved = false;
let dragMoveFrame = null;
let latestPointerX = 0;
let latestPointerY = 0;

const monthNames = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

function startApp() {
  setTimeout(() => {
    if (cover) cover.classList.add("hide");
    if (app) app.classList.add("show");
  }, 1650);

  setDailyMessage();
  renderCalendar();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}

function setDailyMessage() {
  if (!dailyMessage) return;

  const today = new Date();
  const seed = today.getFullYear() + today.getMonth() * 31 + today.getDate();
  const message = cheeringMessages[seed % cheeringMessages.length];

  dailyMessage.textContent = `🌷 오늘의 응원: ${message}`;
}

function getStorage() {
  return JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || "{}");
}

function setStorage(data) {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(data));
}

function makeDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey() {
  const now = new Date();
  return makeDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function renderCalendar() {
  if (!calendar || !monthTitle) return;

  calendar.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todos = getStorage();

  monthTitle.textContent = `${currentYear}년 ${monthNames[currentMonth]}`;

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dayEl = document.createElement("button");
    dayEl.className = "day";
    dayEl.type = "button";

    const key = makeDateKey(currentYear, currentMonth, day);
    const todoCount = todos[key]?.length || 0;
    const doneCount = todos[key]?.filter(item => item.done).length || 0;

    const today = new Date();
    const isToday =
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day;

    if (isToday) dayEl.classList.add("today");

    dayEl.innerHTML = `
      <div class="day-number">${day}</div>
      ${
        todoCount > 0
          ? `<div class="todo-count">${doneCount}/${todoCount} 완료</div><span class="dot"></span>`
          : ""
      }
    `;

    dayEl.addEventListener("click", () => openDetail(key, day));
    calendar.appendChild(dayEl);
  }
}

function openDetail(key, day) {
  selectedKey = key;

  if (selectedDateEl) {
    selectedDateEl.textContent = `${currentYear}년 ${monthNames[currentMonth]} ${day}일`;
  }

  if (calendarView) calendarView.classList.add("hidden");
  if (detailView) detailView.classList.add("active");

  renderTodos();

  setTimeout(() => {
    if (todoInput) todoInput.focus();
  }, 300);
}

function closeDetail() {
  if (detailView) detailView.classList.remove("active");
  if (calendarView) calendarView.classList.remove("hidden");

  renderCalendar();
}

function renderTodos() {
  if (!todoList) return;

  const todos = getStorage();
  const items = todos[selectedKey] || [];

  todoList.innerHTML = "";

  if (items.length === 0) {
    todoList.innerHTML = `
      <div class="empty-message">
        아직 체크리스트가 없어요.<br />
        플러스 버튼으로 하나씩 추가해보세요.
      </div>
    `;
    return;
  }

  items.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "todo-item";
    itemEl.draggable = true;
    itemEl.dataset.index = index;

    itemEl.innerHTML = `
      <button class="drag-handle" aria-label="우선순위 이동">⋮⋮</button>
      <button class="check ${item.done ? "done" : ""}" aria-label="체크">
        ${item.done ? "✓" : ""}
      </button>
      <div class="todo-text ${item.done ? "done" : ""}">${escapeHTML(item.text)}</div>
      <button class="delete-btn" aria-label="삭제">×</button>
    `;

    const dragHandle = itemEl.querySelector(".drag-handle");
    const checkButton = itemEl.querySelector(".check");
    const deleteButton = itemEl.querySelector(".delete-btn");

    checkButton.addEventListener("click", event => {
      if (touchDragging || dragMoved) return;
      toggleTodo(index, event.currentTarget);
    });

    deleteButton.addEventListener("click", () => {
      if (touchDragging || dragMoved) return;
      deleteTodo(index);
    });

    itemEl.addEventListener("dragstart", handleDragStart);
    itemEl.addEventListener("dragover", handleDragOver);
    itemEl.addEventListener("dragleave", handleDragLeave);
    itemEl.addEventListener("drop", handleDrop);
    itemEl.addEventListener("dragend", handleDragEnd);

    dragHandle.addEventListener("pointerdown", event => {
      startTouchReorder(event, itemEl);
    });

    todoList.appendChild(itemEl);
  });
}

function addTodo() {
  if (!todoInput || !selectedKey) return;

  const text = todoInput.value.trim();
  if (!text) return;

  const todos = getStorage();

  if (!todos[selectedKey]) {
    todos[selectedKey] = [];
  }

  todos[selectedKey].push({
    text,
    done: false
  });

  setStorage(todos);
  todoInput.value = "";
  renderTodos();
}

function toggleTodo(index, checkButton) {
  const todos = getStorage();
  const item = todos[selectedKey][index];

  item.done = !item.done;
  setStorage(todos);

  if (item.done) {
    createSmallCheckFirework(checkButton);
  }

  renderTodos();
}

function deleteTodo(index) {
  const todos = getStorage();

  if (!todos[selectedKey]) return;

  todos[selectedKey].splice(index, 1);

  if (todos[selectedKey].length === 0) {
    delete todos[selectedKey];
  }

  setStorage(todos);
  renderTodos();
}

function handleDragStart(event) {
  draggedIndex = Number(event.currentTarget.dataset.index);
  event.currentTarget.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
}

function handleDragOver(event) {
  event.preventDefault();

  const target = event.currentTarget;
  const targetIndex = Number(target.dataset.index);

  if (targetIndex !== draggedIndex) {
    target.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleDrop(event) {
  event.preventDefault();

  const targetIndex = Number(event.currentTarget.dataset.index);

  if (draggedIndex === null || draggedIndex === targetIndex) return;

  moveTodo(draggedIndex, targetIndex);
  draggedIndex = null;
  renderTodos();
}

function handleDragEnd() {
  draggedIndex = null;

  document.querySelectorAll(".todo-item").forEach(item => {
    item.classList.remove("dragging", "drag-over");
  });
}

function startTouchReorder(event, item) {
  if (event.pointerType === "mouse") return;

  event.preventDefault();
  event.stopPropagation();

  if (!item || !todoList) return;

  const itemRect = item.getBoundingClientRect();

  touchDragging = true;
  dragMoved = false;
  dragOriginalItem = item;
  dragStartIndex = Number(item.dataset.index);
  dragPointerId = event.pointerId;

  dragOffsetX = event.clientX - itemRect.left;
  dragOffsetY = event.clientY - itemRect.top;

  latestPointerX = event.clientX;
  latestPointerY = event.clientY;

  document.body.classList.add("reordering");

  dragPlaceholder = document.createElement("div");
  dragPlaceholder.className = "drag-placeholder";
  dragPlaceholder.style.setProperty("--placeholder-height", `${itemRect.height}px`);

  item.parentNode.insertBefore(dragPlaceholder, item.nextSibling);

  dragGhost = item.cloneNode(true);
  dragGhost.classList.add("drag-ghost");
  dragGhost.style.width = `${itemRect.width}px`;
  dragGhost.style.height = `${itemRect.height}px`;
  dragGhost.style.left = `${itemRect.left}px`;
  dragGhost.style.top = `${itemRect.top - 2}px`;

  document.body.appendChild(dragGhost);

  item.classList.add("drag-hidden");

  event.currentTarget.setPointerCapture(event.pointerId);

  document.addEventListener("pointermove", moveTouchReorder, { passive: false });
  document.addEventListener("pointerup", endTouchReorder);
  document.addEventListener("pointercancel", endTouchReorder);
}

function moveTouchReorder(event) {
  if (!touchDragging || !dragGhost || !dragPlaceholder || !todoList) return;

  event.preventDefault();
  event.stopPropagation();

  latestPointerX = event.clientX;
  latestPointerY = event.clientY;

  dragMoved = true;

  if (!dragMoveFrame) {
    dragMoveFrame = requestAnimationFrame(() => {
      const newLeft = latestPointerX - dragOffsetX;
      const newTop = latestPointerY - dragOffsetY - 2;

      dragGhost.style.left = `${newLeft}px`;
      dragGhost.style.top = `${newTop}px`;

      dragMoveFrame = null;
    });
  }

  const items = Array.from(todoList.querySelectorAll(".todo-item:not(.drag-hidden)"));

  let inserted = false;

  for (const item of items) {
    const rect = item.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;

    if (latestPointerY < middle) {
      todoList.insertBefore(dragPlaceholder, item);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    todoList.appendChild(dragPlaceholder);
  }

  const wrap = document.querySelector(".todo-list-wrap");
  const wrapRect = wrap?.getBoundingClientRect();

  if (wrap && wrapRect) {
    if (latestPointerY < wrapRect.top + 42) {
      wrap.scrollTop -= 5;
    }

    if (latestPointerY > wrapRect.bottom - 42) {
      wrap.scrollTop += 5;
    }
  }
}

function endTouchReorder(event) {
  if (!touchDragging || !dragPlaceholder || !dragOriginalItem || !todoList) {
    resetTouchReorder();
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const newIndex = Array.from(todoList.children).indexOf(dragPlaceholder);

  if (
    dragStartIndex !== null &&
    newIndex !== -1 &&
    dragStartIndex !== newIndex
  ) {
    const todos = getStorage();
    const items = todos[selectedKey] || [];

    const movedItem = items.splice(dragStartIndex, 1)[0];

    let adjustedIndex = newIndex;

    if (newIndex > dragStartIndex) {
      adjustedIndex = newIndex - 1;
    }

    items.splice(adjustedIndex, 0, movedItem);
    todos[selectedKey] = items;
    setStorage(todos);
  }

  resetTouchReorder();
  renderTodos();
}

function resetTouchReorder() {
  if (dragMoveFrame) {
    cancelAnimationFrame(dragMoveFrame);
    dragMoveFrame = null;
  }

  if (dragOriginalItem) {
    dragOriginalItem.classList.remove("drag-hidden");
  }

  if (dragGhost) {
    dragGhost.remove();
  }

  if (dragPlaceholder) {
    dragPlaceholder.remove();
  }

  document.removeEventListener("pointermove", moveTouchReorder);
  document.removeEventListener("pointerup", endTouchReorder);
  document.removeEventListener("pointercancel", endTouchReorder);

  document.body.classList.remove("reordering");

  touchDragging = false;
  dragOriginalItem = null;
  dragGhost = null;
  dragPlaceholder = null;
  dragStartIndex = null;
  dragOffsetX = 0;
  dragOffsetY = 0;
  dragPointerId = null;
  latestPointerX = 0;
  latestPointerY = 0;

  setTimeout(() => {
    dragMoved = false;
  }, 100);
}

function moveTodo(fromIndex, toIndex) {
  const todos = getStorage();
  const items = todos[selectedKey];

  if (!items || !items[fromIndex]) return;

  const movedItem = items.splice(fromIndex, 1)[0];
  items.splice(toIndex, 0, movedItem);

  todos[selectedKey] = items;
  setStorage(todos);
}

function createSmallCheckFirework(target) {
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const colors = [
    "#cdbfae",
    "#f3eadc",
    "#fffdf9",
    "#ded3c5",
    "#ffffff"
  ];

  for (let i = 0; i < 18; i++) {
    const spark = document.createElement("span");
    spark.className = "check-spark";

    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 28;
    const color = colors[Math.floor(Math.random() * colors.length)];

    spark.style.left = `${centerX}px`;
    spark.style.top = `${centerY}px`;
    spark.style.background = color;
    spark.style.boxShadow = `0 0 10px ${color}`;
    spark.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    spark.style.setProperty("--size", `${4 + Math.random() * 4}px`);
    spark.style.animationDelay = `${Math.random() * 80}ms`;

    document.body.appendChild(spark);

    setTimeout(() => {
      spark.remove();
    }, 900);
  }
}

if (secretLogo) {
  secretLogo.addEventListener("click", () => {
    if (fakeError) {
      fakeError.classList.add("active");
    }
  });
}

document.querySelectorAll(".error-close").forEach(button => {
  button.addEventListener("click", () => {
    if (fakeError) {
      fakeError.classList.remove("active");
    }

    if (secretWorld) {
      secretWorld.classList.remove("active");
    }
  });
});

if (secretErrorCode) {
  secretErrorCode.addEventListener("click", enterSecretWorld);
}

function enterSecretWorld() {
  if (fakeError) {
    fakeError.classList.remove("active");
  }

  if (secretWorld) {
    secretWorld.classList.add("active");
    secretWorld.scrollTop = 0;
  }

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  openDiary();
}

if (secretBack) {
  secretBack.addEventListener("click", () => {
    if (secretWorld) {
      secretWorld.classList.remove("active");
    }
  });
}

if (lightCord) {
  lightCord.addEventListener("click", () => {
    lightCord.classList.add("pulled");

    setTimeout(() => {
      lightCord.classList.remove("pulled");
    }, 260);

    if (secretWorld) {
      secretWorld.classList.toggle("lights-off");
    }
  });
}

function openDiary() {
  currentDiaryKey = selectedKey || todayKey();

  if (!diaryDate || !diaryText || !saveStatus) return;

  const [year, month, day] = currentDiaryKey.split("-");
  diaryDate.textContent = `${year}년 ${Number(month)}월 ${Number(day)}일의 비밀 일기`;

  const diaryData = JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY) || "{}");
  diaryText.value = diaryData[currentDiaryKey] || "";
  saveStatus.textContent = "자동 저장 준비 완료";
}

if (diaryText) {
  diaryText.addEventListener("input", () => {
    clearTimeout(saveTimer);

    if (saveStatus) {
      saveStatus.textContent = "저장 중...";
    }

    saveTimer = setTimeout(() => {
      const diaryData = JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY) || "{}");
      diaryData[currentDiaryKey] = diaryText.value;
      localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(diaryData));

      if (saveStatus) {
        saveStatus.textContent = "자동 저장됐어요.";
      }
    }, 450);
  });
}

if (diaryArchiveWindow) {
  diaryArchiveWindow.addEventListener("click", openDiaryArchive);
}

if (archiveClose) {
  archiveClose.addEventListener("click", () => {
    if (diaryArchive) {
      diaryArchive.classList.remove("active");
    }
  });
}

function openDiaryArchive() {
  if (!archiveList || !diaryArchive) return;

  const diaryData = JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY) || "{}");

  const entries = Object.entries(diaryData)
    .filter(([date, text]) => text.trim().length > 0)
    .sort((a, b) => b[0].localeCompare(a[0]));

  archiveList.innerHTML = "";

  if (entries.length === 0) {
    archiveList.innerHTML = `
      <div class="archive-empty">
        아직 보관된 일기가 없어요.
      </div>
    `;
  } else {
    entries.forEach(([date, text]) => {
      const item = document.createElement("button");
      item.className = "archive-item";

      const [year, month, day] = date.split("-");
      const preview = text.trim().replace(/\n/g, " ").slice(0, 80);

      item.innerHTML = `
        <div class="archive-date">${year}년 ${Number(month)}월 ${Number(day)}일</div>
        <div class="archive-preview">${escapeHTML(preview || "내용 없음")}</div>
      `;

      item.addEventListener("click", () => {
        loadDiaryByDate(date);
        diaryArchive.classList.remove("active");
      });

      archiveList.appendChild(item);
    });
  }

  diaryArchive.classList.add("active");
}

function loadDiaryByDate(dateKey) {
  currentDiaryKey = dateKey;

  if (!diaryDate || !diaryText || !saveStatus) return;

  const [year, month, day] = dateKey.split("-");
  diaryDate.textContent = `${year}년 ${Number(month)}월 ${Number(day)}일의 비밀 일기`;

  const diaryData = JSON.parse(localStorage.getItem(DIARY_STORAGE_KEY) || "{}");
  diaryText.value = diaryData[dateKey] || "";
  saveStatus.textContent = "불러온 일기예요.";
}

function escapeHTML(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (prevMonth) {
  prevMonth.addEventListener("click", () => {
    currentMonth--;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }

    renderCalendar();
  });
}

if (nextMonth) {
  nextMonth.addEventListener("click", () => {
    currentMonth++;

    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }

    renderCalendar();
  });
}

if (backBtn) {
  backBtn.addEventListener("click", closeDetail);
}

if (addBtn) {
  addBtn.addEventListener("click", addTodo);
}

if (todoInput) {
  todoInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      addTodo();
    }
  });
}
