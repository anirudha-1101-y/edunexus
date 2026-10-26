import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { erpService } from '../../services/erpService';
import { ClassSectionUnit, CollegeDepartmentUnit } from '../../types/erp';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Building2,
  Users,
  Plus,
  UserCheck,
  DoorOpen,
  Layers,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';

export default function ClassesAndSectionsPage() {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'school' | 'college'>('school');
  const [classes, setClasses] = useState<ClassSectionUnit[]>([]);
  const [departments, setDepartments] = useState<CollegeDepartmentUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // New Class Form Modal State
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newSequence, setNewSequence] = useState(12);
  const [newSectionName, setNewSectionName] = useState('Section A');
  const [newRoom, setNewRoom] = useState('Room 301');
  const [newTeacher, setNewTeacher] = useState('Sarah Jenkins');

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsData, deptData] = await Promise.all([
        erpService.getClassSections(),
        erpService.getCollegeDepartments(),
      ]);
      setClasses(clsData);
      setDepartments(deptData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) {
      error('Class Name Required', 'Please provide a grade/class standard title.');
      return;
    }
    const created = await erpService.createClassSection(
      newClassName,
      newSequence,
      newSectionName,
      newRoom,
      newTeacher
    );
    setClasses([...classes, created]);
    setAddClassOpen(false);
    success('Class Created', `${newClassName} with ${newSectionName} provisioned.`);
    setNewClassName('');
  };

  return (
    <MainLayout>
      <PageHeader
        title="Classes, Sections & College Departments"
        subtitle="Dual-model academic structure supporting standard K-12 grades & classrooms alongside higher education credit-based departments & courses."
        breadcrumbs={[{ label: 'Classes & Sections' }]}
        actions={
          <button
            onClick={() => setAddClassOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Class / Grade
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          title="K-12 School Standards"
          value={classes.length}
          subtitle="Grades 9 through 11"
          icon={BookOpen}
          colorTheme="blue"
        />
        <DashboardCard
          title="Classroom Sections"
          value={classes.reduce((acc, c) => acc + c.sections.length, 0)}
          subtitle="Homeroom Cohort Divisions"
          icon={Layers}
          colorTheme="emerald"
        />
        <DashboardCard
          title="College Departments"
          value={departments.length}
          subtitle="Higher-Ed Academic Branches"
          icon={Building2}
          colorTheme="indigo"
        />
        <DashboardCard
          title="Total Active Courses"
          value={departments.reduce((acc, d) => acc + d.coursesCount, 0)}
          subtitle="Lecture & Lab Catalog Entries"
          icon={GraduationCap}
          colorTheme="slate"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6">
        <button
          onClick={() => setActiveTab('school')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'school' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          K-12 Classes & Sections ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('college')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'college' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          College Departments & Course Catalogs ({departments.length})
        </button>
      </div>

      {/* Tab 1: K-12 School Classes */}
      {activeTab === 'school' && (
        <div className="space-y-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{cls.className}</h3>
                  <span className="text-xs text-slate-400">Progression Order: Index {cls.sequenceOrder}</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  {cls.sections.length} Active Sections
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cls.sections.map((sec) => (
                  <div key={sec.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900">{sec.sectionName}</span>
                        <span className="text-xs font-mono font-medium text-slate-500 flex items-center">
                          <DoorOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {sec.roomNumber}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mb-3 flex items-center">
                        <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Teacher: <strong className="ml-1 text-slate-800">{sec.classTeacher}</strong>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Student Capacity:</span>
                      <span className="font-bold text-slate-900">{sec.studentCount} / {sec.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: College Departments & Courses */}
      {activeTab === 'college' && (
        <div className="space-y-6">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center">
                    <Building2 className="w-4 h-4 text-indigo-600 mr-2" />
                    {dept.name} <span className="text-xs text-slate-400 font-normal ml-2 font-mono">({dept.code})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Head of Department: {dept.headOfDepartment}</p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">{dept.programsCount} Degree Programs</span>
                  <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{dept.studentCount} Students</span>
                </div>
              </div>

              {/* Course Catalog Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Course Code</th>
                      <th className="px-4 py-2.5">Course Title</th>
                      <th className="px-4 py-2.5">Semester</th>
                      <th className="px-4 py-2.5">Credit Units</th>
                      <th className="px-4 py-2.5">Faculty Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dept.courses.map((course, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{course.code}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{course.title}</td>
                        <td className="px-4 py-2.5 text-slate-600">Semester {course.semester}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {course.credits} Credits
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 font-medium">{course.faculty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Class */}
      {addClassOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center">
              <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
              Configure New School Class / Standard
            </h3>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard / Class Name *</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  placeholder="e.g. Grade 12"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Progression Index</label>
                  <input
                    type="number"
                    value={newSequence}
                    onChange={(e) => setNewSequence(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Section</label>
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Classroom Room</label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Homeroom Class Teacher</label>
                <input
                  type="text"
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddClassOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
