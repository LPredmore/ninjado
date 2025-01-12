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
                  However, if you go over on your time, then it will deduct time from your Time Saved. For example,
                  if you have a 10-minute task and complete it in 12 minutes, you will lose 2 minutes.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-ninja-text">Focus Tasks</h4>
                <p className="text-gray-600">
                  Focus Tasks are tasks that you don't want to be rushed on, but you also want to make sure you don't get distracted.
                  You don't get any time added bonus for completing these tasks early. But it will deduct from your time if you go over.
                </p>
                <p className="text-gray-600 mt-2">
                  Example: Your child needs to do a mindfulness activity, such as deep breathing, to calm themselves down in the middle
                  of their routine. They need to do 10 deep slow breaths. You don't want them to feel rushed. So you create a Focus Task
                  for Deep Breathing. I decide that it should take them no more than a minute and a half to get that done, and I put 3
                  minutes as the time. This way, they have plenty of time so that they don't feel rushed. But if they get distracted and
                  go start playing, then they will start losing time due to the distraction.
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