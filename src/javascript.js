const { createElement: h, useEffect, useState } = React;
const storageKey = "todoListTasks";
const seedVersionKey = "todoListReactSeedVersion";
const seedVersion = "1";

const starterTasks = [
  { text: "Prep meals", description: "Prepare meals for the week", date: "2023-12-01", checked: false },
  { text: "Feed the cat", description: "Feed the cat before going to work", date: "2023-12-01", checked: true },
  { text: "Buy groceries", description: "Buy groceries for the week", date: "2023-12-02", checked: false },
  { text: "Clean the house", description: "Clean the living room", date: "2023-12-03", checked: false },
  { text: "Buy the christmas tree", description: "Buy a Christmas tree for the living room", date: "2023-12-04", checked: false },
  { text: "Decore the house", description: "Decorate the house for Christmas", date: "2023-12-05", checked: false },
];

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) {
      return starterTasks.map((task) => ({ ...task, id: makeId() }));
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Saved tasks are not a list");

    const shouldFillStarterDetails = localStorage.getItem(seedVersionKey) !== seedVersion;
    const starterByName = new Map(
      starterTasks.map((task) => [task.text.trim().toLocaleLowerCase(), task]),
    );

    return parsed
      .filter((task) => task && typeof (task.text ?? task.title) === "string")
      .map((task) => {
        const text = task.text ?? task.title;
        const starter = starterByName.get(text.trim().toLocaleLowerCase());
        return {
          id: task.id ?? makeId(),
          text,
          description: shouldFillStarterDetails && !task.description
            ? starter?.description ?? ""
            : typeof task.description === "string" ? task.description : "",
          date: shouldFillStarterDetails && !task.date
            ? starter?.date ?? ""
            : typeof task.date === "string" ? task.date : "",
          checked: Boolean(task.checked),
        };
      });
  } catch {
    return starterTasks.map((task) => ({ ...task, id: makeId() }));
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  return h(
    "li",
    {
      className: task.checked ? "checked" : "",
      onClick: () => onToggle(task.id),
    },
    h(
      "div",
      { className: "task-content" },
      h("span", { className: "task-text" }, task.text),
      task.description
        ? h("span", { className: "task-description" }, task.description)
        : null,
      task.date
        ? h("time", { className: "task-date", dateTime: task.date }, formatDate(task.date))
        : null,
    ),
    h(
      "button",
      {
        type: "button",
        className: "edit",
        "aria-label": "Editar tarea",
        onClick: (event) => {
          event.stopPropagation();
          onEdit(task);
        },
      },
      h("img", { src: "src/assets/edit.svg", alt: "" }),
    ),
    h(
      "button",
      {
        type: "button",
        className: "close",
        "aria-label": "Borrar tarea",
        onClick: (event) => {
          event.stopPropagation();
          onDelete(task.id);
        },
      },
      h("img", { src: "src/assets/delete.svg", alt: "" }),
    ),
  );
}

function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    localStorage.setItem(seedVersionKey, seedVersion);
  }, [tasks]);

  function addTask(event) {
    event.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) {
      alert("You must write something!");
      return;
    }

    setTasks((current) => [
      ...current,
      {
        id: makeId(),
        text: trimmedText,
        description: description.trim(),
        date,
        checked: false,
      },
    ]);
    setText("");
    setDescription("");
    setDate("");
  }

  function editTask(task) {
    const updatedText = prompt("Edit task:", task.text);
    if (updatedText === null || !updatedText.trim()) return;
    const updatedDescription = prompt("Edit description:", task.description);
    if (updatedDescription === null) return;
    const updatedDate = prompt("Edit date (YYYY-MM-DD):", task.date);
    if (updatedDate === null) return;

    const nextDate = updatedDate.trim();
    if (nextDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      alert("Enter the date in YYYY-MM-DD format.");
      return;
    }

    setTasks((current) => current.map((item) => item.id === task.id
      ? {
          ...item,
          text: updatedText.trim(),
          description: updatedDescription.trim(),
          date: nextDate,
        }
      : item));
  }

  return h(
    React.Fragment,
    null,
    h(
      "header",
      { className: "header" },
      h("h2", null, "To Do List!"),
      h(
        "form",
        { className: "addTask", onSubmit: addTask },
        h(
          "div",
          { className: "task-main-row" },
          h("input", {
            type: "text",
            placeholder: "What's your task?",
            value: text,
            onChange: (event) => setText(event.target.value),
          }),
          h("button", { type: "submit", className: "addBtn" }, "Add"),
        ),
        h(
          "div",
          { className: "task-extra-row" },
          h("input", {
            type: "text",
            placeholder: "Description (optional)",
            value: description,
            onChange: (event) => setDescription(event.target.value),
          }),
          h("input", {
            type: "date",
            "aria-label": "Task date (optional)",
            value: date,
            onChange: (event) => setDate(event.target.value),
          }),
        ),
      ),
    ),
    h(
      "ul",
      { className: "task-list" },
      tasks.map((task) => h(TaskItem, {
        key: task.id,
        task,
        onToggle: (id) => setTasks((current) => current.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item)),
        onEdit: editTask,
        onDelete: (id) => setTasks((current) => current.filter((item) => item.id !== id)),
      })),
    ),
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
