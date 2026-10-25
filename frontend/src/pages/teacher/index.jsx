import React, { useState } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function TeacherPortal() {
  const { user, memberships, activeInstitutionId, activeMembership, switchInstitution, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');

  // Attendance State
  const [sessionDate, setSessionDate] = useState('2025-10-25');
  const [selectedCohort, setSelectedCohort] = useState('Grade 10 - Section A');
  const [isLocked, setIsLocked] = useState(false);
  const [attendanceList, setAttendanceList] = useState([
    { id: 'st1', rollNumber: '101', name: 'John Doe', status: 'PRESENT', remarks: '' },
    { id: 'st2', rollNumber: '102', name: 'Robert Johnson', status: 'PRESENT', remarks: '' },
    { id: 'st3', rollNumber: '103', name: 'Sophia Miller', status: 'ABSENT', remarks: 'Unexcused illness' },
    { id: 'st4', rollNumber: '104', name: 'James Wilson', status: 'LATE', remarks: '15 mins late' },
    { id: 'st5', rollNumber: '105', name: 'Emma Taylor', status: 'PRESENT', remarks: '' },
  ]);

  // Marks Entry State
  const [maxMarks] = useState(100);
  const [passMarks] = useState(40);
  const [isAssessmentPublished, setIsAssessmentPublished] = useState(false);
  const [marksList, setMarksList] = useState([
    { id: 'st1', rollNumber: '101', name: 'John Doe', marks: '88', isAbsent: false },
    { id: 'st2', rollNumber: '102', name: 'Robert Johnson', marks: '94', isAbsent: false },
    { id: 'st3', rollNumber: '103', name: 'Sophia Miller', marks: '32', isAbsent: false },
    { id: 'st4', rollNumber: '104', name: 'James Wilson', marks: '75', isAbsent: false },
    { id: 'st5', rollNumber: '105', name: 'Emma Taylor', marks: '', isAbsent: true },
  ]);

  const updateAttendanceStatus = (id, newStatus) => {
    if (isLocked) return;
    setAttendanceList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const markAllPresent = () => {
    if (isLocked) return;
    setAttendanceList((prev) => prev.map((item) => ({ ...item, status: 'PRESENT' })));
  };

  const handleLockSession = () => {
    setIsLocked(true);
  };

  const computeGrade = (marks, isAbsent) => {
    if (isAbsent) return { grade: 'AB', points: 0.0, color: 'text-rose-600 font-semibold' };
    const num = parseFloat(marks);
    if (isNaN(num)) return { grade: '-', points: 0.0, color: 'text-slate-400' };
    if (num >= 90) return { grade: 'A+', points: 10.0, color: 'text-emerald-600 font-bold' };
    if (num >= 80) return { grade: 'A', points: 9.0, color: 'text-emerald-500 font-semibold' };
    if (num >= 70) return { grade: 'B', points: 8.0, color: 'text-blue-600 font-semibold' };
    if (num >= 60) return { grade: 'C', points: 7.0, color: 'text-amber-600 font-semibold' };
    if (num >= passMarks) return { grade: 'D', points: 5.0, color: 'text-amber-700' };
    return { grade: 'F', points: 0.0, color: 'text-rose-600 font-bold' };
  };

  const handleMarksChange = (id, value) => {
    if (isAssessmentPublished) return;
    const num = Number(value);
    if (value !== '' && (isNaN(num) || num < 0 || num > maxMarks)) {
      return; // Boundary check enforced directly
    }
    setMarksList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, marks: value, isAbsent: false } : item))
    );
  };

  const toggleAbsent = (id) => {
    if (isAssessmentPublished) return;
    setMarksList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAbsent: !item.isAbsent, marks: !item.isAbsent ? '' : '0' } : item
      )
    );
  };

  const presentCount = attendanceList.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendanceList.filter((a) => a.status === 'ABSENT').length;
  const lateCount = attendanceList.filter((a) => a.status === 'LATE').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        institutionName={activeMembership?.institution_name || 'Apex Model High School'}
        userEmail={user?.email || 'faculty@apex.edu'}
        userRole="Faculty / Teacher"
        memberships={memberships}
        activeInstitutionId={activeInstitutionId}
        onSwitchInstitution={switchInstitution}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Faculty Academic Portal</h1>
            <p className="text-sm text-slate-600 mt-1">
              Roll call management, session locking, and assessment grading sheets.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-6 space-x-6">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Attendance Roll Call
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'marks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Marks & Grading Sheet
          </button>
        </div>

        {/* Tab 1: Attendance Roll Call */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Target Cohort</label>
                  <select
                    value={selectedCohort}
                    onChange={(e) => setSelectedCohort(e.target.value)}
                    className="mt-1 border border-slate-300 rounded-md text-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Grade 10 - Section A">Grade 10 - Section A</option>
                    <option value="Grade 10 - Section B">Grade 10 - Section B</option>
                    <option value="CS-301 Data Structures">CS-301 Data Structures (Lecture 3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="mt-1 border border-slate-300 rounded-md text-sm py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center space-x-3">
                {isLocked ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Session Locked (Audit Enforced)
                  </span>
                ) : (
                  <>
                    <Button variant="secondary" onClick={markAllPresent}>
                      Mark All Present
                    </Button>
                    <Button variant="primary" onClick={handleLockSession}>
                      Submit & Lock Session
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Attendance Counter Banner */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-emerald-700">{presentCount}</div>
                <div className="text-xs font-medium text-emerald-600">Present</div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-rose-700">{absentCount}</div>
                <div className="text-xs font-medium text-rose-600">Absent</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-amber-700">{lateCount}</div>
                <div className="text-xs font-medium text-amber-600">Late</div>
              </div>
            </div>

            {/* Roll Call Grid */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Roll #</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {attendanceList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">{st.rollNumber}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{st.name}</td>
                      <td className="px-6 py-4">
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                          {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              disabled={isLocked}
                              onClick={() => updateAttendanceStatus(st.id, status)}
                              className={`px-3 py-1 text-xs font-medium border first:rounded-l-md last:rounded-r-md transition-colors ${
                                st.status === status
                                  ? status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : status === 'ABSENT'
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : status === 'LATE'
                                    ? 'bg-amber-500 text-white border-amber-500'
                                    : 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 disabled:opacity-50'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{st.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Marks Entry Spreadsheet */}
        {activeTab === 'marks' && (
          <div className="space-y-6">
            {/* Header / Assessment Metadata */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Midterm Mathematics Examination</h3>
                <p className="text-xs text-slate-500">
                  Maximum: {maxMarks} Marks • Passing Threshold: {passMarks} Marks • Grading Scale: Standard 10-Point GPA
                </p>
              </div>

              <div>
                {isAssessmentPublished ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    Results Published & Locked
                  </span>
                ) : (
                  <Button variant="primary" onClick={() => setIsAssessmentPublished(true)}>
                    Publish Results
                  </Button>
                )}
              </div>
            </div>

            {/* Marks Grid */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Roll #</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Marks Obtained (Max {maxMarks})</th>
                    <th className="px-6 py-3">Absent?</th>
                    <th className="px-6 py-3">Grade</th>
                    <th className="px-6 py-3">Grade Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {marksList.map((st) => {
                    const gradeInfo = computeGrade(st.marks, st.isAbsent);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono font-semibold text-slate-800">{st.rollNumber}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{st.name}</td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            disabled={isAssessmentPublished || st.isAbsent}
                            value={st.marks}
                            onChange={(e) => handleMarksChange(st.id, e.target.value)}
                            placeholder={st.isAbsent ? 'Absent' : '0'}
                            className={`w-24 px-3 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              st.isAbsent ? 'bg-slate-100 text-slate-400 border-slate-200' : 'border-slate-300'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={st.isAbsent}
                            disabled={isAssessmentPublished}
                            onChange={() => toggleAbsent(st.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className={gradeInfo.color}>{gradeInfo.grade}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                          {gradeInfo.points.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
