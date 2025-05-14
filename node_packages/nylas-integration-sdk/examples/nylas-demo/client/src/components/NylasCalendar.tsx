import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Calendar, Clock, Plus, Edit, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';
import { NylasAccountInfo } from './NylasAccountInfo';
import DOMPurify from 'dompurify';
import { 
  nylasApi, 
  createDefaultFormData,
  formatDateTime,
  formatDateRange, 
  formatDateStringRange,
  unixToLocalISOString,
  localISOStringToUnix,
  eventFormToApiData
} from '../services/nylasApi';
import type { 
  NylasCalendar as NylasCalendarType, 
  CalendarEvent,
  EventFormData,
  ConflictCheckResult,
} from '../services/nylasApi';

const timezones = [
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function NylasCalendar() {
  const [connected, setConnected] = useState<boolean>(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<NylasCalendarType[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Loading states for operations
  const [creatingEvent, setCreatingEvent] = useState<boolean>(false);
  const [updatingEvent, setUpdatingEvent] = useState<boolean>(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [connectingCalendar, setConnectingCalendar] = useState<boolean>(false);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState<boolean>(false);
  
  // Event form state
  const [eventFormOpen, setEventFormOpen] = useState<boolean>(false);
  const [eventFormData, setEventFormData] = useState<EventFormData>(createDefaultFormData());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  
  // Conflict detection state
  const [isCheckingConflicts, setIsCheckingConflicts] = useState<boolean>(false);
  const [conflicts, setConflicts] = useState<ConflictCheckResult | null>(null);
  const [conflictCheckTime, setConflictCheckTime] = useState<{
    startTime: string;
    endTime: string;
  }>({
    startTime: (() => {
      const now = new Date();
      return now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + 'T' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');
    })(),
    endTime: (() => {
      const later = new Date(Date.now() + 60 * 60 * 1000);
      return later.getFullYear() + '-' + 
        String(later.getMonth() + 1).padStart(2, '0') + '-' +
        String(later.getDate()).padStart(2, '0') + 'T' +
        String(later.getHours()).padStart(2, '0') + ':' +
        String(later.getMinutes()).padStart(2, '0');
    })(),
  });

  // Add a new state variable for conflict checking loading state
  const [checkingConflictsInDialog, setCheckingConflictsInDialog] = useState<boolean>(false);

  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setLoading(true);
    try {
      const data = await nylasApi.checkConnectionStatus();
      setConnected(data.connected);
      
      if (data.connected) {
        await fetchCalendars();
        await fetchEvents();
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to check connection status"
      });
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const calendars = await nylasApi.getCalendars();
      setCalendars(calendars);
      
      // Set default calendar to primary
      const primaryCalendar = calendars.find(cal => cal.isPrimary);
      if (primaryCalendar) {
        setEventFormData(prev => ({ ...prev, calendarId: primaryCalendar.id }));
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Calendar Error",
        description: "Failed to fetch calendars"
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const events = await nylasApi.getEvents();
      setEvents(events);
      setLoading(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Event Error",
        description: "Failed to fetch calendar events"
      });
      setLoading(false);
    }
  };

  const connectCalendar = async () => {
    try {
      setConnectingCalendar(true);
      const data = await nylasApi.getAuthUrl();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to get authentication URL"
      });
      setConnectingCalendar(false);
    }
  };

  const disconnectCalendar = async () => {
    try {
      setDisconnectingCalendar(true);
      await nylasApi.disconnectCalendar();
      
      // Clear local state
      setConnected(false);
      setEvents([]);
      setCalendars([]);
      setDisconnectingCalendar(false);
      
      toast({
        variant: "success",
        title: "Disconnected",
        description: "Calendar has been disconnected successfully"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Disconnection Error",
        description: "Failed to disconnect properly"
      });
      setDisconnectingCalendar(false);
    }
  };

  const createEvent = async () => {
    try {
      setCreatingEvent(true);
      
      // Convert form data to API format
      const eventData = eventFormToApiData(eventFormData);
      
      await nylasApi.createEvent(eventData);
      
      setEventFormOpen(false);
      setEventFormData(createDefaultFormData());
      await fetchEvents();
      setCreatingEvent(false);
      
      toast({
        variant: "success",
        title: "Event Created",
        description: "Your event has been created successfully"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Creation Error",
        description: "Failed to create event"
      });
      setCreatingEvent(false);
    }
  };

  const updateEvent = async () => {
    try {
      if (!currentEventId) return;
      
      setUpdatingEvent(true);
      
      // Convert form data to API format
      const eventData = eventFormToApiData(eventFormData);
      
      await nylasApi.updateEvent(currentEventId, eventData);
      
      setEventFormOpen(false);
      setEventFormData(createDefaultFormData());
      setIsEditing(false);
      setCurrentEventId(null);
      await fetchEvents();
      setUpdatingEvent(false);
      
      toast({
        variant: "success",
        title: "Event Updated",
        description: "Your event has been updated successfully"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Error",
        description: "Failed to update event"
      });
      setUpdatingEvent(false);
    }
  };

  const deleteEvent = async (eventId: string, calendarId: string) => {
    try {
      console.log(`Deleting event ID: ${eventId} from calendar ID: ${calendarId}`);
      
      // Ensure calendarId is not undefined
      if (!calendarId) {
        toast({
          variant: "destructive",
          title: "Deletion Error",
          description: "Cannot delete event: missing calendar ID"
        });
        return;
      }
      
      setDeletingEventId(eventId);
      
      await nylasApi.deleteEvent(eventId, calendarId);
      
      await fetchEvents();
      setDeletingEventId(null);
      
      toast({
        variant: "success",
        title: "Event Deleted",
        description: "Your event has been deleted successfully"
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Deletion Error",
        description: `Failed to delete event: ${err.message}`
      });
      setDeletingEventId(null);
    }
  };

  const openCreateEventForm = async () => {
    setIsEditing(false);
    setCurrentEventId(null);
    
    // Set default form data with primary calendar
    const primaryCalendar = calendars.find(cal => cal.isPrimary);
    
    // Create default start and end times (now and +1 hour)
    const now = new Date();
    const roundedNow = new Date(now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0));
    const oneHourLater = new Date(roundedNow.getTime() + 60 * 60 * 1000);
    
    // Format times for datetime-local inputs in local time zone rather than UTC
    // This ensures the displayed time matches the user's local time
    const localStartTime = roundedNow.getFullYear() + '-' + 
      String(roundedNow.getMonth() + 1).padStart(2, '0') + '-' +
      String(roundedNow.getDate()).padStart(2, '0') + 'T' +
      String(roundedNow.getHours()).padStart(2, '0') + ':' +
      String(roundedNow.getMinutes()).padStart(2, '0');
    
    const localEndTime = oneHourLater.getFullYear() + '-' + 
      String(oneHourLater.getMonth() + 1).padStart(2, '0') + '-' +
      String(oneHourLater.getDate()).padStart(2, '0') + 'T' +
      String(oneHourLater.getHours()).padStart(2, '0') + ':' +
      String(oneHourLater.getMinutes()).padStart(2, '0');
    
    // Get Unix timestamps for conflict checking
    const startTimestamp = Math.floor(roundedNow.getTime() / 1000);
    const endTimestamp = Math.floor(oneHourLater.getTime() / 1000);
    
    // Use local timezone
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const newFormData = {
      ...createDefaultFormData(),
      startTime: localStartTime,
      endTime: localEndTime,
      calendarId: primaryCalendar ? primaryCalendar.id : (calendars[0]?.id || ''),
      timezone: localTimezone,
    };
    
    console.log('Create event default times:', {
      startDateTime: localStartTime,
      endDateTime: localEndTime,
      startTimestamp,
      endTimestamp,
      timezone: localTimezone
    });
    
    setEventFormData(newFormData);
    setEventFormOpen(true);
    
    // Check for conflicts immediately when the dialog opens
    try {
      setCheckingConflictsInDialog(true);
      
      const requestData = {
        startTime: startTimestamp,
        endTime: endTimestamp,
        calendarId: newFormData.calendarId,
      };
      
      console.log('Conflict check request (create event):', requestData);
      
      const conflictResult = await nylasApi.checkTimeConflicts(requestData);
      console.log('Conflict check response (create event):', conflictResult);
      
      setConflicts(conflictResult);
    } catch (err) {
      console.error("Error checking for conflicts on form open:", err);
    } finally {
      setCheckingConflictsInDialog(false);
    }
  };

  const openEditEventForm = async (event: CalendarEvent) => {
    setIsEditing(true);
    setCurrentEventId(event.id);
    
    // Get timezone from event or use local timezone as fallback
    const eventTimezone = event.when.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Convert Unix timestamps to local ISO strings for datetime-local inputs
    const startDateTime = unixToLocalISOString(event.when.startTime);
    const endDateTime = unixToLocalISOString(event.when.endTime);
    
    // For conflict checking, use the original Unix timestamps
    const startTimestamp = event.when.startTime;
    const endTimestamp = event.when.endTime;
    
    console.log('Edit event time conversion:', {
      originalStartTimestamp: startTimestamp,
      originalEndTimestamp: endTimestamp,
      isoStartDateTime: startDateTime,
      isoEndDateTime: endDateTime,
      localDisplay: formatDateTime(startTimestamp || 0),
      timezone: eventTimezone
    });
    
    // Set form data with converted times
    const newFormData = {
      title: event.title || '',
      description: event.description || '',
      calendarId: event.calendarId,
      startTime: startDateTime,
      endTime: endDateTime,
      timezone: eventTimezone,
    };
    
    setEventFormData(newFormData);
    setEventFormOpen(true);
    
    // Check for conflicts immediately when editing (excluding the current event)
    try {
      setCheckingConflictsInDialog(true);
      
      if (!startTimestamp || !endTimestamp) {
        console.error("Missing start or end time for conflict check");
        return;
      }
      
      const requestData = {
        // Use the original timestamps for conflict detection
        startTime: startTimestamp,
        endTime: endTimestamp,
        calendarId: newFormData.calendarId,
        excludeEventId: event.id
      };
      
      console.log('Conflict check request (edit event):', requestData);
      
      const conflictResult = await nylasApi.checkTimeConflicts(requestData);
      console.log('Conflict check response (edit event):', conflictResult);
      
      setConflicts(conflictResult);
    } catch (err) {
      console.error("Error checking for conflicts on form open:", err);
    } finally {
      setCheckingConflictsInDialog(false);
    }
  };

  const handleFormChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventFormData(prev => ({ ...prev, [name]: value }));
    
    // Automatically check for conflicts when start or end time changes
    if ((name === 'startTime' || name === 'endTime') && eventFormData.startTime && eventFormData.endTime) {
      // Debounce to avoid too many API calls
      const timeoutId = setTimeout(async () => {
        setCheckingConflictsInDialog(true);
        try {
          const conflictResult = await checkEventConflicts();
          setConflicts(conflictResult);
        } finally {
          setCheckingConflictsInDialog(false);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleCalendarSelect = (value: string) => {
    setEventFormData(prev => ({ ...prev, calendarId: value }));
  };

  const handleTimezoneSelect = (value: string) => {
    setEventFormData(prev => ({ ...prev, timezone: value }));
  };

  const getCalendarName = (calendarId: string) => {
    if (!calendarId) {
      console.warn('Calendar ID is missing for event');
      return 'Untitled Calendar';
    }
    
    // First try finding calendar by exact ID match
    const calendar = calendars.find(cal => cal.id === calendarId);
    if (calendar?.name) {
      return calendar.name;
    }
    
    // If not found, try matching the end of the ID (sometimes IDs have prefixes)
    const partialMatchCalendar = calendars.find(cal => 
      calendarId.endsWith(cal.id) || cal.id.endsWith(calendarId)
    );
    
    if (partialMatchCalendar?.name) {
      return partialMatchCalendar.name;
    }
    
    console.warn(`Calendar not found for ID: ${calendarId}`);
    return 'Calendar';
  };

  // Sort calendars to ensure primary calendar appears first
  const sortedCalendars = [...calendars].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredEvents = selectedCalendar === 'all' 
    ? events 
    : events.filter(event => event.calendarId === selectedCalendar);

  // Conflict detection functions
  const checkForConflicts = async (startTime: string, endTime: string) => {
    try {
      setIsCheckingConflicts(true);
      
      // Convert ISO strings from date inputs to Unix timestamps
      const startTimestamp = localISOStringToUnix(startTime);
      const endTimestamp = localISOStringToUnix(endTime);
      
      const requestData = {
        startTime: startTimestamp,
        endTime: endTimestamp,
      };
      
      console.log('Conflict check request (standalone section):', requestData);
      
      const conflictResult = await nylasApi.checkTimeConflicts(requestData);
      console.log('Conflict check response (standalone section):', conflictResult);
      setConflicts(conflictResult);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Conflict Check Error",
        description: "Failed to check for calendar conflicts"
      });
      setConflicts(null);
    } finally {
      setIsCheckingConflicts(false);
    }
  };
  
  // Check for conflicts when creating/updating events
  const checkEventConflicts = async () => {
    if (!eventFormData.startTime || !eventFormData.endTime) return null;
    
    try {
      // Convert ISO strings from form to Unix timestamps
      const startTimestamp = localISOStringToUnix(eventFormData.startTime);
      const endTimestamp = localISOStringToUnix(eventFormData.endTime);
      
      const requestData = {
        startTime: startTimestamp,
        endTime: endTimestamp,
        calendarId: eventFormData.calendarId,
        excludeEventId: isEditing ? currentEventId || undefined : undefined
      };
      
      console.log('Conflict check request (dialog time change):', requestData);
      console.log('Form data state:', {
        formStartTime: eventFormData.startTime,
        formEndTime: eventFormData.endTime,
        formTimezone: eventFormData.timezone,
        convertedStartTimestamp: startTimestamp,
        convertedEndTimestamp: endTimestamp
      });
      
      return await nylasApi.checkTimeConflicts(requestData);
    } catch (err) {
      console.error("Error checking for conflicts:", err);
      return null;
    }
  };
  
  const handleConflictCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkForConflicts(conflictCheckTime.startTime, conflictCheckTime.endTime);
  };
  
  const handleConflictCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConflictCheckTime(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to sanitize and render HTML content safely
  const renderHtml = (html: string | undefined) => {
    if (!html) return null;
    
    // Sanitize the HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class']
    });
    
    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  };

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      {/* Show account info when connected */}
      {connected && <div className="mb-6"><NylasAccountInfo /></div>}
      
      {/* Add conflict detection section between account info and calendar */}
      {connected && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Calendar Conflict Detection
            </CardTitle>
            <CardDescription>
              Check for scheduling conflicts in your calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConflictCheckSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    value={conflictCheckTime.startTime}
                    onChange={handleConflictCheckChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="datetime-local"
                    value={conflictCheckTime.endTime}
                    onChange={handleConflictCheckChange}
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isCheckingConflicts}>
                {isCheckingConflicts ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Check for Conflicts
              </Button>
              
              {conflicts && (
                <div className={`mt-4 p-4 rounded-lg ${conflicts.hasConflict ? 'bg-orange-100 border border-orange-200' : 'bg-green-100 border border-green-200'}`}>
                  {conflicts.hasConflict ? (
                    <div>
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                        <h4 className="text-orange-700 font-medium">Conflicts Detected</h4>
                      </div>
                      <p className="text-sm mb-3">There are {conflicts.conflictingEvents.length} events that conflict with this time:</p>
                      <div className="space-y-2">
                        {conflicts.conflictingEvents.map(event => (
                          <div key={event.id} className="bg-white p-3 rounded shadow-sm">
                            <h5 className="font-medium">{event.title || 'Untitled Event'}</h5>
                            <p className="text-xs text-gray-500">
                              {formatDateRange(event.when.startTime, event.when.endTime)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-green-700">No conflicts detected for this time period.</p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your calendar to view and manage events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : connected ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">Calendar Connected</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => disconnectCalendar()}
                  disabled={disconnectingCalendar}
                >
                  {disconnectingCalendar ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Disconnect
                </Button>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="calendarFilter">Calendar:</Label>
                  <Select value={selectedCalendar} onValueChange={(value: string) => setSelectedCalendar(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Calendars</SelectItem>
                      {sortedCalendars.map(calendar => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          <div className="flex items-center">
                            <div 
                              className="h-3 w-3 rounded-full mr-2 flex-shrink-0" 
                              style={{ 
                                backgroundColor: calendar.hexColor || '#CBD5E1',
                                border: '1px solid ' + (calendar.hexForegroundColor || '#94A3B8')
                              }} 
                            />
                            {calendar.name}
                            {calendar.isPrimary && <span className="ml-2 text-xs text-muted-foreground">(Primary)</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={openCreateEventForm} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Event
                </Button>
              </div>
              
              {filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Calendar Events</h3>
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-base font-semibold mb-1">{event.title || 'Untitled Event'}</h4>
                              {selectedCalendar === 'all' && (
                                <p className="text-xs text-muted-foreground mb-1 flex items-center">
                                  {(() => {
                                    const cal = calendars.find(c => c.id === event.calendarId);
                                    return (
                                      <>
                                        <span 
                                          className="inline-block h-2 w-2 rounded-full mr-1"
                                          style={{ 
                                            backgroundColor: cal?.hexColor || '#CBD5E1' 
                                          }}
                                        />
                                        {getCalendarName(event.calendarId)}
                                        {cal?.isPrimary && <span className="ml-1">(Primary)</span>}
                                      </>
                                    );
                                  })()}
                                </p>
                              )}
                              {event.when.object === 'timespan' && event.when.startTime && event.when.endTime && (
                                <p className="text-sm text-muted-foreground flex items-center mb-2">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {formatDateRange(event.when.startTime, event.when.endTime)}
                                </p>
                              )}
                              {event.when.object === 'datespan' && event.when.startDate && event.when.endDate && (
                                <p className="text-sm text-muted-foreground flex items-center mb-2">
                                  <Calendar className="h-3.5 w-3.5 mr-1" />
                                  {formatDateStringRange(event.when.startDate, event.when.endDate)}
                                </p>
                              )}
                              {event.description && (
                                <div className="text-sm description-container">
                                  {renderHtml(event.description)}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditEventForm(event)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteEvent(event.id, event.calendarId)}
                                disabled={deletingEventId === event.id}
                              >
                                {deletingEventId === event.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">No events found</div>
              )}
            </div>
          ) : (
            <div className="py-6">
              <p className="mb-4 text-muted-foreground">Connect your calendar to view and manage your events</p>
              <Button 
                onClick={connectCalendar}
                disabled={connectingCalendar}
              >
                {connectingCalendar ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Connect Calendar
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded">
              {error}
              <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Event Form Dialog */}
      <Dialog open={eventFormOpen} onOpenChange={setEventFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                value={eventFormData.title}
                onChange={handleFormChange}
                placeholder="Meeting with Team"
              />
            </div>
            
            {!isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="calendarId">Calendar</Label>
                <Select 
                  value={eventFormData.calendarId} 
                  onValueChange={handleCalendarSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedCalendars.map(calendar => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        <div className="flex items-center">
                          <div 
                            className="h-3 w-3 rounded-full mr-2 flex-shrink-0" 
                            style={{ 
                              backgroundColor: calendar.hexColor || '#CBD5E1',
                              border: '1px solid ' + (calendar.hexForegroundColor || '#94A3B8')
                            }} 
                          />
                          {calendar.name}
                          {calendar.isPrimary && <span className="ml-2 text-xs text-muted-foreground">(Primary)</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                value={eventFormData.startTime}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="datetime-local"
                value={eventFormData.endTime}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={eventFormData.timezone} 
                onValueChange={handleTimezoneSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Show loading indicator while checking conflicts */}
            {checkingConflictsInDialog && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
                <p className="text-sm text-blue-700">Checking for scheduling conflicts...</p>
              </div>
            )}
            
            {/* Add conflict information to event form */}
            {conflicts && !checkingConflictsInDialog && (
              <div className={conflicts.hasConflict 
                ? "bg-orange-100 border border-orange-200 p-3 rounded-lg"
                : "bg-green-100 border border-green-200 p-3 rounded-lg"
              }>
                {conflicts.hasConflict ? (
                  <>
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                      <h4 className="text-sm text-orange-700 font-medium">Scheduling Conflict</h4>
                    </div>
                    <p className="text-xs text-orange-600 mb-2">
                      The selected time conflicts with {conflicts.conflictingEvents.length} existing event(s).
                    </p>
                    <div className="max-h-24 overflow-y-auto">
                      {conflicts.conflictingEvents.map(event => (
                        <div key={event.id} className="text-xs mb-1">
                          <span className="font-medium">{event.title || 'Untitled'}</span>: {' '}
                          {formatDateRange(event.when.startTime, event.when.endTime)}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-sm text-green-700">No scheduling conflicts for this time slot.</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={eventFormData.description}
                onChange={handleFormChange}
                placeholder="Event details..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventFormOpen(false)} disabled={creatingEvent || updatingEvent}>
              Cancel
            </Button>
            <Button 
              onClick={isEditing ? updateEvent : createEvent}
              disabled={creatingEvent || updatingEvent}
            >
              {(creatingEvent || updatingEvent) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 