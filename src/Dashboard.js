import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import { useLocation } from "react-router-dom";
import {
  BarChart,
  
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
  AlertCircle,
  X
} from "lucide-react";


const GlassCard = ({ className = "", children }) => (
  <div className={`bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:bg-white/20 transition-all duration-300 ${className}`}>
    {children}
  </div>
);


const StatCard = ({ title, value, description, icon: Icon, color }) => (
  <GlassCard>
    <div className="p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <div className="text-3xl font-bold text-white">{value}</div>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <Icon className={`h-7 w-7 text-white`} />
        </div>
      </div>
      <p className="text-sm text-gray-300 mt-3">{description}</p>
    </div>
  </GlassCard>
);

const FunnyQuote = ({ attendance }) => {
  if (attendance >= 85) return null;
  
  return (
    <div className={`${attendance >= 75 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'} border rounded-lg p-4 mt-4 animate-bounce`}>
      <p className={`${attendance >= 75 ? 'text-green-300' : 'text-red-300'} text-center font-bold text-lg`}>
        {attendance >= 75 ? '"Shabash mere sher! 🦁"' : '"Tu toh gaya bete! 😅"'}
      </p>
    </div>
  );
};

function Dashboard() {
  const { state } = useLocation();
  const [userDetails, setUserDetails] = useState(null);
  const [attendanceData, setAttendanceData] = useState({
    stdSubAtdDetails: [],
  });
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const storedHeaders = JSON.parse(localStorage.getItem('authHeaders'));
    console.log('Auth Headers:', storedHeaders);

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
      console.log('Fetching user details from:', userDetailsUrl);
      console.log('Using headers:', headers);
      const response = await axios.get(userDetailsUrl, { headers });
      console.log('User Details Response:', response.data);
      
      setUserDetails(response.data);
      setStatusMessage("User details fetched successfully!");
    } catch (error) {
      console.error('Error fetching user details:', error);
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
      console.log('Fetching attendance data from:', attendanceUrl);
      console.log('Using headers:', headers);
      const response = await axios.get(attendanceUrl, { headers });
      console.log('Main Attendance Response:', response.data);
      
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setStatusMessage(
        `Error fetching attendance data: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const getSubjectAttendanceData = () => {
    if (
      attendanceData?.stdSubAtdDetails?.subjects &&
      Array.isArray(attendanceData.stdSubAtdDetails.subjects)
    ) {
      return attendanceData.stdSubAtdDetails.subjects.flat().map((subject) => {
        console.log('Subject Details:', subject); // Log complete subject details
        return {
          name: subject.name || "Unknown",
          id: subject.id || subject.subjectId,
          Present: subject.presentLeactures || 0,
          Absent:
            (subject.totalLeactures || 0) - (subject.presentLeactures || 0),
          percentage: subject.percentageAttendance || 100,
        };
      });
    }
    return [];
  };

  const subjectAttendanceData = getSubjectAttendanceData();

  const getDailyAttendance = async (subjectId, headers) => {
    const dailyAttendanceUrl = `/api/SubjectAttendance/GetPresentAbsentStudent?isDateWise=true&termId=0&userId=${headers["X-Userid"]}&y=0&subjectId=${subjectId}&isDetailed=true`;

    try {
      const response = await axios.get(dailyAttendanceUrl, { headers });
      
      // Filter and sort attendance data
      let records = response.data.attendanceData || [];
      
      // Filter for the specific subject
      records = records.filter(record => record.subjectId === subjectId);
      
      // Sort by date (latest first)
      records.sort((a, b) => {
        const dateA = new Date(a.absentDate);
        const dateB = new Date(b.absentDate);
        return dateB - dateA; // Sort in descending order (latest first)
      });
      
      // Map to required format
      records = records.map(record => ({
        date: record.absentDate,
        subjectName: record.subjectName,
        isPresent: !record.isAbsent,
        attendanceType: record.attandanceType,
        attendanceId: record.attendanceID
      }));
      
      console.log('Sorted Records:', records);
      setDailyAttendance(records);
      setCurrentPage(1);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Daily Attendance API Error:', error);
      setStatusMessage(
        `Error fetching daily attendance: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const handleSubjectClick = (data) => {
    console.log('Clicked Subject Data:', data);
    // Get the original subject data from attendanceData
    const subject = attendanceData?.stdSubAtdDetails?.subjects
      ?.flat()
      ?.find(s => s.name === data.name);
    
    if (!subject) {
      console.error('Could not find subject in original data:', data);
      setStatusMessage("Error: Could not find subject details");
      return;
    }

    console.log('Found Subject:', subject);
    setSelectedSubject(subject);
    const storedHeaders = JSON.parse(localStorage.getItem('authHeaders'));
    getDailyAttendance(subject.id || subject.subjectId, storedHeaders);
  };

  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    // Calculate pagination
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = dailyAttendance.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(dailyAttendance.length / recordsPerPage);

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              {selectedSubject?.name} - Daily Attendance
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 font-semibold text-gray-300 border-b border-gray-700 pb-2">
              <div>Date</div>
              <div>Subject</div>
              <div>Status</div>
              <div>Type</div>
            </div>
            {currentRecords.length > 0 ? (
              currentRecords.map((record, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 border-b border-gray-700 pb-2">
                  <div className="text-white">{new Date(record.date).toLocaleDateString()}</div>
                  <div className="text-white">{record.subjectName}</div>
                  <div className={`${record.isPresent ? 'text-green-400' : 'text-red-400'}`}>
                    {record.isPresent ? 'Present' : 'Absent'}
                  </div>
                  <div className="text-white">{record.attendanceType === 1 ? 'Regular' : 'Extra'}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400">
                No attendance records found for this subject
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Previous
                </button>
                <span className="text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded ${
                    currentPage === totalPages
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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

  const pieData = [
    { name: "Present", value: stats.present },
    { name: "Absent", value: stats.absent },
  ];
  const COLORS = ["#6366F1", "#aab7fa"]; 

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
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
          <FunnyQuote attendance={(stats.present / stats.total) * 100} />
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
              <h3 className="text-lg font-semibold text-white mb-4">
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
              <div className="text-sm text-gray-300 text-center mt-6">
                {stats.needed > 0 ? (
                  <p>
                    You need to attend at least{" "}
                    <span className="font-medium text-red-400">
                      {stats.needed}
                    </span>{" "}
                    more classes to maintain 75% attendance.
                  </p>
                ) : (
                  <p>
                    You can miss up to{" "}
                    <span className="font-medium text-green-400">
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
              <h3 className="text-lg font-semibold text-white mb-4">
                Subject-wise Attendance
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {subjectAttendanceData.map((subject, index) => (
                      <tr 
                        key={index}
                        onClick={() => handleSubjectClick(subject)}
                        className="hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {subject.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {subject.percentage}%
                          </div>
                          <div className="text-xs text-gray-400">
                            {subject.Present} present / {subject.Present + subject.Absent} total
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            subject.percentage >= 75
                              ? 'bg-green-400/20 text-green-300'
                              : 'bg-red-400/20 text-red-300'
                          }`}>
                            {subject.percentage >= 75 ? 'Good' : 'At Risk'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 font-semibold text-gray-700 border-b pb-2">
            <div>Date</div>
            <div>Subject</div>
            <div>Status</div>
            <div>Type</div>
          </div>
          {Array.isArray(dailyAttendance) && dailyAttendance.length > 0 ? (
            dailyAttendance.map((record, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 border-b pb-2">
                <div>{new Date(record.date).toLocaleDateString()}</div>
                <div>{record.subjectName}</div>
                <div className={`${record.isPresent ? 'text-green-600' : 'text-red-600'}`}>
                  {record.isPresent ? 'Present' : 'Absent'}
                </div>
                <div>{record.attendanceType === 1 ? 'Regular' : 'Extra'}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              No attendance records found for this subject
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;