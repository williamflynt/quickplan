/**
 * Short weekday abbreviations matching user DSL input.
 * m=Monday, t=Tuesday, w=Wednesday, th=Thursday, f=Friday, s=Saturday, su=Sunday
 */
export type Weekday = 'm' | 't' | 'w' | 'th' | 'f' | 's' | 'su';
export declare const ALL_WEEKDAYS: Weekday[];
export declare const DEFAULT_WORKDAYS: Weekday[];
export type CalendarConfig = {
    startDate: string;
    defaultWorkdays: Weekday[];
    holidays: string[];
};
export type ResourceCalendar = {
    resourceName: string;
    workdays?: Weekday[];
    pto: string[];
};
export type DateRange = {
    start: string;
    end: string;
};
export type ScheduledDate = {
    offset: number;
    date: string;
};
export type DateAxisEntry = {
    date: string;
    offset: number | null;
    type: 'working' | 'weekend' | 'holiday';
};
export type CpmResult = {
    taskId: string;
    earliestStart: number;
    duration: number;
    isCritical: boolean;
    done: boolean;
    doneDate?: string;
};
export type ResourceAssignment = {
    resourceName: string;
    taskId: string;
};
export type ScheduledTask = {
    taskId: string;
    taskName: string;
    resourceName: string;
    startOffset: number;
    finishOffset: number;
    startDate: string;
    finishDate: string;
    duration: number;
    isCritical: boolean;
    done: boolean;
};
export type ResourceScheduleRow = {
    resourceName: string;
    tasks: ScheduledTask[];
    totalWorkingDays: number;
    calendarSpan: number;
};
