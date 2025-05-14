import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AtSign, Calendar, Mail, ExternalLink, User } from 'lucide-react';
import { nylasApi } from '../services/nylasApi';
import type { AccountInfoResponse } from '../services/nylasApi';

export function NylasAccountInfo() {
  const [accountInfo, setAccountInfo] = useState<AccountInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    try {
      const data = await nylasApi.getAccountInfo();
      setAccountInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Loading your Nylas account information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>There was an error loading your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!accountInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>No account information available</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Connect your account to see information</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Nylas Account Information
        </CardTitle>
        <CardDescription>
          Details about your connected calendars and account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="account">
          <TabsList className="mb-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="calendars">Calendars ({accountInfo.stats.totalCalendars})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Account Details</h3>
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span> {accountInfo.account.email}
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Provider:</span> 
                  <Badge variant="outline" className="capitalize">{accountInfo.account.provider}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Primary Calendar:</span> {accountInfo.stats.primaryCalendar}
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Connection Status</h3>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>{accountInfo.account.connectionStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total Calendars:</span> {accountInfo.stats.totalCalendars}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="calendars">
            <div className="space-y-4">
              {accountInfo.calendars.map(calendar => (
                <Card key={calendar.id} className="overflow-hidden">
                  <div 
                    className={`h-2 ${calendar.isPrimary ? 'bg-primary' : 'bg-muted'}`}
                    style={{ 
                      backgroundColor: calendar.hexColor
                    }}
                  ></div>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{calendar.name || 'Unnamed Calendar'}</h3>
                        {calendar.description && (
                          <p className="text-sm text-muted-foreground mt-1">{calendar.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {calendar.isPrimary && <Badge>Primary</Badge>}
                        {calendar.readOnly && <Badge variant="outline">Read-only</Badge>}
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      ID: {calendar.id}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}