"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

interface Task {
  _id: string;
  title: string;
  completed: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [connected, setConnected] = useState(false);

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`);
      const data = await response.json();

      setTasks(data);
    } catch (error) {
      console.log("Error fetching tasks:", error);
    }
  };

  // Add task
  const addTask = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
        }),
      });

      setTitle("");
    } catch (error) {
      console.log("Error adding task:", error);
    }
  };

  // Update task
  const updateTask = async (task: Task) => {
    try {
      await fetch(`${API_URL}/api/tasks/${task._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          completed: !task.completed,
        }),
      });
    } catch (error) {
      console.log("Error updating task:", error);
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.log("Error deleting task:", error);
    }
  };

  useEffect(() => {
    // Initial data
    fetchTasks();

    // Connect Socket.IO
    const socket = io(API_URL);

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    // Real-time CREATE
    socket.on("taskCreated", (task: Task) => {
      setTasks((previousTasks) => [task, ...previousTasks]);
    });

    // Real-time UPDATE
    socket.on("taskUpdated", (updatedTask: Task) => {
      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );
    });

    // Real-time DELETE
    socket.on("taskDeleted", (deletedTask: Task) => {
      if (deletedTask) {
        setTasks((previousTasks) =>
          previousTasks.filter((task) => task._id !== deletedTask._id)
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <main className="container">
      <h1>Next.js CRUD Task Manager</h1>

      <p className="subtitle">
        Next.js + Node.js + MongoDB + Socket.IO
      </p>

      <div className="status">
        {connected
          ? "🟢 Real-time connection active"
          : "🔴 Connecting to server..."}
      </div>

      <div className="form">
        <input
          type="text"
          placeholder="Enter a task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTask();
            }
          }}
        />

        <button className="add-btn" onClick={addTask}>
          Add Task
        </button>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty">
            No tasks available. Add your first task!
          </div>
        ) : (
          tasks.map((task) => (
            <div className="task" key={task._id}>
              <div className="task-info">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => updateTask(task)}
                />

                <span className={task.completed ? "completed" : ""}>
                  {task.title}
                </span>
              </div>

              <div className="actions">
                <button
                  className="edit-btn"
                  onClick={() => updateTask(task)}
                >
                  {task.completed ? "Undo" : "Complete"}
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteTask(task._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}