import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import { useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import {
  CalendarDays,
  GraduationCap,
  CheckCircle,
  XCircle,
  LogOut,
  TrendingUp,
  AlertCircle
} from "lucide-react";


const GlassCard = ({ className = "", children }) => (
  <div className={`bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden ${className}`}>
    {children}
  </div>
);


const StatCard = ({ title, value, description, icon: Icon, color }) => (
  <GlassCard>
    <div className="p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
          <div className="text-3xl font-bold text-gray-900">{value}</div>
        </div>
        <Icon className={`h-7 w-7 text-${color}-500 opacity-70`} />
      </div>
      <p className="text-sm text-gray-500 mt-3">{description}</p>
    </div>
  </GlassCard>
);

function Dashboard() {
  const { state } = useLocation();
  const [userDetails, setUserDetails] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    stdSubAtdDetails: [],
  });
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const storedHeaders = JSON.parse(localStorage.getItem('authHeaders'));

    if (!storedHeaders || !storedHeaders["X-Userid"]) {
      setStatusMessage("No headers or user ID available. Redirecting...");
      navigate("/login"); 
      return;
    }

    const userId = storedHeaders["X-Userid"];
    getUserDetails(userId, storedHeaders);
    getAttendanceData(userId, storedHeaders);
  }, [navigate]);

  const getUserDetails = async (userId, headers) => {
    const userDetailsUrl = `/api/User/GetByUserId/${userId}?y=0`;

    try {
      const response = await axios.get(userDetailsUrl, { headers });
      
      setUserDetails(response.data);
      setStatusMessage("User details fetched successfully!");
    } catch (error) {
      setStatusMessage(
        `Error fetching user details: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const getAttendanceData = async (userId, headers) => {
    const attendanceUrl = `/api/SubjectAttendance/GetPresentAbsentStudent?isDateWise=false&termId=0&userId=${userId}&y=0`;

    try {
      const response = await axios.get(attendanceUrl, { headers });
      

      setAttendanceData(response.data);
    } catch (error) {
      setStatusMessage(
        `Error fetching attendance data: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const getStats = () => {
    const present = attendanceData.stdSubAtdDetails?.overallPresent || 0;
    const total = attendanceData.stdSubAtdDetails?.overallLecture || 0;
    const required =
      present / total < 0.75
        ? Math.ceil((0.75 * total - present) / 0.25)
        : 0;
    const available =
      present / total >= 0.75
        ? Math.floor((present - 0.75 * total) / 0.75)
        : 0;

    return {
      present,
      absent: total - present,
      total,
      needed: required > 0 ? required : 0,
      canMiss: available > 0 ? available : 0,
    };
  };

  const stats = getStats();

  const getSubjectAttendanceData = () => {
    if (
      attendanceData?.stdSubAtdDetails?.subjects &&
      Array.isArray(attendanceData.stdSubAtdDetails.subjects)
    ) {
      return attendanceData.stdSubAtdDetails.subjects.flat().map((subject) => ({
        name: subject.name || "Unknown",
        Present: subject.presentLeactures || 0,
        Absent:
          (subject.totalLeactures || 0) - (subject.presentLeactures || 0),
        percentage: subject.percentageAttendance || 100,
      }));
    }
    return [];
  };

  const subjectAttendanceData = getSubjectAttendanceData();

  const pieData = [
    { name: "Present", value: stats.present },
    { name: "Absent", value: stats.absent },
  ];
  const COLORS = ["#6366F1", "#aab7fa"]; 

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Attendance Dashboard
              </h1>
              <p className="text-indigo-100">
                Track your attendance and performance
              </p>
            </div>
            <div className="flex flex-col items-center space-x-4 md:flex-row gap-4">
              {userDetails && (
                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-8 w-8 text-white" />
                  <div>
                    <p className="font-semibold">{userDetails.firstName} {userDetails.lastName}</p>
                    <p className="text-sm text-indigo-200">
                      Roll No: {userDetails.rollNumber}
                    </p>
                  </div>
                </div>
              )}
              <button
                className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
                onClick={() => {
                  localStorage.clear(); 
                  navigate("/login"); 
                }}
              >
                <LogOut className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Overall Attendance"
            value={`${((stats.present / stats.total) * 100).toFixed(1)}%`}
            description={`${stats.present} present out of ${stats.total} classes`}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="Projection"
            value={stats.needed > 0 ? `${stats.needed} More` : `${stats.canMiss} Available`}
            description={stats.needed > 0 
              ? "Classes needed to maintain 75%" 
              : "Classes you can miss"}
            icon={TrendingUp}
            color={stats.needed > 0 ? "red" : "green"}
          />
          <StatCard
            title="Risk Assessment"
            value={stats.absent}
            description="Total classes missed"
            icon={AlertCircle}
            color="red"
          />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Attendance Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
              </div>
                <div className="text-sm text-gray-600 text-center mt-6">
                {stats.needed > 0 ? (
                  <p>
                    You need to attend at least{" "}
                    <span className="font-medium text-red-700">
                      {stats.needed}
                    </span>{" "}
                    more classes to maintain 75% attendance.
                  </p>
                ) : (
                  <p>
                    You can miss up to{" "}
                    <span className="font-medium text-green-700">
                      {stats.canMiss}
                    </span>{" "}
                    classes while maintaining 75% attendance.
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subject Attendance
              </h3>
              <div className="h-64 overflow-x-auto">
                <ResponsiveContainer width="150%" height="100%">
                  <BarChart
                    data={subjectAttendanceData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 45 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tickFormatter={(name) =>
                        name.length > 10 ? `${name.slice(0, 10)}...` : name
                      }
                      tick={{ fontSize: 11, fill: "#4B5563" }}
                      angle={-45}
                      textAnchor="end"
                      dy={10}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#6366F1" name="Attendance %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;