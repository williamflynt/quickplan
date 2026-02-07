import { CalendarConfig, ResourceCalendar, CpmResult, ResourceAssignment, ResourceScheduleRow } from './types.js';
/**
 * Schedule resources with calendar awareness.
 *
 * Takes CPM results (abstract offsets) and maps them to real calendar dates,
 * respecting per-resource workdays, holidays, and PTO.
 *
 * For each resource:
 * 1. Sort their tasks by CPM earliest start
 * 2. Track when the resource is next available (calendar date)
 * 3. Each task starts at the later of:
 *    (a) its CPM earliest start mapped to a calendar date
 *    (b) when the resource is next available
 * 4. Record both offset and date for each task
 */
export declare function scheduleResources(cpmResults: CpmResult[], assignments: ResourceAssignment[], config: CalendarConfig, resourceCalendars: ResourceCalendar[]): ResourceScheduleRow[];
