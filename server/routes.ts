import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertAttendanceSchema, insertExpenseSchema, insertLocationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { emailService } from "./emailService";

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_multer });

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check admin role
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Attendance routes
  app.post("/api/attendance/clock-in", requireAuth, async (req, res) => {
    try {
      const data = insertAttendanceSchema.parse({
        userId: req.user.id,
        clockIn: new Date(),
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        location: req.body.location,
        date: new Date().toISOString().split('T')[0],
      });
      
      const attendance = await storage.createAttendance(data);
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/attendance/clock-out", requireAuth, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendance = await storage.getTodayAttendance(req.user.id, today);
      
      if (!attendance) {
        return res.status(400).json({ message: "No clock-in record found for today" });
      }

      const updated = await storage.updateAttendance(attendance.id, {
        clockOut: new Date(),
      });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const { userId, startDate, endDate } = req.query;
      const targetUserId = req.user.role === "admin" && userId ? userId as string : req.user.id;
      
      const records = await storage.getAttendanceRecords(
        targetUserId,
        startDate as string,
        endDate as string
      );
      
      res.json(records);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/attendance/today", requireAuth, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendance = await storage.getTodayAttendance(req.user.id, today);
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Expenses routes
  app.post("/api/expenses", requireAuth, upload.single('receipt'), async (req, res) => {
    try {
      const data = insertExpenseSchema.parse({
        userId: req.user.id,
        date: req.body.date,
        amount: req.body.amount,
        category: req.body.category,
        description: req.body.description,
        receiptPath: req.file ? req.file.filename : undefined,
      });
      
      const expense = await storage.createExpense(data);
      res.json(expense);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const { userId, startDate, endDate, category, status } = req.query;
      const targetUserId = req.user.role === "admin" && userId ? userId as string : req.user.id;
      
      const expenses = await storage.getExpenses(
        targetUserId,
        startDate as string,
        endDate as string,
        category as string,
        status as string
      );
      
      res.json(expenses);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/expenses/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const expense = await storage.updateExpenseStatus(req.params.id, status);
      res.json(expense);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/expenses/:id/receipt", requireAuth, async (req, res) => {
    try {
      const expense = await storage.getExpenseById(req.params.id);
      if (!expense || (!req.user.role === "admin" && expense.userId !== req.user.id)) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      if (!expense.receiptPath) {
        return res.status(404).json({ message: "No receipt found" });
      }
      
      const filePath = path.join(uploadDir, expense.receiptPath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Receipt file not found" });
      }
      
      res.sendFile(filePath);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Location tracking routes
  app.post("/api/location", requireAuth, async (req, res) => {
    try {
      const data = insertLocationSchema.parse({
        userId: req.user.id,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      });
      
      const location = await storage.createLocationTracking(data);
      res.json(location);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/team", requireAdmin, async (req, res) => {
    try {
      const team = await storage.getTeamMembers();
      res.json(team);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/pending-expenses", requireAdmin, async (req, res) => {
    try {
      const expenses = await storage.getPendingExpenses();
      res.json(expenses);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/team-attendance", requireAdmin, async (req, res) => {
    try {
      const teamStatus = await storage.getTeamAttendanceStatus();
      res.json(teamStatus);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/send-reminder", requireAdmin, async (req, res) => {
    try {
      const { userIds, message } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Aucun utilisateur sélectionné" });
      }

      const notifiedUsers = [];
      const failedUsers = [];
      
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (user) {
          try {
            const emailSent = await emailService.sendAttendanceReminder(user.email, user.name);
            if (emailSent) {
              notifiedUsers.push(user.name);
            } else {
              failedUsers.push(user.name);
            }
          } catch (error) {
            console.error(`Erreur lors de l'envoi à ${user.email}:`, error);
            failedUsers.push(user.name);
          }
        }
      }
      
      const successMessage = notifiedUsers.length > 0 
        ? `Notifications envoyées à ${notifiedUsers.length} utilisateur(s)`
        : "Aucune notification envoyée";
      
      const errorMessage = failedUsers.length > 0 
        ? ` (${failedUsers.length} échec(s))`
        : "";
      
      res.json({ 
        message: successMessage + errorMessage,
        notifiedUsers,
        failedUsers
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/users-not-clocked", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersNotClockedIn();
      res.json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
