import axios from 'axios';
import { Budget, Expense, Category } from './data';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Budget API functions
export const fetchBudgets = async () => {
  const response = await axios.get<Budget[]>(`${API_URL}/budgets`);
  return response.data;
};

export const createBudget = async (budget: Omit<Budget, '_id'>) => {
  const response = await axios.post<Budget>(`${API_URL}/budgets`, budget);
  return response.data;
};

export const updateBudget = async (id: string, budget: Partial<Budget>) => {
  const response = await axios.put<Budget>(`${API_URL}/budgets/${id}`, budget);
  return response.data;
};

export const deleteBudget = async (id: string) => {
  await axios.delete(`${API_URL}/budgets/${id}`);
};

// Expense API functions
export const fetchExpenses = async () => {
  const response = await axios.get<Expense[]>(`${API_URL}/expenses`);
  return response.data;
};

export const createExpense = async (expense: Omit<Expense, '_id'>) => {
  const response = await axios.post<Expense>(`${API_URL}/expenses`, expense);
  return response.data;
};

export const updateExpense = async (id: string, expense: Partial<Expense>) => {
  const response = await axios.put<Expense>(`${API_URL}/expenses/${id}`, expense);
  return response.data;
};

export const deleteExpense = async (id: string) => {
  await axios.delete(`${API_URL}/expenses/${id}`);
};

// Category API functions
export const fetchCategories = async () => {
  const response = await axios.get<Category[]>(`${API_URL}/categories`);
  return response.data;
};

export const createCategory = async (category: Omit<Category, '_id'>) => {
  const response = await axios.post<Category>(`${API_URL}/categories`, category);
  return response.data;
};

export const deleteCategory = async (id: string) => {
  await axios.delete(`${API_URL}/categories/${id}`);
};

// Recent Activities API functions
export const fetchRecentActivities = async () => {
  const response = await axios.get(`${API_URL}/recent-activities`);
  return response.data;
};

export const createRecentActivity = async (activity) => {
  const response = await axios.post(`${API_URL}/recent-activities`, activity);
  return response.data;
};