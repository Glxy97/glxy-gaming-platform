'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  authentication: boolean;
  rateLimit?: string;
  examples: {
    request?: any;
    response: any;
  };
  errorCodes: Array<{
    code: number;
    description: string;
    example: any;
  }>;
}

interface APIDocumentation {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  authentication: {
    type: string;
    header: string;
    description: string;
  };
  rateLimiting: {
    description: string;
    limits: Record<string, string>;
  };
  websocket: {
    endpoint: string;
    description: string;
    authentication: string;
  };
  endpoints: Record<string, APIEndpoint>;
  examples: {
    authentication: {
      description: string;
      steps: Array<{
        step: number;
        description: string;
        endpoint: string;
        curl: string;
      }>;
    };
    websocket: {
      description: string;
      javascript: string;
    };
  };
  errorHandling: {
    description: string;
    format: Record<string, string>;
    commonErrors: Record<string, string>;
  };
  security: {
    description: string;
    features: string[];
  };
}

const ApiDocsViewer: React.FC = () => {
  const [docs, setDocs] = useState<APIDocumentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [openEndpoints, setOpenEndpoints] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDocumentation();
  }, []);

  const fetchDocumentation = async () => {
    try {
      const response = await fetch('/api/docs');
      const data = await response.json();
      setDocs(data);
    } catch (error) {
      console.error('Failed to fetch API documentation:', error);
      toast.error('Failed to load API documentation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const toggleEndpoint = (endpointKey: string) => {
    const newOpenEndpoints = new Set(openEndpoints);
    if (newOpenEndpoints.has(endpointKey)) {
      newOpenEndpoints.delete(endpointKey);
    } else {
      newOpenEndpoints.add(endpointKey);
    }
    setOpenEndpoints(newOpenEndpoints);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'PATCH': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!docs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load API documentation</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{docs.title}</h1>
            <p className="text-xl text-muted-foreground">{docs.description}</p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            v{docs.version}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Base URL: <code className="bg-muted px-1 rounded">{docs.baseUrl}</code></span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/api/docs?format=openapi', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            OpenAPI Spec
          </Button>
        </div>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="websocket">WebSocket</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="errors">Error Handling</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(docs.endpoints).map(([key, endpoint]) => (
              <Card key={key}>
                <Collapsible 
                  open={openEndpoints.has(key)}
                  onOpenChange={() => toggleEndpoint(key)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                          {endpoint.authentication && (
                            <Badge variant="outline" className="text-xs">
                              🔒 Auth Required
                            </Badge>
                          )}
                          {endpoint.rateLimit && (
                            <Badge variant="outline" className="text-xs">
                              ⏱️ {endpoint.rateLimit}
                            </Badge>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openEndpoints.has(key) ? 'rotate-180' : ''}`} />
                      </div>
                      <CardDescription>{endpoint.description}</CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid gap-4">
                        {endpoint.examples.request && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              Request Example
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(
                                  JSON.stringify(endpoint.examples.request, null, 2),
                                  'Request'
                                )}
                              >
                                {copiedText === 'Request' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </h4>
                            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                              <code>{JSON.stringify(endpoint.examples.request, null, 2)}</code>
                            </pre>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            Response Example
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(
                                JSON.stringify(endpoint.examples.response, null, 2),
                                'Response'
                              )}
                            >
                              {copiedText === 'Response' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </h4>
                          <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                            <code>{JSON.stringify(endpoint.examples.response, null, 2)}</code>
                          </pre>
                        </div>

                        {endpoint.errorCodes.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Error Codes</h4>
                            <div className="grid gap-2">
                              {endpoint.errorCodes.map((error) => (
                                <div key={error.code} className="border rounded-md p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="destructive">{error.code}</Badge>
                                    <span className="text-sm font-medium">{error.description}</span>
                                  </div>
                                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                    <code>{JSON.stringify(error.example, null, 2)}</code>
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{docs.authentication.type}</CardTitle>
              <CardDescription>{docs.authentication.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Header Format</h4>
                  <code className="bg-muted p-2 rounded block">{docs.authentication.header}</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground mb-2">{docs.rateLimiting.description}</p>
                  <div className="grid gap-2">
                    {Object.entries(docs.rateLimiting.limits).map(([key, limit]) => (
                      <div key={key} className="flex justify-between items-center py-1">
                        <span className="capitalize">{key}:</span>
                        <Badge variant="outline">{limit}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websocket" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Connection</CardTitle>
              <CardDescription>{docs.websocket.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Endpoint</h4>
                  <code className="bg-muted p-2 rounded block">{docs.websocket.endpoint}</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Authentication</h4>
                  <p className="text-sm text-muted-foreground">{docs.websocket.authentication}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Flow</CardTitle>
                <CardDescription>{docs.examples.authentication.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {docs.examples.authentication.steps.map((step) => (
                    <div key={step.step} className="border rounded-md p-4">
                      <h4 className="font-semibold mb-2">
                        Step {step.step}: {step.description}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">{step.endpoint}</p>
                      <div className="relative">
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          <code>{step.curl}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(step.curl, `Step ${step.step} cURL`)}
                        >
                          {copiedText === `Step ${step.step} cURL` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WebSocket Integration</CardTitle>
                <CardDescription>{docs.examples.websocket.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                    <code>{docs.examples.websocket.javascript}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(docs.examples.websocket.javascript, 'WebSocket Code')}
                  >
                    {copiedText === 'WebSocket Code' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Handling</CardTitle>
              <CardDescription>{docs.errorHandling.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Error Response Format</h4>
                  <div className="grid gap-2">
                    {Object.entries(docs.errorHandling.format).map(([key, description]) => (
                      <div key={key} className="flex items-start gap-2">
                        <code className="bg-muted px-1 rounded text-xs">{key}:</code>
                        <span className="text-sm text-muted-foreground">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Common HTTP Status Codes</h4>
                  <div className="grid gap-2">
                    {Object.entries(docs.errorHandling.commonErrors).map(([code, description]) => (
                      <div key={code} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <Badge variant="outline">{code}</Badge>
                        <span className="text-sm flex-1 ml-3">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Features</CardTitle>
              <CardDescription>{docs.security.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {docs.security.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocsViewer;