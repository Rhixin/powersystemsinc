"use client";

import { useState, useEffect } from "react";
import {
  UsersIcon,
  BuildingOfficeIcon,
  CogIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { StatCardSkeleton } from "@/components/Skeletons";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";

interface DatabaseCounts {
  forms: number;
  customer: number;
  engine: number;
  companies: number;
}

interface ApiResponse {
  status: string;
  data: DatabaseCounts;
}

interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalCompanies: number;
  totalForms: number;
}

export default function OverviewPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    totalCompanies: 0,
    totalForms: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch counts from backend
      const response = await apiClient.get<ApiResponse>("/database/counts");
      const counts = response.data.data;

      setStats({
        totalCustomers: counts.customer || 0,
        totalProducts: counts.engine || 0,
        totalCompanies: counts.companies || 0,
        totalForms: counts.forms || 0,
      });

      // Generate monthly data for the last 6 months
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const monthlyStats = months.map((month, index) => ({
        month,
        forms: Math.floor(Math.random() * 20) + 5,
        customers: Math.floor(Math.random() * 15) + 3,
      }));
      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Customers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalCustomers}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Engines</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalProducts}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CogIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Companies</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalCompanies}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Form Templates
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalForms}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <DocumentTextIcon className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Monthly Activity Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Monthly Activity Trend
          </h2>
          {isLoading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="forms"
                  stroke="#2B4C7E"
                  strokeWidth={2}
                  name="Forms Created"
                />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="New Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Statistics Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          System Overview
        </h2>
        {isLoading ? (
          <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: "Customers",
                  count: stats.totalCustomers,
                  color: "#3B82F6",
                },
                {
                  name: "Engines",
                  count: stats.totalProducts,
                  color: "#10B981",
                },
                {
                  name: "Companies",
                  count: stats.totalCompanies,
                  color: "#8B5CF6",
                },
                {
                  name: "Form Templates",
                  count: stats.totalForms,
                  color: "#EF4444",
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2B4C7E" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
