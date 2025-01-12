import React from 'react';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const HowToUse = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Layout onSignOut={handleSignOut} totalTimeSaved={0}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ninja-text">How to Use NinjaDo</h2>
        
        <Card className="p-6 space-y-6">
          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-ninja-text">Getting Started</h3>
            <p className="text-gray-600">
              NinjaDo helps you create and manage your daily routines efficiently. Here's how to get started:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-4">
              <li>Create a new routine from the Routines page</li>
              <li>Add tasks to your routine</li>
              <li>Start the routine when you're ready</li>
              <li>Complete tasks to earn time savings</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-ninja-text">Types of Tasks</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-ninja-text">Regular Tasks</h4>
                <p className="text-gray-600">
                  Regular tasks are standard tasks where any time saved from completing them early counts as time earned.
                  For example, if you have a 10-minute task and complete it in 8 minutes, you earn 2 minutes.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-ninja-text">Focus Tasks</h4>
                <p className="text-gray-600">
                  Focus tasks are designed for activities that require your full attention for a specific duration.
                  Going over time will subtract from your saved time, while completing them exactly on time is ideal.
                  These are perfect for study sessions or focused work periods.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-ninja-text">Managing Time</h3>
            <p className="text-gray-600">
              As you complete tasks faster than their allocated time, you'll earn time savings.
              This saved time can be used to redeem rewards you create in the Rewards section.
              Think of it as a way to incentivize efficient task completion!
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-ninja-text">Tips for Success</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Start with realistic time estimates for your tasks</li>
              <li>Use focus tasks for activities that need dedicated attention</li>
              <li>Create meaningful rewards to stay motivated</li>
              <li>Review and adjust your routines regularly</li>
            </ul>
          </section>
        </Card>
      </div>
    </Layout>
  );
};

export default HowToUse;