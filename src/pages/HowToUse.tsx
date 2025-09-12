import { useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Clock, 
  TrendingUp, 
  Gift, 
  Zap, 
  Brain, 
  Play, 
  CheckCircle,
  Flame
} from "lucide-react";

const HowToUse = () => {
  const handleSignOut = async () => {
    // This will be handled by the parent component
  };

  return (
    <SidebarLayout onSignOut={handleSignOut} totalTimeSaved={0}>
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-lg text-muted-foreground mb-8">
            Master the art of routine optimization and time crystal mastery
          </p>
        </div>

        <div className="space-y-6">
          {/* Getting Started */}
          <Card className="bg-card/60 backdrop-blur border shadow-fun">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="w-5 h-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <Target className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Create Your First Routine</h4>
                    <p className="text-sm text-muted-foreground">Go to Routines and create a routine like 'Morning Routine' or 'Study Session'</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Add Tasks</h4>
                    <p className="text-sm text-muted-foreground">Break down your routine into specific tasks with estimated durations</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <Flame className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Set Task Types</h4>
                    <p className="text-sm text-muted-foreground">Choose between Speed Tasks (earn crystals) and Focus Tasks (take your time)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Types Explained */}
          <Card className="bg-card/60 backdrop-blur border shadow-fun">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Flame className="w-5 h-5" />
                Task Types Explained
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">Speed Tasks</h4>
                    <Zap className="w-4 h-4 text-orange-500" />
                    <Badge variant="secondary" className="text-xs">Earn Crystals</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Finish early to earn time crystals. Going overtime loses crystals. Perfect for routine tasks.</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">Focus Tasks</h4>
                    <Brain className="w-4 h-4 text-orange-500" />
                    <Badge variant="secondary" className="text-xs">No Rush</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Take your time, no rush bonus. Only penalized for going overtime. Good for creative work.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executing Routines */}
          <Card className="bg-card/60 backdrop-blur border shadow-fun">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Play className="w-5 h-5" />
                Executing Routines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <Play className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Select & Start</h4>
                    <p className="text-sm text-muted-foreground">Choose your routine from the dropdown and hit 'Begin Training'</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <Clock className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Focus on Current Task</h4>
                    <p className="text-sm text-muted-foreground">Work on the highlighted active task. Watch the timer and progress bar.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Complete Tasks</h4>
                    <p className="text-sm text-muted-foreground">Hit 'Complete Task' when finished or let the timer run to track overtime</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Crystal System */}
          <Card className="bg-card/60 backdrop-blur border shadow-fun">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-5 h-5 text-primary">💎</div>
                Time Crystal System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Earn Crystals</h4>
                    <p className="text-sm text-muted-foreground">Complete Speed Tasks early to bank extra time for later use</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <Clock className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Lose Crystals</h4>
                    <p className="text-sm text-muted-foreground">Going overtime on any task type costs you crystals as a motivation penalty</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <Gift className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-semibold mb-1">Spend Wisely</h4>
                    <p className="text-sm text-muted-foreground">Use earned crystals on rewards you create - breaks, treats, entertainment time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pro Ninja Tips */}
          <Card className="bg-card/60 backdrop-blur border shadow-fun">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-5 h-5 text-primary">🥷</div>
                Pro Ninja Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-semibold mb-1">Start Small</h4>
                      <p className="text-sm text-muted-foreground">Begin with 3-5 task routines to build the habit</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-semibold mb-1">Be Realistic</h4>
                      <p className="text-sm text-muted-foreground">Set achievable time estimates. You can always adjust later</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Flame className="w-5 h-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-semibold mb-1">Use Both Task Types</h4>
                      <p className="text-sm text-muted-foreground">Mix Speed Tasks for efficiency with Focus Tasks for quality work</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Gift className="w-5 h-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-semibold mb-1">Create Motivating Rewards</h4>
                      <p className="text-sm text-muted-foreground">Set up rewards you actually want to earn crystals for</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card className="bg-card/60 backdrop-blur border shadow-fun">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center">Privacy & Your Data</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">Learn about how we protect your privacy and handle your training data</p>
              <Button variant="default" size="lg" className="gradient-fun text-white font-semibold">
                <Target className="w-4 h-4 mr-2" />
                Privacy & Data Policy
              </Button>
            </CardContent>
          </Card>

          {/* Ready to Begin */}
          <Card className="bg-card/60 backdrop-blur border shadow-fun">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-center">Ready to Begin Your Training?</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">Start with a simple morning or evening routine and work your way up to mastery!</p>
              <Button variant="fun" size="lg" className="animate-bounce-in">
                <Target className="w-4 h-4 mr-2" />
                Create First Routine
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default HowToUse;