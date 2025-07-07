import React from 'react';
import { useApp } from '../context/AppContext';
import { capitalizeWords } from '../lib/capitalizeWords';

const TestHoursCalculations: React.FC = () => {
  const { staff, briefs } = useApp();

  // Helper to calculate available hours for a staff member (same as in BriefWorkflow)
  const getStaffAvailableHoursForBrief = (staffMember: any, currentBrief: any): number => {
    // Calculate hours from calendar entries (all time, not just current month)
    let bookedHours = 0;
    if (staffMember.calendar && Array.isArray(staffMember.calendar)) {
      bookedHours = staffMember.calendar.reduce((sum: number, entry: any) => {
        const entryStart = new Date(entry.startTime);
        const entryEnd = new Date(entry.endTime);
        const duration = (entryEnd.getTime() - entryStart.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);
    }
    
    // Calculate hours from ALL assigned briefs (not just current month)
    const assignedBriefsHours = briefs
      .filter((b: any) => 
        b.assignedStaff?.includes(staffMember.id) && 
        b.id !== currentBrief?.id // Exclude current brief being assigned
      )
      .reduce((sum: number, assignedBrief: any) => {
        // Sum shoot and edit hours from estimated hours
        const shootHours = assignedBrief.estimatedHours?.shoot || 0;
        const editHours = assignedBrief.estimatedHours?.edit || 0;
        return sum + shootHours + editHours;
      }, 0);
    
    const totalBookedHours = bookedHours + assignedBriefsHours;
    return Math.max(0, staffMember.monthlyAvailableHours - totalBookedHours);
  };

  // Helper to calculate dynamic available hours (same as in StaffPage)
  const getDynamicAvailableHours = (member: any): number => {
    // Calculate hours from calendar entries (all time, not just current month)
    let bookedHours = 0;
    if (member.calendar && Array.isArray(member.calendar)) {
      bookedHours = member.calendar.reduce((sum: number, entry: any) => {
        const entryStart = new Date(entry.startTime);
        const entryEnd = new Date(entry.endTime);
        const duration = (entryEnd.getTime() - entryStart.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);
    }
    
    // Calculate hours from ALL assigned briefs (not just current month)
    const assignedBriefsHours = briefs
      .filter((b: any) => b.assignedStaff?.includes(member.id))
      .reduce((sum: number, brief: any) => {
        const shootHours = brief.estimatedHours?.shoot || 0;
        const editHours = brief.estimatedHours?.edit || 0;
        return sum + shootHours + editHours;
      }, 0);
    
    const totalBookedHours = bookedHours + assignedBriefsHours;
    return Math.max(0, member.monthlyAvailableHours - totalBookedHours);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Hours Calculations Test</h2>
      
      <div className="space-y-6">
        {/* Staff Summary */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Staff Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map(member => {
              const dynamicAvailableHours = getDynamicAvailableHours(member);
              const totalBookedHours = member.monthlyAvailableHours - dynamicAvailableHours;
              const isOverbooked = dynamicAvailableHours < 0;
              
              return (
                <div key={member.id} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">{capitalizeWords(member.name)}</h4>
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    <div>Capacity: {member.monthlyAvailableHours}h</div>
                    <div>Booked: {totalBookedHours.toFixed(1)}h</div>
                    <div className={`font-medium ${isOverbooked ? 'text-red-600' : 'text-green-600'}`}>
                      Available: {isOverbooked ? `${Math.abs(dynamicAvailableHours).toFixed(1)}h overbooked` : `${dynamicAvailableHours.toFixed(1)}h`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Briefs Summary */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Briefs Summary</h3>
          <div className="space-y-3">
            {briefs.map(brief => {
              const totalHours = (brief.estimatedHours?.shoot || 0) + (brief.estimatedHours?.edit || 0);
              const assignedStaffMembers = staff.filter(s => brief.assignedStaff?.includes(s.id));
              
              return (
                <div key={brief.id} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">{brief.title}</h4>
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    <div>Total Hours: {totalHours}h (Shoot: {brief.estimatedHours?.shoot || 0}h, Edit: {brief.estimatedHours?.edit || 0}h)</div>
                    <div>Assigned Staff: {assignedStaffMembers.length}</div>
                    {assignedStaffMembers.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-gray-700 mb-1">Staff Details:</div>
                        {assignedStaffMembers.map(staffMember => {
                          const availableHours = getStaffAvailableHoursForBrief(staffMember, brief);
                          const canHandle = availableHours >= totalHours;
                          
                          return (
                            <div key={staffMember.id} className="text-xs ml-2 mb-1">
                              • {capitalizeWords(staffMember.name)}: {availableHours.toFixed(1)}h available 
                              {!canHandle && <span className="text-red-600"> (insufficient for {totalHours}h)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Consistency Check */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Data Consistency Check</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Staff:</span>
              <span className="font-medium">{staff.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Briefs:</span>
              <span className="font-medium">{briefs.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Briefs with Assignments:</span>
              <span className="font-medium">
                {briefs.filter(b => b.assignedStaff && b.assignedStaff.length > 0).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Staff with Valid Hours:</span>
              <span className="font-medium">
                {staff.filter(s => s.monthlyAvailableHours > 0).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Briefs with Valid Hours:</span>
              <span className="font-medium">
                {briefs.filter(b => b.estimatedHours && (b.estimatedHours.shoot > 0 || b.estimatedHours.edit > 0)).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Overbooked Staff:</span>
              <span className="font-medium text-red-600">
                {staff.filter(s => getDynamicAvailableHours(s) < 0).length}
              </span>
            </div>
          </div>
        </div>

        {/* Raw Data Debug */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Raw Data Debug</h3>
          <details className="text-sm">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Show Raw Data</summary>
            <div className="mt-2 space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Staff Data:</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(staff, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Briefs Data:</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(briefs, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default TestHoursCalculations; 