import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { performanceCollector, PerformanceReport } from '@/lib/performanceCollector';
import { performanceMonitor, PerformanceMetrics } from '@/lib/performanceMonitor';
import { performanceFlowTracker, FlowMetrics } from '@/lib/performanceFlowTracker';
import { performanceRegressionDetector, RegressionReport } from '@/lib/performanceRegressionDetector';
import { performanceValidation, OptimizationValidationReport } from '@/lib/performanceValidation';
import { bundleAnalyzer, BundleAnalysis } from '@/lib/bundleAnalyzer';

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [bottlenecks, setBottlenecks] = useState<string[]>([]);
  const [flowMetrics, setFlowMetrics] = useState<FlowMetrics[]>([]);
  const [regressionReport, setRegressionReport] = useState<RegressionReport | null>(null);
  const [validationReport, setValidationReport] = useState<OptimizationValidationReport | null>(null);
  const [bundleAnalysis, setBundleAnalysis] = useState<BundleAnalysis | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const refreshData = () => {
    setIsCollecting(true);
    
    // Collect current metrics
    const currentMetrics = performanceCollector.collectMetrics();
    setMetrics(currentMetrics);
    
    // Get performance report
    const currentReport = performanceCollector.getPerformanceReport();
    setReport(currentReport);
    
    // Get bottlenecks
    const currentBottlenecks = performanceMonitor.reportBottlenecks();
    setBottlenecks(currentBottlenecks);
    
    // Get flow metrics
    const currentFlowMetrics = performanceFlowTracker.getAllFlowMetrics();
    setFlowMetrics(currentFlowMetrics);
    
    // Get regression report
    const currentRegressionReport = performanceRegressionDetector.checkForRegressions();
    setRegressionReport(currentRegressionReport);
    
    // Get validation report
    const currentValidationReport = performanceValidation.getLatestValidation();
    setValidationReport(currentValidationReport);
    
    // Get bundle analysis
    const currentBundleAnalysis = bundleAnalyzer.analyzeBundles();
    setBundleAnalysis(currentBundleAnalysis);
    
    setIsCollecting(false);
  };

  const collectBaseline = () => {
    performanceCollector.collectBaseline();
    refreshData();
  };

  const resetData = () => {
    performanceCollector.reset();
    performanceMonitor.reset();
    performanceFlowTracker.clear();
    performanceRegressionDetector.clearHistory();
    setMetrics(null);
    setReport(null);
    setBottlenecks([]);
    setFlowMetrics([]);
    setRegressionReport(null);
  };

  useEffect(() => {
    refreshData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(refreshData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getPerformanceStatus = (value: number, threshold: number, isLowerBetter = true) => {
    const isGood = isLowerBetter ? value <= threshold : value >= threshold;
    return isGood ? 'good' : 'warning';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <div className="space-x-2">
          <Button onClick={refreshData} disabled={isCollecting} size="sm">
            {isCollecting ? 'Collecting...' : 'Refresh'}
          </Button>
          <Button onClick={collectBaseline} variant="outline" size="sm">
            Set Baseline
          </Button>
          <Button onClick={resetData} variant="destructive" size="sm">
            Reset
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="flows">User Flows</TabsTrigger>
          <TabsTrigger value="regressions">Regressions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Render Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.renderTime.toFixed(2)}ms
              </div>
              <Badge 
                variant={getPerformanceStatus(metrics.renderTime, 16) === 'good' ? 'default' : 'destructive'}
                className="mt-1"
              >
                {getPerformanceStatus(metrics.renderTime, 16) === 'good' ? 'Good' : 'Slow'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMemory(metrics.memoryUsage)}
              </div>
              <Badge 
                variant={getPerformanceStatus(metrics.memoryUsage, 50 * 1024 * 1024) === 'good' ? 'default' : 'destructive'}
                className="mt-1"
              >
                {getPerformanceStatus(metrics.memoryUsage, 50 * 1024 * 1024) === 'good' ? 'Good' : 'High'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.cacheHitRate.toFixed(1)}%
              </div>
              <Badge 
                variant={getPerformanceStatus(metrics.cacheHitRate, 80, false) === 'good' ? 'default' : 'destructive'}
                className="mt-1"
              >
                {getPerformanceStatus(metrics.cacheHitRate, 80, false) === 'good' ? 'Good' : 'Low'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Storage Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.storageOperations}
              </div>
              <Badge variant="outline" className="mt-1">
                Total
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Render Time</h4>
                <div className="text-sm space-y-1">
                  <div>Baseline: {report.baseline.metrics.renderTime.toFixed(2)}ms</div>
                  <div>Current: {report.current.renderTime.toFixed(2)}ms</div>
                  <div className={report.improvements.renderTime > 0 ? 'text-green-600' : 'text-red-600'}>
                    {report.improvements.renderTime > 0 ? 'Improved' : 'Regressed'} by {Math.abs(report.improvements.renderTime).toFixed(2)}ms
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Memory Usage</h4>
                <div className="text-sm space-y-1">
                  <div>Baseline: {formatMemory(report.baseline.metrics.memoryUsage)}</div>
                  <div>Current: {formatMemory(report.current.memoryUsage)}</div>
                  <div className={report.improvements.memoryUsage > 0 ? 'text-green-600' : 'text-red-600'}>
                    {report.improvements.memoryUsage > 0 ? 'Improved' : 'Regressed'} by {formatMemory(Math.abs(report.improvements.memoryUsage))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Cache Hit Rate</h4>
                <div className="text-sm space-y-1">
                  <div>Baseline: {report.baseline.metrics.cacheHitRate.toFixed(1)}%</div>
                  <div>Current: {report.current.cacheHitRate.toFixed(1)}%</div>
                  <div className={report.improvements.cacheHitRate > 0 ? 'text-green-600' : 'text-red-600'}>
                    {report.improvements.cacheHitRate > 0 ? 'Improved' : 'Regressed'} by {Math.abs(report.improvements.cacheHitRate).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            
            {report.regressions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-red-600">Performance Regressions</h4>
                <ul className="text-sm space-y-1">
                  {report.regressions.map((regression, index) => (
                    <li key={index} className="text-red-600">• {regression}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {bottlenecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Bottlenecks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {bottlenecks.map((bottleneck, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <Badge variant="destructive">!</Badge>
                  <span className="text-sm">{bottleneck}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!metrics && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No performance data available. Click "Refresh" to collect metrics.</p>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Validation</CardTitle>
            </CardHeader>
            <CardContent>
              {validationReport ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={validationReport.overallSuccess ? 'default' : 'destructive'}
                      className="text-sm"
                    >
                      {validationReport.overallSuccess ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {validationReport.achievedTargets}/{validationReport.totalTargets} targets achieved
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-2">Render Time</h4>
                      <div className="text-2xl font-bold">
                        {validationReport.summary.renderTimeImprovement > 0 ? '+' : ''}
                        {validationReport.summary.renderTimeImprovement.toFixed(1)}ms
                      </div>
                      <Badge variant={validationReport.summary.renderTimeImprovement > 0 ? 'default' : 'destructive'} className="text-xs">
                        {validationReport.summary.renderTimeImprovement > 0 ? 'Improved' : 'Regressed'}
                      </Badge>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-2">Memory Usage</h4>
                      <div className="text-2xl font-bold">
                        {validationReport.summary.memoryUsageImprovement > 0 ? '+' : ''}
                        {(validationReport.summary.memoryUsageImprovement / 1024 / 1024).toFixed(1)}MB
                      </div>
                      <Badge variant={validationReport.summary.memoryUsageImprovement > 0 ? 'default' : 'destructive'} className="text-xs">
                        {validationReport.summary.memoryUsageImprovement > 0 ? 'Reduced' : 'Increased'}
                      </Badge>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <h4 className="font-semibold mb-2">Bundle Size</h4>
                      <div className="text-2xl font-bold">
                        {validationReport.summary.bundleSizeReduction > 0 ? '-' : '+'}
                        {Math.abs(validationReport.summary.bundleSizeReduction).toFixed(1)}%
                      </div>
                      <Badge variant={validationReport.summary.bundleSizeReduction > 0 ? 'default' : 'destructive'} className="text-xs">
                        {validationReport.summary.bundleSizeReduction > 0 ? 'Reduced' : 'Increased'}
                      </Badge>
                    </div>
                  </div>
                  
                  {validationReport.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="text-sm space-y-1">
                        {validationReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No validation data available.</p>
                  <Button onClick={() => performanceValidation.validateOptimizations()} className="mt-2">
                    Run Validation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {bundleAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Bundle Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(bundleAnalysis.totalSize / 1024).toFixed(0)}KB</div>
                    <div className="text-sm text-muted-foreground">Total Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{bundleAnalysis.bundleCount}</div>
                    <div className="text-sm text-muted-foreground">Total Bundles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{bundleAnalysis.lazyBundleCount}</div>
                    <div className="text-sm text-muted-foreground">Lazy Bundles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{bundleAnalysis.loadingPerformance.initialLoadTime.toFixed(0)}ms</div>
                    <div className="text-sm text-muted-foreground">Load Time</div>
                  </div>
                </div>
                
                {bundleAnalysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Bundle Recommendations</h4>
                    <ul className="text-sm space-y-1">
                      {bundleAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-orange-500">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Flow Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {flowMetrics.length > 0 ? (
                <div className="space-y-4">
                  {flowMetrics.map((flow, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{flow.flowName}</h4>
                        <Badge variant={flow.completionRate >= 90 ? 'default' : 'destructive'}>
                          {flow.completionRate.toFixed(1)}% completion
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Avg Duration:</span>
                          <div className="font-medium">{flow.averageDuration.toFixed(0)}ms</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Flows:</span>
                          <div className="font-medium">{flow.totalFlows}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed:</span>
                          <div className="font-medium text-red-600">{flow.failedFlows}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bottlenecks:</span>
                          <div className="font-medium">{flow.bottleneckSteps.length}</div>
                        </div>
                      </div>
                      {flow.bottleneckSteps.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-muted-foreground">Slow steps:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {flow.bottleneckSteps.map((step, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {step}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No flow data available. User flows will appear here as they are tracked.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regressions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Regressions</CardTitle>
            </CardHeader>
            <CardContent>
              {regressionReport ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={
                        regressionReport.overallStatus === 'good' ? 'default' :
                        regressionReport.overallStatus === 'warning' ? 'secondary' : 'destructive'
                      }
                      className="text-sm"
                    >
                      {regressionReport.overallStatus.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {regressionReport.summary.totalAlerts} alerts detected
                    </span>
                  </div>
                  
                  {regressionReport.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {regressionReport.alerts.map((alert, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge 
                                variant={
                                  alert.severity === 'critical' ? 'destructive' :
                                  alert.severity === 'high' ? 'secondary' : 'outline'
                                }
                                className="text-xs"
                              >
                                {alert.severity}
                              </Badge>
                              <span className="ml-2 font-medium">{alert.metric}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{alert.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Current: {alert.currentValue.toFixed(2)} | 
                            Baseline: {alert.baselineValue.toFixed(2)} | 
                            Regression: {alert.regression.toFixed(2)}
                          </div>
                          {alert.suggestions.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium">Suggestions:</span>
                              <ul className="text-xs text-muted-foreground mt-1 ml-4">
                                {alert.suggestions.map((suggestion, i) => (
                                  <li key={i} className="list-disc">{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-green-600 text-center py-4">
                      ✅ No performance regressions detected
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No regression data available. Click "Refresh" to check for regressions.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {/* Existing detailed metrics content */}
          {report && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Render Time</h4>
                    <div className="text-sm space-y-1">
                      <div>Baseline: {report.baseline.metrics.renderTime.toFixed(2)}ms</div>
                      <div>Current: {report.current.renderTime.toFixed(2)}ms</div>
                      <div className={report.improvements.renderTime > 0 ? 'text-green-600' : 'text-red-600'}>
                        {report.improvements.renderTime > 0 ? 'Improved' : 'Regressed'} by {Math.abs(report.improvements.renderTime).toFixed(2)}ms
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Memory Usage</h4>
                    <div className="text-sm space-y-1">
                      <div>Baseline: {formatMemory(report.baseline.metrics.memoryUsage)}</div>
                      <div>Current: {formatMemory(report.current.memoryUsage)}</div>
                      <div className={report.improvements.memoryUsage > 0 ? 'text-green-600' : 'text-red-600'}>
                        {report.improvements.memoryUsage > 0 ? 'Improved' : 'Regressed'} by {formatMemory(Math.abs(report.improvements.memoryUsage))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Cache Hit Rate</h4>
                    <div className="text-sm space-y-1">
                      <div>Baseline: {report.baseline.metrics.cacheHitRate.toFixed(1)}%</div>
                      <div>Current: {report.current.cacheHitRate.toFixed(1)}%</div>
                      <div className={report.improvements.cacheHitRate > 0 ? 'text-green-600' : 'text-red-600'}>
                        {report.improvements.cacheHitRate > 0 ? 'Improved' : 'Regressed'} by {Math.abs(report.improvements.cacheHitRate).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                {report.regressions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-red-600">Performance Regressions</h4>
                    <ul className="text-sm space-y-1">
                      {report.regressions.map((regression, index) => (
                        <li key={index} className="text-red-600">• {regression}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {bottlenecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Bottlenecks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {bottlenecks.map((bottleneck, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Badge variant="destructive">!</Badge>
                      <span className="text-sm">{bottleneck}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}