const cheeringMessages = [
  "오늘의 작은 한 걸음도 분명히 당신을 앞으로 데려가고 있어요.",
  "천천히 해도 괜찮아요. 꾸준함은 생각보다 아주 강해요.",
  "오늘 해야 할 일을 하나씩 해내는 당신은 이미 충분히 멋져요.",
  "조금 부족한 하루여도 괜찮아요. 다시 시작할 힘은 늘 남아 있어요.",
  "오늘의 나에게 다정하게 말해줘요. 나는 잘하고 있다고.",
  "완벽하지 않아도 괜찮아요. 시작한 것만으로도 충분히 의미 있어요.",
  "작은 체크 하나가 오늘의 리듬을 만들어줄 거예요.",
  "급하지 않아도 돼요. 나만의 속도로 예쁘게 가면 돼요.",
  "오늘도 당신의 하루가 조금 더 가벼워지길 바라요.",
  "할 수 있는 만큼만 해도 괜찮아요. 그만큼도 정말 소중해요."
];

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

let touchDragIndex = null;
let touchDragElement = null;
let touchStartY = 0;

const monthNames = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

window.addEventListener("load", () => {
  setTimeout(() => {
    cover.classList.add("hide");
    app.classList.add("show");
  }, 1650);

  setDailyMessage();
  renderCalendar();
});

function setDailyMessage() {
  const today = new Date();
  const seed = today.getFullYear() + today.getMonth() * 31 + today.getDate();
  const message = cheeringMessages[seed % cheeringMessages.length];
  dailyMessage.textContent = `🌷 오늘의 응원: ${message}`;
}

function getStorage() {
  return JSON.parse(localStorage.getItem("esPlannerTodos") || "{}");
}

function setStorage(data) {
  localStorage.setItem("esPlannerTodos", JSON.stringify(data));
}

function makeDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey() {
  const now = new Date();
  return makeDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function renderCalendar() {
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

    if (isToday) {
      dayEl.classList.add("today");
    }

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
  selectedDateEl.textContent = `${currentYear}년 ${monthNames[currentMonth]} ${day}일`;

  calendarView.classList.add("hidden");
  detailView.classList.add("active");

  renderTodos();
  setTimeout(() => todoInput.focus(), 300);
}

function closeDetail() {
  detailView.classList.remove("active");
  calendarView.classList.remove("hidden");
  renderCalendar();
}

function renderTodos() {
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
      toggleTodo(index, event.currentTarget);
    });

    deleteButton.addEventListener("click", () => deleteTodo(index));

    itemEl.addEventListener("dragstart", handleDragStart);
    itemEl.addEventListener("dragover", handleDragOver);
    itemEl.addEventListener("dragleave", handleDragLeave);
    itemEl.addEventListener("drop", handleDrop);
    itemEl.addEventListener("dragend", handleDragEnd);

    dragHandle.addEventListener("pointerdown", event => {
      startTouchReorder(event, index);
    });

    todoList.appendChild(itemEl);
  });
}

function addTodo() {
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

  const todos = getStorage();
  const items = todos[selectedKey];

  const movedItem = items.splice(draggedIndex, 1)[0];
  items.splice(targetIndex, 0, movedItem);

  setStorage(todos);
  draggedIndex = null;
  renderTodos();
}

function handleDragEnd() {
  draggedIndex = null;

  document.querySelectorAll(".todo-item").forEach(item => {
    item.classList.remove("dragging", "drag-over");
  });
}

function startTouchReorder(event, index) {
  if (event.pointerType === "mouse") return;

  event.preventDefault();

  touchDragIndex = index;
  touchDragElement = event.currentTarget.closest(".todo-item");
  touchStartY = event.clientY;

  if (!touchDragElement) return;

  touchDragElement.classList.add("touch-dragging");
  touchDragElement.setPointerCapture(event.pointerId);

  touchDragElement.addEventListener("pointermove", moveTouchReorder);
  touchDragElement.addEventListener("pointerup", endTouchReorder);
  touchDragElement.addEventListener("pointercancel", endTouchReorder);
}

function moveTouchReorder(event) {
  if (touchDragElement === null || touchDragIndex === null) return;

  event.preventDefault();

  const currentY = event.clientY;
  const deltaY = currentY - touchStartY;

  touchDragElement.style.transform = `translateY(${deltaY}px) scale(1.02)`;

  const todoItems = Array.from(document.querySelectorAll(".todo-item"));

  const target = todoItems.find(item => {
    if (item === touchDragElement) return false;

    const rect = item.getBoundingClientRect();
    return currentY > rect.top && currentY < rect.bottom;
  });

  todoItems.forEach(item => {
    item.classList.remove("drag-over");
  });

  if (target) {
    target.classList.add("drag-over");
  }
}

function endTouchReorder(event) {
  if (touchDragElement === null || touchDragIndex === null) return;

  const currentY = event.clientY;
  const todoItems = Array.from(document.querySelectorAll(".todo-item"));

  const target = todoItems.find(item => {
    if (item === touchDragElement) return false;

    const rect = item.getBoundingClientRect();
    return currentY > rect.top && currentY < rect.bottom;
  });

  if (target) {
    const targetIndex = Number(target.dataset.index);

    if (targetIndex !== touchDragIndex) {
      const todos = getStorage();
      const items = todos[selectedKey];

      const movedItem = items.splice(touchDragIndex, 1)[0];
      items.splice(targetIndex, 0, movedItem);

      setStorage(todos);
    }
  }

  touchDragElement.classList.remove("touch-dragging");
  touchDragElement.style.transform = "";

  document.querySelectorAll(".todo-item").forEach(item => {
    item.classList.remove("drag-over");
  });

  touchDragElement.removeEventListener("pointermove", moveTouchReorder);
  touchDragElement.removeEventListener("pointerup", endTouchReorder);
  touchDragElement.removeEventListener("pointercancel", endTouchReorder);

  touchDragIndex = null;
  touchDragElement = null;
  touchStartY = 0;

  renderTodos();
}

function createSmallCheckFirework(target) {
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

secretLogo.addEventListener("click", () => {
  fakeError.classList.add("active");
});

document.querySelectorAll(".error-close").forEach(button => {
  button.addEventListener("click", () => {
    fakeError.classList.remove("active");
    secretWorld.classList.remove("active");
  });
});

secretErrorCode.addEventListener("click", enterSecretWorld);

function enterSecretWorld() {
  fakeError.classList.remove("active");
  secretWorld.classList.add("active");
  secretWorld.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  openDiary();
}

secretBack.addEventListener("click", () => {
  secretWorld.classList.remove("active");
});

lightCord.addEventListener("click", () => {
  lightCord.classList.add("pulled");

  setTimeout(() => {
    lightCord.classList.remove("pulled");
  }, 260);

  secretWorld.classList.toggle("lights-off");
});

function openDiary() {
  currentDiaryKey = selectedKey || todayKey();

  const [year, month, day] = currentDiaryKey.split("-");
  diaryDate.textContent = `${year}년 ${Number(month)}월 ${Number(day)}일의 비밀 일기`;

  const diaryData = JSON.parse(localStorage.getItem("esSecretDiary") || "{}");
  diaryText.value = diaryData[currentDiaryKey] || "";
  saveStatus.textContent = "자동 저장 준비 완료";
}

diaryText.addEventListener("input", () => {
  clearTimeout(saveTimer);
  saveStatus.textContent = "저장 중...";

  saveTimer = setTimeout(() => {
    const diaryData = JSON.parse(localStorage.getItem("esSecretDiary") || "{}");
    diaryData[currentDiaryKey] = diaryText.value;
    localStorage.setItem("esSecretDiary", JSON.stringify(diaryData));
    saveStatus.textContent = "자동 저장됐어요.";
  }, 450);
});

diaryArchiveWindow.addEventListener("click", openDiaryArchive);

archiveClose.addEventListener("click", () => {
  diaryArchive.classList.remove("active");
});

function openDiaryArchive() {
  const diaryData = JSON.parse(localStorage.getItem("esSecretDiary") || "{}");

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

  const [year, month, day] = dateKey.split("-");
  diaryDate.textContent = `${year}년 ${Number(month)}월 ${Number(day)}일의 비밀 일기`;

  const diaryData = JSON.parse(localStorage.getItem("esSecretDiary") || "{}");
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

prevMonth.addEventListener("click", () => {
  currentMonth--;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  currentMonth++;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  renderCalendar();
});

backBtn.addEventListener("click", closeDetail);
addBtn.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    addTodo();
  }
});
