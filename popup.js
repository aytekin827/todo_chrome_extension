const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const dateDisplay = document.createElement('div');
let completionDisplay = null;

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  showToday();
  initCompletionDisplay();
});

taskInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    addTask(taskInput.value);
    taskInput.value = '';
  }
});

function addTask(task, completed = false, id = Date.now()) {
  if (!task.trim()) return;

  const li = document.createElement('li');
  li.dataset.id = id;

  const checkBtn = document.createElement('button');
  checkBtn.textContent = completed ? '✅' : '⬜';
  checkBtn.onclick = function() {
    completed = !completed;
    checkBtn.textContent = completed ? '✅' : '⬜';
    li.style.textDecoration = completed ? 'line-through' : 'none';
    reorderTasks();
    saveTasks();
    updateCompletionRate();
  };

  li.textContent = task;
  li.style.textDecoration = completed ? 'line-through' : 'none';

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '❌';
  removeBtn.onclick = function() { li.remove(); saveTasks(); updateCompletionRate(); };

  li.prepend(checkBtn);
  li.appendChild(removeBtn);

  taskList.appendChild(li);
  reorderTasks();
  updateCompletionRate();
}

function reorderTasks() {
  const items = Array.from(taskList.children);
  items.sort((a, b) => {
    const aChecked = a.firstChild.textContent === '✅';
    const bChecked = b.firstChild.textContent === '✅';
    if (aChecked === bChecked) {
      return parseInt(a.dataset.id) - parseInt(b.dataset.id);
    }
    return aChecked - bChecked;
  });
  items.forEach(item => taskList.appendChild(item));
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll('#taskList li').forEach(li => {
    tasks.push({
      id: parseInt(li.dataset.id),
      task: li.childNodes[1].textContent,
      completed: li.firstChild.textContent === '✅'
    });
  });
  chrome.storage.local.set({ tasks, date: getTodayStr() });
}

function loadTasks() {
  chrome.storage.local.get(['tasks', 'date'], function(result) {
    const today = getTodayStr();

    if (result.date === today) {
      result.tasks?.forEach(taskObj => addTask(taskObj.task, taskObj.completed, taskObj.id));
    } else {
      chrome.storage.local.set({ tasks: [], date: today });
    }
    updateCompletionRate();
  });
}

function showToday() {
  const today = new Date();
  const dateString = today.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  dateDisplay.textContent = dateString;
  dateDisplay.style.cssText = "text-align:center; margin-bottom:10px; font-weight:bold;";
  document.body.insertBefore(dateDisplay, document.body.firstChild);
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function initCompletionDisplay() {
  completionDisplay = document.createElement('div');
  completionDisplay.style.cssText = 'text-align:center; margin-top:10px; font-weight:bold;';
  document.body.appendChild(completionDisplay);
  updateCompletionRate();
}

function updateCompletionRate() {
  const items = Array.from(taskList.children);
  const total = items.length;
  const completed = items.filter(item => item.firstChild.textContent === '✅').length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (!completionDisplay) initCompletionRate();

  if (completed === total) {
    completionDisplay.style.color = 'green';
    completionDisplay.textContent = `🎊 완료율: ${completed}/${total} (${rate}%) 수고하셨습니다 🎊`;
  }
  else if (completed === 0) {
    completionDisplay.style.color = 'red';
    completionDisplay.textContent = `🔥 완료율: ${completed}/${total} (${rate}%)`;
} else {
    completionDisplay.style.color = 'black';
    completionDisplay.textContent = `🔥 완료율: ${completed}/${total} (${rate}%)`;
  }
}
