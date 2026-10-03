import dotenv from "dotenv";

dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Task from "./models/Task.js";

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});


app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error);
    });

// Test API
app.get("/", (req, res) => {
    res.json({
        message: "Backend API is running"
    });
});

// Socket.IO
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

//POST
app.post("/api/tasks", async (req, res) => {
    try {
        const task = await Task.create({
            title: req.body.title
        });

        io.emit("taskCreated", task);

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({
            message: "Error creating task"
        });
    }
});

//GET

app.get("/api/tasks", async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching tasks"
        });
    }
});

//update

app.put("/api/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        io.emit("taskUpdated", task);

        res.json(task);
    } catch (error) {
        res.status(500).json({
            message: "Error updating task"
        });
    }
});

//delete

app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);

        io.emit("taskDeleted", task);

        res.json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting task"
        });
    }
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});