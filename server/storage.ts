import { type User, type InsertUser, type AttendanceRecord, type InsertAttendance, type Expense, type InsertExpense, type LocationTracking, type InsertLocation } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord>;
  getTodayAttendance(userId: string, date: string): Promise<AttendanceRecord | undefined>;
  getAttendanceRecords(userId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]>;
  
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(userId: string, startDate?: string, endDate?: string, category?: string, status?: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  updateExpenseStatus(id: string, status: string): Promise<Expense>;
  getPendingExpenses(): Promise<(Expense & { user?: User })[]>;
  
  createLocationTracking(location: InsertLocation): Promise<LocationTracking>;
  
  getAdminStats(): Promise<any>;
  getTeamMembers(): Promise<User[]>;
  getTeamAttendanceStatus(): Promise<any[]>;
  getUsersNotClockedIn(): Promise<User[]>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private attendanceRecords: Map<string, AttendanceRecord>;
  private expenses: Map<string, Expense>;
  private locationTracking: Map<string, LocationTracking>;
  public sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.attendanceRecords = new Map();
    this.expenses = new Map();
    this.locationTracking = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<AttendanceRecord> {
    const id = randomUUID();
    const attendance: AttendanceRecord = { ...insertAttendance, id };
    this.attendanceRecords.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const attendance = this.attendanceRecords.get(id);
    if (!attendance) {
      throw new Error("Attendance record not found");
    }
    const updated = { ...attendance, ...updates };
    this.attendanceRecords.set(id, updated);
    return updated;
  }

  async getTodayAttendance(userId: string, date: string): Promise<AttendanceRecord | undefined> {
    return Array.from(this.attendanceRecords.values()).find(
      (record) => record.userId === userId && record.date === date
    );
  }

  async getAttendanceRecords(userId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    let records = Array.from(this.attendanceRecords.values()).filter(
      (record) => record.userId === userId
    );

    if (startDate) {
      records = records.filter((record) => record.date >= startDate);
    }
    if (endDate) {
      records = records.filter((record) => record.date <= endDate);
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = { 
      ...insertExpense, 
      id,
      status: "pending",
      createdAt: new Date()
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async getExpenses(userId: string, startDate?: string, endDate?: string, category?: string, status?: string): Promise<Expense[]> {
    let expenses = Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId
    );

    if (startDate) {
      expenses = expenses.filter((expense) => expense.date >= startDate);
    }
    if (endDate) {
      expenses = expenses.filter((expense) => expense.date <= endDate);
    }
    if (category) {
      expenses = expenses.filter((expense) => expense.category === category);
    }
    if (status) {
      expenses = expenses.filter((expense) => expense.status === status);
    }

    return expenses.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async updateExpenseStatus(id: string, status: string): Promise<Expense> {
    const expense = this.expenses.get(id);
    if (!expense) {
      throw new Error("Expense not found");
    }
    const updated = { ...expense, status };
    this.expenses.set(id, updated);
    return updated;
  }

  async getPendingExpenses(): Promise<(Expense & { user?: User })[]> {
    const pendingExpenses = Array.from(this.expenses.values())
      .filter((expense) => expense.status === "pending")
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    // Add user information to each expense
    return pendingExpenses.map(expense => ({
      ...expense,
      user: this.users.get(expense.userId)
    }));
  }

  async createLocationTracking(insertLocation: InsertLocation): Promise<LocationTracking> {
    const id = randomUUID();
    const location: LocationTracking = { 
      ...insertLocation, 
      id,
      timestamp: new Date()
    };
    this.locationTracking.set(id, location);
    return location;
  }

  async getAdminStats(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const totalEmployees = Array.from(this.users.values()).filter(user => user.role === "employee").length;
    const presentToday = Array.from(this.attendanceRecords.values())
      .filter((record) => record.date === today).length;
    const pendingExpenses = Array.from(this.expenses.values())
      .filter((expense) => expense.status === "pending").length;
    const totalAmount = Array.from(this.expenses.values())
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    return {
      totalEmployees,
      presentToday,
      onMission: Math.floor(presentToday * 0.7), // Mock calculation
      pendingExpenses,
      totalAmount
    };
  }

  async getTeamMembers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter((user) => user.role === "employee")
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTeamAttendanceStatus(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    const employees = await this.getTeamMembers();
    
    return employees.map(employee => {
      const todayAttendance = Array.from(this.attendanceRecords.values())
        .find(record => record.userId === employee.id && record.date === today);
      
      return {
        ...employee,
        attendance: todayAttendance || null,
        isPresent: !!todayAttendance,
        isClockedIn: todayAttendance && !todayAttendance.clockOut,
        status: todayAttendance 
          ? (todayAttendance.clockOut ? 'completed' : 'active') 
          : 'absent'
      };
    });
  }

  async getUsersNotClockedIn(): Promise<User[]> {
    const today = new Date().toISOString().split('T')[0];
    const employees = await this.getTeamMembers();
    
    return employees.filter(employee => {
      const todayAttendance = Array.from(this.attendanceRecords.values())
        .find(record => record.userId === employee.id && record.date === today);
      return !todayAttendance;
    });
  }
}

export const storage = new MemStorage();
